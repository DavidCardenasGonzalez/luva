import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = 'luva_onboarding_completed_v1';
export const ALWAYS_SHOW_ONBOARDING_FOR_TESTS = true;

export async function hasCompletedOnboarding(): Promise<boolean> {
  if (ALWAYS_SHOW_ONBOARDING_FOR_TESTS) {
    return false;
  }

  try {
    return Boolean(await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY));
  } catch {
    return false;
  }
}

export async function markOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, new Date().toISOString());
  } catch {
    // The app can still continue if local persistence fails.
  }
}

export async function resetOnboardingProgress(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
  } catch {
    // Ignore reset failures.
  }
}
