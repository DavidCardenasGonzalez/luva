import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';

export type ShadowingChapter = {
  listId: string;
  chapterId: string;
  title: string;
  description: string;
  order: number;
  audioUrl: string;
  spanishAudioUrl?: string;
  durationSeconds?: number;
  updatedAt: string;
};

export type ShadowingList = {
  listId: string;
  name: string;
  category: string;
  order: number;
  chapters: ShadowingChapter[];
  updatedAt: string;
};

type ShadowingResponse = {
  lists?: unknown[];
};

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
    spanishAudioUrl: normalizeUrl(raw.spanishAudioUrl),
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
      try {
        const response = await api.get<ShadowingResponse>('/shadowing');
        if (cancelled) return;
        setLists(sanitizeLists(response?.lists));
      } catch (err: any) {
        if (cancelled) return;
        setLists([]);
        setError(err?.message || 'No pudimos cargar Shadowing.');
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
