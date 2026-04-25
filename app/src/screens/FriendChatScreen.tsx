import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { RootStackParamList } from '../navigation/AppNavigator';
import StoryMessageComposer, { StoryFlowState } from '../components/StoryMessageComposer';
import AccountProgressCard from '../components/AccountProgressCard';
import { useAuth } from '../auth/AuthProvider';
import { api } from '../api/api';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import { FriendChatPayload, sendFriendChatMessage, useFriends } from '../hooks/useFriends';
import { getChatAvatar } from '../chatimages/chatAvatarMap';

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

type MessageTranslationState = {
  text?: string;
  loading?: boolean;
  error?: string;
};

const COLORS = {
  header: '#0b1224',
  background: '#f8fafc',
  border: '#e2e8f0',
  userBubble: '#4f46e5',
  assistantText: '#0f172a',
  muted: '#475569',
};

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

export default function FriendChatScreen({ navigation, route }: Props) {
  const friendId = route.params?.friendId;
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const { friends, loading, loaded, error, reload } = useFriends();
  const friend = useMemo(
    () => friends.find((item) => item.friendId === friendId),
    [friendId, friends]
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageTranslations, setMessageTranslations] = useState<Record<string, MessageTranslationState>>({});
  const [analysis, setAnalysis] = useState<FriendChatPayload | null>(null);
  const [flowState, setFlowState] = useState<StoryFlowState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [keyboardAvoiderKey, setKeyboardAvoiderKey] = useState(0);
  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const scrollRef = useRef<ScrollView>(null);
  const isStartingRecording = useRef(false);
  const stopRequestedWhileStarting = useRef(false);

  const avatarSource = useMemo(() => {
    if (!friend) return undefined;
    return friend.avatarImageUrl?.trim()
      ? { uri: friend.avatarImageUrl }
      : getChatAvatar(friend.missionId);
  }, [friend]);
  const avatarInitial = (friend?.characterName.trim().charAt(0) || '?').toUpperCase();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (friendId) {
      void reload();
    }
  }, [friendId, reload]);

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
      Speech.speak(speechText, { language: 'en-US', pitch: 1.05 });
    } catch (err: any) {
      console.warn('Friend speech playback failed', err?.message || err);
    }
  }, []);

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
  }, [messageTranslations]);

  const handleAdvance = useCallback(
    async (transcript: string, sessionId?: string) => {
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

      setErrorMessage(null);
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

      try {
        const payload = await sendFriendChatMessage(friendId, {
          sessionId,
          transcript: trimmed,
          history: historyPayload,
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
    [friendId, messages]
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
      await handleAdvance(transcription.transcript || '', session.sessionId);
    } catch (err: any) {
      setErrorMessage(err?.message || 'No pudimos procesar tu audio.');
      setFlowState('idle');
    }
  }, [friendId, handleAdvance, recorder, uploader]);

  const handleRecordPressIn = useCallback(async () => {
    try {
      const hasMicPermission = await recorder.ensurePermission();
      if (!hasMicPermission) {
        setErrorMessage('Activa el permiso de micrófono para grabar.');
        return;
      }
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
  }, [handleRecordRelease, recorder]);

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
        return '';
    }
  }, [flowState]);

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
                Conversación libre
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ padding: 14, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ fontWeight: '800', color: '#1e293b' }}>{friend.missionTitle}</Text>
            <Text style={{ color: COLORS.muted, marginTop: 6, lineHeight: 20 }}>
              Ahora puedes practicar sin requisitos. Mantén la conversación en inglés y revisa el feedback después de cada mensaje.
            </Text>
          </View>

          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Conversación</Text>
            {messages.length === 0 ? (
              <View style={{ padding: 16, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: COLORS.border }}>
                <Text style={{ color: COLORS.muted }}>
                  Escríbele o graba tu primer mensaje para empezar una práctica libre.
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

          {analysis ? <AnalysisCard analysis={analysis} /> : null}
        </ScrollView>

        {errorMessage ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ color: '#dc2626' }}>{errorMessage}</Text>
          </View>
        ) : null}

        <StoryMessageComposer
          flowState={flowState}
          retryBlocked={false}
          recordBlocked={false}
          statusLabel={statusLabel}
          onSendText={handleSendText}
          onRecordPressIn={handleRecordPressIn}
          onRecordRelease={handleRecordRelease}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
