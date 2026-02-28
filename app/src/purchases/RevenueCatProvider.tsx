import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';

type RevenueCatContextValue = {
  customerInfo?: CustomerInfo;
  isPro: boolean;
  loading: boolean;
  manualProExpiration: number | null;
  refreshCustomerInfo: () => Promise<CustomerInfo | undefined>;
  clearManualProAccess: () => Promise<void>;
  redeemPromoCode: (
    code: string
  ) => Promise<{ success: boolean; expiresAt?: number; premiumDays?: number; reason?: 'not_found' | 'error' }>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);
const extra = Constants.expoConfig?.extra || {};
const IOS_API_KEY: string | undefined = extra.REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY: string | undefined = extra.REVENUECAT_ANDROID_API_KEY;
const ENTITLEMENT_ID: string = extra.REVENUECAT_ENTITLEMENT_ID || 'Luva Pro';
const MANUAL_PRO_KEY = '@luva/pro_code_expires_at';

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | undefined>();
  const [loading, setLoading] = useState(true);
  const [manualProExpiration, setManualProExpiration] = useState<number | null>(null);

  const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;

  useEffect(() => {
    let isMounted = true;
    let removeListener: (() => void) | undefined;

    const init = async () => {
      try {
        try {
          const storedExpiration = await AsyncStorage.getItem(MANUAL_PRO_KEY);
          const parsed = storedExpiration ? Number(storedExpiration) : null;
          if (isMounted) {
            if (parsed && parsed > Date.now()) {
              setManualProExpiration(parsed);
            } else if (parsed) {
              await AsyncStorage.removeItem(MANUAL_PRO_KEY);
            }
          }
        } catch (err) {
          console.warn('Error cargando código promocional', err);
        }

        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.INFO);

        if (!apiKey) {
          console.warn('RevenueCat API key no configurada para esta plataforma.');
          return;
        }

        Purchases.configure({ apiKey });
        removeListener = Purchases.addCustomerInfoUpdateListener((info) => {
          setCustomerInfo(info);
        });
        const info = await Purchases.getCustomerInfo();
        if (isMounted) setCustomerInfo(info);
      } catch (err) {
        console.warn('Error inicializando RevenueCat', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      removeListener?.();
    };
  }, [apiKey]);

  useEffect(() => {
    if (!manualProExpiration) return;
    const now = Date.now();
    if (manualProExpiration <= now) {
      setManualProExpiration(null);
      void AsyncStorage.removeItem(MANUAL_PRO_KEY);
      return;
    }
    const timeout = setTimeout(() => {
      setManualProExpiration(null);
      void AsyncStorage.removeItem(MANUAL_PRO_KEY);
    }, manualProExpiration - now);
    return () => clearTimeout(timeout);
  }, [manualProExpiration]);

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return info;
    } catch (err) {
      console.warn('No se pudo actualizar la información de cliente de RevenueCat', err);
      return undefined;
    }
  }, []);

  const clearManualProAccess = useCallback(async () => {
    setManualProExpiration(null);
    try {
      await AsyncStorage.removeItem(MANUAL_PRO_KEY);
    } catch (err) {
      console.warn('No se pudo limpiar Pro por código', err);
    }
  }, []);

  const redeemPromoCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        return { success: false, reason: 'not_found' as const };
      }
      const validation = await api.post<{ code: string; isValid: boolean; premiumDays: number }>(
        '/promo-codes/validate',
        { code: trimmed }
      );
      if (!validation?.isValid) {
        return { success: false, reason: 'not_found' as const };
      }
      const premiumDays = Number.isFinite(validation.premiumDays) ? Math.max(0, validation.premiumDays) : 0;
      if (premiumDays <= 0) {
        return { success: false, reason: 'error' as const };
      }
      const expiresAt = Date.now() + premiumDays * 24 * 60 * 60 * 1000;
      setManualProExpiration(expiresAt);
      try {
        await AsyncStorage.setItem(MANUAL_PRO_KEY, String(expiresAt));
      } catch (err) {
        console.warn('No se pudo guardar la expiración del código promocional', err);
      }
      return { success: true, expiresAt, premiumDays };
    },
    []
  );

  const isPro = useMemo(
    () =>
      Boolean(customerInfo?.entitlements.active?.[ENTITLEMENT_ID]) ||
      (manualProExpiration ? manualProExpiration > Date.now() : false),
    [customerInfo, manualProExpiration]
  );

  const value = useMemo(
    () => ({
      customerInfo,
      isPro,
      loading,
      refreshCustomerInfo,
      clearManualProAccess,
      manualProExpiration: manualProExpiration && manualProExpiration > Date.now() ? manualProExpiration : null,
      redeemPromoCode,
    }),
    [clearManualProAccess, customerInfo, isPro, loading, manualProExpiration, redeemPromoCode, refreshCustomerInfo]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat() {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) throw new Error('useRevenueCat debe usarse dentro de RevenueCatProvider');
  return ctx;
}
