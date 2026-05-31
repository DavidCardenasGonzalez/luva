import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { api } from '../../api/api';
import { useAuth } from '../../auth/AuthProvider';
import { addFriendFromMission } from '../../hooks/useFriends';
import { useStoryProgress } from '../../progress/StoryProgressProvider';
import useAudioRecorder from '../../shared/useAudioRecorder';
import useUploadToS3 from '../../shared/useUploadToS3';
import {
  trackMetaOnboardingStep4FirstMessage,
  trackMetaOnboardingStep5ReachedFromStep4,
} from '../../marketing/metaAppEvents';
import { trackMixpanelEvent } from '../../marketing/mixpanelEvents';
import { sendOnboardingChatMessage } from '../model/api';
import {
  OnboardingCharacterId,
  OnboardingChatPayload,
  OnboardingSpeakingSummary,
  OnboardingStepContent,
} from '../model/types';
import { GradientText } from '../components/GradientText';

const successSound = require('../../sound/succes_req.mp3');
const luviLoading = require('../../image/luvi-loading.gif');

const LUNA_COLOR = '#a855f7';
const LUNA_GRADIENT: [string, string] = ['#a855f7', '#c084fc'];
const INITIAL_MESSAGE_DELAY_MS = 700;
const SKIP_INITIAL_MESSAGE_PHRASE = 'or you can skip this part for now if you prefer';

const CHARACTER_PROFILES: Record<OnboardingCharacterId, {
  name: string;
  color: string;
  avatarBg: string;
  image: any;
}> = {
  zoe: {
    name: 'Zoe',
    color: '#a855f7',
    avatarBg: 'rgba(109, 40, 217, 0.42)',
    image: require('../step-3/Zoe.png'),
  },
  mateo: {
    name: 'Mateo',
    color: '#22d3ee',
    avatarBg: 'rgba(6, 79, 105, 0.42)',
    image: require('../step-3/Mateo.png'),
  },
};

const ONBOARDING_STORY_ID = 'initials';
const ONBOARDING_FIRST_MISSIONS: Record<OnboardingCharacterId, {
  missionId: string;
  sceneIndex: number;
  title: string;
  sceneSummary: string;
  aiRole: string;
  avatarImageUrl: string;
}> = {
  mateo: {
    missionId: 'meet_mateo_first_mission',
    sceneIndex: 0,
    title: 'Conoce a Mateo',
    sceneSummary:
      'Tu primera misión con Mateo, un Virtual Agent divertido y espontáneo que quiere demostrarte que practicar inglés también puede sentirse dinámico, natural y entretenido.',
    aiRole:
      'Eres Mateo, un Virtual Agent dentro de una app para aprender inglés. Tu personalidad es segura, divertida, espontánea, carismática, cálida, ligeramente coqueta y muy fácil de seguir. Habla en inglés simple, nivel B1, con frases cortas y naturales.',
    avatarImageUrl:
      'https://d2ozl81tz5pxlo.cloudfront.net/storiesProfile/20260509182223-f7ef4b5b-9f42-41d3-b537-b83fc1e3db17.png',
  },
  zoe: {
    missionId: 'meet_zoe_first_mission',
    sceneIndex: 1,
    title: 'Conoce a Zoe',
    sceneSummary:
      'Tu primera misión con Zoe, una Virtual Agent tranquila y cercana que quiere demostrarte que también puedes tener conversaciones reales y personales en inglés.',
    aiRole:
      'Eres Zoe, una Virtual Agent dentro de una app para aprender inglés. Tu personalidad es tranquila, natural, cercana, divertida, cálida, ligeramente coqueta y emocionalmente inteligente. Habla en inglés simple, nivel B1, con frases cortas y naturales.',
    avatarImageUrl:
      'https://d2ozl81tz5pxlo.cloudfront.net/storiesProfile/20260509182334-992b19f2-f707-452e-bd38-3d8febf4e92e.png',
  },
};

const COLORS = {
  background: '#07111f',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  card: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
  userBubble: '#5b21b6',
};

const REQUIREMENTS = [
  { id: 'name', icon: 'person', title: 'Di tu nombre', subtitle: 'Cuéntanos cómo te llamas.' },
  { id: 'why', icon: 'gps-fixed', title: 'Explica por qué quieres aprender inglés', subtitle: 'Cuéntanos tu objetivo o motivación.' },
] as const;

type RequirementId = typeof REQUIREMENTS[number]['id'];

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
type FlowState = 'idle' | 'recording' | 'uploading' | 'transcribing' | 'evaluating';
type MessageTranslation = { text?: string; loading?: boolean; error?: string };
type ExtractedProfile = NonNullable<OnboardingChatPayload['profile']>;
type TranslationResponse = {
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage: string;
};

function isVisibleRequirementId(id: string): id is RequirementId {
  return REQUIREMENTS.some((item) => item.id === id);
}

function getPayloadRequirements(payload: OnboardingChatPayload): Set<RequirementId> | null {
  if (!Array.isArray(payload.requirements)) return null;

  const ids = new Set<RequirementId>();
  payload.requirements.forEach((requirement) => {
    if (requirement.met && isVisibleRequirementId(requirement.id)) {
      ids.add(requirement.id);
    }
  });
  return ids;
}

function checkRequirements(messages: ChatMessage[]): Set<RequirementId> {
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.text)
    .join(' ');
  const met = new Set<RequirementId>();
  if (/my name is|i'?m |i am |me llamo|soy /i.test(userText)) met.add('name');
  if (/because|want to (learn|improve|practice)|to (learn|improve|get|work|travel)|para (aprender|mejorar|trabajar|viajar)/i.test(userText)) met.add('why');
  return met;
}

function getWordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function mergeProfile(current: ExtractedProfile, next?: ExtractedProfile): ExtractedProfile {
  if (!next) return current;
  return {
    ...current,
    ...(next.name?.trim() ? { name: next.name.trim() } : {}),
    ...(next.bio?.trim() ? { bio: next.bio.trim() } : {}),
    ...(next.goal?.trim() ? { goal: next.goal.trim() } : {}),
  };
}

type Props = {
  content: OnboardingStepContent;
  selectedCharacter: OnboardingCharacterId | null;
  onNext: () => void;
  onComplete: (summary: OnboardingSpeakingSummary) => void;
};

function getInitialAssistantMessages(characterName: string) {
  return [
    `Hey! I’m ${characterName} 👋, real conversations are the fastest way to improve your English.`,
    // 'Don’t worry about mistakes 😊 I’ll help you with feedback and more natural ways to say things.',
    'We can practice your first conversation right now, or you can skip this part for now if you prefer.',
    'First question 👀 What’s your name?',
  ];
}

function AnimatedMessage({ children }: { children: ReactNode }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

function renderAssistantText(text: string, onSkip: () => void) {
  const phraseIndex = text.indexOf(SKIP_INITIAL_MESSAGE_PHRASE);
  if (phraseIndex < 0) {
    return <Text style={{ color: COLORS.text, fontSize: 14, lineHeight: 21 }}>{text}</Text>;
  }

  const before = text.slice(0, phraseIndex);
  const after = text.slice(phraseIndex + SKIP_INITIAL_MESSAGE_PHRASE.length);

  return (
    <Text style={{ color: COLORS.text, fontSize: 14, lineHeight: 21 }}>
      {before}
      <Text
        accessibilityRole="button"
        onPress={onSkip}
        style={{ color: LUNA_COLOR, fontWeight: '900', textDecorationLine: 'underline' }}
      >
        {SKIP_INITIAL_MESSAGE_PHRASE}
      </Text>
      {after}
    </Text>
  );
}

export default function Step4({ content: _content, selectedCharacter, onNext, onComplete }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const isStartingRecording = useRef(false);
  const stopRequestedWhileStarting = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const confettiKeyRef = useRef(0);
  const prevMetRef = useRef<Set<RequirementId>>(new Set());
  const onboardingMissionSyncPromiseRef = useRef<Promise<void> | null>(null);
  const trackedFirstMessageMetaRef = useRef(false);
  const trackedStep5MetaRef = useRef(false);
  const introMessagesStartedRef = useRef(false);
  const trackedSkipRef = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<OnboardingChatPayload | null>(null);
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [confetti, setConfetti] = useState<{ key: number; count: number } | null>(null);
  const [missionComplete, setMissionComplete] = useState(false);
  const [evaluatedRequirements, setEvaluatedRequirements] = useState<Set<RequirementId> | null>(null);
  const [keyboardAvoiderKey, setKeyboardAvoiderKey] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [messageTranslations, setMessageTranslations] = useState<Record<string, MessageTranslation>>({});
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile>({});
  const [introMessagesComplete, setIntroMessagesComplete] = useState(false);

  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const { isSignedIn, updateCurrentUser } = useAuth();
  const { markMissionCompleted } = useStoryProgress();

  const metRequirements = evaluatedRequirements ?? checkRequirements(messages);
  const companion = CHARACTER_PROFILES[selectedCharacter ?? 'zoe'];

  useEffect(() => {
    if (introMessagesStartedRef.current) return;
    introMessagesStartedRef.current = true;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const initialMessages = getInitialAssistantMessages(companion.name);

    initialMessages.forEach((text, index) => {
      timers.push(setTimeout(() => {
        const messageId = `intro-${selectedCharacter ?? 'zoe'}-${index}`;
        setMessages((current) => [
          ...current,
          {
            id: messageId,
            role: 'assistant',
            text,
          },
        ]);
        void trackMixpanelEvent('onboarding_step4_message', {
          event_category: 'onboarding',
          step_number: 4,
          step_id: 'step-4',
          character_id: selectedCharacter ?? 'zoe',
          role: 'assistant',
          message_source: 'intro',
          message_index: index + 1,
          message_length: text.length,
          message_word_count: getWordCount(text),
        });

        if (index === initialMessages.length - 1) {
          setIntroMessagesComplete(true);
        }
      }, INITIAL_MESSAGE_DELAY_MS * index));
    });

    return () => {
      timers.forEach(clearTimeout);
      introMessagesStartedRef.current = false;
    };
  }, [companion.name, selectedCharacter]);

  const handleSkipPractice = useCallback(() => {
    if (!trackedSkipRef.current) {
      trackedSkipRef.current = true;
      void trackMixpanelEvent('onboarding_step4_skipped', {
        event_category: 'onboarding',
        step_number: 4,
        step_id: 'step-4',
        character_id: selectedCharacter ?? 'zoe',
        user_message_count: messages.filter((message) => message.role === 'user').length,
        assistant_message_count: messages.filter((message) => message.role === 'assistant').length,
        completed_requirement_count: metRequirements.size,
        completed_requirement_ids: Array.from(metRequirements).join(','),
      });
    }
    onNext();
  }, [messages, metRequirements, onNext, selectedCharacter]);

  const syncCompletedOnboardingMission = useCallback(async () => {
    if (!onboardingMissionSyncPromiseRef.current) {
      onboardingMissionSyncPromiseRef.current = (async () => {
        const characterId = selectedCharacter ?? 'zoe';
        const mission = ONBOARDING_FIRST_MISSIONS[characterId];

        await markMissionCompleted(ONBOARDING_STORY_ID, mission.missionId);

        try {
          await addFriendFromMission({
            characterId: `${ONBOARDING_STORY_ID}:${mission.missionId}`,
            characterName: CHARACTER_PROFILES[characterId].name,
            aiRole: mission.aiRole,
            avatarImageUrl: mission.avatarImageUrl,
          }, {
            localOnly: !isSignedIn,
          });
        } catch (err: any) {
          console.warn('[Onboarding] No se pudo agregar el amigo inicial:', err?.message || err);
        }
      })();
    }

    await onboardingMissionSyncPromiseRef.current;
  }, [isSignedIn, markMissionCompleted, selectedCharacter]);

  useEffect(() => {
    let mounted = true;

    recorder.ensurePermission()
      .then((granted) => {
        if (!mounted || granted) return;
        setError('Activa el permiso de micrófono para grabar.');
      })
      .catch(() => {
        if (mounted) setError('No pudimos solicitar el permiso de micrófono.');
      });

    return () => {
      mounted = false;
    };
  }, [recorder]);

  // Unload sound on unmount
  useEffect(() => {
    return () => {
      const s = soundRef.current;
      if (s) {
        s.setOnPlaybackStatusUpdate(null);
        void s.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const playSuccessSound = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch { /* ignore */ }

    const prev = soundRef.current;
    if (prev) {
      prev.setOnPlaybackStatusUpdate(null);
      soundRef.current = null;
      void prev.unloadAsync().catch(() => {});
    }

    try {
      const { sound } = await Audio.Sound.createAsync(successSound, { shouldPlay: true, volume: 1 });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || !status.didJustFinish) return;
        sound.setOnPlaybackStatusUpdate(null);
        if (soundRef.current === sound) soundRef.current = null;
        void sound.unloadAsync().catch(() => {});
      });
    } catch { /* ignore */ }
  }, []);

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
      } catch { /* ignore */ }

      Speech.stop();
      Speech.speak(speechText, { language: 'en-US', pitch: 1.05 });
    } catch { /* ignore */ }
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

  // Detect newly-met requirements and trigger celebration
  useEffect(() => {
    const newly = Array.from(metRequirements).filter((id) => !prevMetRef.current.has(id));
    if (newly.length === 0) return;

    prevMetRef.current = new Set(metRequirements);
    const allMet = metRequirements.size === REQUIREMENTS.length;

    confettiKeyRef.current += 1;
    setConfetti({
      key: confettiKeyRef.current,
      count: allMet ? 280 : 140,
    });
    void playSuccessSound();

    if (allMet) setMissionComplete(true);
  }, [metRequirements, playSuccessSound]);

  useEffect(() => {
    if (!missionComplete) return;
    void syncCompletedOnboardingMission();
  }, [missionComplete, syncCompletedOnboardingMission]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        setKeyboardAvoiderKey((prev) => prev + 1);
        return;
      }
      if (next !== 'background') return;
      if (!isStartingRecording.current && !recorder.isRecording()) return;
      isStartingRecording.current = false;
      stopRequestedWhileStarting.current = false;
      setFlowState('idle');
      void recorder.cancel().catch(() => {});
    });
    return () => {
      sub.remove();
      void recorder.cancel().catch(() => {});
    };
  }, [recorder]);

  const handleAdvance = useCallback(async (
    transcript: string,
    sessionId?: string,
    inputMethod: 'text' | 'audio' = 'text'
  ) => {
    const trimmed = transcript.trim();
    if (!trimmed) { setFlowState('idle'); return; }

    setError(null);
    setAnalysis(null);
    setFlowState('evaluating');

    const pendingMsg: ChatMessage = { id: `user-${Date.now()}`, role: 'user', text: trimmed };
    const nextMessages = [...messages, pendingMsg];
    setMessages(nextMessages);
    const userMessageCount = nextMessages.filter((message) => message.role === 'user').length;

    void trackMixpanelEvent('onboarding_step4_message', {
      event_category: 'onboarding',
      step_number: 4,
      step_id: 'step-4',
      character_id: selectedCharacter ?? 'zoe',
      role: 'user',
      message_source: 'practice',
      message_index: userMessageCount,
      input_method: inputMethod,
      message_length: trimmed.length,
      message_word_count: getWordCount(trimmed),
      history_message_count: nextMessages.length,
      completed_requirement_count: metRequirements.size,
      completed_requirement_ids: Array.from(metRequirements).join(','),
    });

    if (!trackedFirstMessageMetaRef.current) {
      trackedFirstMessageMetaRef.current = true;
      void trackMetaOnboardingStep4FirstMessage({
        characterId: selectedCharacter ?? 'zoe',
        messageCount: userMessageCount,
      });
    }

    const history = nextMessages.map(({ role, text }) => ({
      role: role as 'user' | 'assistant',
      content: text,
    }));

    try {
      const payload = await sendOnboardingChatMessage({
        sessionId,
        transcript: trimmed,
        characterId: selectedCharacter ?? 'zoe',
        history,
      });
      const assistantMessageCount =
        nextMessages.filter((message) => message.role === 'assistant').length + 1;
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'assistant', text: payload.aiReply },
      ]);
      void trackMixpanelEvent('onboarding_step4_message', {
        event_category: 'onboarding',
        step_number: 4,
        step_id: 'step-4',
        character_id: selectedCharacter ?? 'zoe',
        role: 'assistant',
        message_source: 'practice',
        message_index: assistantMessageCount,
        message_length: payload.aiReply.length,
        message_word_count: getWordCount(payload.aiReply),
        history_message_count: nextMessages.length + 1,
        result: payload.result,
        correctness: payload.correctness,
        objective_complete: payload.objectiveComplete,
      });
      setAnalysis(payload);
      if (payload.profile) {
        setExtractedProfile((current) => mergeProfile(current, payload.profile));
      }
      const payloadRequirements = getPayloadRequirements(payload);
      if (payloadRequirements) {
        setEvaluatedRequirements((previous) => {
          if (!previous) return payloadRequirements;
          return new Set([...previous, ...payloadRequirements]);
        });
        if (payload.objectiveComplete) setMissionComplete(true);
      }
    } catch (err: any) {
      setError(err?.message || 'No pudimos continuar la conversación.');
    } finally {
      setFlowState('idle');
    }
  }, [messages, metRequirements, selectedCharacter]);

  const handleSendText = useCallback(async (text: string) => {
    try {
      await handleAdvance(text, undefined, 'text');
      return true;
    } catch {
      setFlowState('idle');
      return false;
    }
  }, [handleAdvance]);

  const handleRecordRelease = useCallback(async (skipStartGuard = false) => {
    try {
      if (isStartingRecording.current && !skipStartGuard) {
        stopRequestedWhileStarting.current = true;
        setFlowState('idle');
        return;
      }
      if (!recorder.isRecording()) { setFlowState('idle'); return; }

      const recording = await recorder.stop();
      setFlowState('uploading');
      const session = await api.post<{ sessionId: string; uploadUrl: string }>('/sessions/start', {});
      await uploader.put(session.uploadUrl, { uri: recording.uri }, recording.contentType);
      setAnalysis(null);
      setFlowState('transcribing');
      const { transcript } = await api.post<{ transcript: string }>(`/sessions/${session.sessionId}/transcribe`);
      await handleAdvance(transcript || '', session.sessionId, 'audio');
    } catch (err: any) {
      setError(err?.message || 'No pudimos procesar tu audio.');
      setFlowState('idle');
    }
  }, [handleAdvance, recorder, uploader]);

  const handleRecordPressIn = useCallback(async () => {
    try {
      const granted = await recorder.ensurePermission();
      if (!granted) { setError('Activa el permiso de micrófono para grabar.'); return; }
      setError(null);
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
      const msg = err?.message || '';
      setError(msg === 'La grabacion se cancelo al salir de la app.' ? null : msg || 'No pudimos iniciar la grabación.');
      setFlowState('idle');
      isStartingRecording.current = false;
      stopRequestedWhileStarting.current = false;
    }
  }, [handleRecordRelease, recorder]);

  const handleFinishMission = useCallback(async () => {
    await syncCompletedOnboardingMission();

    if (!trackedStep5MetaRef.current) {
      trackedStep5MetaRef.current = true;
      void trackMetaOnboardingStep5ReachedFromStep4({
        characterId: selectedCharacter ?? 'zoe',
        completedRequirementIds: Array.from(metRequirements),
        messageCount: messages.filter((message) => message.role === 'user').length,
      });
    }

    onComplete({
      messages: messages.map(({ role, text }) => ({
        role: role as 'user' | 'assistant',
        content: text,
      })),
      ...(extractedProfile.name || extractedProfile.bio || extractedProfile.goal
        ? { profile: extractedProfile }
        : {}),
      completedRequirementIds: Array.from(metRequirements),
    });

    if (isSignedIn && (extractedProfile.name || extractedProfile.bio || extractedProfile.goal)) {
      await updateCurrentUser({
        displayName: extractedProfile.name,
        bio: extractedProfile.bio,
        goal: extractedProfile.goal,
      });
    }
    onNext();
  }, [
    extractedProfile,
    isSignedIn,
    messages,
    metRequirements,
    onComplete,
    onNext,
    selectedCharacter,
    syncCompletedOnboardingMission,
    updateCurrentUser,
  ]);

  const sendDisabled = flowState !== 'idle' || !introMessagesComplete || !inputText.trim();
  const micDisabled = flowState === 'recording' ? false : flowState !== 'idle' || !introMessagesComplete;
  const loadingLabel =
    flowState === 'uploading'
      ? 'Subiendo tu audio...'
      : flowState === 'transcribing'
      ? 'Transcribiendo tu respuesta...'
      : flowState === 'evaluating'
      ? 'Analizando tu respuesta...'
      : 'Cargando...';

  return (
    <KeyboardAvoidingView
      key={keyboardAvoiderKey}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? Math.max(insets.bottom, 90) : 0}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <View style={{ flex: 1 }}>
        {/* Confetti overlay */}
        {confetti && (
          <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
            <ConfettiCannon
              key={confetti.key}
              count={confetti.count}
              origin={{ x: windowWidth / 2, y: 0 }}
              fadeOut
              fallSpeed={2800}
              explosionSpeed={420}
              onAnimationEnd={() =>
                setConfetti((c) => (c?.key === confetti.key ? null : c))
              }
            />
          </View>
        )}
        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 4, minHeight: 104 }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '800' }}>Tu primera misión</Text>
            <MaterialIcons name="gps-fixed" size={15} color={LUNA_COLOR} />
          </View>
          <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: '900', lineHeight: 36 }}>
            {'Preséntate\nen '}
            <GradientText colors={LUNA_GRADIENT} style={{ fontSize: 30, fontWeight: '900', lineHeight: 36 }}>
              inglés
            </GradientText>
            {' ✨'}
          </Text>
        </View>

        {/* Selected companion avatar */}
        <View style={{ width: 94, alignItems: 'center' }}>
          <View style={{
            width: 86, height: 86, borderRadius: 43,
            backgroundColor: companion.avatarBg,
            borderWidth: 2, borderColor: companion.color,
            alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <Image
              source={companion.image}
              resizeMode="cover"
              accessibilityLabel={`Avatar de ${companion.name}`}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        </View>
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 10 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
        {/* Requirements card */}
        <View style={{ backgroundColor: COLORS.card, borderRadius: 16, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <MaterialIcons name="assignment" size={16} color={LUNA_COLOR} />
            <Text style={{ color: LUNA_COLOR, fontSize: 13, fontWeight: '900' }}>Requisitos</Text>
          </View>
          <View style={{ gap: 6 }}>
            {REQUIREMENTS.map((req) => {
              const met = metRequirements.has(req.id);
              return (
                <View key={req.id} style={{
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 12, borderWidth: 1,
                  borderColor: met ? `${LUNA_COLOR}40` : COLORS.cardBorder,
                  paddingHorizontal: 10, paddingVertical: 8, gap: 8,
                }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: `${LUNA_COLOR}20`,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MaterialIcons name={req.icon as any} size={16} color={LUNA_COLOR} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: '800', lineHeight: 16 }}>{req.title}</Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
                    backgroundColor: met ? 'rgba(16, 185, 129, 0.16)' : 'rgba(34, 211, 238, 0.12)',
                    borderWidth: 1,
                    borderColor: met ? '#10b981' : 'rgba(34, 211, 238, 0.35)',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Text style={{ color: met ? '#86efac' : COLORS.cyan, fontSize: 10, fontWeight: '800' }}>
                      {met ? 'Listo' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Chat messages ── */}
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <AnimatedMessage key={msg.id}>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{
                    maxWidth: '86%', backgroundColor: COLORS.userBubble,
                    borderRadius: 18, borderBottomRightRadius: 4,
                    paddingHorizontal: 14, paddingVertical: 12,
                  }}>
                    <Text style={{ color: COLORS.text, fontSize: 14, lineHeight: 21 }}>{msg.text}</Text>
                  </View>
                </View>
              </AnimatedMessage>
            );
          }

          const translationState = messageTranslations[msg.id];

          return (
            <AnimatedMessage key={msg.id}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: `${LUNA_COLOR}22`, borderWidth: 1, borderColor: `${LUNA_COLOR}44`,
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
                }}>
                  <Image
                    source={companion.image}
                    resizeMode="cover"
                    accessibilityLabel={`Avatar de ${companion.name}`}
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
                <View style={{
                  backgroundColor: COLORS.card, borderRadius: 18, borderBottomLeftRadius: 4,
                  borderWidth: 1, borderColor: COLORS.cardBorder,
                  paddingHorizontal: 14, paddingVertical: 12, maxWidth: '78%',
                }}>
                  {renderAssistantText(msg.text, handleSkipPractice)}
                  {translationState?.text ? (
                    <>
                      <View style={{ height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 10 }} />
                      <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 21 }}>
                        {translationState.text}
                      </Text>
                    </>
                  ) : null}
                  {translationState?.error ? (
                    <Text style={{ marginTop: 8, color: '#ef4444', fontSize: 12 }}>
                      {translationState.error}
                    </Text>
                  ) : null}
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
                </View>
              </View>
            </AnimatedMessage>
          );
        })}

        {/* ── Feedback card (last analysis) ── */}
        {analysis && (
          <View style={{
            backgroundColor: COLORS.card, borderRadius: 18, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 14,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="auto-awesome" size={15} color={COLORS.cyan} />
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '900' }}>Feedback</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 90 }}>
                <Text style={{ color: COLORS.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Correctness</Text>
                <Text style={{ color: analysis.result === 'correct' ? '#10b981' : analysis.result === 'partial' ? '#f59e0b' : '#ef4444', fontSize: 34, fontWeight: '900', lineHeight: 42 }}>
                  {analysis.correctness}%
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 11, lineHeight: 15 }}>
                  {analysis.result === 'correct' ? '¡Excelente! Muy natural.' : analysis.result === 'partial' ? 'Buen intento, sigue practicando.' : 'Sigue intentándolo.'}
                </Text>
              </View>

              <View style={{ width: 1, backgroundColor: 'rgba(148, 163, 184, 0.16)' }} />

              <View style={{ flex: 1 }}>
                {analysis.errors.length > 0 && (
                  <>
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '900', marginBottom: 6 }}>Errores detectados</Text>
                    {analysis.errors.map((e, i) => (
                      <Text key={i} style={{ color: COLORS.muted, fontSize: 11, lineHeight: 15, marginBottom: 4 }}>{'• '}{e}</Text>
                    ))}
                  </>
                )}
                {analysis.reformulations.length > 0 && (
                  <>
                    <Text style={{ color: LUNA_COLOR, fontSize: 12, fontWeight: '900', marginBottom: 6, marginTop: analysis.errors.length > 0 ? 8 : 0 }}>Reformulaciones sugeridas</Text>
                    {analysis.reformulations.map((r, i) => (
                      <Text key={i} style={{ color: COLORS.muted, fontSize: 11, lineHeight: 15, marginBottom: 4 }}>{'• '}{r}</Text>
                    ))}
                  </>
                )}
                {analysis.errors.length === 0 && analysis.reformulations.length === 0 && (
                  <Text style={{ color: '#10b981', fontSize: 12, lineHeight: 18 }}>Tu mensaje sonó natural. ✓</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Mission complete banner */}
        {missionComplete && (
          <View style={{
            backgroundColor: 'rgba(16, 185, 129, 0.10)',
            borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.35)',
            padding: 18, gap: 14,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <MaterialIcons name="emoji-events" size={26} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#10b981', fontSize: 16, fontWeight: '900' }}>
                  ¡Misión completada! 🎉
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 18, marginTop: 2 }}>
                  {`Podrás seguir hablando con ${companion.name} más adelante.`}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => void handleFinishMission()}
              accessibilityRole="button"
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#059669' : '#10b981',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <MaterialIcons name="auto-awesome" size={18} color="#ffffff" />
              <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '900' }}>
                Recibir mi plan personalizado
              </Text>
            </Pressable>
          </View>
        )}

        {/* Status / error */}
        {(flowState !== 'idle' || error) && (
          <View style={{ alignItems: 'center', paddingVertical: 6 }}>
            {error ? (
              <Text style={{ color: '#ef4444', fontSize: 13 }}>
                {error}
              </Text>
            ) : (
              <View
                style={{
                  backgroundColor: '#0f172a',
                  borderWidth: 1,
                  borderColor: '#1f2937',
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  minWidth: 220,
                  alignItems: 'center',
                }}
              >
                <Image
                  source={luviLoading}
                  resizeMode="contain"
                  accessibilityLabel="Cargando"
                  style={{ width: 72, height: 72 }}
                />
                <Text
                  style={{
                    color: '#e2e8f0',
                    fontWeight: '700',
                    marginTop: 12,
                    textAlign: 'center',
                  }}
                >
                  {loadingLabel}
                </Text>
              </View>
            )}
          </View>
        )}
        </ScrollView>

        {/* ── Dark-themed input bar ── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 12,
          paddingTop: 10,
          paddingBottom: keyboardVisible ? 12 : 8,
          borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
          backgroundColor: COLORS.background,
        }}>
        {/* Text input */}
        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 22,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
          paddingHorizontal: 14, paddingVertical: 8, minHeight: 42,
        }}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Escribe tu mensaje en inglés..."
            placeholderTextColor={COLORS.muted}
            multiline
            editable={flowState === 'idle' && introMessagesComplete}
            style={{ flex: 1, color: COLORS.text, fontSize: 14, maxHeight: 100, paddingVertical: 0, paddingRight: 8 }}
            onSubmitEditing={async () => {
              const t = inputText.trim();
              if (!t || sendDisabled) return;
              setInputText('');
              await handleSendText(t);
            }}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          {/* Send button */}
          <Pressable
            disabled={sendDisabled}
            onPress={async () => {
              const t = inputText.trim();
              if (!t) return;
              setInputText('');
              await handleSendText(t);
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
              backgroundColor: sendDisabled ? 'rgba(255,255,255,0.08)' : pressed ? '#7c3aed' : LUNA_COLOR,
            })}
          >
            <MaterialIcons name="arrow-forward" size={18} color={sendDisabled ? COLORS.muted : '#ffffff'} />
          </Pressable>
        </View>

        {/* Mic button */}
        <Pressable
          onPressIn={!micDisabled ? handleRecordPressIn : undefined}
          onPressOut={!micDisabled ? () => void handleRecordRelease() : undefined}
          disabled={micDisabled && flowState !== 'recording'}
          style={({ pressed }) => ({
            width: 44, height: 44, borderRadius: 22,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor:
              flowState === 'recording' ? '#dc2626'
              : micDisabled ? 'rgba(255,255,255,0.08)'
              : pressed ? '#7c3aed'
              : LUNA_COLOR,
          })}
        >
          <MaterialIcons name="mic" size={22} color={micDisabled && flowState !== 'recording' ? COLORS.muted : '#ffffff'} />
        </Pressable>

        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
