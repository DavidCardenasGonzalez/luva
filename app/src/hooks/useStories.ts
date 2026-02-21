import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';
import storiesSource from '../data/stories.json';

export type StoryRequirement = {
  requirementId: string;
  text: string;
};

export type StoryMissionDefinition = {
  missionId: string;
  title: string;
  sceneSummary?: string;
  aiRole: string;
  caracterName?: string;
  caracterPrompt?: string;
  requirements: StoryRequirement[];
};

export type StoryDefinition = {
  storyId: string;
  title: string;
  summary: string;
  level?: string;
  tags?: string[];
  unlockCost?: number;
  missions: StoryMissionDefinition[];
};

export type StorySummary = {
  storyId: string;
  title: string;
  summary: string;
  level?: string;
  tags: string[];
  unlockCost: number;
  locked: boolean;
  missionsCount: number;
};

export type StoryRequirementState = {
  requirementId: string;
  text: string;
  met: boolean;
  feedback?: string;
};

export type StoryMission = {
  missionId: string;
  title: string;
  sceneSummary?: string;
  aiRole: string;
  caracterName?: string;
  caracterPrompt?: string;
  requirements: StoryRequirementState[];
};

export type StoryDetail = {
  storyId: string;
  title: string;
  summary: string;
  level?: string;
  missions: StoryMission[];
};

type StoriesIndexResponse = { version?: string };
type StoriesFullResponse = { version?: string; items?: StoryDefinition[] };
type StoriesCache = { version: string; stories: StoryDefinition[]; cachedAt: string };

const STORAGE_KEY = '@luva/stories-cache';

function sanitizeRequirement(input: any): StoryRequirement | null {
  const requirementId = typeof input?.requirementId === 'string' ? input.requirementId : undefined;
  const text = typeof input?.text === 'string' ? input.text : undefined;
  if (!requirementId || !text) return null;
  return { requirementId, text };
}

function sanitizeMission(input: any): StoryMissionDefinition | null {
  if (!input) return null;
  const missionId = typeof input.missionId === 'string' ? input.missionId : undefined;
  const title = typeof input.title === 'string' ? input.title : undefined;
  const aiRole = typeof input.aiRole === 'string' ? input.aiRole : undefined;
  if (!missionId || !title || !aiRole) return null;
  const requirements = Array.isArray(input.requirements)
    ? input.requirements
        .map((req: any) => sanitizeRequirement(req))
        .filter((req): req is StoryRequirement => !!req)
    : [];
  return {
    missionId,
    title,
    sceneSummary: typeof input.sceneSummary === 'string' ? input.sceneSummary : undefined,
    aiRole,
    caracterName: typeof input.caracterName === 'string' ? input.caracterName : undefined,
    caracterPrompt: typeof input.caracterPrompt === 'string' ? input.caracterPrompt : undefined,
    requirements,
  };
}

function sanitizeStory(input: any): StoryDefinition | null {
  if (!input) return null;
  const storyId = typeof input.storyId === 'string' ? input.storyId : undefined;
  const title = typeof input.title === 'string' ? input.title : undefined;
  const summary = typeof input.summary === 'string' ? input.summary : undefined;
  if (!storyId || !title || !summary) return null;
  const missions = Array.isArray(input.missions)
    ? input.missions
        .map((mission: any) => sanitizeMission(mission))
        .filter((mission): mission is StoryMissionDefinition => !!mission)
    : [];
  if (!missions.length) return null;
  return {
    storyId,
    title,
    summary,
    level: typeof input.level === 'string' ? input.level : undefined,
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
    unlockCost: typeof input.unlockCost === 'number' ? input.unlockCost : undefined,
    missions,
  };
}

function sanitizeStories(list: any): StoryDefinition[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((story: any) => sanitizeStory(story))
    .filter((story): story is StoryDefinition => !!story);
}

function makeLocalVersion(stories: StoryDefinition[]): string {
  const payload = JSON.stringify(
    stories.map((story) => ({
      id: story.storyId,
      missions: (story.missions || []).map((mission) => mission.missionId),
    }))
  );
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `local-${Math.abs(hash)}`;
}

const BUNDLED_STORIES = sanitizeStories(storiesSource as StoryDefinition[]);
const BUNDLED_CACHE: StoriesCache | null = BUNDLED_STORIES.length
  ? { version: makeLocalVersion(BUNDLED_STORIES), stories: BUNDLED_STORIES, cachedAt: new Date(0).toISOString() }
  : null;

let memoryCache: StoriesCache | null = null;
let syncPromise: Promise<StoriesCache | null> | null = null;

async function readCache(): Promise<StoriesCache | null> {
  if (memoryCache) return memoryCache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    // console.log('Cache read:', raw);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const stories = sanitizeStories(parsed?.stories);
    const version = typeof parsed?.version === 'string' ? parsed.version : undefined;
    if (!version || !stories.length) return null;
    const cachedAt = typeof parsed?.cachedAt === 'string' ? parsed.cachedAt : new Date().toISOString();
    memoryCache = { version, stories, cachedAt };
    return memoryCache;
  } catch {
    return null;
  }
}

async function persistCache(cache: StoriesCache) {
  memoryCache = cache;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Non-fatal: keep in-memory cache even if persistence fails
  }
}

async function getLocalStories(): Promise<StoriesCache | null> {
  const cached = await readCache();
  if (cached) return cached;
  if (BUNDLED_CACHE) {
    memoryCache = BUNDLED_CACHE;
    return BUNDLED_CACHE;
  }
  return null;
}

async function fetchFullStories(preferredVersion?: string): Promise<StoriesCache> {
  const res = await api.get<StoriesFullResponse>('/stories/full');
  const stories = sanitizeStories((res as any)?.items);
  if (!stories.length) {
    throw new Error('El backend no devolvió historias.');
  }
  const version = (res as any)?.version || preferredVersion || makeLocalVersion(stories);
  const cache: StoriesCache = { version: String(version), stories, cachedAt: new Date().toISOString() };
  await persistCache(cache);
  return cache;
}

async function syncStories(): Promise<StoriesCache | null> {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    let cache = memoryCache || (await readCache()) || BUNDLED_CACHE;
    try {
      const versionRes = await api.get<StoriesIndexResponse>('/stories');
      const remoteVersion = typeof (versionRes as any)?.version === 'string' ? (versionRes as any).version : undefined;
      const needsRefresh = !cache || (remoteVersion && cache.version !== remoteVersion);
      if (needsRefresh) {
        cache = await fetchFullStories(remoteVersion);
      }
    } catch (err) {
      if (!cache) {
        throw err instanceof Error ? err : new Error('No pudimos cargar las historias.');
      }
    }
    memoryCache = cache;
    return cache;
  })();
  const result = await syncPromise;
  syncPromise = null;
  return result;
}

function storySummaryFromDefinition(story: StoryDefinition): StorySummary {
  return {
    storyId: story.storyId,
    title: story.title,
    summary: story.summary,
    level: story.level,
    tags: story.tags || [],
    unlockCost: story.unlockCost ?? 0,
    locked: false,
    missionsCount: story.missions?.length || 0,
  };
}

function storyDetailFromDefinition(story: StoryDefinition): StoryDetail {
  return {
    storyId: story.storyId,
    title: story.title,
    summary: story.summary,
    level: story.level,
    missions: (story.missions || []).map((mission) => ({
      missionId: mission.missionId,
      title: mission.title,
      sceneSummary: mission.sceneSummary,
      aiRole: mission.aiRole,
      caracterName: mission.caracterName,
      caracterPrompt: mission.caracterPrompt,
      requirements: (mission.requirements || []).map((req) => ({
        requirementId: req.requirementId,
        text: req.text,
        met: false,
      })),
    })),
  };
}

export function useStories() {
  const [items, setItems] = useState<StorySummary[]>(() =>
    BUNDLED_CACHE ? BUNDLED_CACHE.stories.map(storySummaryFromDefinition) : []
  );
  const [version, setVersion] = useState<string | undefined>(BUNDLED_CACHE?.version);
  const [loading, setLoading] = useState(items.length === 0);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    let hasLocalData = items.length > 0;

    const applyCache = (cache?: StoriesCache | null) => {
      if (!cache?.stories?.length) return false;
      hasLocalData = true;
      setItems(cache.stories.map(storySummaryFromDefinition));
      setVersion(cache.version);
      setError(undefined);
      setLoading(false);
      return true;
    };

    (async () => {
      const cached = await getLocalStories();
      // console.log('Cache read:', cached);
      if (!cancelled) {
        applyCache(cached);
      }

      try {
        const synced = await syncStories();
        // console.log('Cache synced:', synced);
        if (!cancelled) {
          if (!applyCache(synced)) {
            setError('No encontramos historias disponibles.');
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (cancelled) return;
        if (!hasLocalData) {
          setError(err?.message || 'No pudimos cargar las historias.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error, version };
}

export function useStoryDetail(storyId?: string) {
  const bundledInitial = storyId && BUNDLED_CACHE?.stories?.find((s) => s.storyId === storyId);
  const [story, setStory] = useState<StoryDetail | undefined>(() =>
    bundledInitial ? storyDetailFromDefinition(bundledInitial) : undefined
  );
  const [loading, setLoading] = useState(() => (storyId ? !bundledInitial : false));
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    if (!storyId) {
      setStory(undefined);
      setLoading(false);
      setError(undefined);
      return;
    }

    const bundled = BUNDLED_CACHE?.stories?.find((s) => s.storyId === storyId);
    let hasLocalData = false;

    if (bundled) {
      hasLocalData = true;
      setStory(storyDetailFromDefinition(bundled));
      setLoading(false);
      setError(undefined);
    } else {
      setStory(undefined);
      setLoading(true);
      setError(undefined);
    }

    (async () => {
      const cached = await getLocalStories();
      if (!cancelled && cached?.stories?.length) {
        const local = cached.stories.find((s) => s.storyId === storyId);
        if (local) {
          hasLocalData = true;
          setStory(storyDetailFromDefinition(local));
          setError(undefined);
          setLoading(false);
        }
      }

      try {
        const synced = await syncStories();
        if (cancelled) return;
        const latest = synced?.stories?.find((s) => s.storyId === storyId);
        if (latest) {
          hasLocalData = true;
          setStory(storyDetailFromDefinition(latest));
          setError(undefined);
          setLoading(false);
        } else {
          setStory(undefined);
          setError('Historia no encontrada');
          setLoading(false);
        }
      } catch (err: any) {
        if (cancelled) return;
        if (!hasLocalData) {
          setError(err?.message || 'No pudimos cargar la historia.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storyId]);

  return { story, loading, error };
}
