import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { getMicrodramaProgress, getMicrodramaProgressBatch, saveMicrodramaProgress } from './api';
import { clearMicrodramaProgress, readMicrodramaProgress, writeMicrodramaProgress } from './progressStorage';
import type { MicrodramaEpisode, MicrodramaProgressSummary } from './types';

type SaveEvent = { episode: MicrodramaEpisode; episodeId: string; positionMs: number; event: 'position' | 'watched' | 'ended' };
type ProgressContextValue = {
  summaries: Record<string, MicrodramaProgressSummary>;
  watchedEpisodes: Record<string, Record<string, boolean>>;
  loadBatch: (seriesIds: string[]) => Promise<void>;
  loadProgress: (seriesId: string) => Promise<MicrodramaProgressSummary | undefined>;
  saveProgress: (seriesId: string, episode: MicrodramaEpisode, positionMs: number, event?: 'position' | 'watched' | 'ended') => Promise<void>;
};
const ProgressContext = createContext<ProgressContextValue | null>(null);
const ANONYMOUS = 'anonymous';

export function MicrodramaProgressProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user } = useAuth();
  const owner = isSignedIn ? (user?.email?.trim().toLowerCase() || user?.cognitoSub || 'unknown') : ANONYMOUS;
  const [summaries, setSummaries] = useState<Record<string, MicrodramaProgressSummary>>({});
  const summariesRef = useRef(summaries);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Record<string, Record<string, boolean>>>({});
  const watchedRef = useRef(watchedEpisodes);
  const revisions = useRef<Record<string, number>>({});
  const pending = useRef<Record<string, SaveEvent[]>>({});
  const running = useRef(new Set<string>());
  const generation = useRef(0);

  useEffect(() => { summariesRef.current = summaries; }, [summaries]);

  const storeSummary = useCallback((seriesId: string, summary: MicrodramaProgressSummary) => {
    const next = { ...summariesRef.current, [seriesId]: summary };
    summariesRef.current = next;
    setSummaries(next);
    void writeMicrodramaProgress(owner, next, watchedRef.current).catch(() => undefined);
  }, [owner]);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    revisions.current = {};
    pending.current = {};
    running.current.clear();
    void Promise.all([readMicrodramaProgress(owner), isSignedIn ? readMicrodramaProgress(ANONYMOUS) : Promise.resolve({ summaries: {} as Record<string, MicrodramaProgressSummary>, watchedEpisodes: {} as Record<string, Record<string, boolean>>, updatedAt: '' })]).then(([accountLocal, anonymousLocal]) => {
      if (generation.current !== currentGeneration) return;
      const localSummaries: Record<string, MicrodramaProgressSummary> = { ...anonymousLocal.summaries, ...accountLocal.summaries };
      const localWatched = { ...anonymousLocal.watchedEpisodes };
      for (const [seriesId, episodes] of Object.entries(accountLocal.watchedEpisodes || {})) {
        localWatched[seriesId] = { ...localWatched[seriesId], ...episodes };
      }
      watchedRef.current = localWatched;
      setWatchedEpisodes(localWatched);
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
          void writeMicrodramaProgress(owner, merged, watchedRef.current).catch(() => undefined);
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
        const completed = Object.fromEntries((response.episodes || []).filter(episode => episode.completed).map(episode => [episode.episodeId, true]));
        if (Object.keys(completed).length) {
          const next = { ...watchedRef.current, [seriesId]: { ...watchedRef.current[seriesId], ...completed } };
          watchedRef.current = next;
          setWatchedEpisodes(next);
          void writeMicrodramaProgress(owner, summariesRef.current, next).catch(() => undefined);
        }
        if (response.summary) {
          revisions.current[seriesId] = response.summary.revision;
          storeSummary(seriesId, response.summary);
          return response.summary;
        }
        revisions.current[seriesId] = 0;
      } catch {}
    }
    return summariesRef.current[seriesId];
  }, [isSignedIn, owner, storeSummary]);

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
    event: 'position' | 'watched' | 'ended' = 'position',
  ) => {
    const position = Math.max(0, Math.min(Math.floor(positionMs), episode.durationMs));
    if (event === 'watched') {
      const next = { ...watchedRef.current, [seriesId]: { ...watchedRef.current[seriesId], [episode.episodeId]: true } };
      watchedRef.current = next;
      setWatchedEpisodes(next);
    }
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
    const queue = pending.current[seriesId] || [];
    const sample: SaveEvent = { episode, episodeId: episode.episodeId, positionMs: position, event };
    if (event === 'position' && queue.length && queue[queue.length - 1].event === 'position') queue[queue.length - 1] = sample;
    else queue.push(sample);
    pending.current[seriesId] = queue;
    if (!isSignedIn || running.current.has(seriesId)) return;
    running.current.add(seriesId);
    const startGeneration = generation.current;
    try {
      while (pending.current[seriesId]?.length && generation.current === startGeneration) {
        const sample = pending.current[seriesId].shift()!;
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
          pending.current[seriesId].unshift(sample);
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
        void writeMicrodramaProgress(owner, summariesRef.current, watchedRef.current).catch(() => undefined);
      } else if (isSignedIn) {
        for (const [seriesId, queue] of Object.entries(pending.current)) {
          const sample = queue[queue.length - 1];
          if (sample) void saveProgress(seriesId, sample.episode, sample.positionMs, sample.event);
        }
      }
    });
    return () => subscription.remove();
  }, [isSignedIn, owner, saveProgress]);

  const value = useMemo(() => ({ summaries, watchedEpisodes, loadProgress, loadBatch, saveProgress }), [summaries, watchedEpisodes, loadProgress, loadBatch, saveProgress]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useMicrodramaProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useMicrodramaProgress must be used inside MicrodramaProgressProvider');
  return value;
}
