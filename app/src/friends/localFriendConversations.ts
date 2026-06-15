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
  imageUri?: string;
  imageUrl?: string;
  imagePrompt?: string;
  sceneNarration?: string;
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
  title?: string;
  sourcePost?: LocalFriendConversationSourcePost;
  messages: LocalFriendChatMessage[];
  analysis?: FriendChatPayload | null;
  conversationEnded: boolean;
  conversationFeedback?: FriendConversationFeedback | null;
  startedAt?: string;
  endedAt?: string;
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

function asTimestamp(value: unknown): string | undefined {
  const raw = asString(value);
  if (!raw || !Number.isFinite(Date.parse(raw))) return undefined;
  return new Date(raw).toISOString();
}

function sanitizeMessage(input: unknown): LocalFriendChatMessage | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const id = asString(raw.id);
  const role = raw.role === 'user' || raw.role === 'assistant' ? raw.role : undefined;
  const text = asString(raw.text) || '';
  const imageUri = asString(raw.imageUri);
  const imageUrl = asString(raw.imageUrl);
  const imagePrompt = imageUrl ? asString(raw.imagePrompt) : undefined;
  const sceneNarration = asString(raw.sceneNarration);
  if (!id || !role || (!text && !imageUri && !imageUrl)) return null;
  return {
    id,
    role,
    text,
    ...(imageUri ? { imageUri } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(imagePrompt ? { imagePrompt } : {}),
    ...(role === 'assistant' && sceneNarration ? { sceneNarration } : {}),
  };
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
    ...(asString(raw.title) ? { title: asString(raw.title) } : {}),
    sourcePost: sanitizeSourcePost(raw.sourcePost),
    messages,
    analysis: raw.analysis && typeof raw.analysis === 'object'
      ? raw.analysis as FriendChatPayload
      : null,
    conversationEnded: Boolean(raw.conversationEnded),
    conversationFeedback: raw.conversationFeedback && typeof raw.conversationFeedback === 'object'
      ? raw.conversationFeedback as FriendConversationFeedback
      : null,
    ...(asTimestamp(raw.startedAt) ? { startedAt: asTimestamp(raw.startedAt) } : {}),
    ...(asTimestamp(raw.endedAt) ? { endedAt: asTimestamp(raw.endedAt) } : {}),
    updatedAt: asTimestamp(raw.updatedAt) || new Date().toISOString(),
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

export async function listLocalFriendConversationsForFriend(
  friendId?: string,
): Promise<LocalFriendConversationSnapshot[]> {
  const normalizedFriendId = friendId?.trim();
  if (!normalizedFriendId) return [];
  const conversations = await listLocalFriendConversations();
  return conversations.filter((snapshot) => snapshot.friendId === normalizedFriendId);
}

export async function getLatestLocalFriendConversationForFriend(
  friendId?: string,
): Promise<LocalFriendConversationSnapshot | undefined> {
  const normalizedFriendId = friendId?.trim();
  if (!normalizedFriendId) return undefined;
  const conversations = await listLocalFriendConversations();
  return conversations.find((snapshot) => snapshot.friendId === normalizedFriendId);
}

export function buildLocalFriendConversationTitle(
  snapshot: Pick<LocalFriendConversationSnapshot, 'title' | 'sourcePost' | 'messages'>,
  friendName?: string,
): string {
  const explicitTitle = snapshot.title?.trim();
  if (explicitTitle) return explicitTitle;

  const caption = snapshot.sourcePost?.caption?.trim();
  if (caption) {
    return caption.length > 58 ? `${caption.slice(0, 55).trim()}...` : caption;
  }

  const firstUserMessage = snapshot.messages.find((message) => message.role === 'user');
  const firstText = firstUserMessage?.text.trim();
  if (firstText) {
    return firstText.length > 58 ? `${firstText.slice(0, 55).trim()}...` : firstText;
  }

  if (firstUserMessage?.imageUri || firstUserMessage?.imageUrl) {
    return friendName ? `Foto con ${friendName}` : 'Charla con foto';
  }

  return friendName ? `Charla con ${friendName}` : 'Charla guardada';
}

export function toFriendConversationSnapshot(
  snapshot: LocalFriendConversationSnapshot,
): FriendConversationSnapshot {
  return {
    messages: snapshot.messages.map((message) => ({
      role: message.role,
      content: message.text || (message.imageUri || message.imageUrl ? '[Photo]' : ''),
      ...(message.imageUrl ? { imageUrl: message.imageUrl } : {}),
      ...(message.imageUrl && message.imagePrompt ? { imagePrompt: message.imagePrompt } : {}),
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

export async function archiveLocalFriendConversation(
  snapshot: LocalFriendConversationSnapshot,
): Promise<LocalFriendConversationSnapshot | undefined> {
  const endedAt = snapshot.endedAt || new Date().toISOString();
  const archivedKey = `${snapshot.conversationKey}:ended:${hashText(`${endedAt}:${snapshot.messages.length}`)}`;
  const archivedSnapshot: LocalFriendConversationSnapshot = {
    ...snapshot,
    conversationKey: archivedKey,
    conversationEnded: true,
    endedAt,
    updatedAt: endedAt,
  };

  await saveLocalFriendConversation(archivedSnapshot);
  if (archivedKey !== snapshot.conversationKey) {
    await deleteLocalFriendConversation(snapshot.conversationKey);
  }
  return loadLocalFriendConversation(archivedKey);
}

export async function deleteLocalFriendConversation(conversationKey?: string): Promise<void> {
  const key = conversationKey?.trim();
  if (!key) return;
  await AsyncStorage.removeItem(storageKey(key));
}
