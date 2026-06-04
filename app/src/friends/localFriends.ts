import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';
import {
  getLatestLocalFriendConversationForFriend,
  toFriendConversationSnapshot,
} from './localFriendConversations';

export type LocalFriendCharacter = {
  friendId: string;
  characterName: string;
  aiRole: string;
  characterPrompt?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  lastUserMessage?: string;
  messageCount?: number;
  conversationCount?: number;
};

export type LocalAddFriendPayload = {
  characterId: string;
  characterName?: string;
  aiRole?: string;
  characterPrompt?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  lastMessageAt?: string;
  lastUserMessage?: string;
  messageCount?: number;
  conversationCount?: number;
  conversationSnapshot?: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    conversationEnded: boolean;
    conversationFeedback?: {
      summary: string;
      improvements: string[];
    } | null;
    updatedAt: string;
  };
};

type FriendsListResponse = {
  items?: LocalFriendCharacter[];
};

const LOCAL_FRIENDS_STORAGE_KEY = '@luva/local-friends';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Sanitize a friend record from AsyncStorage.
 *
 * Records may have been written by older builds with legacy fields
 * (storyId, missionId, sceneIndex, storyTitle, missionTitle, sceneSummary, video*).
 * We read what we need and drop the rest, deriving `friendId` from legacy
 * `storyId:missionId` when necessary.
 */
function sanitizeLocalFriend(input: unknown): LocalFriendCharacter | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;

  const legacyStoryId = asString(raw.storyId);
  const legacyMissionId = asString(raw.missionId);
  const friendId =
    asString(raw.friendId) ||
    asString(raw.characterId) ||
    (legacyStoryId && legacyMissionId ? `${legacyStoryId}:${legacyMissionId}` : undefined);
  const characterName = asString(raw.characterName);
  const aiRole = asString(raw.aiRole);
  const createdAt = asString(raw.createdAt);
  const updatedAt = asString(raw.updatedAt);

  if (!friendId || !characterName || !aiRole || !createdAt || !updatedAt) {
    return null;
  }

  return {
    friendId,
    characterName,
    aiRole,
    ...(asString(raw.characterPrompt) ? { characterPrompt: asString(raw.characterPrompt) } : {}),
    ...(asString(raw.avatarImageUrl) ? { avatarImageUrl: asString(raw.avatarImageUrl) } : {}),
    ...(asString(raw.avatarImageXsUrl) ? { avatarImageXsUrl: asString(raw.avatarImageXsUrl) } : {}),
    ...(asString(raw.avatarImageMdUrl) ? { avatarImageMdUrl: asString(raw.avatarImageMdUrl) } : {}),
    createdAt,
    updatedAt,
    ...(asString(raw.lastMessageAt) ? { lastMessageAt: asString(raw.lastMessageAt) } : {}),
    ...(asString(raw.lastUserMessage) ? { lastUserMessage: asString(raw.lastUserMessage) } : {}),
    ...(asFiniteNumber(raw.messageCount) !== undefined
      ? { messageCount: Math.max(0, Math.floor(asFiniteNumber(raw.messageCount)!)) }
      : {}),
    ...(asFiniteNumber(raw.conversationCount) !== undefined
      ? { conversationCount: Math.max(0, Math.floor(asFiniteNumber(raw.conversationCount)!)) }
      : {}),
  };
}

async function readLocalFriends(): Promise<LocalFriendCharacter[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_FRIENDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : undefined;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object'
      ? Object.values(parsed)
      : [];
    return list
      .map(sanitizeLocalFriend)
      .filter((friend): friend is LocalFriendCharacter => !!friend)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } catch {
    return [];
  }
}

async function writeLocalFriends(friends: LocalFriendCharacter[]): Promise<void> {
  const byId = new Map<string, LocalFriendCharacter>();
  friends.forEach((friend) => {
    byId.set(friend.friendId, friend);
  });
  const next = [...byId.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  await AsyncStorage.setItem(LOCAL_FRIENDS_STORAGE_KEY, JSON.stringify(next));
}

function buildLocalFriendFromPayload(
  payload: LocalAddFriendPayload,
  existing?: LocalFriendCharacter,
): LocalFriendCharacter {
  const characterId = asString(payload.characterId);
  const characterName = asString(payload.characterName) || existing?.characterName;
  const aiRole = asString(payload.aiRole) || existing?.aiRole;

  if (!characterId || !characterName || !aiRole) {
    throw new Error('No pudimos agregar este personaje a amigos.');
  }

  const now = new Date().toISOString();
  const characterPrompt = asString(payload.characterPrompt) || existing?.characterPrompt;

  return {
    friendId: characterId,
    characterName,
    aiRole,
    ...(characterPrompt ? { characterPrompt } : {}),
    ...(asString(payload.avatarImageUrl) || existing?.avatarImageUrl
      ? { avatarImageUrl: asString(payload.avatarImageUrl) || existing?.avatarImageUrl }
      : {}),
    ...(asString(payload.avatarImageXsUrl) || existing?.avatarImageXsUrl
      ? { avatarImageXsUrl: asString(payload.avatarImageXsUrl) || existing?.avatarImageXsUrl }
      : {}),
    ...(asString(payload.avatarImageMdUrl) || existing?.avatarImageMdUrl
      ? { avatarImageMdUrl: asString(payload.avatarImageMdUrl) || existing?.avatarImageMdUrl }
      : {}),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...(existing?.lastMessageAt ? { lastMessageAt: existing.lastMessageAt } : {}),
    ...(existing?.lastUserMessage ? { lastUserMessage: existing.lastUserMessage } : {}),
    ...(typeof existing?.messageCount === 'number' ? { messageCount: existing.messageCount } : {}),
    ...(typeof existing?.conversationCount === 'number' ? { conversationCount: existing.conversationCount } : {}),
  };
}

async function buildSyncPayload(friend: LocalFriendCharacter): Promise<Record<string, unknown>> {
  const latestConversation = await getLatestLocalFriendConversationForFriend(friend.friendId);
  return {
    characterId: friend.friendId,
    ...(friend.lastMessageAt ? { lastMessageAt: friend.lastMessageAt } : {}),
    ...(friend.lastUserMessage ? { lastUserMessage: friend.lastUserMessage } : {}),
    ...(typeof friend.messageCount === 'number' ? { messageCount: friend.messageCount } : {}),
    ...(typeof friend.conversationCount === 'number' ? { conversationCount: friend.conversationCount } : {}),
    ...(latestConversation ? { conversationSnapshot: toFriendConversationSnapshot(latestConversation) } : {}),
  };
}

function isEpochTimestamp(value?: string) {
  return !value || value === '1970-01-01T00:00:00.000Z';
}

function normalizeFriendForLocalStorage(
  friend: LocalFriendCharacter,
  existing?: LocalFriendCharacter,
): LocalFriendCharacter {
  const now = new Date().toISOString();
  const createdAt = existing?.createdAt || (isEpochTimestamp(friend.createdAt) ? now : friend.createdAt);
  return {
    ...friend,
    createdAt,
    updatedAt: now,
    ...(existing?.lastMessageAt || friend.lastMessageAt
      ? { lastMessageAt: existing?.lastMessageAt || friend.lastMessageAt }
      : {}),
    ...(existing?.lastUserMessage || friend.lastUserMessage
      ? { lastUserMessage: existing?.lastUserMessage || friend.lastUserMessage }
      : {}),
    messageCount: Math.max(0, Math.floor(existing?.messageCount ?? friend.messageCount ?? 0)),
    conversationCount: Math.max(0, Math.floor(existing?.conversationCount ?? friend.conversationCount ?? 0)),
  };
}

async function updateLocalFriend(
  friend: LocalFriendCharacter,
  updater: (current: LocalFriendCharacter) => LocalFriendCharacter,
): Promise<LocalFriendCharacter> {
  const friends = await readLocalFriends();
  const existing = friends.find((item) => item.friendId === friend.friendId);
  const base = normalizeFriendForLocalStorage(friend, existing);
  const nextFriend = updater(base);
  await writeLocalFriends([
    nextFriend,
    ...friends.filter((item) => item.friendId !== nextFriend.friendId),
  ]);
  return nextFriend;
}

export async function listLocalFriends(): Promise<LocalFriendCharacter[]> {
  return readLocalFriends();
}

export async function getLocalFriend(friendId?: string): Promise<LocalFriendCharacter | undefined> {
  const key = asString(friendId);
  if (!key) return undefined;
  const friends = await readLocalFriends();
  return friends.find((friend) => friend.friendId === key);
}

export async function addLocalFriendFromMission(payload: LocalAddFriendPayload): Promise<LocalFriendCharacter> {
  const friends = await readLocalFriends();
  const characterId = asString(payload.characterId);
  if (!characterId) {
    throw new Error('No pudimos agregar este personaje a amigos.');
  }
  const existing = friends.find((friend) => friend.friendId === characterId);
  const nextFriend = buildLocalFriendFromPayload(payload, existing);
  await writeLocalFriends([
    nextFriend,
    ...friends.filter((friend) => friend.friendId !== nextFriend.friendId),
  ]);
  return nextFriend;
}

export async function recordLocalFriendMessageSent(
  friend: LocalFriendCharacter,
  transcript: string,
): Promise<LocalFriendCharacter> {
  const trimmedTranscript = transcript.trim();
  return updateLocalFriend(friend, (current) => {
    const now = new Date().toISOString();
    return {
      ...current,
      updatedAt: now,
      lastMessageAt: now,
      ...(trimmedTranscript ? { lastUserMessage: trimmedTranscript.slice(0, 500) } : {}),
      messageCount: Math.max(0, Math.floor(current.messageCount ?? 0)) + 1,
    };
  });
}

export async function recordLocalFriendConversationFinished(
  friend: LocalFriendCharacter,
): Promise<LocalFriendCharacter> {
  return updateLocalFriend(friend, (current) => {
    const now = new Date().toISOString();
    return {
      ...current,
      updatedAt: now,
      lastMessageAt: now,
      messageCount: Math.max(0, Math.floor(current.messageCount ?? 0)) + 1,
      conversationCount: Math.max(0, Math.floor(current.conversationCount ?? 0)) + 1,
    };
  });
}

export async function recordLocalFriendMessageRetried(
  friend: LocalFriendCharacter,
  lastUserMessage?: string,
): Promise<LocalFriendCharacter> {
  const trimmedLastUserMessage = lastUserMessage?.trim();
  return updateLocalFriend(friend, (current) => {
    const now = new Date().toISOString();
    const { lastMessageAt: _lastMessageAt, lastUserMessage: _lastUserMessage, ...rest } = current;
    return {
      ...rest,
      updatedAt: now,
      ...(trimmedLastUserMessage
        ? {
            lastMessageAt: now,
            lastUserMessage: trimmedLastUserMessage.slice(0, 500),
          }
        : {}),
      messageCount: Math.max(0, Math.floor(current.messageCount ?? 0) - 1),
    };
  });
}

export async function removeLocalFriends(friendIds: string[]): Promise<void> {
  const ids = new Set(friendIds.map((id) => id.trim()).filter(Boolean));
  if (!ids.size) return;
  const friends = await readLocalFriends();
  await writeLocalFriends(friends.filter((friend) => !ids.has(friend.friendId)));
}

export function mergeFriendLists(
  remoteFriends: LocalFriendCharacter[],
  localFriends: LocalFriendCharacter[],
): LocalFriendCharacter[] {
  const byId = new Map<string, LocalFriendCharacter>();
  localFriends.forEach((friend) => byId.set(friend.friendId, friend));
  remoteFriends.forEach((friend) => byId.set(friend.friendId, friend));
  return [...byId.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function syncLocalFriendsToRemote(): Promise<number> {
  const localFriends = await readLocalFriends();
  if (!localFriends.length) return 0;

  const syncedFriendIds: string[] = [];
  for (const friend of localFriends) {
    try {
      await api.post<FriendsListResponse>('/friends', await buildSyncPayload(friend));
      syncedFriendIds.push(friend.friendId);
    } catch (err: any) {
      console.warn('[Friends] No se pudo sincronizar amigo local:', err?.message || err);
    }
  }

  if (syncedFriendIds.length) {
    await removeLocalFriends(syncedFriendIds);
  }

  return syncedFriendIds.length;
}
