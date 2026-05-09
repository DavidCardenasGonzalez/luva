import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';

export type LessonQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type Lesson = {
  lessonId: string;
  title: string;
  prompt?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  subtitlesUrl?: string;
  translatedSubtitlesUrl?: string;
  quiz?: LessonQuizQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type LessonSubtitleCue = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  english?: string;
  spanish?: string;
};

export type LessonHelpPayload = {
  question: string;
  currentTimeSeconds: number;
  subtitleMode: 'en' | 'en_es';
  currentCaptionEnglish?: string;
  currentCaptionSpanish?: string;
  subtitles: LessonSubtitleCue[];
};

type LessonsResponse = {
  lessons?: unknown[];
};

type LessonDetailResponse = {
  lesson?: unknown;
};

type LessonHelpResponse = {
  answer?: string;
};

type LessonListCache = {
  lessons: Lesson[];
  cachedAt: string;
};

type LessonDetailCache = {
  lesson: Lesson;
  cachedAt: string;
};

const LESSONS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LESSONS_LIST_CACHE_KEY = '@luva/lessons/list-cache';
const LESSON_DETAIL_CACHE_PREFIX = '@luva/lessons/detail-cache/';

let memoryLessonsCache: LessonListCache | null = null;
const memoryLessonDetailCache = new Map<string, LessonDetailCache>();

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function normalizeUrl(value: unknown): string | undefined {
  const url = asString(value);
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}

function sanitizeQuizQuestion(input: unknown): LessonQuizQuestion | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const question = asString(raw.question);
  const options = Array.isArray(raw.options)
    ? raw.options.map(asString).filter((option): option is string => !!option)
    : [];
  const correctIndex =
    typeof raw.correctIndex === 'number'
      ? raw.correctIndex
      : typeof raw.correctIndex === 'string'
        ? Number(raw.correctIndex.trim())
        : Number.NaN;
  if (!question || options.length !== 4 || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    return null;
  }
  return { question, options, correctIndex };
}

function sanitizeLesson(input: unknown): Lesson | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const lessonId = asString(raw.lessonId);
  const title = asString(raw.title);
  const videoUrl = normalizeUrl(raw.videoUrl);
  if (!lessonId || !title || !videoUrl) return null;
  const quiz = Array.isArray(raw.quiz)
    ? raw.quiz
        .map(sanitizeQuizQuestion)
        .filter((question): question is LessonQuizQuestion => !!question)
    : undefined;
  return {
    lessonId,
    title,
    prompt: asString(raw.prompt),
    videoUrl,
    thumbnailUrl: normalizeUrl(raw.thumbnailUrl),
    subtitlesUrl: normalizeUrl(raw.subtitlesUrl),
    translatedSubtitlesUrl: normalizeUrl(raw.translatedSubtitlesUrl),
    quiz,
    createdAt: asString(raw.createdAt) || new Date(0).toISOString(),
    updatedAt: asString(raw.updatedAt) || new Date(0).toISOString(),
  };
}

function sanitizeLessons(input: unknown): Lesson[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(sanitizeLesson)
    .filter((lesson): lesson is Lesson => !!lesson)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function isFreshCachedAt(cachedAt?: string): boolean {
  if (!cachedAt) return false;
  const timestamp = Date.parse(cachedAt);
  return Number.isFinite(timestamp) && Date.now() - timestamp < LESSONS_CACHE_TTL_MS;
}

function lessonDetailCacheKey(lessonId: string): string {
  return `${LESSON_DETAIL_CACHE_PREFIX}${encodeURIComponent(lessonId)}`;
}

async function readCachedLessons(allowExpired = false): Promise<LessonListCache | null> {
  if (memoryLessonsCache && (allowExpired || isFreshCachedAt(memoryLessonsCache.cachedAt))) {
    return memoryLessonsCache;
  }

  try {
    const raw = await AsyncStorage.getItem(LESSONS_LIST_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const lessons = sanitizeLessons(parsed?.lessons);
    const cachedAt = asString(parsed?.cachedAt);
    if (!lessons.length || !cachedAt || (!allowExpired && !isFreshCachedAt(cachedAt))) return null;
    memoryLessonsCache = { lessons, cachedAt };
    return memoryLessonsCache;
  } catch {
    return null;
  }
}

async function writeCachedLessons(lessons: Lesson[]): Promise<void> {
  const cache = { lessons, cachedAt: new Date().toISOString() };
  memoryLessonsCache = cache;
  try {
    await AsyncStorage.setItem(LESSONS_LIST_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Cache is an optimization; API data is still the source of truth.
  }
}

async function readCachedLessonDetail(lessonId: string, allowExpired = false): Promise<LessonDetailCache | null> {
  const memoryCache = memoryLessonDetailCache.get(lessonId);
  if (memoryCache && (allowExpired || isFreshCachedAt(memoryCache.cachedAt))) {
    return memoryCache;
  }

  try {
    const raw = await AsyncStorage.getItem(lessonDetailCacheKey(lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const lesson = sanitizeLesson(parsed?.lesson);
    const cachedAt = asString(parsed?.cachedAt);
    if (!lesson || !cachedAt || (!allowExpired && !isFreshCachedAt(cachedAt))) return null;
    const cache = { lesson, cachedAt };
    memoryLessonDetailCache.set(lessonId, cache);
    return cache;
  } catch {
    return null;
  }
}

async function writeCachedLessonDetail(lesson: Lesson): Promise<void> {
  const cache = { lesson, cachedAt: new Date().toISOString() };
  memoryLessonDetailCache.set(lesson.lessonId, cache);
  try {
    await AsyncStorage.setItem(lessonDetailCacheKey(lesson.lessonId), JSON.stringify(cache));
  } catch {
    // Cache is an optimization; API data is still the source of truth.
  }
}

async function findCachedLessonDetailFromList(lessonId: string): Promise<LessonDetailCache | null> {
  const listCache = await readCachedLessons(false);
  const lesson = listCache?.lessons.find((item) => item.lessonId === lessonId);
  if (!lesson || !listCache) return null;
  const cache = { lesson, cachedAt: listCache.cachedAt };
  memoryLessonDetailCache.set(lessonId, cache);
  return cache;
}

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(undefined);

    (async () => {
      let expiredCache: LessonListCache | null = null;
      try {
        const cached = await readCachedLessons(false);
        if (cancelled) return;

        if (cached && requestId === 0) {
          setLessons(cached.lessons);
          setLoading(false);
          return;
        }

        expiredCache = await readCachedLessons(true);
        if (expiredCache?.lessons.length) {
          setLessons(expiredCache.lessons);
        }

        const response = await api.get<LessonsResponse>('/lessons');
        if (cancelled) return;
        const nextLessons = sanitizeLessons(response?.lessons);
        setLessons(nextLessons);
        void writeCachedLessons(nextLessons);
      } catch (err: any) {
        if (cancelled) return;
        if (!expiredCache?.lessons.length) {
          setLessons([]);
          setError(err?.message || 'No pudimos cargar las lecciones.');
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

  return { lessons, loading, error, reload };
}

export function useLessonDetail(lessonId?: string) {
  const [lesson, setLesson] = useState<Lesson | undefined>();
  const [loading, setLoading] = useState(Boolean(lessonId));
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    if (!lessonId) {
      setLesson(undefined);
      setLoading(false);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    (async () => {
      let expiredCache: LessonDetailCache | null = null;
      try {
        const cached = (await readCachedLessonDetail(lessonId, false)) || (await findCachedLessonDetailFromList(lessonId));
        if (cancelled) return;

        if (cached) {
          setLesson(cached.lesson);
          setLoading(false);
          return;
        }

        expiredCache = await readCachedLessonDetail(lessonId, true);
        if (expiredCache?.lesson) {
          setLesson(expiredCache.lesson);
        }

        const response = await api.get<LessonDetailResponse>(`/lessons/${encodeURIComponent(lessonId)}`);
        if (cancelled) return;
        const normalized = sanitizeLesson(response?.lesson);
        if (!normalized) {
          throw new Error('Lección no encontrada.');
        }
        setLesson(normalized);
        void writeCachedLessonDetail(normalized);
      } catch (err: any) {
        if (cancelled) return;
        if (!expiredCache?.lesson) {
          setLesson(undefined);
          setError(err?.message || 'No pudimos cargar la lección.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  return { lesson, loading, error };
}

function parseSrtTime(value: string): number | undefined {
  const match = value.trim().match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{1,3})$/);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const milliseconds = Number(match[4].padEnd(3, '0'));
  if (![hours, minutes, seconds, milliseconds].every(Number.isFinite)) return undefined;
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

export function parseSrtCaptions(source: string): Array<{ startSeconds: number; endSeconds: number; text: string }> {
  return source
    .replace(/\r/g, '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const timingIndex = lines.findIndex((line) => line.includes('-->'));
      if (timingIndex < 0) return null;
      const [startRaw, endRaw] = lines[timingIndex].split('-->').map((part) => part.trim());
      const startSeconds = parseSrtTime(startRaw);
      const endSeconds = parseSrtTime(endRaw);
      const text = lines.slice(timingIndex + 1).join(' ').replace(/\s+/g, ' ').trim();
      if (startSeconds == null || endSeconds == null || !text) return null;
      return { startSeconds, endSeconds, text };
    })
    .filter((cue): cue is { startSeconds: number; endSeconds: number; text: string } => !!cue);
}

export async function fetchSrtCaptions(url?: string): Promise<Array<{ startSeconds: number; endSeconds: number; text: string }>> {
  if (!url) return [];
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No pudimos cargar subtítulos (${response.status}).`);
  }
  return parseSrtCaptions(await response.text());
}

export function combineLessonSubtitles(
  english: Array<{ startSeconds: number; endSeconds: number; text: string }>,
  spanish: Array<{ startSeconds: number; endSeconds: number; text: string }>
): LessonSubtitleCue[] {
  return english.map((cue, index) => ({
    id: `${Math.round(cue.startSeconds * 1000)}-${index}`,
    startSeconds: cue.startSeconds,
    endSeconds: cue.endSeconds,
    english: cue.text,
    spanish: spanish[index]?.text,
  }));
}

export function findActiveSubtitle(cues: LessonSubtitleCue[], timeSeconds: number): LessonSubtitleCue | undefined {
  return cues.find((cue) => timeSeconds >= cue.startSeconds && timeSeconds <= cue.endSeconds);
}

export function getNearbySubtitles(cues: LessonSubtitleCue[], timeSeconds: number, radius = 2): LessonSubtitleCue[] {
  if (!cues.length) return [];
  const activeIndex = cues.findIndex((cue) => timeSeconds >= cue.startSeconds && timeSeconds <= cue.endSeconds);
  const nearestIndex =
    activeIndex >= 0
      ? activeIndex
      : cues.reduce((bestIndex, cue, index) => {
          const best = cues[bestIndex];
          const distance = Math.abs(cue.startSeconds - timeSeconds);
          const bestDistance = Math.abs(best.startSeconds - timeSeconds);
          return distance < bestDistance ? index : bestIndex;
        }, 0);
  return cues.slice(Math.max(0, nearestIndex - radius), Math.min(cues.length, nearestIndex + radius + 1));
}

export async function sendLessonHelp(lessonId: string, payload: LessonHelpPayload): Promise<string> {
  const response = await api.post<LessonHelpResponse>(`/lessons/${encodeURIComponent(lessonId)}/help`, payload);
  const answer = response?.answer?.trim();
  if (!answer) {
    throw new Error('Luvi no devolvió una respuesta.');
  }
  return answer;
}
