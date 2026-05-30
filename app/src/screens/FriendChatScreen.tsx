import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import { RootStackParamList } from '../navigation/AppNavigator';
import CoinCountChip from '../components/CoinCountChip';
import StoryMessageComposer, { StoryFlowState } from '../components/StoryMessageComposer';
import AccountProgressCard from '../components/AccountProgressCard';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/api';
import { shouldRecordLikes } from '../config/likeRecording';
import { RECORDING_COST, useCoins } from '../purchases/CoinBalanceProvider';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import {
  finishFriendChat,
  FriendChatPayload,
  FriendConversationFeedback,
  sendFriendChatMessage,
  useFriends,
} from '../hooks/useFriends';
import { getChatAvatar } from '../chatimages/chatAvatarMap';
import {
  AI_CONVERSATION_POINTS_PER_MESSAGE,
  recordJourneyAiConversationMessageSent,
} from '../progress/journeyProgress';
import { trackMixpanelFriendEvent } from '../marketing/mixpanelEvents';

type Props = NativeStackScreenProps<RootStackParamList, 'FriendChat'>;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

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

function formatJourneyPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}

const COLORS = {
  header: '#0b1224',
  background: '#f8fafc',
  border: '#e2e8f0',
  userBubble: '#4f46e5',
  assistantText: '#0f172a',
  muted: '#475569',
};

const luviImage = require('../image/luvi.png');
const luviLoadingGif = require('../image/luvi-loading.gif');

function AnalysisCard({ analysis }: { analysis: FriendChatPayload }) {
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
      <Text style={{ fontWeight: '700', color: '#1e293b' }}>
        Correctness: {analysis.correctness}% ({analysis.result === 'correct' ? 'Correcto' : analysis.result === 'partial' ? 'Parcial' : 'Incorrecto'})
      </Text>
      {analysis.errors.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: '600', color: '#dc2626', marginBottom: 4 }}>Errores detectados</Text>
          {analysis.errors.map((errText, index) => (
            <Text key={`${errText}-${index}`} style={{ color: '#dc2626', marginBottom: 2 }}>
              - {errText}
            </Text>
          ))}
        </View>
      ) : (
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
    </View>
  );
}

function CompletionCard({
  feedback,
  friendName,
  pointsEarned,
}: {
  feedback: FriendConversationFeedback | null;
  friendName: string;
  pointsEarned: number;
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

function SourcePostCard({ post, friendName }: { post: FriendChatSourcePost; friendName: string }) {
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
      <Text style={{ color: '#2563eb', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
        Respondiendo a un post
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
  const trackedFriendViewRef = useRef<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageTranslations, setMessageTranslations] = useState<Record<string, MessageTranslationState>>({});
  const [analysis, setAnalysis] = useState<FriendChatPayload | null>(null);
  const [conversationEnded, setConversationEnded] = useState(false);
  const [conversationFeedback, setConversationFeedback] = useState<FriendConversationFeedback | null>(null);
  const [completionConfettiKey, setCompletionConfettiKey] = useState<number | null>(null);
  const [flowState, setFlowState] = useState<StoryFlowState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [endingConversation, setEndingConversation] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
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

  const avatarSource = useMemo(() => {
    if (!friend) return undefined;
    const avatarUrl = (friend.avatarImageXsUrl || friend.avatarImageUrl)?.trim();
    return avatarUrl
      ? { uri: avatarUrl }
      : getChatAvatar(friend.missionId);
  }, [friend]);
  const avatarInitial = (friend?.characterName.trim().charAt(0) || '?').toUpperCase();
  const hasStartedConversation = useMemo(
    () => messages.some((message) => message.role === 'user'),
    [messages]
  );
  const aiConversationPoints = useMemo(
    () => messages.filter((message) => message.role === 'user').length * AI_CONVERSATION_POINTS_PER_MESSAGE,
    [messages]
  );

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (friendId) {
      void reload();
    }
  }, [friendId, reload]);

  useEffect(() => {
    if (!friend || trackedFriendViewRef.current === chatContextKey) return;
    trackedFriendViewRef.current = chatContextKey;
    void trackMixpanelFriendEvent('friend_chat_viewed', {
      friend_id: friend.friendId,
      character_name: friend.characterName,
      story_id: friend.storyId,
      story_title: friend.storyTitle,
      mission_id: friend.missionId,
      mission_title: friend.missionTitle,
      post_id: sourcePost?.postId,
      source: sourcePost ? 'profile_post' : 'friend_chat',
      conversation_count: friend.conversationCount ?? 0,
      message_count: friend.messageCount ?? 0,
    });
  }, [chatContextKey, friend, sourcePost]);

  useEffect(() => {
    skipExitPromptRef.current = false;
    setMessages([]);
    setMessageTranslations({});
    setAnalysis(null);
    setConversationEnded(false);
    setConversationFeedback(null);
    setCompletionConfettiKey(null);
    setErrorMessage(null);
  }, [chatContextKey]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

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

  const handleCreateAccount = useCallback((prefillEmail?: string) => {
    navigation.navigate('EmailSignUp', { prefillEmail });
  }, [navigation]);

  const handleOpenAssistance = useCallback(() => {
    void trackMixpanelFriendEvent('friend_chat_help_opened', {
      friend_id: friend?.friendId,
      character_name: friend?.characterName,
      story_id: friend?.storyId,
      mission_id: friend?.missionId,
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
        story_id: friend?.storyId,
        mission_id: friend?.missionId,
        post_id: sourcePost?.postId,
        history_message_count: messages.length,
      });
      const historyPayload = messages.map(({ role, text }) => ({ role, content: text }));
      const payload = await finishFriendChat(friendId, { history: historyPayload });
      setConversationEnded(true);
      setConversationFeedback(payload.conversationFeedback ?? null);
      setCompletionConfettiKey(Date.now());
      void trackMixpanelFriendEvent('friend_chat_completed', {
        friend_id: friendId,
        character_name: friend?.characterName,
        story_id: friend?.storyId,
        mission_id: friend?.missionId,
        post_id: sourcePost?.postId,
        input_method: 'manual_end',
        history_message_count: messages.length,
        correctness: 0,
        points_earned: AI_CONVERSATION_POINTS_PER_MESSAGE,
      });
      void reload();
    } catch (err: any) {
      setErrorMessage(err?.message || 'No pudimos finalizar la conversación.');
    } finally {
      setEndingConversation(false);
      setFlowState('idle');
    }
  }, [conversationEnded, endingConversation, flowState, friend, friendId, messages, reload, sourcePost]);

  useEffect(() => {
    handleEndConversationRef.current = () => {
      void handleEndConversation();
    };
  }, [handleEndConversation]);

  const handleFinishConversation = useCallback(() => {
    void trackMixpanelFriendEvent('friend_chat_finished', {
      friend_id: friend?.friendId,
      character_name: friend?.characterName,
      story_id: friend?.storyId,
      mission_id: friend?.missionId,
      post_id: sourcePost?.postId,
      history_message_count: messages.length,
      conversation_ended: conversationEnded,
    });
    skipExitPromptRef.current = true;
    navigation.reset({
      index: 0,
      routes: [{ name: 'Feed' }],
    });
  }, [conversationEnded, friend, messages.length, navigation, sourcePost?.postId]);

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
        story_id: friend.storyId,
        mission_id: friend.missionId,
        post_id: sourcePost?.postId,
        question_length: trimmed.length,
        question_word_count: trimmed.split(/\s+/).filter(Boolean).length,
        history_message_count: messages.length,
      });
      const historyPayload = messages.map(({ role, text }) => ({ role, content: text }));
      const payload = await api.post<FriendAssistanceResponse>(
        `/friends/${encodeURIComponent(friend.friendId)}/assist`,
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
  }, [assistanceQuestion, friend, messages, sourcePost]);

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
    async (transcript: string, sessionId?: string, inputMethod: 'text' | 'audio' = 'text') => {
      const trimmed = transcript.trim();
      if (!trimmed) {
        setErrorMessage('La transcripción llegó vacía. Intenta de nuevo.');
        setFlowState('idle');
        return;
      }
      if (!friendId) {
        setErrorMessage('No encontramos este amigo.');
        setFlowState('idle');
        return;
      }
      if (conversationEnded) {
        setErrorMessage('Esta conversación ya terminó.');
        setFlowState('idle');
        return;
      }
      if (coinsLoading) {
        setErrorMessage('Cargando tus monedas...');
        setFlowState('idle');
        return;
      }
      if (!isUnlimited) {
        const ok = await spendCoins(
          FRIEND_CHAT_MESSAGE_COST,
          `friend-message:${friendId}:${inputMethod}:${Date.now()}`
        );
        if (!ok) {
          setErrorMessage('Necesitas 1 moneda para enviar este mensaje.');
          navigation.navigate('Paywall', { source: 'friend_chat_message' });
          setFlowState('idle');
          return;
        }
      }

      setErrorMessage(null);
      setAnalysis(null);
      setFlowState('evaluating');
      const pendingUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
      };
      const historyPayload = [...messages, pendingUserMessage].map(({ role, text }) => ({
        role,
        content: text,
      }));
      setMessages((current) => [...current, pendingUserMessage]);

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

      try {
        const payload = await sendFriendChatMessage(friendId, {
          sessionId,
          transcript: trimmed,
          ...(sourcePost?.postId ? { postId: sourcePost.postId } : {}),
          ...(sourcePost?.context ? { postContext: sourcePost.context } : {}),
          ...(sourcePost?.caption ? { postCaption: sourcePost.caption } : {}),
          ...(sourcePost?.imageUrl ? { postImageUrl: sourcePost.imageUrl } : {}),
          ...(sourcePost?.videoUrl ? { postVideoUrl: sourcePost.videoUrl } : {}),
          history: historyPayload,
        });
        void recordJourneyAiConversationMessageSent();
        void trackMixpanelFriendEvent('friend_chat_message_sent', {
          friend_id: friendId,
          character_name: friend?.characterName,
          story_id: friend?.storyId,
          mission_id: friend?.missionId,
          post_id: sourcePost?.postId,
          input_method: inputMethod,
          transcript_length: trimmed.length,
          transcript_word_count: trimmed.split(/\s+/).filter(Boolean).length,
          history_message_count: historyPayload.length,
          result: payload.result,
          correctness: payload.correctness,
        });
        setMessages((current) => [
          ...current,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            text: payload.aiReply,
          },
        ]);
        setAnalysis(payload);
      } catch (err: any) {
        setErrorMessage(err?.message || 'No pudimos continuar la conversación.');
      } finally {
        setFlowState('idle');
      }
    },
    [coinsLoading, conversationEnded, friend, friendId, isUnlimited, messages, navigation, sourcePost, spendCoins]
  );

  const handleSendText = useCallback(
    async (textToSend: string) => {
      try {
        await handleAdvance(textToSend);
        return true;
      } catch (err: any) {
        setErrorMessage(err?.message || 'No pudimos enviar tu mensaje.');
        setFlowState('idle');
        return false;
      }
    },
    [handleAdvance]
  );

  useEffect(() => {
    const draft = route.params?.initialDraft?.trim();
    if (!draft) return;
    if (!friend) return;
    if (coinsLoading) return;
    if (conversationEnded) return;
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
        story_id: friend?.storyId,
        mission_id: friend?.missionId,
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
      default:
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
  }, [coinsLoading, flowState, textCoinLocked, voiceCoinLocked]);

  if (!isSignedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b1224', paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: '#0f172a',
            borderWidth: 1,
            borderColor: '#1f2937',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            marginBottom: 16,
          })}
        >
          <MaterialIcons name="arrow-back" size={20} color="#e2e8f0" />
        </Pressable>
        <AccountProgressCard mode="signed-out" onCreateAccount={handleCreateAccount} />
      </View>
    );
  }

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
        <View style={{ backgroundColor: COLORS.header, paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => navigation.goBack()}
              hitSlop={12}
              style={({ pressed }) => ({
                paddingHorizontal: 4,
                paddingVertical: 6,
                marginRight: 12,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontSize: 24, color: 'white', fontWeight: '700', lineHeight: 26 }}>{'‹'}</Text>
            </Pressable>
            <View style={{ width: 42, height: 42, borderRadius: 999, overflow: 'hidden', backgroundColor: '#0b172b', marginRight: 12 }}>
              {avatarSource ? (
                <Image source={avatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: 'white', fontWeight: '900' }}>{avatarInitial}</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: 'white' }} numberOfLines={1}>
                {friend.characterName}
              </Text>
              <Text style={{ fontSize: 12, color: '#e2e8f0' }} numberOfLines={1}>
                {conversationEnded ? 'Conversación terminada' : sourcePost ? 'Respondiendo un post' : 'Conversación libre'}
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
              <MaterialIcons name="help-outline" size={24} color="#a5f3fc" />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {sourcePost ? <SourcePostCard post={sourcePost} friendName={friend.characterName} /> : null}

          <View style={{ padding: 14, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: COLORS.border, marginTop: sourcePost ? 12 : 0 }}>
            <Text style={{ fontWeight: '800', color: '#1e293b' }}>{friend.missionTitle}</Text>
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
                  return (
                    <View key={msg.id} style={{ alignSelf: isAssistant ? 'flex-start' : 'flex-end' }}>
                      <View
                        style={{
                          backgroundColor: isAssistant ? 'white' : COLORS.userBubble,
                          borderRadius: 16,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          maxWidth: '80%',
                          borderWidth: isAssistant ? 1 : 0,
                          borderColor: COLORS.border,
                        }}
                      >
                        <Text style={{ color: isAssistant ? COLORS.assistantText : 'white', lineHeight: 20 }}>
                          {msg.text}
                        </Text>
                        {isAssistant && translationState?.text ? (
                          <>
                            <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 10 }} />
                            <Text style={{ color: COLORS.muted, lineHeight: 20 }}>{translationState.text}</Text>
                          </>
                        ) : null}
                        {isAssistant && translationState?.error ? (
                          <Text style={{ marginTop: 8, color: '#dc2626', fontSize: 12 }}>{translationState.error}</Text>
                        ) : null}
                        {isAssistant ? (
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

          {flowState === 'evaluating' ? (
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
                Analizando tu inglés...
              </Text>
            </View>
          ) : null}

          {analysis ? <AnalysisCard analysis={analysis} /> : null}
          {conversationEnded ? (
            <CompletionCard
              feedback={conversationFeedback}
              friendName={friend.characterName}
              pointsEarned={aiConversationPoints}
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
                  disabled={endingConversation || flowState !== 'idle'}
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
                    opacity: endingConversation || flowState !== 'idle' ? 0.6 : 1,
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
            <StoryMessageComposer
              flowState={flowState}
              retryBlocked={false}
              recordBlocked={coinsLoading || voiceCoinLocked}
              statusLabel={statusLabel}
              onSendText={handleSendText}
              onRecordPressIn={handleRecordPressIn}
              onRecordRelease={handleRecordRelease}
            />
          </View>
        )}

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
                      Chat: {friend.missionTitle}
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
