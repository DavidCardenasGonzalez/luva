import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import type { ShadowingChapter, ShadowingList } from '../hooks/useShadowing';
import {
  getListenedShadowingChapterIds,
  recordJourneyShadowingChapterListened,
} from '../progress/journeyProgress';

type SelectChapterOptions = {
  shouldPlay?: boolean;
};

type ShadowingPlayerContextValue = {
  currentChapter?: ShadowingChapter;
  activeAudioUrl?: string;
  positionSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
  playbackRate: number;
  audioLoading: boolean;
  audioError?: string;
  listenedChapterIds: Set<string>;
  setQueue: (lists: ShadowingList[]) => void;
  selectChapter: (chapter: ShadowingChapter, options?: SelectChapterOptions) => void;
  playPause: () => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;
  previewSeek: (seconds: number) => void;
  seek: (seconds: number) => Promise<void>;
  cancelSeek: () => void;
};

const ShadowingPlayerContext = createContext<ShadowingPlayerContextValue | undefined>(undefined);
const PLAYBACK_RATE_STORAGE_KEY = 'luva.shadowing.playbackRate';
const MIN_PLAYBACK_RATE = 0.5;
const MAX_PLAYBACK_RATE = 2;

function flattenLists(lists: ShadowingList[]) {
  return lists.flatMap((list) => list.chapters);
}

function normalizePlaybackRate(rate: number) {
  return Math.max(MIN_PLAYBACK_RATE, Math.min(MAX_PLAYBACK_RATE, rate));
}

export function ShadowingPlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const playAfterLoadRef = useRef(false);
  const userSeekingRef = useRef(false);
  const orderedChaptersRef = useRef<ShadowingChapter[]>([]);
  const currentChapterIdRef = useRef<string | undefined>(undefined);
  const playbackRateRef = useRef(1);

  const [orderedChapters, setOrderedChapters] = useState<ShadowingChapter[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string>();
  const [positionSeconds, setPositionSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string>();
  const [listenedChapterIds, setListenedChapterIds] = useState<Set<string>>(() => new Set());

  const currentChapter = useMemo(
    () => orderedChapters.find((chapter) => chapter.chapterId === currentChapterId) || orderedChapters[0],
    [currentChapterId, orderedChapters],
  );

  const activeAudioUrl = currentChapter?.audioUrl;

  orderedChaptersRef.current = orderedChapters;
  currentChapterIdRef.current = currentChapter?.chapterId;
  playbackRateRef.current = playbackRate;

  useEffect(() => {
    if (!currentChapterId && orderedChapters[0]) {
      setCurrentChapterId(orderedChapters[0].chapterId);
      return;
    }

    if (
      currentChapterId &&
      orderedChapters.length > 0 &&
      !orderedChapters.some((chapter) => chapter.chapterId === currentChapterId)
    ) {
      setCurrentChapterId(orderedChapters[0].chapterId);
    }
  }, [currentChapterId, orderedChapters]);

  const setQueue = useCallback((lists: ShadowingList[]) => {
    setOrderedChapters(flattenLists(lists));
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PLAYBACK_RATE_STORAGE_KEY);
        const parsed = raw == null ? Number.NaN : Number(raw);
        if (!cancelled && Number.isFinite(parsed)) {
          setPlaybackRateState(normalizePlaybackRate(parsed));
        }
      } catch {
        // Keep default speed if storage is unavailable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ids = await getListenedShadowingChapterIds();
      if (!cancelled) {
        setListenedChapterIds(ids);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const playNextChapter = useCallback(() => {
    const chapters = orderedChaptersRef.current;
    const currentId = currentChapterIdRef.current;
    const selectedIndex = chapters.findIndex((chapter) => chapter.chapterId === currentId);
    const nextChapter = selectedIndex >= 0 ? chapters[selectedIndex + 1] : undefined;

    if (!nextChapter) return false;

    playAfterLoadRef.current = true;
    setCurrentChapterId(nextChapter.chapterId);
    return true;
  }, []);

  const handlePlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }

    if (!userSeekingRef.current) {
      setPositionSeconds(status.positionMillis / 1000);
    }
    setIsPlaying(status.isPlaying);
    if (status.durationMillis != null) {
      setDurationSeconds(status.durationMillis / 1000);
    }

    if (status.didJustFinish) {
      const finishedChapterId = currentChapterIdRef.current;
      void recordJourneyShadowingChapterListened(finishedChapterId);
      if (finishedChapterId) {
        setListenedChapterIds((current) => {
          if (current.has(finishedChapterId)) return current;
          const next = new Set(current);
          next.add(finishedChapterId);
          return next;
        });
      }
      if (!playNextChapter()) {
        setIsPlaying(false);
      }
    }
  }, [playNextChapter]);

  useEffect(() => {
    let cancelled = false;

    async function loadSound() {
      setAudioError(undefined);
      setPositionSeconds(0);
      setDurationSeconds(currentChapter?.durationSeconds || 0);
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
        const shouldPlayAfterLoad = playAfterLoadRef.current;
        playAfterLoadRef.current = false;
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: activeAudioUrl },
          { shouldPlay: shouldPlayAfterLoad, progressUpdateIntervalMillis: 250 },
          handlePlaybackStatus,
        );
        if (cancelled) {
          await sound.unloadAsync().catch(() => undefined);
          return;
        }
        soundRef.current = sound;
        if (Math.abs(playbackRateRef.current - 1) > 0.01) {
          void sound.setRateAsync(playbackRateRef.current, true).catch(() => undefined);
        }
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
    };
  }, [activeAudioUrl, currentChapter?.durationSeconds, handlePlaybackStatus]);

  useEffect(() => () => {
    void soundRef.current?.unloadAsync().catch(() => undefined);
    soundRef.current = null;
  }, []);

  useEffect(() => {
    void soundRef.current?.setRateAsync(playbackRate, true).catch(() => undefined);
  }, [playbackRate]);

  const selectChapter = useCallback((chapter: ShadowingChapter, options?: SelectChapterOptions) => {
    playAfterLoadRef.current = Boolean(options?.shouldPlay);
    setCurrentChapterId(chapter.chapterId);
  }, []);

  const playPause = useCallback(async () => {
    if (!soundRef.current || audioLoading) return;
    if (isPlaying) await soundRef.current.pauseAsync();
    else {
      if (durationSeconds > 0 && positionSeconds >= durationSeconds - 0.25) {
        await soundRef.current.setPositionAsync(0);
      }
      await soundRef.current.playAsync();
    }
  }, [audioLoading, durationSeconds, isPlaying, positionSeconds]);

  const setPlaybackRate = useCallback(async (rate: number) => {
    const normalizedRate = normalizePlaybackRate(rate);
    setPlaybackRateState(normalizedRate);
    await soundRef.current?.setRateAsync(normalizedRate, true);
    await AsyncStorage.setItem(PLAYBACK_RATE_STORAGE_KEY, String(normalizedRate)).catch(() => undefined);
  }, []);

  const previewSeek = useCallback((seconds: number) => {
    userSeekingRef.current = true;
    setPositionSeconds(Math.max(0, seconds));
  }, []);

  const seek = useCallback(async (seconds: number) => {
    const nextSeconds = Math.max(0, seconds);
    setPositionSeconds(nextSeconds);

    try {
      await soundRef.current?.setPositionAsync(nextSeconds * 1000);
    } finally {
      userSeekingRef.current = false;
    }
  }, []);

  const cancelSeek = useCallback(() => {
    userSeekingRef.current = false;
  }, []);

  const value = useMemo<ShadowingPlayerContextValue>(() => ({
    currentChapter,
    activeAudioUrl,
    positionSeconds,
    durationSeconds,
    isPlaying,
    playbackRate,
    audioLoading,
    audioError,
    listenedChapterIds,
    setQueue,
    selectChapter,
    playPause,
    setPlaybackRate,
    previewSeek,
    seek,
    cancelSeek,
  }), [
    activeAudioUrl,
    audioError,
    audioLoading,
    cancelSeek,
    currentChapter,
    durationSeconds,
    isPlaying,
    listenedChapterIds,
    playbackRate,
    playPause,
    positionSeconds,
    previewSeek,
    seek,
    selectChapter,
    setPlaybackRate,
    setQueue,
  ]);

  return (
    <ShadowingPlayerContext.Provider value={value}>
      {children}
    </ShadowingPlayerContext.Provider>
  );
}

export function useShadowingPlayer() {
  const context = useContext(ShadowingPlayerContext);
  if (!context) {
    throw new Error('useShadowingPlayer must be used inside ShadowingPlayerProvider');
  }
  return context;
}
