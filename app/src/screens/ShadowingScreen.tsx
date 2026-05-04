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
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import AppTabBar from '../components/AppTabBar';
import { api } from '../api/api';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ShadowingChapter, ShadowingList, useShadowing } from '../hooks/useShadowing';
import { fetchSrtCaptions } from '../hooks/useLessons';
import { useShadowingPlayer } from '../shadowing/ShadowingPlayerProvider';

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
const PLAYBACK_RATES = [0.6, 0.75, 0.9, 1];

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
  onPress,
}: {
  chapter: ShadowingChapter;
  active: boolean;
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
        borderColor: active ? 'rgba(34, 211, 238, 0.65)' : COLORS.border,
        backgroundColor: active ? 'rgba(34, 211, 238, 0.14)' : COLORS.surface,
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
            backgroundColor: active ? COLORS.accent : COLORS.surfaceAlt,
          }}
        >
          <MaterialIcons name="graphic-eq" size={18} color={active ? '#07111f' : COLORS.accent} />
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
        <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '800' }}>Audio</Text>
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
  onPress,
}: {
  list: ShadowingList;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir lista ${list.name}`}
      style={({ pressed }) => ({
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: COLORS.surfaceAlt }}>
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
      </View>
      <View style={{ padding: 12, gap: 5 }}>
        <Text style={{ color: '#a5f3fc', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }} numberOfLines={1}>
          {list.category}
        </Text>
        <Text style={{ color: COLORS.text, fontSize: 16, lineHeight: 20, fontWeight: '900' }} numberOfLines={2}>
          {list.name}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '800' }}>
          {list.chapters.length} capitulos
        </Text>
      </View>
    </Pressable>
  );
}

export default function ShadowingScreen({ navigation: _navigation }: Props) {
  const { lists, loading, error, reload } = useShadowing();
  const { width: windowWidth } = useWindowDimensions();
  const [selectedListId, setSelectedListId] = useState<string>();
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
    setQueue,
    selectChapter,
    playPause,
    setPlaybackRate,
    previewSeek: previewPlayerSeek,
    seek: seekPlayer,
    cancelSeek,
  } = useShadowingPlayer();

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

  const openList = useCallback((list: ShadowingList) => {
    setSelectedListId(list.listId);
    const firstChapter = list.chapters[0];
    if (firstChapter && !list.chapters.some((chapter) => chapter.chapterId === selectedChapter?.chapterId)) {
      selectChapter(firstChapter);
    }
  }, [selectChapter, selectedChapter?.chapterId]);

  const handleSelectChapter = useCallback((chapter: ShadowingChapter) => {
    selectChapter(chapter);
  }, [selectChapter]);

  const openCurrentPlayer = useCallback(() => {
    if (!selectedChapter) return;
    const activeList = lists.find((list) =>
      list.chapters.some((chapter) => chapter.chapterId === selectedChapter.chapterId),
    );
    if (activeList) {
      setSelectedListId(activeList.listId);
    }
  }, [lists, selectedChapter]);

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
    await playPause();
  }, [playPause]);

  const handlePlaybackRate = useCallback(async (rate: number) => {
    await setPlaybackRate(rate);
  }, [setPlaybackRate]);

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
          error: err?.message || 'No pudimos traducir este subtítulo.',
        },
      }));
    }
  }, [activeSubtitle, activeSubtitleKey, isPlaying, playPause, subtitleTranslations]);

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
            <View style={{ gap: 6 }}>
              <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
                Audio practice
              </Text>
              <Text style={{ color: COLORS.text, fontSize: 32, fontWeight: '900' }}>Shadowing</Text>
              <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
                Elige una lista y practica sus capitulos con audio continuo.
              </Text>
            </View>

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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: COVER_GRID_GAP }}>
                {lists.map((list) => (
                  <View key={list.listId} style={{ width: coverCardWidth }}>
                    <ShadowingListCoverCard
                      list={list}
                      onPress={() => openList(list)}
                    />
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => setSelectedListId(undefined)}
                accessibilityRole="button"
                accessibilityLabel="Volver a listas"
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
                      minHeight: 74,
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
                      <Text
                        style={{
                          flex: 1,
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
