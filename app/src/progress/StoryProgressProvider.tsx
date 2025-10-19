import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StoryMissionProgress = Record<string, string>;

export type StoryProgressEntry = {
  completedMissions: StoryMissionProgress;
  storyCompleted: boolean;
  storyCompletedAt?: string;
};

export type StoryProgressState = Record<string, StoryProgressEntry>;

type StoryProgressContextValue = {
  loading: boolean;
  progress: StoryProgressState;
  isMissionCompleted: (storyId?: string, missionId?: string) => boolean;
  completedCountFor: (storyId?: string) => number;
  storyCompleted: (storyId?: string) => boolean;
  markMissionCompleted: (storyId: string, missionId: string, storyCompleted?: boolean) => Promise<void>;
  resetStory: (storyId: string) => Promise<void>;
};

const STORAGE_KEY = '@luva/story-progress';

const StoryProgressContext = createContext<StoryProgressContextValue | undefined>(undefined);

export function StoryProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<StoryProgressState>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && mounted) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setProgress(parsed as StoryProgressState);
          }
        }
      } catch (err: any) {
        console.warn('[StoryProgress] No se pudo cargar el progreso:', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: StoryProgressState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err: any) {
      console.warn('[StoryProgress] No se pudo guardar el progreso:', err?.message || err);
    }
  }, []);

  const markMissionCompleted = useCallback(
    async (storyId: string, missionId: string, storyCompleted?: boolean) => {
      let nextState: StoryProgressState = {};
      setProgress((prev) => {
        const entry: StoryProgressEntry = prev[storyId] || {
          completedMissions: {},
          storyCompleted: false,
        };
        const completedMissions = {
          ...entry.completedMissions,
          [missionId]: entry.completedMissions[missionId] || new Date().toISOString(),
        };
        const nextEntry: StoryProgressEntry = {
          completedMissions,
          storyCompleted: storyCompleted ? true : entry.storyCompleted,
          storyCompletedAt: storyCompleted
            ? entry.storyCompletedAt || new Date().toISOString()
            : entry.storyCompletedAt,
        };
        const next = {
          ...prev,
          [storyId]: nextEntry,
        };
        nextState = next;
        return next;
      });
      await persist(nextState);
    },
    [persist]
  );

  const resetStory = useCallback(
    async (storyId: string) => {
      let nextState: StoryProgressState = {};
      setProgress((prev) => {
        if (!prev[storyId]) return prev;
        const next = { ...prev };
        delete next[storyId];
        nextState = next;
        return next;
      });
      await persist(nextState);
    },
    [persist]
  );

  const value = useMemo<StoryProgressContextValue>(() => {
    const isMissionCompleted = (storyId?: string, missionId?: string) => {
      if (!storyId || !missionId) return false;
      const entry = progress[storyId];
      return !!entry?.completedMissions?.[missionId];
    };

    const completedCountFor = (storyId?: string) => {
      if (!storyId) return 0;
      const entry = progress[storyId];
      return entry ? Object.keys(entry.completedMissions).length : 0;
    };

    const storyCompleted = (storyId?: string) => {
      if (!storyId) return false;
      const entry = progress[storyId];
      return !!entry?.storyCompleted;
    };

    return {
      loading,
      progress,
      isMissionCompleted,
      completedCountFor,
      storyCompleted,
      markMissionCompleted,
      resetStory,
    };
  }, [loading, markMissionCompleted, progress, resetStory]);

  return <StoryProgressContext.Provider value={value}>{children}</StoryProgressContext.Provider>;
}

export function useStoryProgress() {
  const ctx = useContext(StoryProgressContext);
  if (!ctx) {
    throw new Error('useStoryProgress debe usarse dentro de StoryProgressProvider');
  }
  return ctx;
}
