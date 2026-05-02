import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import AppTabBar from '../components/AppTabBar';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ShadowingChapter, useShadowing } from '../hooks/useShadowing';

type Props = NativeStackScreenProps<RootStackParamList, 'Shadowing'>;
type AudioLanguage = 'en' | 'es';

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
        <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '800' }}>Audio EN</Text>
        {chapter.spanishAudioUrl ? (
          <Text style={{ color: '#bbf7d0', fontSize: 12, fontWeight: '800' }}>Audio ES</Text>
        ) : null}
        {chapter.durationSeconds ? (
          <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '800' }}>
            {formatAudioTime(chapter.durationSeconds)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ShadowingScreen({ navigation: _navigation }: Props) {
  const { lists, loading, error, reload } = useShadowing();
  const [selectedChapterId, setSelectedChapterId] = useState<string>();
  const [audioLanguage, setAudioLanguage] = useState<AudioLanguage>('en');
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressBarWidthRef = useRef(0);

  const selectedChapter = useMemo(() => {
    for (const list of lists) {
      const chapter = list.chapters.find((item) => item.chapterId === selectedChapterId);
      if (chapter) return chapter;
    }
    return lists[0]?.chapters[0];
  }, [lists, selectedChapterId]);

  const activeAudioUrl =
    audioLanguage === 'es' && selectedChapter?.spanishAudioUrl
      ? selectedChapter.spanishAudioUrl
      : selectedChapter?.audioUrl;

  const [positionSeconds, setPositionSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  useEffect(() => {
    if (!selectedChapterId && lists[0]?.chapters[0]) {
      setSelectedChapterId(lists[0].chapters[0].chapterId);
    }
  }, [lists, selectedChapterId]);

  useEffect(() => {
    if (audioLanguage === 'es' && !selectedChapter?.spanishAudioUrl) {
      setAudioLanguage('en');
    }
  }, [audioLanguage, selectedChapter?.spanishAudioUrl]);

  const handlePlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }

    setPositionSeconds(status.positionMillis / 1000);
    setIsPlaying(status.isPlaying);
    if (status.durationMillis != null) {
      setDurationSeconds(status.durationMillis / 1000);
    }

    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSound() {
      setAudioError(undefined);
      setPositionSeconds(0);
      setDurationSeconds(selectedChapter?.durationSeconds || 0);
      setIsPlaying(false);

      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }

      if (!activeAudioUrl) {
        return;
      }

      setAudioLoading(true);
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: activeAudioUrl },
          { shouldPlay: false, progressUpdateIntervalMillis: 250 },
          handlePlaybackStatus,
        );
        if (cancelled) {
          await sound.unloadAsync().catch(() => undefined);
          return;
        }
        soundRef.current = sound;
      } catch (err: any) {
        if (!cancelled) {
          setAudioError(err?.message || 'No pudimos cargar este audio.');
        }
      } finally {
        if (!cancelled) setAudioLoading(false);
      }
    }

    void loadSound();
    return () => {
      cancelled = true;
      if (soundRef.current) {
        void soundRef.current.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }
    };
  }, [activeAudioUrl, handlePlaybackStatus, selectedChapter?.durationSeconds]);

  const handleSelectChapter = useCallback((chapter: ShadowingChapter) => {
    setSelectedChapterId(chapter.chapterId);
    setAudioLanguage('en');
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (!soundRef.current || audioLoading) return;
    if (isPlaying) await soundRef.current.pauseAsync();
    else await soundRef.current.playAsync();
  }, [audioLoading, isPlaying]);

  const handleSeek = useCallback(async (locationX: number) => {
    if (!soundRef.current || !durationSeconds || !progressBarWidthRef.current) return;
    const ratio = Math.max(0, Math.min(1, locationX / progressBarWidthRef.current));
    await soundRef.current.setPositionAsync(ratio * durationSeconds * 1000);
  }, [durationSeconds]);

  const progressRatio = durationSeconds > 0 ? Math.min(1, positionSeconds / durationSeconds) : 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 128, gap: 16 }} style={{ flex: 1 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
            Audio practice
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 32, fontWeight: '900' }}>Shadowing</Text>
          <Text style={{ color: COLORS.muted, lineHeight: 21 }}>
            Escucha, pausa, repite y compara con el audio en espanol cuando este disponible.
          </Text>
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

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setAudioLanguage('en')}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: audioLanguage === 'en' ? COLORS.accent : COLORS.surfaceAlt,
                }}
              >
                <Text style={{ color: audioLanguage === 'en' ? '#07111f' : COLORS.text, fontWeight: '900' }}>
                  Ingles
                </Text>
              </Pressable>
              {selectedChapter.spanishAudioUrl ? (
                <Pressable
                  onPress={() => setAudioLanguage('es')}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 999,
                    backgroundColor: audioLanguage === 'es' ? COLORS.success : COLORS.surfaceAlt,
                  }}
                >
                  <Text style={{ color: audioLanguage === 'es' ? '#07111f' : COLORS.text, fontWeight: '900' }}>
                    Espanol
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onLayout={(event) => {
                progressBarWidthRef.current = event.nativeEvent.layout.width;
              }}
              onPress={(event) => {
                void handleSeek(event.nativeEvent.locationX);
              }}
              style={{
                height: 12,
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
            </Pressable>

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

        {error ? (
          <View style={{ padding: 16, borderRadius: 18, backgroundColor: 'rgba(248, 113, 113, 0.12)' }}>
            <Text style={{ color: '#fca5a5', fontWeight: '800' }}>{error}</Text>
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
          lists.map((list) => (
            <View key={list.listId} style={{ gap: 10 }}>
              <View>
                <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
                  {list.category}
                </Text>
                <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: '900' }}>{list.name}</Text>
              </View>
              {list.chapters.map((chapter) => (
                <ChapterPill
                  key={chapter.chapterId}
                  chapter={chapter}
                  active={selectedChapter?.chapterId === chapter.chapterId}
                  onPress={() => handleSelectChapter(chapter)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
      <AppTabBar active="shadowing" />
    </SafeAreaView>
  );
}
