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

const DIFFICULTY_OPTIONS: Array<{ value: EnglishDifficulty; label: string; description: string }> = [
  { value: 'easy', label: 'Fácil', description: 'Inglés claro A1-B1' },
  { value: 'medium', label: 'Medio', description: 'Inglés claro B1-B2' },
  { value: 'hard', label: 'Difícil', description: 'Inglés nativo, lenguaje natural' },
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
        productId: 'Código promocional',
        expirationDate: new Date(manualProExpiration).toISOString(),
      };
    }
    if (accountProAccess?.subscription?.isActive) {
      return {
        source: 'subscription' as const,
        productId: accountProAccess.subscription.productId || 'Suscripción activa',
        expirationDate: accountProAccess.subscription.expiresAt || null,
      };
    }
    if (accountProAccess?.code?.isActive) {
      return {
        source: 'code' as const,
        productId: 'Código promocional',
        expirationDate: accountProAccess.code.expiresAt || null,
      };
    }
    return null;
  }, [accountProAccess, customerInfo, manualProExpiration]);

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
      Alert.alert('Error', 'No pudimos guardar la dificultad. Inténtalo de nuevo.');
    } finally {
      setSavingDifficulty(null);
    }
  }, [currentDifficulty, isSignedIn, savingDifficulty, updateCurrentUser]);

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
      Alert.alert('Listo', 'Tu información de cuenta fue actualizada.');
    } catch (err) {
      console.warn('[Settings] Error al guardar perfil', err);
      Alert.alert('Error', 'No pudimos guardar tu información. Inténtalo de nuevo.');
    } finally {
      setSavingProfile(false);
    }
  }, [profileBio, profileGoal, profileName, savingProfile, updateCurrentUser]);

  const formatDate = (iso?: string | null) => {
    if (!iso) return 'Sin fecha de expiración';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const canConfirmReset = confirmText.trim().toLowerCase() === 'borrar';

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
      Alert.alert('Restaurado', 'La app quedó como recién instalada.');
    } catch (err) {
      console.warn('[Settings] Error al restaurar', err);
      Alert.alert('Error', 'No se pudo restaurar la app. Inténtalo de nuevo.');
    } finally {
      setResetting(false);
    }
  }, [canConfirmReset, clearManualProAccess, navigation, resetCoins, resetCardProgress, resetLocalSession, resetStoryProgress, resetting]);

  const handleRedeemCode = useCallback(async () => {
    const trimmed = codeInput.trim();
    if (!trimmed) {
      setCodeFeedback({ message: 'Ingresa un código para canjearlo.', tone: 'error' });
      return;
    }
    setRedeemingCode(true);
    setCodeFeedback(null);
    try {
      const result = await redeemPromoCode(trimmed);
      if (!result.success) {
        setCodeFeedback({ message: 'Código no encontrado.', tone: 'error' });
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
        message: `Código aplicado. Pro activo hasta ${expiresLabel}.`,
        tone: 'success',
      });
      setCodeInput('');
      Alert.alert('Listo', `Tu código fue aplicado y tienes Pro por ${premiumDays} días.`);
    } catch (err) {
      console.warn('[Settings] Error al canjear código', err);
      setCodeFeedback({ message: 'No pudimos validar el código. Inténtalo de nuevo.', tone: 'error' });
    } finally {
      setRedeemingCode(false);
    }
  }, [codeInput, redeemPromoCode]);

  const handleResetPhotoCredits = useCallback(async () => {
    if (resettingPhotoCredits) return;
    try {
      setResettingPhotoCredits(true);
      if (isSignedIn) {
        await api.post('/users/me/photo-request-credits/reset');
      }
      await resetPhotoRequestCredits();
      Alert.alert('Listo', 'El conteo de fotos fue reiniciado.');
    } catch (err) {
      console.warn('[Settings] Error al reiniciar fotos', err);
      Alert.alert('Error', 'No pudimos reiniciar el conteo de fotos.');
    } finally {
      setResettingPhotoCredits(false);
    }
  }, [isSignedIn, resetPhotoRequestCredits, resettingPhotoCredits]);

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
            <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '800' }}>Configuración</Text>
            <Text style={{ color: '#94a3b8', marginTop: 2 }}>Ajusta tu experiencia en Luva.</Text>
          </View>
        </View>

        <AccountProgressCard
          onCreateAccount={handleOpenEmailSignUp}
          style={{ marginBottom: 16 }}
        />

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
              Información de cuenta
            </Text>
            <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
              Tu perfil de aprendizaje
            </Text>
            <View style={{ marginTop: 12, gap: 10 }}>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0b172b', borderWidth: 1, borderColor: '#1e293b' }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800' }}>Nombre</Text>
                <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{user?.displayName || 'Sin nombre'}</Text>
              </View>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0b172b', borderWidth: 1, borderColor: '#1e293b' }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800' }}>Bio</Text>
                <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{user?.bio || 'Cuéntanos un poco sobre ti.'}</Text>
              </View>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#0b172b', borderWidth: 1, borderColor: '#1e293b' }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800' }}>Meta</Text>
                <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{user?.goal || 'Define por qué quieres aprender inglés.'}</Text>
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
              <Text style={{ color: 'white', fontWeight: '800', textAlign: 'center' }}>Editar información</Text>
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
            Dificultad
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
            Nivel de inglés
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
            Define cómo te hablarán tus amigos de IA. Afecta el nivel de inglés que usarán.
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
                    {busy ? '...' : opt.label}
                  </Text>
                  <Text style={{ color: selected ? '#cffafe' : '#94a3b8', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                    {opt.description}
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
            Sobre Luva
          </Text>
          <Text style={{ color: '#e2e8f0', fontSize: 18, fontWeight: '800', marginTop: 6 }}>
            Comunidad y soporte
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
            Si notas algo raro o tienes una idea, comparte feedback para seguir mejorando.
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
              <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 12 }}>Soporte</Text>
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
              <Text style={{ color: '#cbd5e1', fontWeight: '700', fontSize: 12 }}>Versión</Text>
              <Text style={{ color: '#e2e8f0', marginTop: 4 }}>{appVersion}</Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <Text style={{ color: '#a5f3fc', fontSize: 12, letterSpacing: 1, fontWeight: '700', textTransform: 'uppercase' }}>
              Suscripción
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
                  {proInfo?.source === 'code' ? 'Pro con código' : 'Pro activo'}
                </Text>
                <Text style={{ color: '#e2e8f0', marginTop: 6 }}>
                  Plan: {proInfo?.productId || '—'}
                </Text>
                <Text style={{ color: '#94a3b8', marginTop: 4 }}>
                  {proInfo?.source === 'code' ? 'Expira' : 'Renovación'}:{' '}
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
                    <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Gestionar en la tienda</Text>
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
                  {rcLoading ? 'Cargando...' : 'Hazte Pro'}
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
                Dev
              </Text>
              <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 16, marginTop: 6 }}>
                Fotos en chat
              </Text>
              <Text style={{ color: '#94a3b8', marginTop: 6, lineHeight: 20 }}>
                Créditos actuales:{' '}
                {photoRequestCreditsLoading ? 'cargando...' : `${photoRequestCredits}/${maxPhotoRequestCredits}`}
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
                  {resettingPhotoCredits ? 'Reiniciando...' : 'Reiniciar conteo de fotos'}
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
                Tengo un código
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
                  {redeemingCode ? 'Validando...' : 'Aplicar código'}
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
                <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Política de privacidad</Text>
                <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>Se abre en el navegador</Text>
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
                <Text style={{ color: '#e2e8f0', fontWeight: '700' }}>Términos y condiciones</Text>
                <Text style={{ color: '#94a3b8', marginTop: 4, fontSize: 12 }}>Se abre en el navegador</Text>
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
              Peligro
            </Text>
            <Text style={{ color: '#fecdd3', fontWeight: '800', fontSize: 18, marginTop: 6 }}>
              Restaurar app
            </Text>
            <Text style={{ color: '#fca5a5', marginTop: 6, lineHeight: 20 }}>
              Esto borrará tu sesión, onboarding, progreso, tours, monedas, promociones y cache local. No hay vuelta atrás.
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
              <Text style={{ color: 'white', fontWeight: '800', textAlign: 'center' }}>Restaurar app</Text>
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
            <Text style={{ color: '#e2e8f0', fontWeight: '800', fontSize: 18 }}>Editar información</Text>
            <Text style={{ color: '#94a3b8', marginTop: 8, lineHeight: 20 }}>
              Estos datos vienen del onboarding y se usan como información de tu cuenta.
            </Text>
            <TextInput
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Nombre"
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
              placeholder="Bio"
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
              placeholder="Meta"
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
                <Text style={{ color: '#e2e8f0', textAlign: 'center', fontWeight: '700' }}>Cancelar</Text>
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
                  {savingProfile ? 'Guardando...' : 'Guardar'}
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
            <Text style={{ color: '#f87171', fontWeight: '800', fontSize: 18 }}>¿Estás seguro?</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8, lineHeight: 20 }}>
              Esta acción dejará Luva como recién descargada en este dispositivo: se borrará tu sesión, onboarding, progreso, tours, monedas, promociones y cache local.
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 12, fontSize: 12 }}>
              Escribe <Text style={{ fontWeight: '800', color: '#f87171' }}>borrar</Text> para confirmar.
            </Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="borrar"
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
                <Text style={{ color: '#e2e8f0', textAlign: 'center', fontWeight: '700' }}>Cancelar</Text>
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
                  {resetting ? 'Borrando...' : 'Sí, borrar todo'}
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
