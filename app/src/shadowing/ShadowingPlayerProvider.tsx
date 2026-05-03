import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Audio } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import type { ShadowingChapter, ShadowingList } from '../hooks/useShadowing';

type SelectChapterOptions = {
  shouldPlay?: boolean;
};

type ShadowingPlayerContextValue = {
  currentChapter?: ShadowingChapter;
  activeAudioUrl?: string;
  positionSeconds: number;
  durationSeconds: number;
  isPlaying: boolean;
  audioLoading: boolean;
  audioError?: string;
  setQueue: (lists: ShadowingList[]) => void;
  selectChapter: (chapter: ShadowingChapter, options?: SelectChapterOptions) => void;
  playPause: () => Promise<void>;
  previewSeek: (seconds: number) => void;
  seek: (seconds: number) => Promise<void>;
  cancelSeek: () => void;
};

const ShadowingPlayerContext = createContext<ShadowingPlayerContextValue | undefined>(undefined);

function flattenLists(lists: ShadowingList[]) {
  return lists.flatMap((list) => list.chapters);
}

export function ShadowingPlayerProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const playAfterLoadRef = useRef(false);
  const userSeekingRef = useRef(false);
  const orderedChaptersRef = useRef<ShadowingChapter[]>([]);
  const currentChapterIdRef = useRef<string | undefined>(undefined);

  const [orderedChapters, setOrderedChapters] = useState<ShadowingChapter[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string>();
  const [positionSeconds, setPositionSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string>();

  const currentChapter = useMemo(
    () => orderedChapters.find((chapter) => chapter.chapterId === currentChapterId) || orderedChapters[0],
    [currentChapterId, orderedChapters],
  );

  const activeAudioUrl = currentChapter?.audioUrl;

  orderedChaptersRef.current = orderedChapters;
  currentChapterIdRef.current = currentChapter?.chapterId;

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

    if (status.didJustFinish && !playNextChapter()) {
      setIsPlaying(false);
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
    audioLoading,
    audioError,
    setQueue,
    selectChapter,
    playPause,
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
    playPause,
    positionSeconds,
    previewSeek,
    seek,
    selectChapter,
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
