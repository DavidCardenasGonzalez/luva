import { Linking, Platform } from 'react-native';

const IOS_REVIEW_URL = 'https://apps.apple.com/us/app/luva-ingles/id6758112881?action=write-review';
const ANDROID_MARKET_URL = 'market://details?id=com.cardi7.luva';
const ANDROID_WEB_URL = 'https://play.google.com/store/apps/details?id=com.cardi7.luva';

export async function openStoreReview() {
  const primaryUrl = Platform.OS === 'ios' ? IOS_REVIEW_URL : ANDROID_MARKET_URL;
  const fallbackUrl = Platform.OS === 'android' ? ANDROID_WEB_URL : IOS_REVIEW_URL;

  try {
    const canOpenPrimary = await Linking.canOpenURL(primaryUrl);
    await Linking.openURL(canOpenPrimary ? primaryUrl : fallbackUrl);
    return true;
  } catch (err) {
    if (fallbackUrl !== primaryUrl) {
      try {
        await Linking.openURL(fallbackUrl);
        return true;
      } catch {}
    }
    console.warn('[ReviewReward] No se pudo abrir la tienda', err);
    return false;
  }
}
