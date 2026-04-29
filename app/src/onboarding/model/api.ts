import { api } from '../../api/api';
import type { FriendChatPayload } from '../../hooks/useFriends';
import {
  DEFAULT_ONBOARDING_STEPS,
  OnboardingContentResponse,
  OnboardingConversationMessage,
  OnboardingStepContent,
  OnboardingStepNumber,
} from './types';

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function asStepNumber(value: unknown): OnboardingStepNumber | undefined {
  const numberValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;

  return numberValue === 1 || numberValue === 2 || numberValue === 3 || numberValue === 4
    ? numberValue
    : undefined;
}

function sanitizeConversationMessage(input: unknown): OnboardingConversationMessage | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const id = asString(raw.id);
  const role = asString(raw.role);
  const text = asString(raw.text);
  const delayMs = typeof raw.delayMs === 'number' ? raw.delayMs : Number(raw.delayMs);

  if (!id || !text || !Number.isFinite(delayMs)) return null;
  if (role !== 'learner' && role !== 'luvi' && role !== 'feedback') return null;

  return {
    id,
    role,
    text,
    delayMs: Math.max(0, delayMs),
  };
}

function sanitizeStep(input: unknown): OnboardingStepContent | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const stepNumber = asStepNumber(raw.stepNumber);
  const title = asString(raw.title);
  const subtitle = asString(raw.subtitle);

  if (!stepNumber || !title || !subtitle) return null;

  const conversation = Array.isArray(raw.conversation)
    ? raw.conversation
        .map(sanitizeConversationMessage)
        .filter((message): message is OnboardingConversationMessage => Boolean(message))
    : undefined;

  const bullets = Array.isArray(raw.bullets)
    ? raw.bullets.map(asString).filter((bullet): bullet is string => Boolean(bullet))
    : undefined;

  return {
    stepNumber,
    eyebrow: asString(raw.eyebrow) || `Paso ${stepNumber}`,
    title,
    subtitle,
    primaryCta: asString(raw.primaryCta) || (stepNumber === 3 ? 'Comenzar' : 'Continuar'),
    secondaryCta: asString(raw.secondaryCta),
    placeholderLabel: asString(raw.placeholderLabel),
    bullets,
    conversation,
  };
}

function mergeWithDefaults(steps: OnboardingStepContent[]) {
  return DEFAULT_ONBOARDING_STEPS.map((fallback) => {
    const remote = steps.find((step) => step.stepNumber === fallback.stepNumber);
    return remote ? { ...fallback, ...remote } : fallback;
  });
}

export async function fetchOnboardingContent(): Promise<OnboardingStepContent[]> {
  try {
    const response = await api.get<OnboardingContentResponse>('/onboarding');
    const remoteSteps = Array.isArray(response?.steps)
      ? response.steps.map(sanitizeStep).filter((step): step is OnboardingStepContent => Boolean(step))
      : [];

    return remoteSteps.length ? mergeWithDefaults(remoteSteps) : DEFAULT_ONBOARDING_STEPS;
  } catch {
    return DEFAULT_ONBOARDING_STEPS;
  }
}

export async function sendOnboardingChatMessage(payload: {
  transcript: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<FriendChatPayload> {
  return api.post<FriendChatPayload>('/onboarding/chat', payload);
}
