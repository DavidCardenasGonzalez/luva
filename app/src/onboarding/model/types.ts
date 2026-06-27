import type { AppLanguage } from '../../i18n/language';

export type OnboardingStepNumber = 1 | 2 | 3 | 4 | 5 | 6;
export type OnboardingStepKey = "step2B";

export type OnboardingCharacterId = "zoe" | "mateo";
export type OnboardingRequirementId = "name" | "why" | "about";

export type OnboardingConversationMessage = {
  id: string;
  role: "learner" | "luvi" | "feedback";
  text: string;
  delayMs: number;
};

export type OnboardingStepContent = {
  stepNumber: OnboardingStepNumber;
  stepKey?: OnboardingStepKey;
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta?: string;
  placeholderLabel?: string;
  bullets?: string[];
  conversation?: OnboardingConversationMessage[];
};

export type OnboardingChatPayload = {
  friendId: string;
  aiReply: string;
  correctness: number;
  result: "correct" | "partial" | "incorrect";
  errors: string[];
  reformulations: string[];
  requirements?: Array<{
    id: "name" | "why" | "about";
    met: boolean;
    evidence?: string;
  }>;
  profile?: {
    name?: string;
    bio?: string;
    goal?: string;
  };
  objectiveComplete?: boolean;
  conversationEnded: boolean;
  conversationFeedback?: {
    summary: string;
    improvements: string[];
  } | null;
};

export type OnboardingPhraseSelection = {
  id: string;
  text: string;
};

export type OnboardingSpeakingSummary = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  profile?: {
    name?: string;
    bio?: string;
    goal?: string;
  };
  completedRequirementIds: OnboardingRequirementId[];
};

export type OnboardingPlanRequest = {
  characterId?: OnboardingCharacterId;
  phraseSelections: OnboardingPhraseSelection[];
  speaking: OnboardingSpeakingSummary;
};

export type OnboardingProgressActivity = {
  id: "mission" | "vocabularyWord" | "freeTextMessage" | "lesson" | "shadowingChapter";
  label: string;
  points: number;
  unit: string;
  description: string;
};

export type OnboardingTrainingFocusId = "aiConversation" | "shadowing" | "vocabulary" | "structures";

export type OnboardingTrainingFocus = {
  id: OnboardingTrainingFocusId;
  title: string;
  percentage: number;
  description: string;
  badge: string;
};

export type OnboardingPlanResponse = {
  title: string;
  summary: string;
  learnerName?: string;
  heroGoal: string;
  recommendedStartingPoint: string;
  focusAreas: string[];
  trainingDistribution: OnboardingTrainingFocus[];
  progressModel: {
    pointsPerLevel: number;
    currentLevel: number;
    pointsInCurrentLevel: number;
    activities: OnboardingProgressActivity[];
  };
};

export type OnboardingContentResponse = {
  steps?: unknown[];
};

export const DEFAULT_ONBOARDING_STEPS: OnboardingStepContent[] = [
  {
    stepNumber: 1,
    eyebrow: "Feedback inmediato",
    title: "Bienvenido a Luva",
    subtitle: "Tu compañero para hablar, aprender y crecer en inglés.",
    primaryCta: "Comenzar",
    conversation: [
      {
        id: "learner-rain",
        role: "learner",
        text: "I'm very tired",
        delayMs: 350,
      },
      {
        id: "luvi-rain",
        role: "luvi",
        text: "Sounds like you need a break.",
        delayMs: 1100,
      },
      {
        id: "feedback-rain",
        role: "feedback",
        text: "Correctness: 98% (Correcto)\nReformulaciones sugeridas\n- I'm exhausted.\n- I'm drained.",
        delayMs: 1850,
      },
    ],
  },
  {
    stepNumber: 2,
    stepKey: "step2B",
    eyebrow: "Nivel",
    title: "Elige tu nivel de inglés",
    subtitle: "Ajustaré la dificultad de las conversaciones para que practiques a tu ritmo.",
    primaryCta: "Continuar",
  },
  {
    stepNumber: 3,
    eyebrow: "Reels",
    title: "Encuentra tu compañero ideal",
    subtitle: "Desliza hacia arriba para descubrir personajes y conversaciones que te encantarán.",
    primaryCta: "Comenzar",
  },
  {
    stepNumber: 4,
    eyebrow: "Tu primera conversación",
    title: "Preséntate en inglés",
    subtitle: "Cuéntanos quién eres y por qué quieres aprender inglés.",
    primaryCta: "",
  },
  {
    stepNumber: 5,
    eyebrow: "Analizando respuestas",
    title: "Creando tu plan personalizado",
    subtitle: "Estamos analizando tus respuestas para diseñar la mejor ruta para ti.",
    primaryCta: "",
  },
  {
    stepNumber: 6,
    eyebrow: "Plan listo",
    title: "Tu ruta de progreso está lista",
    subtitle: "Sube de nivel acumulando puntos con misiones, vocabulario, mensajes, lecciones y shadowing.",
    primaryCta: "Entrar a Luva",
  },
];

export const DEFAULT_ONBOARDING_STEPS_EN: OnboardingStepContent[] = [
  {
    stepNumber: 1,
    eyebrow: "Instant feedback",
    title: "Welcome to Luva",
    subtitle: "Your companion for speaking, learning, and growing in English.",
    primaryCta: "Start",
    conversation: [
      {
        id: "learner-rain",
        role: "learner",
        text: "I'm very tired",
        delayMs: 350,
      },
      {
        id: "luvi-rain",
        role: "luvi",
        text: "Sounds like you need a break.",
        delayMs: 1100,
      },
      {
        id: "feedback-rain",
        role: "feedback",
        text: "Correctness: 98% (Correct)\nSuggested reformulations\n- I'm exhausted.\n- I'm drained.",
        delayMs: 1850,
      },
    ],
  },
  {
    stepNumber: 2,
    stepKey: "step2B",
    eyebrow: "Level",
    title: "Choose your English level",
    subtitle: "I will adjust conversation difficulty so you can practice at your pace.",
    primaryCta: "Continue",
  },
  {
    stepNumber: 3,
    eyebrow: "Reels",
    title: "Find your ideal companion",
    subtitle: "Swipe up to discover characters and conversations you will enjoy.",
    primaryCta: "Start",
  },
  {
    stepNumber: 4,
    eyebrow: "Your first conversation",
    title: "Introduce yourself in English",
    subtitle: "Tell us who you are and why you want to learn English.",
    primaryCta: "",
  },
  {
    stepNumber: 5,
    eyebrow: "Analyzing answers",
    title: "Creating your personalized plan",
    subtitle: "We are analyzing your answers to design the best path for you.",
    primaryCta: "",
  },
  {
    stepNumber: 6,
    eyebrow: "Plan ready",
    title: "Your progress path is ready",
    subtitle: "Level up by earning points through missions, vocabulary, messages, lessons, and shadowing.",
    primaryCta: "Enter Luva",
  },
];

export function getDefaultOnboardingSteps(language: AppLanguage): OnboardingStepContent[] {
  return language === 'es' ? DEFAULT_ONBOARDING_STEPS : DEFAULT_ONBOARDING_STEPS_EN;
}
