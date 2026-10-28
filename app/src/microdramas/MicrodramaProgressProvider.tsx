import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { getMicrodramaProgress, getMicrodramaProgressBatch, saveMicrodramaProgress } from './api';
import { clearMicrodramaProgress, readMicrodramaProgress, writeMicrodramaProgress } from './progressStorage';
import type { MicrodramaEpisode, MicrodramaProgressSummary } from './types';

type SaveEvent = { episode: MicrodramaEpisode; episodeId: string; positionMs: number; event: 'position' | 'ended' };
type ProgressContextValue = {
  summaries: Record<string, MicrodramaProgressSummary>;
  loadBatch: (seriesIds: string[]) => Promise<void>;
  loadProgress: (seriesId: string) => Promise<MicrodramaProgressSummary | undefined>;
  saveProgress: (seriesId: string, episode: MicrodramaEpisode, positionMs: number, event?: 'position' | 'ended') => Promise<void>;
};
const ProgressContext = createContext<ProgressContextValue | null>(null);
const ANONYMOUS = 'anonymous';

export function MicrodramaProgressProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user } = useAuth();
  const owner = isSignedIn ? (user?.email?.trim().toLowerCase() || user?.cognitoSub || 'unknown') : ANONYMOUS;
  const [summaries, setSummaries] = useState<Record<string, MicrodramaProgressSummary>>({});
  const summariesRef = useRef(summaries);
  const revisions = useRef<Record<string, number>>({});
  const pending = useRef<Record<string, SaveEvent>>({});
  const running = useRef(new Set<string>());
  const generation = useRef(0);

  useEffect(() => { summariesRef.current = summaries; }, [summaries]);

  const storeSummary = useCallback((seriesId: string, summary: MicrodramaProgressSummary) => {
    const next = { ...summariesRef.current, [seriesId]: summary };
    summariesRef.current = next;
    setSummaries(next);
    void writeMicrodramaProgress(owner, next).catch(() => undefined);
  }, [owner]);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    revisions.current = {};
    pending.current = {};
    running.current.clear();
    void Promise.all([readMicrodramaProgress(owner), isSignedIn ? readMicrodramaProgress(ANONYMOUS) : Promise.resolve({ summaries: {} as Record<string, MicrodramaProgressSummary>, updatedAt: '' })]).then(([accountLocal, anonymousLocal]) => {
      if (generation.current !== currentGeneration) return;
      const localSummaries: Record<string, MicrodramaProgressSummary> = { ...anonymousLocal.summaries, ...accountLocal.summaries };
      summariesRef.current = localSummaries;
      setSummaries(localSummaries);
      for (const [seriesId, summary] of Object.entries(localSummaries)) revisions.current[seriesId] = summary.revision;
      if (!isSignedIn) return;
      const ids = Object.keys(localSummaries);
      void (async () => {
        const remote: Record<string, MicrodramaProgressSummary> = {};
        for (let i = 0; i < ids.length; i += 20) {
          const response = await getMicrodramaProgressBatch(ids.slice(i, i + 20));
          for (const summary of response.items || []) remote[summary.seriesId] = summary;
        }
        if (generation.current !== currentGeneration) return;
        const merged: Record<string, MicrodramaProgressSummary> = { ...localSummaries, ...remote };
        let anonymousImported = true;
        for (const [seriesId, summary] of Object.entries(localSummaries)) {
          if (remote[seriesId]) continue;
          try {
            const uploaded = await saveMicrodramaProgress(seriesId, {
              episodeId: summary.resumeEpisodeId,
              positionMs: summary.resumePositionMs,
              event: 'position',
              expectedRevision: 0,
            });
            merged[seriesId] = uploaded.summary;
          } catch { anonymousImported = false; }
        }
        if (generation.current === currentGeneration) {
          summariesRef.current = merged;
          setSummaries(merged);
          for (const [seriesId, summary] of Object.entries(merged)) revisions.current[seriesId] = summary.revision;
          void writeMicrodramaProgress(owner, merged).catch(() => undefined);
          if (anonymousImported && Object.keys(anonymousLocal.summaries).length) {
            void clearMicrodramaProgress(ANONYMOUS).catch(() => undefined);
          }
        }
      })().catch(() => undefined);
    });
  }, [isSignedIn, owner]);

  const loadProgress = useCallback(async (seriesId: string) => {
    if (isSignedIn) {
      try {
        const response = await getMicrodramaProgress(seriesId);
        if (response.summary) {
          revisions.current[seriesId] = response.summary.revision;
          storeSummary(seriesId, response.summary);
          return response.summary;
        }
        revisions.current[seriesId] = 0;
      } catch {}
    }
    return summariesRef.current[seriesId];
  }, [isSignedIn, storeSummary]);

  const loadBatch = useCallback(async (seriesIds: string[]) => {
    if (!isSignedIn || !seriesIds.length) return;
    for (let i = 0; i < seriesIds.length; i += 20) {
      try {
        const response = await getMicrodramaProgressBatch(seriesIds.slice(i, i + 20));
        for (const summary of response.items || []) {
          revisions.current[summary.seriesId] = summary.revision;
          storeSummary(summary.seriesId, summary);
        }
      } catch { return; }
    }
  }, [isSignedIn, storeSummary]);

  const saveProgress = useCallback(async (
    seriesId: string,
    episode: MicrodramaEpisode,
    positionMs: number,
    event: 'position' | 'ended' = 'position',
  ) => {
    const position = Math.max(0, Math.min(Math.floor(positionMs), episode.durationMs));
    const current = summariesRef.current[seriesId];
    const optimistic: MicrodramaProgressSummary = {
      seriesId,
      resumeEpisodeId: event === 'ended' ? episode.episodeId : episode.episodeId,
      resumePositionMs: event === 'ended' ? episode.durationMs : position,
      revision: current?.revision || 0,
      updatedAt: new Date().toISOString(),
      ...(current?.completedAt ? { completedAt: current.completedAt } : {}),
    };
    storeSummary(seriesId, optimistic);
    pending.current[seriesId] = { episode, episodeId: episode.episodeId, positionMs: position, event };
    if (!isSignedIn || running.current.has(seriesId)) return;
    running.current.add(seriesId);
    const startGeneration = generation.current;
    try {
      while (pending.current[seriesId] && generation.current === startGeneration) {
        const sample = pending.current[seriesId];
        delete pending.current[seriesId];
        try {
          const response = await saveMicrodramaProgress(seriesId, {
            episodeId: sample.episodeId,
            positionMs: sample.positionMs,
            event: sample.event,
            expectedRevision: revisions.current[seriesId] || 0,
          });
          if (generation.current !== startGeneration) return;
          revisions.current[seriesId] = response.summary.revision;
          storeSummary(seriesId, response.summary);
        } catch (error: any) {
          if (error?.status === 409) {
            const latest = await getMicrodramaProgress(seriesId).catch(() => undefined);
            if (latest?.summary) {
              revisions.current[seriesId] = latest.summary.revision;
              storeSummary(seriesId, latest.summary);
            }
            delete pending.current[seriesId];
            break;
          }
          pending.current[seriesId] = sample;
          break;
        }
      }
    } finally {
      running.current.delete(seriesId);
    }
  }, [isSignedIn, storeSummary]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        void writeMicrodramaProgress(owner, summariesRef.current).catch(() => undefined);
      } else if (isSignedIn) {
        for (const [seriesId, sample] of Object.entries(pending.current)) {
          void saveProgress(seriesId, sample.episode, sample.positionMs, sample.event);
        }
      }
    });
    return () => subscription.remove();
  }, [isSignedIn, owner, saveProgress]);

  const value = useMemo(() => ({ summaries, loadProgress, loadBatch, saveProgress }), [summaries, loadProgress, loadBatch, saveProgress]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useMicrodramaProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useMicrodramaProgress must be used inside MicrodramaProgressProvider');
  return value;
}
