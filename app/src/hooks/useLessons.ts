import { useCallback, useEffect, useState } from 'react';
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
      try {
        const response = await api.get<LessonsResponse>('/lessons');
        if (cancelled) return;
        setLessons(sanitizeLessons(response?.lessons));
      } catch (err: any) {
        if (cancelled) return;
        setLessons([]);
        setError(err?.message || 'No pudimos cargar las lecciones.');
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
      try {
        const response = await api.get<LessonDetailResponse>(`/lessons/${encodeURIComponent(lessonId)}`);
        if (cancelled) return;
        const normalized = sanitizeLesson(response?.lesson);
        if (!normalized) {
          throw new Error('Lección no encontrada.');
        }
        setLesson(normalized);
      } catch (err: any) {
        if (cancelled) return;
        setLesson(undefined);
        setError(err?.message || 'No pudimos cargar la lección.');
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
