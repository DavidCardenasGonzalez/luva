import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';
import { getLocalFriend } from '../friends/localFriends';
import type { FriendCharacter } from './useFriends';

export type CharacterProfilePost = {
  characterId: string;
  postId: string;
  characterName: string;
  caption: string;
  context?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  order: number;
  messageCount: number;
  conversationCount: number;
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

function normalizeCount(value: unknown): number {
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
  const characterName = asString(raw.characterName);
  const caption = asString(raw.caption);
  const thumbnailUrl = normalizeUrl(raw.thumbnailUrl);
  const videoUrl = normalizeUrl(raw.videoUrl);
  const imageUrl = normalizeUrl(raw.imageUrl) || thumbnailUrl;
  const order = normalizeOrder(raw.order);

  if (!characterId || !postId || !characterName || !caption || !imageUrl || !order) {
    return null;
  }

  return {
    characterId,
    postId,
    characterName,
    caption,
    context: asString(raw.context),
    imageUrl,
    thumbnailUrl: thumbnailUrl || (videoUrl ? imageUrl : undefined),
    videoUrl,
    order,
    messageCount: normalizeCount(raw.messageCount),
    conversationCount: normalizeCount(raw.conversationCount),
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
  const [friend, setFriend] = useState<FriendCharacter>();
  const [posts, setPosts] = useState<CharacterProfilePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(async () => {
    if (!friendId) {
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
        `/friend-profiles/${encodeURIComponent(friendId)}`
      );
      setFriend(response?.friend);
      setPosts(sanitizeProfilePosts(response?.posts));
    } catch (err: any) {
      const localFriend = await getLocalFriend(friendId);
      setFriend(localFriend);
      setPosts([]);
      setError(localFriend ? undefined : err?.message || 'No pudimos cargar el perfil.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [friendId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    friend,
    posts,
    loading,
    loaded,
    error,
    reload,
  };
}
