import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';
import { shouldRecordLikes } from '../config/likeRecording';

const STORAGE_KEY_PREFIX = 'character-post-like:';

function storageKey(characterId: string, postId: string): string {
  return `${STORAGE_KEY_PREFIX}${characterId}:${postId}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getDisplayedLikeCount(
  postId: string,
  serverLikeCount: number,
  userLiked: boolean,
): number {
  const base = Math.max(0, Math.floor(serverLikeCount));
  const stableRandom = (hashString(postId) % 100) + 1;
  return base * 100 + stableRandom + (userLiked ? 1 : 0);
}

export function formatLikeCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  }
  return String(value);
}

type IncrementResponse = {
  likeCount?: number;
};

export function useCharacterPostLike(
  characterId: string,
  postId: string,
  initialServerLikeCount: number,
) {
  const [serverLikeCount, setServerLikeCount] = useState(initialServerLikeCount);
  const [userLiked, setUserLiked] = useState(false);
  const hasIncrementedRef = useRef(false);

  useEffect(() => {
    setServerLikeCount(initialServerLikeCount);
  }, [initialServerLikeCount]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey(characterId, postId));
        if (cancelled) return;
        if (raw === '1') {
          setUserLiked(true);
          hasIncrementedRef.current = true;
        }
      } catch {
        // best effort; missing storage is fine
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [characterId, postId]);

  const persistUserLiked = useCallback(
    async (liked: boolean) => {
      try {
        if (liked) {
          await AsyncStorage.setItem(storageKey(characterId, postId), '1');
        } else {
          await AsyncStorage.removeItem(storageKey(characterId, postId));
        }
      } catch {
        // ignore
      }
    },
    [characterId, postId],
  );

  const incrementServer = useCallback(async () => {
    if (hasIncrementedRef.current) return;
    hasIncrementedRef.current = true;
    if (!shouldRecordLikes()) return;
    try {
      const response = await api.post<IncrementResponse>(
        `/feed/character-videos/${encodeURIComponent(characterId)}/${encodeURIComponent(postId)}/like`,
        {},
      );
      if (typeof response?.likeCount === 'number' && Number.isFinite(response.likeCount)) {
        setServerLikeCount(Math.max(0, Math.floor(response.likeCount)));
      }
    } catch {
      // swallow — UI already shows optimistic state
    }
  }, [characterId, postId]);

  const ensureLiked = useCallback(() => {
    if (!userLiked) {
      setUserLiked(true);
      void persistUserLiked(true);
    }
    void incrementServer();
  }, [incrementServer, persistUserLiked, userLiked]);

  const toggleLike = useCallback(() => {
    setUserLiked((current) => {
      const next = !current;
      void persistUserLiked(next);
      if (next) {
        void incrementServer();
      }
      return next;
    });
  }, [incrementServer, persistUserLiked]);

  const displayedCount = getDisplayedLikeCount(postId, serverLikeCount, userLiked);

  return {
    userLiked,
    displayedCount,
    displayedLabel: formatLikeCount(displayedCount),
    toggleLike,
    ensureLiked,
  };
}
