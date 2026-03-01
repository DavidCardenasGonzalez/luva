import Constants from 'expo-constants';

export function getRuntimeAppVersion(): string {
  const version = Constants.expoConfig?.version;
  if (typeof version === 'string' && version.trim()) {
    return version.trim();
  }
  const nativeVersion = Constants.nativeAppVersion;
  if (typeof nativeVersion === 'string' && nativeVersion.trim()) {
    return nativeVersion.trim();
  }
  return '0.0.0';
}
