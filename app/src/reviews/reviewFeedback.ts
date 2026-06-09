import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';
import { trackMixpanelEvent } from '../marketing/mixpanelEvents';

const STORAGE_KEY = '@luva/reviews/pending-feedback';

export type ReviewFeedbackSentiment = 'positive' | 'negative';

export type PendingReviewFeedback = {
  id: string;
  sentiment: ReviewFeedbackSentiment;
  message?: string;
  source?: string;
  rewardCoins?: number;
  submittedAt: string;
};

type CurrentUserResponse = {
  user?: unknown;
};

function sanitizeText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : undefined;
}

function sanitizeFeedback(input: unknown): PendingReviewFeedback | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const sentiment = raw.sentiment === 'positive' || raw.sentiment === 'negative' ? raw.sentiment : undefined;
  const submittedAt = sanitizeText(raw.submittedAt, 40);
  const id = sanitizeText(raw.id, 80);
  if (!id || !sentiment || !submittedAt) return null;
  const message = sanitizeText(raw.message, 1200);
  if (sentiment === 'negative' && !message) return null;
  const rewardCoins =
    typeof raw.rewardCoins === 'number' && Number.isFinite(raw.rewardCoins) && raw.rewardCoins > 0
      ? Math.floor(raw.rewardCoins)
      : undefined;
  return {
    id,
    sentiment,
    submittedAt,
    ...(message ? { message } : {}),
    ...(sanitizeText(raw.source, 80) ? { source: sanitizeText(raw.source, 80) } : {}),
    ...(rewardCoins ? { rewardCoins } : {}),
  };
}

async function readPendingReviewFeedback(): Promise<PendingReviewFeedback[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : undefined;
    const list = Array.isArray(parsed) ? parsed : [];
    return list.map(sanitizeFeedback).filter((item): item is PendingReviewFeedback => Boolean(item));
  } catch {
    return [];
  }
}

async function writePendingReviewFeedback(items: PendingReviewFeedback[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function saveAnonymousReviewFeedback(
  input: Omit<PendingReviewFeedback, 'id' | 'submittedAt'>
): Promise<PendingReviewFeedback> {
  const now = new Date().toISOString();
  const item: PendingReviewFeedback = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    sentiment: input.sentiment,
    submittedAt: now,
    ...(input.message ? { message: input.message.replace(/\s+/g, ' ').trim().slice(0, 1200) } : {}),
    ...(input.source ? { source: input.source.replace(/\s+/g, ' ').trim().slice(0, 80) } : {}),
    ...(typeof input.rewardCoins === 'number' ? { rewardCoins: Math.max(0, Math.floor(input.rewardCoins)) } : {}),
  };
  const existing = await readPendingReviewFeedback();
  await writePendingReviewFeedback([item, ...existing].slice(0, 10));
  await trackMixpanelEvent('review_feedback_submitted', {
    event_category: 'reviews',
    review_feedback_id: item.id,
    review_feedback_sentiment: item.sentiment,
    review_feedback_message: item.message,
    review_feedback_source: item.source,
    reward_coins: item.rewardCoins,
    local_only: true,
  });
  return item;
}

export async function syncPendingReviewFeedbackToRemote(): Promise<number> {
  const pending = await readPendingReviewFeedback();
  if (!pending.length) return 0;

  const syncedIds = new Set<string>();
  for (const item of pending.slice().reverse()) {
    try {
      const result = await api.post<CurrentUserResponse>('/users/me', {
        reviewFeedback: {
          sentiment: item.sentiment,
          message: item.message,
          source: item.source,
          rewardCoins: item.rewardCoins,
        },
      });
      if (result?.user) {
        syncedIds.add(item.id);
      }
    } catch (err: any) {
      console.warn('[ReviewFeedback] No se pudo sincronizar feedback local:', err?.message || err);
    }
  }

  if (syncedIds.size) {
    await writePendingReviewFeedback(pending.filter((item) => !syncedIds.has(item.id)));
  }
  return syncedIds.size;
}
