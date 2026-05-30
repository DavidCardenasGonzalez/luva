import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../auth/AuthProvider';
import {
  addLocalFriendFromMission,
  listLocalFriends,
  mergeFriendLists,
  syncLocalFriendsToRemote,
} from '../friends/localFriends';

export type CharacterRequirement = {
  requirementId: string;
  text: string;
};

export type CharacterMissionDefinition = {
  missionId: string;
  title: string;
  sceneSummary?: string;
  aiRole: string;
  aiRoleFriends?: string;
  caracterName?: string;
  caracterPrompt?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  videoIntro?: string;
  videoPreviewUrl?: string;
  videoThumbnailUrl?: string;
  requirements?: CharacterRequirement[];
};

export type CharacterStoryDefinition = {
  storyId: string;
  isInitial?: boolean;
  title: string;
  summary: string;
  level?: string;
  tags?: string[];
  unlockCost?: number;
  missions: CharacterMissionDefinition[];
};

export type FriendCharacter = {
  friendId: string;
  storyId: string;
  missionId: string;
  sceneIndex: number;
  storyTitle: string;
  missionTitle: string;
  characterName: string;
  aiRole: string;
  characterPrompt?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  videoIntro?: string;
  videoPreviewUrl?: string;
  videoThumbnailUrl?: string;
  sceneSummary?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  messageCount?: number;
  conversationCount?: number;
};

export type FriendConversationFeedback = {
  summary: string;
  improvements: string[];
};

export type AddFriendPayload = {
  storyId?: string;
  missionId?: string;
  sceneIndex?: number;
  storyDefinition?: CharacterStoryDefinition;
  missionDefinition?: CharacterMissionDefinition;
};

export type FriendChatPayload = {
  friendId: string;
  aiReply: string;
  correctness: number;
  result: 'correct' | 'partial' | 'incorrect';
  errors: string[];
  reformulations: string[];
  conversationEnded: boolean;
  conversationFeedback?: FriendConversationFeedback | null;
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
    postId?: string;
    postContext?: string;
    postCaption?: string;
    postImageUrl?: string;
    postVideoUrl?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Promise<FriendChatPayload> {
  return api.post<FriendChatPayload>(`/friends/${encodeURIComponent(friendId)}/chat`, payload);
}

export async function finishFriendChat(
  friendId: string,
  payload: {
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Promise<{
  friendId: string;
  conversationEnded: boolean;
  conversationFeedback: FriendConversationFeedback | null;
}> {
  return api.post(`/friends/${encodeURIComponent(friendId)}/finish`, payload);
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
