import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';

export type CharacterVideoPost = {
  characterId: string;
  postId: string;
  characterName: string;
  caption: string;
  context?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  videoUrl: string;
  subtitlesUrl?: string;
  order: number;
  likeCount: number;
  suggestedReplies: string[];
  avatarImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CharacterVideoPostsResponse = {
  posts?: unknown[];
};

type CharacterVideoPostsCache = {
  posts: CharacterVideoPost[];
  cachedAt: string;
};

const CHARACTER_VIDEO_POSTS_CACHE_KEY = '@luva/feed/character-video-posts-cache';
const GENERIC_CHARACTER_VIDEO_POSTS_ERROR = 'No pudimos cargar los videos de personajes.';
const DEFAULT_CHARACTER_VIDEO_SUGGESTED_REPLIES = [
  'Hi there!',
  'That’s funny 😂',
  'Tell me more',
];

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

function normalizeUrl(value: unknown): string | undefined {
  const url = asString(value);
  if (!url || !/^https?:\/\//i.test(url)) return undefined;
  return url;
}

function normalizeLikeCount(value: unknown): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;
  if (!Number.isFinite(parsed)) return 0;
  const count = Math.floor(parsed);
  return count > 0 ? count : 0;
}

function normalizeSuggestedReplies(value: unknown): string[] {
  const rawReplies = Array.isArray(value) ? value : [];
  const normalizedReplies = rawReplies
    .map((reply) => (typeof reply === 'string' ? reply.replace(/\s+/g, ' ').trim() : ''))
    .filter(Boolean)
    .slice(0, 3);
  return [...normalizedReplies, ...DEFAULT_CHARACTER_VIDEO_SUGGESTED_REPLIES].slice(0, 3);
}

function sanitizeCharacterVideoPost(input: unknown): CharacterVideoPost | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const characterId = asString(raw.characterId);
  const postId = asString(raw.postId);
  const characterName = asString(raw.characterName);
  const caption = asString(raw.caption);
  const thumbnailUrl = normalizeUrl(raw.thumbnailUrl);
  const videoUrl = normalizeUrl(raw.videoUrl);
  const imageUrl = normalizeUrl(raw.imageUrl) || thumbnailUrl;
  const order = normalizeOrder(raw.order);

  if (!characterId || !postId || !characterName || !caption || !imageUrl || !videoUrl || !order) {
    return null;
  }

  return {
    characterId,
    postId,
    characterName,
    caption,
    context: asString(raw.context),
    imageUrl,
    thumbnailUrl: thumbnailUrl || imageUrl,
    videoUrl,
    subtitlesUrl: normalizeUrl(raw.subtitlesUrl),
    order,
    likeCount: normalizeLikeCount(raw.likeCount),
    suggestedReplies: normalizeSuggestedReplies(raw.suggestedReplies),
    avatarImageUrl: normalizeUrl(raw.avatarImageUrl),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

function sanitizeCharacterVideoPosts(input: unknown): CharacterVideoPost[] {
  const rawPosts = Array.isArray(input) ? input : [];
  return rawPosts
    .map(sanitizeCharacterVideoPost)
    .filter((post): post is CharacterVideoPost => !!post)
    .sort((left, right) => left.order - right.order || left.postId.localeCompare(right.postId));
}

function getCharacterVideoPostsErrorMessage(err: any) {
  const message = typeof err?.message === 'string' ? err.message.trim() : '';
  if (!message || /^internal/i.test(message) || /^http 5\d\d/i.test(message)) {
    return GENERIC_CHARACTER_VIDEO_POSTS_ERROR;
  }
  return message;
}

async function readCachedCharacterVideoPosts(): Promise<CharacterVideoPostsCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CHARACTER_VIDEO_POSTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const posts = sanitizeCharacterVideoPosts(parsed?.posts);
    const cachedAt = asString(parsed?.cachedAt);
    if (!posts.length || !cachedAt) return null;
    return { posts, cachedAt };
  } catch {
    return null;
  }
}

async function writeCachedCharacterVideoPosts(posts: CharacterVideoPost[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CHARACTER_VIDEO_POSTS_CACHE_KEY,
      JSON.stringify({ posts, cachedAt: new Date().toISOString() })
    );
  } catch {
    // Cache is an optimization; API data is still the source of truth.
  }
}

export function useCharacterVideoPosts() {
  const [posts, setPosts] = useState<CharacterVideoPost[]>([]);
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
        const cached = await readCachedCharacterVideoPosts();
        if (cancelled) return;
        if (cached?.posts.length) {
          hasCachedPosts = true;
          setPosts(cached.posts);
        }

        const response = await api.get<CharacterVideoPostsResponse>('/feed/character-videos');
        if (cancelled) return;
        const nextPosts = sanitizeCharacterVideoPosts(response?.posts);
        setPosts(nextPosts);
        setError(undefined);
        void writeCachedCharacterVideoPosts(nextPosts);
        setLoading(false);
      } catch (loadError: any) {
        if (cancelled) return;
        if (!hasCachedPosts) {
          setPosts([]);
          setError(getCharacterVideoPostsErrorMessage(loadError));
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
