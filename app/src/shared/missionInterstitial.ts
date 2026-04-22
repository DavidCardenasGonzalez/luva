import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const PROD_INTERSTITIAL_AD_UNIT_ID =
  Platform.select({
    ios: 'ca-app-pub-3572102651268229/5186680084',
    android: 'ca-app-pub-3572102651268229/2484186004',
  }) ?? 'ca-app-pub-3572102651268229/2484186004';

const FREE_MISSION_INTERSTITIALS_STORAGE_KEY = '@luva/missions/free-interstitials';
const FREE_MISSION_INTERSTITIAL_LIMIT = 1;

type MobileAdsModule = {
  AdEventType: {
    LOADED: string;
    CLOSED: string;
    ERROR: string;
  };
  InterstitialAd: {
    createForAdRequest: (
      adUnitId: string,
      options?: { requestNonPersonalizedAdsOnly?: boolean }
    ) => {
      addAdEventListener: (eventType: string, listener: () => void) => () => void;
      load: () => void;
      show: () => Promise<void>;
    };
  };
  TestIds: {
    INTERSTITIAL: string;
  };
};

const getMobileAdsModule = (): MobileAdsModule | null => {
  const nativeAdsModule =
    (NativeModules as any)?.RNGoogleMobileAdsModule ||
    (NativeModules as any)?.RNGoogleMobileAdsNativeModule;
  if (!nativeAdsModule) {
    return null;
  }

  try {
    const ads = require('react-native-google-mobile-ads') as MobileAdsModule;
    if (!ads?.InterstitialAd || !ads?.AdEventType || !ads?.TestIds) {
      return null;
    }
    return ads;
  } catch {
    return null;
  }
};

const missionTrackingKey = (storyId?: string, missionId?: string) => {
  const storyKey = String(storyId || '').trim();
  const missionKey = String(missionId || '').trim();
  if (!storyKey || !missionKey) return undefined;
  return `${storyKey}:${missionKey}`;
};

const readFreeInterstitialMissionKeys = async () => {
  const raw = await AsyncStorage.getItem(FREE_MISSION_INTERSTITIALS_STORAGE_KEY);
  if (!raw) return [];

  let parsed: { missionKeys?: unknown };
  try {
    parsed = JSON.parse(raw) as { missionKeys?: unknown };
  } catch {
    return [];
  }

  const missionKeys = Array.isArray(parsed?.missionKeys) ? parsed.missionKeys : [];

  return Array.from(
    new Set(
      missionKeys.filter(
        (key): key is string => typeof key === 'string' && key.trim().length > 0
      )
    )
  ).slice(0, FREE_MISSION_INTERSTITIAL_LIMIT);
};

const persistFreeInterstitialMissionKeys = async (missionKeys: string[]) => {
  await AsyncStorage.setItem(
    FREE_MISSION_INTERSTITIALS_STORAGE_KEY,
    JSON.stringify({
      missionKeys: missionKeys.slice(0, FREE_MISSION_INTERSTITIAL_LIMIT),
    })
  );
};

export const shouldShowMissionInterstitialForMission = async (
  storyId?: string,
  missionId?: string
) => {
  const key = missionTrackingKey(storyId, missionId);
  if (!key) return true;

  try {
    const freeMissionKeys = await readFreeInterstitialMissionKeys();
    console.log('[MissionAds] Free interstitial keys:', freeMissionKeys);
    if (freeMissionKeys.includes(key)) {
      return false;
    }

    if (freeMissionKeys.length < FREE_MISSION_INTERSTITIAL_LIMIT) {
      await persistFreeInterstitialMissionKeys([...freeMissionKeys, key]);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[MissionAds] No se pudo leer el estado de interstitials gratis', err);
    return false;
  }
};

export const showMissionInterstitialBeforeNavigation = () =>
  new Promise<void>((resolve) => {
    const ads = getMobileAdsModule();
    if (!ads) {
      resolve();
      return;
    }

    const interstitialAdUnitId = __DEV__
      ? ads.TestIds.INTERSTITIAL
      : PROD_INTERSTITIAL_AD_UNIT_ID;

    const { AdEventType, InterstitialAd } = ads;
    const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    let finished = false;
    let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeLoaded: (() => void) | null = null;
    let unsubscribeClosed: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;

    const clearLoadTimeout = () => {
      if (!loadTimeoutId) return;
      clearTimeout(loadTimeoutId);
      loadTimeoutId = null;
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      unsubscribeLoaded?.();
      unsubscribeClosed?.();
      unsubscribeError?.();
      clearLoadTimeout();
      resolve();
    };

    unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      clearLoadTimeout();
      interstitial.show().catch(() => {
        finish();
      });
    });
    unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, finish);
    unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, finish);

    loadTimeoutId = setTimeout(finish, 5000);
    interstitial.load();
  });
