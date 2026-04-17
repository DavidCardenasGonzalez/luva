import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';

export type FeedPostType = 'normal' | 'practice_guide' | 'mission_guide' | 'extra';

export type FeedPost = {
  postId: string;
  text: string;
  order: number;
  postType: FeedPostType;
  imageUrl?: string;
  videoUrl?: string;
  practiceId?: string;
  missionId?: string;
  coinAmount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type FeedPostsResponse = {
  posts?: unknown[];
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function normalizeOrder(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;
  if (!Number.isFinite(parsed)) return undefined;
  const order = Math.floor(parsed);
  return order >= 1 ? order : undefined;
}

function normalizeCoinAmount(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;
  if (!Number.isFinite(parsed)) return undefined;
  const amount = Math.floor(parsed);
  return amount >= 1 ? amount : undefined;
}

function normalizeUrl(value: unknown): string | undefined {
  const url = asString(value);
  if (!url || !/^https?:\/\//i.test(url)) return undefined;
  return url;
}

function normalizePostType(value: unknown): FeedPostType | undefined {
  const type = asString(value);
  if (
    type === 'normal' ||
    type === 'practice_guide' ||
    type === 'mission_guide' ||
    type === 'extra'
  ) {
    return type;
  }
  return undefined;
}

function sanitizeFeedPost(input: unknown): FeedPost | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const postId = asString(raw.postId);
  const text = asString(raw.text);
  const order = normalizeOrder(raw.order);
  const postType = normalizePostType(raw.postType ?? raw.type);
  if (!postId || !text || !order || !postType) return null;

  const practiceId = asString(raw.practiceId);
  const missionId = asString(raw.missionId);
  const coinAmount = normalizeCoinAmount(raw.coinAmount);
  if (postType === 'practice_guide' && !practiceId) return null;
  if (postType === 'mission_guide' && !missionId) return null;
  if (postType === 'extra' && !coinAmount) return null;

  return {
    postId,
    text,
    order,
    postType,
    imageUrl: normalizeUrl(raw.imageUrl),
    videoUrl: normalizeUrl(raw.videoUrl),
    practiceId: postType === 'practice_guide' ? practiceId : undefined,
    missionId: postType === 'mission_guide' ? missionId : undefined,
    coinAmount: postType === 'extra' ? coinAmount : undefined,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

function sanitizeFeedPosts(input: unknown): FeedPost[] {
  const rawPosts = Array.isArray(input) ? input : [];
  return rawPosts
    .map(sanitizeFeedPost)
    .filter((post): post is FeedPost => !!post)
    .sort((left, right) => left.order - right.order || left.postId.localeCompare(right.postId));
}

export function useFeedPosts() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(undefined);

    (async () => {
      try {
        const response = await api.get<FeedPostsResponse>('/feed/posts');
        if (cancelled) return;
        setPosts(sanitizeFeedPosts(response?.posts));
        setLoading(false);
      } catch (loadError: any) {
        if (cancelled) return;
        setPosts([]);
        setError(loadError?.message || 'No pudimos cargar los posts del feed.');
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const reload = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  return { posts, loading, error, reload };
}
