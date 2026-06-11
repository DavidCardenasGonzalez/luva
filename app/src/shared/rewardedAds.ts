import { NativeModules, Platform } from 'react-native';

const PROD_REWARDED_AD_UNIT_ID =
  Platform.select({
    ios: 'ca-app-pub-3572102651268229/8175446712',
    android: 'ca-app-pub-3572102651268229/4835017171',
  }) ?? 'ca-app-pub-3572102651268229/4835017171';

type MobileAdsRewardedModule = {
  AdEventType: {
    CLOSED: string;
    ERROR: string;
  };
  RewardedAdEventType: {
    LOADED: string;
    EARNED_REWARD: string;
  };
  RewardedAd: {
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
    REWARDED: string;
  };
};

type ShowRewardedAdOptions = {
  failOpen?: boolean;
  timeoutMs?: number;
};

const getMobileAdsRewardedModule = (): MobileAdsRewardedModule | null => {
  const nativeAdsModule =
    (NativeModules as any)?.RNGoogleMobileAdsModule ||
    (NativeModules as any)?.RNGoogleMobileAdsNativeModule;
  if (!nativeAdsModule) {
    return null;
  }

  try {
    const ads = require('react-native-google-mobile-ads') as MobileAdsRewardedModule;
    if (!ads?.RewardedAd || !ads?.RewardedAdEventType || !ads?.AdEventType || !ads?.TestIds) {
      return null;
    }
    return ads;
  } catch {
    return null;
  }
};

export const showRewardedAd = ({
  failOpen = false,
  timeoutMs = 7000,
}: ShowRewardedAdOptions = {}) =>
  new Promise<boolean>((resolve) => {
    const ads = getMobileAdsRewardedModule();
    if (!ads) {
      resolve(failOpen);
      return;
    }

    const rewardedAdUnitId = __DEV__ ? ads.TestIds.REWARDED : PROD_REWARDED_AD_UNIT_ID;

    const { AdEventType, RewardedAdEventType, RewardedAd } = ads;
    const rewarded = RewardedAd.createForAdRequest(rewardedAdUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    let done = false;
    let earnedReward = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let unsubscribeLoaded: (() => void) | null = null;
    let unsubscribeClosed: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;
    let unsubscribeReward: (() => void) | null = null;

    const finish = (granted: boolean) => {
      if (done) return;
      done = true;
      unsubscribeLoaded?.();
      unsubscribeClosed?.();
      unsubscribeError?.();
      unsubscribeReward?.();
      if (timeoutId) clearTimeout(timeoutId);
      if (closeTimeoutId) clearTimeout(closeTimeoutId);
      resolve(granted);
    };

    unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      rewarded.show().catch(() => finish(failOpen));
    });

    unsubscribeReward = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earnedReward = true;
    });

    unsubscribeClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      closeTimeoutId = setTimeout(() => finish(earnedReward), 400);
    });

    unsubscribeError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      finish(failOpen);
    });

    timeoutId = setTimeout(() => finish(failOpen), timeoutMs);
    rewarded.load();
  });
