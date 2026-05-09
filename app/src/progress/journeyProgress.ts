import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OnboardingPlanResponse,
  OnboardingTrainingFocus,
  OnboardingTrainingFocusId,
} from '../onboarding/model/types';
import { getLearnedLessonIds } from './lessonProgress';

export const JOURNEY_TOTAL_LEVELS = 12;
export const JOURNEY_POINTS_PER_LEVEL = 120;

export type JourneyObjective = {
  id: OnboardingTrainingFocusId;
  title: string;
  percentage: number;
  targetPoints: number;
  currentPoints: number;
  targetValue: number;
  currentValue: number;
  description: string;
};

export type JourneyProgressState = {
  version: 1;
  currentLevel: number;
  pointsByFocus: Partial<Record<OnboardingTrainingFocusId, number>>;
  aiConversationMessageBaselineCount: number;
  vocabularyPracticeBaselineCount: number;
  shadowingChapterBaselineIds: string[];
  structuresLessonBaselineIds: string[];
  updatedAt: string;
};

type VocabularyPracticeCompletion = {
  id: string;
  cardId?: string;
  completedAt: string;
  points?: number;
};

export type JourneySnapshot = {
  plan: OnboardingPlanResponse | null;
  progress: JourneyProgressState;
};

const PLAN_STORAGE_KEY = '@luva/journey/onboarding-plan';
const PROGRESS_STORAGE_KEY = '@luva/journey/progress';
const AI_CONVERSATION_MESSAGE_COUNT_KEY = '@luva/journey/ai-conversation-message-count';
const VOCABULARY_PRACTICE_STORAGE_KEY = '@luva/journey/vocabulary-practice-completions';
const SHADOWING_LISTENED_STORAGE_KEY = '@luva/journey/shadowing-listened-chapters';
export const AI_CONVERSATION_POINTS_PER_MESSAGE = 0.5;
const SHADOWING_POINTS_PER_CHAPTER = 4;
const STRUCTURE_POINTS_PER_LESSON = 3;

const FOCUS_IDS: OnboardingTrainingFocusId[] = [
  'aiConversation',
  'shadowing',
  'vocabulary',
  'structures',
];

const FALLBACK_DISTRIBUTION: OnboardingTrainingFocus[] = [
  {
    id: 'aiConversation',
    title: 'Conversación AI',
    percentage: 45,
    description: 'Practica conversaciones reales con feedback inmediato.',
    badge: 'Fluidez',
  },
  {
    id: 'shadowing',
    title: 'Shadowing',
    percentage: 25,
    description: 'Entrena ritmo, escucha y pronunciación.',
    badge: 'Ritmo',
  },
  {
    id: 'vocabulary',
    title: 'Vocabulario útil',
    percentage: 20,
    description: 'Aprende palabras que usarás en situaciones reales.',
    badge: 'Palabras',
  },
  {
    id: 'structures',
    title: 'Estructuras clave',
    percentage: 10,
    description: 'Refuerza patrones para hablar con más precisión.',
    badge: 'Precisión',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function asFiniteNumber(value: unknown, fallback: number) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function getPointsPerLevel(plan?: OnboardingPlanResponse | null) {
  const configured = asFiniteNumber(plan?.progressModel?.pointsPerLevel, JOURNEY_POINTS_PER_LEVEL);
  return Math.max(1, Math.round(configured));
}

function normalizeLevel(value: unknown) {
  return clamp(Math.round(asFiniteNumber(value, 1)), 1, JOURNEY_TOTAL_LEVELS);
}

function normalizeDistribution(plan?: OnboardingPlanResponse | null) {
  const fallbackById = new Map(FALLBACK_DISTRIBUTION.map((item) => [item.id, item]));
  const planDistribution = plan && Array.isArray(plan.trainingDistribution)
    ? plan.trainingDistribution
    : [];
  const planById = new Map(
    planDistribution
      .filter((item): item is OnboardingTrainingFocus => Boolean(item && fallbackById.has(item.id)))
      .map((item) => [item.id, item]),
  );

  const merged = FOCUS_IDS.map((id) => ({
    ...fallbackById.get(id)!,
    ...planById.get(id),
  }));
  const total = merged.reduce((sum, item) => sum + Math.max(0, asFiniteNumber(item.percentage, 0)), 0);

  if (total <= 0) {
    return FALLBACK_DISTRIBUTION;
  }

  return merged.map((item) => ({
    ...item,
    percentage: (Math.max(0, asFiniteNumber(item.percentage, 0)) / total) * 100,
  }));
}

function buildTargetPoints(distribution: OnboardingTrainingFocus[], pointsPerLevel: number) {
  const targets = distribution.map((item) => Math.round((item.percentage / 100) * pointsPerLevel));
  const total = targets.reduce((sum, value) => sum + value, 0);
  const delta = pointsPerLevel - total;

  if (delta !== 0 && targets.length > 0) {
    const largestIndex = distribution.reduce((selectedIndex, item, index) => (
      item.percentage > distribution[selectedIndex].percentage ? index : selectedIndex
    ), 0);
    targets[largestIndex] = Math.max(0, targets[largestIndex] + delta);
  }

  return targets;
}

function normalizeProgress(input: unknown, plan?: OnboardingPlanResponse | null): JourneyProgressState {
  const raw = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const rawPoints = raw.pointsByFocus && typeof raw.pointsByFocus === 'object'
    ? raw.pointsByFocus as Record<string, unknown>
    : {};
  const pointsByFocus = FOCUS_IDS.reduce<Partial<Record<OnboardingTrainingFocusId, number>>>((acc, id) => {
    acc[id] = Math.max(0, Math.round(asFiniteNumber(rawPoints[id], 0)));
    return acc;
  }, {});
  const aiConversationMessageBaselineCount = Math.max(
    0,
    Math.round(asFiniteNumber(raw.aiConversationMessageBaselineCount, 0)),
  );
  const vocabularyPracticeBaselineCount = Math.max(
    0,
    Math.round(asFiniteNumber(raw.vocabularyPracticeBaselineCount, 0)),
  );
  const shadowingChapterBaselineIds = Array.isArray(raw.shadowingChapterBaselineIds)
    ? raw.shadowingChapterBaselineIds.filter((id): id is string => typeof id === 'string')
    : [];
  const structuresLessonBaselineIds = Array.isArray(raw.structuresLessonBaselineIds)
    ? raw.structuresLessonBaselineIds.filter((id): id is string => typeof id === 'string')
    : [];

  return {
    version: 1,
    currentLevel: normalizeLevel(raw.currentLevel ?? plan?.progressModel?.currentLevel),
    pointsByFocus,
    aiConversationMessageBaselineCount,
    vocabularyPracticeBaselineCount,
    shadowingChapterBaselineIds,
    structuresLessonBaselineIds,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

async function getAiConversationMessageCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(AI_CONVERSATION_MESSAGE_COUNT_KEY);
    return Math.max(0, Math.round(asFiniteNumber(raw, 0)));
  } catch {
    return 0;
  }
}

function pointsToUnits(points: number, pointsPerUnit: number) {
  if (points <= 0) return 0;
  return Math.ceil(points / pointsPerUnit);
}

async function getVocabularyPracticeCompletions(): Promise<VocabularyPracticeCompletion[]> {
  try {
    const raw = await AsyncStorage.getItem(VOCABULARY_PRACTICE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : undefined;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is VocabularyPracticeCompletion => (
      Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.completedAt === 'string')
    ));
  } catch {
    return [];
  }
}

export async function getListenedShadowingChapterIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SHADOWING_LISTENED_STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : undefined;
    return new Set(Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function buildJourneyObjectives(
  plan: OnboardingPlanResponse | null,
  progress: JourneyProgressState,
): JourneyObjective[] {
  const pointsPerLevel = getPointsPerLevel(plan);
  const distribution = normalizeDistribution(plan);
  const targets = buildTargetPoints(distribution, pointsPerLevel);

  return distribution.map((item, index) => {
    const targetPoints = targets[index];
    const currentPoints = Math.min(targetPoints, Math.max(0, Math.round(progress.pointsByFocus[item.id] || 0)));
    const usesLessonUnits = item.id === 'structures';
    const usesShadowingUnits = item.id === 'shadowing';

    return {
      id: item.id,
      title: item.id === 'aiConversation' ? 'Conversación AI' : item.title,
      percentage: Math.round(item.percentage),
      targetPoints,
      currentPoints,
      targetValue: usesLessonUnits
        ? pointsToUnits(targetPoints, STRUCTURE_POINTS_PER_LESSON)
        : usesShadowingUnits
          ? pointsToUnits(targetPoints, SHADOWING_POINTS_PER_CHAPTER)
          : targetPoints,
      currentValue: usesLessonUnits
        ? pointsToUnits(currentPoints, STRUCTURE_POINTS_PER_LESSON)
        : usesShadowingUnits
          ? pointsToUnits(currentPoints, SHADOWING_POINTS_PER_CHAPTER)
          : currentPoints,
      description: item.description,
    };
  });
}

export function getJourneyPointsPerLevel(plan: OnboardingPlanResponse | null) {
  return getPointsPerLevel(plan);
}

export async function getStoredJourneyPlan(): Promise<OnboardingPlanResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
    return raw ? JSON.parse(raw) as OnboardingPlanResponse : null;
  } catch {
    return null;
  }
}

export async function getStoredJourneyProgress(
  plan?: OnboardingPlanResponse | null,
): Promise<JourneyProgressState> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
    return normalizeProgress(raw ? JSON.parse(raw) : undefined, plan);
  } catch {
    return normalizeProgress(undefined, plan);
  }
}

export async function getJourneySnapshot(): Promise<JourneySnapshot> {
  const plan = await getStoredJourneyPlan();
  const progress = await syncJourneyPracticeProgress(plan, await getStoredJourneyProgress(plan));
  return { plan, progress };
}

export async function saveJourneyPlan(plan: OnboardingPlanResponse): Promise<void> {
  try {
    await AsyncStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));

    const existingProgress = await getStoredJourneyProgress(plan);
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({
      ...existingProgress,
      currentLevel: normalizeLevel(existingProgress.currentLevel || plan.progressModel?.currentLevel),
      updatedAt: new Date().toISOString(),
    }));
  } catch (err: any) {
    console.warn('[JourneyProgress] No se pudo guardar el plan:', err?.message || err);
  }
}

export async function saveJourneyProgress(progress: JourneyProgressState): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
  } catch (err: any) {
    console.warn('[JourneyProgress] No se pudo guardar el progreso:', err?.message || err);
  }
}

export async function syncJourneyPracticeProgress(
  plan: OnboardingPlanResponse | null,
  progress: JourneyProgressState,
): Promise<JourneyProgressState> {
  try {
    const objectives = buildJourneyObjectives(plan, progress);
    const aiConversationTarget = objectives.find((objective) => objective.id === 'aiConversation')?.targetPoints || 0;
    const vocabularyTarget = objectives.find((objective) => objective.id === 'vocabulary')?.targetPoints || 0;
    const shadowingTarget = objectives.find((objective) => objective.id === 'shadowing')?.targetPoints || 0;
    const structuresTarget = objectives.find((objective) => objective.id === 'structures')?.targetPoints || 0;
    const shadowingTargetChapters = pointsToUnits(shadowingTarget, SHADOWING_POINTS_PER_CHAPTER);
    const structuresTargetLessons = pointsToUnits(structuresTarget, STRUCTURE_POINTS_PER_LESSON);
    const aiConversationMessageCount = await getAiConversationMessageCount();
    const vocabularyCompletions = await getVocabularyPracticeCompletions();
    const listenedShadowingChapterIds = await getListenedShadowingChapterIds();
    const learnedLessonIds = await getLearnedLessonIds();
    const shadowingBaselineIds = new Set(progress.shadowingChapterBaselineIds);
    const structuresBaselineIds = new Set(progress.structuresLessonBaselineIds);
    const newAiMessageCount = Math.max(
      0,
      aiConversationMessageCount - progress.aiConversationMessageBaselineCount,
    );
    const newPracticePoints = vocabularyCompletions
      .slice(progress.vocabularyPracticeBaselineCount)
      .reduce((sum, c) => sum + (typeof c.points === 'number' ? c.points : 1), 0);
    const newShadowingCount = [...listenedShadowingChapterIds].filter((chapterId) => !shadowingBaselineIds.has(chapterId)).length;
    const newLessonsCount = [...learnedLessonIds].filter((lessonId) => !structuresBaselineIds.has(lessonId)).length;
    const aiConversationPoints = Math.min(
      aiConversationTarget,
      newAiMessageCount * AI_CONVERSATION_POINTS_PER_MESSAGE,
    );
    const vocabularyPoints = Math.min(vocabularyTarget, newPracticePoints);
    const shadowingChapters = Math.min(shadowingTargetChapters, newShadowingCount);
    const shadowingPoints = Math.min(shadowingTarget, shadowingChapters * SHADOWING_POINTS_PER_CHAPTER);
    const structuresLessons = Math.min(structuresTargetLessons, newLessonsCount);
    const structuresPoints = Math.min(structuresTarget, structuresLessons * STRUCTURE_POINTS_PER_LESSON);

    if (
      (progress.pointsByFocus.aiConversation || 0) === aiConversationPoints &&
      (progress.pointsByFocus.vocabulary || 0) === vocabularyPoints &&
      (progress.pointsByFocus.shadowing || 0) === shadowingPoints &&
      (progress.pointsByFocus.structures || 0) === structuresPoints
    ) {
      return progress;
    }

    const next = normalizeProgress({
      ...progress,
      pointsByFocus: {
        ...progress.pointsByFocus,
        aiConversation: aiConversationPoints,
        vocabulary: vocabularyPoints,
        shadowing: shadowingPoints,
        structures: structuresPoints,
      },
      updatedAt: new Date().toISOString(),
    }, plan);
    await saveJourneyProgress(next);
    return next;
  } catch (err: any) {
    console.warn('[JourneyProgress] No se pudo sincronizar practicas:', err?.message || err);
    return progress;
  }
}

export async function advanceJourneyLevel(
  plan: OnboardingPlanResponse | null,
  progress: JourneyProgressState,
): Promise<JourneyProgressState> {
  const aiConversationMessageCount = await getAiConversationMessageCount();
  const vocabularyCompletions = await getVocabularyPracticeCompletions();
  const listenedShadowingChapterIds = await getListenedShadowingChapterIds();
  const learnedLessonIds = await getLearnedLessonIds();
  const next = normalizeProgress({
    version: 1,
    currentLevel: Math.min(JOURNEY_TOTAL_LEVELS, progress.currentLevel + 1),
    pointsByFocus: {},
    aiConversationMessageBaselineCount: aiConversationMessageCount,
    vocabularyPracticeBaselineCount: vocabularyCompletions.length,
    shadowingChapterBaselineIds: [...listenedShadowingChapterIds],
    structuresLessonBaselineIds: [...learnedLessonIds],
    updatedAt: new Date().toISOString(),
  }, plan);
  await saveJourneyProgress(next);
  return next;
}

export async function recordJourneyAiConversationMessageSent(): Promise<void> {
  try {
    const current = await getAiConversationMessageCount();
    await AsyncStorage.setItem(AI_CONVERSATION_MESSAGE_COUNT_KEY, String(current + 1));
  } catch (err: any) {
    console.warn('[JourneyProgress] No se pudo registrar mensaje de conversacion AI:', err?.message || err);
  }
}

export async function recordJourneyShadowingChapterListened(chapterId?: string): Promise<void> {
  const key = String(chapterId || '').trim();
  if (!key) return;

  try {
    const listenedIds = await getListenedShadowingChapterIds();
    if (listenedIds.has(key)) return;
    listenedIds.add(key);
    await AsyncStorage.setItem(SHADOWING_LISTENED_STORAGE_KEY, JSON.stringify([...listenedIds]));
  } catch (err: any) {
    console.warn('[JourneyProgress] No se pudo registrar shadowing escuchado:', err?.message || err);
  }
}

export async function recordJourneyVocabularyQuickGuessCorrect(cardId?: string): Promise<void> {
  try {
    const completions = await getVocabularyPracticeCompletions();
    const completedAt = new Date().toISOString();
    const next: VocabularyPracticeCompletion[] = [
      ...completions,
      {
        id: `${completedAt}:${Math.random().toString(36).slice(2, 10)}`,
        ...(cardId ? { cardId } : {}),
        completedAt,
        points: 0.5,
      },
    ];
    await AsyncStorage.setItem(VOCABULARY_PRACTICE_STORAGE_KEY, JSON.stringify(next));
  } catch (err: any) {
    console.warn('[JourneyProgress] No se pudo registrar guess de vocabulario:', err?.message || err);
  }
}

export async function recordJourneyVocabularyPracticeCompleted(cardId?: string): Promise<void> {
  try {
    const completions = await getVocabularyPracticeCompletions();
    const completedAt = new Date().toISOString();
    const next: VocabularyPracticeCompletion[] = [
      ...completions,
      {
        id: `${completedAt}:${Math.random().toString(36).slice(2, 10)}`,
        ...(cardId ? { cardId } : {}),
        completedAt,
      },
    ];
    await AsyncStorage.setItem(VOCABULARY_PRACTICE_STORAGE_KEY, JSON.stringify(next));
  } catch (err: any) {
    console.warn('[JourneyProgress] No se pudo registrar practica de vocabulario:', err?.message || err);
  }
}
