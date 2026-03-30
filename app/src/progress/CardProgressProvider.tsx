import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthProvider';
import { fetchUserProgress, mergeUserProgress } from './remote';
import {
  areCardProgressDocumentsEqual,
  buildCardProgressState,
  emptyCardProgressDocument,
  mergeCardProgressDocuments,
  parseStoredCardProgressDocument,
  statusForCard,
} from './sync';
import type {
  CardProgressDocument,
  CardProgressState,
  CardProgressStatus,
  UserProgressRecord,
} from './types';

export type { CardProgressDocument, CardProgressState, CardProgressStatus } from './types';

type CardProgressContextValue = {
  loading: boolean;
  statuses: CardProgressState;
  statusFor: (cardId?: string | number | null) => CardProgressStatus;
  setStatus: (cardId: string, status: CardProgressStatus) => Promise<void>;
  resetAll: () => Promise<void>;
};

const STORAGE_KEY = '@luva/card-progress';

const CardProgressContext = createContext<CardProgressContextValue | undefined>(undefined);

export function CardProgressProvider({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, isSignedIn, user } = useAuth();
  const [document, setDocument] = useState<CardProgressDocument>(() => emptyCardProgressDocument());
  const [loading, setLoading] = useState(true);
  const documentRef = useRef<CardProgressDocument>(emptyCardProgressDocument());
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
  const syncedUserRef = useRef<string | undefined>(undefined);

  const applyDocument = useCallback((next: CardProgressDocument) => {
    documentRef.current = next;
    setDocument(next);
  }, []);

  const persist = useCallback(async (next: CardProgressDocument) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err: any) {
      console.warn('[CardProgress] No se pudo guardar el progreso:', err?.message || err);
    }
  }, []);

  const mergeRemoteCardsIntoLocal = useCallback(
    async (remoteCards: unknown) => {
      const merged = mergeCardProgressDocuments(documentRef.current, remoteCards);
      if (areCardProgressDocumentsEqual(merged, documentRef.current)) {
        return merged;
      }
      applyDocument(merged);
      await persist(merged);
      return merged;
    },
    [applyDocument, persist]
  );

  const enqueueRemoteMerge = useCallback(
    (progress: Partial<UserProgressRecord>) => {
      if (!isSignedIn || !user?.email) return;
      syncQueueRef.current = syncQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const remote = await mergeUserProgress(progress);
            await mergeRemoteCardsIntoLocal(remote.cards);
          } catch (err: any) {
            console.warn('[CardProgress] No se pudo sincronizar el progreso:', err?.message || err);
          }
        });
    },
    [isSignedIn, mergeRemoteCardsIntoLocal, user?.email]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : undefined;
        const next = parseStoredCardProgressDocument(parsed);
        if (!mounted) return;
        applyDocument(next);
      } catch (err: any) {
        console.warn('[CardProgress] No se pudo cargar el progreso:', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [applyDocument]);

  useEffect(() => {
    if (!isSignedIn) {
      syncedUserRef.current = undefined;
      return;
    }
    if (loading || authLoading || !user?.email || syncedUserRef.current === user.email) {
      return;
    }

    syncedUserRef.current = user.email;
    let cancelled = false;

    (async () => {
      try {
        const remote = await fetchUserProgress();
        if (cancelled) return;

        const localCards = documentRef.current;
        const merged = mergeCardProgressDocuments(localCards, remote.cards);

        if (!areCardProgressDocumentsEqual(merged, localCards)) {
          applyDocument(merged);
          await persist(merged);
        }

        if (!areCardProgressDocumentsEqual(merged, remote.cards)) {
          enqueueRemoteMerge({ cards: merged });
        }
      } catch (err: any) {
        console.warn('[CardProgress] No se pudo cargar el progreso remoto:', err?.message || err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, applyDocument, enqueueRemoteMerge, isSignedIn, loading, persist, user?.email]);

  const setStatus = useCallback(
    async (cardId: string, status: CardProgressStatus) => {
      const key = String(cardId || '').trim();
      if (!key) return;

      const currentEntry = documentRef.current.items[key];
      const currentStatus = currentEntry?.status ?? 'todo';
      if (currentStatus === status) return;

      const updatedAt = new Date().toISOString();
      const entry = { status, updatedAt };
      const next: CardProgressDocument = {
        ...documentRef.current,
        updatedAt,
        items: {
          ...documentRef.current.items,
          [key]: entry,
        },
      };

      applyDocument(next);
      await persist(next);

      if (isSignedIn && user?.email) {
        enqueueRemoteMerge({
          cards: {
            updatedAt,
            items: {
              [key]: entry,
            },
          },
        });
      }
    },
    [applyDocument, enqueueRemoteMerge, isSignedIn, persist, user?.email]
  );

  const resetAll = useCallback(async () => {
    const resetAt = new Date().toISOString();
    const next: CardProgressDocument = {
      updatedAt: resetAt,
      resetAt,
      items: {},
    };

    applyDocument(next);
    await persist(next);

    if (isSignedIn && user?.email) {
      enqueueRemoteMerge({ cards: next });
    }
  }, [applyDocument, enqueueRemoteMerge, isSignedIn, persist, user?.email]);

  const statuses = useMemo(() => buildCardProgressState(document), [document]);

  const value = useMemo<CardProgressContextValue>(
    () => ({
      loading,
      statuses,
      statusFor: (cardId?: string | number | null) => statusForCard(document, cardId),
      setStatus,
      resetAll,
    }),
    [document, loading, resetAll, setStatus, statuses]
  );

  return (
    <CardProgressContext.Provider value={value}>
      {children}
    </CardProgressContext.Provider>
  );
}

export function useCardProgress() {
  const ctx = useContext(CardProgressContext);
  if (!ctx) {
    throw new Error('useCardProgress debe usarse dentro de CardProgressProvider');
  }
  return ctx;
}

export const CARD_STATUS_LABELS: Record<CardProgressStatus, string> = {
  todo: 'Por aprender',
  learning: 'En aprendizaje',
  learned: 'Aprendida',
};
