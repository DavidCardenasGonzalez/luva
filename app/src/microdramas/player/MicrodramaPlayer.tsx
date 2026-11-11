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
import SelectableSubtitle from './SelectableSubtitle';
import SaveReviewButton from '../../review/SaveReviewButton';
import SeriesCompletion from './SeriesCompletion';
import { useVideoSoundPreference } from '../../shared/useVideoSoundPreference';
import MicrodramaTour from '../MicrodramaTour';
import { useMicrodramaTour } from '../../tour/useMicrodramaTour';

const PLAYBACK_RATES = [0.5, 0.75, 0.9, 1, 1.25, 1.5, 2];

type Props = {
  detail: MicrodramaDetail;
  active: boolean;
  initialEpisodeId?: string;
  initialPositionMs?: number;
  watchedEpisodes?: Record<string, boolean>;
  onProgress?: (episode: MicrodramaEpisode, positionMs: number, event?: 'position' | 'watched' | 'ended') => void;
  onEpisodeChange?: (episode: MicrodramaEpisode) => void;
  onStartConversation?: (characterId: string, episode: MicrodramaEpisode, positionMs: number, wasPlaying: boolean) => void;
  onBack?: () => void;
  onSubtitleGestureChange?: (selecting: boolean) => void;
  bottomInsetExtra?: number;
};

export default function MicrodramaPlayer({
  detail, active, initialEpisodeId, initialPositionMs = 0, watchedEpisodes = {}, onProgress, onEpisodeChange,
  onStartConversation, onBack, onSubtitleGestureChange, bottomInsetExtra = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { supportLanguage, language, t } = useLanguage();
  const videoRef = useRef<Video | null>(null);
  const rewindQueueRef = useRef<{ video: Video; tail: Promise<void> } | null>(null);
  const initialApplied = useRef(false);
  const endedEpisodeRef = useRef<string | undefined>(undefined);
  const wasPlayingRef = useRef(false);
  const lastSaveAtRef = useRef(0);
  const watchedTimeRef = useRef(0);
  const lastPlayingStatusRef = useRef<{ position: number; time: number } | undefined>(undefined);
  const reportedWatchedRef = useRef(false);
  const pendingAdvanceRef = useRef<MicrodramaEpisode | undefined>(undefined);
  const selectingSubtitleRef = useRef(false);
  const [episodeId, setEpisodeId] = useState(initialEpisodeId || detail.episodes[0]?.episodeId);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [paused, setPaused] = useState(false);
  const { isMuted, toggleMuted } = useVideoSoundPreference();
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
  const subtitleTour = useMicrodramaTour('dramasSubtitles', active, ready && Boolean(activeSubtitle) && !sheet && !finished);
  const tourCaption = useRef<string | undefined>(undefined);
  if (!subtitleTour.visible) tourCaption.current = activeSubtitle;

  useEffect(() => {
    void Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => undefined);
  }, []);

  useEffect(() => {
    initialApplied.current = false;
    endedEpisodeRef.current = undefined;
    lastSaveAtRef.current = 0;
    watchedTimeRef.current = 0;
    lastPlayingStatusRef.current = undefined;
    reportedWatchedRef.current = false;
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
    if (!active || !ready || sheet || paused || finished || subtitleTour.visible || AppState.currentState !== 'active') {
      void videoRef.current?.pauseAsync().catch(() => undefined);
      return;
    }
    void videoRef.current?.playAsync().catch(() => setPaused(true));
  }, [active, paused, ready, sheet, finished, subtitleTour.visible]);

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
    enabled: active && !sheet && !finished && !subtitleTour.visible,
    canStartSwipe: () => !selectingSubtitleRef.current,
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

  const pauseForSubtitle = useCallback(() => {
    setPaused(true);
    void videoRef.current?.pauseAsync().catch(() => undefined);
  }, []);
  const handleSubtitleGestureChange = useCallback((selecting: boolean) => {
    selectingSubtitleRef.current = selecting;
    onSubtitleGestureChange?.(selecting);
  }, [onSubtitleGestureChange]);
  const translation = useSubtitleTranslation({
    episodeId: episode?.episodeId,
    subtitle: subtitleTour.visible ? tourCaption.current : activeSubtitle,
    supportLanguage,
    paused,
    onPause: pauseForSubtitle,
  });

  const rewindThreeSeconds = useCallback(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    let queue = rewindQueueRef.current;
    if (queue?.video !== video) {
      queue = { video, tail: Promise.resolve() };
      rewindQueueRef.current = queue;
    }

    // Wait for the previous rewind before reading the native playback position.
    queue.tail = queue.tail.then(async () => {
      if (rewindQueueRef.current !== queue || videoRef.current !== video) return;
      const status = await video.getStatusAsync();
      if (!status.isLoaded || rewindQueueRef.current !== queue || videoRef.current !== video) return;
      const target = Math.max(0, status.positionMillis - 3000);
      translation.clear();
      endedEpisodeRef.current = undefined;
      setFinished(false);
      setPositionMs(target);
      await video.setPositionAsync(target, { toleranceMillisBefore: 0, toleranceMillisAfter: 0 });
    }).catch(() => undefined);
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
    const now = Date.now();
    const previous = lastPlayingStatusRef.current;
    if (status.isPlaying && active && AppState.currentState === 'active') {
      if (previous) {
        const elapsed = now - previous.time;
        const advanced = nextPosition - previous.position;
        // Ignore seeks and long gaps between native status updates.
        if (elapsed > 0 && elapsed <= 2000 && advanced > 0 && advanced <= elapsed * playbackRate + 500) {
          watchedTimeRef.current += Math.min(elapsed, advanced / playbackRate);
        }
      }
      lastPlayingStatusRef.current = { position: nextPosition, time: now };
    } else {
      lastPlayingStatusRef.current = undefined;
    }
    if (episode && watchedTimeRef.current >= 30000 && !reportedWatchedRef.current && !watchedEpisodes[episode.episodeId]) {
      reportedWatchedRef.current = true;
      onProgress?.(episode, nextPosition, 'watched');
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
  }, [detail.episodes, episode, episodeIndex, initialEpisodeId, initialPositionMs, onProgress, selectEpisode, active, playbackRate, watchedEpisodes]);

  const seekResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: event => {
      if (!durationMs) return;
      rewindQueueRef.current = null;
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
    const firstEpisode = detail.episodes[0];
    if (!firstEpisode) return;
    rewindQueueRef.current = null;
    translation.clear();
    selectEpisode(firstEpisode);
    endedEpisodeRef.current = undefined;
    setPositionMs(0);
    // A one-episode series keeps the same Video instance and needs an explicit seek.
    if (firstEpisode.episodeId === episode?.episodeId) {
      void videoRef.current?.setPositionAsync(0).catch(() => undefined);
    }
  }, [detail.episodes, episode?.episodeId, selectEpisode, translation.clear]);

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
        shouldPlay={active && ready && !paused && !sheet && !finished && !subtitleTour.visible && AppState.currentState === 'active'}
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
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Volver' : 'Go back'} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <MaterialIcons name="arrow-back" size={26} color="white" />
          </Pressable>
          <Pressable onPress={(event) => { event.stopPropagation(); toggleMuted(); }} accessibilityRole="button" accessibilityLabel={isMuted ? (language === 'es' ? 'Activar sonido' : 'Unmute video') : (language === 'es' ? 'Silenciar video' : 'Mute video')} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={24} color="white" />
          </Pressable>
        </View>
        <View pointerEvents="box-none" style={{ marginBottom: bottomInsetExtra }}>
          <View style={{ alignItems: 'center', marginHorizontal: 28, marginBottom: 36 }}>
          {translation.displayedSubtitle ? <View style={{ width: '100%', padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.48)' }}>
            <SelectableSubtitle
              key={`${episode.episodeId}:${supportLanguage}:${translation.displayedSubtitle}`}
              subtitle={translation.displayedSubtitle}
              range={translation.range}
              disabled={!active || !ready || Boolean(sheet)}
              onHold={translation.hold}
              onTranslate={translation.translate}
              onGestureChange={handleSubtitleGestureChange}
            />
            <Text style={{ color: '#e2e8f0', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
              {t('subtitles.selectionHint')}
            </Text>
            <Pressable onPress={() => void translation.translate()} disabled={translation.loading} accessibilityRole="button" style={{ flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, marginTop: 4 }}>
              {translation.loading ? <ActivityIndicator size="small" color="#86efac" /> : <MaterialIcons name="translate" size={18} color="#86efac" />}
              <Text style={{ color: '#86efac', fontWeight: '700' }}>{t(translation.loading ? 'subtitles.translating' : 'subtitles.translateAll')}</Text>
            </Pressable>
            {translation.translatedText ? <Text accessibilityLiveRegion="polite" style={{ color: '#86efac', fontSize: 16, textAlign: 'center', marginTop: 4 }}>{translation.selectedText !== translation.displayedSubtitle ? `${translation.selectedText}: ` : ''}{translation.translatedText}</Text> : null}
            {translation.translatedText && translation.selectedText ? (
              <SaveReviewButton
                key={`${episode.episodeId}:${translation.selectedText}:${supportLanguage}`}
                originalText={translation.selectedText}
                translatedText={translation.translatedText}
                targetLanguage={supportLanguage}
                contextText={translation.displayedSubtitle}
                source={{ type: 'microdrama', seriesId: detail.series.seriesId, episodeId: episode.episodeId, positionMs, title: `${detail.series.title} · ${episode.title}` }}
              />
            ) : null}
            {translation.error ? (
              <Pressable accessibilityRole="button" onPress={() => void translation.translate(translation.selectedText, translation.range)} style={{ paddingVertical: 8 }}>
                <Text style={{ color: '#fca5a5', fontSize: 14, textAlign: 'center' }}>{t('subtitles.translationErrorRetry')}</Text>
              </Pressable>
            ) : null}
          </View> : null}
          </View>
          <View style={{ alignItems: 'center', paddingHorizontal: 28, paddingTop: 12, paddingBottom: bottomInsetExtra > 0 ? 16 : Math.max(insets.bottom, 16), backgroundColor: 'rgba(0,0,0,0.24)' }}>
          <View style={{ width: '100%', paddingBottom: 4 }}>
            <Text numberOfLines={1} style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>{detail.series.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Text numberOfLines={1} style={{ color: '#e2e8f0', fontSize: 14, flexShrink: 1 }}>{episode.title}</Text>{watchedEpisodes[episode.episodeId] ? <View accessibilityLabel={t('microdrama.watched')} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(6,78,59,0.9)', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 }}><MaterialIcons name="check-circle" size={14} color="#a7f3d0" /><Text style={{ color: '#d1fae5', fontSize: 11, fontWeight: '800' }}>{t('microdrama.watched')}</Text></View> : null}</View>
          </View>
          <View style={{ width: '100%', paddingVertical: 8 }} {...seekResponder.panHandlers}>
            <View style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' }}><View style={{ height: 5, width: `${progressRatio * 100}%`, backgroundColor: '#22d3ee', borderRadius: 3 }} /></View>
          </View>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <Pressable onPress={() => void rewindThreeSeconds()} disabled={!ready} accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Retroceder 3 segundos' : 'Rewind 3 seconds'} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.5 }}><View style={{ alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="replay" size={28} color="white" /><Text style={{ position: 'absolute', color: 'white', fontSize: 9, fontWeight: '800', marginTop: 1 }}>3</Text></View></Pressable>
            <Pressable onPress={() => openSheet('episodes')} accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Episodios' : 'Episodes'} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="list" size={28} color="white" /></Pressable>
            <Pressable onPress={() => setPaused(value => !value)} accessibilityRole="button" accessibilityLabel={paused ? (language === 'es' ? 'Reproducir' : 'Play') : (language === 'es' ? 'Pausar' : 'Pause')} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name={paused ? 'play-arrow' : 'pause'} size={40} color="white" /></Pressable>
            <Pressable onPress={() => openSheet('characters')} accessibilityRole="button" accessibilityLabel={language === 'es' ? 'Personajes' : 'Characters'} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="chat-bubble-outline" size={26} color="white" /></Pressable>
            <Pressable onPress={() => openSheet('speed')} accessibilityRole="button" accessibilityLabel={`${language === 'es' ? 'Velocidad' : 'Playback speed'} ${playbackRate}×`} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><MaterialIcons name="speed" size={26} color="white" /><Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{playbackRate}×</Text></Pressable>
          </View>
          </View>
        </View>
      </SafeAreaView>
      </Animated.View>
      {finished ? <SeriesCompletion
        series={detail.series}
        bottomInsetExtra={bottomInsetExtra}
        onTalk={characterId => onStartConversation?.(characterId, episode, durationMs || episode.durationMs, false)}
        onReplay={replaySeries}
        onBack={onBack}
      /> : null}
      <Modal visible={Boolean(sheet)} transparent animationType="slide" onRequestClose={closeSheet}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Pressable onPress={closeSheet} accessibilityLabel={language === 'es' ? 'Cerrar panel' : 'Close panel'} style={{ position: 'absolute', inset: 0 }} />
          <View style={{ maxHeight: '75%', borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: '#101b2d', padding: 22, paddingBottom: Math.max(insets.bottom, 20) }}>
            <Text style={{ color: 'white', fontWeight: '900', fontSize: 20 }}>{sheet === 'speed' ? (language === 'es' ? 'Velocidad de reproducción' : 'Playback speed') : detail.series.title}</Text>
            {sheet !== 'speed' ? <Text style={{ color: '#cbd5e1', marginTop: 8, marginBottom: 14 }}>{detail.series.synopsis}</Text> : null}
            <ScrollView style={{ flexShrink: 1 }} nestedScrollEnabled>
              {sheet === 'speed' ? PLAYBACK_RATES.map(rate => <Pressable key={rate} onPress={() => { setPlaybackRate(rate); closeSheet(); }} accessibilityRole="radio" accessibilityState={{ checked: playbackRate === rate }} accessibilityLabel={`${rate}×`} style={{ minHeight: 48, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Text style={{ color: playbackRate === rate ? '#22d3ee' : 'white', fontSize: 17, fontWeight: playbackRate === rate ? '800' : '500' }}>{rate}×{rate === 1 ? ' (Normal)' : ''}</Text>{playbackRate === rate ? <MaterialIcons name="check" size={24} color="#22d3ee" /> : null}</Pressable>) : null}
              {sheet !== 'speed' ? <>
              {sheet === 'episodes' ? detail.episodes.map(item => <Pressable key={item.episodeId} onPress={() => selectEpisode(item)} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#334155', flexDirection: 'row', alignItems: 'center', gap: 12 }}><MaterialIcons name={item.episodeId === episode.episodeId ? 'play-circle-filled' : 'play-circle-outline'} color="#22d3ee" size={24} /><Text numberOfLines={2} style={{ flex: 1, color: 'white', fontSize: 15 }}>{item.episodeNumber}. {item.title}</Text>{watchedEpisodes[item.episodeId] ? <View accessibilityLabel={t('microdrama.watched')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><MaterialIcons name="check-circle" size={18} color="#6ee7b7" /><Text style={{ color: '#a7f3d0', fontSize: 12, fontWeight: '700' }}>{t('microdrama.watched')}</Text></View> : null}</Pressable>) : detail.series.chatCharacters.map(character => <Pressable key={character.characterId} onPress={() => { closeSheet(); onStartConversation?.(character.characterId, episode, positionMs, wasPlayingRef.current); }} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#334155', flexDirection: 'row', alignItems: 'center', gap: 12 }}>{character.avatarXsUrl || character.avatarUrl ? <Image source={{ uri: character.avatarXsUrl || character.avatarUrl }} style={{ width: 42, height: 42, borderRadius: 21 }} /> : null}<Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>{t('microdrama.talkTo', { name: character.name })}</Text></Pressable>)}
              </> : null}
            </ScrollView>
            <Pressable onPress={closeSheet} style={{ alignItems: 'center', padding: 12 }}><Text style={{ color: '#94a3b8' }}>{language === 'es' ? 'Cerrar' : 'Close'}</Text></Pressable>
          </View>
        </View>
      </Modal>
      {subtitleTour.visible ? <MicrodramaTour
        kind="subtitles"
        subtitle={tourCaption.current}
        onDismiss={subtitleTour.dismiss}
        onTry={() => {
          translation.hold();
          subtitleTour.dismiss();
        }}
      /> : null}
    </View>
  );
}
