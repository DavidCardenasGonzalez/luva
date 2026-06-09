import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const banner = require('../onboarding/step-7/banner.png');

const COLORS = {
  background: '#030617',
  text: '#f8fafc',
  muted: '#cbd5e1',
  soft: '#94a3b8',
  purple: '#7c3aed',
  violet: '#a855f7',
  card: 'rgba(12, 18, 39, 0.86)',
  cardBorder: 'rgba(168, 85, 247, 0.52)',
};

type Props = {
  rewardCoins: number;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onPositiveReview: () => Promise<void> | void;
  onSubmitPrivateFeedback: (message: string) => Promise<void> | void;
};

type Step = 'question' | 'private' | 'thanks';

export default function CoinReviewRewardModal({
  rewardCoins,
  submitting = false,
  error,
  onClose,
  onPositiveReview,
  onSubmitPrivateFeedback,
}: Props) {
  const { width } = useWindowDimensions();
  const [step, setStep] = useState<Step>('question');
  const [message, setMessage] = useState('');
  const trimmedMessage = useMemo(() => message.trim(), [message]);
  const bannerHeight = width * 0.55;

  const handlePositive = async () => {
    await onPositiveReview();
    setStep('thanks');
  };

  const handlePrivateSubmit = async () => {
    if (!trimmedMessage || submitting) return;
    try {
      await onSubmitPrivateFeedback(trimmedMessage);
      setStep('thanks');
    } catch {
      // The parent owns the visible error state.
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 22 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar recompensa"
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
            })}
          >
            <MaterialIcons name="close" size={20} color={COLORS.text} />
          </Pressable>

          <View
            style={{
              paddingHorizontal: 11,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: 'rgba(124, 58, 237, 0.34)',
              borderWidth: 1,
              borderColor: 'rgba(168, 85, 247, 0.45)',
            }}
          >
            <Text style={{ color: '#ddd6fe', fontSize: 11, fontWeight: '900' }}>
              +{rewardCoins} MONEDAS
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <Text
            style={{
              color: '#c4b5fd',
              fontSize: 36,
              fontWeight: '900',
              lineHeight: 41,
              marginTop: 10,
              textAlign: 'center',
            }}
          >
            {step === 'thanks' ? 'Monedas agregadas' : `Gana ${rewardCoins} monedas`}
          </Text>
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '900', textAlign: 'center' }}>
            {step === 'thanks' ? 'Gracias por ayudarnos' : 'con una evaluación rápida'}
          </Text>
        </View>

        <View style={{ height: bannerHeight, marginHorizontal: -20, marginTop: 10 }}>
          <Image source={banner} resizeMode="contain" style={{ width, height: bannerHeight }} />
        </View>

        <View
          style={{
            borderRadius: 24,
            borderWidth: 1,
            borderColor: COLORS.cardBorder,
            backgroundColor: COLORS.card,
            padding: 18,
            marginTop: -6,
            shadowColor: COLORS.violet,
            shadowOpacity: 0.28,
            shadowRadius: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 9,
                backgroundColor: 'rgba(124, 58, 237, 0.9)',
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '900' }}>RECOMPENSA</Text>
            </View>
            <Text style={{ color: COLORS.soft, fontSize: 12, fontWeight: '800' }}>Solo una vez</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: 'rgba(124, 58, 237, 0.26)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 11,
              }}
            >
              <MaterialIcons name={step === 'thanks' ? 'check-circle' : 'workspace-premium'} size={24} color="#c4b5fd" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: '900' }}>
                {step === 'thanks' ? 'Saldo actualizado' : 'Ayúdanos con tu opinión'}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                {step === 'thanks' ? 'Ya puedes seguir practicando.' : 'Responde y recibe monedas para continuar.'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: '900', lineHeight: 32 }}>
                  {rewardCoins}
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: '900', marginLeft: 4, marginBottom: 3 }}>
                  monedas
                </Text>
              </View>
            </View>
          </View>

          <View style={{ marginTop: 15, gap: 8 }}>
            <Benefit label="Desbloquea más mensajes y prácticas." />
            <Benefit label="Si algo no te gustó, tu feedback queda privado." />
            <Benefit label="Si te gustó Luva, puedes evaluarnos en la tienda." />
          </View>

          {step === 'question' ? (
            <View style={{ marginTop: 18 }}>
              <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
                ¿Te está gustando Luva?
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 }}>
                Tu respuesta nos ayuda a decidir qué mejorar primero.
              </Text>
              <View style={{ gap: 10, marginTop: 16 }}>
                <RewardButton
                  label="Sí, me gusta"
                  icon="favorite"
                  disabled={submitting}
                  onPress={handlePositive}
                />
                <RewardButton
                  label="Todavía no"
                  icon="chat-bubble-outline"
                  variant="secondary"
                  disabled={submitting}
                  onPress={() => setStep('private')}
                />
              </View>
            </View>
          ) : null}

          {step === 'private' ? (
            <View style={{ marginTop: 18 }}>
              <Text style={{ color: COLORS.text, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
                Cuéntanos qué podemos mejorar
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 8 }}>
                Esto es privado y solo lo guardaremos en tu registro de usuario.
              </Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Escribe tu feedback..."
                placeholderTextColor="rgba(203, 213, 225, 0.52)"
                multiline
                maxLength={1200}
                textAlignVertical="top"
                style={{
                  minHeight: 124,
                  color: COLORS.text,
                  fontSize: 15,
                  lineHeight: 21,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(168, 85, 247, 0.32)',
                  backgroundColor: 'rgba(3, 7, 18, 0.70)',
                  padding: 14,
                  marginTop: 16,
                }}
              />
              {error ? (
                <Text style={{ color: '#fca5a5', fontSize: 12, lineHeight: 17, marginTop: 10 }}>{error}</Text>
              ) : null}
              <View style={{ gap: 10, marginTop: 16 }}>
                <RewardButton
                  label={submitting ? 'Guardando...' : 'Enviar y reclamar monedas'}
                  icon="send"
                  disabled={!trimmedMessage || submitting}
                  loading={submitting}
                  onPress={handlePrivateSubmit}
                />
                <Pressable
                  onPress={() => setStep('question')}
                  disabled={submitting}
                  style={({ pressed }) => ({ opacity: pressed || submitting ? 0.65 : 1, paddingVertical: 6 })}
                >
                  <Text style={{ color: COLORS.soft, fontSize: 13, fontWeight: '800', textAlign: 'center' }}>
                    Volver
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {step === 'thanks' ? (
            <View style={{ marginTop: 18 }}>
              <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>
                Agregamos {rewardCoins} monedas a tu saldo. Puedes seguir practicando ahora.
              </Text>
              <RewardButton label="Continuar" icon="arrow-forward" onPress={onClose} style={{ marginTop: 18 }} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Benefit({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MaterialIcons name="check" size={17} color="#a78bfa" />
      <Text style={{ color: COLORS.muted, fontSize: 12, marginLeft: 9, fontWeight: '700', flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}

function RewardButton({
  label,
  icon,
  variant = 'primary',
  disabled,
  loading,
  onPress,
  style,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  style?: object;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 58,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        backgroundColor: disabled
          ? 'rgba(71, 85, 105, 0.72)'
          : primary
            ? pressed
              ? '#5b21b6'
              : COLORS.purple
            : pressed
              ? 'rgba(168, 85, 247, 0.24)'
              : 'rgba(168, 85, 247, 0.14)',
        borderWidth: primary ? 0 : 1,
        borderColor: 'rgba(168, 85, 247, 0.34)',
        opacity: pressed || disabled ? 0.9 : 1,
        ...(style || {}),
      })}
    >
      {loading ? <ActivityIndicator color="#ffffff" /> : <MaterialIcons name={icon} size={21} color="#ffffff" />}
      <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '900' }}>{label}</Text>
    </Pressable>
  );
}
