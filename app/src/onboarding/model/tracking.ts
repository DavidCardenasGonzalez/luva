import { trackMixpanelOnboardingStepViewed } from '../../marketing/mixpanelEvents';
import { OnboardingStepContent } from './types';

export async function trackOnboardingStepViewed(step: OnboardingStepContent) {
  const stepId = step.stepKey ? `onboarding-${step.stepKey}` : `onboarding-step-${step.stepNumber}`;

  await trackMixpanelOnboardingStepViewed({
    stepNumber: step.stepNumber,
    stepId,
    title: step.title,
  });
}
