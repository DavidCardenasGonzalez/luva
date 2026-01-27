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

const STORAGE_KEY = '@luva/coins/state';
const MAX_FREE_COINS = 50;
const REGEN_INTERVAL_MS = 60 * 60 * 1000;

export const CHAT_MISSION_COST = 5;
export const CARD_OPEN_COST = 1;

type CoinsState = {
  balance: number;
  lastUpdated: number;
};

type CoinsContextValue = {
  loading: boolean;
  balance: number;
  maxCoins: number;
  isUnlimited: boolean;
  nextRegenAt: number | null;
  refreshBalance: () => Promise<void>;
  canSpend: (amount: number) => Promise<boolean>;
  spendCoins: (amount: number, reason?: string) => Promise<boolean>;
  resetCoins: () => Promise<void>;
};

const CoinsContext = createContext<CoinsContextValue | undefined>(undefined);

const sanitizeState = (raw: any): CoinsState => {
  const fallback: CoinsState = { balance: MAX_FREE_COINS, lastUpdated: Date.now() };
  if (!raw || typeof raw !== 'object') return fallback;
  const balance = Number.isFinite(raw.balance) ? Math.max(0, Math.min(MAX_FREE_COINS, Number(raw.balance))) : MAX_FREE_COINS;
  const lastUpdated = Number.isFinite(raw.lastUpdated) ? Number(raw.lastUpdated) : Date.now();
  return { balance, lastUpdated };
};

const applyRegen = (state: CoinsState, now: number): CoinsState => {
  if (state.balance >= MAX_FREE_COINS) {
    if (state.lastUpdated === now) return state;
    return { balance: state.balance, lastUpdated: now };
  }
  const elapsed = now - state.lastUpdated;
  const steps = Math.floor(elapsed / REGEN_INTERVAL_MS);
  if (steps <= 0) return state;
  const nextBalance = Math.min(MAX_FREE_COINS, state.balance + steps);
  const nextUpdated = state.lastUpdated + steps * REGEN_INTERVAL_MS;
  return { balance: nextBalance, lastUpdated: nextUpdated };
};

export function CoinBalanceProvider({ children }: { children: React.ReactNode }) {
  const { isPro, loading: revenueLoading } = useRevenueCat();
  const [state, setState] = useState<CoinsState>({ balance: MAX_FREE_COINS, lastUpdated: Date.now() });
  const [loading, setLoading] = useState(true);
  const stateRef = useRef<CoinsState>(state);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        const sanitized = sanitizeState(parsed);
        const hydrated = applyRegen(sanitized, Date.now());
        if (mounted) {
          setState(hydrated);
          stateRef.current = hydrated;
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
      } catch (err: any) {
        console.warn('[Coins] No se pudo cargar el estado de monedas:', err?.message || err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: CoinsState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err: any) {
      console.warn('[Coins] No se pudo guardar el estado de monedas:', err?.message || err);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (isPro) return;
    const now = Date.now();
    setState((prev) => {
      const next = applyRegen(prev, now);
      stateRef.current = next;
      if (next !== prev) void persist(next);
      return next;
    });
  }, [isPro, persist]);

  useEffect(() => {
    if (isPro) return;
    const id = setInterval(() => {
      const now = Date.now();
      setState((prev) => {
        const next = applyRegen(prev, now);
        stateRef.current = next;
        if (next !== prev) void persist(next);
        return next;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [isPro, persist]);

  const spendCoins = useCallback(
    async (amount: number, reason?: string) => {
      if (amount <= 0) return true;
      if (isPro) return true;
      const now = Date.now();
      const current = applyRegen(stateRef.current, now);
      if (current !== stateRef.current) {
        setState(current);
        stateRef.current = current;
        await persist(current);
      }
      if (current.balance < amount) {
        return false;
      }
      const next: CoinsState = {
        balance: current.balance - amount,
        lastUpdated: now,
      };
      setState(next);
      stateRef.current = next;
      await persist(next);
      if (__DEV__) {
        console.log('[Coins] Gasto registrado', { amount, reason, balance: next.balance });
      }
      return true;
    },
    [isPro, persist]
  );

  const resetCoins = useCallback(async () => {
    const now = Date.now();
    const fresh: CoinsState = { balance: MAX_FREE_COINS, lastUpdated: now };
    setState(fresh);
    stateRef.current = fresh;
    await persist(fresh);
  }, [persist]);

  const canSpend = useCallback(
    async (amount: number) => {
      if (amount <= 0) return true;
      if (isPro) return true;
      const now = Date.now();
      const current = applyRegen(stateRef.current, now);
      if (current !== stateRef.current) {
        setState(current);
        stateRef.current = current;
        await persist(current);
      }
      return current.balance >= amount;
    },
    [isPro, persist]
  );

  const nextRegenAt = useMemo(() => {
    if (isPro || state.balance >= MAX_FREE_COINS) return null;
    return state.lastUpdated + REGEN_INTERVAL_MS;
  }, [isPro, state.balance, state.lastUpdated]);

  const value = useMemo<CoinsContextValue>(
    () => ({
      loading: loading || revenueLoading,
      balance: isPro ? MAX_FREE_COINS : state.balance,
      maxCoins: MAX_FREE_COINS,
      isUnlimited: isPro,
      nextRegenAt,
      refreshBalance,
      canSpend,
      spendCoins,
      resetCoins,
    }),
    [canSpend, isPro, loading, nextRegenAt, refreshBalance, resetCoins, revenueLoading, spendCoins, state.balance]
  );

  return <CoinsContext.Provider value={value}>{children}</CoinsContext.Provider>;
}

export function useCoins() {
  const ctx = useContext(CoinsContext);
  if (!ctx) {
    throw new Error('useCoins debe usarse dentro de CoinBalanceProvider');
  }
  return ctx;
}
