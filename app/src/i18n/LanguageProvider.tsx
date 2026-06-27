import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppLanguage,
  LanguageMode,
  LANGUAGE_MODE_STORAGE_KEY,
  SUPPORT_LANGUAGE_STORAGE_KEY,
  SupportLanguageCode,
  getAppLanguageEnglishName,
  getAppLanguageNativeName,
  getSystemSupportLanguage,
  getSystemAppLanguage,
  normalizeLanguageMode,
  setCurrentSupportLanguage,
  resolveLanguageMode,
  setCurrentAppLanguage,
} from './language';
import {
  getSupportLanguageDisplayName,
  normalizeSupportLanguageCode,
} from './supportLanguages';
import { translate } from './translations';

type LanguageContextValue = {
  language: AppLanguage;
  languageMode: LanguageMode;
  systemLanguage: AppLanguage;
  supportLanguage: SupportLanguageCode;
  setLanguageMode: (mode: LanguageMode) => Promise<void>;
  setSupportLanguage: (language: SupportLanguageCode) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  getLanguageName: (language: AppLanguage) => string;
  getNativeLanguageName: (language: AppLanguage) => string;
  getSupportLanguageName: (language: SupportLanguageCode) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [systemLanguage, setSystemLanguage] = useState<AppLanguage>(() => getSystemAppLanguage());
  const [languageMode, setLanguageModeState] = useState<LanguageMode>('system');
  const [supportLanguage, setSupportLanguageState] = useState<SupportLanguageCode>(() => getSystemSupportLanguage());

  const language = resolveLanguageMode(languageMode, systemLanguage);

  useEffect(() => {
    setCurrentAppLanguage(language);
  }, [language]);

  useEffect(() => {
    setCurrentSupportLanguage(supportLanguage);
  }, [supportLanguage]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      AsyncStorage.getItem(LANGUAGE_MODE_STORAGE_KEY),
      AsyncStorage.getItem(SUPPORT_LANGUAGE_STORAGE_KEY),
    ])
      .then(([storedMode, storedSupportLanguage]) => {
        if (cancelled) return;
        setSystemLanguage(getSystemAppLanguage());
        setLanguageModeState(normalizeLanguageMode(storedMode));
        setSupportLanguageState(normalizeSupportLanguageCode(storedSupportLanguage) || getSystemSupportLanguage());
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguageMode = useCallback(async (mode: LanguageMode) => {
    const normalized = normalizeLanguageMode(mode);
    setSystemLanguage(getSystemAppLanguage());
    setLanguageModeState(normalized);
    await AsyncStorage.setItem(LANGUAGE_MODE_STORAGE_KEY, normalized);
  }, []);

  const setSupportLanguage = useCallback(async (nextLanguage: SupportLanguageCode) => {
    const normalized = normalizeSupportLanguageCode(nextLanguage);
    if (!normalized) {
      throw new Error('UNSUPPORTED_SUPPORT_LANGUAGE');
    }
    setSupportLanguageState(normalized);
    await AsyncStorage.setItem(SUPPORT_LANGUAGE_STORAGE_KEY, normalized);
  }, []);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    languageMode,
    systemLanguage,
    supportLanguage,
    setLanguageMode,
    setSupportLanguage,
    t: (key, params) => translate(language, key, params),
    getLanguageName: getAppLanguageEnglishName,
    getNativeLanguageName: getAppLanguageNativeName,
    getSupportLanguageName: (nextLanguage) => getSupportLanguageDisplayName(nextLanguage, language),
  }), [language, languageMode, setLanguageMode, setSupportLanguage, supportLanguage, systemLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
