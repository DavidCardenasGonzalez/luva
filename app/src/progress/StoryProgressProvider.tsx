import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthProvider';
import { fetchUserProgress, mergeUserProgress } from './remote';
import {
  areStoryProgressDocumentsEqual,
  buildStoryProgressState,
  emptyStoryProgressDocument,
  mergeStoryProgressDocuments,
  parseStoredStoryProgressDocument,
} from './sync';
import type {
  StoryActiveMission,
  StoryProgressDocument,
  StoryProgressEntry,
  StoryProgressState,
  StoryProgressItem,
  UserProgressRecord,
} from './types';

export type { StoryProgressEntry, StoryProgressState } from './types';

type StoryProgressContextValue = {
  loading: boolean;
  progress: StoryProgressState;
  activeMission: StoryActiveMission | null;
  isMissionCompleted: (storyId?: string, missionId?: string) => boolean;
  completedCountFor: (storyId?: string) => number;
  storyCompleted: (storyId?: string) => boolean;
  markMissionCompleted: (storyId: string, missionId: string, storyCompleted?: boolean) => Promise<void>;
  saveActiveMission: (mission: StoryActiveMission) => Promise<void>;
  clearActiveMission: (storyId?: string, missionId?: string) => Promise<void>;
  resetStory: (storyId: string) => Promise<void>;
  resetAll: () => Promise<void>;
};

const STORAGE_KEY = '@luva/story-progress';

const StoryProgressContext = createContext<StoryProgressContextValue | undefined>(undefined);

export function StoryProgressProvider({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, isSignedIn, user } = useAuth();
  const [document, setDocument] = useState<StoryProgressDocument>(() => emptyStoryProgressDocument());
  const [loading, setLoading] = useState(true);
  const documentRef = useRef<StoryProgressDocument>(emptyStoryProgressDocument());
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const syncedUserRef = useRef<string | undefined>(undefined);

  const applyDocument = useCallback((next: StoryProgressDocument) => {
    documentRef.current = next;
    setDocument(next);
  }, []);

  const persist = useCallback(async (next: StoryProgressDocument) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err: any) {
      console.warn('[StoryProgress] No se pudo guardar el progreso:', err?.message || err);
    }
  }, []);

  const mergeRemoteStoriesIntoLocal = useCallback(
    async (remoteStories: unknown) => {
      const merged = mergeStoryProgressDocuments(documentRef.current, remoteStories);
      if (areStoryProgressDocumentsEqual(merged, documentRef.current)) {
        return merged;
      }
      applyDocument(merged);
      await persist(merged);
      return merged;
    },
    [applyDocument, persist]
  );

  const enqueueRemoteMerge = useCallback(
    (progress: Partial<UserProgressRecord>) => {
      if (!isSignedIn || !user?.email) return;
      syncQueueRef.current = syncQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const remote = await mergeUserProgress(progress);
            await mergeRemoteStoriesIntoLocal(remote.stories);
          } catch (err: any) {
            console.warn('[StoryProgress] No se pudo sincronizar el progreso:', err?.message || err);
          }
        });
    },
    [isSignedIn, mergeRemoteStoriesIntoLocal, user?.email]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : undefined;
        const next = parseStoredStoryProgressDocument(parsed);
        if (!mounted) return;
        applyDocument(next);
      } catch (err: any) {
        console.warn('[StoryProgress] No se pudo cargar el progreso:', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applyDocument]);

  useEffect(() => {
    if (!isSignedIn) {
      syncedUserRef.current = undefined;
      return;
    }
    if (loading || authLoading || !user?.email || syncedUserRef.current === user.email) {
      return;
    }

    syncedUserRef.current = user.email;
    let cancelled = false;

    (async () => {
      try {
        const remote = await fetchUserProgress();
        if (cancelled) return;

        const localStories = documentRef.current;
        const merged = mergeStoryProgressDocuments(localStories, remote.stories);

        if (!areStoryProgressDocumentsEqual(merged, localStories)) {
          applyDocument(merged);
          await persist(merged);
        }

        if (!areStoryProgressDocumentsEqual(merged, remote.stories)) {
          enqueueRemoteMerge({ stories: merged });
        }
      } catch (err: any) {
        console.warn('[StoryProgress] No se pudo cargar el progreso remoto:', err?.message || err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, applyDocument, enqueueRemoteMerge, isSignedIn, loading, persist, user?.email]);

  const markMissionCompleted = useCallback(
    async (storyId: string, missionId: string, storyCompleted?: boolean) => {
      const storyKey = String(storyId || '').trim();
      const missionKey = String(missionId || '').trim();
      if (!storyKey || !missionKey) return;

      const previousItem = documentRef.current.items[storyKey];
      const alreadyCompleted = Boolean(previousItem?.completedMissions?.[missionKey]);
      const alreadyStoryCompleted = storyCompleted ? Boolean(previousItem?.storyCompletedAt) : true;
      if (alreadyCompleted && alreadyStoryCompleted) {
        return;
      }

      const now = new Date().toISOString();
      const nextItem: StoryProgressItem = {
        updatedAt: now,
        completedMissions: {
          ...(previousItem?.completedMissions || {}),
          [missionKey]: previousItem?.completedMissions?.[missionKey] || now,
        },
        ...(storyCompleted
          ? { storyCompletedAt: previousItem?.storyCompletedAt || now }
          : previousItem?.storyCompletedAt
          ? { storyCompletedAt: previousItem.storyCompletedAt }
          : {}),
      };

      const next: StoryProgressDocument = {
        ...documentRef.current,
        updatedAt: now,
        items: {
          ...documentRef.current.items,
          [storyKey]: nextItem,
        },
      };

      applyDocument(next);
      await persist(next);

      if (isSignedIn && user?.email) {
        enqueueRemoteMerge({
          stories: {
            updatedAt: now,
            items: {
              [storyKey]: nextItem,
            },
          },
        });
      }
    },
    [applyDocument, enqueueRemoteMerge, isSignedIn, persist, user?.email]
  );

  const resetStory = useCallback(
    async (storyId: string) => {
      const storyKey = String(storyId || '').trim();
      if (!storyKey) return;

      const deletedAt = new Date().toISOString();
      const nextItem: StoryProgressItem = {
        updatedAt: deletedAt,
        deletedAt,
        completedMissions: {},
      };
      const next: StoryProgressDocument = {
        ...documentRef.current,
        updatedAt: deletedAt,
        items: {
          ...documentRef.current.items,
          [storyKey]: nextItem,
        },
      };

      applyDocument(next);
      await persist(next);

      if (isSignedIn && user?.email) {
        enqueueRemoteMerge({
          stories: {
            updatedAt: deletedAt,
            items: {
              [storyKey]: nextItem,
            },
          },
        });
      }
    },
    [applyDocument, enqueueRemoteMerge, isSignedIn, persist, user?.email]
  );

  const resetAll = useCallback(async () => {
    const resetAt = new Date().toISOString();
    const next: StoryProgressDocument = {
      updatedAt: resetAt,
      resetAt,
      items: {},
    };

    applyDocument(next);
    await persist(next);

    if (isSignedIn && user?.email) {
      enqueueRemoteMerge({ stories: next });
    }
  }, [applyDocument, enqueueRemoteMerge, isSignedIn, persist, user?.email]);

  const progress = useMemo(() => buildStoryProgressState(document), [document]);
  const activeMission = useMemo(() => {
    let latest: StoryActiveMission | null = null;
    for (const item of Object.values(document.items)) {
      const candidate = item.activeMission;
      if (!candidate) {
        continue;
      }
      if (!latest || candidate.updatedAt.localeCompare(latest.updatedAt) > 0) {
        latest = candidate;
      }
    }
    return latest;
  }, [document]);

  const saveActiveMission = useCallback(
    async (mission: StoryActiveMission) => {
      const storyKey = String(mission.storyId || '').trim();
      const missionKey = String(mission.missionId || '').trim();
      if (!storyKey || !missionKey) {
        return;
      }

      const nextItems: Record<string, StoryProgressItem> = {};
      let changed = false;

      for (const [existingStoryId, item] of Object.entries(documentRef.current.items)) {
        if (!item.activeMission) {
          nextItems[existingStoryId] = item;
          continue;
        }

        if (existingStoryId === storyKey && item.activeMission.missionId === missionKey) {
          nextItems[existingStoryId] = item;
          continue;
        }

        changed = true;
        const { activeMission: _activeMission, ...rest } = item;
        if (rest.deletedAt || rest.storyCompletedAt || Object.keys(rest.completedMissions || {}).length) {
          nextItems[existingStoryId] = {
            ...rest,
            updatedAt: maxTimestamp(rest.updatedAt, mission.updatedAt),
          };
        }
      }

      const previousItem = documentRef.current.items[storyKey];
      const hasSameMissionContent = areActiveMissionContentsEqual(previousItem?.activeMission, mission);
      const nextItem: StoryProgressItem = {
        updatedAt: maxTimestamp(previousItem?.updatedAt, hasSameMissionContent ? previousItem?.activeMission?.updatedAt : mission.updatedAt),
        ...(previousItem?.deletedAt ? { deletedAt: previousItem.deletedAt } : {}),
        ...(previousItem?.storyCompletedAt ? { storyCompletedAt: previousItem.storyCompletedAt } : {}),
        completedMissions: {
          ...(previousItem?.completedMissions || {}),
        },
        activeMission: hasSameMissionContent && previousItem?.activeMission
          ? previousItem.activeMission
          : mission,
      };

      if (!previousItem || !hasSameMissionContent) {
        changed = true;
      }

      nextItems[storyKey] = nextItem;

      if (!changed) {
        return;
      }

      const next: StoryProgressDocument = {
        ...documentRef.current,
        updatedAt: maxTimestamp(documentRef.current.updatedAt, mission.updatedAt),
        items: nextItems,
      };

      applyDocument(next);
      await persist(next);
    },
    [applyDocument, persist]
  );

  const clearActiveMission = useCallback(
    async (storyId?: string, missionId?: string) => {
      const storyKey = storyId?.trim();
      const missionKey = missionId?.trim();
      const changedAt = new Date().toISOString();
      const nextItems: Record<string, StoryProgressItem> = {};
      let changed = false;

      for (const [existingStoryId, item] of Object.entries(documentRef.current.items)) {
        const active = item.activeMission;
        const matches =
          !!active &&
          (!storyKey || active.storyId === storyKey) &&
          (!missionKey || active.missionId === missionKey);

        if (!matches) {
          nextItems[existingStoryId] = item;
          continue;
        }

        changed = true;
        const { activeMission: _activeMission, ...rest } = item;
        if (rest.deletedAt || rest.storyCompletedAt || Object.keys(rest.completedMissions || {}).length) {
          nextItems[existingStoryId] = {
            ...rest,
            updatedAt: maxTimestamp(rest.updatedAt, changedAt),
          };
        }
      }

      if (!changed) {
        return;
      }

      const next: StoryProgressDocument = {
        ...documentRef.current,
        updatedAt: maxTimestamp(documentRef.current.updatedAt, changedAt),
        items: nextItems,
      };

      applyDocument(next);
      await persist(next);
    },
    [applyDocument, persist]
  );

  const value = useMemo<StoryProgressContextValue>(() => {
    const isMissionCompleted = (storyId?: string, missionId?: string) => {
      if (!storyId || !missionId) return false;
      return !!progress[storyId]?.completedMissions?.[missionId];
    };

    const completedCountFor = (storyId?: string) => {
      if (!storyId) return 0;
      const entry = progress[storyId];
      return entry ? Object.keys(entry.completedMissions).length : 0;
    };

    const storyCompleted = (storyId?: string) => {
      if (!storyId) return false;
      return !!progress[storyId]?.storyCompleted;
    };

    return {
      loading,
      progress,
      activeMission,
      isMissionCompleted,
      completedCountFor,
      storyCompleted,
      markMissionCompleted,
      saveActiveMission,
      clearActiveMission,
      resetStory,
      resetAll,
    };
  }, [
    activeMission,
    clearActiveMission,
    loading,
    markMissionCompleted,
    progress,
    resetAll,
    resetStory,
    saveActiveMission,
  ]);

  return <StoryProgressContext.Provider value={value}>{children}</StoryProgressContext.Provider>;
}

export function useStoryProgress() {
  const ctx = useContext(StoryProgressContext);
  if (!ctx) {
    throw new Error('useStoryProgress debe usarse dentro de StoryProgressProvider');
  }
  return ctx;
}

function maxTimestamp(...values: Array<string | undefined>) {
  let next = '1970-01-01T00:00:00.000Z';
  for (const value of values) {
    if (!value) {
      continue;
    }
    if (value.localeCompare(next) > 0) {
      next = value;
    }
  }
  return next;
}

function areActiveMissionContentsEqual(
  left?: StoryActiveMission | null,
  right?: StoryActiveMission | null
) {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return JSON.stringify({ ...left, updatedAt: '' }) === JSON.stringify({ ...right, updatedAt: '' });
}
