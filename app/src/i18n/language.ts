import { getLocales } from 'expo-localization';
import {
  DEFAULT_SUPPORT_LANGUAGE,
  normalizeSupportLanguageCode,
} from './supportLanguages';

export type AppLanguage = 'en' | 'es';
export type LanguageMode = 'system' | AppLanguage;
export type SupportLanguageCode = string;

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'en';
export const LANGUAGE_MODE_STORAGE_KEY = '@luva/language_mode';
export const SUPPORT_LANGUAGE_STORAGE_KEY = '@luva/support_language';

export const APP_LANGUAGE_OPTIONS: Array<{
  value: AppLanguage;
  englishName: string;
  nativeName: string;
}> = [
  { value: 'en', englishName: 'English', nativeName: 'English' },
  { value: 'es', englishName: 'Spanish', nativeName: 'Español' },
];

let currentAppLanguage: AppLanguage = DEFAULT_APP_LANGUAGE;
let currentSupportLanguage: SupportLanguageCode = DEFAULT_SUPPORT_LANGUAGE;

export function normalizeAppLanguage(value: unknown): AppLanguage | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'es' || normalized.startsWith('es-') || normalized.startsWith('es_')) {
    return 'es';
  }
  if (normalized === 'en' || normalized.startsWith('en-') || normalized.startsWith('en_')) {
    return 'en';
  }
  return undefined;
}

export function normalizeLanguageMode(value: unknown): LanguageMode {
  if (value === 'system') return 'system';
  return normalizeAppLanguage(value) || 'system';
}

export function getSystemAppLanguage(): AppLanguage {
  try {
    const [locale] = getLocales();
    return normalizeAppLanguage(locale?.languageCode || locale?.languageTag) || DEFAULT_APP_LANGUAGE;
  } catch {
    return DEFAULT_APP_LANGUAGE;
  }
}

currentAppLanguage = getSystemAppLanguage();

export function getSystemSupportLanguage(): SupportLanguageCode {
  try {
    const locales = getLocales();
    for (const locale of locales) {
      const language =
        normalizeSupportLanguageCode(locale?.languageTag) ||
        normalizeSupportLanguageCode(locale?.languageCode);
      if (language) return language;
    }
  } catch {
    return DEFAULT_SUPPORT_LANGUAGE;
  }
  return DEFAULT_SUPPORT_LANGUAGE;
}

currentSupportLanguage = getSystemSupportLanguage();

export function resolveLanguageMode(mode: LanguageMode, systemLanguage = getSystemAppLanguage()): AppLanguage {
  return mode === 'system' ? systemLanguage : mode;
}

export function setCurrentAppLanguage(language: AppLanguage) {
  currentAppLanguage = language;
}

export function getCurrentAppLanguage(): AppLanguage {
  return currentAppLanguage;
}

export function setCurrentSupportLanguage(language: SupportLanguageCode) {
  currentSupportLanguage = normalizeSupportLanguageCode(language) || DEFAULT_SUPPORT_LANGUAGE;
}

export function getCurrentSupportLanguage(): SupportLanguageCode {
  return currentSupportLanguage;
}

export function getAppLanguageEnglishName(language: AppLanguage): string {
  return APP_LANGUAGE_OPTIONS.find((option) => option.value === language)?.englishName || 'English';
}

export function getAppLanguageNativeName(language: AppLanguage): string {
  return APP_LANGUAGE_OPTIONS.find((option) => option.value === language)?.nativeName || 'English';
}
