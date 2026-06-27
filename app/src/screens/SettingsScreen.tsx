import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Modal, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../api/api';
import { useRevenueCat } from '../purchases/RevenueCatProvider';
import { useCoins } from '../purchases/CoinBalanceProvider';
import { usePhotoRequestCredits } from '../purchases/PhotoRequestCreditsProvider';
import { useCardProgress } from '../progress/CardProgressProvider';
import { useStoryProgress } from '../progress/StoryProgressProvider';
import { getRuntimeAppVersion } from '../version/appVersion';
import { trackMixpanelPremiumActivated } from '../marketing/mixpanelEvents';
import AccountProgressCard from '../components/AccountProgressCard';
import AppTabBar from '../components/AppTabBar';
import { useAuth, type EnglishDifficulty } from '../auth/AuthProvider';
import { readStoredEnglishDifficulty, writeStoredEnglishDifficulty } from '../auth/englishDifficulty';
import { APP_LANGUAGE_OPTIONS, type LanguageMode } from '../i18n/language';
import { useLanguage } from '../i18n/LanguageProvider';
import {
  getSupportLanguageOption,
  searchSupportLanguages,
  type SupportLanguageOption,
} from '../i18n/supportLanguages';

const DIFFICULTY_OPTIONS: Array<{ value: EnglishDifficulty; labelKey: string; descriptionKey: string }> = [
  { value: 'easy', labelKey: 'settings.difficulty.easy', descriptionKey: 'settings.difficulty.easyDescription' },
  { value: 'medium', labelKey: 'settings.difficulty.medium', descriptionKey: 'settings.difficulty.mediumDescription' },
  { value: 'hard', labelKey: 'settings.difficulty.hard', descriptionKey: 'settings.difficulty.hardDescription' },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

async function clearLocalLuvaStorage(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const luvaKeys = keys.filter((key) => key.startsWith('@luva') || key.startsWith('luva'));
  if (luvaKeys.length) {
    await AsyncStorage.multiRemove(luvaKeys);
  }
}

export default function SettingsScreen({ navigation }: Props) {
  const appVersion = getRuntimeAppVersion();
  const canGoBack = navigation.canGoBack();
  const {
    language,
    languageMode,
    supportLanguage,
    setLanguageMode,
    setSupportLanguage,
    t,
    getNativeLanguageName,
    getSupportLanguageName,
  } = useLanguage();
  const {
    isPro,
    customerInfo,
    loading: rcLoading,
    manualProExpiration,
    accountProAccess,
    redeemPromoCode,
    clearManualProAccess,
  } =
    useRevenueCat();
  const { resetCoins } = useCoins();
  const {
    balance: photoRequestCredits,
    maxCredits: maxPhotoRequestCredits,
    loading: photoRequestCreditsLoading,
    resetPhotoRequestCredits,
  } = usePhotoRequestCredits();
  const { resetAll: resetCardProgress } = useCardProgress();
  const { resetAll: resetStoryProgress } = useStoryProgress();
  const { isSignedIn, user, updateCurrentUser, resetLocalSession } = useAuth();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resettingPhotoCredits, setResettingPhotoCredits] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingDifficulty, setSavingDifficulty] = useState<EnglishDifficulty | null>(null);
  const [savingLanguage, setSavingLanguage] = useState<LanguageMode | null>(null);
  const [savingSupportLanguage, setSavingSupportLanguage] = useState<string | null>(null);
  const [supportLanguageQuery, setSupportLanguageQuery] = useState('');
  const [localDifficulty, setLocalDifficulty] = useState<EnglishDifficulty | null>(null);

  useEffect(() => {
    let cancelled = false;
    void readStoredEnglishDifficulty().then((value) => {
      if (!cancelled) setLocalDifficulty(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileGoal, setProfileGoal] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [redeemingCode, setRedeemingCode] = useState(false);
  const [codeFeedback, setCodeFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const proInfo = useMemo(() => {
    const entitlement = customerInfo?.entitlements?.active
      ? Object.values(customerInfo.entitlements.active)[0]
      : undefined;
    if (entitlement) {
      return {
        source: 'subscription' as const,
        productId: entitlement.productIdentifier,
        expirationDate: entitlement.expirationDate || null,
      };
    }
    if (manualProExpiration && manualProExpiration > Date.now()) {
      return {
        source: 'code' as const,
        productId: language === 'es' ? 'Código promocional' : 'Promo code',
        expirationDate: new Date(manualProExpiration).toISOString(),
      };
    }
    if (accountProAccess?.subscription?.isActive) {
      return {
        source: 'subscription' as const,
        productId: accountProAccess.subscription.productId || (language === 'es' ? 'Suscripción activa' : 'Active subscription'),
        expirationDate: accountProAccess.subscription.expiresAt || null,
      };
    }
    if (accountProAccess?.code?.isActive) {
      return {
        source: 'code' as const,
        productId: language === 'es' ? 'Código promocional' : 'Promo code',
        expirationDate: accountProAccess.code.expiresAt || null,
      };
    }
    return null;
  }, [accountProAccess, customerInfo, language, manualProExpiration]);

  const openExternal = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn('No se pudo abrir el enlace', err);
    }
  };

  const handleOpenEmailSignUp = useCallback((prefillEmail?: string) => {
    navigation.navigate('EmailSignUp', {
      prefillEmail,
    });
  }, [navigation]);

  const openProfileEditor = useCallback(() => {
    setProfileName(user?.displayName || '');
    setProfileBio(user?.bio || '');
    setProfileGoal(user?.goal || '');
    setShowProfileModal(true);
  }, [user?.bio, user?.displayName, user?.goal]);

  const currentDifficulty: EnglishDifficulty =
    user?.englishDifficulty || localDifficulty || 'medium';
  const languageOptions: Array<{ value: LanguageMode; label: string; description: string }> = useMemo(() => [
    {
      value: 'system',
      label: t('settings.language.systemOption'),
      description: t('language.systemDetail'),
    },
    ...APP_LANGUAGE_OPTIONS.map((option) => ({
      value: option.value,
      label: option.value === 'es' ? t('language.spanish') : t('language.english'),
      description: option.nativeName,
    })),
  ], [t]);
  const visibleSupportLanguages = useMemo<SupportLanguageOption[]>(() => {
    const selected = getSupportLanguageOption(supportLanguage);
    const results = searchSupportLanguages(supportLanguageQuery, 10);
    if (results.some((option) => option.code === selected.code)) return results;
    return [selected, ...results].slice(0, 10);
  }, [supportLanguage, supportLanguageQuery]);

  const handleSelectDifficulty = useCallback(async (value: EnglishDifficulty) => {
    if (savingDifficulty || value === currentDifficulty) return;
    try {
      setSavingDifficulty(value);
      await writeStoredEnglishDifficulty(value);
      setLocalDifficulty(value);
      if (isSignedIn) {
        const result = await updateCurrentUser({ englishDifficulty: value });
        if (!result.user) {
          throw new Error('DIFFICULTY_UPDATE_FAILED');
        }
      }
    } catch (err) {
      console.warn('[Settings] Error al guardar dificultad', err);
      Alert.alert(t('common.error'), t('settings.difficulty.errorMessage'));
    } finally {
      setSavingDifficulty(null);
    }
  }, [currentDifficulty, isSignedIn, savingDifficulty, t, updateCurrentUser]);

  const handleSelectLanguage = useCallback(async (mode: LanguageMode) => {
    if (savingLanguage || mode === languageMode) return;
    try {
      setSavingLanguage(mode);
      await setLanguageMode(mode);
      Alert.alert(t('settings.language.savedTitle'), t('settings.language.savedMessage'));
    } catch (err) {
      console.warn('[Settings] Error al guardar idioma', err);
      Alert.alert(t('common.error'), t('settings.language.errorMessage'));
    } finally {
      setSavingLanguage(null);
    }
  }, [languageMode, savingLanguage, setLanguageMode, t]);

  const handleSelectSupportLanguage = useCallback(async (nextLanguage: string) => {
    if (savingSupportLanguage || nextLanguage === supportLanguage) return;
    try {
      setSavingSupportLanguage(nextLanguage);
      await setSupportLanguage(nextLanguage);
      setSupportLanguageQuery('');
      Alert.alert(t('settings.supportLanguage.savedTitle'), t('settings.supportLanguage.savedMessage'));
    } catch (err) {
      console.warn('[Settings] Error al guardar idioma de ayuda', err);
      Alert.alert(t('common.error'), t('settings.supportLanguage.errorMessage'));
    } finally {
      setSavingSupportLanguage(null);
    }
  }, [savingSupportLanguage, setSupportLanguage, supportLanguage, t]);

  const handleSaveProfile = useCallback(async () => {
    if (savingProfile) return;
    try {
      setSavingProfile(true);
      const result = await updateCurrentUser({
        displayName: profileName.trim() || undefined,
        bio: profileBio.trim(),
        goal: profileGoal.trim(),
      });
      if (!result.user) {
        throw new Error('PROFILE_UPDATE_FAILED');
      }
      setShowProfileModal(false);
      Alert.alert(t('common.done'), t('settings.account.updated'));
    } catch (err) {
      console.warn('[Settings] Error al guardar perfil', err);
      Alert.alert(t('common.error'), t('settings.account.updateError'));
    } finally {
      setSavingProfile(false);
    }
  }, [profileBio, profileGoal, profileName, savingProfile, t, updateCurrentUser]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return t('settings.subscription.noExpiration');
    const d = new Date(iso);
    return d.toLocaleDateString(language === 'es' ? 'es' : 'en', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const resetConfirmWord = t('settings.danger.confirmWord');
  const canConfirmReset = confirmText.trim().toLowerCase() === resetConfirmWord;

  const handleConfirmReset = useCallback(async () => {
    if (!canConfirmReset || resetting) return;
    try {
      setResetting(true);
      await Promise.all([
        resetCardProgress(),
        resetStoryProgress(),
      ]);
      await Promise.all([
        resetCoins(),
        clearManualProAccess(),
        resetLocalSession(),
      ]);
      await clearLocalLuvaStorage();
      setConfirmText('');
      setShowResetModal(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
      Alert.alert(t('settings.danger.deletedTitle'), t('settings.danger.deletedMessage'));
    } catch (err) {
      console.warn('[Settings] Error al restaurar', err);
      Alert.alert(t('common.error'), t('settings.danger.deleteError'));
    } finally {
      setResetting(false);
    }
  }, [canConfirmReset, clearManualProAccess, navigation, resetCoins, resetCardProgress, resetLocalSession, resetStoryProgress, resetting, t]);

  const handleRedeemCode = useCallback(async () => {
    const trimmed = codeInput.trim();
    if (!trimmed) {
      setCodeFeedback({ message: t('settings.code.empty'), tone: 'error' });
      return;
    }
    setRedeemingCode(true);
    setCodeFeedback(null);
    try {
      const result = await redeemPromoCode(trimmed);
      if (!result.success) {
        setCodeFeedback({ message: t('settings.code.notFound'), tone: 'error' });
        return;
      }
      const expiresLabel = result.expiresAt
        ? formatDate(new Date(result.expiresAt).toISOString())
        : `${result.premiumDays ?? 30} días`;
      const premiumDays = result.premiumDays ?? 30;
      void trackMixpanelPremiumActivated({
        premiumSource: 'promo_code',
        expiresAt: result.expiresAt
          ? new Date(result.expiresAt).toISOString()
          : undefined,
        premiumDays,
      });
      setCodeFeedback({
        message: t('settings.code.applied', { date: expiresLabel }),
        tone: 'success',
      });
      setCodeInput('');
      Alert.alert(t('common.done'), t('settings.code.appliedAlert', { days: premiumDays }));
    } catch (err) {
      console.warn('[Settings] Error al canjear código', err);
      setCodeFeedback({ message: t('settings.code.validationError'), tone: 'error' });
    } finally {
      setRedeemingCode(false);
    }
  }, [codeInput, redeemPromoCode, t]);

  const handleResetPhotoCredits = useCallback(async () => {
    if (resettingPhotoCredits) return;
    try {
      setResettingPhotoCredits(true);
      if (isSignedIn) {
        await api.post('/users/me/photo-request-credits/reset');
      }
      await resetPhotoRequestCredits();
      Alert.alert(t('common.done'), t('settings.dev.photosReset'));
    } catch (err) {
      console.warn('[Settings] Error al reiniciar fotos', err);
      Alert.alert(t('common.error'), t('settings.dev.photosResetError'));
    } finally {
      setResettingPhotoCredits(false);
    }
  }, [isSignedIn, resetPhotoRequestCredits, resettingPhotoCredits, t]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: '#0b1224' }}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 128 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          {canGoBack ? (
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: '#0f172a',
                borderWidth: 1,
                borderColor: '#1f2937',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowRadius: 8,
              })}
            >
              <MaterialIcons name="arrow-back" size={20} color="#e2e8f0" />
            </Pressable>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '800' }}>{t('settings.title')}</Text>
            <Text style={{ color: '#94a3b8', marginTop: 2 }}>{t('settings.subtitle')}</Text>
          </View>
        </View>

        <AccountProgressCard
          onCreateAccount={handleOpenEmailSignUp}
          style={{ marginBottom: 16 }}
        />

        <View
          style={{
            marginBottom: 16,
            borderRadius: 20,
            padding: 18,
            backgroundColor: '#0b172a',
            borderWidth: 1,
            borderColor: '#1f2937',
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
            {t('settings.language.eyebrow')}
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
            {t('settings.language.title')}
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
            {t('settings.language.description')}
          </Text>
          <Text style={{ color: '#cbd5e1', marginTop: 8, fontWeight: '700' }}>
            {t('settings.language.current', { language: getNativeLanguageName(language) })}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            {languageOptions.map((option) => {
              const selected = languageMode === option.value;
              const busy = savingLanguage === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelectLanguage(option.value)}
                  disabled={savingLanguage !== null}
                  style={({ pressed }) => ({
                    flex: 1,
                    padding: 10,
                    minHeight: 74,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected ? '#22d3ee' : '#1e293b',
                    backgroundColor: selected ? '#0e7490' : pressed ? '#0b152b' : '#0b172b',
                    opacity: savingLanguage && !busy ? 0.5 : 1,
                  })}
                >
                  <Text style={{ color: selected ? 'white' : '#e2e8f0', fontWeight: '800', textAlign: 'center' }}>
                    {busy ? '...' : option.label}
                  </Text>
                  <Text style={{ color: selected ? '#cffafe' : '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 4 }} numberOfLines={2}>
                    {option.description}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          style={{
            marginBottom: 16,
            borderRadius: 20,
            padding: 18,
            backgroundColor: '#0b172a',
            borderWidth: 1,
            borderColor: '#1f2937',
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
            {t('settings.supportLanguage.eyebrow')}
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
            {t('settings.supportLanguage.title')}
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
            {t('settings.supportLanguage.description')}
          </Text>
          <Text style={{ color: '#cbd5e1', marginTop: 8, fontWeight: '700' }}>
            {t('settings.supportLanguage.current', { language: getSupportLanguageName(supportLanguage) })}
          </Text>
          <View
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#1e293b',
              backgroundColor: '#071225',
              paddingHorizontal: 12,
            }}
          >
            <MaterialIcons name="search" size={18} color="#94a3b8" />
            <TextInput
              value={supportLanguageQuery}
              onChangeText={setSupportLanguageQuery}
              placeholder={t('settings.supportLanguage.searchPlaceholder')}
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                flex: 1,
                color: '#e2e8f0',
                paddingVertical: Platform.OS === 'ios' ? 12 : 8,
                paddingLeft: 8,
                fontWeight: '700',
              }}
            />
          </View>
          <View style={{ marginTop: 10, gap: 8 }}>
            {visibleSupportLanguages.length ? visibleSupportLanguages.map((option) => {
              const selected = supportLanguage === option.code;
              const busy = savingSupportLanguage === option.code;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => handleSelectSupportLanguage(option.code)}
                  disabled={savingSupportLanguage !== null}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    minHeight: 60,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: selected ? '#22d3ee' : '#1e293b',
                    backgroundColor: selected ? '#0e7490' : pressed ? '#0b152b' : '#0b172b',
                    opacity: savingSupportLanguage && !busy ? 0.5 : 1,
                  })}
                >
                  <Text style={{ fontSize: 24, width: 34 }}>{option.flag}</Text>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: selected ? 'white' : '#e2e8f0', fontWeight: '800' }} numberOfLines={1}>
                      {option.nativeName}
                    </Text>
                    <Text style={{ color: selected ? '#cffafe' : '#94a3b8', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      {option.englishName} · {option.code}
                    </Text>
                  </View>
                  {busy ? (
                    <Text style={{ color: '#cffafe', fontWeight: '800' }}>...</Text>
                  ) : selected ? (
                    <MaterialIcons name="check-circle" size={20} color="#a7f3d0" />
                  ) : null}
                </Pressable>
              );
            }) : (
              <Text style={{ color: '#94a3b8', paddingVertical: 8 }}>
                {t('settings.supportLanguage.empty')}
              </Text>
            )}
          </View>
        </View>

        {isSignedIn ? (
          <View
            style={{
              marginBottom: 16,
              borderRadius: 20,
              padding: 18,
              backgroundColor: '#0b172a',
              borderWidth: 1,
              borderColor: '#1f2937',
            }}
          >
            <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
              {t('settings.account.eyebrow')}
            </Text>
            <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
              {t('settings.account.title')}
            </Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0b172b', borderWidth: 1, borderColor: '#1e293b' }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800' }}>{t('settings.account.name')}</Text>
                <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{user?.displayName || t('settings.account.noName')}</Text>
              </View>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0b172b', borderWidth: 1, borderColor: '#1e293b' }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800' }}>{t('settings.account.bio')}</Text>
                <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{user?.bio || t('settings.account.noBio')}</Text>
              </View>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0b172b', borderWidth: 1, borderColor: '#1e293b' }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800' }}>{t('settings.account.goal')}</Text>
                <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{user?.goal || t('settings.account.noGoal')}</Text>
              </View>
            </View>
            <Pressable
              onPress={openProfileEditor}
              style={({ pressed }) => ({
                marginTop: 12,
                padding: 14,
                borderRadius: 14,
                backgroundColor: pressed ? '#0e7490' : '#0891b2',
                borderWidth: 1,
                borderColor: '#155e75',
              })}
            >
              <Text style={{ color: 'white', fontWeight: '800', textAlign: 'center' }}>{t('settings.account.edit')}</Text>
            </Pressable>
          </View>
        ) : null}

        <View
          style={{
            marginBottom: 16,
            borderRadius: 20,
            padding: 18,
            backgroundColor: '#0b172a',
            borderWidth: 1,
            borderColor: '#1f2937',
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
            {t('settings.difficulty.eyebrow')}
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
            {t('settings.difficulty.title')}
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
            {t('settings.difficulty.description')}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            {DIFFICULTY_OPTIONS.map((opt) => {
              const selected = currentDifficulty === opt.value;
              const busy = savingDifficulty === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleSelectDifficulty(opt.value)}
                  disabled={savingDifficulty !== null}
                  style={({ pressed }) => ({
                    flex: 1,
                    padding: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected ? '#22d3ee' : '#1e293b',
                    backgroundColor: selected ? '#0e7490' : pressed ? '#0b152b' : '#0b172b',
                    opacity: savingDifficulty && !busy ? 0.5 : 1,
                  })}
                >
                  <Text style={{ color: selected ? 'white' : '#e2e8f0', fontWeight: '800', textAlign: 'center' }}>
                    {busy ? '...' : t(opt.labelKey)}
                  </Text>
                  <Text style={{ color: selected ? '#cffafe' : '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                    {t(opt.descriptionKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          style={{
            borderRadius: 20,
            padding: 18,
            backgroundColor: '#0b172a',
            borderWidth: 1,
            borderColor: '#1f2937',
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
            {t('settings.about.eyebrow')}
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
            {t('settings.about.title')}
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
            {t('settings.about.description')}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
            <View
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
              }}
            >
              <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 12 }}>{t('settings.about.support')}</Text>
              <Text style={{ color: '#e2e8f0', marginTop: 4 }}>dcardenasgz@gmail.com</Text>
            </View>
            <View
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
              }}
            >
              <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 12 }}>{t('settings.about.version')}</Text>
              <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{appVersion}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
              {t('settings.subscription.eyebrow')}
            </Text>
            {isPro ? (
              <View
                style={{
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: '#0b172b',
                  borderWidth: 1,
                  borderColor: '#1e293b',
                }}
              >
                <Text style={{ color: '#22c55e', fontWeight: '800' }}>
                  {proInfo?.source === 'code' ? t('settings.subscription.proCode') : t('settings.subscription.proActive')}
                </Text>
                <Text style={{ color: '#e2e8f0', marginTop: 6 }}>
                  {t('settings.subscription.plan')}: {proInfo?.productId || '—'}
                </Text>
                <Text style={{ color: '#94a3b8', marginTop: 4 }}>
                  {proInfo?.source === 'code' ? t('settings.subscription.expires') : t('settings.subscription.renews')}:{' '}
                  {formatDate(proInfo?.expirationDate)}
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <Pressable
                    onPress={() => Purchases.showManageSubscriptions()}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderRadius: 12,
                      backgroundColor: pressed ? '#0f172a' : '#0b152b',
                      borderWidth: 1,
                      borderColor: '#1e293b',
                    })}
                  >
                    <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>{t('settings.subscription.manage')}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                disabled={rcLoading}
                onPress={() => navigation.navigate('Paywall', { source: 'settings_subscription' })}
                style={({ pressed }) => ({
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: rcLoading ? '#1f2937' : pressed ? '#2563eb' : '#3b82f6',
                  borderWidth: 1,
                  borderColor: '#1e3a8a',
                  opacity: rcLoading ? 0.7 : 1,
                })}
              >
                <Text style={{ color: 'white', fontWeight: '800', textAlign: 'center' }}>
                  {rcLoading ? t('settings.subscription.loading') : t('settings.subscription.becomePro')}
                </Text>
              </Pressable>
            )}
            {/* <Pressable
              onPress={() => navigation.navigate('Paywall', { source: 'settings_lite', variant: 'lite' })}
              style={({ pressed }) => ({
                marginTop: 10,
                padding: 14,
                borderRadius: 14,
                backgroundColor: pressed ? '#0e7490' : '#0891b2',
                borderWidth: 1,
                borderColor: '#155e75',
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '800', textAlign: 'center' }}>
                Ver Versión Lite
              </Text>
            </Pressable> */}
          </View>

          {__DEV__ ? (
            <View
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 14,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
              }}
            >
              <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
                {t('settings.dev.eyebrow')}
              </Text>
              <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 16, marginTop: 6 }}>
                {t('settings.dev.photosTitle')}
              </Text>
              <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
                {t('settings.dev.currentCredits')}{' '}
                {photoRequestCreditsLoading ? t('common.loading').toLowerCase() : `${photoRequestCredits}/${maxPhotoRequestCredits}`}
              </Text>
              <Pressable
                onPress={handleResetPhotoCredits}
                disabled={resettingPhotoCredits}
                style={({ pressed }) => ({
                  marginTop: 10,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: resettingPhotoCredits ? '#1f2937' : pressed ? '#0e7490' : '#0891b2',
                  borderWidth: 1,
                  borderColor: '#155e75',
                  opacity: resettingPhotoCredits ? 0.7 : 1,
                })}
              >
                <Text style={{ color: 'white', fontWeight: '800', textAlign: 'center' }}>
                  {resettingPhotoCredits ? t('settings.dev.resettingPhotos') : t('settings.dev.resetPhotos')}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {__DEV__ || Platform.OS === 'android' ? (
            <View
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: 14,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
              }}
            >
              <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
                {t('settings.code.eyebrow')}
              </Text>
              {/* <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
                Ingresa tu código promocional. Por ahora solo aceptamos códigos privados.
              </Text> */}
              <TextInput
                value={codeInput}
                onChangeText={setCodeInput}
                autoCapitalize="none"
                autoCorrect={false}
                // placeholder="Ej. PRO123"
                placeholderTextColor="#64748b"
                editable={!redeemingCode}
                style={{
                  marginTop: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#1e293b',
                  backgroundColor: '#0b1224',
                  color: '#e2e8f0',
                }}
              />
              <Pressable
                onPress={handleRedeemCode}
                disabled={redeemingCode}
                style={({ pressed }) => ({
                  marginTop: 10,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: redeemingCode ? '#1f2937' : pressed ? '#2563eb' : '#3b82f6',
                  borderWidth: 1,
                  borderColor: '#1e3a8a',
                  opacity: redeemingCode ? 0.7 : 1,
                })}
              >
                <Text style={{ color: 'white', fontWeight: '800', textAlign: 'center' }}>
                  {redeemingCode ? t('settings.code.validating') : t('settings.code.apply')}
                </Text>
              </Pressable>
              {codeFeedback ? (
                <Text
                  style={{
                    color: codeFeedback.tone === 'success' ? '#22c55e' : '#fca5a5',
                    marginTop: 8,
                    fontWeight: '700',
                  }}
                >
                  {codeFeedback.message}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={{ marginTop: 14 }}>
            <Pressable
              onPress={() => openExternal('https://www.luvaenglish.com/#privacidad')}
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: 14,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View>
                <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>{t('settings.links.privacy')}</Text>
                <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>{t('common.openInBrowser')}</Text>
              </View>
              <MaterialIcons name="open-in-new" size={18} color="#cbd5e1" />
            </Pressable>
            <Pressable
              onPress={() => openExternal('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
              style={({ pressed }) => ({
                padding: 14,
                borderRadius: 14,
                backgroundColor: '#0b172b',
                borderWidth: 1,
                borderColor: '#1e293b',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View>
                <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>{t('settings.links.terms')}</Text>
                <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>{t('common.openInBrowser')}</Text>
              </View>
              <MaterialIcons name="open-in-new" size={18} color="#cbd5e1" />
            </Pressable>
          </View>

          <View
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: '#7f1d1d',
              backgroundColor: '#1f0b10',
            }}
          >
            <Text style={{ color: '#f87171', fontSize: 12, letterSpacing: 1, fontWeight: '800', textTransform: 'uppercase' }}>
              {t('settings.danger.eyebrow')}
            </Text>
            <Text style={{ color: '#fecdd3', fontWeight: '800', fontSize: 18, marginTop: 6 }}>
              {t('settings.danger.title')}
            </Text>
            <Text style={{ color: '#fca5a5', marginTop: 6, lineHeight: 20 }}>
              {t('settings.danger.description')}
            </Text>
            <Pressable
              onPress={() => setShowResetModal(true)}
              style={({ pressed }) => ({
                marginTop: 12,
                padding: 14,
                borderRadius: 12,
                backgroundColor: pressed ? '#b91c1c' : '#dc2626',
                borderWidth: 1,
                borderColor: '#991b1b',
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <Text style={{ color: 'white', fontWeight: '800', textAlign: 'center' }}>{t('settings.danger.reset')}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!savingProfile) setShowProfileModal(false);
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              width: '100%',
              borderRadius: 16,
              backgroundColor: '#0f172a',
              padding: 18,
              borderWidth: 1,
              borderColor: '#1e293b',
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 16,
            }}
          >
            <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 18 }}>{t('settings.account.modalTitle')}</Text>
            <Text style={{ color: '#94a3b8', marginTop: 8, lineHeight: 20 }}>
              {t('settings.account.modalDescription')}
            </Text>
            <TextInput
              value={profileName}
              onChangeText={setProfileName}
              placeholder={t('settings.account.name')}
              placeholderTextColor="#64748b"
              editable={!savingProfile}
              style={{
                marginTop: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#1e293b',
                backgroundColor: '#0b1224',
                color: '#e2e8f0',
              }}
            />
            <TextInput
              value={profileBio}
              onChangeText={setProfileBio}
              placeholder={t('settings.account.bio')}
              placeholderTextColor="#64748b"
              editable={!savingProfile}
              multiline
              style={{
                marginTop: 10,
                minHeight: 82,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#1e293b',
                backgroundColor: '#0b1224',
                color: '#e2e8f0',
                textAlignVertical: 'top',
              }}
            />
            <TextInput
              value={profileGoal}
              onChangeText={setProfileGoal}
              placeholder={t('settings.account.goal')}
              placeholderTextColor="#64748b"
              editable={!savingProfile}
              multiline
              style={{
                marginTop: 10,
                minHeight: 70,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#1e293b',
                backgroundColor: '#0b1224',
                color: '#e2e8f0',
                textAlignVertical: 'top',
              }}
            />
            <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
              <Pressable
                onPress={() => {
                  if (!savingProfile) setShowProfileModal(false);
                }}
                disabled={savingProfile}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#1e293b',
                  backgroundColor: pressed ? '#0b1224' : '#0f172a',
                  opacity: savingProfile ? 0.6 : 1,
                })}
              >
                <Text style={{ color: '#e2e8f0', textAlign: 'center', fontWeight: '700' }}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveProfile}
                disabled={savingProfile}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#155e75',
                  backgroundColor: savingProfile ? '#164e63' : pressed ? '#0e7490' : '#0891b2',
                  opacity: savingProfile ? 0.7 : 1,
                })}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>
                  {savingProfile ? t('common.saving') : t('common.save')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!resetting) {
            setShowResetModal(false);
            setConfirmText('');
          }
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <View
            style={{
              width: '100%',
              borderRadius: 16,
              backgroundColor: '#0f172a',
              padding: 18,
              borderWidth: 1,
              borderColor: '#1e293b',
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 16,
            }}
          >
            <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 18 }}>{t('settings.danger.confirmTitle')}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8, lineHeight: 20 }}>
              {t('settings.danger.confirmDescription')}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 12, fontSize: 12 }}>
              {t('settings.danger.typeToConfirmPrefix')}{' '}
              <Text style={{ fontWeight: '800', color: '#f87171' }}>{resetConfirmWord}</Text>{' '}
              {t('settings.danger.typeToConfirmSuffix')}
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={resetConfirmWord}
              placeholderTextColor="#64748b"
              style={{
                marginTop: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#1e293b',
                backgroundColor: '#0b1224',
                color: '#e2e8f0',
              }}
            />
            <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
              <Pressable
                onPress={() => {
                  if (resetting) return;
                  setShowResetModal(false);
                  setConfirmText('');
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#1e293b',
                  backgroundColor: pressed ? '#0b1224' : '#0f172a',
                  opacity: resetting ? 0.6 : 1,
                })}
                disabled={resetting}
              >
                <Text style={{ color: '#e2e8f0', textAlign: 'center', fontWeight: '700' }}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmReset}
                disabled={!canConfirmReset || resetting}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#991b1b',
                  backgroundColor: !canConfirmReset || resetting ? '#7f1d1d' : pressed ? '#b91c1c' : '#dc2626',
                  opacity: resetting ? 0.7 : 1,
                })}
              >
                <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>
                  {resetting ? t('settings.danger.deleting') : t('settings.danger.confirmDelete')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <AppTabBar active="settings" />
    </SafeAreaView>
  );
}
