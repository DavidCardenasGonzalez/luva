import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type FeedPostsCache = {
  posts: FeedPost[];
  cachedAt: string;
};

const FEED_POSTS_CACHE_KEY = '@luva/feed/posts-cache';
const GENERIC_FEED_POSTS_ERROR = 'No pudimos cargar los posts del feed.';

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

function getFeedPostsErrorMessage(err: any) {
  const message = typeof err?.message === 'string' ? err.message.trim() : '';
  if (!message || /^internal/i.test(message) || /^http 5\d\d/i.test(message)) {
    return GENERIC_FEED_POSTS_ERROR;
  }
  return message;
}

async function readCachedFeedPosts(): Promise<FeedPostsCache | null> {
  try {
    const raw = await AsyncStorage.getItem(FEED_POSTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const posts = sanitizeFeedPosts(parsed?.posts);
    const cachedAt = asString(parsed?.cachedAt);
    if (!posts.length || !cachedAt) return null;
    return { posts, cachedAt };
  } catch {
    return null;
  }
}

async function writeCachedFeedPosts(posts: FeedPost[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      FEED_POSTS_CACHE_KEY,
      JSON.stringify({ posts, cachedAt: new Date().toISOString() })
    );
  } catch {
    // Cache is an optimization; API data is still the source of truth.
  }
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
      let hasCachedPosts = false;
      try {
        const cached = await readCachedFeedPosts();
        if (cancelled) return;
        if (cached?.posts.length) {
          hasCachedPosts = true;
          setPosts(cached.posts);
        }

        const response = await api.get<FeedPostsResponse>('/feed/posts');
        if (cancelled) return;
        const nextPosts = sanitizeFeedPosts(response?.posts);
        setPosts(nextPosts);
        setError(undefined);
        void writeCachedFeedPosts(nextPosts);
        setLoading(false);
      } catch (loadError: any) {
        if (cancelled) return;
        if (!hasCachedPosts) {
          setPosts([]);
          setError(getFeedPostsErrorMessage(loadError));
        }
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
