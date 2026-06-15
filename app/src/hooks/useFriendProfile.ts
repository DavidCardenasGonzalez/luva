import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../auth/AuthProvider';
import { getLocalFriend, syncLocalFriendsToRemote } from '../friends/localFriends';
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

type FriendsListResponse = {
  items?: FriendCharacter[];
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

function latestIsoTimestamp(...values: Array<string | undefined>): string | undefined {
  return values
    .filter((value): value is string => Boolean(value && Number.isFinite(Date.parse(value))))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

function mergeFriendProfileFloor(
  profileFriend: FriendCharacter | undefined,
  floorFriend: FriendCharacter,
): FriendCharacter {
  if (!profileFriend) return floorFriend;
  const lastMessageAt = latestIsoTimestamp(profileFriend.lastMessageAt, floorFriend.lastMessageAt);
  const merged: FriendCharacter = {
    ...floorFriend,
    ...profileFriend,
    updatedAt: latestIsoTimestamp(profileFriend.updatedAt, floorFriend.updatedAt) || profileFriend.updatedAt,
    ...(lastMessageAt ? { lastMessageAt } : {}),
  };
  (['affinityPoints', 'messageCount', 'conversationCount'] as const).forEach((key) => {
    const profileValue = typeof profileFriend[key] === 'number' ? (profileFriend[key] as number) : 0;
    const floorValue = typeof floorFriend[key] === 'number' ? (floorFriend[key] as number) : 0;
    if (floorValue > profileValue) {
      merged[key] = floorValue;
    }
  });
  if (floorFriend.friendshipContext && !merged.friendshipContext) {
    merged.friendshipContext = floorFriend.friendshipContext;
  }
  return merged;
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
    if (authLoading) {
      return;
    }

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
      if (isSignedIn) {
        try {
          await syncLocalFriendsToRemote([friendId]);
        } catch (syncErr: any) {
          console.warn('[FriendProfile] No se pudo sincronizar el amigo local:', syncErr?.message || syncErr);
        }
      }

      const encodedFriendId = encodeURIComponent(friendId);
      const profilePath = isSignedIn
        ? `/friends/${encodedFriendId}/profile`
        : `/friend-profiles/${encodedFriendId}`;
      const response = await api.get<FriendProfileResponse>(profilePath);
      let nextFriend = response?.friend;
      if (isSignedIn) {
        try {
          const friendsResponse = await api.get<FriendsListResponse>('/friends');
          const remoteFriend = Array.isArray(friendsResponse?.items)
            ? friendsResponse.items.find((item) => item.friendId === friendId)
            : undefined;
          if (remoteFriend) {
            nextFriend = mergeFriendProfileFloor(nextFriend, remoteFriend);
          }
        } catch (friendsErr: any) {
          console.warn('[FriendProfile] No se pudo cargar el piso de stats:', friendsErr?.message || friendsErr);
        }
      }
      if (nextFriend) {
        // Friend stats are always cached locally for resilience. Anonymous users
        // only ever have local data; for signed-in users the local cache acts as
        // a floor in case the backend hasn't caught up (deploy lag, failed sync,
        // or DynamoDB update dropped silently).
        const localFriend = await getLocalFriend(friendId);
        if (localFriend) {
          const floored = { ...nextFriend };
          (['affinityPoints', 'messageCount', 'conversationCount'] as const).forEach((key) => {
            const localValue = localFriend[key];
            if (typeof localValue !== 'number') return;
            const apiValue = typeof floored[key] === 'number' ? (floored[key] as number) : 0;
            if (localValue > apiValue) {
              floored[key] = localValue;
            }
          });
          if (localFriend.friendshipContext && !floored.friendshipContext) {
            floored.friendshipContext = localFriend.friendshipContext;
          }
          nextFriend = floored;
        }
      }
      setFriend(nextFriend);
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
  }, [authLoading, friendId, isSignedIn]);

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [authLoading, reload]);

  return {
    friend,
    posts,
    images,
    loading: loading || authLoading,
    loaded,
    error,
    reload,
  };
}
