import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Audio, ResizeMode, Video } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { LearningItem, useLearningItems } from '../hooks/useLearningItems';
import { FeedPost, useFeedPosts } from '../hooks/useFeedPosts';
import { StoryMission, useStoryCatalog } from '../hooks/useStories';
import {
  CARD_STATUS_LABELS,
  CardProgressStatus,
  useCardProgress,
} from '../progress/CardProgressProvider';
import { useStoryProgress } from '../progress/StoryProgressProvider';
import type { StoryActiveMission } from '../progress/types';
import { CARD_OPEN_COST, CHAT_MISSION_COST, useCoins } from '../purchases/CoinBalanceProvider';
import CoinCountChip from '../components/CoinCountChip';
import AppTabBar from '../components/AppTabBar';
import { getChatAvatar } from '../chatimages/chatAvatarMap';
import { trackMixpanelFeedLoadMore } from '../marketing/mixpanelEvents';
import { prefetchImageUrls } from '../shared/imagePrefetch';
import {
  shouldShowMissionInterstitialForMission,
  showMissionInterstitialBeforeNavigation,
} from '../shared/missionInterstitial';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

type PendingMission = {
  kind: 'mission';
  id: string;
  storyId: string;
  storyTitle: string;
  sceneIndex: number;
  mission: StoryMission;
};

type ResumeMission = {
  kind: 'resumeMission';
  feedId: string;
  storyId: string;
  storyTitle: string;
  sceneIndex: number;
  mission: StoryMission;
  updatedAt: string;
};

type PendingVocab = LearningItem & {
  kind: 'vocab';
  feedId: string;
  status: CardProgressStatus;
};

type FeedPostItem = FeedPost & {
  kind: 'post';
  feedId: string;
  claimed?: boolean;
};

type FeedItem = ResumeMission | PendingMission | PendingVocab | FeedPostItem;

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  surfaceAlt: '#111827',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#22d3ee',
  accentStrong: '#2563eb',
  success: '#22c55e',
  warning: '#f59e0b',
};

const MISSION_BATCH_SIZE = 4;
const VOCABULARY_BATCH_SIZE = 8;
const CLAIMED_EXTRA_POSTS_STORAGE_KEY = '@luva/feed/claimed-extra-posts';

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickRandom<T>(list: T[], count: number, seed: string, keyFor: (item: T) => string) {
  return [...list]
    .sort((a, b) => hashString(`${seed}:${keyFor(a)}`) - hashString(`${seed}:${keyFor(b)}`))
    .slice(0, count);
}

function buildFeedItems(missions: PendingMission[], vocabulary: PendingVocab[], posts: FeedPostItem[]) {
  const baseFeed: Array<PendingMission | PendingVocab> = [];
  const blocks = Math.max(missions.length, Math.ceil(vocabulary.length / 2));

  for (let index = 0; index < blocks; index += 1) {
    const mission = missions[index];
    if (mission) {
      baseFeed.push(mission);
    }

    const firstVocab = vocabulary[index * 2];
    const secondVocab = vocabulary[index * 2 + 1];
    if (firstVocab) {
      baseFeed.push(firstVocab);
    }
    if (secondVocab) {
      baseFeed.push(secondVocab);
    }
  }

  const feed: FeedItem[] = [...baseFeed];
  const orderOffsets = new Map<number, number>();
  [...posts]
    .sort((left, right) => left.order - right.order || left.postId.localeCompare(right.postId))
    .forEach((post) => {
      const offset = orderOffsets.get(post.order) || 0;
      orderOffsets.set(post.order, offset + 1);
      const targetIndex = Math.max(0, Math.min(feed.length, post.order - 1 + offset));
      feed.splice(targetIndex, 0, post);
    });

  return feed;
}

function MissionCard({
  item,
  onStart,
  playbackEnabled,
}: {
  item: PendingMission;
  onStart: (item: PendingMission) => void;
  playbackEnabled: boolean;
}) {
  const avatarImageUrl = item.mission.avatarImageUrl?.trim();
  const introVideoUrl = item.mission.videoIntro?.trim();
  const introVideoRef = useRef<Video | null>(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasVideoEnded, setHasVideoEnded] = useState(false);

  useEffect(() => {
    setHasVideoError(false);
    setIsVideoPlaying(false);
    setHasVideoEnded(false);
  }, [introVideoUrl]);

  const missionAvatar = useMemo<ImageSourcePropType | undefined>(() => {
    return avatarImageUrl ? { uri: avatarImageUrl } : getChatAvatar(item.mission.missionId);
  }, [avatarImageUrl, item.mission.missionId]);

  const displayName = item.mission.caracterName || item.mission.title || 'Personaje';
  const avatarInitial = (displayName.trim().charAt(0) || '?').toUpperCase();
  const description = item.mission.sceneSummary || 'Habla con el personaje y completa los objetivos de la escena.';

  const handleIntroVideoStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsVideoPlaying(false);
      return;
    }

    setIsVideoPlaying(status.isPlaying);
    if (status.didJustFinish) {
      setHasVideoEnded(true);
      setIsVideoPlaying(false);
    }
  }, []);

  const handlePlayVideo = useCallback(async () => {
    setHasVideoEnded(false);
    try {
      if (hasVideoEnded) {
        await introVideoRef.current?.replayAsync();
      } else {
        await introVideoRef.current?.playAsync();
      }
    } catch (playErr) {
      console.warn('[Feed] No se pudo reproducir el intro de la mision', playErr);
    }
  }, [hasVideoEnded]);

  const handlePauseVideo = useCallback(async () => {
    try {
      await introVideoRef.current?.pauseAsync();
    } catch (pauseErr) {
      console.warn('[Feed] No se pudo pausar el intro de la mision', pauseErr);
    }
  }, []);

  useEffect(() => {
    if (playbackEnabled) {
      return;
    }

    setIsVideoPlaying(false);
    void introVideoRef.current?.pauseAsync().catch((pauseErr) => {
      console.warn('[Feed] No se pudo pausar el intro al salir de la pantalla', pauseErr);
    });
  }, [playbackEnabled]);

  useEffect(() => {
    return () => {
      void introVideoRef.current?.pauseAsync().catch(() => {
        // Best effort cleanup on unmount.
      });
    };
  }, []);

  const visualContent = (
    <View style={{ flex: 1, justifyContent: 'space-between', padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: 'rgba(11, 18, 36, 0.72)',
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.22)',
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
            Misión
          </Text>
        </View>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            backgroundColor: 'rgba(11, 18, 36, 0.7)',
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.24)',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {missionAvatar ? (
            <Image source={missionAvatar} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '900' }}>{avatarInitial}</Text>
          )}
        </View>
      </View>
      <View>
        <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '700' }} numberOfLines={1}>
          {item.storyTitle}
        </Text>
        <Text style={{ color: 'white', fontSize: 21, fontWeight: '900', marginTop: 4 }} numberOfLines={2}>
          {item.mission.title}
        </Text>
      </View>
    </View>
  );

  return (
    <View
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowRadius: 12,
      }}
    >
      <View style={{ aspectRatio: 0.9, backgroundColor: COLORS.surfaceAlt }}>
        {introVideoUrl && !hasVideoError ? (
          <View style={{ flex: 1 }}>
            <Video
              ref={introVideoRef}
              source={{ uri: introVideoUrl }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isLooping={false}
              useNativeControls={false}
              onPlaybackStatusUpdate={handleIntroVideoStatus}
              onError={() => {
                setHasVideoError(true);
                setIsVideoPlaying(false);
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: 'rgba(11, 18, 36, 0.38)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 100,
                backgroundColor: 'rgba(11, 18, 36, 0.66)',
              }}
            />
            {visualContent}
            {isVideoPlaying ? (
              <Pressable
                onPress={() => {
                  void handlePauseVideo();
                }}
                accessibilityRole="button"
                accessibilityLabel="Pausar video"
                style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
              />
            ) : (
              <View
                pointerEvents="box-none"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pressable
                  onPress={() => {
                    void handlePlayVideo();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={hasVideoEnded ? 'Reproducir de nuevo' : 'Reproducir video'}
                  style={({ pressed }) => ({
                    width: 72,
                    height: 72,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? 'rgba(11, 18, 36, 0.92)' : 'rgba(11, 18, 36, 0.82)',
                    borderWidth: 1,
                    borderColor: 'rgba(226, 232, 240, 0.26)',
                  })}
                >
                  <MaterialIcons
                    name={hasVideoEnded ? 'replay' : 'play-arrow'}
                    size={hasVideoEnded ? 30 : 34}
                    color="white"
                  />
                </Pressable>
              </View>
            )}
          </View>
        ) : missionAvatar ? (
          <ImageBackground source={missionAvatar} style={{ flex: 1 }} imageStyle={{ resizeMode: 'cover' }}>
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: 'rgba(11, 18, 36, 0.38)',
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 100,
                backgroundColor: 'rgba(11, 18, 36, 0.66)',
              }}
            />
            {visualContent}
          </ImageBackground>
        ) : (
          <View style={{ flex: 1, backgroundColor: '#0b172b' }}>{visualContent}</View>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ color: COLORS.muted, lineHeight: 20 }} numberOfLines={3}>
          {description}
        </Text>
        <Pressable
          onPress={() => onStart(item)}
          style={({ pressed }) => ({
            marginTop: 14,
            paddingVertical: 13,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: pressed ? '#1d4ed8' : COLORS.accentStrong,
            shadowColor: COLORS.accentStrong,
            shadowOpacity: 0.25,
            shadowRadius: 10,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '900' }}>Empezar misión</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ResumeMissionCard({
  item,
  onContinue,
}: {
  item: ResumeMission;
  onContinue: (item: ResumeMission) => void;
}) {
  const avatarImageUrl = item.mission.avatarImageUrl?.trim();

  const missionAvatar = useMemo<ImageSourcePropType | undefined>(() => {
    return avatarImageUrl ? { uri: avatarImageUrl } : getChatAvatar(item.mission.missionId);
  }, [avatarImageUrl, item.mission.missionId]);

  const displayName = item.mission.caracterName || item.mission.title || 'Personaje';
  const avatarInitial = (displayName.trim().charAt(0) || '?').toUpperCase();
  const description =
    item.mission.sceneSummary || 'Tu conversación sigue pendiente. Vuelve exactamente donde la dejaste.';

  return (
    <View
      style={{
        padding: 18,
        borderRadius: 18,
        backgroundColor: '#082f49',
        borderWidth: 1,
        borderColor: '#0ea5e9',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 54,
            height: 54,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: 'rgba(11, 18, 36, 0.78)',
            borderWidth: 1,
            borderColor: 'rgba(125, 211, 252, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {missionAvatar ? (
            <Image source={missionAvatar} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>{avatarInitial}</Text>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ color: '#7dd3fc', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
            Continúa tu misión
          </Text>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: '900', marginTop: 4 }}>
            {item.mission.title}
          </Text>
          <Text style={{ color: '#cbd5e1', marginTop: 4 }} numberOfLines={1}>
            {item.storyTitle}
          </Text>
        </View>
      </View>

      <Text style={{ color: '#dbeafe', lineHeight: 21, marginTop: 14 }}>{description}</Text>

      <Pressable
        onPress={() => onContinue(item)}
        style={({ pressed }) => ({
          marginTop: 16,
          paddingVertical: 13,
          borderRadius: 12,
          alignItems: 'center',
          backgroundColor: pressed ? '#0f766e' : '#14b8a6',
        })}
      >
        <Text style={{ color: '#032a2a', fontWeight: '900' }}>Continuar donde la dejé</Text>
      </Pressable>
    </View>
  );
}

function VocabularyCard({
  item,
  onListen,
  onMarkLearned,
  onPractice,
}: {
  item: PendingVocab;
  onListen: (item: PendingVocab) => void;
  onMarkLearned: (item: PendingVocab) => void;
  onPractice: (item: PendingVocab) => void;
}) {
  const example = item.examples?.[0] || item.prompt || 'Úsala en una oración natural.';

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 18,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
            Vocabulario
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: '900', marginTop: 5 }} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
        <Pressable
          onPress={() => onListen(item)}
          accessibilityRole="button"
          accessibilityLabel={`Escuchar ${item.label}`}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? '#0ea5e933' : '#0ea5e91f',
            borderWidth: 1,
            borderColor: '#0ea5e9',
            marginLeft: 12,
          })}
        >
          <MaterialIcons name="volume-up" size={23} color={COLORS.accent} />
        </Pressable>
      </View>

      <View
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 14,
          backgroundColor: '#0b172b',
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>
          Ejemplo
        </Text>
        <Text style={{ color: COLORS.text, marginTop: 6, lineHeight: 21 }} numberOfLines={3}>
          {example}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 14 }}>
        <Pressable
          onPress={() => onMarkLearned(item)}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: pressed ? '#134e4a' : '#0f766e',
            marginRight: 8,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '900' }}>Ya me la sé</Text>
        </Pressable>
        <Pressable
          onPress={() => onPractice(item)}
          style={({ pressed }) => ({
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: pressed ? '#1d4ed8' : COLORS.accentStrong,
            marginLeft: 8,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '900' }}>Practicar</Text>
        </Pressable>
      </View>

      <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 10 }}>
        Estado: {CARD_STATUS_LABELS[item.status]}
      </Text>
    </View>
  );
}

function getPostTypeLabel(item: FeedPostItem) {
  switch (item.postType) {
    case 'practice_guide':
      return 'Guia practica';
    case 'mission_guide':
      return 'Guia mision';
    case 'extra':
      return 'Extra';
    default:
      return 'Post';
  }
}

function FeedPostCard({
  item,
  onPractice,
  onMission,
  onClaimExtra,
  claiming,
  playbackEnabled,
}: {
  item: FeedPostItem;
  onPractice: (item: FeedPostItem) => void;
  onMission: (item: FeedPostItem) => void;
  onClaimExtra: (item: FeedPostItem) => void;
  claiming: boolean;
  playbackEnabled: boolean;
}) {
  const imageUrl = item.imageUrl?.trim();
  const videoUrl = item.videoUrl?.trim();
  const videoRef = useRef<Video | null>(null);
  const hasMedia = !!imageUrl || !!videoUrl;
  const canClaimExtra = item.postType === 'extra' && !!item.coinAmount && !item.claimed;

  useEffect(() => {
    if (playbackEnabled || !videoUrl) {
      return;
    }

    void videoRef.current?.pauseAsync().catch((pauseErr) => {
      console.warn('[Feed] No se pudo pausar el video del post al salir de la pantalla', pauseErr);
    });
  }, [playbackEnabled, videoUrl]);

  useEffect(() => {
    return () => {
      void videoRef.current?.pauseAsync().catch(() => {
        // Best effort cleanup on unmount.
      });
    };
  }, []);

  const action =
    item.postType === 'practice_guide'
      ? {
          label: 'Abrir practica',
          onPress: () => onPractice(item),
          disabled: false,
        }
      : item.postType === 'mission_guide'
      ? {
          label: 'Empezar mision',
          onPress: () => onMission(item),
          disabled: false,
        }
      : item.postType === 'extra'
      ? {
          label: item.claimed
            ? 'Reclamado'
            : claiming
            ? 'Reclamando...'
            : `Reclamar ${item.coinAmount || 0} moneda${item.coinAmount === 1 ? '' : 's'}`,
          onPress: () => onClaimExtra(item),
          disabled: !canClaimExtra || claiming,
        }
      : undefined;

  return (
    <View
      style={{
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 10,
      }}
    >
      {hasMedia ? (
        <View style={{ aspectRatio: videoUrl ? 9 / 11 : 1, backgroundColor: COLORS.surfaceAlt }}>
          {videoUrl ? (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={false}
            />
          ) : imageUrl ? (
            <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : null}
        </View>
      ) : null}

      <View style={{ padding: 16 }}>
        <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
          {getPostTypeLabel(item)}
        </Text>
        <Text style={{ color: COLORS.text, marginTop: 10, fontSize: 18, lineHeight: 26, fontWeight: '800' }}>
          {item.text}
        </Text>

        {action ? (
          <Pressable
            onPress={action.onPress}
            disabled={action.disabled}
            style={({ pressed }) => ({
              marginTop: 14,
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: action.disabled
                ? '#334155'
                : pressed
                ? '#1d4ed8'
                : item.postType === 'extra'
                ? '#0f766e'
                : COLORS.accentStrong,
              opacity: action.disabled ? 0.72 : 1,
            })}
          >
            <Text style={{ color: 'white', fontWeight: '900' }}>{action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function FeedScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const isFeedFocused = useIsFocused();
  const { items: learningItems } = useLearningItems();
  const { stories, loading: storiesLoading, error: storiesError } = useStoryCatalog();
  const {
    posts: configuredPosts,
    loading: feedPostsLoading,
    error: feedPostsError,
    reload: reloadFeedPosts,
  } = useFeedPosts();
  const {
    loading: cardProgressLoading,
    statusFor,
    statuses,
    setStatus,
  } = useCardProgress();
  const {
    activeMission,
    loading: storyProgressLoading,
    isMissionCompleted,
    progress: storyProgress,
  } = useStoryProgress();
  const { addCoins, canSpend, loading: coinsLoading, isUnlimited } = useCoins();
  const [feedSeed, setFeedSeed] = useState(() => `${Date.now()}:${Math.random()}`);
  const [visibleMissionsCount, setVisibleMissionsCount] = useState(MISSION_BATCH_SIZE);
  const [visibleVocabularyCount, setVisibleVocabularyCount] = useState(VOCABULARY_BATCH_SIZE);
  const [claimedExtraPostIds, setClaimedExtraPostIds] = useState<Set<string>>(() => new Set());
  const [claimingPostId, setClaimingPostId] = useState<string>();
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);
  const [postActionMessage, setPostActionMessage] = useState<string>();
  const [suspendFeedVideoPlayback, setSuspendFeedVideoPlayback] = useState(false);
  const isOpeningMissionRef = useRef(false);

  const videoPlaybackEnabled = isFeedFocused && !suspendFeedVideoPlayback;

  useEffect(() => {
    if (isFeedFocused) {
      setSuspendFeedVideoPlayback(false);
      return;
    }

    setSuspendFeedVideoPlayback(true);
  }, [isFeedFocused]);

  const stopFeedVideos = useCallback(() => {
    setSuspendFeedVideoPlayback(true);
  }, []);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch((audioModeErr) => {
      console.warn('[Feed] No se pudo configurar audio mode para videos', audioModeErr);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      setFeedSeed(`${Date.now()}:${Math.random()}`);
      setVisibleMissionsCount(MISSION_BATCH_SIZE);
      setVisibleVocabularyCount(VOCABULARY_BATCH_SIZE);
      reloadFeedPosts();
    }, [reloadFeedPosts])
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CLAIMED_EXTRA_POSTS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const ids = Array.isArray(parsed)
          ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : [];
        if (mounted) {
          setClaimedExtraPostIds(new Set(ids));
        }
      } catch (err) {
        console.warn('[Feed] No se pudieron cargar los extras reclamados', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const activeMissionKey = useMemo(() => {
    if (!activeMission) {
      return undefined;
    }
    return `${activeMission.storyId}:${activeMission.missionId}`;
  }, [activeMission]);

  const resumeMission = useMemo<ResumeMission | undefined>(() => {
    if (!activeMission) {
      return undefined;
    }

    let storyTitle = activeMission.storyTitle || 'Historia';
    let mission: StoryMission | undefined;

    for (const story of stories) {
      if (story.storyId !== activeMission.storyId) {
        continue;
      }
      storyTitle = story.title;
      mission =
        story.missions[activeMission.sceneIndex] ||
        story.missions.find((item) => item.missionId === activeMission.missionId);
      break;
    }

    if (!mission) {
      mission = {
        missionId: activeMission.missionId,
        title: activeMission.missionTitle || 'Tu misión pendiente',
        sceneSummary: activeMission.sceneSummary,
        aiRole: 'assistant',
        caracterName: activeMission.caracterName,
        avatarImageUrl: activeMission.avatarImageUrl,
        requirements: activeMission.requirements.map((requirement) => ({ ...requirement })),
      };
    }

    return {
      kind: 'resumeMission',
      feedId: `resume:${activeMission.storyId}:${activeMission.missionId}`,
      storyId: activeMission.storyId,
      storyTitle,
      sceneIndex: activeMission.sceneIndex,
      mission,
      updatedAt: activeMission.updatedAt,
    };
  }, [activeMission, stories]);

  const pendingMissions = useMemo<PendingMission[]>(() => {
    return stories.flatMap((story) =>
      story.missions
        .map((mission, sceneIndex) => ({
          kind: 'mission' as const,
          id: `${story.storyId}:${mission.missionId}`,
          storyId: story.storyId,
          storyTitle: story.title,
          sceneIndex,
          mission,
        }))
        .filter(
          (item) =>
            !isMissionCompleted(item.storyId, item.mission.missionId) &&
            `${item.storyId}:${item.mission.missionId}` !== activeMissionKey
        )
    );
  }, [activeMissionKey, isMissionCompleted, stories, storyProgress]);

  const pendingVocabulary = useMemo<PendingVocab[]>(() => {
    return learningItems
      .map((item) => ({ ...item, kind: 'vocab' as const, feedId: `vocab:${item.id}`, status: statusFor(item.id) }))
      .filter((item) => item.status !== 'learned');
  }, [learningItems, statusFor, statuses]);

  const feedPostItems = useMemo<FeedPostItem[]>(() => {
    return configuredPosts.map((post) => ({
      ...post,
      kind: 'post' as const,
      feedId: `post:${post.postId}`,
      claimed: post.postType === 'extra' ? claimedExtraPostIds.has(post.postId) : undefined,
    }));
  }, [claimedExtraPostIds, configuredPosts]);

  const shuffledMissions = useMemo(
    () => pickRandom(pendingMissions, pendingMissions.length, `${feedSeed}:missions`, (item) => item.id),
    [feedSeed, pendingMissions]
  );

  const shuffledVocabulary = useMemo(
    () => pickRandom(pendingVocabulary, pendingVocabulary.length, `${feedSeed}:vocab`, (item) => item.feedId),
    [feedSeed, pendingVocabulary]
  );

  const visibleMissions = useMemo(
    () => shuffledMissions.slice(0, visibleMissionsCount),
    [shuffledMissions, visibleMissionsCount]
  );

  const visibleVocabulary = useMemo(
    () => shuffledVocabulary.slice(0, visibleVocabularyCount),
    [shuffledVocabulary, visibleVocabularyCount]
  );

  const feedItems = useMemo(
    () => {
      const next = buildFeedItems(visibleMissions, visibleVocabulary, feedPostItems);
      return resumeMission ? [resumeMission, ...next] : next;
    },
    [feedPostItems, resumeMission, visibleMissions, visibleVocabulary]
  );

  const imageUrlsToPrefetch = useMemo(() => {
    const upcomingMissions = shuffledMissions.slice(
      0,
      Math.min(shuffledMissions.length, visibleMissionsCount + MISSION_BATCH_SIZE)
    );
    const missionUrls = upcomingMissions.map((item) => item.mission.avatarImageUrl);
    const resumeMissionUrls = resumeMission ? [resumeMission.mission.avatarImageUrl] : [];
    const postUrls = feedPostItems.map((item) => item.imageUrl);
    return [...resumeMissionUrls, ...missionUrls, ...postUrls];
  }, [feedPostItems, resumeMission, shuffledMissions, visibleMissionsCount]);

  useEffect(() => {
    prefetchImageUrls(imageUrlsToPrefetch, 16);
  }, [imageUrlsToPrefetch]);

  const loading = storiesLoading || cardProgressLoading || storyProgressLoading || feedPostsLoading;
  const hasMoreFeedItems =
    visibleMissionsCount < shuffledMissions.length || visibleVocabularyCount < shuffledVocabulary.length;

  const loadMoreFeedItems = useCallback(() => {
    if (loading || !hasMoreFeedItems) return;

    const previousMissionsCount = Math.min(
      visibleMissionsCount,
      shuffledMissions.length
    );
    const previousVocabularyCount = Math.min(
      visibleVocabularyCount,
      shuffledVocabulary.length
    );
    const nextMissionsCount = Math.min(
      visibleMissionsCount + MISSION_BATCH_SIZE,
      shuffledMissions.length
    );
    const nextVocabularyCount = Math.min(
      visibleVocabularyCount + VOCABULARY_BATCH_SIZE,
      shuffledVocabulary.length
    );
    const missionsLoadedCount = Math.max(
      nextMissionsCount - previousMissionsCount,
      0
    );
    const vocabularyLoadedCount = Math.max(
      nextVocabularyCount - previousVocabularyCount,
      0
    );
    const itemsLoadedCount = missionsLoadedCount + vocabularyLoadedCount;

    if (itemsLoadedCount <= 0) {
      return;
    }

    setVisibleMissionsCount(nextMissionsCount);
    setVisibleVocabularyCount(nextVocabularyCount);
    void trackMixpanelFeedLoadMore({
      previousItemsCount: previousMissionsCount + previousVocabularyCount,
      nextItemsCount: nextMissionsCount + nextVocabularyCount,
      itemsLoadedCount,
      previousMissionsCount,
      nextMissionsCount,
      missionsLoadedCount,
      previousVocabularyCount,
      nextVocabularyCount,
      vocabularyLoadedCount,
      totalMissionsAvailable: shuffledMissions.length,
      totalVocabularyAvailable: shuffledVocabulary.length,
      hasMoreAfter:
        nextMissionsCount < shuffledMissions.length ||
        nextVocabularyCount < shuffledVocabulary.length,
    });
  }, [
    hasMoreFeedItems,
    loading,
    shuffledMissions.length,
    shuffledVocabulary.length,
    visibleMissionsCount,
    visibleVocabularyCount,
  ]);

  const speakVocabulary = useCallback(async (item: PendingVocab) => {
    const segments = [item.label, item.examples?.[0]].filter(
      (segment): segment is string => typeof segment === 'string' && segment.trim().length > 0
    );
    if (!segments.length) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });
    } catch (err) {
      console.warn('[Feed] No se pudo configurar audio mode para speech', err);
    }
    Speech.stop();
    Speech.speak(segments.join('. '), { language: 'en-US', pitch: 1.05 });
  }, []);

  const handleMarkLearned = useCallback(
    (item: PendingVocab) => {
      void setStatus(String(item.id), 'learned');
    },
    [setStatus]
  );

  const openPractice = useCallback(
    async (item: LearningItem) => {
      stopFeedVideos();
      if (!isUnlimited) {
        if (coinsLoading) return;
        const enough = await canSpend(CARD_OPEN_COST);
        if (!enough) {
          navigation.navigate('Paywall', { source: 'deck_card_unlock' });
          return;
        }
      }
      navigation.navigate('Practice', {
        cardId: String(item.id),
        label: item.label,
        examples: item.examples,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation,
        prompt: item.prompt,
      });
    },
    [canSpend, coinsLoading, isUnlimited, navigation, stopFeedVideos]
  );

  const handlePractice = useCallback(
    async (item: PendingVocab) => {
      await openPractice(item);
    },
    [openPractice]
  );

  const openMission = useCallback(
    async (storyId: string, sceneIndex: number) => {
      if (isOpeningMissionRef.current) return;
      isOpeningMissionRef.current = true;
      try {
        stopFeedVideos();
        if (!isUnlimited) {
          if (coinsLoading) return;
          const enough = await canSpend(CHAT_MISSION_COST);
          if (!enough) {
            navigation.navigate('Paywall', { source: 'story_mission_unlock' });
            return;
          }

          const missionId = stories.find((story) => story.storyId === storyId)?.missions?.[sceneIndex]?.missionId;
          const shouldShowInterstitial = await shouldShowMissionInterstitialForMission(storyId, missionId);
          if (shouldShowInterstitial) {
            setIsInterstitialLoading(true);
            await showMissionInterstitialBeforeNavigation();
          }
        }

        navigation.navigate('StoryScene', {
          storyId,
          sceneIndex,
        });
      } finally {
        setIsInterstitialLoading(false);
        isOpeningMissionRef.current = false;
      }
    },
    [canSpend, coinsLoading, isUnlimited, navigation, stopFeedVideos, stories]
  );

  const handleStartMission = useCallback(
    async (item: PendingMission) => {
      await openMission(item.storyId, item.sceneIndex);
    },
    [openMission]
  );

  const handleContinueMission = useCallback(
    async (item: ResumeMission) => {
      await openMission(item.storyId, item.sceneIndex);
    },
    [openMission]
  );

  const handlePracticePost = useCallback(
    async (item: FeedPostItem) => {
      const practice = learningItems.find((learningItem) => String(learningItem.id) === String(item.practiceId));
      if (!practice) {
        setPostActionMessage('No encontramos esa practica en la app.');
        return;
      }
      setPostActionMessage(undefined);
      await openPractice(practice);
    },
    [learningItems, openPractice]
  );

  const handleMissionPost = useCallback(
    async (item: FeedPostItem) => {
      let target: { storyId: string; sceneIndex: number } | undefined;
      for (const story of stories) {
        const sceneIndex = story.missions.findIndex((mission) => mission.missionId === item.missionId);
        if (sceneIndex >= 0) {
          target = { storyId: story.storyId, sceneIndex };
          break;
        }
      }

      if (!target) {
        setPostActionMessage('No encontramos esa mision en la app.');
        return;
      }

      setPostActionMessage(undefined);
      await openMission(target.storyId, target.sceneIndex);
    },
    [openMission, stories]
  );

  const persistClaimedExtraPostIds = useCallback(async (ids: Set<string>) => {
    try {
      await AsyncStorage.setItem(CLAIMED_EXTRA_POSTS_STORAGE_KEY, JSON.stringify([...ids]));
    } catch (err) {
      console.warn('[Feed] No se pudieron guardar los extras reclamados', err);
    }
  }, []);

  const handleClaimExtraPost = useCallback(
    async (item: FeedPostItem) => {
      if (item.postType !== 'extra' || !item.coinAmount || claimedExtraPostIds.has(item.postId)) {
        return;
      }

      setClaimingPostId(item.postId);
      setPostActionMessage(undefined);

      try {
        const credited = await addCoins(item.coinAmount, `feed-extra:${item.postId}`);
        if (!credited) {
          setPostActionMessage('No pudimos acreditar las monedas.');
          return;
        }

        const next = new Set(claimedExtraPostIds);
        next.add(item.postId);
        setClaimedExtraPostIds(next);
        await persistClaimedExtraPostIds(next);
        setPostActionMessage(`Sumamos ${item.coinAmount} moneda${item.coinAmount === 1 ? '' : 's'} a tu saldo.`);
      } catch (err) {
        console.warn('[Feed] No se pudo reclamar el extra', err);
        setPostActionMessage('No pudimos reclamar ese extra.');
      } finally {
        setClaimingPostId(undefined);
      }
    },
    [addCoins, claimedExtraPostIds, persistClaimedExtraPostIds]
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList<FeedItem>
        data={feedItems}
        keyExtractor={(item) => (item.kind === 'mission' ? item.id : item.feedId)}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        onEndReached={loadMoreFeedItems}
        onEndReachedThreshold={0.45}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: Math.max(insets.bottom + 108, 128),
        }}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: 58,
                position: 'relative',
              }}
            >
              <CoinCountChip style={{ position: 'absolute', left: 0, top: 6 }} />
              <Image
                source={require('../image/logo.png')}
                style={{ width: 180, height: 48, resizeMode: 'contain' }}
              />
              <Pressable
                onPress={() => {
                  stopFeedVideos();
                  navigation.navigate('Settings');
                }}
                hitSlop={12}
                style={({ pressed }) => ({
                  position: 'absolute',
                  right: 0,
                  top: 7,
                  opacity: pressed ? 0.8 : 1,
                  padding: 6,
                })}
              >
                <MaterialIcons name="settings" size={26} color="#cbd5e1" />
              </Pressable>
            </View>

            {storiesError ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: '#3f1d2e',
                  borderWidth: 1,
                  borderColor: '#7f1d1d',
                }}
              >
                <Text style={{ color: '#fecdd3', fontWeight: '700' }}>{storiesError}</Text>
              </View>
            ) : null}

            {feedPostsError ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: '#3f1d2e',
                  borderWidth: 1,
                  borderColor: '#7f1d1d',
                }}
              >
                <Text style={{ color: '#fecdd3', fontWeight: '700' }}>{feedPostsError}</Text>
              </View>
            ) : null}

            {postActionMessage ? (
              <View
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: '#0f2f2a',
                  borderWidth: 1,
                  borderColor: '#0f766e',
                }}
              >
                <Text style={{ color: '#ccfbf1', fontWeight: '700' }}>{postActionMessage}</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'resumeMission' ? (
            <ResumeMissionCard item={item} onContinue={handleContinueMission} />
          ) : item.kind === 'mission' ? (
            <MissionCard
              item={item}
              onStart={handleStartMission}
              playbackEnabled={videoPlaybackEnabled}
            />
          ) : item.kind === 'vocab' ? (
            <VocabularyCard
              item={item}
              onListen={speakVocabulary}
              onMarkLearned={handleMarkLearned}
              onPractice={handlePractice}
            />
          ) : (
            <FeedPostCard
              item={item}
              onPractice={handlePracticePost}
              onMission={handleMissionPost}
              onClaimExtra={handleClaimExtraPost}
              claiming={claimingPostId === item.postId}
              playbackEnabled={videoPlaybackEnabled}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={{ color: COLORS.muted, marginTop: 10 }}>Preparando tu feed...</Text>
            </View>
          ) : (
            <View
              style={{
                padding: 18,
                borderRadius: 16,
                backgroundColor: COLORS.surface,
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: COLORS.text, fontWeight: '900', textAlign: 'center' }}>
                No hay pendientes por ahora.
              </Text>
              <Text style={{ color: COLORS.muted, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
                Cuando aparezcan nuevas tarjetas o misiones, las verás aquí.
              </Text>
            </View>
          )
        }
      />
      {isInterstitialLoading ? (
        <View
          pointerEvents="auto"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(11, 18, 36, 0.65)',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              minWidth: 220,
              paddingHorizontal: 20,
              paddingVertical: 18,
              borderRadius: 18,
              backgroundColor: COLORS.surface,
              borderWidth: 1,
              borderColor: COLORS.border,
              alignItems: 'center',
            }}
          >
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={{ color: COLORS.text, marginTop: 10, fontWeight: '800', textAlign: 'center' }}>
              Abriendo mision...
            </Text>
          </View>
        </View>
      ) : null}
      <AppTabBar active="feed" />
    </SafeAreaView>
  );
}
