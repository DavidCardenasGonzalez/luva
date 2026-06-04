import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  ImageBackground,
  ImageSourcePropType,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ViewToken,
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
import { LearningItem, LearningItemOptionKey, useLearningItems } from '../hooks/useLearningItems';
import { CharacterVideoPost, useCharacterVideoPosts } from '../hooks/useCharacterVideoPosts';
import { useCharacterPostLike } from '../hooks/useCharacterPostLike';
import { recordVideoPostMetric } from '../feed/videoPostMetrics';
import { FeedPost, useFeedPosts } from '../hooks/useFeedPosts';
import { FriendCharacter, useFriends } from '../hooks/useFriends';
import { Lesson, fetchSrtCaptions, useLessons } from '../hooks/useLessons';
import { ShadowingChapter, ShadowingList, useShadowing } from '../hooks/useShadowing';
import {
  CARD_STATUS_LABELS,
  CardProgressStatus,
  useCardProgress,
} from '../progress/CardProgressProvider';
import { CARD_OPEN_COST, useCoins } from '../purchases/CoinBalanceProvider';
import CoinCountChip from '../components/CoinCountChip';
import AppTabBar from '../components/AppTabBar';
import { getChatAvatar } from '../chatimages/chatAvatarMap';
import {
  trackMixpanelFeedItemAction,
  trackMixpanelFeedItemViewed,
  trackMixpanelFeedReelScroll,
  trackMixpanelFeedLoadMore,
} from '../marketing/mixpanelEvents';
import { prefetchImageUrls } from '../shared/imagePrefetch';
import { LITE_PROMO_EXPIRES_AT_KEY } from '../purchases/litePromo';
import { getLearnedLessonIds } from '../progress/lessonProgress';
import { recordJourneyVocabularyQuickGuessCorrect } from '../progress/journeyProgress';
import { useShadowingPlayer } from '../shadowing/ShadowingPlayerProvider';
import { api } from '../api/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Feed'>;

type StoryMission = {
  missionId: string;
  title: string;
  sceneSummary?: string;
  aiRole: string;
  caracterName?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  videoIntro?: string;
  videoPreviewUrl?: string;
  videoThumbnailUrl?: string;
  requirements: Array<{ requirementId: string; text: string; met?: boolean; feedback?: string }>;
};

type StoryCatalogItem = {
  storyId: string;
  isInitial?: boolean;
  title: string;
  missions: StoryMission[];
};

type StoryActiveMission = {
  storyId: string;
  missionId: string;
  sceneIndex: number;
  storyTitle?: string;
  missionTitle?: string;
  sceneSummary?: string;
  caracterName?: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
  videoPreviewUrl?: string;
  videoThumbnailUrl?: string;
  requirements: StoryMission['requirements'];
  updatedAt: string;
};

type PendingMission = {
  kind: 'mission';
  id: string;
  storyId: string;
  isInitialStory?: boolean;
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

type CharacterVideoFeedItem = CharacterVideoPost & {
  kind: 'characterVideo';
  feedId: string;
};

type CharacterVideoSubtitleCue = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

type SubtitleTranslationState = {
  text?: string;
  loading?: boolean;
  error?: string;
};

type TranslationResponse = {
  translatedText?: string;
};

type FeedPostItem = FeedPost & {
  kind: 'post';
  feedId: string;
  claimed?: boolean;
};

type PendingShadowing = ShadowingList & {
  kind: 'shadowing';
  feedId: string;
  nextChapter: ShadowingChapter;
  listenedCount: number;
};

type PendingLesson = Lesson & {
  kind: 'lesson';
  feedId: string;
};

type PromoFeedItem = {
  kind: 'promo';
  feedId: string;
  remainingSeconds: number;
};

type FeedItem =
  | PromoFeedItem
  | ResumeMission
  | PendingMission
  | CharacterVideoFeedItem
  | PendingVocab
  | PendingShadowing
  | PendingLesson
  | FeedPostItem;

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

const CHARACTER_VIDEO_BATCH_SIZE = 1;
const ONBOARDING_REELS_PRELOAD_COUNT = 3;
const ONBOARDING_REELS_PRELOAD_TIMEOUT_MS = 1400;
const VOCABULARY_BATCH_SIZE = 3;
const SHADOWING_BATCH_SIZE = 1;
const LESSON_BATCH_SIZE = 1;
const CLAIMED_EXTRA_POSTS_STORAGE_KEY = '@luva/feed/claimed-extra-posts';

function padTimerUnit(value: number) {
  return String(value).padStart(2, '0');
}

function getPromoTimerParts(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return {
    hours: padTimerUnit(hours),
    minutes: padTimerUnit(minutes),
    seconds: padTimerUnit(seconds),
  };
}

function formatFeedDuration(seconds?: number) {
  if (!seconds || seconds <= 0) {
    return undefined;
  }
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const rest = totalSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function findActiveVideoSubtitle(cues: CharacterVideoSubtitleCue[], timeSeconds: number) {
  return cues.find((cue) => timeSeconds >= cue.startSeconds && timeSeconds <= cue.endSeconds + 0.25);
}

function getVideoSubtitleKey(cue?: CharacterVideoSubtitleCue) {
  if (!cue) return undefined;
  return `${cue.startSeconds.toFixed(2)}:${cue.endSeconds.toFixed(2)}:${cue.text}`;
}

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

function waitForMilliseconds(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function preloadOnboardingReelPreviewAssets(videos: CharacterVideoFeedItem[]) {
  const urls = Array.from(
    new Set(
      videos
        .flatMap((item) => [
          item.thumbnailUrl,
          item.imageUrl,
          item.avatarImageUrl,
        ])
        .map((url) => url?.trim())
        .filter((url): url is string => !!url && /^https?:\/\//i.test(url))
    )
  );

  if (!urls.length) {
    return;
  }

  await Promise.race([
    Promise.all(urls.map((url) => Image.prefetch(url).catch(() => false))).then(() => undefined),
    waitForMilliseconds(ONBOARDING_REELS_PRELOAD_TIMEOUT_MS),
  ]);
}

function buildFeedItems({
  promo,
  characterVideos,
  vocabulary,
  shadowing,
  lessons,
  posts,
}: {
  promo?: PromoFeedItem;
  characterVideos: CharacterVideoFeedItem[];
  vocabulary: PendingVocab[];
  shadowing: PendingShadowing[];
  lessons: PendingLesson[];
  posts: FeedPostItem[];
}) {
  const baseFeed: FeedItem[] = [];
  if (promo) {
    baseFeed.push(promo);
  }
  let characterVideoIndex = 0;
  let vocabularyIndex = 0;
  let shadowingIndex = 0;
  let lessonIndex = 0;

  while (
    characterVideoIndex < characterVideos.length ||
    vocabularyIndex < vocabulary.length ||
    shadowingIndex < shadowing.length ||
    lessonIndex < lessons.length
  ) {
    const characterVideo = characterVideos[characterVideoIndex];
    if (characterVideo) {
      baseFeed.push(characterVideo);
      characterVideoIndex += 1;
    }

    const firstVocab = vocabulary[vocabularyIndex];
    if (firstVocab) {
      baseFeed.push(firstVocab);
      vocabularyIndex += 1;
    }

    const shadowingItem = shadowing[shadowingIndex];
    if (shadowingItem) {
      baseFeed.push(shadowingItem);
      shadowingIndex += 1;
    }

    const secondVocab = vocabulary[vocabularyIndex];
    if (secondVocab) {
      baseFeed.push(secondVocab);
      vocabularyIndex += 1;
    }

    const lesson = lessons[lessonIndex];
    if (lesson) {
      baseFeed.push(lesson);
      lessonIndex += 1;
    }

    const thirdVocab = vocabulary[vocabularyIndex];
    if (thirdVocab) {
      baseFeed.push(thirdVocab);
      vocabularyIndex += 1;
    }
  }

  const feed: FeedItem[] = [...baseFeed];
  const pinnedItemsCount = promo ? 1 : 0;
  const orderOffsets = new Map<number, number>();
  [...posts]
    .sort((left, right) => left.order - right.order || left.postId.localeCompare(right.postId))
    .forEach((post) => {
      const offset = orderOffsets.get(post.order) || 0;
      orderOffsets.set(post.order, offset + 1);
      const targetIndex = Math.max(pinnedItemsCount, Math.min(feed.length, post.order - 1 + offset));
      feed.splice(targetIndex, 0, post);
    });

  return feed;
}

function getFeedMediaId(item: FeedItem) {
  if (item.kind === 'mission' && (item.mission.videoPreviewUrl?.trim() || item.mission.videoIntro?.trim())) {
    return item.id;
  }
  if (item.kind === 'post' && item.videoUrl?.trim()) {
    return item.feedId;
  }
  return undefined;
}

function getFeedTrackingProperties(item: FeedItem) {
  if (item.kind === 'promo') {
    return {
      feed_item_id: item.feedId,
      feed_item_kind: item.kind,
      remaining_seconds: item.remainingSeconds,
    };
  }

  if (item.kind === 'resumeMission') {
    return {
      feed_item_id: item.feedId,
      feed_item_kind: item.kind,
      story_id: item.storyId,
      story_title: item.storyTitle,
      mission_id: item.mission.missionId,
      mission_title: item.mission.title,
      scene_index: item.sceneIndex,
    };
  }

  if (item.kind === 'mission') {
    return {
      feed_item_id: item.id,
      feed_item_kind: item.kind,
      story_id: item.storyId,
      story_title: item.storyTitle,
      mission_id: item.mission.missionId,
      mission_title: item.mission.title,
      scene_index: item.sceneIndex,
      is_initial_story: Boolean(item.isInitialStory),
    };
  }

  if (item.kind === 'characterVideo') {
    return {
      feed_item_id: item.feedId,
      feed_item_kind: item.kind,
      character_id: item.characterId,
      character_name: item.characterName,
      post_id: item.postId,
    };
  }

  if (item.kind === 'vocab') {
    return {
      feed_item_id: item.feedId,
      feed_item_kind: item.kind,
      card_id: String(item.id),
      label: item.label,
      status: item.status,
    };
  }

  if (item.kind === 'shadowing') {
    return {
      feed_item_id: item.feedId,
      feed_item_kind: item.kind,
      list_id: item.listId,
      list_name: item.name,
      chapter_id: item.nextChapter.chapterId,
      chapter_title: item.nextChapter.title,
      listened_count: item.listenedCount,
    };
  }

  if (item.kind === 'lesson') {
    return {
      feed_item_id: item.feedId,
      feed_item_kind: item.kind,
      lesson_id: item.lessonId,
      lesson_title: item.title,
    };
  }

  return {
    feed_item_id: item.feedId,
    feed_item_kind: item.kind,
    post_id: item.postId,
    post_type: item.postType,
    practice_id: item.practiceId,
    mission_id: item.missionId,
    coin_amount: item.coinAmount,
  };
}

function MissionCard({
  item,
  onStart,
  onViewAll,
  playbackEnabled,
}: {
  item: PendingMission;
  onStart: (item: PendingMission) => void;
  onViewAll: () => void;
  playbackEnabled: boolean;
}) {
  const avatarImageUrl = (item.mission.avatarImageXsUrl || item.mission.avatarImageUrl)?.trim();
  const coverImageUrl = (
    item.mission.videoThumbnailUrl ||
    item.mission.avatarImageMdUrl ||
    item.mission.avatarImageUrl
  )?.trim();
  const introVideoUrl = (item.mission.videoPreviewUrl || item.mission.videoIntro)?.trim();
  const introVideoRef = useRef<Video | null>(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [hasVideoEnded, setHasVideoEnded] = useState(false);
  const [isIntroVideoReadyForDisplay, setIsIntroVideoReadyForDisplay] = useState(false);
  const introVideoSource = useMemo(() => {
    return introVideoUrl ? { uri: introVideoUrl } : undefined;
  }, [introVideoUrl]);

  useEffect(() => {
    setHasVideoError(false);
    setIsVideoPlaying(false);
    setHasVideoEnded(false);
    setIsIntroVideoReadyForDisplay(false);
  }, [introVideoUrl]);

  const missionAvatar = useMemo<ImageSourcePropType | undefined>(() => {
    return avatarImageUrl ? { uri: avatarImageUrl } : getChatAvatar(item.mission.missionId);
  }, [avatarImageUrl, item.mission.missionId]);
  const missionCover = useMemo<ImageSourcePropType | undefined>(() => {
    return coverImageUrl ? { uri: coverImageUrl } : missionAvatar;
  }, [coverImageUrl, missionAvatar]);

  const displayName = item.mission.caracterName || item.mission.title || 'Personaje';
  const avatarInitial = (displayName.trim().charAt(0) || '?').toUpperCase();
  const description = item.mission.sceneSummary || 'Habla con el personaje y completa los objetivos de la escena.';

  const handleIntroVideoStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setIsVideoPlaying(false);
      return;
    }

    setIsVideoPlaying((current) => (current === status.isPlaying ? current : status.isPlaying));
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
    setIsIntroVideoReadyForDisplay(false);
    void introVideoRef.current?.unloadAsync().catch((unloadErr) => {
      console.warn('[Feed] No se pudo descargar el intro al salir de la pantalla', unloadErr);
    });
  }, [playbackEnabled]);

  useEffect(() => {
    return () => {
      void introVideoRef.current?.unloadAsync().catch(() => {
        // Best effort cleanup on unmount.
      });
    };
  }, []);

  const shouldMountVideo = playbackEnabled && !!introVideoSource && !hasVideoError;

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
        {shouldMountVideo ? (
          <View style={{ flex: 1 }}>
            {missionCover ? (
              <Image
                source={missionCover}
                style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                resizeMode="cover"
              />
            ) : null}
            <Video
              key={introVideoUrl}
              ref={introVideoRef}
              source={introVideoSource}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                opacity: isIntroVideoReadyForDisplay ? 1 : 0,
              }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isLooping={false}
              useNativeControls={false}
              progressUpdateIntervalMillis={500}
              onLoadStart={() => setIsIntroVideoReadyForDisplay(false)}
              onLoad={() => setIsIntroVideoReadyForDisplay(true)}
              onReadyForDisplay={() => setIsIntroVideoReadyForDisplay(true)}
              onPlaybackStatusUpdate={handleIntroVideoStatus}
              onError={() => {
                setHasVideoError(true);
                setIsVideoPlaying(false);
                setIsIntroVideoReadyForDisplay(false);
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
        ) : missionCover ? (
          <Pressable
            onPress={() => onStart(item)}
            accessibilityRole="button"
            accessibilityLabel={`Empezar misión ${item.mission.title}`}
            style={{ flex: 1 }}
          >
            <ImageBackground source={missionCover} style={{ flex: 1 }} imageStyle={{ resizeMode: 'cover' }}>
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
          </Pressable>
        ) : (
          <Pressable
            onPress={() => onStart(item)}
            accessibilityRole="button"
            accessibilityLabel={`Empezar misión ${item.mission.title}`}
            style={{ flex: 1, backgroundColor: '#0b172b' }}
          >
            {visualContent}
          </Pressable>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ color: COLORS.muted, lineHeight: 20 }} numberOfLines={3}>
          {description}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
          <Pressable
            onPress={() => onStart(item)}
            style={({ pressed }) => ({
              flex: 2,
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
          <Pressable
            onPress={onViewAll}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: pressed ? '#1e293b' : '#0f172a',
              borderWidth: 1,
              borderColor: COLORS.border,
            })}
          >
            <Text style={{ color: COLORS.muted, fontWeight: '800' }}>Ver más</Text>
          </Pressable>
        </View>
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
  const avatarImageUrl = (item.mission.avatarImageXsUrl || item.mission.avatarImageUrl)?.trim();

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

function CharacterVideoCard({
  item,
  onPress,
}: {
  item: CharacterVideoFeedItem;
  onPress: (item: CharacterVideoFeedItem) => void;
}) {
  const thumbnailUrl = (item.thumbnailUrl || item.imageUrl).trim();
  const { userLiked, displayedLabel, toggleLike } = useCharacterPostLike(
    item.characterId,
    item.postId,
    item.likeCount,
  );

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Reproducir video de ${item.characterName}`}
      style={({ pressed }) => ({
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOpacity: 0.14,
        shadowRadius: 12,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ aspectRatio: 9 / 11, backgroundColor: COLORS.surfaceAlt }}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          resizeMode="cover"
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(11, 18, 36, 0.18)',
          }}
        />
        <View
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
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(11, 18, 36, 0.82)',
              borderWidth: 1,
              borderColor: 'rgba(226, 232, 240, 0.28)',
            }}
          >
            <MaterialIcons name="play-arrow" size={38} color="white" />
          </View>
        </View>
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.34)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.avatarImageUrl ? (
              <Image
                source={{ uri: item.avatarImageUrl }}
                style={{ width: 26, height: 26, borderRadius: 999, marginRight: 8 }}
                resizeMode="cover"
              />
            ) : null}
            <Text
              style={{ flex: 1, color: 'white', fontSize: 13, fontWeight: '900' }}
              numberOfLines={1}
            >
              {item.characterName}
            </Text>
            <Pressable
              onPress={toggleLike}
              accessibilityRole="button"
              accessibilityLabel={userLiked ? 'Quitar me gusta' : 'Me gusta'}
              hitSlop={8}
              style={({ pressed }) => ({
                marginLeft: 10,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons
                name={userLiked ? 'favorite' : 'favorite-border'}
                size={20}
                color={userLiked ? '#f43f5e' : 'white'}
              />
              <Text
                style={{
                  marginLeft: 4,
                  color: 'white',
                  fontSize: 12,
                  fontWeight: '800',
                  minWidth: 22,
                  textAlign: 'left',
                }}
                numberOfLines={1}
              >
                {displayedLabel}
              </Text>
            </Pressable>
          </View>
          {item.caption ? (
            <Text
              style={{ color: '#e2e8f0', marginTop: 6, fontSize: 12, lineHeight: 16 }}
              numberOfLines={2}
            >
              {item.caption}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function CharacterVideoPage({
  item,
  height,
  bottomInset,
  playbackEnabled,
  onOpenProfile,
  onReply,
}: {
  item: CharacterVideoFeedItem;
  height: number;
  bottomInset: number;
  playbackEnabled: boolean;
  onOpenProfile: (item: CharacterVideoFeedItem) => void;
  onReply: (item: CharacterVideoFeedItem, draft: string) => void;
}) {
  const videoRef = useRef<Video | null>(null);
  const posterUrl = (item.thumbnailUrl || item.imageUrl).trim();
  const videoUrl = item.videoUrl.trim();
  const [isVideoReadyForDisplay, setIsVideoReadyForDisplay] = useState(false);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [playbackPositionSeconds, setPlaybackPositionSeconds] = useState(0);
  const [subtitleCues, setSubtitleCues] = useState<CharacterVideoSubtitleCue[]>([]);
  const [subtitleTranslations, setSubtitleTranslations] = useState<Record<string, SubtitleTranslationState>>({});
  const replyInputRef = useRef<TextInput | null>(null);
  const videoSource = useMemo(() => ({ uri: videoUrl }), [videoUrl]);
  const activeSubtitle = useMemo(
    () => findActiveVideoSubtitle(subtitleCues, playbackPositionSeconds),
    [playbackPositionSeconds, subtitleCues]
  );
  const activeSubtitleKey = useMemo(() => getVideoSubtitleKey(activeSubtitle), [activeSubtitle]);
  const activeTranslation = activeSubtitleKey ? subtitleTranslations[activeSubtitleKey] : undefined;
  const subtitleBottomOffset = bottomInset + 252;
  const suggestedReplies = useMemo(() => item.suggestedReplies.slice(0, 3), [item.suggestedReplies]);

  useEffect(() => {
    if (!playbackEnabled) {
      setReplyText('');
      replyInputRef.current?.blur();
    }
  }, [playbackEnabled]);

  const { userLiked, displayedLabel, toggleLike, ensureLiked } = useCharacterPostLike(
    item.characterId,
    item.postId,
    item.likeCount,
  );

  const handleSendReply = useCallback((draft: string) => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    replyInputRef.current?.blur();
    setReplyText('');
    ensureLiked();
    recordVideoPostMetric(item.characterId, item.postId, 'conversation');
    onReply(item, trimmed);
  }, [ensureLiked, item, onReply]);

  const handleSubmitReply = useCallback(() => {
    handleSendReply(replyText);
  }, [handleSendReply, replyText]);

  const handleTranslateSubtitle = useCallback(async () => {
    const subtitle = activeSubtitle?.text.trim();
    const subtitleKey = activeSubtitleKey;
    if (!subtitle || !subtitleKey) return;

    const existing = subtitleTranslations[subtitleKey];
    if (existing?.loading || existing?.text) return;

    setSubtitleTranslations((current) => ({
      ...current,
      [subtitleKey]: { ...current[subtitleKey], loading: true, error: undefined },
    }));
    setPaused(true);

    try {
      const payload = await api.post<TranslationResponse>('/translate', {
        text: subtitle,
        source: 'en',
        target: 'es',
      });
      setSubtitleTranslations((current) => ({
        ...current,
        [subtitleKey]: { text: payload.translatedText || '', loading: false },
      }));
    } catch (err: any) {
      setSubtitleTranslations((current) => ({
        ...current,
        [subtitleKey]: {
          loading: false,
          error: err?.message || 'No pudimos traducir este subtitulo.',
        },
      }));
    }
  }, [activeSubtitle, activeSubtitleKey, subtitleTranslations]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPlaybackPositionSeconds(status.positionMillis / 1000);
    if (status.isPlaying) {
      recordVideoPostMetric(item.characterId, item.postId, 'play');
      if (status.positionMillis >= 3000) {
        recordVideoPostMetric(item.characterId, item.postId, 'watched3s');
      }
    }
  }, [item.characterId, item.postId]);

  useEffect(() => {
    setIsVideoReadyForDisplay(false);
    setPaused(false);
    setPlaybackPositionSeconds(0);
    setSubtitleTranslations({});
  }, [videoUrl]);

  useEffect(() => {
    let cancelled = false;
    setSubtitleCues([]);
    setSubtitleTranslations({});

    if (!item.subtitlesUrl) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const cues = await fetchSrtCaptions(item.subtitlesUrl);
        if (!cancelled) {
          setSubtitleCues(cues);
        }
      } catch (subtitleError) {
        console.warn('[Feed] No se pudieron cargar subtitulos del video de personaje', subtitleError);
        if (!cancelled) {
          setSubtitleCues([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item.subtitlesUrl]);

  useEffect(() => {
    if (playbackEnabled) {
      setPaused(false);
      return;
    }

    void videoRef.current?.pauseAsync().catch(() => {
      // Best effort pause while another dumbscroll page is focused.
    });
  }, [playbackEnabled]);

  useEffect(() => {
    return () => {
      void videoRef.current?.unloadAsync().catch(() => {
        // Best effort cleanup on unmount.
      });
    };
  }, []);

  return (
    <View style={{ height, backgroundColor: 'black' }}>
      <Image
        source={{ uri: posterUrl }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        resizeMode="cover"
      />
      <Video
        key={videoUrl}
        ref={videoRef}
        source={videoSource}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          opacity: isVideoReadyForDisplay ? 1 : 0,
        }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={playbackEnabled && !paused}
        isLooping
        useNativeControls={false}
        progressUpdateIntervalMillis={500}
        onLoadStart={() => setIsVideoReadyForDisplay(false)}
        onLoad={() => setIsVideoReadyForDisplay(true)}
        onReadyForDisplay={() => setIsVideoReadyForDisplay(true)}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(videoError) => {
          setIsVideoReadyForDisplay(false);
          console.warn('[Feed] No se pudo cargar el video de personaje', videoError);
        }}
      />
      <Pressable
        onPress={() => {
          if (playbackEnabled) {
            setPaused((current) => !current);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={paused ? 'Reproducir video' : 'Pausar video'}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />
      {!isVideoReadyForDisplay || paused ? (
        <View
          pointerEvents="none"
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
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(11, 18, 36, 0.82)',
              borderWidth: 1,
              borderColor: 'rgba(226, 232, 240, 0.28)',
            }}
          >
            {!isVideoReadyForDisplay && !paused ? (
              <ActivityIndicator size="large" color="white" />
            ) : (
              <MaterialIcons name="play-arrow" size={40} color="white" />
            )}
          </View>
        </View>
      ) : null}
      {activeSubtitle ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: subtitleBottomOffset,
          }}
        >
          <View
            style={{
              borderRadius: 15,
              borderWidth: 1,
              borderColor: 'rgba(226, 232, 240, 0.24)',
              backgroundColor: 'rgba(15, 23, 42, 0.72)',
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text
                style={{ flex: 1, color: 'white', fontSize: 19, lineHeight: 25, fontWeight: '800' }}
                numberOfLines={3}
              >
                {activeSubtitle.text}
              </Text>
              {!activeTranslation?.text ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Traducir subtitulo"
                  onPress={() => { void handleTranslateSubtitle(); }}
                  disabled={!!activeTranslation?.loading}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    width: 38,
                    height: 38,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 12,
                    backgroundColor: activeTranslation?.loading
                      ? 'rgba(240, 253, 244, 0.82)'
                      : pressed
                        ? 'rgba(220, 252, 231, 0.92)'
                        : 'rgba(240, 253, 244, 0.92)',
                    borderWidth: 1,
                    borderColor: 'rgba(187, 247, 208, 0.82)',
                    opacity: activeTranslation?.loading ? 0.76 : 1,
                  })}
                >
                  {activeTranslation?.loading ? (
                    <ActivityIndicator size="small" color="#15803d" />
                  ) : (
                    <MaterialIcons name="translate" size={20} color="#15803d" />
                  )}
                </Pressable>
              ) : null}
            </View>
            {activeTranslation?.text ? (
              <Text
                style={{ marginTop: 9, color: '#dbeafe', fontSize: 16, lineHeight: 22, fontWeight: '800' }}
                numberOfLines={3}
              >
                {activeTranslation.text}
              </Text>
            ) : activeTranslation?.error ? (
              <Text style={{ marginTop: 8, color: '#fecaca', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                {activeTranslation.error}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
      <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{
            paddingHorizontal: 18,
            paddingTop: 14,
            paddingBottom: 12,
            backgroundColor: 'rgba(0, 0, 0, 0.34)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => onOpenProfile(item)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir perfil de ${item.characterName}`}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.75 : 1,
              })}
            >
              {item.avatarImageUrl ? (
                <Image
                  source={{ uri: item.avatarImageUrl }}
                  style={{ width: 34, height: 34, borderRadius: 999, marginRight: 10 }}
                  resizeMode="cover"
                />
              ) : null}
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', flexShrink: 1 }} numberOfLines={1}>
                {item.characterName}
              </Text>
            </Pressable>
            <Pressable
              onPress={toggleLike}
              accessibilityRole="button"
              accessibilityLabel={userLiked ? 'Quitar me gusta' : 'Me gusta'}
              hitSlop={8}
              style={({ pressed }) => ({
                marginLeft: 12,
                flexDirection: 'row',
                alignItems: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <MaterialIcons
                name={userLiked ? 'favorite' : 'favorite-border'}
                size={26}
                color={userLiked ? '#f43f5e' : 'white'}
              />
              <Text
                style={{
                  marginLeft: 6,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '800',
                  minWidth: 28,
                  textAlign: 'left',
                }}
                numberOfLines={1}
              >
                {displayedLabel}
              </Text>
            </Pressable>
          </View>
          <Text style={{ color: '#e2e8f0', marginTop: 10, fontSize: 14, lineHeight: 20 }} numberOfLines={3}>
            {item.caption}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 14,
            paddingTop: 10,
            paddingBottom: Math.max(14, bottomInset + 10),
            backgroundColor: 'rgba(0, 0, 0, 0.34)',
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {suggestedReplies.map((reply, index) => (
              <Pressable
                key={`${index}:${reply}`}
                onPress={() => handleSendReply(reply)}
                accessibilityRole="button"
                accessibilityLabel={`Enviar ${reply}`}
                style={({ pressed }) => ({
                  maxWidth: '100%',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: pressed ? 'rgba(226, 232, 240, 0.3)' : 'rgba(226, 232, 240, 0.18)',
                  borderWidth: 1,
                  borderColor: 'rgba(226, 232, 240, 0.32)',
                })}
              >
                <Text style={{ color: 'white', fontSize: 13, fontWeight: '800' }} numberOfLines={1}>
                  {reply}
                </Text>
              </Pressable>
            ))}
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: 'rgba(226, 232, 240, 0.45)',
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              paddingHorizontal: 16,
              paddingVertical: Platform.OS === 'ios' ? 10 : 6,
            }}
          >
            <TextInput
              ref={replyInputRef}
              value={replyText}
              onChangeText={setReplyText}
              placeholder={`Enviar mensaje a ${item.characterName.split(' ')[0]}...`}
              placeholderTextColor="rgba(226, 232, 240, 0.7)"
              style={{
                flex: 1,
                color: 'white',
                fontSize: 14,
                paddingVertical: 0,
                paddingRight: 8,
              }}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={handleSubmitReply}
            />
            {replyText.trim().length ? (
              <Pressable
                onPress={handleSubmitReply}
                accessibilityRole="button"
                accessibilityLabel="Enviar respuesta"
                hitSlop={8}
                style={({ pressed }) => ({
                  marginLeft: 6,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: '#38bdf8', fontWeight: '800', fontSize: 14 }}>Enviar</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function CharacterVideoDumbscrollModal({
  visible,
  videos,
  initialFeedId,
  onClose,
  onOpenProfile,
  onReply,
  overlay,
}: {
  visible: boolean;
  videos: CharacterVideoFeedItem[];
  initialFeedId?: string;
  onClose: () => void;
  onOpenProfile: (item: CharacterVideoFeedItem) => void;
  onReply: (item: CharacterVideoFeedItem, draft: string) => void;
  overlay?: React.ReactNode;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<CharacterVideoFeedItem> | null>(null);
  const initialIndex = Math.max(
    0,
    videos.findIndex((item) => item.feedId === initialFeedId)
  );
  const [focusedFeedId, setFocusedFeedId] = useState(initialFeedId || videos[0]?.feedId);
  const focusedFeedIdRef = useRef(initialFeedId || videos[0]?.feedId);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 70 });
  const handleViewableItemsChangedRef = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<CharacterVideoFeedItem>[] }) => {
      const nextFocusedItem = viewableItems.find((entry) => entry.isViewable)?.item;
      if (!nextFocusedItem) {
        return;
      }

      const previousFeedId = focusedFeedIdRef.current;
      if (previousFeedId === nextFocusedItem.feedId) {
        return;
      }

      focusedFeedIdRef.current = nextFocusedItem.feedId;
      setFocusedFeedId(nextFocusedItem.feedId);

      if (previousFeedId) {
        void trackMixpanelFeedReelScroll({
          ...getFeedTrackingProperties(nextFocusedItem),
          previous_feed_item_id: previousFeedId,
        });
      }
    }
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    const nextFocusedFeedId = initialFeedId || videos[initialIndex]?.feedId;
    focusedFeedIdRef.current = nextFocusedFeedId;
    setFocusedFeedId(nextFocusedFeedId);
  }, [initialFeedId, initialIndex, videos, visible]);

  if (!videos.length) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <FlatList<CharacterVideoFeedItem>
          key={`${visible ? 'open' : 'closed'}:${initialFeedId || 'first'}`}
          ref={listRef}
          data={videos}
          keyExtractor={(item) => item.feedId}
          renderItem={({ item }) => (
            <CharacterVideoPage
              item={item}
              height={height}
              bottomInset={insets.bottom}
              playbackEnabled={visible && focusedFeedId === item.feedId}
              onOpenProfile={onOpenProfile}
              onReply={onReply}
            />
          )}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={height}
          showsVerticalScrollIndicator={false}
          viewabilityConfig={viewabilityConfigRef.current}
          onViewableItemsChanged={handleViewableItemsChangedRef.current}
          windowSize={5}
          maxToRenderPerBatch={3}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 60);
          }}
        />
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar videos"
          hitSlop={12}
          style={({ pressed }) => ({
            position: 'absolute',
            top: insets.top + 10,
            right: 14,
            width: 42,
            height: 42,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: pressed ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.72)',
            borderWidth: 1,
            borderColor: 'rgba(226, 232, 240, 0.24)',
          })}
        >
          <MaterialIcons name="close" size={24} color="white" />
        </Pressable>
        {overlay}
      </View>
    </Modal>
  );
}

function VocabularyCard({
  item,
  onListen,
  onMarkLearned,
  onPractice,
  onGuessCorrect,
}: {
  item: PendingVocab;
  onListen: (item: PendingVocab) => void;
  onMarkLearned: (item: PendingVocab) => void;
  onPractice: (item: PendingVocab) => void;
  onGuessCorrect: (item: PendingVocab) => void;
}) {
  const example = item.examples?.[0] || item.prompt || 'Úsala en una oración natural.';
  const [selectedOption, setSelectedOption] = useState<LearningItemOptionKey | null>(null);

  const handleOptionPress = useCallback((key: LearningItemOptionKey) => {
    if (selectedOption !== null) return;
    setSelectedOption(key);
    if (key === item.answer) {
      onGuessCorrect(item);
    }
  }, [selectedOption, item, onGuessCorrect]);

  const optionKeys: LearningItemOptionKey[] = ['a', 'b', 'c'];

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

      <View style={{ marginTop: 14 }}>
        <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 }}>
          ¿Qué significa?
        </Text>
        {optionKeys.map((key) => {
          const isCorrect = key === item.answer;
          const isSelected = key === selectedOption;
          const answered = selectedOption !== null;

          let bgColor = '#0b172b';
          let borderColor = COLORS.border;
          let textColor = COLORS.text;

          if (answered) {
            if (isCorrect) {
              bgColor = '#052e16';
              borderColor = '#22c55e';
              textColor = '#86efac';
            } else if (isSelected) {
              bgColor = '#2d0a0a';
              borderColor = '#ef4444';
              textColor = '#fca5a5';
            }
          }

          return (
            <Pressable
              key={key}
              onPress={() => handleOptionPress(key)}
              disabled={answered}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor,
                backgroundColor: !answered && pressed ? '#1e293b' : bgColor,
                marginBottom: 6,
              })}
            >
              <Text style={{ color: answered && isCorrect ? '#22c55e' : COLORS.muted, fontWeight: '800', marginRight: 8, minWidth: 16 }}>
                {key.toUpperCase()}.
              </Text>
              <Text style={{ color: textColor, flex: 1, lineHeight: 19, fontSize: 13 }}>
                {(item.options as Record<LearningItemOptionKey, string>)[key]}
              </Text>
              {answered && isSelected && (
                <MaterialIcons
                  name={isCorrect ? 'check-circle' : 'cancel'}
                  size={18}
                  color={isCorrect ? '#22c55e' : '#ef4444'}
                  style={{ marginLeft: 6 }}
                />
              )}
              {answered && !isSelected && isCorrect && (
                <MaterialIcons name="check-circle" size={18} color="#22c55e" style={{ marginLeft: 6 }} />
              )}
            </Pressable>
          );
        })}
        {selectedOption !== null && (
          <Text style={{
            color: selectedOption === item.answer ? '#22c55e' : COLORS.muted,
            fontSize: 12,
            marginTop: 4,
            fontWeight: '700',
          }}>
            {selectedOption === item.answer ? '+0.5 pts en Mi Viaje ✓' : `Correcto: opción ${item.answer.toUpperCase()}`}
          </Text>
        )}
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

    </View>
  );
}

function ShadowingFeedCard({
  item,
  onPlay,
  onViewAll,
}: {
  item: PendingShadowing;
  onPlay: (item: PendingShadowing) => void;
  onViewAll: () => void;
}) {
  const totalChapters = item.chapters.length;
  const progressRatio = totalChapters > 0 ? Math.min(1, item.listenedCount / totalChapters) : 0;
  const duration = formatFeedDuration(item.nextChapter.durationSeconds);

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
      <Pressable
        onPress={() => onPlay(item)}
        accessibilityRole="button"
        accessibilityLabel={`Reproducir shadowing ${item.name}`}
        style={({ pressed }) => ({ width: '100%', aspectRatio: 16 / 9, backgroundColor: COLORS.surfaceAlt, opacity: pressed ? 0.88 : 1 })}
      >
        {item.coverImageUrl ? (
          <Image source={{ uri: item.coverImageUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="headphones" size={48} color={COLORS.accent} />
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            left: 14,
            bottom: 14,
            right: 14,
            padding: 12,
            borderRadius: 16,
            backgroundColor: 'rgba(2, 6, 23, 0.82)',
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.24)',
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>
            Shadowing
          </Text>
          <Text style={{ color: 'white', fontSize: 21, fontWeight: '900', marginTop: 4 }} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </Pressable>

      <View style={{ padding: 16 }}>
        <Text style={{ color: COLORS.muted, fontWeight: '800' }} numberOfLines={1}>
          {item.category}
        </Text>
        <Text style={{ color: COLORS.text, marginTop: 8, fontSize: 17, fontWeight: '900' }} numberOfLines={2}>
          {item.nextChapter.title}
        </Text>
        <Text style={{ color: COLORS.muted, marginTop: 4, lineHeight: 20 }} numberOfLines={2}>
          {item.nextChapter.description || 'Escucha y repite el capitulo en voz alta.'}
        </Text>

        <View style={{ marginTop: 14 }}>
          <View
            style={{
              height: 7,
              borderRadius: 999,
              overflow: 'hidden',
              backgroundColor: 'rgba(148, 163, 184, 0.18)',
            }}
          >
            <View style={{ width: `${progressRatio * 100}%`, height: '100%', backgroundColor: COLORS.accent }} />
          </View>
          <Text style={{ color: COLORS.muted, marginTop: 7, fontSize: 12, fontWeight: '800' }}>
            {item.listenedCount}/{totalChapters} capitulos{duration ? ` - ${duration}` : ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
          <Pressable
            onPress={() => onPlay(item)}
            accessibilityRole="button"
            accessibilityLabel={`Reproducir shadowing ${item.nextChapter.title}`}
            style={({ pressed }) => ({
              flex: 2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 13,
              borderRadius: 12,
              backgroundColor: pressed ? '#1d4ed8' : COLORS.accentStrong,
            })}
          >
            <MaterialIcons name="play-arrow" size={21} color="white" />
            <Text style={{ color: 'white', fontWeight: '900', marginLeft: 6 }}>Play capitulo</Text>
          </Pressable>
          <Pressable
            onPress={onViewAll}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: pressed ? '#1e293b' : '#0f172a',
              borderWidth: 1,
              borderColor: COLORS.border,
            })}
          >
            <Text style={{ color: COLORS.muted, fontWeight: '800' }}>Ver más</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function LessonFeedCard({
  item,
  onPlay,
  onViewAll,
}: {
  item: PendingLesson;
  onPlay: (item: PendingLesson) => void;
  onViewAll: () => void;
}) {
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
      <Pressable
        onPress={() => onPlay(item)}
        accessibilityRole="button"
        accessibilityLabel={`Abrir leccion ${item.title}`}
        style={({ pressed }) => ({ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#07111f', opacity: pressed ? 0.88 : 1 })}
      >
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="play-circle-outline" size={54} color={COLORS.accent} />
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            left: 14,
            bottom: 14,
            right: 14,
            padding: 12,
            borderRadius: 16,
            backgroundColor: 'rgba(2, 6, 23, 0.82)',
            borderWidth: 1,
            borderColor: 'rgba(148, 163, 184, 0.24)',
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' }}>
            Leccion
          </Text>
          <Text style={{ color: 'white', fontSize: 21, fontWeight: '900', marginTop: 4 }} numberOfLines={2}>
            {item.title}
          </Text>
        </View>
      </Pressable>

      <View style={{ padding: 16 }}>
        {item.prompt ? (
          <Text style={{ color: COLORS.muted, lineHeight: 20 }} numberOfLines={2}>
            {item.prompt}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', marginTop: item.prompt ? 14 : 0, gap: 8 }}>
          <Pressable
            onPress={() => onPlay(item)}
            accessibilityRole="button"
            accessibilityLabel={`Abrir leccion ${item.title}`}
            style={({ pressed }) => ({
              flex: 2,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 13,
              borderRadius: 12,
              backgroundColor: pressed ? '#1d4ed8' : COLORS.accentStrong,
            })}
          >
            <MaterialIcons name="play-arrow" size={21} color="white" />
            <Text style={{ color: 'white', fontWeight: '900', marginLeft: 6 }}>Ver leccion</Text>
          </Pressable>
          <Pressable
            onPress={onViewAll}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 13,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: pressed ? '#1e293b' : '#0f172a',
              borderWidth: 1,
              borderColor: COLORS.border,
            })}
          >
            <Text style={{ color: COLORS.muted, fontWeight: '800' }}>Ver más</Text>
          </Pressable>
        </View>
      </View>
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
  const [isVideoReadyForDisplay, setIsVideoReadyForDisplay] = useState(false);
  const hasMedia = !!imageUrl || !!videoUrl;
  const canClaimExtra = item.postType === 'extra' && !!item.coinAmount && !item.claimed;
  const videoSource = useMemo(() => {
    return videoUrl ? { uri: videoUrl } : undefined;
  }, [videoUrl]);

  useEffect(() => {
    setIsVideoReadyForDisplay(false);
  }, [videoUrl]);

  useEffect(() => {
    if (playbackEnabled || !videoUrl) {
      return;
    }

    setIsVideoReadyForDisplay(false);
    void videoRef.current?.unloadAsync().catch((unloadErr) => {
      console.warn('[Feed] No se pudo descargar el video del post al salir de la pantalla', unloadErr);
    });
  }, [playbackEnabled, videoUrl]);

  useEffect(() => {
    return () => {
      void videoRef.current?.unloadAsync().catch(() => {
        // Best effort cleanup on unmount.
      });
    };
  }, []);

  const shouldMountVideo = playbackEnabled && !!videoSource;

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
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
              resizeMode="cover"
            />
          ) : null}
          {shouldMountVideo ? (
            <Video
              key={videoUrl}
              ref={videoRef}
              source={videoSource}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                opacity: isVideoReadyForDisplay ? 1 : 0,
              }}
              resizeMode={ResizeMode.COVER}
              useNativeControls
              shouldPlay={false}
              progressUpdateIntervalMillis={1000}
              pointerEvents={isVideoReadyForDisplay ? 'auto' : 'none'}
              onLoadStart={() => setIsVideoReadyForDisplay(false)}
              onLoad={() => setIsVideoReadyForDisplay(true)}
              onReadyForDisplay={() => setIsVideoReadyForDisplay(true)}
              onError={(videoError) => {
                setIsVideoReadyForDisplay(false);
                console.warn('[Feed] No se pudo cargar el video del post', videoError);
              }}
            />
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

function PromoTimerCard({
  remainingSeconds,
  onPress,
}: {
  remainingSeconds: number;
  onPress: () => void;
}) {
  const timer = getPromoTimerParts(remainingSeconds);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Abrir oferta de bienvenida"
      style={({ pressed }) => ({
        marginTop: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#c026d3',
        backgroundColor: pressed ? 'rgba(33, 12, 61, 0.96)' : 'rgba(7, 11, 31, 0.98)',
        padding: 16,
        opacity: pressed ? 0.92 : 1,
        shadowColor: '#fb3d8b',
        shadowOpacity: 0.38,
        shadowRadius: 15,
        overflow: 'hidden',
      })}
    >
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 26,
          right: 26,
          height: 2,
          backgroundColor: '#ff4fb3',
          shadowColor: '#ff4fb3',
          shadowOpacity: 1,
          shadowRadius: 10,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -1,
          right: -20,
          width: 78,
          height: 28,
          backgroundColor: '#ff3f8f',
          transform: [{ rotate: '40deg' }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}>-50%</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, paddingRight: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="local-offer" size={14} color="#f9a8d4" />
            <Text style={{ color: '#f9a8d4', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 }}>
              OFERTA ACTIVA
            </Text>
          </View>
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '900', lineHeight: 22, marginTop: 7 }}>
            {'50% de descuento\npor tiempo limitado'}
          </Text>
          <Text style={{ color: '#a6b0c5', fontSize: 11, lineHeight: 16, marginTop: 9 }}>
            {'Tu promoción de bienvenida\nsigue disponible.'}
          </Text>
        </View>

        <View style={{ width: 1, height: 66, backgroundColor: 'rgba(148, 163, 184, 0.18)' }} />

        <View style={{ width: 126, alignItems: 'center', paddingLeft: 14 }}>
          <Text style={{ color: '#94a3b8', fontSize: 8, fontWeight: '900', letterSpacing: 0.6 }}>
            TERMINA EN
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TimerText value={timer.hours} />
            <Text style={{ color: '#fb4f92', fontSize: 18, fontWeight: '900' }}>:</Text>
            <TimerText value={timer.minutes} />
            <Text style={{ color: '#fb4f92', fontSize: 18, fontWeight: '900' }}>:</Text>
            <TimerText value={timer.seconds} />
          </View>
          <Text style={{ color: '#94a3b8', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: -1 }}>
            HRS MIN SEG
          </Text>
          <View
            style={{
              minWidth: 108,
              minHeight: 32,
              borderRadius: 999,
              backgroundColor: '#ff3f8f',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              marginTop: 8,
              gap: 4,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>Ver oferta</Text>
            <MaterialIcons name="arrow-forward" size={15} color="#ffffff" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function FriendStoryAvatar({
  friend,
  onPress,
}: {
  friend: FriendCharacter;
  onPress: (friend: FriendCharacter) => void;
}) {
  const avatarSource = useMemo<ImageSourcePropType | undefined>(() => {
    const avatarUrl = (friend.avatarImageXsUrl || friend.avatarImageUrl)?.trim();
    return avatarUrl
      ? { uri: avatarUrl }
      : getChatAvatar(friend.friendId);
  }, [friend.avatarImageUrl, friend.avatarImageXsUrl, friend.friendId]);
  const initial = (friend.characterName.trim().charAt(0) || '?').toUpperCase();

  return (
    <Pressable
      onPress={() => onPress(friend)}
      accessibilityRole="button"
      accessibilityLabel={`Ver perfil de ${friend.characterName}`}
      style={({ pressed }) => ({
        width: 74,
        alignItems: 'center',
        opacity: pressed ? 0.78 : 1,
      })}
    >
      <View
        style={{
          width: 66,
          height: 66,
          borderRadius: 999,
          padding: 3,
          backgroundColor: '#22d3ee',
          borderWidth: 1,
          borderColor: 'rgba(165, 243, 252, 0.7)',
        }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: '#0b172b',
            borderWidth: 3,
            borderColor: COLORS.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatarSource ? (
            <Image source={avatarSource} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '900' }}>{initial}</Text>
          )}
        </View>
      </View>
      <Text
        style={{
          color: COLORS.text,
          fontSize: 12,
          fontWeight: '800',
          marginTop: 7,
          textAlign: 'center',
          width: '100%',
        }}
        numberOfLines={1}
      >
        {friend.characterName}
      </Text>
    </Pressable>
  );
}

function FriendStoriesStrip({
  friends,
  loading,
  error,
  onOpenFriend,
  onAddMore,
}: {
  friends: FriendCharacter[];
  loading: boolean;
  error?: string;
  onOpenFriend: (friend: FriendCharacter) => void;
  onAddMore: () => void;
}) {
  if (error || (!loading && friends.length === 0)) {
    return null;
  }

  const visibleFriends = friends.slice(0, 12);

  return (
    <View style={{ marginTop: 14 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 4, gap: 12 }}
      >
        {loading && visibleFriends.length === 0
          ? [0, 1, 2, 3].map((item) => (
              <View key={item} style={{ width: 74, alignItems: 'center' }}>
                <View
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: 999,
                    backgroundColor: '#111827',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                  }}
                />
                <View
                  style={{
                    width: 48,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: '#111827',
                    marginTop: 8,
                  }}
                />
              </View>
            ))
          : visibleFriends.map((friend) => (
              <FriendStoryAvatar key={friend.friendId} friend={friend} onPress={onOpenFriend} />
            ))}
        {!loading ? (
          <Pressable
            onPress={onAddMore}
            accessibilityRole="button"
            accessibilityLabel="Explorar personajes"
            style={({ pressed }) => ({
              width: 74,
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 66,
                height: 66,
                borderRadius: 999,
                backgroundColor: '#111827',
                borderWidth: 1,
                borderColor: COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="add" size={28} color={COLORS.accent} />
            </View>
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 12,
                fontWeight: '800',
                marginTop: 7,
                textAlign: 'center',
                width: '100%',
              }}
              numberOfLines={1}
            >
              Amigos
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function FeedSkeletonBlock({
  width = '100%',
  height,
  radius = 999,
}: {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
}) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: 'rgba(31, 41, 55, 0.72)',
      }}
    />
  );
}

function FeedInitialLoadingState() {
  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <View style={{ aspectRatio: 0.9, backgroundColor: COLORS.surfaceAlt, padding: 16, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <FeedSkeletonBlock width={82} height={26} radius={999} />
            <FeedSkeletonBlock width={42} height={42} radius={999} />
          </View>
          <View>
            <FeedSkeletonBlock width="46%" height={12} />
            <View style={{ height: 8 }} />
            <FeedSkeletonBlock width="78%" height={24} radius={8} />
            <View style={{ height: 7 }} />
            <FeedSkeletonBlock width="58%" height={24} radius={8} />
          </View>
        </View>
        <View style={{ padding: 16 }}>
          <FeedSkeletonBlock height={14} radius={8} />
          <View style={{ height: 8 }} />
          <FeedSkeletonBlock width="84%" height={14} radius={8} />
          <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
            <FeedSkeletonBlock width="66%" height={46} radius={12} />
            <FeedSkeletonBlock width="31%" height={46} radius={12} />
          </View>
        </View>
      </View>

      <View
        style={{
          padding: 16,
          borderRadius: 18,
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <FeedSkeletonBlock width={96} height={12} radius={8} />
            <View style={{ height: 10 }} />
            <FeedSkeletonBlock width="62%" height={32} radius={10} />
          </View>
          <FeedSkeletonBlock width={44} height={44} radius={999} />
        </View>
        <View style={{ marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: '#0b172b' }}>
          <FeedSkeletonBlock width={86} height={12} radius={8} />
          <View style={{ height: 10 }} />
          <FeedSkeletonBlock height={14} radius={8} />
          <View style={{ height: 8 }} />
          <FeedSkeletonBlock width="72%" height={14} radius={8} />
        </View>
        <View style={{ marginTop: 14, gap: 6 }}>
          <FeedSkeletonBlock height={40} radius={10} />
          <FeedSkeletonBlock height={40} radius={10} />
          <FeedSkeletonBlock height={40} radius={10} />
        </View>
      </View>

      <View
        style={{
          borderRadius: 18,
          overflow: 'hidden',
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <View style={{ aspectRatio: 16 / 9, backgroundColor: COLORS.surfaceAlt }} />
        <View style={{ padding: 16 }}>
          <FeedSkeletonBlock width={104} height={13} radius={8} />
          <View style={{ height: 10 }} />
          <FeedSkeletonBlock width="72%" height={20} radius={8} />
          <View style={{ height: 8 }} />
          <FeedSkeletonBlock height={14} radius={8} />
          <View style={{ height: 14 }} />
          <FeedSkeletonBlock height={7} />
          <View style={{ flexDirection: 'row', marginTop: 14, gap: 8 }}>
            <FeedSkeletonBlock width="66%" height={46} radius={12} />
            <FeedSkeletonBlock width="31%" height={46} radius={12} />
          </View>
        </View>
      </View>
    </View>
  );
}

function TimerText({ value }: { value: string }) {
  return (
    <Text style={{ color: '#fb4f92', fontSize: 21, fontWeight: '900', minWidth: 27, textAlign: 'center' }}>
      {value}
    </Text>
  );
}

function ReelsStartupOverlay() {
  return (
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
        backgroundColor: COLORS.background,
        paddingHorizontal: 28,
      }}
    >
      <View
        style={{
          width: 76,
          height: 76,
          borderRadius: 38,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(124, 58, 237, 0.16)',
          borderWidth: 1,
          borderColor: 'rgba(168, 85, 247, 0.34)',
        }}
      >
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
      <Text
        style={{
          color: COLORS.text,
          fontSize: 20,
          fontWeight: '900',
          marginTop: 18,
          textAlign: 'center',
        }}
      >
        Preparando reels...
      </Text>
      <Text
        style={{
          color: COLORS.muted,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 8,
          textAlign: 'center',
        }}
      >
        Cargando la primera conversación.
      </Text>
    </View>
  );
}

const SWIPE_UP_TOUR_STORAGE_KEY = '@luva/feedSwipeUpTourSeen';

type FeedTourStep = 'swipeUp' | 'sendMessage';

function FeedTourOverlay({
  step,
  onDismiss,
}: {
  step: FeedTourStep;
  onDismiss: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isSwipeUp = step === 'swipeUp';
  const toValue = isSwipeUp ? -90 : 40;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(180),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, translateY, toValue]);

  return (
    <Pressable
      onPress={onDismiss}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
        zIndex: 1000,
      }}
    >
      <Animated.View
        style={{
          opacity,
          flex: 1,
          alignItems: 'center',
          justifyContent: isSwipeUp ? 'center' : 'flex-end',
          paddingHorizontal: 32,
          paddingBottom: isSwipeUp ? 0 : 160,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontSize: 20,
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: isSwipeUp ? 40 : 24,
            lineHeight: 28,
          }}
        >
          {isSwipeUp
            ? 'Desliza hacia arriba para encontrar tu compañero de práctica'
            : 'Envía un mensaje para seguir practicando'}
        </Text>
        <Animated.Image
          source={
            isSwipeUp
              ? require('../image/swipe-up-hand.png')
              : require('../image/swipe-down-hand.png')
          }
          style={{
            width: isSwipeUp ? 140 : 120,
            height: isSwipeUp ? 200 : 170,
            resizeMode: 'contain',
            transform: [{ translateY }],
          }}
        />
        <Text
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            fontWeight: '600',
            marginTop: isSwipeUp ? 32 : 20,
          }}
        >
          Toca para continuar
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function FeedScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const isFeedFocused = useIsFocused();
  const { items: learningItems } = useLearningItems();
  const stories = useMemo<StoryCatalogItem[]>(() => [], []);
  const storiesLoading = false;
  const storiesError = undefined;
  const { lessons, loading: lessonsLoading, error: lessonsError, reload: reloadLessons } = useLessons();
  const {
    lists: shadowingLists,
    loading: shadowingLoading,
    error: shadowingError,
    reload: reloadShadowing,
  } = useShadowing();
  const {
    listenedChapterIds,
    setQueue: setShadowingQueue,
    selectChapter: selectShadowingChapter,
  } = useShadowingPlayer();
  const [feedTourStep, setFeedTourStep] = useState<FeedTourStep | null>(null);
  const [feedTourPending, setFeedTourPending] = useState(false);
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SWIPE_UP_TOUR_STORAGE_KEY)
      .then((value) => {
        if (!cancelled && value !== '1') {
          setFeedTourPending(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const {
    posts: configuredPosts,
    loading: feedPostsLoading,
    error: feedPostsError,
    reload: reloadFeedPosts,
  } = useFeedPosts();
  const {
    posts: characterVideoPosts,
    loading: characterVideosLoading,
    error: characterVideosError,
    reload: reloadCharacterVideos,
  } = useCharacterVideoPosts();
  const {
    friends,
    loading: friendsLoading,
    error: friendsError,
    reload: reloadFriends,
  } = useFriends();
  const {
    loading: cardProgressLoading,
    statusFor,
    statuses,
    setStatus,
  } = useCardProgress();
  const activeMission = undefined as StoryActiveMission | undefined;
  const storyProgressLoading = false;
  const storyProgress = useMemo(() => ({}), []);
  const isMissionCompleted = useCallback((_storyId?: string, _missionId?: string) => false, []);
  const { addCoins, canSpend, loading: coinsLoading, isUnlimited } = useCoins();
  const [feedSeed, setFeedSeed] = useState(() => `${Date.now()}:${Math.random()}`);
  const [visibleCharacterVideoCount, setVisibleCharacterVideoCount] = useState(CHARACTER_VIDEO_BATCH_SIZE);
  const [visibleVocabularyCount, setVisibleVocabularyCount] = useState(VOCABULARY_BATCH_SIZE);
  const [visibleShadowingCount, setVisibleShadowingCount] = useState(SHADOWING_BATCH_SIZE);
  const [visibleLessonsCount, setVisibleLessonsCount] = useState(LESSON_BATCH_SIZE);
  const [learnedLessonIds, setLearnedLessonIds] = useState<Set<string>>(() => new Set());
  const [learnedLessonIdsLoading, setLearnedLessonIdsLoading] = useState(true);
  const [claimedExtraPostIds, setClaimedExtraPostIds] = useState<Set<string>>(() => new Set());
  const [claimingPostId, setClaimingPostId] = useState<string>();
  const [isInterstitialLoading, setIsInterstitialLoading] = useState(false);
  const [postActionMessage, setPostActionMessage] = useState<string>();
  const [suspendFeedVideoPlayback, setSuspendFeedVideoPlayback] = useState(false);
  const [activeFeedMediaId, setActiveFeedMediaId] = useState<string>();
  const [litePromoExpiresAt, setLitePromoExpiresAt] = useState<number | null>(null);
  const [litePromoLoading, setLitePromoLoading] = useState(true);
  const [timerNow, setTimerNow] = useState(Date.now());
  const [initialFeedResolved, setInitialFeedResolved] = useState(false);
  const [stableFeedItems, setStableFeedItems] = useState<FeedItem[]>([]);
  const [characterVideoViewerVisible, setCharacterVideoViewerVisible] = useState(false);
  useEffect(() => {
    if (characterVideoViewerVisible && feedTourPending && feedTourStep === null) {
      setFeedTourStep('swipeUp');
      setFeedTourPending(false);
    }
  }, [characterVideoViewerVisible, feedTourPending, feedTourStep]);
  const [selectedCharacterVideoFeedId, setSelectedCharacterVideoFeedId] = useState<string>();
  const [openingReelsFromOnboarding, setOpeningReelsFromOnboarding] = useState(route.params?.openReels === true);
  const isOpeningMissionRef = useRef(false);
  const autoOpenedReelsRef = useRef(false);
  const openingReelsRef = useRef(false);
  const hasFocusedFeedOnceRef = useRef(false);
  const viewedFeedItemIdsRef = useRef(new Set<string>());
  const viewabilityConfigRef = useRef({
    itemVisiblePercentThreshold: 65,
    minimumViewTime: 120,
  });
  const handleViewableItemsChangedRef = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<FeedItem>[] }) => {
      viewableItems
        .filter((entry) => entry.isViewable)
        .forEach((entry) => {
          const item = entry.item;
          const feedItemId = item.kind === 'mission' ? item.id : item.feedId;
          if (viewedFeedItemIdsRef.current.has(feedItemId)) return;
          viewedFeedItemIdsRef.current.add(feedItemId);
          void trackMixpanelFeedItemViewed(getFeedTrackingProperties(item));
        });

      const nextMediaId = viewableItems
        .filter((entry) => entry.isViewable)
        .map((entry) => getFeedMediaId(entry.item))
        .find((mediaId): mediaId is string => !!mediaId);
      setActiveFeedMediaId((current) => (current === nextMediaId ? current : nextMediaId));
    }
  );

  const videoPlaybackEnabled = isFeedFocused && !suspendFeedVideoPlayback;
  const litePromoRemainingSeconds = litePromoExpiresAt
    ? Math.max(0, Math.ceil((litePromoExpiresAt - timerNow) / 1000))
    : 0;
  const showLitePromoTimer = Boolean(litePromoExpiresAt && litePromoRemainingSeconds > 0);

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
      let active = true;
      const isInitialFocus = !hasFocusedFeedOnceRef.current;
      hasFocusedFeedOnceRef.current = true;
      setFeedSeed(`${Date.now()}:${Math.random()}`);
      setVisibleCharacterVideoCount(CHARACTER_VIDEO_BATCH_SIZE);
      setVisibleVocabularyCount(VOCABULARY_BATCH_SIZE);
      setVisibleShadowingCount(SHADOWING_BATCH_SIZE);
      setVisibleLessonsCount(LESSON_BATCH_SIZE);
      setLearnedLessonIdsLoading(true);
      if (!isInitialFocus) {
        reloadFeedPosts();
        reloadCharacterVideos();
        reloadLessons();
        reloadShadowing();
        void reloadFriends();
      }
      void getLearnedLessonIds()
        .then((ids) => {
          if (active) {
            setLearnedLessonIds(ids);
          }
        })
        .catch((err) => {
          console.warn('[Feed] No se pudieron cargar las lecciones aprendidas', err);
        })
        .finally(() => {
          if (active) {
            setLearnedLessonIdsLoading(false);
          }
        });
      return () => {
        active = false;
      };
    }, [reloadCharacterVideos, reloadFeedPosts, reloadFriends, reloadLessons, reloadShadowing])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLitePromoLoading(true);

      const loadLitePromo = async () => {
        try {
          const raw = await AsyncStorage.getItem(LITE_PROMO_EXPIRES_AT_KEY);
          const expiresAt = raw ? Number(raw) : Number.NaN;
          const now = Date.now();

          if (!Number.isFinite(expiresAt) || expiresAt <= now) {
            if (raw) {
              await AsyncStorage.removeItem(LITE_PROMO_EXPIRES_AT_KEY);
            }
            if (active) {
              setLitePromoExpiresAt(null);
              setTimerNow(now);
            }
            return;
          }

          if (active) {
            setLitePromoExpiresAt(expiresAt);
            setTimerNow(now);
          }
        } catch (err) {
          console.warn('[Feed] No se pudo cargar el temporizador de la promo', err);
        } finally {
          if (active) {
            setLitePromoLoading(false);
          }
        }
      };

      void loadLitePromo();
      return () => {
        active = false;
      };
    }, [])
  );

  useEffect(() => {
    if (!litePromoExpiresAt) {
      return;
    }

    const updateNow = () => setTimerNow(Date.now());
    updateNow();
    const interval = setInterval(updateNow, 1000);
    return () => clearInterval(interval);
  }, [litePromoExpiresAt]);

  useEffect(() => {
    if (!litePromoExpiresAt || litePromoRemainingSeconds > 0) {
      return;
    }

    setLitePromoExpiresAt(null);
    void AsyncStorage.removeItem(LITE_PROMO_EXPIRES_AT_KEY).catch((err) => {
      console.warn('[Feed] No se pudo limpiar el temporizador de la promo', err);
    });
  }, [litePromoExpiresAt, litePromoRemainingSeconds]);

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
        avatarImageXsUrl: activeMission.avatarImageXsUrl,
        avatarImageMdUrl: activeMission.avatarImageMdUrl,
        videoPreviewUrl: activeMission.videoPreviewUrl,
        videoThumbnailUrl: activeMission.videoThumbnailUrl,
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
          isInitialStory: story.isInitial,
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

  const pendingShadowing = useMemo<PendingShadowing[]>(() => {
    return shadowingLists
      .map((list) => {
        const nextChapter =
          list.chapters.find((chapter) => !listenedChapterIds.has(chapter.chapterId)) || list.chapters[0];
        if (!nextChapter) {
          return undefined;
        }
        return {
          ...list,
          kind: 'shadowing' as const,
          feedId: `shadowing:${list.listId}`,
          nextChapter,
          listenedCount: list.chapters.filter((chapter) => listenedChapterIds.has(chapter.chapterId)).length,
        };
      })
      .filter((item): item is PendingShadowing => !!item);
  }, [listenedChapterIds, shadowingLists]);

  const pendingLessons = useMemo<PendingLesson[]>(() => {
    return lessons
      .filter((lesson) => !learnedLessonIds.has(lesson.lessonId))
      .map((lesson) => ({
        ...lesson,
        kind: 'lesson' as const,
        feedId: `lesson:${lesson.lessonId}`,
      }));
  }, [learnedLessonIds, lessons]);

  const feedPostItems = useMemo<FeedPostItem[]>(() => {
    return configuredPosts.map((post) => ({
      ...post,
      kind: 'post' as const,
      feedId: `post:${post.postId}`,
      claimed: post.postType === 'extra' ? claimedExtraPostIds.has(post.postId) : undefined,
    }));
  }, [claimedExtraPostIds, configuredPosts]);

  const characterVideoItems = useMemo<CharacterVideoFeedItem[]>(() => {
    return characterVideoPosts.map((post) => ({
      ...post,
      kind: 'characterVideo' as const,
      feedId: `character-video:${post.characterId}:${post.postId}`,
    }));
  }, [characterVideoPosts]);

  const shuffledCharacterVideos = useMemo(
    () =>
      pickRandom(
        characterVideoItems,
        characterVideoItems.length,
        `${feedSeed}:character-videos`,
        (item) => item.feedId
      ),
    [characterVideoItems, feedSeed]
  );

  useEffect(() => {
    if (route.params?.openReels === true && !characterVideoViewerVisible) {
      setOpeningReelsFromOnboarding(true);
    }
  }, [characterVideoViewerVisible, route.params?.openReels]);

  useEffect(() => {
    if (
      route.params?.openReels !== true ||
      autoOpenedReelsRef.current ||
      openingReelsRef.current ||
      characterVideosLoading
    ) {
      return;
    }

    const firstVideo = shuffledCharacterVideos[0];
    if (!firstVideo) {
      autoOpenedReelsRef.current = true;
      navigation.setParams({ openReels: undefined });
      setOpeningReelsFromOnboarding(false);
      return;
    }

    openingReelsRef.current = true;
    setOpeningReelsFromOnboarding(true);
    setSuspendFeedVideoPlayback(true);

    let cancelled = false;
    void preloadOnboardingReelPreviewAssets(
      shuffledCharacterVideos.slice(0, ONBOARDING_REELS_PRELOAD_COUNT)
    ).finally(() => {
      if (cancelled) {
        openingReelsRef.current = false;
        return;
      }
      autoOpenedReelsRef.current = true;
      openingReelsRef.current = false;
      navigation.setParams({ openReels: undefined });
      setSelectedCharacterVideoFeedId(firstVideo.feedId);
      setCharacterVideoViewerVisible(true);
      setOpeningReelsFromOnboarding(false);
    });

    return () => {
      cancelled = true;
    };
  }, [characterVideosLoading, navigation, route.params?.openReels, shuffledCharacterVideos]);

  const shuffledVocabulary = useMemo(
    () => pickRandom(pendingVocabulary, pendingVocabulary.length, `${feedSeed}:vocab`, (item) => item.feedId),
    [feedSeed, pendingVocabulary]
  );

  const shuffledShadowing = useMemo(
    () => pickRandom(pendingShadowing, pendingShadowing.length, `${feedSeed}:shadowing`, (item) => item.feedId),
    [feedSeed, pendingShadowing]
  );

  const shuffledLessons = useMemo(
    () => pickRandom(pendingLessons, pendingLessons.length, `${feedSeed}:lessons`, (item) => item.feedId),
    [feedSeed, pendingLessons]
  );

  const visibleCharacterVideos = useMemo(
    () => shuffledCharacterVideos.slice(0, visibleCharacterVideoCount),
    [shuffledCharacterVideos, visibleCharacterVideoCount]
  );

  const visibleVocabulary = useMemo(
    () => shuffledVocabulary.slice(0, visibleVocabularyCount),
    [shuffledVocabulary, visibleVocabularyCount]
  );

  const visibleShadowing = useMemo(
    () => shuffledShadowing.slice(0, visibleShadowingCount),
    [shuffledShadowing, visibleShadowingCount]
  );

  const visibleLessons = useMemo(
    () => shuffledLessons.slice(0, visibleLessonsCount),
    [shuffledLessons, visibleLessonsCount]
  );

  const feedItems = useMemo(
    () => {
      const promo = showLitePromoTimer
        ? {
            kind: 'promo' as const,
            feedId: 'promo:lite',
            remainingSeconds: litePromoRemainingSeconds,
          }
        : undefined;
      const next = buildFeedItems({
        promo,
        characterVideos: visibleCharacterVideos,
        vocabulary: visibleVocabulary,
        shadowing: visibleShadowing,
        lessons: visibleLessons,
        posts: feedPostItems,
      });
      return resumeMission ? [resumeMission, ...next] : next;
    },
    [
      feedPostItems,
      litePromoRemainingSeconds,
      resumeMission,
      showLitePromoTimer,
      visibleCharacterVideos,
      visibleLessons,
      visibleShadowing,
      visibleVocabulary,
    ]
  );

  const imageUrlsToPrefetch = useMemo(() => {
    const upcomingCharacterVideos = shuffledCharacterVideos.slice(
      0,
      Math.min(shuffledCharacterVideos.length, visibleCharacterVideoCount + CHARACTER_VIDEO_BATCH_SIZE)
    );
    const characterVideoUrls = upcomingCharacterVideos.flatMap((item) => [
      item.thumbnailUrl,
      item.imageUrl,
      item.avatarImageUrl,
    ]);
    const resumeMissionUrls = resumeMission
      ? [
          resumeMission.mission.avatarImageXsUrl,
          resumeMission.mission.avatarImageMdUrl,
          resumeMission.mission.avatarImageUrl,
        ]
      : [];
    const postUrls = feedPostItems.map((item) => item.imageUrl);
    const shadowingUrls = shuffledShadowing
      .slice(0, Math.min(shuffledShadowing.length, visibleShadowingCount + SHADOWING_BATCH_SIZE))
      .map((item) => item.coverImageUrl);
    const lessonUrls = shuffledLessons
      .slice(0, Math.min(shuffledLessons.length, visibleLessonsCount + LESSON_BATCH_SIZE))
      .map((item) => item.thumbnailUrl);
    return [...resumeMissionUrls, ...characterVideoUrls, ...shadowingUrls, ...lessonUrls, ...postUrls];
  }, [
    feedPostItems,
    resumeMission,
    shuffledLessons,
    shuffledCharacterVideos,
    shuffledShadowing,
    visibleCharacterVideoCount,
    visibleLessonsCount,
    visibleShadowingCount,
  ]);

  useEffect(() => {
    prefetchImageUrls(imageUrlsToPrefetch, 16);
  }, [imageUrlsToPrefetch]);

  const loading =
    storiesLoading ||
    cardProgressLoading ||
    storyProgressLoading ||
    feedPostsLoading ||
    characterVideosLoading ||
    lessonsLoading ||
    shadowingLoading ||
    learnedLessonIdsLoading ||
    litePromoLoading;
  const showInitialFeedSkeleton = loading && !initialFeedResolved;

  useEffect(() => {
    if (loading) {
      return;
    }

    setStableFeedItems(feedItems);
    if (!initialFeedResolved) {
      setInitialFeedResolved(true);
    }
  }, [feedItems, initialFeedResolved, loading]);

  const renderedFeedItems = showInitialFeedSkeleton ? [] : loading ? stableFeedItems : feedItems;

  const hasMoreFeedItems =
    visibleCharacterVideoCount < shuffledCharacterVideos.length ||
    visibleVocabularyCount < shuffledVocabulary.length ||
    visibleShadowingCount < shuffledShadowing.length ||
    visibleLessonsCount < shuffledLessons.length;

  const loadMoreFeedItems = useCallback(() => {
    if (loading || !hasMoreFeedItems) return;

    const previousCharacterVideosCount = Math.min(
      visibleCharacterVideoCount,
      shuffledCharacterVideos.length
    );
    const previousVocabularyCount = Math.min(
      visibleVocabularyCount,
      shuffledVocabulary.length
    );
    const previousShadowingCount = Math.min(
      visibleShadowingCount,
      shuffledShadowing.length
    );
    const previousLessonsCount = Math.min(
      visibleLessonsCount,
      shuffledLessons.length
    );
    const nextCharacterVideosCount = Math.min(
      visibleCharacterVideoCount + CHARACTER_VIDEO_BATCH_SIZE,
      shuffledCharacterVideos.length
    );
    const nextVocabularyCount = Math.min(
      visibleVocabularyCount + VOCABULARY_BATCH_SIZE,
      shuffledVocabulary.length
    );
    const nextShadowingCount = Math.min(
      visibleShadowingCount + SHADOWING_BATCH_SIZE,
      shuffledShadowing.length
    );
    const nextLessonsCount = Math.min(
      visibleLessonsCount + LESSON_BATCH_SIZE,
      shuffledLessons.length
    );
    const characterVideosLoadedCount = Math.max(
      nextCharacterVideosCount - previousCharacterVideosCount,
      0
    );
    const vocabularyLoadedCount = Math.max(
      nextVocabularyCount - previousVocabularyCount,
      0
    );
    const shadowingLoadedCount = Math.max(
      nextShadowingCount - previousShadowingCount,
      0
    );
    const lessonsLoadedCount = Math.max(
      nextLessonsCount - previousLessonsCount,
      0
    );
    const itemsLoadedCount =
      characterVideosLoadedCount + vocabularyLoadedCount + shadowingLoadedCount + lessonsLoadedCount;

    if (itemsLoadedCount <= 0) {
      return;
    }

    setVisibleCharacterVideoCount(nextCharacterVideosCount);
    setVisibleVocabularyCount(nextVocabularyCount);
    setVisibleShadowingCount(nextShadowingCount);
    setVisibleLessonsCount(nextLessonsCount);
    void trackMixpanelFeedLoadMore({
      previousItemsCount:
        previousCharacterVideosCount + previousVocabularyCount + previousShadowingCount + previousLessonsCount,
      nextItemsCount:
        nextCharacterVideosCount + nextVocabularyCount + nextShadowingCount + nextLessonsCount,
      itemsLoadedCount,
      previousMissionsCount: 0,
      nextMissionsCount: 0,
      missionsLoadedCount: 0,
      previousCharacterVideosCount,
      nextCharacterVideosCount,
      characterVideosLoadedCount,
      previousVocabularyCount,
      nextVocabularyCount,
      vocabularyLoadedCount,
      previousShadowingCount,
      nextShadowingCount,
      shadowingLoadedCount,
      previousLessonsCount,
      nextLessonsCount,
      lessonsLoadedCount,
      totalMissionsAvailable: 0,
      totalCharacterVideosAvailable: shuffledCharacterVideos.length,
      totalVocabularyAvailable: shuffledVocabulary.length,
      totalShadowingAvailable: shuffledShadowing.length,
      totalLessonsAvailable: shuffledLessons.length,
      hasMoreAfter:
        nextCharacterVideosCount < shuffledCharacterVideos.length ||
        nextVocabularyCount < shuffledVocabulary.length ||
        nextShadowingCount < shuffledShadowing.length ||
        nextLessonsCount < shuffledLessons.length,
    });
  }, [
    hasMoreFeedItems,
    loading,
    shuffledLessons.length,
    shuffledCharacterVideos.length,
    shuffledShadowing.length,
    shuffledVocabulary.length,
    visibleCharacterVideoCount,
    visibleLessonsCount,
    visibleShadowingCount,
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
    void trackMixpanelFeedItemAction({
      ...getFeedTrackingProperties(item),
      action: 'listen_vocabulary',
    });
    Speech.speak(segments.join('. '), { language: 'en-US', pitch: 1.05 });
  }, []);

  const handleMarkLearned = useCallback(
    (item: PendingVocab) => {
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'mark_learned',
      });
      void setStatus(String(item.id), 'learned');
    },
    [setStatus]
  );

  const handleGuessCorrect = useCallback((item: PendingVocab) => {
    void trackMixpanelFeedItemAction({
      ...getFeedTrackingProperties(item),
      action: 'quick_guess_correct',
    });
    void recordJourneyVocabularyQuickGuessCorrect(String(item.id));
  }, []);

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
      void trackMixpanelFeedItemAction({
        feed_item_kind: 'vocab',
        card_id: String(item.id),
        label: item.label,
        action: 'open_practice',
      });
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
    async (_storyId: string, _sceneIndex: number) => {
      if (isOpeningMissionRef.current) return;
      isOpeningMissionRef.current = true;
      try {
        stopFeedVideos();
        setPostActionMessage('Las misiones fueron reemplazadas por conversaciones libres. Elige un personaje en Amigos.');
        navigation.navigate('Friends');
      } finally {
        setIsInterstitialLoading(false);
        isOpeningMissionRef.current = false;
      }
    },
    [navigation, stopFeedVideos]
  );

  const handleStartMission = useCallback(
    async (item: PendingMission) => {
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'start_mission',
      });
      await openMission(item.storyId, item.sceneIndex);
    },
    [openMission]
  );

  const handleContinueMission = useCallback(
    async (item: ResumeMission) => {
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'continue_mission',
      });
      await openMission(item.storyId, item.sceneIndex);
    },
    [openMission]
  );

  const handlePlayShadowing = useCallback(
    (item: PendingShadowing) => {
      stopFeedVideos();
      setPostActionMessage(undefined);
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'play_shadowing',
      });
      setShadowingQueue([item]);
      selectShadowingChapter(item.nextChapter, { shouldPlay: true });
      navigation.navigate('Shadowing', {
        listId: item.listId,
        chapterId: item.nextChapter.chapterId,
        autoplay: true,
        origin: 'feed',
      });
    },
    [navigation, selectShadowingChapter, setShadowingQueue, stopFeedVideos]
  );

  const handlePlayLesson = useCallback(
    (item: PendingLesson) => {
      stopFeedVideos();
      setPostActionMessage(undefined);
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'open_lesson',
      });
      navigation.navigate('LessonDetail', { lessonId: item.lessonId });
    },
    [navigation, stopFeedVideos]
  );

  const handleOpenFriendProfile = useCallback(
    (friend: FriendCharacter) => {
      stopFeedVideos();
      void trackMixpanelFeedItemAction({
        action: 'open_friend_profile',
        feed_item_kind: 'friend_story',
        friend_id: friend.friendId,
        character_id: friend.friendId,
        character_name: friend.characterName,
      });
      navigation.navigate('FriendProfile', { friendId: friend.friendId });
    },
    [navigation, stopFeedVideos]
  );

  const handleOpenCharacterVideo = useCallback(
    (item: CharacterVideoFeedItem) => {
      stopFeedVideos();
      setPostActionMessage(undefined);
      setSelectedCharacterVideoFeedId(item.feedId);
      setCharacterVideoViewerVisible(true);
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'open_character_video',
      });
    },
    [stopFeedVideos]
  );

  const handleCloseCharacterVideoViewer = useCallback(() => {
    setCharacterVideoViewerVisible(false);
    if (isFeedFocused) {
      setSuspendFeedVideoPlayback(false);
    }
  }, [isFeedFocused]);

  const handleOpenCharacterVideoProfile = useCallback(
    (item: CharacterVideoFeedItem) => {
      setCharacterVideoViewerVisible(false);
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'open_character_profile_from_video',
      });
      navigation.navigate('FriendProfile', { friendId: item.characterId });
    },
    [navigation]
  );

  const handleReplyToCharacterVideo = useCallback(
    (item: CharacterVideoFeedItem, draft: string) => {
      setCharacterVideoViewerVisible(false);
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'reply_to_character_video',
      });
      navigation.navigate('FriendChat', {
        friendId: item.characterId,
        postId: item.postId,
        postImageUrl: item.imageUrl,
        postVideoUrl: item.videoUrl,
        postCaption: item.caption,
        postContext: item.context || item.caption,
        initialDraft: draft,
      });
    },
    [navigation]
  );

  const handlePracticePost = useCallback(
    async (item: FeedPostItem) => {
      const practice = learningItems.find((learningItem) => String(learningItem.id) === String(item.practiceId));
      if (!practice) {
        setPostActionMessage('No encontramos esa practica en la app.');
        return;
      }
      setPostActionMessage(undefined);
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'post_open_practice',
      });
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
      void trackMixpanelFeedItemAction({
        ...getFeedTrackingProperties(item),
        action: 'post_open_mission',
      });
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
        void trackMixpanelFeedItemAction({
          ...getFeedTrackingProperties(item),
          action: 'claim_extra',
        });
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
        data={renderedFeedItems}
        keyExtractor={(item) => (item.kind === 'mission' ? item.id : item.feedId)}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        viewabilityConfig={viewabilityConfigRef.current}
        onViewableItemsChanged={handleViewableItemsChangedRef.current}
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

            <FriendStoriesStrip
              friends={friends}
              loading={friendsLoading}
              error={friendsError}
              onOpenFriend={handleOpenFriendProfile}
              onAddMore={() => navigation.navigate('Friends')}
            />

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

            {characterVideosError ? (
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
                <Text style={{ color: '#fecdd3', fontWeight: '700' }}>{characterVideosError}</Text>
              </View>
            ) : null}

            {shadowingError ? (
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
                <Text style={{ color: '#fecdd3', fontWeight: '700' }}>{shadowingError}</Text>
              </View>
            ) : null}

            {lessonsError ? (
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
                <Text style={{ color: '#fecdd3', fontWeight: '700' }}>{lessonsError}</Text>
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
          item.kind === 'promo' ? (
            <PromoTimerCard
              remainingSeconds={item.remainingSeconds}
              onPress={() => {
                stopFeedVideos();
                navigation.navigate('Paywall', { source: 'promo_lite_offer', variant: 'lite' });
              }}
            />
          ) : item.kind === 'resumeMission' ? (
            <ResumeMissionCard item={item} onContinue={handleContinueMission} />
          ) : item.kind === 'mission' ? (
            <MissionCard
              item={item}
              onStart={handleStartMission}
              onViewAll={() => navigation.navigate('Friends')}
              playbackEnabled={videoPlaybackEnabled && activeFeedMediaId === item.id}
            />
          ) : item.kind === 'characterVideo' ? (
            <CharacterVideoCard item={item} onPress={handleOpenCharacterVideo} />
          ) : item.kind === 'vocab' ? (
            <VocabularyCard
              item={item}
              onListen={speakVocabulary}
              onMarkLearned={handleMarkLearned}
              onPractice={handlePractice}
              onGuessCorrect={handleGuessCorrect}
            />
          ) : item.kind === 'shadowing' ? (
            <ShadowingFeedCard
              item={item}
              onPlay={handlePlayShadowing}
              onViewAll={() => navigation.navigate('Shadowing')}
            />
          ) : item.kind === 'lesson' ? (
            <LessonFeedCard
              item={item}
              onPlay={handlePlayLesson}
              onViewAll={() => navigation.navigate('Lessons')}
            />
          ) : (
            <FeedPostCard
              item={item}
              onPractice={handlePracticePost}
              onMission={handleMissionPost}
              onClaimExtra={handleClaimExtraPost}
              claiming={claimingPostId === item.postId}
              playbackEnabled={videoPlaybackEnabled && activeFeedMediaId === item.feedId}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          showInitialFeedSkeleton ? (
            <FeedInitialLoadingState />
          ) : loading ? (
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
                Cuando aparezcan nuevas tarjetas o videos, las verás aquí.
              </Text>
            </View>
          )
        }
      />
      <CharacterVideoDumbscrollModal
        visible={characterVideoViewerVisible}
        videos={shuffledCharacterVideos}
        initialFeedId={selectedCharacterVideoFeedId}
        onClose={handleCloseCharacterVideoViewer}
        onOpenProfile={handleOpenCharacterVideoProfile}
        onReply={handleReplyToCharacterVideo}
        overlay={
          feedTourStep ? (
            <FeedTourOverlay
              step={feedTourStep}
              onDismiss={() => {
                if (feedTourStep === 'swipeUp') {
                  setFeedTourStep('sendMessage');
                } else {
                  setFeedTourStep(null);
                  void AsyncStorage.setItem(SWIPE_UP_TOUR_STORAGE_KEY, '1').catch(() => {});
                }
              }}
            />
          ) : null
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
      {openingReelsFromOnboarding && !characterVideoViewerVisible ? (
        <ReelsStartupOverlay />
      ) : null}
    </SafeAreaView>
  );
}
