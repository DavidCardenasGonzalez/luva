import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  TextInput,
  AppState,
  NativeModules,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio, ResizeMode, Video } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import ConfettiCannon from 'react-native-confetti-cannon';
import useAudioRecorder from '../shared/useAudioRecorder';
import useUploadToS3 from '../shared/useUploadToS3';
import { api } from '../api/api';
import {
  StoryRequirementState,
  useStoryDetail,
} from '../hooks/useStories';
import { useStoryProgress } from '../progress/StoryProgressProvider';
import type {
  StoryAnalysis,
  StoryAttemptSnapshot,
  StoryConversationFeedback,
  StoryRequirementProgress,
  StoryRetryState,
} from '../progress/types';
import StoryMessageComposer from '../components/StoryMessageComposer';
import { getChatAvatar } from '../chatimages/chatAvatarMap';
import { useCoins, CHAT_MISSION_COST, RECORDING_COST } from '../purchases/CoinBalanceProvider';
import CoinCountChip from '../components/CoinCountChip';
import TourOverlay, { TourHighlight } from '../components/TourOverlay';
import { hasSeenTour, markTourAsSeen } from '../tour/tourProgress';
import {
  trackMissionCompleted,
  trackMissionStarted,
} from '../marketing/metaAppEvents';
import {
  trackMixpanelMissionCompleted,
  trackMixpanelMissionHelpRequested,
  trackMixpanelMissionMessageSent,
  trackMixpanelMissionStarted,
  trackMixpanelMissionVisited,
} from '../marketing/mixpanelEvents';
import { prefetchImageUrls } from '../shared/imagePrefetch';

const luviImage = require('../image/luvi.png');
const successRequirementSoundAsset = require('../sound/succes_req.mp3');

type StoryMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

type StoryAdvancePayload = {
  sceneIndex: number;
  missionCompleted: boolean;
  storyCompleted: boolean;
  requirements: StoryRequirementState[];
  aiReply: string;
  correctness: number;
  result: 'correct' | 'partial' | 'incorrect';
  errors: string[];
  reformulations: string[];
  conversationFeedback?: {
    summary: string;
    improvements: string[];
  } | null;
};

type StoryAssistanceResponse = {
  answer: string;
};

type RequirementCelebrationPiece = {
  key: string;
  angle: number;
  distance: number;
  size: number;
  color: string;
  rotation: string;
};

type RequirementRowProps = {
  requirement: StoryRequirementState;
  celebrationToken: number;
  onPress: (text: string) => void;
};

type RequirementConfettiBurst = {
  key: number;
  count: number;
};

const REQUIREMENT_BURST_COLORS = [
  '#22c55e',
  '#38bdf8',
  '#f59e0b',
  '#f472b6',
  '#a78bfa',
  '#facc15',
];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createRequirementCelebrationPieces(seed: string): RequirementCelebrationPiece[] {
  const hashedSeed = hashString(seed);
  const count = 10;
  const angleOffset = ((hashedSeed % 360) * Math.PI) / 180;

  return Array.from({ length: count }, (_, index) => {
    const angle = angleOffset + (index / count) * Math.PI * 2;
    return {
      key: `${seed}-${index}`,
      angle,
      distance: 18 + ((hashedSeed + index * 13) % 14),
      size: 5 + ((hashedSeed + index * 7) % 4),
      color: REQUIREMENT_BURST_COLORS[(hashedSeed + index) % REQUIREMENT_BURST_COLORS.length],
      rotation: `${((hashedSeed + index * 29) % 120) - 60}deg`,
    };
  });
}

function RequirementRow({ requirement, celebrationToken, onPress }: RequirementRowProps) {
  const iconScale = useRef(new Animated.Value(1)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;
  const highlightOpacity = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () => createRequirementCelebrationPieces(requirement.requirementId),
    [requirement.requirementId]
  );

  useEffect(() => {
    if (!requirement.met || celebrationToken < 1) {
      return;
    }

    iconScale.stopAnimation();
    burstProgress.stopAnimation();
    highlightOpacity.stopAnimation();

    iconScale.setValue(0.92);
    burstProgress.setValue(0);
    highlightOpacity.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(iconScale, {
          toValue: 1.22,
          tension: 220,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          tension: 180,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(highlightOpacity, {
          toValue: 0.95,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(highlightOpacity, {
          toValue: 0,
          duration: 540,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(burstProgress, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        burstProgress.setValue(0);
      }
    });
  }, [burstProgress, celebrationToken, highlightOpacity, iconScale, requirement.met]);

  const ringScale = burstProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.9],
  });
  const ringOpacity = burstProgress.interpolate({
    inputRange: [0, 0.12, 0.7, 1],
    outputRange: [0, 0.75, 0.2, 0],
  });
  const particleOpacity = burstProgress.interpolate({
    inputRange: [0, 0.08, 0.65, 1],
    outputRange: [0, 1, 0.45, 0],
  });
  const particleScale = burstProgress.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [0.35, 1, 0.8],
  });

  return (
    <View style={{ marginBottom: 8, position: 'relative' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: 14,
            backgroundColor: '#dcfce7',
            opacity: highlightOpacity,
          },
        ]}
      />
      <Pressable
        onPress={() => onPress(requirement.text)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'flex-start',
          paddingVertical: 4,
          opacity: pressed ? 0.8 : 1,
        })}
        hitSlop={6}
      >
        <View
          style={{
            width: 30,
            minHeight: 28,
            marginRight: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Animated.View
            style={{
              width: 28,
              height: 28,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: iconScale }],
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                width: 30,
                height: 30,
                borderRadius: 15,
                borderWidth: 2,
                borderColor: '#86efac',
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              }}
            />
            {pieces.map((piece) => {
              const translateX = burstProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.cos(piece.angle) * piece.distance],
              });
              const translateY = burstProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.sin(piece.angle) * piece.distance],
              });

              return (
                <Animated.View
                  key={piece.key}
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: piece.size,
                    height: Math.max(4, Math.round(piece.size * 0.6)),
                    borderRadius: 999,
                    backgroundColor: piece.color,
                    opacity: particleOpacity,
                    transform: [
                      { translateX },
                      { translateY },
                      { rotate: piece.rotation },
                      { scale: particleScale },
                    ],
                  }}
                />
              );
            })}
            <Text style={{ fontSize: 18 }}>{requirement.met ? '✅' : '⬜'}</Text>
          </Animated.View>
        </View>
        <View style={{ flex: 1, paddingTop: 2 }}>
          <Text
            style={{
              fontWeight: requirement.met ? '600' : '500',
              color: requirement.met ? '#15803d' : '#1f2937',
            }}
          >
            {requirement.text}
          </Text>
          {requirement.feedback ? (
            <Text style={{ marginTop: 4, fontSize: 12, color: '#475569' }}>{requirement.feedback}</Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function cloneStoryAnalysis(analysis: StoryAnalysis | null): StoryAnalysis | null {
  if (!analysis) {
    return null;
  }
  return {
    correctness: analysis.correctness,
    result: analysis.result,
    errors: [...analysis.errors],
    reformulations: [...analysis.reformulations],
  };
}

function cloneConversationFeedback(
  feedback: StoryConversationFeedback | null
): StoryConversationFeedback | null {
  if (!feedback) {
    return null;
  }
  return {
    summary: feedback.summary,
    improvements: [...feedback.improvements],
  };
}

function cloneAttemptSnapshot(
  snapshot: StoryAttemptSnapshot | null
): StoryAttemptSnapshot | null {
  if (!snapshot) {
    return null;
  }
  return {
    messages: snapshot.messages.map((message) => ({ ...message })),
    requirements: snapshot.requirements.map((requirement) => ({ ...requirement })),
    analysis: cloneStoryAnalysis(snapshot.analysis),
    missionCompleted: snapshot.missionCompleted,
    storyCompleted: snapshot.storyCompleted,
    pendingNext: snapshot.pendingNext,
    conversationFeedback: cloneConversationFeedback(snapshot.conversationFeedback),
  };
}

function toProgressRequirement(
  requirement: StoryRequirementState | StoryRequirementProgress
): StoryRequirementProgress {
  return {
    requirementId: requirement.requirementId,
    text: requirement.text,
    met: !!requirement.met,
    ...(requirement.feedback ? { feedback: requirement.feedback } : {}),
  };
}

// Reemplaza estos IDs por tus ad units reales de rewarded en producción.
const PROD_REWARDED_AD_UNIT_ID =
  Platform.select({
    ios: 'ca-app-pub-3572102651268229/8175446712',
    android: 'ca-app-pub-3572102651268229/4835017171',
  }) ?? 'ca-app-pub-3572102651268229/4835017171';

type MobileAdsRewardedModule = {
  AdEventType: {
    CLOSED: string;
    ERROR: string;
  };
  RewardedAdEventType: {
    LOADED: string;
    EARNED_REWARD: string;
  };
  RewardedAd: {
    createForAdRequest: (
      adUnitId: string,
      options?: { requestNonPersonalizedAdsOnly?: boolean },
    ) => {
      addAdEventListener: (eventType: string, listener: () => void) => () => void;
      load: () => void;
      show: () => Promise<void>;
    };
  };
  TestIds: {
    REWARDED: string;
  };
};

const getMobileAdsRewardedModule = (): MobileAdsRewardedModule | null => {
  const nativeAdsModule =
    (NativeModules as any)?.RNGoogleMobileAdsModule ||
    (NativeModules as any)?.RNGoogleMobileAdsNativeModule;
  if (!nativeAdsModule) {
    return null;
  }

  try {
    // Lazy require: prevents crash when native module is missing in current binary.
    const ads = require('react-native-google-mobile-ads') as MobileAdsRewardedModule;
    if (!ads?.RewardedAd || !ads?.RewardedAdEventType || !ads?.AdEventType || !ads?.TestIds) {
      return null;
    }
    return ads;
  } catch {
    return null;
  }
};

const showRewardedAssistanceAd = () =>
  new Promise<boolean>((resolve) => {
    const ads = getMobileAdsRewardedModule();
    if (!ads) {
      resolve(true);
      return;
    }

    const REWARDED_AD_UNIT_ID = __DEV__
      ? ads.TestIds.REWARDED
      : PROD_REWARDED_AD_UNIT_ID;

    const { AdEventType, RewardedAdEventType, RewardedAd } = ads;
    const rewarded = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    let done = false;
    let earnedReward = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeLoaded: (() => void) | null = null;
    let unsubscribeClosed: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;
    let unsubscribeReward: (() => void) | null = null;

    const finish = (granted: boolean) => {
      if (done) return;
      done = true;
      unsubscribeLoaded?.();
      unsubscribeClosed?.();
      unsubscribeError?.();
      unsubscribeReward?.();
      if (timeoutId) clearTimeout(timeoutId);
      resolve(granted);
    };

    unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewarded.show().catch(() => finish(true));
    });

    unsubscribeReward = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earnedReward = true;
      },
    );

    unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      finish(earnedReward);
    });

    unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      finish(true);
    });

    timeoutId = setTimeout(() => finish(true), 7000);
    rewarded.load();
  });

export default function StorySceneScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const storyId: string | undefined = route.params?.storyId;
  const initialSceneIndex: number = route.params?.sceneIndex ?? 0;
  const { story, loading, error } = useStoryDetail(storyId);
  const {
    activeMission,
    clearActiveMission,
    markMissionCompleted,
    isMissionCompleted,
    saveActiveMission,
    storyCompleted: isStoryCompleted,
  } = useStoryProgress();
  const { spendCoins, canSpend, loading: coinsLoading, isUnlimited, balance } = useCoins();
  const [sceneIndex, setSceneIndex] = useState<number>(initialSceneIndex);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showIntroVideoModal, setShowIntroVideoModal] = useState(false);
  const [introVideoLoading, setIntroVideoLoading] = useState(false);
  const [introVideoError, setIntroVideoError] = useState<string | null>(null);
  const [isStorySceneTourPending, setIsStorySceneTourPending] = useState(false);
  const [showStorySceneTour, setShowStorySceneTour] = useState(false);
  const [storySceneTourHighlight, setStorySceneTourHighlight] = useState<TourHighlight | null>(null);
  const [storySceneTourStepIndex, setStorySceneTourStepIndex] = useState(0);
  const chargedMissions = useRef<Set<string>>(new Set());
  const chargingMissionId = useRef<string | null>(null);
  const [missionUnlocked, setMissionUnlocked] = useState<boolean>(false);

  useEffect(() => {
    setSceneIndex(initialSceneIndex);
  }, [initialSceneIndex, storyId]);

  const mission = story?.missions?.[sceneIndex];
  const avatarImageUrl = mission?.avatarImageUrl?.trim();
  const introVideoUri = mission?.videoIntro?.trim();

  const missionAvatar = useMemo(() => {
    if (!mission) return undefined;
    return avatarImageUrl ? { uri: avatarImageUrl } : getChatAvatar(mission.missionId);
  }, [avatarImageUrl, mission?.missionId]);

  useEffect(() => {
    const nextMission = story?.missions?.[sceneIndex + 1];
    prefetchImageUrls(
      [mission, nextMission].map((item) => item?.avatarImageUrl),
      4
    );
  }, [mission, sceneIndex, story?.missions]);

  const characterDisplayName = mission?.caracterName || mission?.title || 'Personaje';
  const avatarInitial = useMemo(
    () => (characterDisplayName?.trim()?.charAt(0) || '?').toUpperCase(),
    [characterDisplayName]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    chargedMissions.current = new Set();
    setMissionUnlocked(false);
  }, [storyId]);

  useEffect(() => {
    if (!mission?.missionId) {
      setMissionUnlocked(false);
      return;
    }
    setMissionUnlocked(isUnlimited || chargedMissions.current.has(mission.missionId));
  }, [isUnlimited, mission?.missionId, sceneIndex, storyId]);

  const storyDefinitionPayload = useMemo(() => {
    if (!story) return undefined;
    return {
      storyId: story.storyId,
      title: story.title,
      summary: story.summary,
      level: story.level,
      missions: story.missions.map((missionDef) => ({
        missionId: missionDef.missionId,
        title: missionDef.title,
        sceneSummary: missionDef.sceneSummary,
        aiRole: missionDef.aiRole,
        avatarImageUrl: missionDef.avatarImageUrl,
        videoIntro: missionDef.videoIntro,
        requirements: missionDef.requirements.map((req) => ({
          requirementId: req.requirementId,
          text: req.text,
        })),
      })),
    };
  }, [story]);

  const missionDefinitionPayload = useMemo(() => {
    if (!mission) return undefined;
    return {
      missionId: mission.missionId,
      title: mission.title,
      sceneSummary: mission.sceneSummary,
      aiRole: mission.aiRole,
      avatarImageUrl: mission.avatarImageUrl,
      videoIntro: mission.videoIntro,
      requirements: mission.requirements.map((req) => ({
        requirementId: req.requirementId,
        text: req.text,
      })),
    };
  }, [mission]);

  const [requirements, setRequirements] = useState<StoryRequirementState[]>([]);
  const [messages, setMessages] = useState<StoryMessage[]>([]);
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null);
  const [missionCompleted, setMissionCompleted] = useState<boolean>(false);
  const [storyCompleted, setStoryCompleted] = useState<boolean>(false);
  const [pendingNext, setPendingNext] = useState<number | null>(null);
  const [conversationFeedback, setConversationFeedback] = useState<StoryConversationFeedback | null>(null);
  const [flowState, setFlowState] = useState<'idle' | 'recording' | 'uploading' | 'transcribing' | 'evaluating'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryState, setRetryState] = useState<StoryRetryState>('none');
  const [lastAttemptSnapshot, setLastAttemptSnapshot] = useState<StoryAttemptSnapshot | null>(null);
  const [activeMissionStartedAt, setActiveMissionStartedAt] = useState<string | null>(null);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [assistanceQuestion, setAssistanceQuestion] = useState('');
  const [assistanceAnswer, setAssistanceAnswer] = useState('');
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [assistanceError, setAssistanceError] = useState<string | null>(null);
  const [requirementCelebrationTokens, setRequirementCelebrationTokens] = useState<Record<string, number>>({});
  const [activeRequirementConfetti, setActiveRequirementConfetti] = useState<RequirementConfettiBurst | null>(null);
  const hasShownCharacterModal = useRef(false);
  const hasShownIntroVideo = useRef(false);
  const hasDismissedIntroVideo = useRef(false);
  const introVideoRef = useRef<Video | null>(null);
  const introVideoLoadedRef = useRef(false);
  const introVideoStartedRef = useRef(false);
  // Force-remount the KeyboardAvoidingView when returning from background so it recalculates sizes.
  const [keyboardAvoiderKey, setKeyboardAvoiderKey] = useState(0);
  const exitWarningMessage = useMemo(
    () => 'No has terminado la misión. Si sales ahora, podrás retomarla después desde el feed.',
    []
  );

  const recorder = useAudioRecorder();
  const uploader = useUploadToS3();
  const scrollRef = useRef<ScrollView>(null);
  const requirementsCardRef = useRef<View>(null);
  const assistanceIconRef = useRef<View>(null);
  const trackedMissionStartRef = useRef<string | null>(null);
  const trackedMixpanelMissionStartedRef = useRef<Set<string>>(new Set());
  const missionMessageAttemptsRef = useRef<Map<string, number>>(new Map());
  const trackedMissionCompletionRef = useRef<Set<string>>(new Set());
  const requirementsCardFlash = useRef(new Animated.Value(0)).current;
  const requirementConfettiKeyRef = useRef(0);
  const requirementSuccessSoundRef = useRef<Audio.Sound | null>(null);
  // Permite saber si todavía estamos en el flujo de `start()` (permiso + prepare).
  const isStartingRecording = useRef(false);
  // Si el usuario suelta el botón mientras seguimos pidiendo permiso, guardamos la intención de parar.
  const stopRequestedWhileStarting = useRef(false);
  const restoredMissionRef = useRef<string | null>(null);

  const matchingActiveMission = useMemo(() => {
    if (!activeMission || !storyId || !mission?.missionId) {
      return null;
    }
    if (
      activeMission.storyId !== storyId ||
      activeMission.missionId !== mission.missionId ||
      activeMission.sceneIndex !== sceneIndex
    ) {
      return null;
    }
    return activeMission;
  }, [activeMission, mission?.missionId, sceneIndex, storyId]);

  const unloadRequirementSuccessSound = useCallback(async () => {
    const sound = requirementSuccessSoundRef.current;
    if (!sound) {
      return;
    }

    requirementSuccessSoundRef.current = null;

    try {
      sound.setOnPlaybackStatusUpdate(null);
      await sound.unloadAsync();
    } catch (soundUnloadErr) {
      console.warn('Requirement success sound cleanup failed', soundUnloadErr);
    }
  }, []);

  const playRequirementSuccessSound = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (audioModeErr) {
      console.warn('Requirement success audio mode failed', audioModeErr);
    }

    await unloadRequirementSuccessSound();

    try {
      const { sound } = await Audio.Sound.createAsync(successRequirementSoundAsset, {
        shouldPlay: true,
        volume: 1,
      });

      requirementSuccessSoundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || !status.didJustFinish) {
          return;
        }

        sound.setOnPlaybackStatusUpdate(null);
        if (requirementSuccessSoundRef.current === sound) {
          requirementSuccessSoundRef.current = null;
        }
        void sound.unloadAsync().catch((soundUnloadErr) => {
          console.warn('Requirement success sound unload failed', soundUnloadErr);
        });
      });
    } catch (playSoundErr) {
      console.warn('Requirement success sound playback failed', playSoundErr);
    }
  }, [unloadRequirementSuccessSound]);

  const triggerRequirementCelebration = useCallback(
    (requirementIds: string[]) => {
      if (!requirementIds.length) {
        return;
      }

      setRequirementCelebrationTokens((current) => {
        const next = { ...current };
        requirementIds.forEach((requirementId) => {
          next[requirementId] = (next[requirementId] || 0) + 1;
        });
        return next;
      });

      requirementConfettiKeyRef.current += 1;
      setActiveRequirementConfetti({
        key: requirementConfettiKeyRef.current,
        count: Math.min(220, 120 + Math.max(0, requirementIds.length - 1) * 50),
      });
      void playRequirementSuccessSound();

      requirementsCardFlash.stopAnimation();
      requirementsCardFlash.setValue(0);
      Animated.sequence([
        Animated.timing(requirementsCardFlash, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(requirementsCardFlash, {
          toValue: 0,
          duration: 650,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [playRequirementSuccessSound, requirementsCardFlash]
  );

  useEffect(() => {
    return () => {
      void unloadRequirementSuccessSound();
    };
  }, [unloadRequirementSuccessSound]);

  useEffect(() => {
    if (!mission) return;
    const restoreKey = `${storyId || 'none'}:${mission.missionId}:${sceneIndex}:${matchingActiveMission?.startedAt || 'empty'}`;
    if (restoredMissionRef.current === restoreKey) {
      return;
    }
    restoredMissionRef.current = restoreKey;
    if (matchingActiveMission?.missionUnlocked && mission.missionId) {
      chargedMissions.current.add(mission.missionId);
    }
    requirementsCardFlash.stopAnimation();
    requirementsCardFlash.setValue(0);
    setRequirementCelebrationTokens({});
    setActiveRequirementConfetti(null);
    setRequirements(
      matchingActiveMission
        ? matchingActiveMission.requirements.map((req) => ({ ...req }))
        : mission.requirements.map((req) => ({ ...req, met: req.met ?? false }))
    );
    setMessages(
      matchingActiveMission
        ? matchingActiveMission.messages.map((message, index) => ({
            id: `restored-${index}-${message.role}`,
            role: message.role,
            text: message.text,
          }))
        : []
    );
    setAnalysis(cloneStoryAnalysis(matchingActiveMission?.analysis ?? null));
    setMissionCompleted(matchingActiveMission?.missionCompleted ?? false);
    setStoryCompleted(matchingActiveMission?.storyCompleted ?? false);
    setPendingNext(matchingActiveMission?.pendingNext ?? null);
    setConversationFeedback(cloneConversationFeedback(matchingActiveMission?.conversationFeedback ?? null));
    setErrorMessage(null);
    setRetryState(matchingActiveMission?.retryState ?? 'none');
    setLastAttemptSnapshot(cloneAttemptSnapshot(matchingActiveMission?.lastAttemptSnapshot ?? null));
    setActiveMissionStartedAt(matchingActiveMission?.startedAt ?? null);
    setFlowState('idle');
    setAssistanceQuestion('');
    setAssistanceAnswer('');
    setAssistanceError(null);
    setAssistanceLoading(false);
    setShowAssistanceModal(false);
    setShowIntroVideoModal(false);
    setIntroVideoLoading(false);
    setIntroVideoError(null);
    setShowStorySceneTour(false);
    setStorySceneTourHighlight(null);
    setStorySceneTourStepIndex(0);
    hasShownCharacterModal.current = false;
    hasShownIntroVideo.current = false;
    hasDismissedIntroVideo.current = false;
    introVideoLoadedRef.current = false;
    introVideoStartedRef.current = false;
  }, [matchingActiveMission, mission, sceneIndex, storyId]);

  useEffect(() => {
    if (!mission || !storyId) return;
    const missionDone = isMissionCompleted(storyId, mission.missionId);
    const storyDone = isStoryCompleted(storyId);
    setMissionCompleted(missionDone);
    setStoryCompleted(storyDone);
  }, [isMissionCompleted, isStoryCompleted, mission?.missionId, storyId]);

  useEffect(() => {
    if (!storyId || !story || !mission?.missionId) {
      return;
    }

    if (missionCompleted || isMissionCompleted(storyId, mission.missionId)) {
      if (activeMissionStartedAt) {
        setActiveMissionStartedAt(null);
      }
      void clearActiveMission(storyId, mission.missionId);
      return;
    }

    if (!messages.length) {
      return;
    }

    const startedAt = activeMissionStartedAt || new Date().toISOString();
    if (!activeMissionStartedAt) {
      setActiveMissionStartedAt(startedAt);
    }

    void saveActiveMission({
      storyId,
      missionId: mission.missionId,
      sceneIndex,
      updatedAt: new Date().toISOString(),
      startedAt,
      storyTitle: story.title,
      missionTitle: mission.title,
      sceneSummary: mission.sceneSummary,
      caracterName: mission.caracterName,
      avatarImageUrl: mission.avatarImageUrl,
      messages: messages.map(({ role, text }) => ({ role, text })),
      requirements: requirements.map((requirement) => toProgressRequirement(requirement)),
      analysis: cloneStoryAnalysis(analysis),
      missionCompleted,
      storyCompleted,
      pendingNext,
      conversationFeedback: cloneConversationFeedback(conversationFeedback),
      retryState,
      lastAttemptSnapshot: cloneAttemptSnapshot(lastAttemptSnapshot),
      missionUnlocked,
    });
  }, [
    activeMissionStartedAt,
    analysis,
    clearActiveMission,
    conversationFeedback,
    isMissionCompleted,
    lastAttemptSnapshot,
    messages,
    mission?.avatarImageUrl,
    mission?.caracterName,
    mission?.missionId,
    mission?.sceneSummary,
    mission?.title,
    missionCompleted,
    missionUnlocked,
    pendingNext,
    requirements,
    retryState,
    saveActiveMission,
    sceneIndex,
    story,
    storyCompleted,
    storyId,
  ]);

  useEffect(() => {
    if (!storyId || !story || !mission?.missionId) {
      return;
    }
    const trackingKey = `${storyId}:${mission.missionId}:${sceneIndex}`;
    if (trackedMissionStartRef.current === trackingKey) {
      return;
    }
    trackedMissionStartRef.current = trackingKey;
    void trackMixpanelMissionVisited({
      storyId,
      storyTitle: story.title,
      missionId: mission.missionId,
      missionTitle: mission.title,
      sceneIndex,
      alreadyCompleted: isMissionCompleted(storyId, mission.missionId),
    });
    void trackMissionStarted({
      storyId,
      storyTitle: story.title,
      missionId: mission.missionId,
      missionTitle: mission.title,
      sceneIndex,
      alreadyCompleted: isMissionCompleted(storyId, mission.missionId),
    });
  }, [
    isMissionCompleted,
    mission?.missionId,
    mission?.title,
    sceneIndex,
    story,
    storyId,
  ]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const missionChargePending = !isUnlimited && !missionUnlocked;
  const recordingCoinLocked = !isUnlimited && balance < RECORDING_COST;
  const retryBlocked = retryState === 'required';
  const recordBlocked = retryBlocked || recordingCoinLocked;

  const statusLabel = useMemo(() => {
    switch (flowState) {
      case 'recording':
        return 'Grabando...';
      case 'uploading':
        return 'Subiendo audio...';
      case 'transcribing':
        return 'Transcribiendo...';
      case 'evaluating':
        return 'Analizando tu respuesta...';
      default:
        if (missionChargePending) {
          return coinsLoading ? 'Cargando tus monedas...' : `Costo de misión: ${CHAT_MISSION_COST} monedas`;
        }
        if (recordingCoinLocked) {
          return coinsLoading ? 'Cargando tus monedas...' : 'Necesitas 1 moneda para grabar.';
        }
        return '';
    }
  }, [coinsLoading, flowState, missionChargePending, recordingCoinLocked]);

  const appendMessage = useCallback((msg: StoryMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const ensureMissionCharge = useCallback(async () => {
    const missionId = mission?.missionId;
    if (!missionId) return false;
    if (isUnlimited || chargedMissions.current.has(missionId)) {
      setMissionUnlocked(true);
      return true;
    }
    if (coinsLoading) {
      setErrorMessage('Cargando tus monedas...');
      return false;
    }
    if (chargingMissionId.current === missionId) {
      return false;
    }
    chargingMissionId.current = missionId;
    try {
      const ok = await spendCoins(CHAT_MISSION_COST, `mission:${missionId}`);
      if (!ok) {
        setMissionUnlocked(false);
        setErrorMessage(`Costo de misión: ${CHAT_MISSION_COST} monedas`);
        navigation.navigate('Paywall', { source: 'story_scene_mission_unlock' });
        return false;
      }
      chargedMissions.current.add(missionId);
      setMissionUnlocked(true);
      return true;
    } catch (err: any) {
      console.error('Mission charge error', err);
      setMissionUnlocked(false);
      setErrorMessage(err?.message || 'No pudimos cobrar la misión.');
      return false;
    } finally {
      if (chargingMissionId.current === missionId) {
        chargingMissionId.current = null;
      }
    }
  }, [coinsLoading, isUnlimited, mission?.missionId, navigation, spendCoins]);

  const handleAdvance = useCallback(
    async (transcript: string, sessionId: string, inputMethod: 'text' | 'audio') => {
      const trimmed = transcript.trim();
      setErrorMessage(null);
      if (!trimmed) {
        setErrorMessage('La transcripción llegó vacía. Intenta de nuevo.');
        setFlowState('idle');
        return;
      }
      if (retryState === 'required') {
        setErrorMessage('Debes volver a intentar antes de continuar.');
        setFlowState('idle');
        return;
      }
      const chargeOk = await ensureMissionCharge();
      if (!chargeOk) {
        setFlowState('idle');
        return;
      }
      const snapshot: StoryAttemptSnapshot = {
        messages: messages.map(({ role, text }) => ({ role, text })),
        requirements: requirements.map((req) => toProgressRequirement(req)),
        analysis: cloneStoryAnalysis(analysis),
        missionCompleted,
        storyCompleted,
        pendingNext,
        conversationFeedback: cloneConversationFeedback(conversationFeedback),
      };
      setRetryState('none');
      setFlowState('evaluating');
      const wasPreviouslyCompleted = missionCompleted || storyCompleted || conversationFeedback || pendingNext !== null;
      if (wasPreviouslyCompleted) {
        setMissionCompleted(false);
        setStoryCompleted(false);
        setConversationFeedback(null);
        setPendingNext(null);
      }
      const historyPayload = [...messages, { id: `pending-${Date.now()}`, role: 'user', text: trimmed }].map(
        ({ role, text }) => ({ role, content: text })
      );
      const missionTrackingKey =
        storyId && mission?.missionId
          ? `${storyId}:${mission.missionId}:${sceneIndex}`
          : undefined;
      const messageIndex =
        messages.filter((msg) => msg.role === 'user').length + 1;
      const messageAttemptIndex = missionTrackingKey
        ? (missionMessageAttemptsRef.current.get(missionTrackingKey) || 0) + 1
        : messageIndex;

      if (missionTrackingKey) {
        missionMessageAttemptsRef.current.set(
          missionTrackingKey,
          messageAttemptIndex
        );
      }

      if (storyId && story && mission?.missionId) {
        const missionEvent = {
          storyId,
          storyTitle: story.title,
          missionId: mission.missionId,
          missionTitle: mission.title,
          sceneIndex,
          messageIndex,
          messageAttemptIndex,
          inputMethod,
        };

        if (
          missionTrackingKey &&
          !trackedMixpanelMissionStartedRef.current.has(missionTrackingKey)
        ) {
          trackedMixpanelMissionStartedRef.current.add(missionTrackingKey);
          void trackMixpanelMissionStarted(missionEvent);
        }

        void trackMixpanelMissionMessageSent(missionEvent);
      }
      appendMessage({ id: `user-${Date.now()}`, role: 'user', text: trimmed });
      try {
        const persistedRequirementPayload = requirements.map((req) => ({
          requirementId: req.requirementId,
          met: !!req.met,
          feedback: req.feedback,
        }));
        const payload = await api.post<StoryAdvancePayload>(`/stories/${storyId}/advance`, {
          sessionId,
          sceneIndex,
          transcript: trimmed,
          history: historyPayload,
          persistedRequirements: persistedRequirementPayload,
          persistedMissionCompleted: wasPreviouslyCompleted ? false : missionCompleted,
        });
        console.log('Advance payload', payload);
        const previousRequirementsById = new Map(
          requirements.map((item) => [item.requirementId, item])
        );
        const nextRequirements = payload.requirements.map((req) => {
          const previousRequirement = previousRequirementsById.get(req.requirementId);
          if (previousRequirement?.met) {
            return {
              ...req,
              met: true,
              feedback: req.feedback || previousRequirement.feedback,
            };
          }
          return { ...req };
        });
        const newlyMetRequirementIds = nextRequirements
          .filter((req) => req.met && !previousRequirementsById.get(req.requirementId)?.met)
          .map((req) => req.requirementId);
        setRequirements(nextRequirements);
        triggerRequirementCelebration(newlyMetRequirementIds);
        appendMessage({ id: `ai-${Date.now()}`, role: 'assistant', text: payload.aiReply });
        setAnalysis({
          correctness: payload.correctness,
          result: payload.result,
          errors: payload.errors || [],
          reformulations: payload.reformulations || [],
        });
        setMissionCompleted((prev) => prev || payload.missionCompleted);
        setStoryCompleted((prev) => prev || payload.storyCompleted);
        setConversationFeedback(payload.conversationFeedback ?? null);
        if (payload.missionCompleted && storyId && mission?.missionId) {
          setActiveMissionStartedAt(null);
          void clearActiveMission(storyId, mission.missionId);
          if (!trackedMissionCompletionRef.current.has(mission.missionId)) {
            trackedMissionCompletionRef.current.add(mission.missionId);
            void trackMissionCompleted({
              storyId,
              storyTitle: story?.title,
              missionId: mission.missionId,
              missionTitle: mission.title,
              sceneIndex,
              storyCompleted: payload.storyCompleted,
            });
            void trackMixpanelMissionCompleted({
              storyId,
              storyTitle: story?.title,
              missionId: mission.missionId,
              missionTitle: mission.title,
              sceneIndex,
              storyCompleted: payload.storyCompleted,
              messageIndex,
              messageAttemptIndex,
              inputMethod,
              result: payload.result,
              correctness: payload.correctness,
            });
          }
          await markMissionCompleted(storyId, mission.missionId, payload.storyCompleted);
        }
        if (payload.missionCompleted && payload.sceneIndex !== sceneIndex) {
          setPendingNext(payload.sceneIndex);
        } else {
          setPendingNext(null);
        }
        if (payload.result === 'incorrect') {
          setRetryState('required');
          setLastAttemptSnapshot(snapshot);
        } else if (payload.result === 'partial') {
          setRetryState('optional');
          setLastAttemptSnapshot(snapshot);
        } else {
          setRetryState('none');
          setLastAttemptSnapshot(null);
        }
      } catch (err: any) {
        console.error('Story advance error', err);
        setErrorMessage(err?.message || 'No pudimos analizar tu respuesta.');
      } finally {
        setFlowState('idle');
      }
    },
    [
      analysis,
      appendMessage,
      markMissionCompleted,
      messages,
      mission,
      missionCompleted,
      missionDefinitionPayload,
      conversationFeedback,
      pendingNext,
      requirements,
      retryState,
      sceneIndex,
      story,
      storyCompleted,
      storyDefinitionPayload,
      storyId,
      ensureMissionCharge,
      clearActiveMission,
      triggerRequirementCelebration,
    ]
  );

  const handleRetry = useCallback(() => {
    if (!lastAttemptSnapshot) {
      return;
    }
    setMessages(
      lastAttemptSnapshot.messages.map((msg, index) => ({
        id: `retry-${index}-${msg.role}`,
        role: msg.role,
        text: msg.text,
      }))
    );
    setRequirements(lastAttemptSnapshot.requirements.map((req) => ({ ...req })));
    setAnalysis(cloneStoryAnalysis(lastAttemptSnapshot.analysis));
    setMissionCompleted(lastAttemptSnapshot.missionCompleted);
    setStoryCompleted(lastAttemptSnapshot.storyCompleted);
    setPendingNext(lastAttemptSnapshot.pendingNext);
    setConversationFeedback(cloneConversationFeedback(lastAttemptSnapshot.conversationFeedback));
    setLastAttemptSnapshot(null);
    setRetryState('none');
    setErrorMessage(null);
    setFlowState('idle');
  }, [lastAttemptSnapshot]);

  const handleRecordPressIn = useCallback(async () => {
    try {
      if (retryState === 'required') {
        setErrorMessage('Debes volver a intentar antes de continuar.');
        return;
      }
      const hasMicPermission = await recorder.ensurePermission();
      if (!hasMicPermission) {
        setErrorMessage('Activa el permiso de microfono para grabar.');
        return;
      }
      if (!isUnlimited && !missionUnlocked) {
        if (coinsLoading) {
          setErrorMessage('Cargando tus monedas...');
          return;
        }
        const missionAffordable = await canSpend(CHAT_MISSION_COST);
        if (!missionAffordable) {
          setErrorMessage(`Costo de misión: ${CHAT_MISSION_COST} monedas`);
          navigation.navigate('Paywall', { source: 'story_scene_mission_unlock' });
          return;
        }
      }
      if (!isUnlimited) {
        const chargeReason = mission?.missionId
          ? `story-recording:${storyId}:${mission.missionId}`
          : `story-recording:${storyId}:${sceneIndex}`;
        const ok = await spendCoins(RECORDING_COST, chargeReason);
        if (!ok) {
          setErrorMessage('Necesitas 1 moneda para grabar.');
          navigation.navigate('Paywall', { source: 'story_scene_recording' });
          return;
        }
      }
      setErrorMessage(null);
      setFlowState('recording');
      stopRequestedWhileStarting.current = false;
      isStartingRecording.current = true;
      await recorder.start();
      // El start terminó, marcamos que ya no estamos en fase de inicio.
      isStartingRecording.current = false;
      // Si el usuario soltó el botón mientras se pedía el permiso, ejecutamos el release ahora.
      if (stopRequestedWhileStarting.current) {
        stopRequestedWhileStarting.current = false;
        await handleRecordRelease(true);
      }
    } catch (err: any) {
      console.error('Record start error', err);
      const startErrorMessage = err?.message || 'No pudimos iniciar la grabación.';
      if (startErrorMessage === 'La grabacion se cancelo al salir de la app.') {
        setErrorMessage(null);
      } else {
        setErrorMessage(startErrorMessage);
      }
      setFlowState('idle');
      stopRequestedWhileStarting.current = false;
      isStartingRecording.current = false;
    }
  }, [canSpend, coinsLoading, isUnlimited, mission?.missionId, missionUnlocked, navigation, recorder, retryState, sceneIndex, spendCoins, storyId]);

  const handleRecordRelease = useCallback(async (skipStartGuard = false) => {
    try {
      if (isStartingRecording.current && !skipStartGuard) {
        // El usuario soltó mientras el permiso estaba en curso; paramos al terminar el start.
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
      const session = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, {
        storyId,
        sceneIndex,
      });
      await uploader.put(session.uploadUrl, { uri: recording.uri }, 'audio/mp4');
      setFlowState('transcribing');
      const transcription = await api.post<{ transcript: string }>(
        `/sessions/${session.sessionId}/transcribe`
      );
      await handleAdvance(transcription.transcript || '', session.sessionId, 'audio');
    } catch (err: any) {
      console.error('Story recording error', err);
      setErrorMessage(err?.message || 'No pudimos procesar tu audio.');
      setFlowState('idle');
    }
  }, [handleAdvance, recorder, sceneIndex, storyId, uploader]);

  const handleSendText = useCallback(
    async (textToSend: string) => {
      const trimmed = textToSend.trim();
      if (!trimmed) return false;
      try {
        if (retryState === 'required') {
          setErrorMessage('Debes volver a intentar antes de continuar.');
          return false;
        }
        setFlowState('evaluating');
        setErrorMessage(null);
        const session = await api.post<{ sessionId: string; uploadUrl: string }>(`/sessions/start`, {
          storyId,
          sceneIndex,
        });
        await handleAdvance(trimmed, session.sessionId, 'text');
        return true;
      } catch (err: any) {
        console.error('Story text send error', err);
        setErrorMessage(err?.message || 'No pudimos analizar tu texto.');
        setFlowState('idle');
        return false;
      }
    },
    [handleAdvance, retryState, sceneIndex, storyId]
  );

  const handleOpenAssistance = useCallback(() => {
    setAssistanceQuestion('');
    setAssistanceAnswer('');
    setAssistanceError(null);
    setShowAssistanceModal(true);
  }, []);

  const handleRequirementPress = useCallback((text: string) => {
    setAssistanceQuestion(`Puedes ayudarme a cumplir esta misión: "${text}"`);
    setAssistanceAnswer('');
    setAssistanceError(null);
    setShowAssistanceModal(true);
  }, []);

  const handleAssistantMessagePress = useCallback((text: string) => {
    setAssistanceQuestion(`Puedes explicarme esta frase: "${text}"`);
    setAssistanceAnswer('');
    setAssistanceError(null);
    setShowAssistanceModal(true);
  }, []);

  const handleRequestAssistance = useCallback(async () => {
    const trimmed = assistanceQuestion.trim();
    if (!trimmed) {
      setAssistanceError('Escribe tu pregunta.');
      return;
    }
    if (!storyId || !mission) {
      setAssistanceError('No encontramos la misión actual.');
      return;
    }
    setAssistanceLoading(true);
    setAssistanceError(null);
    setAssistanceAnswer('');
    try {
      const rewardedOk = isUnlimited ? true : await showRewardedAssistanceAd();
      if (!rewardedOk) {
        setAssistanceError('Debes completar el anuncio para pedir asistencia.');
        return;
      }
      const historyPayload = messages.map(({ role, text }) => ({ role, content: text }));
      const requirementPayload = requirements.map((req) => ({
        requirementId: req.requirementId,
        text: req.text,
        met: !!req.met,
        feedback: req.feedback,
      }));
      void trackMixpanelMissionHelpRequested({
        storyId,
        storyTitle: story?.title,
        missionId: mission.missionId,
        missionTitle: mission.title,
        sceneIndex,
        questionLength: trimmed.length,
        questionWordCount: trimmed.split(/\s+/).filter(Boolean).length,
        historyMessageCount: messages.length,
        requirementsMetCount: requirements.filter((req) => !!req.met).length,
      });
      const payload = await api.post<StoryAssistanceResponse>(`/stories/${storyId}/assist`, {
        sceneIndex,
        question: trimmed,
        history: historyPayload,
        requirements: requirementPayload,
        storyDefinition: storyDefinitionPayload,
        missionDefinition: missionDefinitionPayload,
        conversationFeedback,
      });
      setAssistanceAnswer(payload?.answer || '');
    } catch (err: any) {
      console.error('Story assistance error', err);
      setAssistanceError(err?.message || 'No pudimos obtener la asistencia.');
    } finally {
      setAssistanceLoading(false);
    }
  }, [
    assistanceQuestion,
    conversationFeedback,
    messages,
    mission,
    missionDefinitionPayload,
    requirements,
    sceneIndex,
    storyDefinitionPayload,
    storyId,
    isUnlimited,
  ]);

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
        console.warn('Story recorder cleanup on app state change failed', cancelErr);
      });
    });
    return () => sub.remove();
  }, [recorder]);

  const openIntroVideoModal = useCallback(() => {
    if (!introVideoUri) return;
    hasShownIntroVideo.current = true;
    hasDismissedIntroVideo.current = false;
    introVideoLoadedRef.current = false;
    introVideoStartedRef.current = false;
    setIntroVideoLoading(true);
    setIntroVideoError(null);
    setShowIntroVideoModal(true);
  }, [introVideoUri]);

  useEffect(() => {
    if (!mission) return;
    if (introVideoUri && !hasShownIntroVideo.current) {
      openIntroVideoModal();
      return;
    }
    if (introVideoUri || hasShownCharacterModal.current) return;
    hasShownCharacterModal.current = true;
    setShowCharacterModal(true);
  }, [introVideoUri, mission, openIntroVideoModal]);

  const storySceneTourSteps = useMemo(
    () => [
      {
        key: 'requirements',
        ref: requirementsCardRef,
        title: 'Requisitos',
        description: 'Estos son los requisitos que evaluara la IA para determinar si cumples la mision.',
      },
      {
        key: 'assistance',
        ref: assistanceIconRef,
        title: 'Ventana de ayuda',
        description: 'Desde este icono puedes abrir la ayuda cuando necesites una pista o aclaracion.',
      },
    ],
    []
  );
  const activeStorySceneTourStep = showStorySceneTour ? storySceneTourSteps[storySceneTourStepIndex] : null;
  const isLastStorySceneTourStep = storySceneTourStepIndex >= storySceneTourSteps.length - 1;

  useEffect(() => {
    let mounted = true;
    hasSeenTour('storyScene').then((seen) => {
      if (mounted && !seen) {
        setIsStorySceneTourPending(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const measureStorySceneTourTarget = useCallback(() => {
    if (!showStorySceneTour) return;
    const step = storySceneTourSteps[storySceneTourStepIndex];
    if (!step) return;
    const target = step.ref.current;
    if (!target || !target.measureInWindow) return;
    target.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) return;
      setStorySceneTourHighlight({ x, y, width, height });
    });
  }, [showStorySceneTour, storySceneTourStepIndex, storySceneTourSteps]);

  useEffect(() => {
    if (!showStorySceneTour) return;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      measureStorySceneTourTarget();
    }, 200);
    return () => clearTimeout(timer);
  }, [showStorySceneTour, storySceneTourStepIndex, measureStorySceneTourTarget]);

  const startPendingStorySceneTour = useCallback(() => {
    if (isStorySceneTourPending) {
      setShowStorySceneTour(true);
      setIsStorySceneTourPending(false);
    }
  }, [isStorySceneTourPending]);

  const closeIntroVideoModal = useCallback(() => {
    hasDismissedIntroVideo.current = true;
    void introVideoRef.current?.stopAsync().catch((pauseErr) => {
      console.warn('Mission intro video stop failed', pauseErr);
    });
    setShowIntroVideoModal(false);
    setIntroVideoLoading(false);
    setIntroVideoError(null);
    startPendingStorySceneTour();
  }, [startPendingStorySceneTour]);

  const closeCharacterModal = useCallback(() => {
    setShowCharacterModal(false);
    startPendingStorySceneTour();
  }, [startPendingStorySceneTour]);

  useEffect(() => {
    if (!showIntroVideoModal || !introVideoUri) return;
    introVideoLoadedRef.current = false;
    introVideoStartedRef.current = false;
    setIntroVideoLoading(true);
    setIntroVideoError(null);
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch((audioModeErr) => {
      console.warn('Mission intro video audio mode failed', audioModeErr);
    });

    const playFallback = setTimeout(() => {
      void introVideoRef.current?.playAsync().catch((playErr) => {
        console.warn('Mission intro video play failed', playErr);
      });
    }, 350);

    const loadingFallback = setTimeout(() => {
      setIntroVideoLoading(false);
    }, 2500);
    const errorFallback = setTimeout(() => {
      if (hasDismissedIntroVideo.current) return;
      if (introVideoLoadedRef.current || introVideoStartedRef.current) return;
      setIntroVideoLoading(false);
      setIntroVideoError('No pudimos cargar el video.');
    }, 12000);

    return () => {
      clearTimeout(playFallback);
      clearTimeout(loadingFallback);
      clearTimeout(errorFallback);
    };
  }, [introVideoUri, showIntroVideoModal]);

  const handleIntroVideoStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!showIntroVideoModal) return;
      if (!status.isLoaded) {
        if (status.error) {
          setIntroVideoLoading(false);
          setIntroVideoError(status.error);
        }
        return;
      }

      introVideoLoadedRef.current = true;
      if (status.isPlaying || status.positionMillis > 0) {
        introVideoStartedRef.current = true;
      }
      if (!status.isBuffering || status.isPlaying) {
        setIntroVideoLoading(false);
      }
      if (status.didJustFinish) {
        closeIntroVideoModal();
      }
    },
    [closeIntroVideoModal, showIntroVideoModal]
  );

  const handleIntroVideoLoad = useCallback(() => {
    introVideoLoadedRef.current = true;
    setIntroVideoLoading(false);
    setIntroVideoError(null);
    void introVideoRef.current?.playAsync().catch((playErr) => {
      console.warn('Mission intro video play failed', playErr);
    });
  }, []);

  useEffect(() => {
    if (!isStorySceneTourPending || showCharacterModal || showIntroVideoModal) return;
    startPendingStorySceneTour();
  }, [
    isStorySceneTourPending,
    showCharacterModal,
    showIntroVideoModal,
    startPendingStorySceneTour,
  ]);

  const finishStorySceneTour = useCallback(async () => {
    setShowStorySceneTour(false);
    setStorySceneTourHighlight(null);
    setStorySceneTourStepIndex(0);
    await markTourAsSeen('storyScene');
  }, []);

  const handleAdvanceStorySceneTour = useCallback(async () => {
    if (!showStorySceneTour) return;
    if (isLastStorySceneTourStep) {
      await finishStorySceneTour();
      return;
    }
    setStorySceneTourStepIndex((prev) => Math.min(prev + 1, storySceneTourSteps.length - 1));
  }, [finishStorySceneTour, isLastStorySceneTourStep, showStorySceneTour, storySceneTourSteps.length]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (missionCompleted) return;
      event.preventDefault();
      Alert.alert('Salir de la misión', exitWarningMessage, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: () => navigation.dispatch(event.data.action),
        },
      ]);
    });
    return unsubscribe;
  }, [exitWarningMessage, missionCompleted, navigation]);

  if (!storyId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text>No se recibió un identificador de historia.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text style={{ textAlign: 'center', marginBottom: 12 }}>{error}</Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => ({
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: pressed ? '#dbeafe' : '#bfdbfe',
          })}
        >
          <Text style={{ color: '#1d4ed8', fontWeight: '600' }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (!mission) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text>No encontramos esta misión.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      key={keyboardAvoiderKey}
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      // keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <View style={{ flex: 1 }}>
        {activeRequirementConfetti ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
            <ConfettiCannon
              key={activeRequirementConfetti.key}
              count={activeRequirementConfetti.count}
              origin={{
                x: windowWidth / 2,
                y: insets.top + 72,
              }}
              fadeOut
              fallSpeed={2800}
              explosionSpeed={420}
              onAnimationEnd={() => {
                setActiveRequirementConfetti((current) =>
                  current?.key === activeRequirementConfetti.key ? null : current
                );
              }}
            />
          </View>
        ) : null}
        <View style={{ backgroundColor: '#0b1224', paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
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
              <Pressable
                onPress={() => setShowCharacterModal(true)}
                hitSlop={6}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 0,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: 999, overflow: 'hidden', backgroundColor: '#0b1224', borderWidth: 1, borderColor: '#0b1224', marginRight: 12 }}>
                  {missionAvatar ? (
                    <Image source={missionAvatar} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>{avatarInitial}</Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }} numberOfLines={1}>
                    {characterDisplayName}
                  </Text>
                <Text style={{ fontSize: 12, color: '#e2e8f0' }} numberOfLines={1}>
                  {mission?.title || story?.title || ''}
                </Text>
                </View>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CoinCountChip />
              <View ref={assistanceIconRef} collapsable={false} onLayout={measureStorySceneTourTarget}>
                <Pressable hitSlop={12} onPress={handleOpenAssistance} style={({ pressed }) => ({ paddingHorizontal: 8, paddingVertical: 6, opacity: pressed ? 0.5 : 1 })}>
                  <Text style={{ fontSize: 24, color: 'white', fontWeight: '700', lineHeight: 26 }}>?</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>{story?.title}</Text>
        <Text style={{ marginTop: 4, color: '#475569' }}>Misión {sceneIndex + 1} de {story?.missions.length}</Text>

        <View
          ref={requirementsCardRef}
          collapsable={false}
          onLayout={measureStorySceneTourTarget}
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            position: 'relative',
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: 12,
                backgroundColor: '#dcfce7',
                opacity: requirementsCardFlash,
              },
            ]}
          />
          <Text style={{ fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Requisitos</Text>
          {requirements.map((req) => (
            <RequirementRow
              key={req.requirementId}
              requirement={req}
              celebrationToken={requirementCelebrationTokens[req.requirementId] || 0}
              onPress={handleRequirementPress}
            />
          ))}
          {!requirements.length ? (
            <Text style={{ color: '#475569' }}>Esta misión no tiene requisitos explícitos.</Text>
          ) : null}
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '700', color: '#1e293b', marginBottom: 8 }}>Conversación</Text>
          {messages.length === 0 ? (
            <View style={{ padding: 16, borderRadius: 12, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ color: '#475569' }}>
                Empieza la conversación grabando tu pregunta o escribiendo un mensaje.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {messages.map((msg) => {
                const alignStyle = { alignSelf: msg.role === 'user' ? 'flex-end' as const : 'flex-start' as const };
                const bubble = (
                  <View
                    style={{
                      backgroundColor: msg.role === 'user' ? '#4f46e5' : 'white',
                      borderRadius: 16,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      maxWidth: '80%',
                      borderWidth: msg.role === 'user' ? 0 : 1,
                      borderColor: '#e2e8f0',
                    }}
                  >
                    <Text style={{ color: msg.role === 'user' ? 'white' : '#0f172a' }}>{msg.text}</Text>
                  </View>
                );
                if (msg.role === 'assistant') {
                  return (
                    <Pressable
                      key={msg.id}
                      onPress={() => handleAssistantMessagePress(msg.text)}
                      style={({ pressed }) => ({ ...alignStyle, opacity: pressed ? 0.85 : 1 })}
                      hitSlop={6}
                    >
                      {bubble}
                    </Pressable>
                  );
                }
                return (
                  <View key={msg.id} style={alignStyle}>
                    {bubble}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {analysis ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              backgroundColor: retryState === 'required' ? '#fef2f2' : 'white',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: retryState === 'required' ? '#fecdd3' : '#e2e8f0',
            }}
          >
            <Text style={{ fontWeight: '700', color: '#1e293b' }}>
              Correctness: {analysis.correctness}% ({analysis.result === 'correct' ? 'Correcto' : analysis.result === 'partial' ? 'Parcial' : 'Reintenta'})
            </Text>
            {retryState === 'optional' ? (
              <Text style={{ marginTop: 8, color: '#1e293b' }}>
                Resultado parcial. Puedes volver a intentar o seguir la conversación.
              </Text>
            ) : null}
            {retryState === 'required' ? (
              <Text style={{ marginTop: 8, color: '#dc2626' }}>
                Resultado incorrecto. Debes volver a intentar antes de continuar.
              </Text>
            ) : null}
            {analysis.errors.length ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: '600', color: '#dc2626', marginBottom: 4 }}>Errores detectados</Text>
                {analysis.errors.map((errText, idx) => (
                  <Text key={idx} style={{ color: '#dc2626', marginBottom: 2 }}>- {errText}</Text>
                ))}
              </View>
            ) : null}
            {analysis.reformulations.length ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: '600', color: '#2563eb', marginBottom: 4 }}>Reformulaciones sugeridas</Text>
                {analysis.reformulations.map((line, idx) => (
                  <Text key={idx} style={{ color: '#1f2937', marginBottom: 2 }}>- {line}</Text>
                ))}
              </View>
            ) : null}
            {retryState !== 'none' ? (
              <Pressable
                onPress={handleRetry}
                disabled={flowState !== 'idle'}
                style={({ pressed }) => ({
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor:
                    flowState !== 'idle'
                      ? '#cbd5f5'
                      : pressed
                      ? '#0b1224'
                      : '#2563eb',
                })}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Volver a intentar</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {missionCompleted ? (
          <View style={{ marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
            <Text style={{ fontWeight: '700', color: '#15803d' }}>¡Misión completada!</Text>
            {conversationFeedback ? (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: '600', color: '#14532d' }}>Feedback general</Text>
                {conversationFeedback.summary ? (
                  <Text style={{ marginTop: 6, color: '#166534' }}>{conversationFeedback.summary}</Text>
                ) : null}
                {conversationFeedback.improvements.length ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontWeight: '600', color: '#166534', marginBottom: 4 }}>Puntos a mejorar</Text>
                    {conversationFeedback.improvements.map((item, idx) => (
                      <Text key={idx} style={{ color: '#166534', marginBottom: 2 }}>- {item}</Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
            {storyCompleted ? (
              <Text style={{ marginTop: 6, color: '#166534' }}>
                Terminaste toda la historia. Puedes regresar al listado cuando quieras.
              </Text>
            ) : (
              <Text style={{ marginTop: 6, color: '#166534' }}>
                Avanza para seguir con la siguiente misión.
              </Text>
            )}
            {!storyCompleted && pendingNext !== null ? (
              <Pressable
                onPress={() => {
                  setSceneIndex(pendingNext);
                }}
                style={({ pressed }) => ({
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#22c55e' : '#16a34a',
                })}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Ir a la siguiente misión</Text>
              </Pressable>
            ) : null}
            {storyId ? (
              <Pressable
                onPress={() => navigation.navigate('StoryMissions', { storyId })}
                style={({ pressed }) => ({
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#e2e8f0' : '#f1f5f9',
                })}
              >
                <Text style={{ color: '#1e293b', fontWeight: '700' }}>Ver listado de misiones</Text>
              </Pressable>
            ) : null}
            {storyCompleted ? (
              <Pressable
                onPress={() => navigation.navigate('Stories')}
                style={({ pressed }) => ({
                  marginTop: 12,
                  paddingVertical: 10,
                  borderRadius: 999,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#cbd5f5' : '#e0e7ff',
                })}
              >
                <Text style={{ color: '#312e81', fontWeight: '700' }}>Volver a historias</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      {errorMessage ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ color: '#dc2626' }}>{errorMessage}</Text>
        </View>
      ) : null}

      <StoryMessageComposer
        flowState={flowState}
        retryBlocked={retryBlocked}
        recordBlocked={recordBlocked}
        statusLabel={statusLabel}
        onSendText={handleSendText}
        onRecordPressIn={handleRecordPressIn}
        onRecordRelease={handleRecordRelease}
      />
      </View>
      <TourOverlay
        visible={showStorySceneTour}
        highlight={storySceneTourHighlight}
        title={activeStorySceneTourStep?.title ?? ''}
        description={activeStorySceneTourStep?.description ?? ''}
        onNext={handleAdvanceStorySceneTour}
        isLast={isLastStorySceneTourStep}
      />
      <Modal
        animationType="fade"
        visible={showIntroVideoModal}
        presentationStyle="fullScreen"
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={closeIntroVideoModal}
      >
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          {showIntroVideoModal && introVideoUri ? (
            <Video
              ref={introVideoRef}
              source={{ uri: introVideoUri }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              useNativeControls={false}
              isLooping={false}
              progressUpdateIntervalMillis={250}
              onLoadStart={() => {
                setIntroVideoLoading(true);
                setIntroVideoError(null);
              }}
              onLoad={handleIntroVideoLoad}
              onReadyForDisplay={() => setIntroVideoLoading(false)}
              onError={(videoError) => {
                setIntroVideoLoading(false);
                setIntroVideoError(videoError || 'No pudimos cargar el video.');
              }}
              onPlaybackStatusUpdate={handleIntroVideoStatus}
            />
          ) : null}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: insets.top + 96,
              backgroundColor: 'rgba(0,0,0,0.28)',
            }}
          />
          <Pressable
            onPress={closeIntroVideoModal}
            hitSlop={12}
            style={({ pressed }) => ({
              position: 'absolute',
              top: insets.top + 12,
              right: 16,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 8,
              backgroundColor: 'rgba(0,0,0,0.58)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.22)',
              opacity: pressed ? 0.72 : 1,
            })}
          >
            <Text style={{ color: 'white', fontWeight: '800' }}>Saltar</Text>
          </Pressable>
          {introVideoLoading ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.16)',
              }}
            >
              <ActivityIndicator size="large" color="white" />
            </View>
          ) : null}
          {introVideoError ? (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.82)',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '800', textAlign: 'center' }}>
                No pudimos reproducir este intro.
              </Text>
              <Text style={{ color: '#cbd5e1', marginTop: 8, textAlign: 'center' }}>
                Puedes continuar con la misión.
              </Text>
              <Pressable
                onPress={closeIntroVideoModal}
                style={({ pressed }) => ({
                  marginTop: 18,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: pressed ? '#e2e8f0' : 'white',
                })}
              >
                <Text style={{ color: '#0f172a', fontWeight: '900' }}>Continuar</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={showAssistanceModal}
        onRequestClose={() => setShowAssistanceModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 12 : 0}
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
                    Luvi puede darte ideas rápidas usando la misión, objetivos y el chat actual.
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                    Misión: {mission.title}
                  </Text>
                </View>
                <TextInput
                  value={assistanceQuestion}
                  onChangeText={(text) => {
                    setAssistanceQuestion(text);
                    if (assistanceError) setAssistanceError(null);
                  }}
                  placeholder="Cuéntame qué necesitas desbloquear o cómo seguir la conversación..."
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
      <Modal
        animationType="fade"
        transparent
        visible={showCharacterModal}
        onRequestClose={closeCharacterModal}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', padding: 24, justifyContent: 'center' }}
          onPress={closeCharacterModal}
        >
          <Pressable
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              overflow: 'hidden',
            }}
            onPress={() => {}}
          >
            <View style={{ alignItems: 'flex-end' }}>
              <Pressable
                onPress={closeCharacterModal}
                hitSlop={12}
                style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.6 : 1 })}
              >
                <Text style={{ fontSize: 20, color: '#0f172a' }}>✕</Text>
              </Pressable>
            </View>
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <View style={{ width: 220, height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#cbd5e1' }}>
                {missionAvatar ? (
                  <Image source={missionAvatar} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 42, fontWeight: '700', color: '#334155' }}>{avatarInitial}</Text>
                  </View>
                )}
              </View>
              <Text style={{ marginTop: 16, fontSize: 20, fontWeight: '700', color: '#0f172a', textAlign: 'center' }}>
                {characterDisplayName}
              </Text>
              <Text style={{ marginTop: 6, fontSize: 14, color: '#475569', textAlign: 'center' }}>
                {mission.title}
              </Text>
              {mission.sceneSummary ? (
                <Text style={{ marginTop: 12, fontSize: 14, color: '#1f2937', textAlign: 'center' }}>
                  {mission.sceneSummary}
                </Text>
              ) : null}
              {introVideoUri ? (
                <Pressable
                  onPress={() => {
                    setShowCharacterModal(false);
                    openIntroVideoModal();
                  }}
                  style={({ pressed }) => ({
                    marginTop: 18,
                    minWidth: 160,
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 999,
                    alignItems: 'center',
                    backgroundColor: pressed ? '#1d4ed8' : '#2563eb',
                  })}
                >
                  <Text style={{ color: 'white', fontWeight: '700' }}>Ver video</Text>
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
