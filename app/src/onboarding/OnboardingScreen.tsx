import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { fetchOnboardingContent } from './model/api';
import { markOnboardingCompleted } from './model/progress';
import { trackOnboardingStepViewed } from './model/tracking';
import {
  DEFAULT_ONBOARDING_STEPS,
  OnboardingStepContent,
} from './model/types';
import Step1 from './step-1/Step1';
import Step2 from './step-2/Step2';
import Step3 from './step-3/Step3';
import Step4 from './step-4/Step4';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const COLORS = {
  background: '#07111f',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  action: '#2563eb',
};

function renderStep(step: OnboardingStepContent, onNext: () => void) {
  if (step.stepNumber === 1) return <Step1 content={step} />;
  if (step.stepNumber === 2) return <Step2 content={step} />;
  if (step.stepNumber === 3) return <Step3 content={step} />;
  if (step.stepNumber === 4) return <Step4 content={step} onNext={onNext} />;
  return null;
}

export default function OnboardingScreen({ navigation }: Props) {
  const [steps, setSteps] = useState(DEFAULT_ONBOARDING_STEPS);
  const [stepIndex, setStepIndex] = useState(0);
  const [loadingContent, setLoadingContent] = useState(true);
  const trackedStepsRef = useRef<Set<number>>(new Set());
  const activeStep = steps[stepIndex] || DEFAULT_ONBOARDING_STEPS[0];
  const isLastStep = stepIndex >= steps.length - 1;

  useEffect(() => {
    let mounted = true;

    fetchOnboardingContent()
      .then((nextSteps) => {
        if (mounted) setSteps(nextSteps);
      })
      .finally(() => {
        if (mounted) setLoadingContent(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (trackedStepsRef.current.has(activeStep.stepNumber)) return;
    trackedStepsRef.current.add(activeStep.stepNumber);
    void trackOnboardingStepViewed(activeStep);
  }, [activeStep]);

  const finishOnboarding = useCallback(async () => {
    await markOnboardingCompleted();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Feed' }],
    });
  }, [navigation]);

  const goNext = useCallback(() => {
    if (isLastStep) {
      void finishOnboarding();
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [finishOnboarding, isLastStep, steps.length]);

  const goBack = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const showProgress = !loadingContent && steps.length > 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, paddingBottom: 18 }}>

        {/* ── Header bar ── */}
        <View
          style={{
            height: 48,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            gap: 0,
          }}
        >
          {/* Back button */}
          {stepIndex > 0 ? (
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Volver al paso anterior"
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(255, 255, 255, 0.08)',
              })}
            >
              <MaterialIcons name="arrow-back" size={22} color={COLORS.text} />
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}

          {/* Progress dots — centered, flex: 1 */}
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {loadingContent ? (
              <ActivityIndicator color={COLORS.cyan} />
            ) : showProgress ? (
              steps.map((_, i) => (
                <View
                  key={i}
                  style={{
                    height: 3,
                    width: i === stepIndex ? 24 : 14,
                    borderRadius: 2,
                    backgroundColor:
                      i === stepIndex
                        ? COLORS.cyan
                        : 'rgba(148, 163, 184, 0.28)',
                  }}
                />
              ))
            ) : null}
          </View>

          {/* "X de Y" pill */}
          {showProgress && stepIndex > 0 ? (
            <View
              style={{
                paddingHorizontal: 11,
                paddingVertical: 5,
                borderRadius: 14,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }}
            >
              <Text
                style={{
                  color: COLORS.muted,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {stepIndex + 1} de {steps.length}
              </Text>
            </View>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        {/* ── Step content ── */}
        <View style={{ flex: 1 }}>{renderStep(activeStep, goNext)}</View>

        {/* ── CTA button (hidden for steps that provide their own, e.g. Step4) ── */}
        {activeStep.primaryCta ? (
          <View style={{ paddingHorizontal: 24, marginTop: 22 }}>
            <Pressable
              onPress={goNext}
              accessibilityRole="button"
              accessibilityLabel={activeStep.primaryCta}
              style={({ pressed }) => ({
                minHeight: 60,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#1d4ed8' : COLORS.action,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '900' }}>
                {activeStep.primaryCta}
              </Text>
            </Pressable>

            {activeStep.secondaryCta ? (
              <Pressable
                onPress={() => void finishOnboarding()}
                accessibilityRole="button"
                accessibilityLabel={activeStep.secondaryCta}
                style={({ pressed }) => ({
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: COLORS.muted,
                    fontSize: 15,
                    fontWeight: '800',
                  }}
                >
                  {activeStep.secondaryCta}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
