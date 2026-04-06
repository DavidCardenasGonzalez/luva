import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../auth/AuthProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailSignUp'>;
type Step = 'credentials' | 'confirmation';

export default function EmailSignUpScreen({ navigation, route }: Props) {
  const {
    isEmailAuthConfigured,
    isLoading: authLoading,
    error: authError,
    isSignedIn,
    signUpWithEmail,
    confirmEmailSignUp,
    resendEmailSignUpCode,
  } = useAuth();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState(route.params?.prefillEmail || '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | undefined>();
  const [deliveryHint, setDeliveryHint] = useState<string | undefined>();

  useEffect(() => {
    if (!isSignedIn) return;
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [isSignedIn, navigation]);

  const subtitle = useMemo(() => {
    if (step === 'confirmation') {
      return deliveryHint
        ? `Escribe el código que enviamos a ${deliveryHint}.`
        : 'Escribe el código que enviamos a tu correo para terminar el registro.';
    }
    return 'Crea tu cuenta con correo y contraseña. Después confirmas el email y entras directo al dashboard.';
  }, [deliveryHint, step]);

  const handleBack = useCallback(() => {
    if (step === 'confirmation') {
      setStep('credentials');
      setNotice(undefined);
      return;
    }
    navigation.goBack();
  }, [navigation, step]);

  const handleCreateAccount = useCallback(async () => {
    setNotice(undefined);
    try {
      const result = await signUpWithEmail(email, password);
      if (!result.requiresConfirmation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
        return;
      }

      setDeliveryHint(result.destination);
      setStep('confirmation');
      setNotice(
        result.destination
          ? `Te enviamos un código a ${result.destination}.`
          : 'Te enviamos un código a tu correo.'
      );
    } catch {
      // The provider already exposes the message through authError.
    }
  }, [email, navigation, password, signUpWithEmail]);

  const handleConfirmCode = useCallback(async () => {
    setNotice(undefined);
    try {
      await confirmEmailSignUp(email, code, password);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch {
      // The provider already exposes the message through authError.
    }
  }, [code, confirmEmailSignUp, email, navigation, password]);

  const handleResendCode = useCallback(async () => {
    setNotice(undefined);
    try {
      await resendEmailSignUpCode(email);
      setNotice(
        deliveryHint
          ? `Te reenviamos el código a ${deliveryHint}.`
          : 'Te reenviamos el código a tu correo.'
      );
    } catch {
      // The provider already exposes the message through authError.
    }
  }, [deliveryHint, email, resendEmailSignUpCode]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0b1224' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#172036' : '#111827',
                borderWidth: 1,
                borderColor: '#1f2937',
              })}
            >
              <MaterialIcons name="arrow-back" size={22} color="#e2e8f0" />
            </Pressable>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#a5f3fc', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Crear cuenta
              </Text>
              <Text style={{ color: '#e2e8f0', fontSize: 24, fontWeight: '900', marginTop: 4 }}>
                {step === 'confirmation' ? 'Confirma tu correo' : 'Alta por correo'}
              </Text>
            </View>
          </View>

          <View style={{ borderRadius: 24, overflow: 'hidden', padding: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1f2937' }}>
            <View style={{ position: 'absolute', width: 180, height: 180, backgroundColor: '#f9731633', borderRadius: 180, top: -40, right: -40 }} />
            <View style={{ position: 'absolute', width: 140, height: 140, backgroundColor: '#22c55e22', borderRadius: 140, bottom: -40, left: -30 }} />

            <Text style={{ color: '#e2e8f0', fontSize: 22, fontWeight: '900' }}>
              {step === 'confirmation' ? 'Último paso' : 'Protege tu progreso'}
            </Text>
            <Text style={{ color: '#94a3b8', marginTop: 8, lineHeight: 20 }}>
              {subtitle}
            </Text>

            <View style={{ marginTop: 18 }}>
              <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '700' }}>Correo</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!authLoading && step === 'credentials' && isEmailAuthConfigured}
                style={{
                  marginTop: 8,
                  backgroundColor: '#02061766',
                  borderWidth: 1,
                  borderColor: '#334155',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  color: '#f8fafc',
                }}
              />

              <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginTop: 14 }}>Contraseña</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                textContentType={step === 'credentials' ? 'newPassword' : 'password'}
                editable={!authLoading && step === 'credentials' && isEmailAuthConfigured}
                style={{
                  marginTop: 8,
                  backgroundColor: '#02061766',
                  borderWidth: 1,
                  borderColor: '#334155',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 13,
                  color: '#f8fafc',
                }}
              />

              {step === 'confirmation' ? (
                <>
                  <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginTop: 14 }}>Código</Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    editable={!authLoading && isEmailAuthConfigured}
                    style={{
                      marginTop: 8,
                      backgroundColor: '#02061766',
                      borderWidth: 1,
                      borderColor: '#334155',
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      color: '#f8fafc',
                      letterSpacing: 3,
                    }}
                  />
                </>
              ) : null}
            </View>

            {notice ? (
              <Text style={{ color: '#a7f3d0', marginTop: 14, lineHeight: 18 }}>
                {notice}
              </Text>
            ) : null}

            {authError ? (
              <Text style={{ color: '#fca5a5', marginTop: 14, lineHeight: 18 }}>
                {authError}
              </Text>
            ) : null}

            {!isEmailAuthConfigured ? (
              <Text style={{ color: '#fdba74', marginTop: 14, lineHeight: 18 }}>
                Configura `COGNITO_DOMAIN`, `COGNITO_CLIENT_ID` y, si usas dominio custom, `COGNITO_REGION` para habilitar este flujo.
              </Text>
            ) : null}

            <Pressable
              disabled={authLoading || !isEmailAuthConfigured}
              onPress={step === 'confirmation' ? handleConfirmCode : handleCreateAccount}
              style={({ pressed }) => ({
                marginTop: 18,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                backgroundColor: authLoading || !isEmailAuthConfigured ? '#334155' : pressed ? '#ea580c' : '#f97316',
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>
                {authLoading
                  ? step === 'confirmation'
                    ? 'Verificando...'
                    : 'Creando cuenta...'
                  : step === 'confirmation'
                  ? 'Verificar y entrar'
                  : 'Crear cuenta'}
              </Text>
            </Pressable>

            {step === 'confirmation' ? (
              <Pressable
                disabled={authLoading || !isEmailAuthConfigured}
                onPress={handleResendCode}
                style={({ pressed }) => ({
                  marginTop: 10,
                  paddingVertical: 13,
                  borderRadius: 16,
                  alignItems: 'center',
                  backgroundColor: pressed ? '#172036' : '#111827',
                  borderWidth: 1,
                  borderColor: '#334155',
                  opacity: authLoading || !isEmailAuthConfigured ? 0.6 : 1,
                })}
              >
                <Text style={{ color: '#e2e8f0', fontWeight: '800' }}>
                  Reenviar código
                </Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
