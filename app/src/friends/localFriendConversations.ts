import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  FriendChatPayload,
  FriendConversationFeedback,
  FriendConversationSnapshot,
} from '../hooks/useFriends';

export type LocalFriendChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export type LocalFriendConversationSourcePost = {
  postId?: string;
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  context?: string;
};

export type LocalFriendConversationSnapshot = {
  conversationKey: string;
  friendId: string;
  sourcePost?: LocalFriendConversationSourcePost;
  messages: LocalFriendChatMessage[];
  analysis?: FriendChatPayload | null;
  conversationEnded: boolean;
  conversationFeedback?: FriendConversationFeedback | null;
  updatedAt: string;
};

const LOCAL_FRIEND_CONVERSATION_STORAGE_PREFIX = '@luva/local-friend-conversation:';

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function storageKey(conversationKey: string) {
  return `${LOCAL_FRIEND_CONVERSATION_STORAGE_PREFIX}${hashText(conversationKey)}`;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function sanitizeMessage(input: unknown): LocalFriendChatMessage | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const id = asString(raw.id);
  const role = raw.role === 'user' || raw.role === 'assistant' ? raw.role : undefined;
  const text = asString(raw.text);
  if (!id || !role || !text) return null;
  return { id, role, text };
}

function sanitizeSourcePost(input: unknown): LocalFriendConversationSourcePost | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const raw = input as Record<string, unknown>;
  const post: LocalFriendConversationSourcePost = {
    ...(asString(raw.postId) ? { postId: asString(raw.postId) } : {}),
    ...(asString(raw.imageUrl) ? { imageUrl: asString(raw.imageUrl) } : {}),
    ...(asString(raw.videoUrl) ? { videoUrl: asString(raw.videoUrl) } : {}),
    ...(asString(raw.caption) ? { caption: asString(raw.caption) } : {}),
    ...(asString(raw.context) ? { context: asString(raw.context) } : {}),
  };
  return Object.keys(post).length ? post : undefined;
}

function sanitizeSnapshot(input: unknown): LocalFriendConversationSnapshot | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const raw = input as Record<string, unknown>;
  const conversationKey = asString(raw.conversationKey);
  const friendId = asString(raw.friendId);
  const messages = Array.isArray(raw.messages)
    ? raw.messages
        .map(sanitizeMessage)
        .filter((message): message is LocalFriendChatMessage => !!message)
    : [];
  if (!conversationKey || !friendId || !messages.length) return undefined;

  return {
    conversationKey,
    friendId,
    sourcePost: sanitizeSourcePost(raw.sourcePost),
    messages,
    analysis: raw.analysis && typeof raw.analysis === 'object'
      ? raw.analysis as FriendChatPayload
      : null,
    conversationEnded: Boolean(raw.conversationEnded),
    conversationFeedback: raw.conversationFeedback && typeof raw.conversationFeedback === 'object'
      ? raw.conversationFeedback as FriendConversationFeedback
      : null,
    updatedAt: asString(raw.updatedAt) || new Date().toISOString(),
  };
}

export function buildLocalFriendConversationKey(
  friendId?: string,
  sourcePost?: LocalFriendConversationSourcePost,
) {
  const normalizedFriendId = friendId?.trim() || 'unknown';
  const postId = sourcePost?.postId?.trim() || 'free';
  const contextHash = sourcePost?.context ? hashText(sourcePost.context.trim()) : 'default';
  return `${normalizedFriendId}:${postId}:${contextHash}`;
}

export async function loadLocalFriendConversation(
  conversationKey?: string,
): Promise<LocalFriendConversationSnapshot | undefined> {
  const key = conversationKey?.trim();
  if (!key) return undefined;
  try {
    const raw = await AsyncStorage.getItem(storageKey(key));
    return sanitizeSnapshot(raw ? JSON.parse(raw) : undefined);
  } catch {
    return undefined;
  }
}

export async function listLocalFriendConversations(): Promise<LocalFriendConversationSnapshot[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const conversationKeys = keys.filter((key) => key.startsWith(LOCAL_FRIEND_CONVERSATION_STORAGE_PREFIX));
    if (!conversationKeys.length) return [];
    const entries = await AsyncStorage.multiGet(conversationKeys);
    return entries
      .map(([, value]) => sanitizeSnapshot(value ? JSON.parse(value) : undefined))
      .filter((snapshot): snapshot is LocalFriendConversationSnapshot => !!snapshot)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  } catch {
    return [];
  }
}

export async function getLatestLocalFriendConversationForFriend(
  friendId?: string,
): Promise<LocalFriendConversationSnapshot | undefined> {
  const normalizedFriendId = friendId?.trim();
  if (!normalizedFriendId) return undefined;
  const conversations = await listLocalFriendConversations();
  return conversations.find((snapshot) => snapshot.friendId === normalizedFriendId);
}

export function toFriendConversationSnapshot(
  snapshot: LocalFriendConversationSnapshot,
): FriendConversationSnapshot {
  return {
    messages: snapshot.messages.map((message) => ({
      role: message.role,
      content: message.text,
    })),
    conversationEnded: snapshot.conversationEnded,
    conversationFeedback: snapshot.conversationFeedback ?? null,
    updatedAt: snapshot.updatedAt,
  };
}

export async function saveLocalFriendConversation(
  snapshot: LocalFriendConversationSnapshot,
): Promise<void> {
  const conversationKey = snapshot.conversationKey.trim();
  const friendId = snapshot.friendId.trim();
  if (!conversationKey || !friendId || !snapshot.messages.length) return;

  const sanitized = sanitizeSnapshot({
    ...snapshot,
    conversationKey,
    friendId,
    updatedAt: snapshot.updatedAt || new Date().toISOString(),
  });
  if (!sanitized) return;

  await AsyncStorage.setItem(storageKey(conversationKey), JSON.stringify(sanitized));
}
