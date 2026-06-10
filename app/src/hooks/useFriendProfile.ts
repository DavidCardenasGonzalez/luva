import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../auth/AuthProvider';
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

export type FriendProfileImage = {
  imageId: string;
  friendId: string;
  imageUrl: string;
  prompt: string;
  createdAt: string;
  width?: number;
  height?: number;
};

type FriendProfileResponse = {
  friend?: FriendCharacter;
  posts?: unknown[];
};

type FriendImagesResponse = {
  items?: unknown[];
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

function sanitizeProfileImage(input: unknown): FriendProfileImage | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const imageId = asString(raw.imageId);
  const friendId = asString(raw.friendId);
  const imageUrl = normalizeUrl(raw.imageUrl);
  const prompt = asString(raw.prompt) || '';
  const createdAt = asString(raw.createdAt);
  if (!imageId || !friendId || !imageUrl || !createdAt) return null;
  return {
    imageId,
    friendId,
    imageUrl,
    prompt,
    createdAt,
    ...(typeof raw.width === 'number' ? { width: raw.width } : {}),
    ...(typeof raw.height === 'number' ? { height: raw.height } : {}),
  };
}

function sanitizeProfileImages(input: unknown): FriendProfileImage[] {
  const rawItems = Array.isArray(input) ? input : [];
  return rawItems
    .map(sanitizeProfileImage)
    .filter((image): image is FriendProfileImage => !!image)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function useFriendProfile(friendId?: string) {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const [friend, setFriend] = useState<FriendCharacter>();
  const [posts, setPosts] = useState<CharacterProfilePost[]>([]);
  const [images, setImages] = useState<FriendProfileImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(async () => {
    if (!friendId) {
      setFriend(undefined);
      setPosts([]);
      setImages([]);
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
      if (isSignedIn) {
        try {
          const imagesResponse = await api.get<FriendImagesResponse>(
            `/friends/${encodeURIComponent(friendId)}/images`
          );
          setImages(sanitizeProfileImages(imagesResponse?.items));
        } catch {
          setImages([]);
        }
      } else {
        setImages([]);
      }
    } catch (err: any) {
      const localFriend = await getLocalFriend(friendId);
      setFriend(localFriend);
      setPosts([]);
      setImages([]);
      setError(localFriend ? undefined : err?.message || 'No pudimos cargar el perfil.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [friendId, isSignedIn]);

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [authLoading, reload]);

  return {
    friend,
    posts,
    images,
    loading,
    loaded,
    error,
    reload,
  };
}
