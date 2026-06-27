import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../auth/AuthProvider';
import { markOnboardingCompleted } from '../onboarding/model/progress';
import { GradientText } from '../onboarding/components/GradientText';
import { trackMixpanelEvent } from '../marketing/mixpanelEvents';
import { useLanguage } from '../i18n/LanguageProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountAccess'>;
type AuthMode = 'login' | 'signup' | 'confirm';
type PostAuthTarget = 'feed' | 'onboarding';

const luviImage = require('../image/luvi-saying-hi.gif');
const googleLogoImage = require('../image/google-logo.png');

const COLORS = {
  background: '#07111f',
  panel: '#0b172a',
  panelSoft: '#0f1f36',
  border: '#24364f',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  blue: '#2563eb',
  green: '#34d399',
  yellow: '#facc15',
  danger: '#fca5a5',
};

const COPY = {
  en: {
    back: 'Back',
    eyebrow: 'ACCESS',
    titlePrefix: 'I already have an',
    titleHighlight: 'account',
    mascot: 'Glad to see you!',
    continueGoogle: 'Continue with Google',
    continueApple: 'Continue with Apple',
    divider: 'or continue with your email',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    password: 'Password',
    passwordPlaceholder: 'Your password',
    newPasswordPlaceholder: 'Minimum 8 characters',
    verificationCode: 'Verification code',
    signInEmail: 'Sign in with email',
    signingIn: 'Signing in...',
    signIn: 'Sign in',
    createAccount: 'Create account',
    creatingAccount: 'Creating account...',
    verifyCode: 'Verify code and enter',
    verifying: 'Verifying...',
    verifyAndEnter: 'Verify and enter',
    resendCode: 'Resend code',
    continueAnonymous: 'Start anonymously',
    codeSent: (destination?: string) => destination
      ? `We sent a code to ${destination}.`
      : 'We sent a code to your email.',
    codeResent: (destination?: string) => destination
      ? `We resent the code to ${destination}.`
      : 'We resent the code to your email.',
    emailConfigWarning: 'Configure COGNITO_DOMAIN, COGNITO_CLIENT_ID, and COGNITO_REGION to enable email and code access.',
    socialConfigWarning: 'Configure COGNITO_DOMAIN, COGNITO_CLIENT_ID, and REDIRECT_URI to use Google and Apple.',
  },
  es: {
    back: 'Volver',
    eyebrow: 'ACCESO',
    titlePrefix: 'Ya tengo una',
    titleHighlight: 'cuenta',
    mascot: '¡Me alegra verte!',
    continueGoogle: 'Continuar con Google',
    continueApple: 'Continuar con Apple',
    divider: 'o continúa con tu correo',
    email: 'Correo',
    emailPlaceholder: 'tu@correo.com',
    password: 'Contraseña',
    passwordPlaceholder: 'Tu contraseña',
    newPasswordPlaceholder: 'Mínimo 8 caracteres',
    verificationCode: 'Código de verificación',
    signInEmail: 'Iniciar sesión con correo',
    signingIn: 'Entrando...',
    signIn: 'Iniciar sesión',
    createAccount: 'Crear cuenta',
    creatingAccount: 'Creando cuenta...',
    verifyCode: 'Verificar código y entrar',
    verifying: 'Verificando...',
    verifyAndEnter: 'Verificar y entrar',
    resendCode: 'Reenviar código',
    continueAnonymous: 'Empezar anónimamente',
    codeSent: (destination?: string) => destination
      ? `Te enviamos un código a ${destination}.`
      : 'Te enviamos un código a tu correo.',
    codeResent: (destination?: string) => destination
      ? `Te reenviamos el código a ${destination}.`
      : 'Te reenviamos el código a tu correo.',
    emailConfigWarning: 'Configura COGNITO_DOMAIN, COGNITO_CLIENT_ID y COGNITO_REGION para habilitar correo y código.',
    socialConfigWarning: 'Configura COGNITO_DOMAIN, COGNITO_CLIENT_ID y REDIRECT_URI para usar Google y Apple.',
  },
};

export default function AccountAccessScreen({ navigation, route }: Props) {
  const {
    isConfigured,
    isEmailAuthConfigured,
    isSignedIn,
    isLoading: authLoading,
    error: authError,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    confirmEmailSignUp,
    resendEmailSignUpCode,
  } = useAuth();
  const { language } = useLanguage();
  const copy = COPY[language];
  const { width } = useWindowDimensions();
  const fromOnboarding = Boolean(route.params?.fromOnboarding);
  const isCompact = width < 370;
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | undefined>();
  const [deliveryHint, setDeliveryHint] = useState<string | undefined>();
  const postAuthTargetRef = useRef<PostAuthTarget>('feed');
  const postAuthHandledRef = useRef(false);

  const completePostAuth = useCallback(async () => {
    if (postAuthHandledRef.current) return;
    postAuthHandledRef.current = true;

    if (fromOnboarding && postAuthTargetRef.current === 'onboarding') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding', params: { startAtStep: 2 } }],
      });
      return;
    }

    await markOnboardingCompleted();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Feed' }],
    });
  }, [fromOnboarding, navigation]);

  useEffect(() => {
    if (!isSignedIn) return;
    void completePostAuth();
  }, [completePostAuth, isSignedIn]);

  const handleBack = useCallback(() => {
    if (authMode === 'confirm') {
      setAuthMode('signup');
      setNotice(undefined);
      return;
    }
    if (authMode === 'signup') {
      setAuthMode('login');
      setNotice(undefined);
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: fromOnboarding ? 'Onboarding' : 'Feed' }],
    });
  }, [authMode, fromOnboarding, navigation]);

  const handleContinueAnonymous = useCallback(async () => {
    void trackMixpanelEvent('anonymous_continue_selected', {
      event_category: 'auth',
      source: fromOnboarding ? 'onboarding' : 'account_access',
    });
    await markOnboardingCompleted();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Feed' }],
    });
  }, [fromOnboarding, navigation]);

  const handleGoogleSignIn = useCallback(() => {
    void trackMixpanelEvent('login_started', {
      event_category: 'auth',
      auth_provider: 'google',
      source: fromOnboarding ? 'onboarding' : 'account_access',
    });
    postAuthTargetRef.current = 'feed';
    void signInWithGoogle();
  }, [fromOnboarding, signInWithGoogle]);

  const handleAppleSignIn = useCallback(() => {
    void trackMixpanelEvent('login_started', {
      event_category: 'auth',
      auth_provider: 'apple',
      source: fromOnboarding ? 'onboarding' : 'account_access',
    });
    postAuthTargetRef.current = 'feed';
    void signInWithApple();
  }, [fromOnboarding, signInWithApple]);

  const handleEmailSignIn = useCallback(() => {
    void trackMixpanelEvent('login_started', {
      event_category: 'auth',
      auth_provider: 'email',
      source: fromOnboarding ? 'onboarding' : 'account_access',
    });
    postAuthTargetRef.current = 'feed';
    void signInWithEmail(email, password);
  }, [email, fromOnboarding, password, signInWithEmail]);

  const handleCreateAccount = useCallback(async () => {
    setNotice(undefined);
    postAuthTargetRef.current = fromOnboarding ? 'onboarding' : 'feed';
    void trackMixpanelEvent('signup_started', {
      event_category: 'auth',
      auth_provider: 'email',
      source: fromOnboarding ? 'onboarding' : 'account_access',
    });

    try {
      const result = await signUpWithEmail(email, password);
      if (!result.requiresConfirmation) return;

      setDeliveryHint(result.destination);
      setAuthMode('confirm');
      setNotice(copy.codeSent(result.destination));
    } catch {
      // AuthProvider exposes the concrete message through authError.
    }
  }, [copy, email, fromOnboarding, password, signUpWithEmail]);

  const handleConfirmCode = useCallback(async () => {
    setNotice(undefined);
    postAuthTargetRef.current = fromOnboarding ? 'onboarding' : 'feed';

    try {
      await confirmEmailSignUp(email, code, password);
    } catch {
      // AuthProvider exposes the concrete message through authError.
    }
  }, [code, confirmEmailSignUp, email, fromOnboarding, password]);

  const handleResendCode = useCallback(async () => {
    setNotice(undefined);

    try {
      await resendEmailSignUpCode(email);
      setNotice(copy.codeResent(deliveryHint));
    } catch {
      // AuthProvider exposes the concrete message through authError.
    }
  }, [copy, deliveryHint, email, resendEmailSignUpCode]);

  const showSocialLogin = authMode === 'login';
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingBottom: 26, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={copy.back}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(148,163,184,0.18)',
              })}
            >
              <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="auto-awesome" size={17} color={COLORS.cyan} />
                <Text style={{ color: COLORS.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 }}>
                  {copy.eyebrow}
                </Text>
              </View>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: isCompact ? 31 : 36,
                  lineHeight: isCompact ? 36 : 41,
                  fontWeight: '900',
                  marginTop: 8,
                }}
              >
                {copy.titlePrefix}{' '}
                <GradientText style={{ fontSize: isCompact ? 31 : 36, lineHeight: isCompact ? 36 : 41, fontWeight: '900' }}>
                  {copy.titleHighlight}
                </GradientText>
              </Text>
            </View>

            <View style={{ alignItems: 'center', width: isCompact ? 92 : 112 }}>
              <View
                style={{
                  borderRadius: 17,
                  borderWidth: 1,
                  borderColor: 'rgba(148,163,184,0.24)',
                  paddingHorizontal: 8,
                  paddingVertical: 6,
                  backgroundColor: 'rgba(15,31,54,0.96)',
                  marginBottom: -4,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 11, lineHeight: 14, textAlign: 'center', fontWeight: '800' }}>
                  {copy.mascot}
                </Text>
              </View>
              <Image
                source={luviImage}
                resizeMode="contain"
                accessibilityLabel="Luvi saludando"
                style={{ width: isCompact ? 92 : 112, height: isCompact ? 92 : 112 }}
              />
            </View>
          </View>

          <View
            style={{
              borderRadius: 22,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.panel,
              padding: 14,
              gap: 12,
            }}
          >
            {showSocialLogin ? (
              <View style={{ gap: 8 }}>
                <Pressable
                  disabled={authLoading || !isConfigured}
                  onPress={handleGoogleSignIn}
                  accessibilityRole="button"
                  accessibilityLabel={copy.continueGoogle}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 48,
                    backgroundColor: authLoading || !isConfigured ? '#cbd5e1' : pressed ? '#e2e8f0' : '#ffffff',
                    opacity: authLoading || !isConfigured ? 0.75 : 1,
                  })}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: 56,
                      width: 22,
                      height: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <GoogleLogo size={20} />
                  </View>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                    style={{ color: '#0f172a', fontSize: 16, fontWeight: '900', textAlign: 'center' }}
                  >
                    {copy.continueGoogle}
                  </Text>
                </Pressable>

                {Platform.OS === 'ios' ? (
                  <Pressable
                    disabled={authLoading || !isConfigured}
                    onPress={handleAppleSignIn}
                    accessibilityRole="button"
                    accessibilityLabel={copy.continueApple}
                    style={({ pressed }) => ({
                      minHeight: 52,
                      borderRadius: 15,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 12,
                      backgroundColor: authLoading || !isConfigured ? '#1f2937' : pressed ? '#111827' : '#020617',
                      borderWidth: 1,
                      borderColor: '#334155',
                      opacity: authLoading || !isConfigured ? 0.65 : 1,
                    })}
                  >
                    <FontAwesome name="apple" size={21} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>
                      {copy.continueApple}
                    </Text>
                  </Pressable>
                ) : null}

                <Divider label={copy.divider} />
              </View>
            ) : null}

            <View style={{ gap: 8 }}>
              <FieldLabel label={copy.email} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={copy.emailPlaceholder}
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!authLoading && isEmailAuthConfigured}
                style={inputStyle}
              />

              <FieldLabel label={copy.password} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={authMode === 'signup' ? copy.newPasswordPlaceholder : copy.passwordPlaceholder}
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                textContentType={authMode === 'signup' ? 'newPassword' : 'password'}
                editable={!authLoading && isEmailAuthConfigured}
                style={inputStyle}
              />

              {authMode === 'confirm' ? (
                <>
                  <FieldLabel label={copy.verificationCode} />
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    editable={!authLoading && isEmailAuthConfigured}
                    style={[inputStyle, { letterSpacing: 3 }]}
                  />
                </>
              ) : null}
            </View>

            {notice ? (
              <Text style={{ color: '#a7f3d0', lineHeight: 19, fontWeight: '700' }}>
                {notice}
              </Text>
            ) : null}

            {authError ? (
              <Text style={{ color: COLORS.danger, lineHeight: 19, fontWeight: '700' }}>
                {authError}
              </Text>
            ) : null}

            {!isEmailAuthConfigured ? (
              <Text style={{ color: '#fdba74', lineHeight: 18, fontSize: 12 }}>
                {copy.emailConfigWarning}
              </Text>
            ) : null}

            {!isConfigured && showSocialLogin ? (
              <Text style={{ color: '#fdba74', lineHeight: 18, fontSize: 12 }}>
                {copy.socialConfigWarning}
              </Text>
            ) : null}

            {authMode === 'login' ? (
              <>
                <Pressable
                  disabled={authLoading || !isEmailAuthConfigured}
                  onPress={handleEmailSignIn}
                  accessibilityRole="button"
                  accessibilityLabel={copy.signInEmail}
                  style={({ pressed }) => ({
                    minHeight: 54,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: authLoading || !isEmailAuthConfigured ? '#334155' : pressed ? '#1d4ed8' : COLORS.blue,
                    opacity: authLoading || !isEmailAuthConfigured ? 0.65 : 1,
                  })}
                >
                  <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '900' }}>
                    {authLoading ? copy.signingIn : copy.signIn}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={authLoading || !isEmailAuthConfigured}
                  onPress={() => {
                    setAuthMode('signup');
                    setNotice(undefined);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={copy.createAccount}
                  style={({ pressed }) => ({
                    minHeight: 58,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    backgroundColor: authLoading || !isEmailAuthConfigured ? '#1f2937' : pressed ? '#0f766e' : '#10b981',
                    borderWidth: 1,
                    borderColor: '#34d399',
                    opacity: authLoading || !isEmailAuthConfigured ? 0.65 : 1,
                  })}
                >
                  <MaterialIcons name="person-add-alt-1" size={22} color="#052e2b" />
                  <Text style={{ color: '#052e2b', fontSize: 18, fontWeight: '900' }}>
                    {copy.createAccount}
                  </Text>
                </Pressable>
              </>
            ) : null}

            {authMode === 'signup' ? (
              <>
                <Pressable
                  disabled={authLoading || !isEmailAuthConfigured}
                  onPress={handleCreateAccount}
                  accessibilityRole="button"
                  accessibilityLabel={copy.createAccount}
                  style={({ pressed }) => ({
                    minHeight: 58,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    backgroundColor: authLoading || !isEmailAuthConfigured ? '#1f2937' : pressed ? '#0f766e' : '#10b981',
                    borderWidth: 1,
                    borderColor: '#34d399',
                    opacity: authLoading || !isEmailAuthConfigured ? 0.65 : 1,
                  })}
                >
                  <MaterialIcons name="person-add-alt-1" size={22} color="#052e2b" />
                  <Text style={{ color: '#052e2b', fontSize: 18, fontWeight: '900' }}>
                    {authLoading ? copy.creatingAccount : copy.createAccount}
                  </Text>
                </Pressable>
              </>
            ) : null}

            {authMode === 'confirm' ? (
              <>
                <Pressable
                  disabled={authLoading || !isEmailAuthConfigured}
                  onPress={handleConfirmCode}
                  accessibilityRole="button"
                  accessibilityLabel={copy.verifyCode}
                  style={({ pressed }) => ({
                    minHeight: 54,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: authLoading || !isEmailAuthConfigured ? '#334155' : pressed ? '#1d4ed8' : COLORS.blue,
                    opacity: authLoading || !isEmailAuthConfigured ? 0.65 : 1,
                  })}
                >
                  <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '900' }}>
                    {authLoading ? copy.verifying : copy.verifyAndEnter}
                  </Text>
                </Pressable>

                <Pressable
                  disabled={authLoading || !isEmailAuthConfigured}
                  onPress={handleResendCode}
                  style={({ pressed }) => ({
                    minHeight: 42,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? COLORS.panelSoft : '#07111f',
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    opacity: authLoading || !isEmailAuthConfigured ? 0.6 : 1,
                  })}
                >
                  <Text style={{ color: COLORS.text, fontWeight: '800' }}>
                    {copy.resendCode}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>

          <Pressable
            onPress={handleContinueAnonymous}
            accessibilityRole="button"
            accessibilityLabel={copy.continueAnonymous}
            style={({ pressed }) => ({
              minHeight: 42,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: COLORS.muted, fontSize: 15, fontWeight: '800' }}>
              {copy.continueAnonymous}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GoogleLogo({ size = 28 }: { size?: number }) {
  return (
    <Image
      source={googleLogoImage}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
      style={{ width: size, height: size }}
    />
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <Text style={{ color: '#dbeafe', fontSize: 12, fontWeight: '800' }}>
      {label}
    </Text>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(148,163,184,0.24)' }} />
      <Text style={{ color: COLORS.muted, fontSize: 13, fontWeight: '700' }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(148,163,184,0.24)' }} />
    </View>
  );
}

const inputStyle = {
  minHeight: 46,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: COLORS.border,
  backgroundColor: '#07111f',
  color: COLORS.text,
  paddingHorizontal: 14,
  paddingVertical: 10,
  fontSize: 16,
};
