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
import { RootStackParamList } from '../navigation/AppNavigator';
import { ShadowingChapter, ShadowingList, useShadowing } from '../hooks/useShadowing';
import { useShadowingPlayer } from '../shadowing/ShadowingPlayerProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Shadowing'>;

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

function formatAudioTime(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const rest = totalSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
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
  const {
    currentChapter: selectedChapter,
    activeAudioUrl,
    positionSeconds,
    durationSeconds,
    isPlaying,
    audioLoading,
    audioError,
    setQueue,
    selectChapter,
    playPause,
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

  const handlePlayPause = useCallback(async () => {
    await playPause();
  }, [playPause]);

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
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 128, gap: 16 }} style={{ flex: 1 }}>
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

            <View
              style={{
                borderRadius: 22,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.surface,
              }}
            >
              {selectedList.coverImageUrl ? (
                <Image
                  source={{ uri: selectedList.coverImageUrl }}
                  resizeMode="cover"
                  style={{ width: '100%', height: 172, backgroundColor: COLORS.surfaceAlt }}
                />
              ) : (
                <View style={{ height: 132, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceAlt }}>
                  <MaterialIcons name="headphones" size={42} color={COLORS.accent} />
                </View>
              )}
              <View style={{ padding: 16 }}>
                <Text style={{ color: COLORS.muted, fontWeight: '800' }}>
                  {selectedList.chapters.length} capitulos
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
                  <Text style={{ color: COLORS.muted, lineHeight: 20 }}>
                    {selectedChapter.description || 'Practica siguiendo el ritmo del audio.'}
                  </Text>
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

                <Pressable
                  onPress={() => { void handlePlayPause(); }}
                  disabled={audioLoading || !activeAudioUrl}
                  style={({ pressed }) => ({
                    alignSelf: 'center',
                    width: 78,
                    height: 78,
                    borderRadius: 39,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
                    opacity: audioLoading || !activeAudioUrl ? 0.55 : 1,
                  })}
                >
                  {audioLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={42} color="white" />
                  )}
                </Pressable>
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
      <AppTabBar active="shadowing" />
    </SafeAreaView>
  );
}
