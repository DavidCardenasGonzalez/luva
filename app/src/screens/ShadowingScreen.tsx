import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import AppTabBar from '../components/AppTabBar';
import CoinCountChip from '../components/CoinCountChip';
import { api } from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ShadowingChapter, ShadowingList, useShadowing } from '../hooks/useShadowing';
import { fetchSrtCaptions } from '../hooks/useLessons';
import { useShadowingPlayer } from '../shadowing/ShadowingPlayerProvider';
import { SHADOWING_CHAPTER_COST, useCoins } from '../purchases/CoinBalanceProvider';
import { LITE_PROMO_EXPIRES_AT_KEY } from '../purchases/litePromo';
import { trackMixpanelShadowingEvent } from '../marketing/mixpanelEvents';
import { useLanguage } from '../i18n/LanguageProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Shadowing'>;

type ShadowingSubtitleCue = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

type TranslationResponse = {
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage: string;
};

type SubtitleTranslationState = {
  text?: string;
  loading?: boolean;
  error?: string;
};

type ContinueShadowingListItem = {
  list: ShadowingList;
  listenedCount: number;
  latestListenedAt: string;
  latestChapter: ShadowingChapter | undefined;
};

const COLORS = {
  background: '#0b1224',
  surface: '#0f172a',
  surfaceAlt: '#111827',
  border: '#1f2937',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#22d3ee',
  action: '#2563eb',
  success: '#22c55e',
};

const SCREEN_HORIZONTAL_PADDING = 40;
const COVER_GRID_GAP = 12;
const CONTINUE_CARD_HEIGHT = 132;
const CONTINUE_CARD_IMAGE_WIDTH = 112;
const PLAYBACK_RATES = [0.6, 0.75, 0.9, 1];
const SUBTITLE_BOX_MIN_HEIGHT = 96;
const SUBTITLE_TEXT_MIN_HEIGHT = 72;

function formatAudioTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const rest = totalSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function findActiveSubtitle(cues: ShadowingSubtitleCue[], timeSeconds: number) {
  return cues.find((cue) => timeSeconds >= cue.startSeconds && timeSeconds <= cue.endSeconds);
}

function getSubtitleKey(cue?: ShadowingSubtitleCue) {
  if (!cue) return undefined;
  return `${Math.round(cue.startSeconds * 1000)}-${Math.round(cue.endSeconds * 1000)}-${cue.text}`;
}

function ChapterPill({
  chapter,
  active,
  listened,
  onPress,
}: {
  chapter: ShadowingChapter;
  active: boolean;
  listened: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir practica ${chapter.title}`}
      style={({ pressed }) => ({
        padding: 14,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: active
          ? 'rgba(34, 211, 238, 0.65)'
          : listened
            ? 'rgba(34, 197, 94, 0.5)'
            : COLORS.border,
        backgroundColor: active
          ? 'rgba(34, 211, 238, 0.14)'
          : listened
            ? 'rgba(34, 197, 94, 0.1)'
            : COLORS.surface,
        opacity: pressed ? 0.78 : 1,
        gap: 8,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: active ? COLORS.accent : listened ? 'rgba(34, 197, 94, 0.22)' : COLORS.surfaceAlt,
          }}
        >
          <MaterialIcons
            name={listened ? 'check-circle' : 'graphic-eq'}
            size={18}
            color={active ? '#07111f' : listened ? COLORS.success : COLORS.accent}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '900' }} numberOfLines={1}>
            {chapter.title}
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 2 }} numberOfLines={2}>
            {chapter.description || 'Practica escuchando y repitiendo el audio.'}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Text style={{ color: listened ? '#bbf7d0' : '#a5f3fc', fontSize: 12, fontWeight: '800' }}>
          {listened ? 'Escuchado' : 'Audio'}
        </Text>
        {chapter.durationSeconds ? (
          <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '800' }}>
            {formatAudioTime(chapter.durationSeconds)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ShadowingListCoverCard({
  list,
  listenedCount,
  onPress,
}: {
  list: ShadowingList;
  listenedCount: number;
  onPress: () => void;
}) {
  const totalChapters = list.chapters.length;
  const completed = totalChapters > 0 && listenedCount >= totalChapters;
  const started = listenedCount > 0;
  const progressRatio = totalChapters > 0 ? Math.min(1, listenedCount / totalChapters) : 0;
  const progressColor = completed ? COLORS.success : COLORS.accent;
  const statusText = completed
    ? 'Completada'
    : started
      ? `${listenedCount}/${totalChapters} escuchados`
      : `${totalChapters} capitulos`;
  const accessibilityStatus = completed
    ? 'completada'
    : started
      ? `${listenedCount} de ${totalChapters} capitulos escuchados`
      : `${totalChapters} capitulos`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir lista ${list.name}, ${accessibilityStatus}`}
      style={({ pressed }) => ({
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: completed
          ? 'rgba(34, 197, 94, 0.62)'
          : started
            ? 'rgba(34, 211, 238, 0.45)'
            : COLORS.border,
        backgroundColor: completed ? 'rgba(20, 83, 45, 0.16)' : COLORS.surface,
        opacity: pressed ? 0.82 : 1,
        height: 230,
        flexDirection: 'column',
      })}
    >
      <View style={{ flex: 1, width: '100%', backgroundColor: COLORS.surfaceAlt }}>
        {list.coverImageUrl ? (
          <Image
            source={{ uri: list.coverImageUrl }}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="headphones" size={42} color={COLORS.accent} />
          </View>
        )}
        {started ? (
          <View
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              minHeight: 28,
              paddingHorizontal: 9,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: completed ? 'rgba(187, 247, 208, 0.72)' : 'rgba(165, 243, 252, 0.72)',
              backgroundColor: completed ? 'rgba(20, 83, 45, 0.9)' : 'rgba(8, 47, 73, 0.88)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <MaterialIcons
              name={completed ? 'check-circle' : 'headphones'}
              size={14}
              color={completed ? '#bbf7d0' : '#a5f3fc'}
            />
            <Text
              style={{
                color: completed ? '#dcfce7' : '#cffafe',
                fontSize: 11,
                fontWeight: '900',
              }}
              numberOfLines={1}
            >
              {completed ? 'Completa' : `${listenedCount}/${totalChapters}`}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ padding: 12, gap: 7 }}>
        <Text style={{ color: '#a5f3fc', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }} numberOfLines={1}>
          {list.category}
        </Text>
        <Text style={{ color: COLORS.text, fontSize: 16, lineHeight: 20, fontWeight: '900' }} numberOfLines={2}>
          {list.name}
        </Text>
        <View
          style={{
            height: 5,
            borderRadius: 999,
            overflow: 'hidden',
            backgroundColor: 'rgba(148, 163, 184, 0.18)',
          }}
        >
          <View
            style={{
              width: `${progressRatio * 100}%`,
              height: '100%',
              borderRadius: 999,
              backgroundColor: progressColor,
            }}
          />
        </View>
        <Text
          style={{
            color: started ? (completed ? '#bbf7d0' : '#a5f3fc') : COLORS.muted,
            fontSize: 12,
            fontWeight: '800',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {statusText}
        </Text>
      </View>
    </Pressable>
  );
}

function ContinueListeningCard({
  item,
  width,
  onPress,
}: {
  item: ContinueShadowingListItem;
  width: number;
  onPress: () => void;
}) {
  const { list, listenedCount, latestChapter } = item;
  const totalChapters = list.chapters.length;
  const completed = totalChapters > 0 && listenedCount >= totalChapters;
  const nextText = completed
    ? 'Lista completada'
    : `${listenedCount}/${totalChapters} escuchados`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Continuar lista ${list.name}`}
      style={({ pressed }) => ({
        width,
        height: CONTINUE_CARD_HEIGHT,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: completed ? 'rgba(34, 197, 94, 0.52)' : 'rgba(34, 211, 238, 0.42)',
        backgroundColor: COLORS.surface,
        opacity: pressed ? 0.82 : 1,
        overflow: 'hidden',
        flexDirection: 'row',
      })}
    >
      <View style={{ width: CONTINUE_CARD_IMAGE_WIDTH, backgroundColor: COLORS.surfaceAlt }}>
        {list.coverImageUrl ? (
          <Image
            source={{ uri: list.coverImageUrl }}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="headphones" size={34} color={COLORS.accent} />
          </View>
        )}
      </View>
      <View style={{ flex: 1, padding: 12, gap: 7, justifyContent: 'center' }}>
        <Text style={{ color: '#a5f3fc', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }} numberOfLines={1}>
          {list.category}
        </Text>
        <Text style={{ color: COLORS.text, fontSize: 17, lineHeight: 21, fontWeight: '900' }} numberOfLines={2}>
          {list.name}
        </Text>
        {latestChapter ? (
          <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 16, fontWeight: '700' }} numberOfLines={2}>
            Ultimo: {latestChapter.title}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialIcons
            name={completed ? 'check-circle' : 'play-circle'}
            size={16}
            color={completed ? COLORS.success : COLORS.accent}
          />
          <Text
            style={{ color: completed ? '#bbf7d0' : '#a5f3fc', fontSize: 12, fontWeight: '900', flex: 1 }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {nextText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ShadowingScreen({ navigation, route }: Props) {
  const { supportLanguage } = useLanguage();
  const { lists, loading, error, reload } = useShadowing();
  const { width: windowWidth } = useWindowDimensions();
  const [selectedListId, setSelectedListId] = useState<string>();
  const handledInitialOpenKeyRef = useRef<string | undefined>(undefined);
  const progressBarRef = useRef<View | null>(null);
  const progressBarMeasuredRef = useRef(false);
  const progressBarPageXRef = useRef(0);
  const progressBarWidthRef = useRef(0);
  const pendingSeekSecondsRef = useRef<number | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [subtitleCues, setSubtitleCues] = useState<ShadowingSubtitleCue[]>([]);
  const [subtitlesLoading, setSubtitlesLoading] = useState(false);
  const [subtitleTranslations, setSubtitleTranslations] = useState<Record<string, SubtitleTranslationState>>({});
  const {
    currentChapter: selectedChapter,
    activeAudioUrl,
    positionSeconds,
    durationSeconds,
    isPlaying,
    playbackRate,
    audioLoading,
    audioError,
    listenedChapterIds,
    listenedChapterDates,
    setQueue,
    selectChapter,
    playPause,
    setPlaybackRate,
    previewSeek: previewPlayerSeek,
    seek: seekPlayer,
    cancelSeek,
  } = useShadowingPlayer();
  const { canSpend, spendCoins, loading: coinsLoading, isUnlimited } = useCoins();
  const chargedChapterIdsRef = useRef(new Set<string>());
  const trackedPlayStartedChapterIdsRef = useRef(new Set<string>());

  const openShadowingPaywall = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(LITE_PROMO_EXPIRES_AT_KEY);
      const expiresAt = raw ? Number(raw) : Number.NaN;
      if (Number.isFinite(expiresAt) && expiresAt > Date.now()) {
        navigation.navigate('Paywall', { source: 'shadowing_chapter_unlock', variant: 'lite' });
        return;
      }
      if (raw) {
        await AsyncStorage.removeItem(LITE_PROMO_EXPIRES_AT_KEY);
      }
    } catch (err) {
      console.warn('[Shadowing] No se pudo revisar la promo Lite', err);
    }
    navigation.navigate('Paywall', { source: 'shadowing_chapter_unlock' });
  }, [navigation]);

  // Charge coins when a chapter starts playing (covers auto-advance too)
  useEffect(() => {
    if (!isPlaying || !selectedChapter || isUnlimited) return;
    const chapterId = selectedChapter.chapterId;
    if (chargedChapterIdsRef.current.has(chapterId)) return;
    chargedChapterIdsRef.current.add(chapterId);
    spendCoins(SHADOWING_CHAPTER_COST, `shadowing:${chapterId}`).then((ok) => {
      if (!ok) {
        chargedChapterIdsRef.current.delete(chapterId);
        void playPause();
        void openShadowingPaywall();
      }
    });
  }, [isPlaying, isUnlimited, openShadowingPaywall, playPause, selectedChapter, spendCoins]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  useEffect(() => {
    if (selectedListId && !lists.some((list) => list.listId === selectedListId)) {
      setSelectedListId(undefined);
    }
  }, [lists, selectedListId]);

  const selectedList = useMemo(
    () => lists.find((list) => list.listId === selectedListId),
    [lists, selectedListId],
  );

  useEffect(() => {
    setQueue(selectedList ? [selectedList] : lists);
  }, [lists, selectedList, setQueue]);

  useEffect(() => {
    const requestedListId = route.params?.listId;
    if (!requestedListId) return;

    const requestedChapterId = route.params?.chapterId;
    const shouldPlay = Boolean(route.params?.autoplay);
    const openKey = `${requestedListId}:${requestedChapterId || ''}:${shouldPlay ? 'play' : 'open'}`;
    if (handledInitialOpenKeyRef.current === openKey) return;

    const requestedList = lists.find((list) => list.listId === requestedListId);
    if (!requestedList) return;

    const requestedChapter =
      requestedList.chapters.find((chapter) => chapter.chapterId === requestedChapterId) ||
      requestedList.chapters[0];
    if (!requestedChapter) return;

    setSelectedListId(requestedList.listId);
    selectChapter(requestedChapter, { shouldPlay });
    handledInitialOpenKeyRef.current = openKey;
  }, [lists, route.params?.autoplay, route.params?.chapterId, route.params?.listId, selectChapter]);

  const openList = useCallback((list: ShadowingList) => {
    void trackMixpanelShadowingEvent('shadowing_list_opened', {
      list_id: list.listId,
      list_name: list.name,
      category: list.category,
      chapter_count: list.chapters.length,
      source: 'list_grid',
    });
    setSelectedListId(list.listId);
    const firstChapter = list.chapters[0];
    if (firstChapter && !list.chapters.some((chapter) => chapter.chapterId === selectedChapter?.chapterId)) {
      selectChapter(firstChapter);
    }
  }, [selectChapter, selectedChapter?.chapterId]);

  const openContinueList = useCallback((item: ContinueShadowingListItem) => {
    void trackMixpanelShadowingEvent('shadowing_list_opened', {
      list_id: item.list.listId,
      list_name: item.list.name,
      category: item.list.category,
      chapter_count: item.list.chapters.length,
      listened_count: item.listenedCount,
      source: 'continue',
    });
    setSelectedListId(item.list.listId);
    const nextChapter =
      item.list.chapters.find((chapter) => !listenedChapterIds.has(chapter.chapterId)) ||
      item.latestChapter ||
      item.list.chapters[0];
    if (nextChapter) {
      selectChapter(nextChapter);
    }
  }, [listenedChapterIds, selectChapter]);

  const handleSelectChapter = useCallback((chapter: ShadowingChapter) => {
    void trackMixpanelShadowingEvent('shadowing_chapter_selected', {
      list_id: chapter.listId,
      chapter_id: chapter.chapterId,
      chapter_title: chapter.title,
      chapter_order: chapter.order,
      duration_seconds: chapter.durationSeconds,
      already_listened: listenedChapterIds.has(chapter.chapterId),
    });
    selectChapter(chapter);
  }, [listenedChapterIds, selectChapter]);

  const openCurrentPlayer = useCallback(() => {
    if (!selectedChapter) return;
    const activeList = lists.find((list) =>
      list.chapters.some((chapter) => chapter.chapterId === selectedChapter.chapterId),
    );
    if (activeList) {
      setSelectedListId(activeList.listId);
    }
  }, [lists, selectedChapter]);

  const handleBackFromSelectedList = useCallback(() => {
    if (route.params?.origin === 'feed') {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      navigation.navigate('Feed');
      return;
    }

    setSelectedListId(undefined);
  }, [navigation, route.params?.origin]);

  useEffect(() => {
    let cancelled = false;

    setSubtitleCues([]);
    setSubtitlesLoading(Boolean(selectedChapter?.subtitlesUrl));

    if (!selectedChapter?.subtitlesUrl) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const captions = await fetchSrtCaptions(selectedChapter.subtitlesUrl);
        if (!cancelled) {
          setSubtitleCues(captions);
        }
      } catch {
        if (!cancelled) {
          setSubtitleCues([]);
        }
      } finally {
        if (!cancelled) setSubtitlesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedChapter?.chapterId, selectedChapter?.subtitlesUrl]);

  const activeSubtitle = useMemo(
    () => findActiveSubtitle(subtitleCues, positionSeconds),
    [positionSeconds, subtitleCues],
  );
  const activeSubtitleKey = getSubtitleKey(activeSubtitle);
  const activeTranslation = activeSubtitleKey ? subtitleTranslations[activeSubtitleKey] : undefined;

  const handlePlayPause = useCallback(async () => {
    if (!isPlaying && !isUnlimited) {
      if (coinsLoading) return;
      const enough = await canSpend(SHADOWING_CHAPTER_COST);
      if (!enough) {
        await openShadowingPaywall();
        return;
      }
    }
    if (
      !isPlaying &&
      selectedChapter &&
      !trackedPlayStartedChapterIdsRef.current.has(selectedChapter.chapterId)
    ) {
      trackedPlayStartedChapterIdsRef.current.add(selectedChapter.chapterId);
      void trackMixpanelShadowingEvent('shadowing_chapter_play_started', {
        list_id: selectedChapter.listId,
        chapter_id: selectedChapter.chapterId,
        chapter_title: selectedChapter.title,
        position_seconds: Math.round(positionSeconds),
        duration_seconds: Math.round(durationSeconds || selectedChapter.durationSeconds || 0),
        playback_rate: playbackRate,
      });
    }
    await playPause();
  }, [
    canSpend,
    coinsLoading,
    durationSeconds,
    isPlaying,
    isUnlimited,
    openShadowingPaywall,
    playbackRate,
    playPause,
    positionSeconds,
    selectedChapter,
  ]);

  useEffect(() => {
    if (!isPlaying || !selectedChapter) return;
    if (trackedPlayStartedChapterIdsRef.current.has(selectedChapter.chapterId)) return;
    trackedPlayStartedChapterIdsRef.current.add(selectedChapter.chapterId);
    void trackMixpanelShadowingEvent('shadowing_chapter_play_started', {
      list_id: selectedChapter.listId,
      chapter_id: selectedChapter.chapterId,
      chapter_title: selectedChapter.title,
      position_seconds: Math.round(positionSeconds),
      duration_seconds: Math.round(durationSeconds || selectedChapter.durationSeconds || 0),
      playback_rate: playbackRate,
      autoplay: true,
    });
  }, [durationSeconds, isPlaying, playbackRate, positionSeconds, selectedChapter]);

  const handlePlaybackRate = useCallback(async (rate: number) => {
    void trackMixpanelShadowingEvent('shadowing_playback_rate_changed', {
      list_id: selectedChapter?.listId,
      chapter_id: selectedChapter?.chapterId,
      previous_rate: playbackRate,
      next_rate: rate,
    });
    await setPlaybackRate(rate);
  }, [playbackRate, selectedChapter, setPlaybackRate]);

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

    try {
      if (isPlaying) {
        await playPause();
      }
      if (supportLanguage === 'en') {
        setSubtitleTranslations((current) => ({
          ...current,
          [subtitleKey]: { text: subtitle, loading: false },
        }));
        return;
      }
      const payload = await api.post<TranslationResponse>('/translate', {
        text: subtitle,
        source: 'en',
        target: supportLanguage,
      });
      void trackMixpanelShadowingEvent('shadowing_subtitle_translated', {
        list_id: selectedChapter?.listId,
        chapter_id: selectedChapter?.chapterId,
        subtitle_length: subtitle.length,
        position_seconds: Math.round(positionSeconds),
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
          error: err?.message || 'No pudimos traducir este subtítulo.',
        },
      }));
    }
  }, [activeSubtitle, activeSubtitleKey, isPlaying, playPause, positionSeconds, selectedChapter, subtitleTranslations, supportLanguage]);

  const measureProgressBar = useCallback(() => {
    progressBarRef.current?.measureInWindow((x, _y, width) => {
      progressBarPageXRef.current = x;
      progressBarWidthRef.current = width;
      progressBarMeasuredRef.current = true;
    });
  }, []);

  const getSeekSeconds = useCallback((pageX: number, fallbackLocationX?: number) => {
    if (!durationSeconds || !progressBarWidthRef.current) return null;
    const locationX = progressBarMeasuredRef.current
      ? pageX - progressBarPageXRef.current
      : fallbackLocationX;
    if (typeof locationX !== 'number') return null;
    const ratio = Math.max(0, Math.min(1, locationX / progressBarWidthRef.current));
    return ratio * durationSeconds;
  }, [durationSeconds]);

  const previewSeek = useCallback((pageX: number, fallbackLocationX?: number) => {
    const nextSeconds = getSeekSeconds(pageX, fallbackLocationX);
    if (nextSeconds == null) return;
    pendingSeekSecondsRef.current = nextSeconds;
    previewPlayerSeek(nextSeconds);
  }, [getSeekSeconds, previewPlayerSeek]);

  const commitSeek = useCallback(async (pageX?: number, fallbackLocationX?: number) => {
    const nextSeconds =
      typeof pageX === 'number'
        ? getSeekSeconds(pageX, fallbackLocationX)
        : pendingSeekSecondsRef.current;

    if (nextSeconds == null) {
      setIsSeeking(false);
      pendingSeekSecondsRef.current = null;
      cancelSeek();
      return;
    }

    pendingSeekSecondsRef.current = null;

    try {
      await seekPlayer(nextSeconds);
    } finally {
      setIsSeeking(false);
    }
  }, [cancelSeek, getSeekSeconds, seekPlayer]);

  const progressPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => Boolean(activeAudioUrl && durationSeconds && progressBarWidthRef.current),
    onMoveShouldSetPanResponder: (_event, gestureState) => (
      Boolean(activeAudioUrl && durationSeconds && progressBarWidthRef.current) &&
      Math.abs(gestureState.dx) > 2 &&
      Math.abs(gestureState.dx) >= Math.abs(gestureState.dy)
    ),
    onPanResponderGrant: (event) => {
      measureProgressBar();
      setIsSeeking(true);
      previewSeek(event.nativeEvent.pageX, event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      previewSeek(event.nativeEvent.pageX, event.nativeEvent.locationX);
    },
    onPanResponderRelease: (event) => {
      void commitSeek(event.nativeEvent.pageX, event.nativeEvent.locationX);
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: () => {
      setIsSeeking(false);
      pendingSeekSecondsRef.current = null;
      cancelSeek();
    },
  }), [activeAudioUrl, cancelSeek, commitSeek, durationSeconds, measureProgressBar, previewSeek]);

  const progressRatio = durationSeconds > 0 ? Math.min(1, positionSeconds / durationSeconds) : 0;
  const coverCardWidth = Math.floor((windowWidth - SCREEN_HORIZONTAL_PADDING - COVER_GRID_GAP) / 2);
  const continueCardWidth = Math.min(314, Math.max(270, windowWidth - 64));
  const continueLists = useMemo<ContinueShadowingListItem[]>(() => lists
    .map((list) => {
      let listenedCount = 0;
      let latestTimestamp = Number.NEGATIVE_INFINITY;
      let latestListenedAt = '';
      let latestChapter: ShadowingChapter | undefined;

      list.chapters.forEach((chapter) => {
        if (!listenedChapterIds.has(chapter.chapterId)) return;
        listenedCount += 1;

        const listenedAt = listenedChapterDates.get(chapter.chapterId);
        const timestamp = listenedAt ? Date.parse(listenedAt) : 0;
        if (Number.isFinite(timestamp) && timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
          latestListenedAt = listenedAt || new Date(0).toISOString();
          latestChapter = chapter;
        }
      });

      if (!listenedCount) return undefined;
      return { list, listenedCount, latestListenedAt, latestChapter };
    })
    .filter((item): item is ContinueShadowingListItem => !!item)
    .sort((left, right) => (
      right.latestListenedAt.localeCompare(left.latestListenedAt) ||
      left.list.order - right.list.order ||
      left.list.name.localeCompare(right.list.name)
    )), [listenedChapterDates, listenedChapterIds, lists]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: selectedList ? 128 : 196, gap: 16 }}
        style={{ flex: 1 }}
      >
        {error ? (
          <View style={{ padding: 16, borderRadius: 18, backgroundColor: 'rgba(248, 113, 113, 0.12)' }}>
            <Text style={{ color: '#fca5a5', fontWeight: '800' }}>{error}</Text>
          </View>
        ) : null}

        {!selectedList ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
                  Audio practice
                </Text>
                <Text style={{ color: COLORS.text, fontSize: 32, fontWeight: '900' }}>Shadowing</Text>
              </View>
              <CoinCountChip />
            </View>
            <View>
              <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
                El shadowing es una practica donde intentas imitar a la persona que habla.
                Te ayuda a acostumbrar tu voz y tu oido al ingles. No te preocupes mucho si
                no conoces una palabra: repite cada vez que escuches un beep.
              </Text>
            </View>

            {continueLists.length > 0 ? (
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '900' }}>
                    Seguir escuchando
                  </Text>
                  <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '800' }}>
                    Recientes
                  </Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ maxHeight: CONTINUE_CARD_HEIGHT }}
                  contentContainerStyle={{ paddingRight: 4, gap: 12 }}
                >
                  {continueLists.map((item) => (
                    <ContinueListeningCard
                      key={item.list.listId}
                      item={item}
                      width={continueCardWidth}
                      onPress={() => openContinueList(item)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {loading && !lists.length ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color={COLORS.accent} />
                <Text style={{ color: COLORS.muted }}>Cargando Shadowing...</Text>
              </View>
            ) : lists.length === 0 ? (
              <View
                style={{
                  padding: 22,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  backgroundColor: COLORS.surface,
                  gap: 6,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '900' }}>Sin audios todavia</Text>
                <Text style={{ color: COLORS.muted }}>
                  Cuando se publiquen listas desde el Admin portal apareceran aqui.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '900' }}>
                  Tu proxima historia
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: COVER_GRID_GAP }}>
                  {lists.map((list) => {
                    const listenedCount = list.chapters.filter((chapter) => (
                      listenedChapterIds.has(chapter.chapterId)
                    )).length;

                    return (
                      <View key={list.listId} style={{ width: coverCardWidth }}>
                        <ShadowingListCoverCard
                          list={list}
                          listenedCount={listenedCount}
                          onPress={() => openList(list)}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={handleBackFromSelectedList}
                accessibilityRole="button"
                accessibilityLabel={route.params?.origin === 'feed' ? 'Volver al feed' : 'Volver a listas'}
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? COLORS.surfaceAlt : COLORS.surface,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                })}
              >
                <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
                  {selectedList.category}
                </Text>
                <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: '900' }} numberOfLines={2}>
                  {selectedList.name}
                </Text>
              </View>
              <CoinCountChip />
            </View>

            {selectedChapter ? (
              <View
                style={{
                  padding: 18,
                  borderRadius: 26,
                  borderWidth: 1,
                  borderColor: 'rgba(34, 211, 238, 0.22)',
                  backgroundColor: COLORS.surface,
                  gap: 16,
                }}
              >
                <View style={{ gap: 4 }}>
                  <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
                    Reproductor
                  </Text>
                  <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900' }}>
                    {selectedChapter.title}
                  </Text>
                  <View
                    style={{
                      minHeight: SUBTITLE_BOX_MIN_HEIGHT,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: 'rgba(2, 6, 23, 0.48)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: !activeSubtitle?.text ? 0.82 : 1,
                    }}
                  >
                    <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          flex: 1,
                          minHeight: SUBTITLE_TEXT_MIN_HEIGHT,
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                          color: activeSubtitle?.text ? COLORS.text : COLORS.muted,
                          fontSize: activeSubtitle?.text ? 18 : 14,
                          fontWeight: activeSubtitle?.text ? '900' : '800',
                          lineHeight: activeSubtitle?.text ? 24 : 20,
                          textAlign: 'center',
                          }}
                        >
                          {activeSubtitle?.text ||
                            (subtitlesLoading
                              ? 'Cargando subtítulos...'
                              : '')}
                        </Text>
                      </View>
                      {activeSubtitle?.text ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Traducir subtítulo"
                          onPress={() => { void handleTranslateSubtitle(); }}
                          disabled={!!activeTranslation?.loading}
                          hitSlop={8}
                          style={({ pressed }) => ({
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: activeTranslation?.loading
                              ? '#f1f5f9'
                              : pressed
                                ? '#dcfce7'
                                : '#f0fdf4',
                            borderWidth: 1,
                            borderColor: '#bbf7d0',
                            opacity: activeTranslation?.loading ? 0.75 : 1,
                          })}
                        >
                          {activeTranslation?.loading ? (
                            <ActivityIndicator size="small" color="#15803d" />
                          ) : (
                            <MaterialIcons name="translate" size={18} color="#15803d" />
                          )}
                        </Pressable>
                      ) : null}
                    </View>
                    {activeTranslation?.text ? (
                      <Text
                        style={{
                          marginTop: 10,
                          color: '#dbeafe',
                          fontSize: 15,
                          fontWeight: '800',
                          lineHeight: 21,
                          textAlign: 'center',
                        }}
                      >
                        {activeTranslation.text}
                      </Text>
                    ) : activeTranslation?.error ? (
                      <Text style={{ marginTop: 10, color: '#fca5a5', fontSize: 12, fontWeight: '800', textAlign: 'center' }}>
                        {activeTranslation.error}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View
                  ref={progressBarRef}
                  {...progressPanResponder.panHandlers}
                  onLayout={(event) => {
                    progressBarWidthRef.current = event.nativeEvent.layout.width;
                    progressBarMeasuredRef.current = false;
                    measureProgressBar();
                  }}
                  accessibilityRole="adjustable"
                  accessibilityLabel="Avance del audio"
                  accessibilityState={{ disabled: !activeAudioUrl || !durationSeconds }}
                  style={{
                    height: 34,
                    justifyContent: 'center',
                    opacity: !activeAudioUrl || !durationSeconds ? 0.55 : 1,
                  }}
                >
                  <View
                    style={{
                      height: isSeeking ? 14 : 12,
                      borderRadius: 999,
                      backgroundColor: COLORS.surfaceAlt,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${progressRatio * 100}%`,
                        height: '100%',
                        borderRadius: 999,
                        backgroundColor: COLORS.accent,
                      }}
                    />
                  </View>
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: `${progressRatio * 100}%`,
                      top: isSeeking ? 3 : 6,
                      width: isSeeking ? 28 : 22,
                      height: isSeeking ? 28 : 22,
                      marginLeft: isSeeking ? -14 : -11,
                      borderRadius: isSeeking ? 14 : 11,
                      borderWidth: 3,
                      borderColor: COLORS.surface,
                      backgroundColor: COLORS.accent,
                    }}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: COLORS.muted, fontWeight: '800' }}>{formatAudioTime(positionSeconds)}</Text>
                  <Text style={{ color: COLORS.muted, fontWeight: '800' }}>{formatAudioTime(durationSeconds)}</Text>
                </View>

                {audioError ? (
                  <Text style={{ color: '#fca5a5', fontWeight: '800' }}>{audioError}</Text>
                ) : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Pressable
                    onPress={() => { void handlePlayPause(); }}
                    disabled={audioLoading || !activeAudioUrl}
                    style={({ pressed }) => ({
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
                      opacity: audioLoading || !activeAudioUrl ? 0.55 : 1,
                    })}
                  >
                    {audioLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={40} color="white" />
                    )}
                  </Pressable>

                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      gap: 6,
                      padding: 4,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      backgroundColor: 'rgba(2, 6, 23, 0.32)',
                    }}
                  >
                    {PLAYBACK_RATES.map((rate) => {
                      const selected = Math.abs(playbackRate - rate) < 0.01;
                      return (
                        <Pressable
                          key={rate}
                          onPress={() => { void handlePlaybackRate(rate); }}
                          disabled={audioLoading}
                          accessibilityRole="button"
                          accessibilityLabel={`Velocidad ${rate}x`}
                          style={({ pressed }) => ({
                            flex: 1,
                            minHeight: 42,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: selected
                              ? COLORS.accent
                              : pressed
                                ? COLORS.surfaceAlt
                                : 'transparent',
                            opacity: audioLoading ? 0.55 : 1,
                          })}
                        >
                          <Text
                            style={{
                              color: selected ? '#07111f' : COLORS.text,
                              fontSize: 12,
                              fontWeight: '900',
                            }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {rate}x
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            ) : null}

            <View style={{ gap: 10 }}>
              {selectedList.chapters.map((chapter) => (
                <ChapterPill
                  key={chapter.chapterId}
                  chapter={chapter}
                  active={selectedChapter?.chapterId === chapter.chapterId}
                  listened={listenedChapterIds.has(chapter.chapterId)}
                  onPress={() => handleSelectChapter(chapter)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <AppTabBar
        active="shadowing"
        showShadowingMiniPlayer={!selectedList}
        onShadowingMiniPlayerPress={openCurrentPlayer}
      />
    </SafeAreaView>
  );
}
