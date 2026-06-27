import React, { useCallback, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { useLanguage } from '../i18n/LanguageProvider';

type AccountProgressCardMode = 'auto' | 'signed-in' | 'signed-out';

type Props = {
  mode?: AccountProgressCardMode;
  style?: StyleProp<ViewStyle>;
  onCreateAccount?: (prefillEmail?: string) => void;
};

export default function AccountProgressCard({
  mode = 'auto',
  style,
  onCreateAccount,
}: Props) {
  const {
    isConfigured,
    isEmailAuthConfigured,
    isSignedIn,
    isLoading: authLoading,
    error: authError,
    user,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signOut,
  } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSignIn = useCallback(() => {
    void signInWithEmail(email, password);
  }, [email, password, signInWithEmail]);

  const handleCreateAccount = useCallback(() => {
    onCreateAccount?.(email.trim() || undefined);
  }, [email, onCreateAccount]);

  if (mode === 'signed-in' && !isSignedIn) return null;
  if (mode === 'signed-out' && isSignedIn) return null;

  if (isSignedIn) {
    return (
      <View style={[cardStyle, style]}>
        <Text style={eyebrowStyle}>{t('account.eyebrow')}</Text>
        <Text style={titleStyle}>{t('account.title')}</Text>
        <Text style={bodyStyle}>
          {t('account.signedInDescription')}
        </Text>

        <View style={{ marginTop: 14 }}>
          <View style={sessionBoxStyle}>
            <Text style={{ color: '#7c2d12', fontSize: 12, fontWeight: '700' }}>{t('account.activeSession')}</Text>
            <Text style={{ color: '#431407', marginTop: 4, fontSize: 16, fontWeight: '800' }}>
              {user?.displayName || user?.email || t('account.authenticated')}
            </Text>
            <Text style={{ color: '#9a3412', marginTop: 4 }}>
              {user?.email || t('account.linkedUser')}
            </Text>
          </View>

          <Pressable
            disabled={authLoading}
            onPress={signOut}
            style={({ pressed }) => ({
              marginTop: 12,
              paddingVertical: 13,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: authLoading ? '#fdba74' : pressed ? '#ea580c' : '#f97316',
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>
              {authLoading ? t('account.signingOut') : t('account.signOut')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      <Text style={eyebrowStyle}>{t('account.eyebrow')}</Text>
      <Text style={titleStyle}>{t('account.title')}</Text>
      <Text style={bodyStyle}>
        {t('account.signedOutDescription')}
      </Text>

      <View style={{ marginTop: 14 }}>
        <Pressable
          disabled={authLoading || !isConfigured}
          onPress={signInWithGoogle}
          style={({ pressed }) => ({
            paddingVertical: 13,
            borderRadius: 14,
            alignItems: 'center',
            backgroundColor: authLoading || !isConfigured ? '#fed7aa' : pressed ? '#111827' : '#0f172a',
          })}
        >
          <Text style={{ color: authLoading || !isConfigured ? '#9a3412' : '#fff', fontWeight: '800' }}>
            {authLoading ? t('account.connecting') : t('account.continueGoogle')}
          </Text>
        </Pressable>

        {Platform.OS === 'ios' ? (
          <Pressable
            disabled={authLoading || !isConfigured}
            onPress={signInWithApple}
            style={({ pressed }) => ({
              marginTop: 10,
              paddingVertical: 13,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: authLoading || !isConfigured ? '#ffedd5' : pressed ? '#334155' : '#1e293b',
            })}
          >
            <Text style={{ color: authLoading || !isConfigured ? '#9a3412' : '#fff', fontWeight: '800' }}>
              {authLoading ? t('account.connecting') : t('account.continueApple')}
            </Text>
          </Pressable>
        ) : null}

        <View style={emailBoxStyle}>
          <Text style={{ color: '#7c2d12', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {t('account.emailPassword')}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('account.emailPlaceholder')}
            placeholderTextColor="#c2410c88"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!authLoading && isEmailAuthConfigured}
            style={inputStyle}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('account.password')}
            placeholderTextColor="#c2410c88"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="password"
            editable={!authLoading && isEmailAuthConfigured}
            style={[inputStyle, { marginTop: 10 }]}
          />

          <Pressable
            disabled={authLoading || !isEmailAuthConfigured}
            onPress={handleEmailSignIn}
            style={({ pressed }) => ({
              marginTop: 12,
              paddingVertical: 13,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: authLoading || !isEmailAuthConfigured ? '#fed7aa' : pressed ? '#ea580c' : '#f97316',
            })}
          >
            <Text style={{ color: authLoading || !isEmailAuthConfigured ? '#9a3412' : '#fff', fontWeight: '800' }}>
              {authLoading ? t('account.signingIn') : t('account.continueEmail')}
            </Text>
          </Pressable>

          <Pressable
            disabled={authLoading || !isEmailAuthConfigured || !onCreateAccount}
            onPress={handleCreateAccount}
            style={({ pressed }) => ({
              marginTop: 10,
              paddingVertical: 12,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: pressed ? '#ffedd5' : '#fff7ed',
              borderWidth: 1,
              borderColor: '#fdba74',
              opacity: authLoading || !isEmailAuthConfigured || !onCreateAccount ? 0.6 : 1,
            })}
          >
            <Text style={{ color: '#c2410c', fontWeight: '800' }}>{t('account.create')}</Text>
          </Pressable>
        </View>

        {!isEmailAuthConfigured ? (
          <Text style={warningStyle}>
            Configura `COGNITO_DOMAIN`, `COGNITO_CLIENT_ID` y, si usas dominio custom, `COGNITO_REGION` para habilitar el acceso por correo.
          </Text>
        ) : null}

        {!isConfigured ? (
          <Text style={warningStyle}>
            Configura `COGNITO_DOMAIN`, `COGNITO_CLIENT_ID` y `REDIRECT_URI` para seguir usando Google y Apple desde Cognito Hosted UI.
          </Text>
        ) : null}

        {authError ? (
          <Text style={{ color: '#b91c1c', marginTop: 10, fontSize: 12, lineHeight: 18 }}>
            {authError}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const cardStyle: ViewStyle = {
  backgroundColor: '#fff7ed',
  borderRadius: 18,
  padding: 18,
  borderWidth: 1,
  borderColor: '#fed7aa',
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 8,
};

const eyebrowStyle = {
  color: '#9a3412',
  fontSize: 12,
  fontWeight: '800' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.6,
};

const titleStyle = {
  color: '#7c2d12',
  fontSize: 20,
  fontWeight: '900' as const,
  marginTop: 6,
};

const bodyStyle = {
  color: '#9a3412',
  marginTop: 8,
  lineHeight: 20,
};

const sessionBoxStyle: ViewStyle = {
  backgroundColor: '#ffffffcc',
  borderRadius: 14,
  padding: 14,
  borderWidth: 1,
  borderColor: '#fdba74',
};

const emailBoxStyle: ViewStyle = {
  marginTop: 14,
  backgroundColor: '#ffffffcc',
  borderRadius: 14,
  padding: 14,
  borderWidth: 1,
  borderColor: '#fdba74',
};

const inputStyle = {
  marginTop: 12,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#fdba74',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: '#431407',
};

const warningStyle = {
  color: '#c2410c',
  marginTop: 10,
  fontSize: 12,
  lineHeight: 18,
};
