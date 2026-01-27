import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CardProgressStatus = 'todo' | 'learning' | 'learned';
export type CardProgressState = Record<string, CardProgressStatus>;

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
  const [statuses, setStatuses] = useState<CardProgressState>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && mounted) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            setStatuses(parsed as CardProgressState);
          }
        }
      } catch (err: any) {
        console.warn('[CardProgress] No se pudo cargar el progreso:', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: CardProgressState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err: any) {
      console.warn('[CardProgress] No se pudo guardar el progreso:', err?.message || err);
    }
  }, []);

  const setStatus = useCallback(
    async (cardId: string, status: CardProgressStatus) => {
      let nextState: CardProgressState = {};
      setStatuses((prev) => {
        const next = { ...prev };
        if (status === 'todo') {
          delete next[cardId];
        } else {
          next[cardId] = status;
        }
        nextState = next;
        return next;
      });
      await persist(nextState);
    },
    [persist]
  );

  const value = useMemo<CardProgressContextValue>(
    () => ({
      loading,
      statuses,
      statusFor: (cardId?: string | number | null) => {
        if (cardId === undefined || cardId === null) return 'todo';
        const key = String(cardId);
        return statuses[key] ?? 'todo';
      },
      setStatus,
      resetAll: async () => {
        setStatuses({});
        await persist({});
      },
    }),
    [loading, persist, statuses, setStatus]
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
