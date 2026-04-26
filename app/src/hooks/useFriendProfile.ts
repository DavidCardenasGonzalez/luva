import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../auth/AuthProvider';
import type { FriendCharacter } from './useFriends';

export type CharacterProfilePost = {
  characterId: string;
  postId: string;
  storyId: string;
  missionId: string;
  sceneIndex: number;
  storyTitle: string;
  missionTitle: string;
  characterName: string;
  caption: string;
  imageUrl: string;
  order: number;
  avatarImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

type FriendProfileResponse = {
  friend?: FriendCharacter;
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

function sanitizeProfilePost(input: unknown): CharacterProfilePost | null {
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
  const imageUrl = normalizeUrl(raw.imageUrl);
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
    imageUrl,
    order,
    avatarImageUrl: normalizeUrl(raw.avatarImageUrl),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
  };
}

function sanitizeProfilePosts(input: unknown): CharacterProfilePost[] {
  const rawPosts = Array.isArray(input) ? input : [];
  return rawPosts
    .map(sanitizeProfilePost)
    .filter((post): post is CharacterProfilePost => !!post)
    .sort((left, right) => left.order - right.order || left.postId.localeCompare(right.postId));
}

export function useFriendProfile(friendId?: string) {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const [friend, setFriend] = useState<FriendCharacter>();
  const [posts, setPosts] = useState<CharacterProfilePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(async () => {
    if (!isSignedIn || !friendId) {
      setFriend(undefined);
      setPosts([]);
      setLoading(false);
      setLoaded(true);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const response = await api.get<FriendProfileResponse>(
        `/friends/${encodeURIComponent(friendId)}/profile`
      );
      setFriend(response?.friend);
      setPosts(sanitizeProfilePosts(response?.posts));
    } catch (err: any) {
      setFriend(undefined);
      setPosts([]);
      setError(err?.message || 'No pudimos cargar el perfil.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [friendId, isSignedIn]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    void reload();
  }, [authLoading, reload]);

  return {
    friend,
    posts,
    loading: loading || authLoading,
    loaded,
    error,
    reload,
  };
}
