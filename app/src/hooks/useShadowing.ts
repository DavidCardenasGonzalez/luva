import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';

export type ShadowingChapter = {
  listId: string;
  chapterId: string;
  title: string;
  description: string;
  order: number;
  audioUrl: string;
  subtitlesUrl?: string;
  durationSeconds?: number;
  updatedAt: string;
};

export type ShadowingList = {
  listId: string;
  name: string;
  category: string;
  order: number;
  coverImageUrl?: string;
  coverImageMdUrl?: string;
  chapters: ShadowingChapter[];
  updatedAt: string;
};

type ShadowingResponse = {
  lists?: unknown[];
};

const SHADOWING_CACHE_STORAGE_KEY = '@luva/shadowing/lists-cache';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function normalizeUrl(value: unknown): string | undefined {
  const url = asString(value);
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeOrder(value: unknown) {
  const parsed = normalizeNumber(value);
  return parsed == null ? 1 : Math.max(1, Math.floor(parsed));
}

function sanitizeChapter(input: unknown, fallbackListId: string): ShadowingChapter | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const listId = asString(raw.listId) || fallbackListId;
  const chapterId = asString(raw.chapterId);
  const title = asString(raw.title);
  const audioUrl = normalizeUrl(raw.audioUrl);
  if (!listId || !chapterId || !title || !audioUrl) return null;

  const durationSeconds = normalizeNumber(raw.durationSeconds);
  return {
    listId,
    chapterId,
    title,
    description: asString(raw.description) || '',
    order: normalizeOrder(raw.order),
    audioUrl,
    subtitlesUrl: normalizeUrl(raw.subtitlesUrl),
    durationSeconds: durationSeconds != null && durationSeconds > 0 ? durationSeconds : undefined,
    updatedAt: asString(raw.updatedAt) || new Date(0).toISOString(),
  };
}

function sanitizeList(input: unknown): ShadowingList | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const listId = asString(raw.listId);
  const name = asString(raw.name);
  const category = asString(raw.category);
  if (!listId || !name || !category) return null;

  const chapters = Array.isArray(raw.chapters)
    ? raw.chapters
        .map((chapter) => sanitizeChapter(chapter, listId))
        .filter((chapter): chapter is ShadowingChapter => !!chapter)
        .sort((left, right) => left.order - right.order)
    : [];
  if (!chapters.length) return null;

  return {
    listId,
    name,
    category,
    order: normalizeOrder(raw.order),
    coverImageUrl: normalizeUrl(raw.coverImageMdUrl) || normalizeUrl(raw.coverImageUrl),
    coverImageMdUrl: normalizeUrl(raw.coverImageMdUrl),
    chapters,
    updatedAt: asString(raw.updatedAt) || new Date(0).toISOString(),
  };
}

function sanitizeLists(input: unknown): ShadowingList[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(sanitizeList)
    .filter((list): list is ShadowingList => !!list)
    .sort((left, right) => {
      if (left.order !== right.order) return left.order - right.order;
      return left.name.localeCompare(right.name);
    });
}

async function readCachedShadowingLists(): Promise<ShadowingList[]> {
  try {
    const raw = await AsyncStorage.getItem(SHADOWING_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return sanitizeLists(Array.isArray(parsed) ? parsed : parsed?.lists);
  } catch {
    return [];
  }
}

async function writeCachedShadowingLists(lists: ShadowingList[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SHADOWING_CACHE_STORAGE_KEY, JSON.stringify({
      lists,
      cachedAt: new Date().toISOString(),
    }));
  } catch {
    // Cache is an optimization; API data is still the source of truth.
  }
}

export function useShadowing() {
  const [lists, setLists] = useState<ShadowingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);

    (async () => {
      let hasCachedLists = false;
      try {
        const cachedLists = await readCachedShadowingLists();
        if (cancelled) return;

        if (cachedLists.length) {
          hasCachedLists = true;
          setLists(cachedLists);
        }

        const response = await api.get<ShadowingResponse>('/shadowing');
        if (cancelled) return;
        const nextLists = sanitizeLists(response?.lists);
        setLists(nextLists);
        void writeCachedShadowingLists(nextLists);
      } catch (err: any) {
        if (cancelled) return;
        if (!hasCachedLists) {
          setLists([]);
          setError(err?.message || 'No pudimos cargar Shadowing.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const reload = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  return { lists, loading, error, reload };
}
