import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../auth/AuthProvider';
import {
  addLocalFriendFromMission,
  listLocalFriends,
  mergeFriendLists,
  syncLocalFriendsToRemote,
} from '../friends/localFriends';

export type FriendCharacter = {
  friendId: string;
  characterName: string;
  aiRole: string;
  characterPrompt?: string;
  characterBio?: string;
  characterSheetImageUrl?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  messageCount?: number;
  conversationCount?: number;
  affinityPoints?: number;
  friendshipContext?: string;
  conversationSnapshot?: FriendConversationSnapshot;
};

export type FriendConversationFeedback = {
  summary: string;
  improvements: string[];
};

export type FriendAffinityUpdate = {
  pointsEarned: number;
  qualityMultiplier: number;
  previousPoints: number;
  totalPoints: number;
  previousLevel: number;
  level: number;
  levelName: string;
  leveledUp: boolean;
};

export type FriendConversationSnapshot = {
  messages: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string; imagePrompt?: string }>;
  conversationEnded: boolean;
  conversationFeedback?: FriendConversationFeedback | null;
  updatedAt: string;
};

export type AddFriendPayload = {
  characterId: string;
  characterName?: string;
  aiRole?: string;
  characterPrompt?: string;
  characterSheetImageUrl?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  friendshipContext?: string;
  conversationSnapshot?: FriendConversationSnapshot;
};

export type FriendChatPayload = {
  friendId: string;
  aiReply: string;
  userMessageForHistory?: string;
  sceneNarration?: string;
  correctness: number;
  result: 'correct' | 'partial' | 'incorrect';
  errors: string[];
  reformulations: string[];
  feedbackType?: 'correction' | 'translation_help';
  conversationEnded: boolean;
  conversationFeedback?: FriendConversationFeedback | null;
};

export type FriendshipImage = {
  imageId: string;
  friendId: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl: string;
  prompt: string;
  referenceImageUrl: string;
  model: string;
  bucketName: string;
  bucketKey: string;
  contentType: string;
  createdAt: string;
  width?: number;
  height?: number;
  falRequestId?: string;
  falSeed?: number;
};

export type FriendImageCreditQuota = {
  balance: number;
  maxCredits: number;
  nextRegenAt?: string;
};

export type FriendImagePayload = {
  friendId: string;
  imageId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  userMessage: string;
  aiReply: string;
  image?: FriendshipImage;
  errorMessage?: string;
  conversationSnapshot?: FriendConversationSnapshot;
  photoRequestCredits?: FriendImageCreditQuota;
};

type FriendsListResponse = {
  items?: FriendCharacter[];
};

type CharactersListResponse = {
  items?: FriendCharacter[];
};

type AddFriendResponse = {
  friend?: FriendCharacter;
};

type AddFriendOptions = {
  localOnly?: boolean;
};

type FriendChatRequestOptions = {
  anonymous?: boolean;
};

function isUnauthorizedFriendWrite(err: any) {
  return (
    err?.code === 'UNAUTHORIZED' ||
    err?.message === 'Unauthorized' ||
    err?.message === 'Missing user identity' ||
    err?.message === 'HTTP 401'
  );
}

export async function addFriendFromMission(
  payload: AddFriendPayload,
  options?: AddFriendOptions,
): Promise<FriendCharacter> {
  if (options?.localOnly) {
    return addLocalFriendFromMission(payload);
  }

  try {
    const response = await api.post<AddFriendResponse>('/friends', payload);
    if (!response?.friend) {
      throw new Error('No pudimos agregar este personaje a amigos.');
    }
    return response.friend;
  } catch (err: any) {
    if (isUnauthorizedFriendWrite(err)) {
      return addLocalFriendFromMission(payload);
    }
    throw err;
  }
}

export async function sendFriendChatMessage(
  friendId: string,
  payload: {
    sessionId?: string;
    transcript: string;
    userImageBase64?: string;
    postId?: string;
    postContext?: string;
    postCaption?: string;
    postImageUrl?: string;
    postVideoUrl?: string;
    englishDifficulty?: 'easy' | 'medium' | 'hard';
    friendshipContext?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string; imagePrompt?: string }>;
  },
  options?: FriendChatRequestOptions,
): Promise<FriendChatPayload> {
  const basePath = options?.anonymous ? '/public/friends' : '/friends';
  return api.post<FriendChatPayload>(`${basePath}/${encodeURIComponent(friendId)}/chat`, payload);
}

export async function finishFriendChat(
  friendId: string,
  payload: {
    postId?: string;
    englishDifficulty?: 'easy' | 'medium' | 'hard';
    friendshipContext?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string; imagePrompt?: string }>;
  },
  options?: FriendChatRequestOptions,
): Promise<{
  friendId: string;
  conversationEnded: boolean;
  conversationFeedback: FriendConversationFeedback | null;
  affinity?: FriendAffinityUpdate | null;
  friendshipContext?: string;
}> {
  const basePath = options?.anonymous ? '/public/friends' : '/friends';
  return api.post(`${basePath}/${encodeURIComponent(friendId)}/finish`, payload);
}

export async function retryFriendChatMessage(
  friendId: string,
  payload: {
    history?: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string; imagePrompt?: string }>;
  },
): Promise<{
  friendId: string;
  conversationSnapshot: FriendConversationSnapshot | null;
}> {
  return api.post(`/friends/${encodeURIComponent(friendId)}/retry`, payload);
}

export async function requestFriendPhoto(
  friendId: string,
  payload: {
    prompt?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string; imagePrompt?: string }>;
  },
): Promise<FriendImagePayload> {
  return api.post<FriendImagePayload>(`/friends/${encodeURIComponent(friendId)}/images`, payload);
}

export async function getFriendPhoto(
  friendId: string,
  imageId: string,
): Promise<FriendImagePayload> {
  return api.get<FriendImagePayload>(
    `/friends/${encodeURIComponent(friendId)}/images/${encodeURIComponent(imageId)}`
  );
}

async function listCatalogCharacters(): Promise<FriendCharacter[]> {
  const response = await api.get<CharactersListResponse>('/characters');
  return Array.isArray(response?.items) ? response.items : [];
}

export function useFriends() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const [friends, setFriends] = useState<FriendCharacter[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(async () => {
    if (authLoading) {
      return;
    }

    if (!isSignedIn) {
      setLoading(true);
      setError(undefined);
      try {
        const [catalogFriends, localFriends] = await Promise.all([
          listCatalogCharacters(),
          listLocalFriends(),
        ]);
        setFriends(mergeFriendLists(localFriends, catalogFriends));
      } catch (err: any) {
        const localFriends = await listLocalFriends();
        setFriends(localFriends);
        setError(err?.message || 'No pudimos cargar tus personajes.');
      }
      setLoading(false);
      setLoaded(true);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      await syncLocalFriendsToRemote();
      const [catalogFriends, response, pendingLocalFriends] = await Promise.all([
        listCatalogCharacters(),
        api.get<FriendsListResponse>('/friends'),
        listLocalFriends(),
      ]);
      const remoteFriends = Array.isArray(response?.items) ? response.items : [];
      setFriends(mergeFriendLists(remoteFriends, mergeFriendLists(pendingLocalFriends, catalogFriends)));
    } catch (err: any) {
      const pendingLocalFriends = await listLocalFriends();
      setFriends(pendingLocalFriends);
      setError(err?.message || 'No pudimos cargar tus personajes.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [authLoading, isSignedIn]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    void reload();
  }, [authLoading, reload]);

  return {
    friends,
    loading: loading || authLoading,
    loaded,
    error,
    reload,
  };
}
