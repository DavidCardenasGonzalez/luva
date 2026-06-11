import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  KeyboardAvoidingView,
  Modal,
  NativeTouchEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import { RootStackParamList } from '../navigation/AppNavigator';
import CoinCountChip from '../components/CoinCountChip';
import StoryMessageComposer, { StoryFlowState } from '../components/StoryMessageComposer';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/api';
import { shouldRecordLikes } from '../config/likeRecording';
import { RECORDING_COST, useCoins } from '../purchases/CoinBalanceProvider';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import {
  finishFriendChat,
  FriendAffinityUpdate,
  FriendChatPayload,
  FriendConversationFeedback,
  FriendConversationSnapshot,
  getFriendPhoto,
  requestFriendPhoto,
  retryFriendChatMessage,
  sendFriendChatMessage,
  useFriends,
} from '../hooks/useFriends';
import { buildAffinityUpdate, getAffinityProgress } from '../friends/affinity';
import { AffinityGainBar } from '../components/AffinityBar';
import {
  archiveLocalFriendConversation,
  buildLocalFriendConversationTitle,
  buildLocalFriendConversationKey,
  deleteLocalFriendConversation,
  loadLocalFriendConversation,
  saveLocalFriendConversation,
} from '../friends/localFriendConversations';
import {
  getLocalFriend,
  recordLocalFriendConversationFinished,
  recordLocalFriendMessageRetried,
  recordLocalFriendMessageSent,
} from '../friends/localFriends';
import { getChatAvatar } from '../chatimages/chatAvatarMap';
import { readStoredEnglishDifficulty } from '../auth/englishDifficulty';
import type { EnglishDifficulty } from '../auth/AuthProvider';
import {
  getOnboardingDraftProgress,
  hasCompletedOnboarding,
  saveOnboardingDraftProgress,
} from '../onboarding/model/progress';
import {
  AI_CONVERSATION_POINTS_PER_MESSAGE,
  recordJourneyAiConversationMessageSent,
} from '../progress/journeyProgress';
import { trackMixpanelFriendEvent } from '../marketing/mixpanelEvents';
import { trackMetaFriendChatStarted } from '../marketing/metaAppEvents';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendChat'>;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUri?: string;
  imageUrl?: string;
};

function messagesFromRemoteConversation(snapshot?: FriendConversationSnapshot | null): ChatMessage[] {
  const messages = Array.isArray(snapshot?.messages) ? snapshot.messages : [];
  return messages
    .map((message, index) => {
      const text = typeof message.content === 'string' ? message.content.trim() : '';
      const imageUrl = typeof message.imageUrl === 'string' ? message.imageUrl.trim() : '';
      if ((!text && !imageUrl) || (message.role !== 'user' && message.role !== 'assistant')) {
        return null;
      }
      return {
        id: `remote-${index}-${message.role}`,
        role: message.role,
        text,
        ...(imageUrl ? { imageUrl } : {}),
      };
    })
    .filter((message): message is ChatMessage => !!message);
}

function isFinishedConversationWithFeedback(
  snapshot?: Pick<FriendConversationSnapshot, 'conversationEnded' | 'conversationFeedback'> | null,
) {
  return Boolean(snapshot?.conversationEnded && snapshot.conversationFeedback);
}

type TranslationResponse = {
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage: string;
};

type FriendAssistanceResponse = {
  answer: string;
};

type MessageTranslationState = {
  text?: string;
  loading?: boolean;
  error?: string;
};

type FriendChatSourcePost = {
  postId?: string;
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  context?: string;
};

const FRIEND_CHAT_MESSAGE_COST = 1;
const FRIEND_CHAT_VOICE_TOTAL_COST = FRIEND_CHAT_MESSAGE_COST + RECORDING_COST;
const FRIEND_IMAGE_POLL_INTERVAL_MS = 2500;
const FRIEND_IMAGE_POLL_TIMEOUT_MS = 120000;
const FRIEND_CHAT_DRAFT_STORAGE_PREFIX = '@luva/friend-chat/draft';

function friendChatDraftStorageKey(conversationKey: string) {
  return `${FRIEND_CHAT_DRAFT_STORAGE_PREFIX}:${conversationKey}`;
}

function formatJourneyPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

function removeLastUserExchange(currentMessages: ChatMessage[]): {
  nextMessages: ChatMessage[];
  removedMessages: ChatMessage[];
} | null {
  const lastUserIndex = currentMessages.map((message) => message.role).lastIndexOf('user');
  if (lastUserIndex < 0) return null;
  const removeThroughIndex =
    currentMessages[lastUserIndex + 1]?.role === 'assistant'
      ? lastUserIndex + 2
      : lastUserIndex + 1;
  return {
    nextMessages: [
      ...currentMessages.slice(0, lastUserIndex),
      ...currentMessages.slice(removeThroughIndex),
    ],
    removedMessages: currentMessages.slice(lastUserIndex, removeThroughIndex),
  };
}

function messagesToHistoryPayload(currentMessages: ChatMessage[]) {
  return currentMessages
    .map((message) => {
      const content = message.text.trim() || (message.imageUri || message.imageUrl ? '[Photo]' : '');
      if (!content && !message.imageUrl) return null;
      return {
        role: message.role,
        content,
        ...(message.imageUrl ? { imageUrl: message.imageUrl } : {}),
      };
    })
    .filter(
      (message): message is { role: 'user' | 'assistant'; content: string; imageUrl?: string } =>
        Boolean(message)
    );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getTouchDistance(touches: NativeTouchEvent[]) {
  if (touches.length < 2) {
    return 0;
  }

  const [first, second] = touches;
  const dx = first.pageX - second.pageX;
  const dy = first.pageY - second.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function clampImageScale(value: number) {
  return Math.max(1, Math.min(6, value));
}

function ZoomableChatImage({ uri }: { uri: string }) {
  const [scale, setScale] = useState(1);
  const baseScaleRef = useRef(1);
  const startDistanceRef = useRef(0);

  useEffect(() => {
    setScale(1);
    baseScaleRef.current = 1;
    startDistanceRef.current = 0;
  }, [uri]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length > 1,
        onMoveShouldSetPanResponder: (event) => event.nativeEvent.touches.length > 1,
        onPanResponderGrant: (event) => {
          startDistanceRef.current = getTouchDistance(event.nativeEvent.touches);
          baseScaleRef.current = scale;
        },
        onPanResponderMove: (event) => {
          const distance = getTouchDistance(event.nativeEvent.touches);
          if (!distance || !startDistanceRef.current) {
            return;
          }

          setScale(clampImageScale(baseScaleRef.current * (distance / startDistanceRef.current)));
        },
        onPanResponderRelease: () => {
          baseScaleRef.current = scale;
          startDistanceRef.current = 0;
        },
        onPanResponderTerminate: () => {
          baseScaleRef.current = scale;
          startDistanceRef.current = 0;
        },
      }),
    [scale]
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        flex: 1,
        overflow: 'hidden',
        backgroundColor: '#020617',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%', transform: [{ scale }] }}
        resizeMode="contain"
      />
      {scale > 1 ? (
        <Pressable
          onPress={() => {
            setScale(1);
            baseScaleRef.current = 1;
            startDistanceRef.current = 0;
          }}
          style={({ pressed }) => ({
            position: 'absolute',
            left: 16,
            top: 16,
            width: 40,
            height: 40,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? 'rgba(15, 23, 42, 0.94)' : 'rgba(15, 23, 42, 0.78)',
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.18)',
          })}
        >
          <MaterialIcons name="zoom-out-map" size={18} color="white" />
        </Pressable>
      ) : null}
    </View>
  );
}

const COLORS = {
  header: '#0b1224',
  background: '#f8fafc',
  border: '#e2e8f0',
  userBubble: '#4f46e5',
  assistantText: '#0f172a',
  muted: '#475569',
  helpAccent: '#a5f3fc',
};

const luviImage = require('../image/luvi.png');
const luviLoadingGif = require('../image/luvi-loading.gif');

function AnalysisCard({
  analysis,
  onRetry,
  retryDisabled,
  englishDifficulty,
}: {
  analysis: FriendChatPayload;
  onRetry?: () => void | Promise<void>;
  retryDisabled?: boolean;
  englishDifficulty?: EnglishDifficulty;
}) {
  console.log('Rendering AnalysisCard with analysis:', englishDifficulty);
  const isEasy = englishDifficulty === 'easy';
  const isTranslationHelp = analysis.feedbackType === 'translation_help';
  const canRetry = !isEasy && analysis.result !== 'correct' && !!onRetry;
  return (
    <View
      style={{
        marginTop: 16,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      {isEasy ? null : (
        <Text style={{ fontWeight: '700', color: '#1e293b' }}>
          Correctness: {analysis.correctness}% ({analysis.result === 'correct' ? 'Correcto' : analysis.result === 'partial' ? 'Parcial' : 'Incorrecto'})
        </Text>
      )}
      {analysis.errors.length ? (
        <View style={{ marginTop: isEasy ? 0 : 10 }}>
          <Text
            style={{
              fontWeight: '600',
              color: isEasy || isTranslationHelp ? '#2563eb' : '#dc2626',
              marginBottom: 4,
            }}
          >
            {isEasy || isTranslationHelp ? 'Cómo decirlo en inglés' : 'Errores detectados'}
          </Text>
          {analysis.errors.map((errText, index) => (
            <Text
              key={`${errText}-${index}`}
              style={{ color: isEasy || isTranslationHelp ? '#1f2937' : '#dc2626', marginBottom: 2 }}
            >
              - {errText}
            </Text>
          ))}
        </View>
      ) : isEasy ? null : (
        <Text style={{ color: '#15803d', marginTop: 8 }}>Tu mensaje sonó natural.</Text>
      )}
      {analysis.reformulations.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: '600', color: '#2563eb', marginBottom: 4 }}>Reformulaciones sugeridas</Text>
          {analysis.reformulations.map((line, index) => (
            <Text key={`${line}-${index}`} style={{ color: '#1f2937', marginBottom: 2 }}>
              - {line}
            </Text>
          ))}
        </View>
      ) : null}
      {canRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reintentar último mensaje"
          onPress={onRetry}
          disabled={retryDisabled}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginTop: 14,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 999,
            backgroundColor: retryDisabled
              ? '#e2e8f0'
              : pressed
              ? '#1d4ed8'
              : '#2563eb',
            opacity: retryDisabled ? 0.65 : 1,
          })}
        >
          <MaterialIcons name="replay" size={18} color="white" />
          <Text style={{ color: 'white', fontWeight: '900' }}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function CompletionCard({
  feedback,
  friendName,
  pointsEarned,
  affinity,
}: {
  feedback: FriendConversationFeedback | null;
  friendName: string;
  pointsEarned: number;
  affinity: FriendAffinityUpdate | null;
}) {
  return (
    <View
      style={{
        marginTop: 16,
        padding: 16,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbf7d0',
      }}
    >
      <Text style={{ fontWeight: '800', color: '#15803d' }}>Conversación terminada</Text>
      <Text style={{ marginTop: 6, color: '#166534', lineHeight: 20 }}>
        Terminaste tu práctica con {friendName}. Esta conversación quedó marcada como terminada.
      </Text>
      <View
        style={{
          alignSelf: 'flex-start',
          marginTop: 10,
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: '#dcfce7',
          borderWidth: 1,
          borderColor: '#86efac',
        }}
      >
        <Text style={{ color: '#166534', fontWeight: '900' }}>
          +{formatJourneyPoints(pointsEarned)} punto{pointsEarned === 1 ? '' : 's'} de Conversación AI
        </Text>
      </View>
      {affinity ? (
        <View
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#fbcfe8',
          }}
        >
          <Text style={{ fontWeight: '800', color: '#9d174d', marginBottom: 8 }}>
            Tu amistad con {friendName}
          </Text>
          <AffinityGainBar affinity={affinity} variant="light" />
        </View>
      ) : null}
      {feedback ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ fontWeight: '700', color: '#14532d' }}>Feedback general</Text>
          {feedback.summary ? (
            <Text style={{ marginTop: 6, color: '#166534', lineHeight: 20 }}>{feedback.summary}</Text>
          ) : null}
          {feedback.improvements.length ? (
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: '700', color: '#166534', marginBottom: 4 }}>Puntos a mejorar</Text>
              {feedback.improvements.map((item, index) => (
                <Text key={`${item}-${index}`} style={{ color: '#166534', marginBottom: 2, lineHeight: 20 }}>
                  - {item}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={{ marginTop: 10, color: '#166534' }}>
          El feedback general aparecerá aquí cuando esté disponible.
        </Text>
      )}
    </View>
  );
}

function SourcePostCard({
  post,
  friendName,
  affinityLabel,
}: {
  post: FriendChatSourcePost;
  friendName: string;
  affinityLabel: string;
}) {
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ color: COLORS.helpAccent, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
        {affinityLabel}
      </Text>
      <Text style={{ color: '#1e293b', fontWeight: '800', marginTop: 4 }} numberOfLines={1}>
        {friendName}
      </Text>
      {post.imageUrl ? (
        <View style={{ marginTop: 12 }}>
          <Image
            source={{ uri: post.imageUrl }}
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: 10,
              backgroundColor: '#e2e8f0',
            }}
            resizeMode="cover"
          />
          {post.videoUrl ? (
            <View
              style={{
                position: 'absolute',
                right: 10,
                bottom: 10,
                width: 32,
                height: 32,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.72)',
              }}
            >
              <MaterialIcons name="play-arrow" size={22} color="white" />
            </View>
          ) : null}
        </View>
      ) : null}
      {post.caption ? (
        <Text style={{ color: COLORS.muted, lineHeight: 20, marginTop: 10 }} numberOfLines={5}>
          {post.caption}
        </Text>
      ) : null}
    </View>
  );
}

export default function FriendChatScreen({ navigation, route }: Props) {
  const friendId = route.params?.friendId;
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { isSignedIn } = useAuth();
  const { friends, loading, loaded, error, reload } = useFriends();
  const { canSpend, spendCoins, loading: coinsLoading, isUnlimited, balance } = useCoins();
  const friend = useMemo(
    () => friends.find((item) => item.friendId === friendId),
    [friendId, friends]
  );
  const sourcePost = useMemo<FriendChatSourcePost | undefined>(() => {
    const postId = route.params?.postId?.trim();
    const imageUrl = route.params?.postImageUrl?.trim();
    const videoUrl = route.params?.postVideoUrl?.trim();
    const caption = route.params?.postCaption?.trim();
    const context = route.params?.postContext?.trim() || caption;
    if (!postId && !imageUrl && !videoUrl && !caption && !context) {
      return undefined;
    }
    return {
      ...(postId ? { postId } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(videoUrl ? { videoUrl } : {}),
      ...(caption ? { caption } : {}),
      ...(context ? { context } : {}),
    };
  }, [
    route.params?.postCaption,
    route.params?.postContext,
    route.params?.postId,
    route.params?.postImageUrl,
    route.params?.postVideoUrl,
  ]);
  const chatContextKey = `${friendId || ''}:${sourcePost?.postId || ''}:${sourcePost?.context || ''}`;
  const localConversationKey = useMemo(
    () => buildLocalFriendConversationKey(friendId, sourcePost),
    [friendId, sourcePost]
  );
  const draftStorageKey = useMemo(
    () => friendChatDraftStorageKey(localConversationKey),
    [localConversationKey]
  );
  const trackedFriendFocusKeyRef = useRef<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageTranslations, setMessageTranslations] = useState<Record<string, MessageTranslationState>>({});
  const [analysis, setAnalysis] = useState<FriendChatPayload | null>(null);
  const [englishDifficulty, setEnglishDifficulty] = useState<EnglishDifficulty | undefined>(undefined);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [conversationFeedback, setConversationFeedback] = useState<FriendConversationFeedback | null>(null);
  const [conversationStartedAt, setConversationStartedAt] = useState(() => new Date().toISOString());
  const [affinityUpdate, setAffinityUpdate] = useState<FriendAffinityUpdate | null>(null);
  const affinityStatusLabel = useMemo(() => {
    const affinity = getAffinityProgress(affinityUpdate?.totalPoints ?? friend?.affinityPoints);
    return `${affinity.levelName}`;
  }, [affinityUpdate?.totalPoints, friend?.affinityPoints]);
  const [completionConfettiKey, setCompletionConfettiKey] = useState<number | null>(null);
  const [flowState, setFlowState] = useState<StoryFlowState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [endingConversation, setEndingConversation] = useState(false);
  const [retryingLastExchange, setRetryingLastExchange] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [photoRequestMode, setPhotoRequestMode] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [selectedChatImageUri, setSelectedChatImageUri] = useState<string | null>(null);
  const [assistanceQuestion, setAssistanceQuestion] = useState('');
  const [assistanceAnswer, setAssistanceAnswer] = useState('');
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [assistanceError, setAssistanceError] = useState<string | null>(null);
  const [keyboardAvoiderKey, setKeyboardAvoiderKey] = useState(0);
  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const scrollRef = useRef<ScrollView>(null);
  const isStartingRecording = useRef(false);
  const stopRequestedWhileStarting = useRef(false);
  const skipExitPromptRef = useRef(false);
  const autoSentDraftKeyRef = useRef<string | undefined>(undefined);
  const likeRecordedForPostRef = useRef<string | undefined>(undefined);
  const remoteHydratedKeyRef = useRef<string | undefined>(undefined);

  const avatarSource = useMemo(() => {
    if (!friend) return undefined;
    const avatarUrl = (friend.avatarImageXsUrl || friend.avatarImageUrl)?.trim();
    return avatarUrl
      ? { uri: avatarUrl }
      : getChatAvatar(friend.friendId);
  }, [friend]);
  const largeAvatarSource = useMemo(() => {
    if (!friend) return undefined;
    const avatarUrl = (
      friend.avatarImageUrl ||
      friend.avatarImageMdUrl ||
      friend.avatarImageXsUrl
    )?.trim();
    return avatarUrl
      ? { uri: avatarUrl }
      : getChatAvatar(friend.friendId);
  }, [friend]);
  const avatarInitial = (friend?.characterName.trim().charAt(0) || '?').toUpperCase();
  const headerTopPadding = Math.max(insets.top, 48) + 10;
  const hasStartedConversation = useMemo(
    () => messages.some((message) => message.role === 'user'),
    [messages]
  );
  const aiConversationPoints = useMemo(
    () => messages.filter((message) => message.role === 'user').length * AI_CONVERSATION_POINTS_PER_MESSAGE,
    [messages]
  );
  const scrollChatToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const updateComposerText = useCallback(
    (nextText: string) => {
      setComposerText(nextText);
      const trimmed = nextText.trim();
      const write = trimmed
        ? AsyncStorage.setItem(draftStorageKey, nextText)
        : AsyncStorage.removeItem(draftStorageKey);
      void write.catch((err: any) => {
        console.warn('[FriendChat] No se pudo guardar el borrador:', err?.message || err);
      });
    },
    [draftStorageKey]
  );

  const clearComposerDraft = useCallback(() => {
    setComposerText('');
    void AsyncStorage.removeItem(draftStorageKey).catch((err: any) => {
      console.warn('[FriendChat] No se pudo borrar el borrador:', err?.message || err);
    });
  }, [draftStorageKey]);

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    let mounted = true;
    setComposerText('');
    void AsyncStorage.getItem(draftStorageKey)
      .then((storedDraft) => {
        if (!mounted || !storedDraft) return;
        setComposerText(storedDraft);
      })
      .catch((err: any) => {
        console.warn('[FriendChat] No se pudo cargar el borrador:', err?.message || err);
      });
    return () => {
      mounted = false;
    };
  }, [draftStorageKey]);

  useEffect(() => {
    let mounted = true;
    void readStoredEnglishDifficulty().then((value) => {
      if (mounted) setEnglishDifficulty(value);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (friendId) {
      void reload();
    }
  }, [friendId, reload]);

  useEffect(() => {
    if (!isFocused) {
      trackedFriendFocusKeyRef.current = undefined;
      return;
    }
    if (!friend || trackedFriendFocusKeyRef.current === chatContextKey) return;
    trackedFriendFocusKeyRef.current = chatContextKey;
    void trackMixpanelFriendEvent('friend_chat_viewed', {
      friend_id: friend.friendId,
      character_id: friend.friendId,
      character_name: friend.characterName,
      post_id: sourcePost?.postId,
      source: sourcePost ? 'profile_post' : 'friend_chat',
      conversation_count: friend.conversationCount ?? 0,
      message_count: friend.messageCount ?? 0,
    });
  }, [chatContextKey, friend, isFocused, sourcePost]);

  useEffect(() => {
    let mounted = true;
    remoteHydratedKeyRef.current = undefined;
    skipExitPromptRef.current = false;
    setMessages([]);
    setMessageTranslations({});
    setAnalysis(null);
    setConversationEnded(false);
    setConversationFeedback(null);
    setConversationStartedAt(new Date().toISOString());
    setAffinityUpdate(null);
    setCompletionConfettiKey(null);
    setErrorMessage(null);

    void loadLocalFriendConversation(localConversationKey).then((snapshot) => {
      if (!mounted || !snapshot) return;
      if (isFinishedConversationWithFeedback(snapshot)) {
        void archiveLocalFriendConversation(snapshot);
        return;
      }
      setConversationStartedAt(snapshot.startedAt || snapshot.updatedAt);
      setMessages(snapshot.messages);
      setAnalysis(snapshot.analysis ?? null);
      setConversationEnded(Boolean(snapshot.conversationEnded));
      setConversationFeedback(snapshot.conversationFeedback ?? null);
    });

    return () => {
      mounted = false;
    };
  }, [chatContextKey, localConversationKey]);

  useEffect(() => {
    if (remoteHydratedKeyRef.current === localConversationKey) return;
    if (messages.length > 0) {
      remoteHydratedKeyRef.current = localConversationKey;
      return;
    }
    if (isFinishedConversationWithFeedback(friend?.conversationSnapshot)) {
      remoteHydratedKeyRef.current = localConversationKey;
      return;
    }
    const remoteMessages = messagesFromRemoteConversation(friend?.conversationSnapshot);
    if (!remoteMessages.length) return;
    remoteHydratedKeyRef.current = localConversationKey;
    setMessages(remoteMessages);
    setConversationEnded(Boolean(friend?.conversationSnapshot?.conversationEnded));
    setConversationFeedback(friend?.conversationSnapshot?.conversationFeedback ?? null);
  }, [friend?.conversationSnapshot, localConversationKey, messages.length]);

  const persistConversationSnapshot = useCallback(
    async ({
      nextMessages,
      nextAnalysis = analysis,
      nextConversationEnded = conversationEnded,
      nextConversationFeedback = conversationFeedback,
    }: {
      nextMessages: ChatMessage[];
      nextAnalysis?: FriendChatPayload | null;
      nextConversationEnded?: boolean;
      nextConversationFeedback?: FriendConversationFeedback | null;
    }) => {
      if (!friendId || !nextMessages.length) return;
      try {
        const endedAt = nextConversationEnded ? new Date().toISOString() : undefined;
        const title = buildLocalFriendConversationTitle(
          {
            sourcePost,
            messages: nextMessages,
          },
          friend?.characterName,
        );
        await saveLocalFriendConversation({
          conversationKey: localConversationKey,
          friendId,
          title,
          sourcePost,
          messages: nextMessages,
          analysis: nextAnalysis,
          conversationEnded: Boolean(nextConversationEnded),
          conversationFeedback: nextConversationFeedback ?? null,
          startedAt: conversationStartedAt,
          ...(endedAt ? { endedAt } : {}),
          updatedAt: endedAt || new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn('[FriendChat] No se pudo guardar la conversación local:', err?.message || err);
      }
    },
    [
      analysis,
      conversationEnded,
      conversationFeedback,
      conversationStartedAt,
      friend?.characterName,
      friendId,
      localConversationKey,
      sourcePost,
    ]
  );

  const handleRetryLastExchange = useCallback(async () => {
    if (!friendId) return;
    if (conversationEnded) {
      setErrorMessage('Esta conversación ya terminó.');
      return;
    }
    if (flowState !== 'idle' || retryingLastExchange) {
      setErrorMessage('Espera a que termine el análisis antes de reintentar.');
      return;
    }

    const retryState = removeLastUserExchange(messages);
    if (!retryState) {
      setErrorMessage('No encontramos un mensaje para reintentar.');
      return;
    }

    const { nextMessages, removedMessages } = retryState;
    const lastUserMessage = [...nextMessages].reverse().find((message) => message.role === 'user')?.text;
    remoteHydratedKeyRef.current = localConversationKey;
    setErrorMessage(null);
    setAnalysis(null);
    setConversationEnded(false);
    setConversationFeedback(null);
    setAffinityUpdate(null);
    setMessages(nextMessages);
    setRetryingLastExchange(true);
    setMessageTranslations((current) => {
      const next = { ...current };
      removedMessages.forEach((message) => {
        delete next[message.id];
      });
      return next;
    });

    try {
      if (nextMessages.length) {
        await persistConversationSnapshot({
          nextMessages,
          nextAnalysis: null,
          nextConversationEnded: false,
          nextConversationFeedback: null,
        });
      } else {
        await deleteLocalFriendConversation(localConversationKey);
      }

      const historyPayload = messagesToHistoryPayload(nextMessages);
      if (isSignedIn) {
        await retryFriendChatMessage(friendId, { history: historyPayload });
      }
      if (friend) {
        await recordLocalFriendMessageRetried(friend, lastUserMessage);
      }
      await reload();
    } catch (err: any) {
      console.warn('[FriendChat] No se pudo sincronizar el retry:', err?.message || err);
    } finally {
      setRetryingLastExchange(false);
    }

    void trackMixpanelFriendEvent('friend_chat_message_retry', {
      friend_id: friendId,
      character_name: friend?.characterName,
      character_id: friend?.friendId,
      post_id: sourcePost?.postId,
      remaining_message_count: nextMessages.length,
      removed_message_count: removedMessages.length,
    });
  }, [
    conversationEnded,
    flowState,
    friend,
    friendId,
    isSignedIn,
    localConversationKey,
    messages,
    persistConversationSnapshot,
    reload,
    retryingLastExchange,
    sourcePost?.postId,
  ]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollChatToEnd();
    }
  }, [messages.length, scrollChatToEnd]);

  useEffect(() => {
    if (!conversationEnded) return;
    scrollChatToEnd();
  }, [conversationEnded, conversationFeedback, affinityUpdate, scrollChatToEnd]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleEndConversationRef = useRef<() => void>(() => {});

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (skipExitPromptRef.current) return;
      if (!hasStartedConversation || conversationEnded) return;
      event.preventDefault();
      Alert.alert(
        '¿Quieres terminar la conversación?',
        `Antes de salir puedes recibir feedback sobre tu práctica con ${friend?.characterName || 'tu amigo'}.`,
        [
          { text: 'Seguir hablando', style: 'cancel' },
          {
            text: 'Salir sin feedback',
            style: 'destructive',
            onPress: () => {
              skipExitPromptRef.current = true;
              navigation.dispatch(event.data.action);
            },
          },
          {
            text: 'Recibir feedback',
            onPress: () => {
              handleEndConversationRef.current();
            },
          },
        ]
      );
    });
    return unsubscribe;
  }, [conversationEnded, friend?.characterName, hasStartedConversation, navigation]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setKeyboardAvoiderKey((prev) => prev + 1);
        return;
      }
      if (nextState !== 'background') {
        return;
      }
      if (!isStartingRecording.current && !recorder.isRecording()) {
        return;
      }
      stopRequestedWhileStarting.current = false;
      isStartingRecording.current = false;
      setFlowState('idle');
      void recorder.cancel().catch((cancelErr) => {
        console.warn('Friend recorder cleanup on app state change failed', cancelErr);
      });
    });
    return () => sub.remove();
  }, [recorder]);

  const handleOpenAssistance = useCallback(() => {
    void trackMixpanelFriendEvent('friend_chat_help_opened', {
      friend_id: friend?.friendId,
      character_name: friend?.characterName,
      character_id: friend?.friendId,
      post_id: sourcePost?.postId,
      history_message_count: messages.length,
    });
    setAssistanceQuestion('');
    setAssistanceAnswer('');
    setAssistanceError(null);
    setShowAssistanceModal(true);
  }, [friend, messages.length, sourcePost?.postId]);

  const handleEndConversation = useCallback(async () => {
    if (!friendId) return;
    if (conversationEnded) return;
    if (endingConversation) return;
    if (flowState !== 'idle') return;
    setErrorMessage(null);
    setEndingConversation(true);
    setFlowState('evaluating');
    try {
      void trackMixpanelFriendEvent('friend_chat_end_requested', {
        friend_id: friendId,
        character_name: friend?.characterName,
        character_id: friend?.friendId,
        post_id: sourcePost?.postId,
        history_message_count: messages.length,
      });
      const historyPayload = messagesToHistoryPayload(messages);
      const currentDifficulty = await readStoredEnglishDifficulty();
      setEnglishDifficulty(currentDifficulty);
      const payload = await finishFriendChat(
        friendId,
        {
          ...(sourcePost?.postId ? { postId: sourcePost.postId } : {}),
          englishDifficulty: currentDifficulty,
          ...(friend?.friendshipContext ? { friendshipContext: friend.friendshipContext } : {}),
          history: historyPayload,
        },
        { anonymous: !isSignedIn },
      );
      setConversationEnded(true);
      setConversationFeedback(payload.conversationFeedback ?? null);
      let affinity = payload.affinity ?? null;
      if (affinity && !isSignedIn) {
        // Anonymous users accumulate affinity locally; rebuild totals from local points.
        affinity = buildAffinityUpdate(
          friend?.affinityPoints ?? 0,
          affinity.pointsEarned,
          affinity.qualityMultiplier,
        );
      } else if (affinity && isSignedIn && friendId) {
        // Signed-in: the backend provides totalPoints, but may not be deployed yet.
        // Use local cache as a floor so the animation reflects accumulated progress.
        const localFriend = await getLocalFriend(friendId);
        const localPrev = localFriend?.affinityPoints ?? 0;
        if (localPrev + affinity.pointsEarned > affinity.totalPoints) {
          affinity = buildAffinityUpdate(localPrev, affinity.pointsEarned, affinity.qualityMultiplier);
        }
      }
      setAffinityUpdate(affinity);
      setCompletionConfettiKey(Date.now());
      await persistConversationSnapshot({
        nextMessages: messages,
        nextConversationEnded: true,
        nextConversationFeedback: payload.conversationFeedback ?? null,
      });
      try {
        const savedSnapshot = await loadLocalFriendConversation(localConversationKey);
        if (savedSnapshot) {
          await archiveLocalFriendConversation(savedSnapshot);
        }
      } catch (archiveErr: any) {
        console.warn('[FriendChat] No se pudo archivar la conversación local:', archiveErr?.message || archiveErr);
      }
      // Always persist affinity locally so the profile shows correctly even
      // when the backend hasn't been deployed or DynamoDB update fails.
      if (friend) {
        try {
          await recordLocalFriendConversationFinished(
            friend,
            affinity?.pointsEarned,
            payload.friendshipContext,
          );
          if (!isSignedIn) void reload();
        } catch (err: any) {
          console.warn('[FriendChat] No se pudo guardar el cierre local:', err?.message || err);
        }
      }
      void trackMixpanelFriendEvent('friend_chat_completed', {
        friend_id: friendId,
        character_name: friend?.characterName,
        character_id: friend?.friendId,
        post_id: sourcePost?.postId,
        input_method: 'manual_end',
        history_message_count: messages.length,
        correctness: 0,
        points_earned: AI_CONVERSATION_POINTS_PER_MESSAGE,
        affinity_points_earned: affinity?.pointsEarned ?? 0,
        affinity_total_points: affinity?.totalPoints ?? 0,
        affinity_level: affinity?.level ?? 1,
        affinity_leveled_up: affinity?.leveledUp ?? false,
      });
      void reload();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No pudimos finalizar la conversación.');
    } finally {
      setEndingConversation(false);
      setFlowState('idle');
    }
  }, [
    conversationEnded,
    endingConversation,
    flowState,
    friend,
    friendId,
    isSignedIn,
    localConversationKey,
    messages,
    persistConversationSnapshot,
    reload,
    sourcePost,
  ]);

  useEffect(() => {
    handleEndConversationRef.current = () => {
      void handleEndConversation();
    };
  }, [handleEndConversation]);

  const handleFinishConversation = useCallback(async () => {
    void trackMixpanelFriendEvent('friend_chat_finished', {
      friend_id: friend?.friendId,
      character_name: friend?.characterName,
      character_id: friend?.friendId,
      post_id: sourcePost?.postId,
      history_message_count: messages.length,
      conversation_ended: conversationEnded,
    });
    skipExitPromptRef.current = true;

    const onboardingCompleted = await hasCompletedOnboarding();
    if (!onboardingCompleted) {
      const existingDraft = await getOnboardingDraftProgress();
      await saveOnboardingDraftProgress({
        stepNumber: 5,
        selectedCharacter: existingDraft?.selectedCharacter ?? null,
        phraseSelections: existingDraft?.phraseSelections ?? [],
        speakingSummary: {
          messages: messagesToHistoryPayload(messages),
          completedRequirementIds: [],
        },
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding', params: { startAtStep: 5 } }],
      });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Feed' }],
    });
  }, [conversationEnded, friend, messages, navigation, sourcePost?.postId]);

  const handleRequestAssistance = useCallback(async () => {
    const trimmed = assistanceQuestion.trim();
    if (!trimmed) {
      setAssistanceError('Escribe tu pregunta.');
      return;
    }
    if (!friend) {
      setAssistanceError('No encontramos este amigo.');
      return;
    }

    setAssistanceLoading(true);
    setAssistanceError(null);
    setAssistanceAnswer('');

    try {
      void trackMixpanelFriendEvent('friend_chat_help_requested', {
        friend_id: friend.friendId,
        character_name: friend.characterName,
        character_id: friend.friendId,
        post_id: sourcePost?.postId,
        question_length: trimmed.length,
        question_word_count: trimmed.split(/\s+/).filter(Boolean).length,
        history_message_count: messages.length,
      });
      const historyPayload = messagesToHistoryPayload(messages);
      const assistanceBasePath = isSignedIn ? '/friends' : '/public/friends';
      const payload = await api.post<FriendAssistanceResponse>(
        `${assistanceBasePath}/${encodeURIComponent(friend.friendId)}/assist`,
        {
          question: trimmed,
          history: historyPayload,
          ...(sourcePost?.context ? { postContext: sourcePost.context } : {}),
        }
      );
      setAssistanceAnswer(payload?.answer || '');
    } catch (err: any) {
      console.error('Friend assistance error', err);
      setAssistanceError(err?.message || 'No pudimos obtener la asistencia.');
    } finally {
      setAssistanceLoading(false);
    }
  }, [assistanceQuestion, friend, isSignedIn, messages, sourcePost]);

  const speakAssistantMessage = useCallback(async (text: string) => {
    const speechText = text.trim();
    if (!speechText) return;
    try {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (audioErr) {
        console.warn('Friend speech audio mode failed', audioErr);
      }
      Speech.stop();
      void trackMixpanelFriendEvent('friend_chat_message_spoken', {
        friend_id: friend?.friendId,
        character_name: friend?.characterName,
        message_length: speechText.length,
      });
      Speech.speak(speechText, { language: 'en-US', pitch: 1.05 });
    } catch (err: any) {
      console.warn('Friend speech playback failed', err?.message || err);
    }
  }, [friend]);

  const translateAssistantMessage = useCallback(async (messageId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const existing = messageTranslations[messageId];
    if (existing?.loading || existing?.text) return;

    setMessageTranslations((current) => ({
      ...current,
      [messageId]: { ...current[messageId], loading: true, error: undefined },
    }));

    try {
      const payload = await api.post<TranslationResponse>('/translate', {
        text: trimmed,
        source: 'en',
        target: 'es',
      });
      void trackMixpanelFriendEvent('friend_chat_message_translated', {
        friend_id: friend?.friendId,
        character_name: friend?.characterName,
        message_length: trimmed.length,
      });
      setMessageTranslations((current) => ({
        ...current,
        [messageId]: { text: payload.translatedText || '', loading: false },
      }));
    } catch (err: any) {
      setMessageTranslations((current) => ({
        ...current,
        [messageId]: {
          loading: false,
          error: err?.message || 'No pudimos traducir este mensaje.',
        },
      }));
    }
  }, [friend, messageTranslations]);

  const handleAdvance = useCallback(
    async (
      transcript: string,
      sessionId?: string,
      inputMethod: 'text' | 'audio' | 'image' = 'text',
      imageData?: { uri: string; base64: string },
    ) => {
      const trimmed = transcript.trim();
      let messageSubmitted = false;
      if (!trimmed && !imageData) {
        setErrorMessage('La transcripción llegó vacía. Intenta de nuevo.');
        setFlowState('idle');
        return false;
      }
      if (!friendId) {
        setErrorMessage('No encontramos este amigo.');
        setFlowState('idle');
        return false;
      }
      if (conversationEnded) {
        setErrorMessage('Esta conversación ya terminó.');
        setFlowState('idle');
        return false;
      }
      if (retryingLastExchange) {
        setErrorMessage('Espera a que termine el retry.');
        setFlowState('idle');
        return false;
      }
      if (coinsLoading) {
        setErrorMessage('Cargando tus monedas...');
        setFlowState('idle');
        return false;
      }
      if (!isUnlimited) {
        const ok = await spendCoins(
          FRIEND_CHAT_MESSAGE_COST,
          `friend-message:${friendId}:${inputMethod}:${Date.now()}`
        );
        if (!ok) {
          setErrorMessage('Necesitas 1 moneda para enviar este mensaje.');
          if (inputMethod === 'text' && trimmed) {
            updateComposerText(trimmed);
          }
          navigation.navigate('Paywall', { source: 'friend_chat_message' });
          setFlowState('idle');
          return false;
        }
      }

      setErrorMessage(null);
      setAnalysis(null);
      setFlowState('evaluating');
      const messageText = imageData ? '' : trimmed;
      const pendingUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: messageText,
        ...(imageData ? { imageUri: imageData.uri } : {}),
      };
      // For images, exclude the current message from history — the backend adds it
      // with the vision description. For text/audio, include it (backend deduplicates).
      const historyPayload = imageData
        ? messagesToHistoryPayload(messages)
        : messagesToHistoryPayload([...messages, pendingUserMessage]);
      const messagesWithPendingUser = [...messages, pendingUserMessage];
      setMessages(messagesWithPendingUser);
      messageSubmitted = true;
      void persistConversationSnapshot({
        nextMessages: messagesWithPendingUser,
        nextAnalysis: null,
        nextConversationEnded: false,
        nextConversationFeedback: null,
      });

      const sourcePostId = sourcePost?.postId;
      if (
        sourcePostId &&
        messages.length === 0 &&
        likeRecordedForPostRef.current !== `${friendId}:${sourcePostId}` &&
        shouldRecordLikes()
      ) {
        likeRecordedForPostRef.current = `${friendId}:${sourcePostId}`;
        void api
          .post<unknown>(
            `/feed/character-videos/${encodeURIComponent(friendId)}/${encodeURIComponent(sourcePostId)}/like`,
            {},
          )
          .catch(() => {
            // best effort — silent failure keeps the chat flow unaffected
          });
      }

      const isFirstUserMessage = messages.length === 0;
      const transcriptWordCount = trimmed.split(/\s+/).filter(Boolean).length;
      const userMessageIndex = messages.filter((message) => message.role === 'user').length + 1;
      void trackMixpanelFriendEvent('friend_chat_message_submitted', {
        friend_id: friendId,
        character_name: friend?.characterName,
        character_id: friend?.friendId,
        post_id: sourcePost?.postId,
        source: sourcePost ? 'post_reply' : 'friend_chat',
        input_method: inputMethod,
        message_index: userMessageIndex,
        is_first_user_message: userMessageIndex === 1,
        transcript_length: trimmed.length,
        transcript_word_count: transcriptWordCount,
        history_message_count: historyPayload.length,
      });

      try {
        const currentDifficulty = await readStoredEnglishDifficulty();
        setEnglishDifficulty(currentDifficulty);
        const payload = await sendFriendChatMessage(friendId, {
          sessionId,
          transcript: imageData ? '[Photo]' : trimmed,
          englishDifficulty: currentDifficulty,
          ...(imageData ? { userImageBase64: imageData.base64 } : {}),
          ...(sourcePost?.postId ? { postId: sourcePost.postId } : {}),
          ...(sourcePost?.context ? { postContext: sourcePost.context } : {}),
          ...(sourcePost?.caption ? { postCaption: sourcePost.caption } : {}),
          ...(sourcePost?.imageUrl ? { postImageUrl: sourcePost.imageUrl } : {}),
          ...(sourcePost?.videoUrl ? { postVideoUrl: sourcePost.videoUrl } : {}),
          ...(friend?.friendshipContext ? { friendshipContext: friend.friendshipContext } : {}),
          history: historyPayload,
        }, { anonymous: !isSignedIn });
        void recordJourneyAiConversationMessageSent();
        void trackMixpanelFriendEvent('friend_chat_message_sent', {
          friend_id: friendId,
          character_name: friend?.characterName,
          character_id: friend?.friendId,
          post_id: sourcePost?.postId,
          source: sourcePost ? 'post_reply' : 'friend_chat',
          input_method: inputMethod,
          message_index: userMessageIndex,
          is_first_user_message: userMessageIndex === 1,
          transcript_length: trimmed.length,
          transcript_word_count: transcriptWordCount,
          history_message_count: historyPayload.length,
          result: payload.result,
          correctness: payload.correctness,
        });
        if (isFirstUserMessage) {
          void trackMetaFriendChatStarted({
            friendId,
            characterName: friend?.characterName,
            characterId: friend?.friendId,
            postId: sourcePost?.postId,
            inputMethod: inputMethod === 'image' ? undefined : inputMethod,
          });
        }
        const assistantMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          text: payload.aiReply,
        };
        const messagesWithReply = [...messagesWithPendingUser, assistantMessage];
        setMessages(messagesWithReply);
        setAnalysis(payload);
        void persistConversationSnapshot({
          nextMessages: messagesWithReply,
          nextAnalysis: payload,
          nextConversationEnded: false,
          nextConversationFeedback: null,
        });
        if (friend) {
          void recordLocalFriendMessageSent(friend, imageData ? '[Photo]' : trimmed).catch((err: any) => {
            console.warn('[FriendChat] No se pudo guardar el mensaje local:', err?.message || err);
          });
        }
        return true;
      } catch (err: any) {
        setErrorMessage(err?.message || 'No pudimos continuar la conversación.');
        return messageSubmitted;
      } finally {
        setFlowState('idle');
      }
    },
    [
      coinsLoading,
      conversationEnded,
      friend,
      friendId,
      isSignedIn,
      isUnlimited,
      messages,
      navigation,
      persistConversationSnapshot,
      retryingLastExchange,
      sourcePost,
      spendCoins,
      updateComposerText,
    ]
  );

  const handlePickPhoto = useCallback(async () => {
    setShowAttachMenu(false);
    setPhotoRequestMode(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrorMessage('Necesitas permitir el acceso a la galería para enviar fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.25,
      base64: true,
      allowsEditing: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setErrorMessage('No pudimos leer la imagen seleccionada.');
      return;
    }
    await handleAdvance('', undefined, 'image', { uri: asset.uri, base64: asset.base64 });
  }, [handleAdvance]);

  const handleRequestPhoto = useCallback(async (photoPrompt: string): Promise<boolean> => {
    setShowAttachMenu(false);
    const trimmedPrompt = photoPrompt.trim();
    if (!trimmedPrompt) {
      setErrorMessage('Describe la foto que quieres pedir.');
      return false;
    }
    if (!friendId) {
      setErrorMessage('No encontramos este amigo.');
      return false;
    }
    if (!isSignedIn) {
      setErrorMessage('Inicia sesión para pedir fotos.');
      return false;
    }
    if (conversationEnded) {
      setErrorMessage('Esta conversación ya terminó.');
      return false;
    }
    if (flowState !== 'idle' || retryingLastExchange) {
      setErrorMessage('Espera a que termine la acción actual.');
      return false;
    }
    if (coinsLoading) {
      setErrorMessage('Cargando tus monedas...');
      return false;
    }
    if (!isUnlimited) {
      const ok = await spendCoins(
        FRIEND_CHAT_MESSAGE_COST,
        `friend-photo:${friendId}:${Date.now()}`
      );
      if (!ok) {
        setErrorMessage('Necesitas 1 moneda para pedir una foto.');
        setPhotoRequestMode(true);
        updateComposerText(trimmedPrompt);
        navigation.navigate('Paywall', { source: 'friend_chat_message' });
        return false;
      }
    }

    const userMessage = trimmedPrompt;
    const pendingUserMessage: ChatMessage = {
      id: `user-photo-${Date.now()}`,
      role: 'user',
      text: userMessage,
    };
    const messagesWithRequest = [...messages, pendingUserMessage];
    const userMessageIndex = messages.filter((message) => message.role === 'user').length + 1;

    setErrorMessage(null);
    setAnalysis(null);
    setFlowState('generatingImage');
    setMessages(messagesWithRequest);
    void persistConversationSnapshot({
      nextMessages: messagesWithRequest,
      nextAnalysis: null,
      nextConversationEnded: false,
      nextConversationFeedback: null,
    });
    void trackMixpanelFriendEvent('friend_chat_photo_requested', {
      friend_id: friendId,
      character_name: friend?.characterName,
      character_id: friend?.friendId,
      post_id: sourcePost?.postId,
      message_index: userMessageIndex,
      history_message_count: messagesWithRequest.length,
    });

    try {
      const startedJob = await requestFriendPhoto(friendId, {
        prompt: userMessage,
        history: messagesToHistoryPayload(messagesWithRequest),
      });
      let payload = startedJob;
      const startedAt = Date.now();
      while (payload.status !== 'completed' && payload.status !== 'failed') {
        if (Date.now() - startedAt > FRIEND_IMAGE_POLL_TIMEOUT_MS) {
          throw new Error('La foto sigue generándose. Intenta abrir el chat de nuevo en un momento.');
        }
        await wait(FRIEND_IMAGE_POLL_INTERVAL_MS);
        payload = await getFriendPhoto(friendId, startedJob.imageId);
      }
      if (payload.status === 'failed') {
        throw new Error(payload.errorMessage || 'No pudimos generar la foto.');
      }
      if (!payload.image?.imageUrl) {
        throw new Error('La foto terminó sin una imagen válida.');
      }
      const assistantMessage: ChatMessage = {
        id: `ai-photo-${Date.now()}`,
        role: 'assistant',
        text: payload.aiReply,
        imageUrl: payload.image.imageUrl,
      };
      const messagesWithPhoto = [...messagesWithRequest, assistantMessage];
      setMessages(messagesWithPhoto);
      void persistConversationSnapshot({
        nextMessages: messagesWithPhoto,
        nextAnalysis: null,
        nextConversationEnded: false,
        nextConversationFeedback: null,
      });
      void trackMixpanelFriendEvent('friend_chat_photo_received', {
        friend_id: friendId,
        character_name: friend?.characterName,
        character_id: friend?.friendId,
        image_id: payload.image.imageId,
        model: payload.image.model,
      });
      void reload();
      return true;
    } catch (err: any) {
      setErrorMessage(err?.message || 'No pudimos generar la foto.');
      return false;
    } finally {
      setFlowState('idle');
    }
  }, [
    coinsLoading,
    conversationEnded,
    flowState,
    friend,
    friendId,
    isSignedIn,
    isUnlimited,
    messages,
    navigation,
    persistConversationSnapshot,
    reload,
    retryingLastExchange,
    sourcePost?.postId,
    spendCoins,
    updateComposerText,
  ]);

  const handleSendText = useCallback(
    async (textToSend: string) => {
      try {
        if (photoRequestMode) {
          const success = await handleRequestPhoto(textToSend);
          if (success) {
            setPhotoRequestMode(false);
            clearComposerDraft();
          }
          return success;
        }
        const success = await handleAdvance(textToSend);
        if (success) {
          clearComposerDraft();
        }
        return success;
      } catch (err: any) {
        setErrorMessage(err?.message || 'No pudimos enviar tu mensaje.');
        setFlowState('idle');
        return false;
      }
    },
    [clearComposerDraft, handleAdvance, handleRequestPhoto, photoRequestMode]
  );

  useEffect(() => {
    const draft = route.params?.initialDraft?.trim();
    if (!draft) return;
    if (!friend) return;
    if (coinsLoading) return;
    if (conversationEnded) return;
    if (retryingLastExchange) return;
    if (flowState !== 'idle') return;
    if (messages.length > 0) return;
    const autoSendKey = `${chatContextKey}:${draft}`;
    if (autoSentDraftKeyRef.current === autoSendKey) return;
    autoSentDraftKeyRef.current = autoSendKey;
    navigation.setParams({ initialDraft: undefined });
    void handleSendText(draft);
  }, [
    chatContextKey,
    coinsLoading,
    conversationEnded,
    flowState,
    friend,
    handleSendText,
    messages.length,
    navigation,
    retryingLastExchange,
    route.params?.initialDraft,
  ]);

  const handleRecordRelease = useCallback(async (skipStartGuard = false) => {
    try {
      if (isStartingRecording.current && !skipStartGuard) {
        stopRequestedWhileStarting.current = true;
        setFlowState('idle');
        return;
      }
      if (!recorder.isRecording()) {
        setFlowState('idle');
        return;
      }
      const recording = await recorder.stop();
      setFlowState('uploading');
      const session = await api.post<{ sessionId: string; uploadUrl: string }>('/sessions/start', {
        friendId,
      });
      await uploader.put(session.uploadUrl, { uri: recording.uri }, 'audio/mp4');
      setFlowState('transcribing');
      const transcription = await api.post<{ transcript: string }>(
        `/sessions/${session.sessionId}/transcribe`
      );
      await handleAdvance(transcription.transcript || '', session.sessionId, 'audio');
    } catch (err: any) {
      setErrorMessage(err?.message || 'No pudimos procesar tu audio.');
      setFlowState('idle');
    }
  }, [friendId, handleAdvance, recorder, uploader]);

  const handleRecordPressIn = useCallback(async () => {
    try {
      if (conversationEnded) {
        setErrorMessage('Esta conversación ya terminó.');
        return;
      }
      if (coinsLoading) {
        setErrorMessage('Cargando tus monedas...');
        return;
      }
      const hasMicPermission = await recorder.ensurePermission();
      if (!hasMicPermission) {
        setErrorMessage('Activa el permiso de micrófono para grabar.');
        return;
      }
      if (!isUnlimited) {
        const voiceAffordable = await canSpend(FRIEND_CHAT_VOICE_TOTAL_COST);
        if (!voiceAffordable) {
          setErrorMessage('Necesitas 2 monedas para enviar un mensaje con voz.');
          navigation.navigate('Paywall', { source: 'friend_chat_recording' });
          return;
        }
        const ok = await spendCoins(RECORDING_COST, `friend-recording:${friendId}:${Date.now()}`);
        if (!ok) {
          setErrorMessage('Necesitas 1 moneda para grabar.');
          navigation.navigate('Paywall', { source: 'friend_chat_recording' });
          return;
        }
      }
      void trackMixpanelFriendEvent('friend_chat_recording_started', {
        friend_id: friendId,
        character_name: friend?.characterName,
        character_id: friend?.friendId,
        post_id: sourcePost?.postId,
      });
      setErrorMessage(null);
      setFlowState('recording');
      stopRequestedWhileStarting.current = false;
      isStartingRecording.current = true;
      await recorder.start();
      isStartingRecording.current = false;
      if (stopRequestedWhileStarting.current) {
        stopRequestedWhileStarting.current = false;
        await handleRecordRelease(true);
      }
    } catch (err: any) {
      const startErrorMessage = err?.message || 'No pudimos iniciar la grabación.';
      setErrorMessage(startErrorMessage === 'La grabacion se cancelo al salir de la app.' ? null : startErrorMessage);
      setFlowState('idle');
      stopRequestedWhileStarting.current = false;
      isStartingRecording.current = false;
    }
  }, [canSpend, coinsLoading, conversationEnded, friend, friendId, handleRecordRelease, isUnlimited, navigation, recorder, sourcePost?.postId, spendCoins]);

  const textCoinLocked = !isUnlimited && balance < FRIEND_CHAT_MESSAGE_COST;
  const voiceCoinLocked = !isUnlimited && balance < FRIEND_CHAT_VOICE_TOTAL_COST;

  useEffect(() => {
    if (!errorMessage || coinsLoading || !/Necesitas .*moneda/.test(errorMessage)) {
      return;
    }
    if (isUnlimited) {
      setErrorMessage(null);
      return;
    }
    const requiredCoins = errorMessage.includes('2 monedas')
      ? FRIEND_CHAT_VOICE_TOTAL_COST
      : FRIEND_CHAT_MESSAGE_COST;
    if (balance >= requiredCoins) {
      setErrorMessage(null);
    }
  }, [balance, coinsLoading, errorMessage, isUnlimited]);

  const statusLabel = useMemo(() => {
    switch (flowState) {
      case 'recording':
        return 'Grabando...';
      case 'uploading':
        return 'Subiendo audio...';
      case 'transcribing':
        return 'Transcribiendo...';
      case 'evaluating':
        return 'Analizando tu inglés...';
      case 'generatingImage':
        return 'Generando foto...';
      default:
        if (retryingLastExchange) {
          return 'Preparando reintento...';
        }
        if (isUnlimited) {
          return 'Listo para conversar';
        }
        if (coinsLoading) {
          return 'Cargando tus monedas...';
        }
        if (textCoinLocked) {
          return 'Necesitas 1 moneda para enviar.';
        }
        if (voiceCoinLocked) {
          return 'Enviar cuesta 1 moneda · Voz cuesta 2 monedas';
        }
        return 'Enviar cuesta 1 moneda · Voz cuesta 2 monedas';
    }
  }, [coinsLoading, flowState, isUnlimited, retryingLastExchange, textCoinLocked, voiceCoinLocked]);

  if ((!loaded || loading) && !friend) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1224' }}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={{ color: '#94a3b8', marginTop: 10 }}>Cargando amigo...</Text>
      </View>
    );
  }

  if (error || !friend) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#0b1224' }}>
        <Text style={{ color: '#fecdd3', textAlign: 'center', fontWeight: '800' }}>
          {error || 'No encontramos este amigo.'}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            marginTop: 16,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
          })}
        >
          <Text style={{ color: 'white', fontWeight: '900' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      key={keyboardAvoiderKey}
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1 }}>
        {completionConfettiKey !== null ? (
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { zIndex: 20 }]}>
            <ConfettiCannon
              key={completionConfettiKey}
              count={140}
              origin={{
                x: windowWidth / 2,
                y: insets.top + 72,
              }}
              fadeOut
              fallSpeed={2800}
              explosionSpeed={420}
              onAnimationEnd={() => {
                setCompletionConfettiKey((current) =>
                  current === completionConfettiKey ? null : current
                );
              }}
            />
          </View>
        ) : null}
        <View style={{ backgroundColor: COLORS.header, paddingTop: headerTopPadding, paddingBottom: 12, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={16}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: 24, color: 'white', fontWeight: '700', lineHeight: 26 }}>{'‹'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowProfilePreview(true)}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${friend.characterName}`}
              hitSlop={8}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 999,
                overflow: 'hidden',
                backgroundColor: '#0b172b',
                marginRight: 12,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              {avatarSource ? (
                <Image source={avatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '900' }}>{avatarInitial}</Text>
                </View>
              )}
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: 'white' }} numberOfLines={1}>
                {friend.characterName}
              </Text>
              <Text style={{ fontSize: 12, color: COLORS.helpAccent }} numberOfLines={1}>
                {affinityStatusLabel}
              </Text>
            </View>
            <CoinCountChip />
            <Pressable
              hitSlop={12}
              onPress={handleOpenAssistance}
              accessibilityRole="button"
              accessibilityLabel="Abrir ayuda"
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                marginLeft: 8,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <MaterialIcons name="help-outline" size={24} color={COLORS.helpAccent} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {sourcePost ? (
            <SourcePostCard
              post={sourcePost}
              friendName={friend.characterName}
              affinityLabel={affinityStatusLabel}
            />
          ) : null}

          <View style={{ padding: 14, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: COLORS.border, marginTop: sourcePost ? 12 : 0 }}>
            <Text style={{ fontWeight: '800', color: '#1e293b' }}>{friend.characterName}</Text>
            <Text style={{ color: COLORS.muted, marginTop: 6, lineHeight: 20 }}>
              {conversationEnded
                ? 'Esta práctica ya terminó. Puedes revisar la conversación y el feedback final.'
                : sourcePost
                ? 'Responde en inglés usando el post como contexto. El avatar contestará tomando esa foto en cuenta.'
                : 'Ahora puedes practicar sin requisitos. Mantén la conversación en inglés y revisa el feedback después de cada mensaje.'}
            </Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Conversación</Text>
            {messages.length === 0 ? (
              <View style={{ padding: 16, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ color: COLORS.muted }}>
                  {conversationEnded
                    ? 'Esta conversación ya fue marcada como terminada.'
                    : sourcePost
                    ? 'Escríbele o graba una respuesta al post para empezar.'
                    : 'Escríbele o graba tu primer mensaje para empezar una práctica libre.'}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {messages.map((msg) => {
                  const translationState = messageTranslations[msg.id];
                  const isAssistant = msg.role === 'assistant';
                  const messageImageUri = msg.imageUrl || msg.imageUri;
                  const canUseTextActions = isAssistant && msg.text.trim().length > 0;
                  return (
                    <View key={msg.id} style={{ alignSelf: isAssistant ? 'flex-start' : 'flex-end' }}>
                      <View
                        style={{
                          backgroundColor: isAssistant ? 'white' : COLORS.userBubble,
                          borderRadius: 16,
                          paddingVertical: messageImageUri ? 8 : 10,
                          paddingHorizontal: messageImageUri ? 8 : 14,
                          maxWidth: '80%',
                          borderWidth: isAssistant ? 1 : 0,
                          borderColor: COLORS.border,
                        }}
                      >
                        {messageImageUri ? (
                          <Pressable
                            onPress={() => setSelectedChatImageUri(messageImageUri)}
                            accessibilityRole="imagebutton"
                            accessibilityLabel="Ver foto en pantalla completa"
                            style={({ pressed }) => ({
                              opacity: pressed ? 0.88 : 1,
                            })}
                          >
                            <Image
                              source={{ uri: messageImageUri }}
                              style={{
                                width: 220,
                                height: 280,
                                borderRadius: 12,
                                backgroundColor: '#e2e8f0',
                              }}
                              resizeMode="cover"
                            />
                          </Pressable>
                        ) : null}
                        {msg.text.trim() ? (
                          <Text
                            style={{
                              color: isAssistant ? COLORS.assistantText : 'white',
                              lineHeight: 20,
                              marginTop: messageImageUri ? 8 : 0,
                              paddingHorizontal: messageImageUri ? 4 : 0,
                            }}
                          >
                            {msg.text}
                          </Text>
                        ) : null}
                        {isAssistant && translationState?.text ? (
                          <>
                            <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 10 }} />
                            <Text style={{ color: COLORS.muted, lineHeight: 20 }}>{translationState.text}</Text>
                          </>
                        ) : null}
                        {isAssistant && translationState?.error ? (
                          <Text style={{ marginTop: 8, color: '#dc2626', fontSize: 12 }}>{translationState.error}</Text>
                        ) : null}
                        {canUseTextActions ? (
                          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                            <Pressable
                              accessibilityLabel="Reproducir mensaje"
                              onPress={() => speakAssistantMessage(msg.text)}
                              hitSlop={8}
                              style={({ pressed }) => ({
                                width: 34,
                                height: 34,
                                borderRadius: 999,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: pressed ? '#dbeafe' : '#eff6ff',
                                borderWidth: 1,
                                borderColor: '#bfdbfe',
                              })}
                            >
                              <MaterialIcons name="volume-up" size={18} color="#1d4ed8" />
                            </Pressable>
                            <Pressable
                              accessibilityLabel="Traducir mensaje"
                              onPress={() => translateAssistantMessage(msg.id, msg.text)}
                              disabled={!!translationState?.loading}
                              hitSlop={8}
                              style={({ pressed }) => ({
                                width: 34,
                                height: 34,
                                borderRadius: 999,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: translationState?.loading
                                  ? '#f1f5f9'
                                  : pressed
                                  ? '#dcfce7'
                                  : '#f0fdf4',
                                borderWidth: 1,
                                borderColor: '#bbf7d0',
                                opacity: translationState?.loading ? 0.75 : 1,
                              })}
                            >
                              {translationState?.loading ? (
                                <ActivityIndicator size="small" color="#15803d" />
                              ) : (
                                <MaterialIcons name="translate" size={18} color="#15803d" />
                              )}
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {flowState === 'evaluating' || flowState === 'generatingImage' ? (
            <View
              style={{
                marginTop: 16,
                padding: 16,
                backgroundColor: 'white',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
              }}
            >
              <Image
                source={luviLoadingGif}
                style={{ width: 96, height: 96 }}
                resizeMode="contain"
              />
              <Text style={{ marginTop: 8, fontWeight: '700', color: '#1e293b' }}>
                {flowState === 'generatingImage' ? 'Generando foto...' : 'Analizando tu inglés...'}
              </Text>
            </View>
          ) : null}

          {analysis ? (
            <AnalysisCard
              analysis={analysis}
              onRetry={handleRetryLastExchange}
              retryDisabled={flowState !== 'idle' || retryingLastExchange}
              englishDifficulty={englishDifficulty}
            />
          ) : null}
          {conversationEnded ? (
            <CompletionCard
              feedback={conversationFeedback}
              friendName={friend.characterName}
              pointsEarned={aiConversationPoints}
              affinity={affinityUpdate}
            />
          ) : null}
        </ScrollView>

        {errorMessage ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ color: '#dc2626' }}>{errorMessage}</Text>
          </View>
        ) : null}

        {conversationEnded ? (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 8),
              backgroundColor: '#f8fafc',
              borderTopWidth: 1,
              borderTopColor: COLORS.border,
            }}
          >
            <Text style={{ color: '#15803d', fontWeight: '800' }}>Conversación terminada</Text>
            <Text style={{ color: COLORS.muted, marginTop: 4 }}>
              El chat quedó cerrado. Vuelve al feed para seguir practicando.
            </Text>
            <Pressable
              onPress={handleFinishConversation}
              style={({ pressed }) => ({
                marginTop: 10,
                paddingVertical: 11,
                borderRadius: 999,
                alignItems: 'center',
                backgroundColor: pressed ? '#047857' : '#10b981',
              })}
            >
              <Text style={{ color: 'white', fontWeight: '900' }}>Finalizar</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            {hasStartedConversation ? (
              <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <Pressable
                  accessibilityLabel="Finalizar conversación y recibir feedback"
                  onPress={handleEndConversation}
                  disabled={endingConversation || flowState !== 'idle' || retryingLastExchange}
                  style={({ pressed }) => ({
                    alignSelf: 'flex-end',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: pressed ? '#dcfce7' : '#f0fdf4',
                    borderWidth: 1,
                    borderColor: '#bbf7d0',
                    opacity: endingConversation || flowState !== 'idle' || retryingLastExchange ? 0.6 : 1,
                  })}
                >
                  {endingConversation ? (
                    <ActivityIndicator size="small" color="#15803d" />
                  ) : (
                    <MaterialIcons name="flag" size={16} color="#15803d" />
                  )}
                  <Text style={{ color: '#15803d', fontWeight: '800', fontSize: 13 }}>
                    {endingConversation ? 'Finalizando…' : 'Finalizar y recibir feedback'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            {showAttachMenu ? (
              <View
                style={{
                  marginHorizontal: 12,
                  marginBottom: 6,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  overflow: 'hidden',
                  alignSelf: 'flex-start',
                  shadowColor: '#0f172a',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                <Pressable
                  onPress={handlePickPhoto}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: pressed ? '#f1f5f9' : 'white',
                  })}
                >
                  <MaterialIcons name="photo" size={20} color="#475569" />
                  <Text style={{ color: '#1e293b', fontWeight: '600', fontSize: 14 }}>Enviar foto</Text>
                </Pressable>
                <View style={{ height: 1, backgroundColor: '#e2e8f0' }} />
                <Pressable
                  onPress={() => {
                    setShowAttachMenu(false);
                    setPhotoRequestMode(true);
                    setErrorMessage(null);
                  }}
                  disabled={flowState !== 'idle' || retryingLastExchange}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: pressed ? '#f1f5f9' : 'white',
                    opacity: flowState !== 'idle' || retryingLastExchange ? 0.6 : 1,
                  })}
                >
                  <MaterialIcons name="add-photo-alternate" size={20} color="#475569" />
                  <Text style={{ color: '#1e293b', fontWeight: '600', fontSize: 14 }}>Pedir foto</Text>
                </Pressable>
              </View>
            ) : null}
            <StoryMessageComposer
              flowState={flowState}
              retryBlocked={retryingLastExchange}
              recordBlocked={retryingLastExchange || (!isUnlimited && coinsLoading) || voiceCoinLocked}
              statusLabel={statusLabel}
              text={composerText}
              onTextChange={updateComposerText}
              onSendText={handleSendText}
              onRecordPressIn={handleRecordPressIn}
              onRecordRelease={handleRecordRelease}
              onPlusPress={() => setShowAttachMenu((v) => !v)}
              photoRequestMode={photoRequestMode}
            />
          </View>
        )}

        <Modal
          visible={showProfilePreview}
          transparent
          animationType="fade"
          onRequestClose={() => setShowProfilePreview(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: 'rgba(4,7,17,0.8)', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onPress={() => setShowProfilePreview(false)}
          >
            <Pressable
              onPress={() => {}}
              style={{
                width: '100%',
                maxWidth: 320,
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 999,
                  overflow: 'hidden',
                  backgroundColor: '#0b172b',
                  marginBottom: 16,
                }}
              >
                {largeAvatarSource ? (
                  <Image source={largeAvatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 48, fontWeight: '900' }}>{avatarInitial}</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a', textAlign: 'center' }} numberOfLines={2}>
                {friend.characterName}
              </Text>
              <Pressable
                onPress={() => {
                  setShowProfilePreview(false);
                  skipExitPromptRef.current = true;
                  const unsubscribeFocus = navigation.addListener('focus', () => {
                    skipExitPromptRef.current = false;
                    unsubscribeFocus();
                  });
                  navigation.push('FriendProfile', { friendId: friend.friendId });
                }}
                accessibilityRole="button"
                accessibilityLabel="Ver perfil completo"
                style={({ pressed }) => ({
                  marginTop: 20,
                  alignSelf: 'stretch',
                  paddingVertical: 12,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
                })}
              >
                <Text style={{ color: 'white', fontWeight: '900' }}>Ver perfil</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowProfilePreview(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                style={({ pressed }) => ({
                  marginTop: 10,
                  alignSelf: 'stretch',
                  paddingVertical: 10,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#e2e8f0' : 'transparent',
                })}
              >
                <Text style={{ color: '#475569', fontWeight: '700' }}>Cerrar</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={!!selectedChatImageUri}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedChatImageUri(null)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.96)' }}>
            {selectedChatImageUri ? <ZoomableChatImage uri={selectedChatImageUri} /> : null}
            <Pressable
              onPress={() => setSelectedChatImageUri(null)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar foto"
              style={({ pressed }) => ({
                position: 'absolute',
                top: Math.max(insets.top, 16),
                right: 16,
                width: 46,
                height: 46,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(15, 23, 42, 0.96)' : 'rgba(15, 23, 42, 0.82)',
                borderWidth: 1,
                borderColor: 'rgba(226, 232, 240, 0.18)',
              })}
            >
              <MaterialIcons name="close" size={22} color="white" />
            </Pressable>
          </View>
        </Modal>

        <Modal
          visible={showAssistanceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAssistanceModal(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Pressable
              style={{ flex: 1, backgroundColor: 'rgba(4,7,17,0.7)', padding: 20 }}
              onPress={() => setShowAssistanceModal(false)}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              >
                <Pressable
                  onPress={() => {}}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 18,
                    padding: 20,
                    shadowColor: '#0f172a',
                    shadowOpacity: 0.12,
                    shadowRadius: 16,
                    elevation: 6,
                  }}
                >
                  <View style={{ alignItems: 'flex-end' }}>
                    <Pressable
                      onPress={() => setShowAssistanceModal(false)}
                      hitSlop={12}
                      style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}
                    >
                      <Text style={{ fontSize: 20, color: '#0f172a' }}>✕</Text>
                    </Pressable>
                  </View>
                  <View style={{ alignItems: 'center', marginBottom: 12 }}>
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 20,
                        backgroundColor: '#0b1224',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Image source={luviImage} style={{ width: '90%', height: '90%' }} resizeMode="contain" />
                    </View>
                    <Text style={{ marginTop: 12, fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                      ¿Cómo puedo ayudarte?
                    </Text>
                    <Text style={{ marginTop: 6, fontSize: 13, color: '#475569', textAlign: 'center' }}>
                      Luvi puede ayudarte a seguir la conversación libre con {friend.characterName}.
                    </Text>
                    <Text style={{ marginTop: 4, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                      Chat: {friend.characterName}
                    </Text>
                  </View>
                  <TextInput
                    value={assistanceQuestion}
                    onChangeText={(text) => {
                      setAssistanceQuestion(text);
                      if (assistanceError) setAssistanceError(null);
                    }}
                    placeholder="Cuéntame qué quieres decir, cómo responder o qué frase necesitas..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    style={{
                      minHeight: 90,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      backgroundColor: '#f8fafc',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 14,
                      color: '#0f172a',
                    }}
                  />
                  {assistanceError ? (
                    <Text style={{ marginTop: 6, color: '#dc2626' }}>{assistanceError}</Text>
                  ) : null}
                  <Pressable
                    onPress={handleRequestAssistance}
                    disabled={assistanceLoading}
                    style={({ pressed }) => ({
                      marginTop: 12,
                      paddingVertical: 12,
                      borderRadius: 999,
                      alignItems: 'center',
                      backgroundColor: assistanceLoading ? '#cbd5f5' : pressed ? '#0b1224' : '#2563eb',
                    })}
                  >
                    {assistanceLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={{ color: 'white', fontWeight: '700' }}>Pedir asistencia</Text>
                    )}
                  </Pressable>
                  {assistanceAnswer ? (
                    <View
                      style={{
                        marginTop: 14,
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: '#f8fafc',
                        borderWidth: 1,
                        borderColor: '#e2e8f0',
                      }}
                    >
                      <Text style={{ fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>Sugerencia</Text>
                      <Text style={{ color: '#0f172a', lineHeight: 20 }}>{assistanceAnswer}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
