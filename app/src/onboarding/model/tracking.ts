import { trackMetaOnboardingStepViewed } from '../../marketing/metaAppEvents';
import { trackMixpanelOnboardingStepViewed } from '../../marketing/mixpanelEvents';
import { OnboardingStepContent } from './types';

export async function trackOnboardingStepViewed(step: OnboardingStepContent) {
  const stepId = `onboarding-step-${step.stepNumber}`;

  await Promise.all([
    trackMixpanelOnboardingStepViewed({
      stepNumber: step.stepNumber,
      stepId,
      title: step.title,
    }),
    trackMetaOnboardingStepViewed({
      stepNumber: step.stepNumber,
      stepId,
      title: step.title,
    }),
  ]);
}
