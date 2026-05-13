import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';

export type LocalFriendCharacter = {
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

type LocalStoryRequirement = {
  requirementId: string;
  text: string;
};

type LocalStoryMission = {
  missionId: string;
  title: string;
  sceneSummary?: string;
  aiRole: string;
  caracterName?: string;
  characterName?: string;
  caracterPrompt?: string;
  characterPrompt?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  videoIntro?: string;
  videoPreviewUrl?: string;
  videoThumbnailUrl?: string;
  requirements?: LocalStoryRequirement[];
};

type LocalStoryDefinition = {
  storyId: string;
  isInitial?: boolean;
  title: string;
  summary: string;
  level?: string;
  tags?: string[];
  unlockCost?: number;
  missions: LocalStoryMission[];
};

export type LocalAddFriendPayload = {
  storyId?: string;
  missionId?: string;
  sceneIndex?: number;
  storyDefinition?: LocalStoryDefinition;
  missionDefinition?: LocalStoryMission;
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

function buildFriendId(storyId: string, missionId: string) {
  return `${storyId}:${missionId}`;
}

function sanitizeLocalFriend(input: unknown): LocalFriendCharacter | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const friendId = asString(raw.friendId);
  const storyId = asString(raw.storyId);
  const missionId = asString(raw.missionId);
  const sceneIndex = asFiniteNumber(raw.sceneIndex);
  const storyTitle = asString(raw.storyTitle);
  const missionTitle = asString(raw.missionTitle);
  const characterName = asString(raw.characterName);
  const aiRole = asString(raw.aiRole);
  const createdAt = asString(raw.createdAt);
  const updatedAt = asString(raw.updatedAt);

  if (
    !friendId ||
    !storyId ||
    !missionId ||
    sceneIndex === undefined ||
    !storyTitle ||
    !missionTitle ||
    !characterName ||
    !aiRole ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    friendId,
    storyId,
    missionId,
    sceneIndex: Math.max(0, Math.floor(sceneIndex)),
    storyTitle,
    missionTitle,
    characterName,
    aiRole,
    ...(asString(raw.characterPrompt) ? { characterPrompt: asString(raw.characterPrompt) } : {}),
    ...(asString(raw.avatarImageUrl) ? { avatarImageUrl: asString(raw.avatarImageUrl) } : {}),
    ...(asString(raw.avatarImageXsUrl) ? { avatarImageXsUrl: asString(raw.avatarImageXsUrl) } : {}),
    ...(asString(raw.avatarImageMdUrl) ? { avatarImageMdUrl: asString(raw.avatarImageMdUrl) } : {}),
    ...(asString(raw.videoIntro) ? { videoIntro: asString(raw.videoIntro) } : {}),
    ...(asString(raw.videoPreviewUrl) ? { videoPreviewUrl: asString(raw.videoPreviewUrl) } : {}),
    ...(asString(raw.videoThumbnailUrl) ? { videoThumbnailUrl: asString(raw.videoThumbnailUrl) } : {}),
    ...(asString(raw.sceneSummary) ? { sceneSummary: asString(raw.sceneSummary) } : {}),
    createdAt,
    updatedAt,
    ...(asString(raw.lastMessageAt) ? { lastMessageAt: asString(raw.lastMessageAt) } : {}),
    ...(asFiniteNumber(raw.messageCount) !== undefined ? { messageCount: Math.max(0, Math.floor(asFiniteNumber(raw.messageCount)!)) } : {}),
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

function pickMission(payload: LocalAddFriendPayload): LocalStoryMission | undefined {
  if (payload.missionDefinition?.missionId) {
    return payload.missionDefinition;
  }

  const missions = payload.storyDefinition?.missions || [];
  if (payload.missionId) {
    const byId = missions.find((mission) => mission.missionId === payload.missionId);
    if (byId) return byId;
  }

  const sceneIndex = Math.max(0, Math.floor(Number(payload.sceneIndex) || 0));
  return missions[sceneIndex];
}

function buildLocalFriendFromMission(
  payload: LocalAddFriendPayload,
  existing?: LocalFriendCharacter,
): LocalFriendCharacter {
  const mission = pickMission(payload);
  const storyId = asString(payload.storyId) || asString(payload.storyDefinition?.storyId);
  const missionId = asString(payload.missionId) || asString(mission?.missionId);
  const sceneIndex = Math.max(0, Math.floor(Number(payload.sceneIndex) || 0));
  const storyTitle = asString(payload.storyDefinition?.title) || 'Historia';
  const missionTitle = asString(mission?.title);
  const aiRole = asString(mission?.aiRole);

  if (!storyId || !missionId || !missionTitle || !aiRole) {
    throw new Error('No pudimos agregar este personaje a amigos.');
  }

  const now = new Date().toISOString();
  const characterName =
    asString(mission?.caracterName) ||
    asString(mission?.characterName) ||
    missionTitle;
  const characterPrompt = asString(mission?.caracterPrompt) || asString(mission?.characterPrompt);

  return {
    friendId: buildFriendId(storyId, missionId),
    storyId,
    missionId,
    sceneIndex,
    storyTitle,
    missionTitle,
    characterName,
    aiRole,
    ...(characterPrompt ? { characterPrompt } : {}),
    ...(asString(mission?.avatarImageUrl) ? { avatarImageUrl: asString(mission?.avatarImageUrl) } : {}),
    ...(asString(mission?.avatarImageXsUrl) ? { avatarImageXsUrl: asString(mission?.avatarImageXsUrl) } : {}),
    ...(asString(mission?.avatarImageMdUrl) ? { avatarImageMdUrl: asString(mission?.avatarImageMdUrl) } : {}),
    ...(asString(mission?.videoIntro) ? { videoIntro: asString(mission?.videoIntro) } : {}),
    ...(asString(mission?.videoPreviewUrl) ? { videoPreviewUrl: asString(mission?.videoPreviewUrl) } : {}),
    ...(asString(mission?.videoThumbnailUrl) ? { videoThumbnailUrl: asString(mission?.videoThumbnailUrl) } : {}),
    ...(asString(mission?.sceneSummary) ? { sceneSummary: asString(mission?.sceneSummary) } : {}),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...(existing?.lastMessageAt ? { lastMessageAt: existing.lastMessageAt } : {}),
    ...(typeof existing?.messageCount === 'number' ? { messageCount: existing.messageCount } : {}),
    ...(typeof existing?.conversationCount === 'number' ? { conversationCount: existing.conversationCount } : {}),
  };
}

function buildSyncPayload(friend: LocalFriendCharacter): LocalAddFriendPayload {
  const missionDefinition: LocalStoryMission = {
    missionId: friend.missionId,
    title: friend.missionTitle,
    sceneSummary: friend.sceneSummary,
    aiRole: friend.aiRole,
    caracterName: friend.characterName,
    caracterPrompt: friend.characterPrompt,
    avatarImageUrl: friend.avatarImageUrl,
    avatarImageXsUrl: friend.avatarImageXsUrl,
    avatarImageMdUrl: friend.avatarImageMdUrl,
    videoIntro: friend.videoIntro,
    videoPreviewUrl: friend.videoPreviewUrl,
    videoThumbnailUrl: friend.videoThumbnailUrl,
    requirements: [],
  };

  return {
    storyId: friend.storyId,
    missionId: friend.missionId,
    sceneIndex: friend.sceneIndex,
    storyDefinition: {
      storyId: friend.storyId,
      title: friend.storyTitle,
      summary: friend.sceneSummary || friend.missionTitle,
      missions: [missionDefinition],
    },
    missionDefinition,
  };
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
  const friendId = buildFriendId(
    asString(payload.storyId) || asString(payload.storyDefinition?.storyId) || '',
    asString(payload.missionId) || asString(pickMission(payload)?.missionId) || '',
  );
  const existing = friends.find((friend) => friend.friendId === friendId);
  const nextFriend = buildLocalFriendFromMission(payload, existing);
  await writeLocalFriends([
    nextFriend,
    ...friends.filter((friend) => friend.friendId !== nextFriend.friendId),
  ]);
  return nextFriend;
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
      await api.post<FriendsListResponse>('/friends', buildSyncPayload(friend));
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
