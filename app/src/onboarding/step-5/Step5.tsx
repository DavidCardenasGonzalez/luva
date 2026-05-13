import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createOnboardingPlan } from '../model/api';
import {
  OnboardingCharacterId,
  OnboardingPhraseSelection,
  OnboardingPlanResponse,
  OnboardingSpeakingSummary,
  OnboardingStepContent,
} from '../model/types';
import { GradientText } from '../components/GradientText';

const luviLoading = require('../../image/luvi-loading.gif');

const COLORS = {
  background: '#07111f',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  purple: '#8b5cf6',
  card: 'rgba(15, 28, 52, 0.86)',
  cardBorder: 'rgba(148, 163, 184, 0.18)',
};

const STEP_DURATION_MS = 900;
const COMPLETED_DELAY_MS = 420;

const LOADING_STEPS = [
  {
    id: 'speaking',
    icon: 'chat-bubble',
    iconBg: 'rgba(139, 92, 246, 0.24)',
    iconColor: '#a78bfa',
    title: 'Analizando tu nivel de speaking',
    subtitle: 'Detectando fortalezas y oportunidades.',
  },
  {
    id: 'goals',
    icon: 'gps-fixed',
    iconBg: 'rgba(37, 99, 235, 0.22)',
    iconColor: '#60a5fa',
    title: 'Entendiendo tus metas',
    subtitle: 'Conectando tus respuestas con tu ruta.',
  },
  {
    id: 'areas',
    icon: 'headset',
    iconBg: 'rgba(20, 184, 166, 0.20)',
    iconColor: '#2dd4bf',
    title: 'Identificando tus áreas a mejorar',
    subtitle: 'Pronunciación, vocabulario y fluidez.',
  },
  {
    id: 'missions',
    icon: 'auto-awesome',
    iconBg: 'rgba(124, 58, 237, 0.26)',
    iconColor: '#c084fc',
    title: 'Personalizando tus misiones',
    subtitle: 'Contenido adaptado a ti y tus intereses.',
  },
  {
    id: 'plan',
    icon: 'menu-book',
    iconBg: 'rgba(79, 70, 229, 0.20)',
    iconColor: '#a5b4fc',
    title: 'Organizando tu plan de estudio',
    subtitle: 'Creando tu ruta paso a paso.',
  },
] as const;

type BackendState = 'loading' | 'ready' | 'error';

type Props = {
  content: OnboardingStepContent;
  characterId: OnboardingCharacterId;
  phraseSelections: OnboardingPhraseSelection[];
  speakingSummary: OnboardingSpeakingSummary;
  existingPlan: OnboardingPlanResponse | null;
  onPlanReady: (plan: OnboardingPlanResponse) => void;
  onNext: () => void;
};

export default function Step5({
  content,
  characterId,
  phraseSelections,
  speakingSummary,
  existingPlan,
  onPlanReady,
  onNext,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [backendState, setBackendState] = useState<BackendState>(existingPlan ? 'ready' : 'loading');
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const advancedRef = useRef(false);
  const pulseValues = useRef(LOADING_STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let mounted = true;

    if (existingPlan) {
      setBackendState('ready');
      return () => {
        mounted = false;
      };
    }

    setBackendState('loading');
    setError(null);
    createOnboardingPlan({
      characterId,
      phraseSelections,
      speaking: speakingSummary,
    })
      .then((plan) => {
        if (!mounted) return;
        onPlanReady(plan);
        setBackendState('ready');
      })
      .catch((err: any) => {
        if (!mounted) return;
        setBackendState('error');
        setError(err?.message || 'No pudimos crear tu plan personalizado.');
      });

    return () => {
      mounted = false;
    };
  }, [characterId, existingPlan, onPlanReady, phraseSelections, retryKey, speakingSummary]);

  useEffect(() => {
    const value = pulseValues[activeIndex];
    if (!value) return undefined;

    value.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: 520,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: 520,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [activeIndex, pulseValues]);

  useEffect(() => {
    const isLastStep = activeIndex >= LOADING_STEPS.length - 1;

    if (!isLastStep) {
      const timer = setTimeout(() => {
        setCompletedCount((count) => Math.max(count, activeIndex + 1));
        setActiveIndex((index) => Math.min(index + 1, LOADING_STEPS.length - 1));
      }, STEP_DURATION_MS);
      return () => clearTimeout(timer);
    }

    if (backendState !== 'ready' || advancedRef.current) return undefined;

    const timer = setTimeout(() => {
      advancedRef.current = true;
      setCompletedCount(LOADING_STEPS.length);
      setTimeout(onNext, COMPLETED_DELAY_MS);
    }, STEP_DURATION_MS);

    return () => clearTimeout(timer);
  }, [activeIndex, backendState, onNext]);

  function retryPlan() {
    advancedRef.current = false;
    setActiveIndex(0);
    setCompletedCount(0);
    setBackendState('loading');
    setError(null);
    setRetryKey((key) => key + 1);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: 'center' }}>
        <MaterialIcons name="auto-awesome" size={18} color={COLORS.purple} />
        <Text
          style={{
            color: COLORS.text,
            fontSize: 28,
            fontWeight: '900',
            lineHeight: 34,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          {'Creando tu plan\n'}
          <GradientText style={{ fontSize: 28, fontWeight: '900', lineHeight: 34 }}>
            personalizado...
          </GradientText>
        </Text>
        <Text
          style={{
            color: '#cbd5e1',
            fontSize: 14,
            lineHeight: 20,
            textAlign: 'center',
            marginTop: 10,
            maxWidth: 310,
          }}
        >
          {content.subtitle}
        </Text>

        <View
          style={{
            width: 216,
            height: 216,
            borderRadius: 108,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 26,
            marginBottom: 18,
            borderWidth: 1,
            borderColor: 'rgba(34, 211, 238, 0.42)',
            backgroundColor: 'rgba(34, 211, 238, 0.05)',
            shadowColor: COLORS.cyan,
            shadowOpacity: 0.38,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 0 },
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 178,
              height: 178,
              borderRadius: 89,
              borderWidth: 7,
              borderColor: 'rgba(139, 92, 246, 0.76)',
              borderLeftColor: COLORS.cyan,
              opacity: 0.82,
            }}
          />
          <Image
            source={luviLoading}
            resizeMode="contain"
            accessibilityLabel="Luvi cargando"
            style={{ width: 146, height: 146 }}
          />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {LOADING_STEPS.map((item, index) => {
          const completed = index < completedCount;
          const active = index === activeIndex && !completed;
          const pulse = pulseValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.72, 1],
          });

          return (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: active || completed ? 'rgba(34, 211, 238, 0.26)' : COLORS.cardBorder,
                backgroundColor: COLORS.card,
                paddingHorizontal: 12,
                paddingVertical: 12,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: item.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <MaterialIcons name={item.icon as any} size={22} color={item.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: '900', lineHeight: 19 }}>
                  {item.title}
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 1 }}>
                  {item.subtitle}
                </Text>
              </View>
              {completed ? (
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: 'rgba(124, 58, 237, 0.88)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="check" size={18} color="#ffffff" />
                </View>
              ) : active ? (
                <Animated.View style={{ opacity: pulse }}>
                  <ActivityIndicator color={COLORS.cyan} />
                </Animated.View>
              ) : (
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    borderWidth: 1,
                    borderColor: 'rgba(148, 163, 184, 0.38)',
                  }}
                />
              )}
            </View>
          );
        })}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: error ? 'rgba(248, 113, 113, 0.32)' : 'rgba(148, 163, 184, 0.14)',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          padding: 14,
          gap: 12,
          marginTop: 24,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: error ? 'rgba(248, 113, 113, 0.14)' : 'rgba(124, 58, 237, 0.20)',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MaterialIcons
            name={error ? 'error-outline' : 'auto-awesome'}
            size={20}
            color={error ? '#f87171' : '#c084fc'}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: error ? '#fecaca' : '#c084fc',
              fontSize: 13,
              fontWeight: '900',
              lineHeight: 18,
            }}
          >
            {error ? 'No pudimos terminar el análisis' : 'Esto tomará solo unos segundos.'}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, lineHeight: 17, marginTop: 1 }}>
            {error || '¡Estás a punto de comenzar algo increíble!'}
          </Text>
          {error ? (
            <Pressable
              onPress={retryPlan}
              accessibilityRole="button"
              accessibilityLabel="Reintentar crear plan"
              style={({ pressed }) => ({
                alignSelf: 'flex-start',
                marginTop: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: pressed ? '#7c2d12' : '#dc2626',
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '900' }}>
                Reintentar
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}
