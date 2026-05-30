import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';

export type CharacterVideoPost = {
  characterId: string;
  postId: string;
  storyId: string;
  missionId: string;
  sceneIndex: number;
  storyTitle: string;
  missionTitle: string;
  characterName: string;
  caption: string;
  context?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  videoUrl: string;
  subtitlesUrl?: string;
  order: number;
  likeCount: number;
  avatarImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CharacterVideoPostsResponse = {
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

function normalizeSceneIndex(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.floor(parsed));
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

function sanitizeCharacterVideoPost(input: unknown): CharacterVideoPost | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const characterId = asString(raw.characterId);
  const postId = asString(raw.postId);
  const storyId = asString(raw.storyId);
  const missionId = asString(raw.missionId);
  const sceneIndex = normalizeSceneIndex(raw.sceneIndex);
  const storyTitle = asString(raw.storyTitle);
  const missionTitle = asString(raw.missionTitle);
  const characterName = asString(raw.characterName);
  const caption = asString(raw.caption);
  const thumbnailUrl = normalizeUrl(raw.thumbnailUrl);
  const videoUrl = normalizeUrl(raw.videoUrl);
  const imageUrl = normalizeUrl(raw.imageUrl) || thumbnailUrl;
  const order = normalizeOrder(raw.order);

  if (
    !characterId ||
    !postId ||
    !storyId ||
    !missionId ||
    sceneIndex === undefined ||
    !storyTitle ||
    !missionTitle ||
    !characterName ||
    !caption ||
    !imageUrl ||
    !videoUrl ||
    !order
  ) {
    return null;
  }

  return {
    characterId,
    postId,
    storyId,
    missionId,
    sceneIndex,
    storyTitle,
    missionTitle,
    characterName,
    caption,
    context: asString(raw.context),
    imageUrl,
    thumbnailUrl: thumbnailUrl || imageUrl,
    videoUrl,
    subtitlesUrl: normalizeUrl(raw.subtitlesUrl),
    order,
    likeCount: normalizeLikeCount(raw.likeCount),
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
      try {
        const response = await api.get<CharacterVideoPostsResponse>('/feed/character-videos');
        if (cancelled) return;
        setPosts(sanitizeCharacterVideoPosts(response?.posts));
        setLoading(false);
      } catch (loadError: any) {
        if (cancelled) return;
        setPosts([]);
        setError(loadError?.message || 'No pudimos cargar los videos de personajes.');
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
