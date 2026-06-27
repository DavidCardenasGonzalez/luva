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
import {
  getOnboardingDraftProgress,
  markOnboardingCompleted,
  saveOnboardingDraftProgress,
} from './model/progress';
import { trackOnboardingStepViewed } from './model/tracking';
import { getStoredJourneyPlan, saveJourneyPlan } from '../progress/journeyProgress';
import {
  getDefaultOnboardingSteps,
  OnboardingCharacterId,
  OnboardingPhraseSelection,
  OnboardingPlanResponse,
  OnboardingSpeakingSummary,
  OnboardingStepContent,
} from './model/types';
import { useLanguage } from '../i18n/LanguageProvider';
import Step1 from './step-1/Step1';
import Step2 from './step-2/Step2';
import Step2B from './step-2B/Step2B';
import Step3 from './step-3/Step3';
import Step4 from './step-4/Step4';
import Step5 from './step-5/Step5';
import Step6 from './step-6/Step6';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const COLORS = {
  background: '#07111f',
  text: '#f8fafc',
  muted: '#94a3b8',
  cyan: '#22d3ee',
  action: '#2563eb',
};

function getStepIndexForStepNumber(steps: OnboardingStepContent[], stepNumber?: number) {
  if (!stepNumber) return 0;

  const stepIndex = steps.findIndex((step) => step.stepNumber === stepNumber);
  if (stepIndex >= 0) return stepIndex;

  return Math.max(0, Math.min(stepNumber - 1, steps.length - 1));
}

function getDisplayableOnboardingStepNumber(stepNumber?: number) {
  if (!stepNumber) return undefined;
  return stepNumber >= 5 ? 3 : stepNumber;
}

function getStepIndexForDraft(steps: OnboardingStepContent[], step?: {
  stepNumber?: number;
  stepKey?: string;
}) {
  if (!step?.stepNumber) return 0;

  const stepIndex = steps.findIndex((item) => (
    item.stepNumber === step.stepNumber && item.stepKey === step.stepKey
  ));
  if (stepIndex >= 0) return stepIndex;

  return getStepIndexForStepNumber(steps, step.stepNumber);
}

function renderStep(
  step: OnboardingStepContent,
  onNext: () => void,
  selectedCharacter: OnboardingCharacterId | null,
  phraseSelections: OnboardingPhraseSelection[],
  onPhraseSelectionsChange: (selections: OnboardingPhraseSelection[]) => void,
  speakingSummary: OnboardingSpeakingSummary,
  onSpeakingSummaryChange: (summary: OnboardingSpeakingSummary) => void,
  onboardingPlan: OnboardingPlanResponse | null,
  onPlanReady: (plan: OnboardingPlanResponse) => void,
  onStartReels: () => void,
  onSkipToFeed: () => void,
) {
  if (step.stepNumber === 1) return <Step1 content={step} />;
  if (step.stepKey === 'step2B') {
    return <Step2B content={step} onNext={onNext} />;
  }
  if (step.stepNumber === 2) {
    return (
      <Step2
        content={step}
        onNext={onNext}
        onSelectionChange={onPhraseSelectionsChange}
      />
    );
  }
  if (step.stepNumber === 3) {
    return (
      <Step3
        content={step}
        onStart={onStartReels}
        onSkip={onSkipToFeed}
      />
    );
  }
  if (step.stepNumber === 4) {
    return (
      <Step4
        content={step}
        selectedCharacter={selectedCharacter}
        onNext={onNext}
        onComplete={onSpeakingSummaryChange}
      />
    );
  }
  if (step.stepNumber === 5) {
    return (
      <Step5
        content={step}
        characterId={selectedCharacter ?? 'zoe'}
        phraseSelections={phraseSelections}
        speakingSummary={speakingSummary}
        existingPlan={onboardingPlan}
        onPlanReady={onPlanReady}
        onNext={onNext}
      />
    );
  }
  if (step.stepNumber === 6) {
    return <Step6 content={step} plan={onboardingPlan} onNext={onNext} />;
  }
  return null;
}

export default function OnboardingScreen({ navigation, route }: Props) {
  const { language } = useLanguage();
  const defaultSteps = getDefaultOnboardingSteps(language);
  const existingAccountText = language === 'es' ? 'Ya tengo una cuenta' : 'I already have an account';
  const initialStartAtStepRef = useRef(route.params?.startAtStep);
  const [steps, setSteps] = useState(defaultSteps);
  const [stepIndex, setStepIndex] = useState(() => (
    getStepIndexForStepNumber(
      defaultSteps,
      getDisplayableOnboardingStepNumber(initialStartAtStepRef.current),
    )
  ));
  const [loadingContent, setLoadingContent] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<OnboardingCharacterId | null>(null);
  const [phraseSelections, setPhraseSelections] = useState<OnboardingPhraseSelection[]>([]);
  const [speakingSummary, setSpeakingSummary] = useState<OnboardingSpeakingSummary>({
    messages: [],
    completedRequirementIds: [],
  });
  const [onboardingPlan, setOnboardingPlan] = useState<OnboardingPlanResponse | null>(null);
  const trackedStepsRef = useRef<Set<string>>(new Set());
  const activeStep = steps[stepIndex] || defaultSteps[0];
  const isLastStep = stepIndex >= steps.length - 1;
  const visibleStepCount = activeStep.stepNumber <= 3
    ? steps.filter((step) => step.stepNumber <= 3).length
    : steps.length;
  const visibleStepPosition = activeStep.stepNumber <= 3
    ? Math.min(stepIndex + 1, visibleStepCount)
    : stepIndex + 1;

  useEffect(() => {
    let mounted = true;
    const startAtStep = initialStartAtStepRef.current;

    Promise.all([
      fetchOnboardingContent(language),
      startAtStep ? Promise.resolve(null) : getOnboardingDraftProgress(),
      getStoredJourneyPlan(),
    ])
      .then(([nextSteps, draftProgress, storedPlan]) => {
        if (!mounted) return;

        setSteps(nextSteps);
        if (storedPlan) {
          setOnboardingPlan(storedPlan);
        }

        if (draftProgress && !startAtStep) {
          setSelectedCharacter(draftProgress.selectedCharacter);
          setPhraseSelections(draftProgress.phraseSelections);
          setSpeakingSummary(draftProgress.speakingSummary);
        }

        const initialStepNumber = getDisplayableOnboardingStepNumber(
          startAtStep ?? draftProgress?.stepNumber,
        );
        if (initialStepNumber) {
          setStepIndex(getStepIndexForDraft(nextSteps, {
            stepNumber: initialStepNumber,
            stepKey: draftProgress?.stepKey,
          }));
        }
      })
      .finally(() => {
        if (mounted) setLoadingContent(false);
      });

    return () => {
      mounted = false;
    };
  }, [language]);

  useEffect(() => {
    if (loadingContent) return;
    const trackingKey = activeStep.stepKey || String(activeStep.stepNumber);
    if (trackedStepsRef.current.has(trackingKey)) return;
    trackedStepsRef.current.add(trackingKey);
    void trackOnboardingStepViewed(activeStep);
  }, [activeStep, loadingContent]);

  useEffect(() => {
    const requestedStep = getDisplayableOnboardingStepNumber(route.params?.startAtStep);
    if (!requestedStep || loadingContent) return;

    const nextIndex = getStepIndexForStepNumber(steps, requestedStep);
    setStepIndex(nextIndex);
    navigation.setParams({ startAtStep: undefined });
  }, [loadingContent, navigation, route.params?.startAtStep, steps]);

  useEffect(() => {
    if (loadingContent) return;

    void saveOnboardingDraftProgress({
      stepNumber: activeStep.stepNumber,
      stepKey: activeStep.stepKey,
      selectedCharacter,
      phraseSelections,
      speakingSummary,
    });
  }, [activeStep.stepNumber, loadingContent, phraseSelections, selectedCharacter, speakingSummary]);

  const finishOnboarding = useCallback(async (showLiteOffer = false, openReels = false) => {
    if (onboardingPlan) {
      await saveJourneyPlan(onboardingPlan);
    }

    await markOnboardingCompleted();
    if (showLiteOffer) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Paywall',
            params: {
              source: 'onboarding_lite_offer',
              variant: 'lite',
              closeTarget: 'Feed',
            },
          },
        ],
      });
      return;
    }

    navigation.reset({
      index: 0,
      routes: [
        openReels
          ? { name: 'Feed', params: { openReels: true } }
          : { name: 'Feed' },
      ],
    });
  }, [navigation, onboardingPlan]);

  const goToReelsForFirstConversation = useCallback(async () => {
    await markOnboardingCompleted();

    navigation.reset({
      index: 0,
      routes: [{ name: 'Feed', params: { openReels: true } }],
    });
  }, [navigation]);

  const handlePlanReady = useCallback((plan: OnboardingPlanResponse) => {
    setOnboardingPlan(plan);
    void saveJourneyPlan(plan);
  }, []);

  const goNext = useCallback(() => {
    if (isLastStep) {
      void finishOnboarding(activeStep.stepNumber === 6);
      return;
    }

    const nextStep = steps[stepIndex + 1];
    if (!nextStep || nextStep.stepNumber >= 5) {
      void finishOnboarding(false);
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [activeStep.stepNumber, finishOnboarding, isLastStep, stepIndex, steps]);

  const goBack = useCallback(() => {
    setStepIndex((current) => Math.max(0, current - 1));
  }, []);

  const openAccountAccess = useCallback(() => {
    navigation.navigate('AccountAccess', { fromOnboarding: true });
  }, [navigation]);

  const startReelsFromOnboarding = useCallback(() => {
    void goToReelsForFirstConversation();
  }, [goToReelsForFirstConversation]);

  const skipReelsFromOnboarding = useCallback(() => {
    void finishOnboarding(false, false);
  }, [finishOnboarding]);

  const showProgress = !loadingContent && visibleStepCount > 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />
      <View style={{ flex: 1, paddingBottom: activeStep.stepNumber === 4 ? 0 : 18 }}>

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
          {stepIndex > 0 && activeStep.stepNumber !== 5 ? (
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
              Array.from({ length: visibleStepCount }, (_, i) => (
                <View
                  key={i}
                  style={{
                    height: 3,
                    width: i === visibleStepPosition - 1 ? 24 : 14,
                    borderRadius: 2,
                    backgroundColor:
                      i === visibleStepPosition - 1
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
                {visibleStepPosition} de {visibleStepCount}
              </Text>
            </View>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        {/* ── Step content ── */}
        <View style={{ flex: 1 }}>
          {loadingContent ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={COLORS.cyan} />
            </View>
          ) : (
            renderStep(
              activeStep,
              goNext,
              selectedCharacter,
              phraseSelections,
              setPhraseSelections,
              speakingSummary,
              setSpeakingSummary,
              onboardingPlan,
              handlePlanReady,
              startReelsFromOnboarding,
              skipReelsFromOnboarding,
            )
          )}
        </View>

        {/* ── CTA button (hidden for steps that provide their own controls) ── */}
        {!loadingContent &&
        activeStep.primaryCta &&
        activeStep.stepKey !== 'step2B' &&
        activeStep.stepNumber !== 3 &&
        activeStep.stepNumber !== 4 &&
        activeStep.stepNumber !== 6 ? (
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

            {activeStep.stepNumber === 1 ? (
              <Pressable
                onPress={openAccountAccess}
                accessibilityRole="button"
                accessibilityLabel={existingAccountText}
                style={({ pressed }) => ({
                  minHeight: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    color: COLORS.cyan,
                    fontSize: 14,
                    fontWeight: '800',
                  }}
                >
                  {existingAccountText}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
