import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../auth/AuthProvider';
import {
  addLocalFriendFromMission,
  listLocalFriends,
  mergeFriendLists,
  syncLocalFriendsToRemote,
} from '../friends/localFriends';
import type { StoryDefinition, StoryMission, StoryMissionDefinition } from './useStories';

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
  storyDefinition?: StoryDefinition;
  missionDefinition?: StoryMission | StoryMissionDefinition;
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
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
): Promise<FriendChatPayload> {
  return api.post<FriendChatPayload>(`/friends/${encodeURIComponent(friendId)}/chat`, payload);
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
        setFriends(await listLocalFriends());
      } catch (err: any) {
        setError(err?.message || 'No pudimos cargar tus amigos locales.');
      }
      setLoading(false);
      setLoaded(true);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      await syncLocalFriendsToRemote();
      const response = await api.get<FriendsListResponse>('/friends');
      const remoteFriends = Array.isArray(response?.items) ? response.items : [];
      const pendingLocalFriends = await listLocalFriends();
      setFriends(mergeFriendLists(remoteFriends, pendingLocalFriends));
    } catch (err: any) {
      const pendingLocalFriends = await listLocalFriends();
      setFriends(pendingLocalFriends);
      setError(err?.message || 'No pudimos cargar tus amigos.');
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
