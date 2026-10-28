import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, Image, Modal, PanResponder, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Audio, PitchCorrectionQuality, ResizeMode, Video, type AVPlaybackStatus } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { findActiveSubtitle, fetchSrtCaptions } from '../../hooks/useLessons';
import { useLanguage } from '../../i18n/LanguageProvider';
import type { MicrodramaDetail, MicrodramaEpisode } from '../types';
import { useEpisodePager } from './useEpisodePager';
import { useSubtitleTranslation } from './useSubtitleTranslation';
import SaveReviewButton from '../../review/SaveReviewButton';

const PLAYBACK_RATES = [0.5, 0.75, 0.9, 1, 1.25, 1.5, 2];

type Props = {
  detail: MicrodramaDetail;
  active: boolean;
  initialEpisodeId?: string;
  initialPositionMs?: number;
  onProgress?: (episode: MicrodramaEpisode, positionMs: number, event?: 'position' | 'ended') => void;
  onEpisodeChange?: (episode: MicrodramaEpisode) => void;
  onStartConversation?: (characterId: string, episode: MicrodramaEpisode, positionMs: number, wasPlaying: boolean) => void;
  onBack?: () => void;
  bottomInsetExtra?: number;
};

export default function MicrodramaPlayer({
  detail, active, initialEpisodeId, initialPositionMs = 0, onProgress, onEpisodeChange,
  onStartConversation, onBack, bottomInsetExtra = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { supportLanguage, language } = useLanguage();
  const videoRef = useRef<Video | null>(null);
  const initialApplied = useRef(false);
  const endedEpisodeRef = useRef<string | undefined>(undefined);
  const wasPlayingRef = useRef(false);
  const lastSaveAtRef = useRef(0);
  const pendingAdvanceRef = useRef<MicrodramaEpisode | undefined>(undefined);
  const [episodeId, setEpisodeId] = useState(initialEpisodeId || detail.episodes[0]?.episodeId);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [finished, setFinished] = useState(false);
  const [ready, setReady] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const playbackSettings = useMemo(() => ({
    rate: playbackRate,
    shouldCorrectPitch: true,
    pitchCorrectionQuality: PitchCorrectionQuality.High,
  }), [playbackRate]);
  const [sheet, setSheet] = useState<'episodes' | 'characters' | 'speed' | undefined>();
  const [subtitleCues, setSubtitleCues] = useState<Array<{startSeconds:number;endSeconds:number;text:string}>>([]);
  const episodeIndex = Math.max(0, detail.episodes.findIndex(episode => episode.episodeId === episodeId));
  const episode = detail.episodes[episodeIndex];
  const activeSubtitle = useMemo(() => findActiveSubtitle(
    subtitleCues.map((cue, index) => ({ id: `${cue.startSeconds}-${index}`, startSeconds: cue.startSeconds, endSeconds: cue.endSeconds, english: cue.text })),
    positionMs / 1000,
  )?.english, [positionMs, subtitleCues]);
  const videoSource = useMemo(() => episode ? { uri: episode.videoUrl } : undefined, [episode?.episodeId, episode?.videoUrl]);
  const mediaHeight = height;

  useEffect(() => {
    void Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => undefined);
  }, []);

  useEffect(() => {
    initialApplied.current = false;
    endedEpisodeRef.current = undefined;
    lastSaveAtRef.current = 0;
    setPositionMs(0);
    setReady(false);
    setPaused(false);
    if (!episode?.subtitlesUrl) { setSubtitleCues([]); return; }
    let cancelled = false;
    void fetchSrtCaptions(episode.subtitlesUrl).then(cues => { if (!cancelled) setSubtitleCues(cues); })
      .catch(() => { if (!cancelled) setSubtitleCues([]); });
    return () => { cancelled = true; };
  }, [episode?.episodeId, episode?.subtitlesUrl]);

  useEffect(() => {
    if (!active || !ready || sheet || paused || AppState.currentState !== 'active') {
      void videoRef.current?.pauseAsync().catch(() => undefined);
      return;
    }
    void videoRef.current?.playAsync().catch(() => setPaused(true));
  }, [active, paused, ready, sheet]);

  useEffect(() => () => { void videoRef.current?.stopAsync().catch(() => undefined); }, []);

  const selectEpisode = useCallback((selected: MicrodramaEpisode) => {
    pendingAdvanceRef.current = undefined;
    if (episode) onProgress?.(episode, positionMs, 'position');
    setSheet(undefined);
    setFinished(false);
    setEpisodeId(selected.episodeId);
    setPaused(false);
    onEpisodeChange?.(selected);
  }, [episode, onEpisodeChange, onProgress, positionMs]);

  const pager = useEpisodePager({
    enabled: active && !sheet,
    episodeIndex,
    episodeCount: detail.episodes.length,
    height: mediaHeight,
    onSelect: index => selectEpisode(detail.episodes[index]),
    onIdle: () => {
      if (pendingAdvanceRef.current) selectEpisode(pendingAdvanceRef.current);
    },
  });

  const openSheet = useCallback((next: 'episodes' | 'characters' | 'speed') => {
    wasPlayingRef.current = active && ready && !paused;
    setSheet(next);
  }, [active, paused, ready]);

  const closeSheet = useCallback(() => {
    setSheet(undefined);
    if (!wasPlayingRef.current) setPaused(true);
  }, []);

  const translation = useSubtitleTranslation({
    episodeId: episode?.episodeId,
    subtitle: activeSubtitle,
    supportLanguage,
    paused,
    onPause: () => {
      setPaused(true);
      void videoRef.current?.pauseAsync().catch(() => undefined);
    },
  });

  const rewindThreeSeconds = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    try {
      const status = await video.getStatusAsync();
      if (!status.isLoaded || videoRef.current !== video) return;
      const target = Math.max(0, status.positionMillis - 3000);
      translation.clear();
      endedEpisodeRef.current = undefined;
      setFinished(false);
      setPositionMs(target);
      await video.setPositionAsync(target);
    } catch {}
  }, [ready, translation.clear]);

  const onPlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    const nextPosition = status.positionMillis;
    setPositionMs(nextPosition);
    setDurationMs(status.durationMillis || episode?.durationMs || 0);
    if (!initialApplied.current) {
      initialApplied.current = true;
      const target = episode?.episodeId === initialEpisodeId ? initialPositionMs : 0;
      if (target > 0) void videoRef.current?.setPositionAsync(Math.min(target, status.durationMillis || episode?.durationMs || target));
      return;
    }
    if (status.didJustFinish && episode && endedEpisodeRef.current !== episode.episodeId) {
      endedEpisodeRef.current = episode.episodeId;
      onProgress?.(episode, episode.durationMs, 'ended');
      const next = detail.episodes[episodeIndex + 1];
      if (next) {
        if (pager.isInteracting()) pendingAdvanceRef.current = next;
        else selectEpisode(next);
      } else { setPaused(true); setFinished(true); }
      return;
    }
    if (status.isPlaying && Date.now() - lastSaveAtRef.current >= 5000 && episode) {
      lastSaveAtRef.current = Date.now();
      onProgress?.(episode, nextPosition, 'position');
    }
  }, [detail.episodes, episode, episodeIndex, initialEpisodeId, initialPositionMs, onProgress, selectEpisode]);

  const seekResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: event => {
      if (!durationMs) return;
      translation.clear();
      const target = Math.max(0, Math.min(durationMs, (event.nativeEvent.locationX / width) * durationMs));
      setPositionMs(target);
      void videoRef.current?.setPositionAsync(target);
    },
  }), [durationMs, translation.clear, width]);

  const progressRatio = durationMs > 0 ? Math.min(1, positionMs / durationMs) : 0;
  const previousEpisode = detail.episodes[episodeIndex - 1];
  const nextEpisode = detail.episodes[episodeIndex + 1];
  const replaySeries = useCallback(() => {
    endedEpisodeRef.current = undefined;
    setFinished(false);
    setPaused(false);
    setPositionMs(0);
    void videoRef.current?.setPositionAsync(0);
    void videoRef.current?.playAsync();
  }, []);

  if (!episode) return <View style={{ flex: 1, backgroundColor: '#07111f' }} />;

  return (
    <View style={{ width: '100%', height: mediaHeight, backgroundColor: '#030712', overflow: 'hidden' }}>
      <Animated.View {...pager.panHandlers} style={{ width: '100%', height: '100%', transform: [{ translateY: pager.translateY }] }}>
      {previousEpisode ? <Video
        key={`preview-${previousEpisode.episodeId}`}
        source={{ uri: previousEpisode.videoUrl }}
        style={{ position: 'absolute', top: -mediaHeight, left: 0, width: '100%', height: mediaHeight }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isMuted
        useNativeControls={false}
      /> : null}
      {nextEpisode ? <Video
        key={`preview-${nextEpisode.episodeId}`}
        source={{ uri: nextEpisode.videoUrl }}
        style={{ position: 'absolute', top: mediaHeight, left: 0, width: '100%', height: mediaHeight }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isMuted
        useNativeControls={false}
      /> : null}
      <Video
        key={episode.episodeId}
        ref={videoRef}
        source={videoSource}
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isMuted={isMuted}
        isLooping={false}
        status={playbackSettings}
        useNativeControls={false}
        progressUpdateIntervalMillis={500}
        onLoad={() => setReady(true)}
        onPlaybackStatusUpdate={onPlaybackStatus}
        onError={() => { setReady(false); setPaused(true); }}
      />
      <Pressable
        onPress={() => setPaused(value => !value)}
        disabled={!active || !ready || Boolean(sheet)}
        accessibilityRole="button"
        accessibilityLabel={paused ? (language === 'es' ? 'Reproducir video' : 'Play video') : (language === 'es' ? 'Pausar video' : 'Pause video')}
        style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}
      >
        {paused && ready && !sheet ? <MaterialIcons name="play-arrow" size={88} color="rgba(255,255,255,0.55)" /> : null}
      </Pressable>
      {!ready && <View style={{ position: 'absolute', inset: 0, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#22d3ee" /></View>}
      <SafeAreaView edges={['top', 'left', 'right']} pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' }}>
        <View pointerEvents="box-none" style={{ paddingTop: Math.max(insets.top, 12) + 8, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Volver' : 'Go back'} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="arrow-back" size={26} color="white" />
          </Pressable>
          <Pressable onPress={() => setIsMuted(value => !value)} accessibilityRole="button" accessibilityLabel={isMuted ? (language === 'es' ? 'Activar sonido' : 'Unmute video') : (language === 'es' ? 'Silenciar video' : 'Mute video')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={24} color="white" />
          </Pressable>
        </View>
        <View pointerEvents="box-none" style={{ marginBottom: bottomInsetExtra }}>
          <View style={{ alignItems: 'center', marginHorizontal: 28, marginBottom: 36 }}>
          {finished ? <Pressable onPress={replaySeries} style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, backgroundColor: '#0891b2', marginBottom: 12 }}><Text style={{ color: 'white', fontWeight: '900' }}>Repetir serie</Text></Pressable> : null}
          {translation.displayedSubtitle ? <View style={{ width: '100%', padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.48)' }}>
            <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {translation.displayedSubtitle.split(/(\s+)/).map((part, index) => /\s+/.test(part) ? <Text key={index} style={{ color: 'white', fontSize: 20, lineHeight: 28, fontWeight: '800' }}>{part}</Text> : <Text key={index} onPress={() => void translation.translate(part.replace(/[^A-Za-z'-]/g, ''))} style={{ color: 'white', fontSize: 20, lineHeight: 28, fontWeight: '800' }}>{part}</Text>)}
            </View>
            <Pressable onPress={() => void translation.translate()} disabled={translation.loading} accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Traducir subtítulo' : 'Translate subtitle'} style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10 }}>
              {translation.loading ? <ActivityIndicator size="small" color="#86efac" /> : <MaterialIcons name="translate" size={18} color="#86efac" />}
              <Text style={{ color: '#86efac', fontWeight: '700' }}>{translation.loading ? (language === 'es' ? 'Traduciendo…' : 'Translating…') : translation.error ? (language === 'es' ? 'Reintentar' : 'Retry') : (language === 'es' ? 'Traducir' : 'Translate')}</Text>
            </Pressable>
            {translation.translatedText ? <Text accessibilityLiveRegion="polite" style={{ color: '#86efac', fontSize: 16, textAlign: 'center', marginTop: 4 }}>{translation.selectedText !== translation.displayedSubtitle ? `${translation.selectedText}: ` : ''}{translation.translatedText}</Text> : null}
            {translation.translatedText && episode ? (
              <SaveReviewButton
                key={`${episode.episodeId}:${translation.selectedText}:${supportLanguage}`}
                originalText={translation.selectedText || translation.displayedSubtitle || ''}
                translatedText={translation.translatedText}
                targetLanguage={supportLanguage}
                contextText={translation.displayedSubtitle}
                source={{ type: 'microdrama', seriesId: detail.series.seriesId, episodeId: episode.episodeId, positionMs, title: `${detail.series.title} · ${episode.title}` }}
              />
            ) : null}
            {translation.error ? <Text style={{ color: '#fca5a5', fontSize: 14, textAlign: 'center', marginTop: 4 }}>{language === 'es' ? 'No pudimos traducir. Intenta de nuevo.' : 'Could not translate. Please try again.'}</Text> : null}
          </View> : null}
          </View>
          <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingTop: 12, paddingBottom: bottomInsetExtra > 0 ? 16 : Math.max(insets.bottom, 16), backgroundColor: 'rgba(0,0,0,0.24)' }}>
          <View style={{ width: '100%', paddingBottom: 4 }}>
            <Text numberOfLines={1} style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>{detail.series.title}</Text>
            <Text numberOfLines={1} style={{ color: '#e2e8f0', fontSize: 14 }}>{episode.title}</Text>
          </View>
          <View style={{ width: '100%', paddingVertical: 8 }} {...seekResponder.panHandlers}>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' }}><View style={{ height: 5, width: `${progressRatio * 100}%`, backgroundColor: '#22d3ee', borderRadius: 3 }} /></View>
          </View>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <Pressable onPress={() => void rewindThreeSeconds()} disabled={!ready} accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Retroceder 3 segundos' : 'Rewind 3 seconds'} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.5 }}><View style={{ alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="replay" size={28} color="white" /><Text style={{ position: 'absolute', color: 'white', fontSize: 9, fontWeight: '800', marginTop: 1 }}>3</Text></View></Pressable>
            <Pressable onPress={() => openSheet('episodes')} accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Episodios' : 'Episodes'} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="list" size={28} color="white" /></Pressable>
            <Pressable onPress={() => setPaused(value => !value)} accessibilityRole="button" accessibilityLabel={paused ? 'Reproducir' : 'Pausar'} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name={paused ? 'play-arrow' : 'pause'} size={40} color="white" /></Pressable>
            <Pressable onPress={() => openSheet('characters')} accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Personajes' : 'Characters'} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="chat-bubble-outline" size={26} color="white" /></Pressable>
            <Pressable onPress={() => openSheet('speed')} accessibilityRole="button" accessibilityLabel={`${language === 'es' ? 'Velocidad' : 'Playback speed'} ${playbackRate}×`} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="speed" size={26} color="white" /><Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{playbackRate}×</Text></Pressable>
          </View>
          </View>
        </View>
      </SafeAreaView>
      </Animated.View>
      <Modal visible={Boolean(sheet)} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable onPress={closeSheet} accessibilityLabel={language === 'es' ? 'Cerrar panel' : 'Close panel'} style={{ position: 'absolute', inset: 0 }} />
          <View style={{ maxHeight: '75%', borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: '#101b2d', padding: 22, paddingBottom: Math.max(insets.bottom, 20) }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 20 }}>{sheet === 'speed' ? (language === 'es' ? 'Velocidad de reproducción' : 'Playback speed') : detail.series.title}</Text>
            {sheet !== 'speed' ? <Text style={{ color: '#cbd5e1', marginTop: 8, marginBottom: 14 }}>{detail.series.synopsis}</Text> : null}
            <ScrollView style={{ flexShrink: 1 }} nestedScrollEnabled>
              {sheet === 'speed' ? PLAYBACK_RATES.map(rate => <Pressable key={rate} onPress={() => { setPlaybackRate(rate); closeSheet(); }} accessibilityRole="radio" accessibilityState={{ checked: playbackRate === rate }} accessibilityLabel={`${rate}×`} style={{ minHeight: 48, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: playbackRate === rate ? '#22d3ee' : 'white', fontSize: 17, fontWeight: playbackRate === rate ? '800' : '500' }}>{rate}×{rate === 1 ? ' (Normal)' : ''}</Text>{playbackRate === rate ? <MaterialIcons name="check" size={24} color="#22d3ee" /> : null}</Pressable>) : null}
              {sheet !== 'speed' ? <>
              {sheet === 'episodes' ? detail.episodes.map(item => <Pressable key={item.episodeId} onPress={() => selectEpisode(item)} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#334155', flexDirection: 'row', alignItems: 'center', gap: 12 }}><MaterialIcons name={item.episodeId === episode.episodeId ? 'play-circle-filled' : 'play-circle-outline'} color="#22d3ee" size={24} /><Text numberOfLines={2} style={{ flex: 1, color: 'white', fontSize: 15 }}>{item.episodeNumber}. {item.title}</Text></Pressable>) : detail.series.chatCharacters.map(character => <Pressable key={character.characterId} onPress={() => { closeSheet(); onStartConversation?.(character.characterId, episode, positionMs, wasPlayingRef.current); }} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#334155', flexDirection: 'row', alignItems: 'center', gap: 12 }}>{character.avatarXsUrl || character.avatarUrl ? <Image source={{ uri: character.avatarXsUrl || character.avatarUrl }} style={{ width: 42, height: 42, borderRadius: 21 }} /> : null}<Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Hablar con {character.name}</Text></Pressable>)}
              </> : null}
            </ScrollView>
            <Pressable onPress={closeSheet} style={{ alignItems: 'center', padding: 12 }}><Text style={{ color: '#94a3b8' }}>{language === 'es' ? 'Cerrar' : 'Close'}</Text></Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
