import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/api';
import { useAuth } from '../auth/AuthProvider';
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
  videoIntro?: string;
  sceneSummary?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
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
};

type FriendsListResponse = {
  items?: FriendCharacter[];
};

type AddFriendResponse = {
  friend?: FriendCharacter;
};

export async function addFriendFromMission(payload: AddFriendPayload): Promise<FriendCharacter> {
  const response = await api.post<AddFriendResponse>('/friends', payload);
  if (!response?.friend) {
    throw new Error('No pudimos agregar este personaje a amigos.');
  }
  return response.friend;
}

export async function sendFriendChatMessage(
  friendId: string,
  payload: {
    sessionId?: string;
    transcript: string;
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
    if (!isSignedIn) {
      setFriends([]);
      setLoading(false);
      setLoaded(true);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const response = await api.get<FriendsListResponse>('/friends');
      setFriends(Array.isArray(response?.items) ? response.items : []);
    } catch (err: any) {
      setError(err?.message || 'No pudimos cargar tus amigos.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [isSignedIn]);

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
