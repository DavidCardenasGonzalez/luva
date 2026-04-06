import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';
import { useAuth } from '../auth/AuthProvider';

type AccountProGrant = {
  isActive: boolean;
  updatedAt?: string;
  expiresAt?: string;
  productId?: string;
  entitlementId?: string;
  appUserId?: string;
};

type AccountProAccess = {
  isActive: boolean;
  source?: 'subscription' | 'code' | 'multiple';
  updatedAt?: string;
  subscription?: AccountProGrant;
  code?: AccountProGrant;
};

type RevenueCatContextValue = {
  customerInfo?: CustomerInfo;
  isPro: boolean;
  loading: boolean;
  manualProExpiration: number | null;
  accountProAccess?: AccountProAccess;
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

function isAnonymousRevenueCatUserId(value?: string) {
  return typeof value === 'string' && value.startsWith('$RCAnonymousID:');
}

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoading: authLoading, user, updateCurrentUser } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | undefined>();
  const [revenueCatAppUserId, setRevenueCatAppUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [manualProExpiration, setManualProExpiration] = useState<number | null>(null);
  const lastSyncedSubscriptionKeyRef = useRef<string | null>(null);
  const lastRevenueCatIdentityRef = useRef<string | null>(null);

  const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;
  const accountProAccess = user?.proAccess;
  const remoteSubscriptionActive = Boolean(accountProAccess?.subscription?.isActive);
  const remoteCodeActive = Boolean(accountProAccess?.code?.isActive);

  const storeManualProExpiration = useCallback(async (expiresAt: number | null) => {
    setManualProExpiration(expiresAt);
    try {
      if (expiresAt && expiresAt > Date.now()) {
        await AsyncStorage.setItem(MANUAL_PRO_KEY, String(expiresAt));
      } else {
        await AsyncStorage.removeItem(MANUAL_PRO_KEY);
      }
    } catch (err) {
      console.warn('No se pudo guardar la expiración del código promocional', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let customerInfoListener: ((info: CustomerInfo) => void) | undefined;

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
        customerInfoListener = (info) => {
          setCustomerInfo(info);
        };
        Purchases.addCustomerInfoUpdateListener(customerInfoListener);
        const [info, appUserId] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getAppUserID(),
        ]);
        if (isMounted) {
          setCustomerInfo(info);
          setRevenueCatAppUserId(appUserId);
          lastRevenueCatIdentityRef.current = appUserId;
        }
      } catch (err) {
        console.warn('Error inicializando RevenueCat', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (customerInfoListener) {
        Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
      }
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
      const [info, appUserId] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getAppUserID(),
      ]);
      setCustomerInfo(info);
      setRevenueCatAppUserId(appUserId);
      lastRevenueCatIdentityRef.current = appUserId;
      return info;
    } catch (err) {
      console.warn('No se pudo actualizar la información de cliente de RevenueCat', err);
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (authLoading || loading || !apiKey) {
      return;
    }

    let cancelled = false;
    void (async () => {
      if (!isSignedIn || !user?.cognitoSub) {
        lastSyncedSubscriptionKeyRef.current = null;

        const currentIdentity = lastRevenueCatIdentityRef.current;
        if (!currentIdentity || isAnonymousRevenueCatUserId(currentIdentity)) {
          return;
        }

        try {
          const info = await Purchases.logOut();
          const nextAppUserId = await Purchases.getAppUserID();
          if (cancelled) {
            return;
          }
          setCustomerInfo(info);
          setRevenueCatAppUserId(nextAppUserId);
          lastRevenueCatIdentityRef.current = nextAppUserId;
        } catch (err) {
          if (!cancelled) {
            console.warn('No se pudo limpiar la identidad de RevenueCat al cerrar sesión', err);
          }
        }
        return;
      }

      if (lastRevenueCatIdentityRef.current === user.cognitoSub) {
        setRevenueCatAppUserId(user.cognitoSub);
        return;
      }

      try {
        const currentAppUserId = await Purchases.getAppUserID();
        if (cancelled) {
          return;
        }

        if (currentAppUserId === user.cognitoSub) {
          setRevenueCatAppUserId(currentAppUserId);
          lastRevenueCatIdentityRef.current = currentAppUserId;
          return;
        }

        const result = await Purchases.logIn(user.cognitoSub);
        const nextAppUserId = await Purchases.getAppUserID();
        if (cancelled) {
          return;
        }

        setCustomerInfo(result.customerInfo);
        setRevenueCatAppUserId(nextAppUserId || user.cognitoSub);
        lastRevenueCatIdentityRef.current = nextAppUserId || user.cognitoSub;
        lastSyncedSubscriptionKeyRef.current = null;
      } catch (err) {
        if (!cancelled) {
          console.warn('No se pudo identificar al usuario autenticado en RevenueCat', err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiKey, authLoading, isSignedIn, loading, user?.cognitoSub]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isSignedIn || !user?.email) {
      lastSyncedSubscriptionKeyRef.current = null;
      return;
    }

    if (loading || !apiKey) {
      return;
    }

    const entitlement = customerInfo?.entitlements.active?.[ENTITLEMENT_ID];
    const payload = {
      subscriptionAccess: {
        isActive: Boolean(entitlement),
        expiresAt: entitlement?.expirationDate || null,
        productId: entitlement?.productIdentifier,
        entitlementId: ENTITLEMENT_ID,
        appUserId: revenueCatAppUserId,
      },
    };
    const syncKey = JSON.stringify(payload);
    if (lastSyncedSubscriptionKeyRef.current === syncKey) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await updateCurrentUser(payload);
      if (cancelled) {
        return;
      }
      if (result.user) {
        lastSyncedSubscriptionKeyRef.current = syncKey;
        return;
      }
      console.warn('[RevenueCat] No se pudo sincronizar el estado Pro remoto.');
    })();

    return () => {
      cancelled = true;
    };
  }, [apiKey, authLoading, customerInfo, isSignedIn, loading, revenueCatAppUserId, updateCurrentUser, user?.email]);

  const clearManualProAccess = useCallback(async () => {
    try {
      await storeManualProExpiration(null);
    } catch (err) {
      console.warn('No se pudo limpiar Pro por código', err);
    }
  }, [storeManualProExpiration]);

  const redeemPromoCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        return { success: false, reason: 'not_found' as const };
      }

      let premiumDays = 0;
      let expiresAt: number | undefined;

      if (isSignedIn) {
        const result = await updateCurrentUser({ promoCode: trimmed });
        const promoCode = result.promoCode;
        if (!promoCode?.isValid) {
          return { success: false, reason: 'not_found' as const };
        }
        premiumDays = Number.isFinite(promoCode.premiumDays) ? Math.max(0, promoCode.premiumDays) : 0;
        expiresAt = promoCode.expiresAt ? Date.parse(promoCode.expiresAt) : undefined;
      } else {
        const validation = await api.post<{ code: string; isValid: boolean; premiumDays: number }>(
          '/promo-codes/validate',
          { code: trimmed }
        );
        if (!validation?.isValid) {
          return { success: false, reason: 'not_found' as const };
        }
        premiumDays = Number.isFinite(validation.premiumDays) ? Math.max(0, validation.premiumDays) : 0;
      }

      if (premiumDays <= 0) {
        return { success: false, reason: 'error' as const };
      }

      const nextExpiresAt = expiresAt && Number.isFinite(expiresAt)
        ? expiresAt
        : Date.now() + premiumDays * 24 * 60 * 60 * 1000;
      await storeManualProExpiration(nextExpiresAt);

      return { success: true, expiresAt: nextExpiresAt, premiumDays };
    },
    [isSignedIn, storeManualProExpiration, updateCurrentUser]
  );

  const isPro = useMemo(
    () =>
      Boolean(customerInfo?.entitlements.active?.[ENTITLEMENT_ID]) ||
      (manualProExpiration ? manualProExpiration > Date.now() : false) ||
      remoteSubscriptionActive ||
      remoteCodeActive,
    [customerInfo, manualProExpiration, remoteCodeActive, remoteSubscriptionActive]
  );

  const value = useMemo(
    () => ({
      customerInfo,
      isPro,
      loading,
      accountProAccess,
      refreshCustomerInfo,
      clearManualProAccess,
      manualProExpiration: manualProExpiration && manualProExpiration > Date.now() ? manualProExpiration : null,
      redeemPromoCode,
    }),
    [
      accountProAccess,
      clearManualProAccess,
      customerInfo,
      isPro,
      loading,
      manualProExpiration,
      redeemPromoCode,
      refreshCustomerInfo,
    ]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat() {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) throw new Error('useRevenueCat debe usarse dentro de RevenueCatProvider');
  return ctx;
}
