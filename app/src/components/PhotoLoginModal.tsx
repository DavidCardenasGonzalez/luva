import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthProvider';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreateAccount?: (prefillEmail?: string) => void;
};

export default function PhotoLoginModal({ visible, onClose, onCreateAccount }: Props) {
  const {
    isConfigured,
    isEmailAuthConfigured,
    isSignedIn,
    isLoading: authLoading,
    error: authError,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (visible && isSignedIn) {
      onClose();
    }
  }, [isSignedIn, onClose, visible]);

  const handleEmailSignIn = useCallback(() => {
    void signInWithEmail(email, password);
  }, [email, password, signInWithEmail]);

  // En iOS, lanzar la sesión de autenticación web (ASWebAuthenticationSession)
  // mientras este Modal de React Native sigue presentado provoca un conflicto de
  // presentación que congela la pantalla al volver del navegador. Cerramos el
  // modal primero y esperamos a que termine la animación antes de abrir OAuth.
  // La sesión vive en AuthProvider, así que cerrar el modal no cancela el login.
  const launchProviderSignIn = useCallback(
    (signIn: () => Promise<void>) => {
      onClose();
      if (Platform.OS === 'ios') {
        setTimeout(() => {
          void signIn();
        }, 350);
      } else {
        void signIn();
      }
    },
    [onClose]
  );

  const handleGoogleSignIn = useCallback(() => {
    launchProviderSignIn(signInWithGoogle);
  }, [launchProviderSignIn, signInWithGoogle]);

  const handleAppleSignIn = useCallback(() => {
    launchProviderSignIn(signInWithApple);
  }, [launchProviderSignIn, signInWithApple]);

  const handleCreateAccount = useCallback(() => {
    onCreateAccount?.(email.trim() || undefined);
  }, [email, onCreateAccount]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(4,7,17,0.78)',
            justifyContent: 'center',
            padding: 18,
          }}
          onPress={onClose}
        >
          <Pressable onPress={() => {}} style={modalStyle}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Cerrar inicio de sesión"
              style={({ pressed }) => ({
                position: 'absolute',
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                borderRadius: 999,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#e2e8f0' : '#f8fafc',
                zIndex: 1,
              })}
            >
              <MaterialIcons name="close" size={20} color="#475569" />
            </Pressable>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingTop: 22 }}
            >
              <View style={iconStyle}>
                <MaterialIcons name="add-photo-alternate" size={30} color="#2563eb" />
              </View>
              <Text style={eyebrowStyle}>Pedir fotos</Text>
              <Text style={titleStyle}>Inicia sesión para continuar</Text>
              <Text style={bodyStyle}>
                Accede con tu cuenta para pedir fotos dentro de la conversación.
              </Text>

              <View style={{ marginTop: 18 }}>
                <Pressable
                  disabled={authLoading || !isConfigured}
                  onPress={handleGoogleSignIn}
                  style={({ pressed }) => ({
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor: authLoading || !isConfigured ? '#cbd5e1' : pressed ? '#111827' : '#0f172a',
                  })}
                >
                  <Text style={{ color: authLoading || !isConfigured ? '#64748b' : '#fff', fontWeight: '900' }}>
                    {authLoading ? 'Conectando...' : 'Continuar con Google'}
                  </Text>
                </Pressable>

                {Platform.OS === 'ios' ? (
                  <Pressable
                    disabled={authLoading || !isConfigured}
                    onPress={handleAppleSignIn}
                    style={({ pressed }) => ({
                      marginTop: 10,
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: 'center',
                      backgroundColor: authLoading || !isConfigured ? '#cbd5e1' : pressed ? '#334155' : '#1e293b',
                    })}
                  >
                    <Text style={{ color: authLoading || !isConfigured ? '#64748b' : '#fff', fontWeight: '900' }}>
                      {authLoading ? 'Conectando...' : 'Continuar con Apple'}
                    </Text>
                  </Pressable>
                ) : null}

                <View style={emailBoxStyle}>
                  <Text style={emailLabelStyle}>Correo y contraseña</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@correo.com"
                    placeholderTextColor="#94a3b8"
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
                    placeholder="Contraseña"
                    placeholderTextColor="#94a3b8"
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
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: 'center',
                      backgroundColor: authLoading || !isEmailAuthConfigured ? '#bfdbfe' : pressed ? '#1d4ed8' : '#2563eb',
                    })}
                  >
                    <Text style={{ color: authLoading || !isEmailAuthConfigured ? '#475569' : '#fff', fontWeight: '900' }}>
                      {authLoading ? 'Entrando...' : 'Iniciar sesión'}
                    </Text>
                  </Pressable>

                  {onCreateAccount ? (
                    <Pressable
                      disabled={authLoading || !isEmailAuthConfigured}
                      onPress={handleCreateAccount}
                      style={({ pressed }) => ({
                        marginTop: 10,
                        paddingVertical: 12,
                        borderRadius: 14,
                        alignItems: 'center',
                        backgroundColor: pressed ? '#eff6ff' : '#ffffff',
                        borderWidth: 1,
                        borderColor: '#bfdbfe',
                        opacity: authLoading || !isEmailAuthConfigured ? 0.6 : 1,
                      })}
                    >
                      <Text style={{ color: '#1d4ed8', fontWeight: '900' }}>Crear cuenta</Text>
                    </Pressable>
                  ) : null}
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
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyle: ViewStyle = {
  width: '100%',
  maxWidth: 380,
  maxHeight: '88%',
  alignSelf: 'center',
  borderRadius: 22,
  backgroundColor: '#ffffff',
  overflow: 'hidden',
  shadowColor: '#020617',
  shadowOpacity: 0.2,
  shadowRadius: 18,
  elevation: 8,
};

const iconStyle: ViewStyle = {
  width: 58,
  height: 58,
  borderRadius: 999,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#eff6ff',
  borderWidth: 1,
  borderColor: '#bfdbfe',
  alignSelf: 'center',
};

const eyebrowStyle = {
  color: '#2563eb',
  fontSize: 12,
  fontWeight: '900' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.6,
  textAlign: 'center' as const,
  marginTop: 14,
};

const titleStyle = {
  color: '#0f172a',
  fontSize: 24,
  lineHeight: 29,
  fontWeight: '900' as const,
  textAlign: 'center' as const,
  marginTop: 6,
};

const bodyStyle = {
  color: '#475569',
  lineHeight: 21,
  textAlign: 'center' as const,
  marginTop: 8,
  fontWeight: '700' as const,
};

const emailBoxStyle: ViewStyle = {
  marginTop: 14,
  backgroundColor: '#f8fafc',
  borderRadius: 14,
  padding: 14,
  borderWidth: 1,
  borderColor: '#e2e8f0',
};

const emailLabelStyle = {
  color: '#334155',
  fontSize: 12,
  fontWeight: '900' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.4,
};

const inputStyle = {
  marginTop: 12,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#cbd5e1',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: '#0f172a',
};

const warningStyle = {
  color: '#c2410c',
  marginTop: 10,
  fontSize: 12,
  lineHeight: 18,
};
