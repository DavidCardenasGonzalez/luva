import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';

export type LocalFriendCharacter = {
  friendId: string;
  characterName: string;
  aiRole: string;
  characterPrompt?: string;
  characterSheetImageUrl?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  lastUserMessage?: string;
  messageCount?: number;
  conversationCount?: number;
  affinityPoints?: number;
  friendshipContext?: string;
};

export type LocalAddFriendPayload = {
  characterId: string;
  characterName?: string;
  aiRole?: string;
  characterPrompt?: string;
  characterSheetImageUrl?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  friendshipContext?: string;
  lastMessageAt?: string;
  lastUserMessage?: string;
  messageCount?: number;
  conversationCount?: number;
  conversationSnapshot?: {
    messages: Array<{ role: 'user' | 'assistant'; content: string; imageUrl?: string }>;
    conversationEnded: boolean;
    conversationFeedback?: {
      summary: string;
      improvements: string[];
    } | null;
    updatedAt: string;
  };
};

type SyncFriendResponse = {
  friend?: LocalFriendCharacter;
};

const LOCAL_FRIENDS_STORAGE_KEY = '@luva/local-friends';
const FRIENDSHIP_CONTEXT_MAX_CHARS = 1200;
const FRIENDSHIP_CONTEXT_MAX_PARAGRAPHS = 2;

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

function normalizeFriendshipContext(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const paragraphs = value
    .replace(/\r/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, FRIENDSHIP_CONTEXT_MAX_PARAGRAPHS);
  const normalized = paragraphs.join('\n\n').slice(0, FRIENDSHIP_CONTEXT_MAX_CHARS).trim();
  return normalized || undefined;
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

  const friendshipContext = normalizeFriendshipContext(raw.friendshipContext);

  return {
    friendId,
    characterName,
    aiRole,
    ...(asString(raw.characterPrompt) ? { characterPrompt: asString(raw.characterPrompt) } : {}),
    ...(asString(raw.characterSheetImageUrl) ? { characterSheetImageUrl: asString(raw.characterSheetImageUrl) } : {}),
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
    ...(asFiniteNumber(raw.affinityPoints) !== undefined
      ? { affinityPoints: Math.max(0, Math.floor(asFiniteNumber(raw.affinityPoints)!)) }
      : {}),
    ...(friendshipContext ? { friendshipContext } : {}),
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
  const characterSheetImageUrl =
    asString(payload.characterSheetImageUrl) || existing?.characterSheetImageUrl;
  const friendshipContext = normalizeFriendshipContext(payload.friendshipContext) || existing?.friendshipContext;

  return {
    friendId: characterId,
    characterName,
    aiRole,
    ...(characterPrompt ? { characterPrompt } : {}),
    ...(characterSheetImageUrl ? { characterSheetImageUrl } : {}),
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
    ...(typeof existing?.affinityPoints === 'number' ? { affinityPoints: existing.affinityPoints } : {}),
    ...(friendshipContext ? { friendshipContext } : {}),
  };
}

function buildSyncPayload(friend: LocalFriendCharacter): Record<string, unknown> {
  return {
    characterId: friend.friendId,
    ...(friend.lastMessageAt ? { lastMessageAt: friend.lastMessageAt } : {}),
    ...(friend.lastUserMessage ? { lastUserMessage: friend.lastUserMessage } : {}),
    ...(typeof friend.messageCount === 'number' ? { messageCount: friend.messageCount } : {}),
    ...(typeof friend.conversationCount === 'number' ? { conversationCount: friend.conversationCount } : {}),
    ...(typeof friend.affinityPoints === 'number' ? { affinityPoints: friend.affinityPoints } : {}),
    ...(friend.friendshipContext ? { friendshipContext: friend.friendshipContext } : {}),
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
    affinityPoints: Math.max(0, Math.floor(existing?.affinityPoints ?? friend.affinityPoints ?? 0)),
    ...(friend.friendshipContext || existing?.friendshipContext
      ? { friendshipContext: friend.friendshipContext || existing?.friendshipContext }
      : {}),
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
  affinityPointsEarned?: number,
  friendshipContext?: string,
): Promise<LocalFriendCharacter> {
  const earnedAffinity = Math.max(0, Math.floor(affinityPointsEarned ?? 0));
  const normalizedFriendshipContext = normalizeFriendshipContext(friendshipContext);
  return updateLocalFriend(friend, (current) => {
    const now = new Date().toISOString();
    return {
      ...current,
      updatedAt: now,
      lastMessageAt: now,
      messageCount: Math.max(0, Math.floor(current.messageCount ?? 0)) + 1,
      conversationCount: Math.max(0, Math.floor(current.conversationCount ?? 0)) + 1,
      affinityPoints: Math.max(0, Math.floor(current.affinityPoints ?? 0)) + earnedAffinity,
      ...(normalizedFriendshipContext ? { friendshipContext: normalizedFriendshipContext } : {}),
    };
  });
}

export async function addLocalFriendAffinityPoints(
  friend: LocalFriendCharacter,
  points: number,
): Promise<LocalFriendCharacter> {
  const earnedAffinity = Math.max(0, Math.floor(points || 0));
  return updateLocalFriend(friend, (current) => {
    const now = new Date().toISOString();
    return {
      ...current,
      updatedAt: now,
      affinityPoints: Math.max(0, Math.floor(current.affinityPoints ?? 0)) + earnedAffinity,
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
  remoteFriends.forEach((friend) => {
    const existing = byId.get(friend.friendId);
    if (!existing) {
      byId.set(friend.friendId, friend);
      return;
    }

    const createdAt = isEpochTimestamp(existing.createdAt)
      ? friend.createdAt
      : isEpochTimestamp(friend.createdAt)
      ? existing.createdAt
      : existing.createdAt < friend.createdAt
      ? existing.createdAt
      : friend.createdAt;
    const updatedAt = latestIsoTimestamp(existing.updatedAt, friend.updatedAt) || friend.updatedAt;
    const lastMessageAt = latestIsoTimestamp(existing.lastMessageAt, friend.lastMessageAt);

    byId.set(friend.friendId, {
      ...existing,
      ...friend,
      createdAt,
      updatedAt,
      ...(lastMessageAt ? { lastMessageAt } : {}),
      ...(existing.lastUserMessage || friend.lastUserMessage
        ? { lastUserMessage: friend.lastUserMessage || existing.lastUserMessage }
        : {}),
      messageCount: Math.max(existing.messageCount ?? 0, friend.messageCount ?? 0),
      conversationCount: Math.max(existing.conversationCount ?? 0, friend.conversationCount ?? 0),
      affinityPoints: Math.max(existing.affinityPoints ?? 0, friend.affinityPoints ?? 0),
      ...(friend.friendshipContext || existing.friendshipContext
        ? { friendshipContext: friend.friendshipContext || existing.friendshipContext }
        : {}),
    });
  });
  return [...byId.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function latestIsoTimestamp(...values: Array<string | undefined>): string | undefined {
  return values
    .filter((value): value is string => Boolean(value && Number.isFinite(Date.parse(value))))
    .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
}

export async function syncLocalFriendsToRemote(friendIds?: string[]): Promise<number> {
  const requestedIds = new Set((friendIds || []).map((id) => id.trim()).filter(Boolean));
  const localFriends = (await readLocalFriends()).filter((friend) => {
    return requestedIds.size ? requestedIds.has(friend.friendId) : true;
  });
  if (!localFriends.length) return 0;

  const syncedFriends: LocalFriendCharacter[] = [];
  for (const friend of localFriends) {
    try {
      const response = await api.post<SyncFriendResponse>('/friends', buildSyncPayload(friend));
      syncedFriends.push(response?.friend ? mergeFriendLists([response.friend], [friend])[0] : friend);
    } catch (err: any) {
      console.warn('[Friends] No se pudo sincronizar amigo local:', err?.message || err);
    }
  }

  if (syncedFriends.length) {
    const allFriends = await readLocalFriends();
    const byId = new Map(allFriends.map((friend) => [friend.friendId, friend]));
    syncedFriends.forEach((friend) => {
      const existing = byId.get(friend.friendId);
      byId.set(friend.friendId, existing ? mergeFriendLists([friend], [existing])[0] : friend);
    });
    await writeLocalFriends([...byId.values()]);
  }

  return syncedFriends.length;
}
