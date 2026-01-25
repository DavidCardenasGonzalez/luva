import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import Constants from 'expo-constants';

type RevenueCatContextValue = {
  customerInfo?: CustomerInfo;
  isPro: boolean;
  loading: boolean;
  refreshCustomerInfo: () => Promise<CustomerInfo | undefined>;
};

const RevenueCatContext = createContext<RevenueCatContextValue | undefined>(undefined);
const extra = Constants.expoConfig?.extra || {};
const IOS_API_KEY: string | undefined = extra.REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY: string | undefined = extra.REVENUECAT_ANDROID_API_KEY;
const ENTITLEMENT_ID: string = extra.REVENUECAT_ENTITLEMENT_ID || 'Luva Pro';

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | undefined>();
  const [loading, setLoading] = useState(true);

  const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;

  useEffect(() => {
    let isMounted = true;
    let removeListener: (() => void) | undefined;

    const init = async () => {
      try {
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

  const isPro = useMemo(
    () => Boolean(customerInfo?.entitlements.active?.[ENTITLEMENT_ID]),
    [customerInfo]
  );

  const value = useMemo(
    () => ({
      customerInfo,
      isPro,
      loading,
      refreshCustomerInfo,
    }),
    [customerInfo, isPro, loading, refreshCustomerInfo]
  );

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat() {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) throw new Error('useRevenueCat debe usarse dentro de RevenueCatProvider');
  return ctx;
}
