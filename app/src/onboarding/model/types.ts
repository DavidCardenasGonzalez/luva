export type OnboardingStepNumber = 1 | 2 | 3 | 4;

export type OnboardingConversationMessage = {
  id: string;
  role: "learner" | "luvi" | "feedback";
  text: string;
  delayMs: number;
};

export type OnboardingStepContent = {
  stepNumber: OnboardingStepNumber;
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta?: string;
  placeholderLabel?: string;
  bullets?: string[];
  conversation?: OnboardingConversationMessage[];
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
    eyebrow: "Personalización",
    title: "Creamos un plan para ti",
    subtitle: "Selecciona las frases que más se parecen a ti para personalizar tu ruta de aprendizaje.",
    primaryCta: "Continuar",
  },
  {
    stepNumber: 3,
    eyebrow: "Elige tu compañero",
    title: "Elige a tu compañero de inglés",
    subtitle: "Practicarás conversaciones reales y mejorarás hablando con tu nuevo amigo de IA.",
    primaryCta: "Comenzar",
  },
  {
    stepNumber: 4,
    eyebrow: "Tu primera misión",
    title: "Preséntate en inglés",
    subtitle: "Cuéntanos quién eres y por qué quieres aprender inglés.",
    primaryCta: "",
  },
];
