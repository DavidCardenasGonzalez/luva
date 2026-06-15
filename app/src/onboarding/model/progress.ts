import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OnboardingCharacterId,
  OnboardingPhraseSelection,
  OnboardingRequirementId,
  OnboardingSpeakingSummary,
  OnboardingStepKey,
  OnboardingStepNumber,
} from './types';

const ONBOARDING_COMPLETED_KEY = 'luva_onboarding_completed_v1';
const ONBOARDING_DRAFT_KEY = 'luva_onboarding_draft_v1';
const ONBOARDING_AFFINITY_PAYWALL_SHOWN_KEY = 'luva_onboarding_affinity_paywall_shown_v1';
export const ALWAYS_SHOW_ONBOARDING_FOR_TESTS = false;

export type OnboardingDraftProgress = {
  version: 1;
  stepNumber: OnboardingStepNumber;
  stepKey?: OnboardingStepKey;
  selectedCharacter: OnboardingCharacterId | null;
  phraseSelections: OnboardingPhraseSelection[];
  speakingSummary: OnboardingSpeakingSummary;
  updatedAt: string;
};

const REQUIREMENT_IDS = new Set<OnboardingRequirementId>(['name', 'why', 'about']);

function toStepNumber(value: unknown): OnboardingStepNumber | null {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (numberValue === 1 || numberValue === 2 || numberValue === 3 || numberValue === 4 || numberValue === 5 || numberValue === 6) {
    return numberValue;
  }
  return null;
}

function toStepKey(value: unknown): OnboardingStepKey | undefined {
  return value === 'step2B' ? value : undefined;
}

function toCharacterId(value: unknown): OnboardingCharacterId | null {
  if (value === 'zoe' || value === 'mateo') return value;
  return null;
}

function sanitizePhraseSelections(value: unknown): OnboardingPhraseSelection[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : '',
      text: typeof item.text === 'string' ? item.text : '',
    }))
    .filter((item) => item.id && item.text);
}

function sanitizeSpeakingSummary(value: unknown): OnboardingSpeakingSummary {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const messages = Array.isArray(raw.messages)
    ? raw.messages
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => ({
        role: item.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: typeof item.content === 'string' ? item.content : '',
      }))
      .filter((item) => item.content)
    : [];
  const profileRaw = raw.profile && typeof raw.profile === 'object'
    ? raw.profile as Record<string, unknown>
    : undefined;
  const profile = profileRaw
    ? {
      name: typeof profileRaw.name === 'string' ? profileRaw.name : undefined,
      bio: typeof profileRaw.bio === 'string' ? profileRaw.bio : undefined,
      goal: typeof profileRaw.goal === 'string' ? profileRaw.goal : undefined,
    }
    : undefined;
  const completedRequirementIds = Array.isArray(raw.completedRequirementIds)
    ? raw.completedRequirementIds.filter((id): id is OnboardingRequirementId => REQUIREMENT_IDS.has(id as OnboardingRequirementId))
    : [];

  return {
    messages,
    ...(profile && (profile.name || profile.bio || profile.goal) ? { profile } : {}),
    completedRequirementIds,
  };
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  if (ALWAYS_SHOW_ONBOARDING_FOR_TESTS) {
    return false;
  }

  try {
    if (await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY)) {
      return true;
    }

    const rawDraft = await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY);
    const parsedDraft = rawDraft ? JSON.parse(rawDraft) as Record<string, unknown> : undefined;
    const draftStepNumber = parsedDraft ? toStepNumber(parsedDraft.stepNumber) : null;
    if (draftStepNumber && draftStepNumber >= 5) {
      await markOnboardingCompleted();
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function getOnboardingDraftProgress(): Promise<OnboardingDraftProgress | null> {
  if (ALWAYS_SHOW_ONBOARDING_FOR_TESTS) {
    return null;
  }

  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_DRAFT_KEY);
    const parsed = raw ? JSON.parse(raw) as Record<string, unknown> : undefined;
    if (!parsed) return null;

    const stepNumber = toStepNumber(parsed.stepNumber);
    if (!stepNumber) return null;

    return {
      version: 1,
      stepNumber,
      stepKey: toStepKey(parsed.stepKey),
      selectedCharacter: toCharacterId(parsed.selectedCharacter),
      phraseSelections: sanitizePhraseSelections(parsed.phraseSelections),
      speakingSummary: sanitizeSpeakingSummary(parsed.speakingSummary),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function saveOnboardingDraftProgress(progress: Omit<OnboardingDraftProgress, 'version' | 'updatedAt'>): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({
      version: 1,
      ...progress,
      updatedAt: new Date().toISOString(),
    }));
  } catch {
    // The app can still continue if local persistence fails.
  }
}

export async function markOnboardingCompleted(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, new Date().toISOString());
    await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {
    // The app can still continue if local persistence fails.
  }
}

export async function hasShownOnboardingAffinityPaywall(): Promise<boolean> {
  try {
    return Boolean(await AsyncStorage.getItem(ONBOARDING_AFFINITY_PAYWALL_SHOWN_KEY));
  } catch {
    return false;
  }
}

export async function markOnboardingAffinityPaywallShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_AFFINITY_PAYWALL_SHOWN_KEY, new Date().toISOString());
  } catch {
    // The app can still continue if local persistence fails.
  }
}

export async function resetOnboardingProgress(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      ONBOARDING_COMPLETED_KEY,
      ONBOARDING_DRAFT_KEY,
      ONBOARDING_AFFINITY_PAYWALL_SHOWN_KEY,
    ]);
  } catch {
    // Ignore reset failures.
  }
}
