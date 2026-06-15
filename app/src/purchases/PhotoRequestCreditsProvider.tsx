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
import { useRevenueCat } from './RevenueCatProvider';

const STORAGE_KEY = '@luva/photo-request-credits/state';
const FREE_PHOTO_REQUEST_CREDITS = 2;
const PRO_PHOTO_REQUEST_CREDITS = 20;
const PHOTO_REQUEST_REGEN_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

type PhotoRequestCreditsState = {
  spentAt: number[];
};

type PhotoRequestCreditsContextValue = {
  loading: boolean;
  balance: number;
  maxCredits: number;
  nextRegenAt: number | null;
  refreshPhotoRequestCredits: () => Promise<void>;
  resetPhotoRequestCredits: () => Promise<void>;
  canSpendPhotoRequestCredit: () => Promise<boolean>;
  spendPhotoRequestCredit: () => Promise<boolean>;
  refundPhotoRequestCredit: () => Promise<boolean>;
};

const PhotoRequestCreditsContext = createContext<PhotoRequestCreditsContextValue | undefined>(
  undefined
);

function sanitizeSpentAt(input: unknown, now: number) {
  const cutoff = now - PHOTO_REQUEST_REGEN_INTERVAL_MS;
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : Number(value);
      }
      return NaN;
    })
    .filter((value) => Number.isFinite(value) && value > cutoff && value <= now + 60_000)
    .sort((left, right) => left - right);
}

function sanitizeState(raw: any, now: number): PhotoRequestCreditsState {
  if (Array.isArray(raw)) {
    return { spentAt: sanitizeSpentAt(raw, now) };
  }
  if (!raw || typeof raw !== 'object') {
    return { spentAt: [] };
  }
  return { spentAt: sanitizeSpentAt(raw.spentAt, now) };
}

function pruneState(state: PhotoRequestCreditsState, now: number): PhotoRequestCreditsState {
  const spentAt = sanitizeSpentAt(state.spentAt, now);
  if (spentAt.length === state.spentAt.length && spentAt.every((value, index) => value === state.spentAt[index])) {
    return state;
  }
  return { spentAt };
}

function getBalance(spentAt: number[], maxCredits: number) {
  return Math.max(0, maxCredits - spentAt.length);
}

function getNextRegenAt(spentAt: number[], maxCredits: number) {
  if (!spentAt.length || getBalance(spentAt, maxCredits) >= maxCredits) {
    return null;
  }
  const nextPositiveCreditIndex = Math.max(0, spentAt.length - maxCredits);
  return spentAt[nextPositiveCreditIndex] + PHOTO_REQUEST_REGEN_INTERVAL_MS;
}

export function PhotoRequestCreditsProvider({ children }: { children: React.ReactNode }) {
  const { isPro, loading: revenueLoading } = useRevenueCat();
  const [state, setState] = useState<PhotoRequestCreditsState>({ spentAt: [] });
  const [loading, setLoading] = useState(true);
  const stateRef = useRef<PhotoRequestCreditsState>(state);

  const persist = useCallback(async (next: PhotoRequestCreditsState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err: any) {
      console.warn('[PhotoCredits] No se pudo guardar el estado:', err?.message || err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const sanitized = sanitizeState(parsed, Date.now());
        if (mounted) {
          setState(sanitized);
          stateRef.current = sanitized;
        }
        await persist(sanitized);
      } catch (err: any) {
        console.warn('[PhotoCredits] No se pudo cargar el estado:', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [persist]);

  const maxCredits = isPro ? PRO_PHOTO_REQUEST_CREDITS : FREE_PHOTO_REQUEST_CREDITS;

  const refreshPhotoRequestCredits = useCallback(async () => {
    const now = Date.now();
    setState((prev) => {
      const next = pruneState(prev, now);
      stateRef.current = next;
      if (next !== prev) void persist(next);
      return next;
    });
  }, [persist]);

  const resetPhotoRequestCredits = useCallback(async () => {
    const next: PhotoRequestCreditsState = { spentAt: [] };
    setState(next);
    stateRef.current = next;
    await persist(next);
  }, [persist]);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshPhotoRequestCredits();
    }, 60_000);
    return () => clearInterval(id);
  }, [refreshPhotoRequestCredits]);

  const canSpendPhotoRequestCredit = useCallback(async () => {
    const now = Date.now();
    const current = pruneState(stateRef.current, now);
    if (current !== stateRef.current) {
      setState(current);
      stateRef.current = current;
      await persist(current);
    }
    return getBalance(current.spentAt, maxCredits) > 0;
  }, [maxCredits, persist]);

  const spendPhotoRequestCredit = useCallback(async () => {
    const now = Date.now();
    const current = pruneState(stateRef.current, now);
    if (getBalance(current.spentAt, maxCredits) <= 0) {
      if (current !== stateRef.current) {
        setState(current);
        stateRef.current = current;
        await persist(current);
      }
      return false;
    }
    const next: PhotoRequestCreditsState = {
      spentAt: [...current.spentAt, now].sort((left, right) => left - right),
    };
    setState(next);
    stateRef.current = next;
    await persist(next);
    return true;
  }, [maxCredits, persist]);

  const refundPhotoRequestCredit = useCallback(async () => {
    const now = Date.now();
    const current = pruneState(stateRef.current, now);
    if (current.spentAt.length === 0) {
      if (current !== stateRef.current) {
        setState(current);
        stateRef.current = current;
        await persist(current);
      }
      return false;
    }
    const next: PhotoRequestCreditsState = {
      spentAt: current.spentAt.slice(0, -1),
    };
    setState(next);
    stateRef.current = next;
    await persist(next);
    return true;
  }, [persist]);

  const balance = getBalance(state.spentAt, maxCredits);
  const nextRegenAt = useMemo(
    () => getNextRegenAt(state.spentAt, maxCredits),
    [maxCredits, state.spentAt]
  );

  const value = useMemo<PhotoRequestCreditsContextValue>(
    () => ({
      loading: loading || revenueLoading,
      balance,
      maxCredits,
      nextRegenAt,
      refreshPhotoRequestCredits,
      resetPhotoRequestCredits,
      canSpendPhotoRequestCredit,
      spendPhotoRequestCredit,
      refundPhotoRequestCredit,
    }),
    [
      balance,
      canSpendPhotoRequestCredit,
      loading,
      maxCredits,
      nextRegenAt,
      refreshPhotoRequestCredits,
      resetPhotoRequestCredits,
      revenueLoading,
      spendPhotoRequestCredit,
      refundPhotoRequestCredit,
    ]
  );

  return (
    <PhotoRequestCreditsContext.Provider value={value}>
      {children}
    </PhotoRequestCreditsContext.Provider>
  );
}

export function usePhotoRequestCredits() {
  const ctx = useContext(PhotoRequestCreditsContext);
  if (!ctx) {
    throw new Error('usePhotoRequestCredits debe usarse dentro de PhotoRequestCreditsProvider');
  }
  return ctx;
}
