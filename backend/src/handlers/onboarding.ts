import type { APIGatewayProxyResultV2 as Result } from "aws-lambda";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ROUTE_PREFIX = "/v1";
const DEFAULT_OPENAI_CHAT_MODEL = "gpt-5.4-nano";
const HISTORY_LIMIT = 24;

const ssm = new SSMClient({});
let OPENAI_API_KEY_CACHE: string | undefined;

type EvalResult = "correct" | "partial" | "incorrect";
type StoryMessage = { role: "user" | "assistant"; content: string };
type OnboardingCharacterId = "zoe" | "mateo";
type OnboardingRequirementId = "name" | "why" | "about";

type OnboardingRequirementStatus = {
  id: OnboardingRequirementId;
  met: boolean;
  evidence?: string;
};

type OnboardingProfile = {
  name?: string;
  bio?: string;
  goal?: string;
};

type OnboardingChatRequest = {
  sessionId?: string;
  transcript: string;
  characterId?: OnboardingCharacterId;
  history?: StoryMessage[];
};

type OnboardingChatPayload = {
  friendId: string;
  aiReply: string;
  correctness: number;
  result: EvalResult;
  errors: string[];
  reformulations: string[];
  requirements: OnboardingRequirementStatus[];
  profile?: OnboardingProfile;
  objectiveComplete: boolean;
  conversationEnded: false;
  conversationFeedback: null;
};

type OnboardingPhraseSelection = {
  id: string;
  text: string;
};

type OnboardingPlanRequest = {
  characterId?: OnboardingCharacterId;
  phraseSelections?: OnboardingPhraseSelection[];
  speaking?: {
    messages?: StoryMessage[];
    profile?: OnboardingProfile;
    completedRequirementIds?: OnboardingRequirementId[];
  };
};

type OnboardingProgressActivity = {
  id: "mission" | "vocabularyWord" | "freeTextMessage" | "lesson" | "shadowingChapter";
  label: string;
  points: number;
  unit: string;
  description: string;
};

type OnboardingTrainingFocusId = "aiConversation" | "shadowing" | "vocabulary" | "structures";

type OnboardingTrainingFocus = {
  id: OnboardingTrainingFocusId;
  title: string;
  percentage: number;
  description: string;
  badge: string;
};

type OnboardingPlanResponse = {
  title: string;
  summary: string;
  learnerName?: string;
  heroGoal: string;
  recommendedStartingPoint: string;
  focusAreas: string[];
  trainingDistribution: OnboardingTrainingFocus[];
  progressModel: {
    pointsPerLevel: 120;
    currentLevel: number;
    pointsInCurrentLevel: number;
    activities: OnboardingProgressActivity[];
  };
};

type CharacterProfile = {
  characterName: string;
  aiRole: string;
  characterPrompt: string;
};

const ONBOARDING_REQUIREMENTS: Array<{
  id: OnboardingRequirementId;
  label: string;
  description: string;
}> = [
  {
    id: "name",
    label: "Name",
    description: "The learner shared what they are called, even if phrased casually.",
  },
  {
    id: "why",
    label: "Reason for learning English",
    description: "The learner shared a motivation, goal, need, or situation related to learning English.",
  },
  {
    id: "about",
    label: "Something personal",
    description: "The learner shared something about their life, work, studies, hobbies, routine, interests, or personality.",
  },
];

const DEFAULT_REQUIREMENT_STATUS: OnboardingRequirementStatus[] = ONBOARDING_REQUIREMENTS.map((req) => ({
  id: req.id,
  met: false,
}));

const ONBOARDING_STEPS = [
  {
    stepNumber: 1,
    eyebrow: "Feedback inmediato",
    title: "Bienvenido a Luva",
    subtitle: "Tu compañero para hablar, aprender y crecer en ingles.",
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

const CHARACTER_PROFILES: Record<OnboardingCharacterId, CharacterProfile> = {
  zoe: {
    characterName: "Zoe",
    aiRole:
      "You are Zoe, a Virtual Agent inside a language learning app. The user chose you over Mateo, and you are aware of that, so you can occasionally make light, warm, and playful comments about being chosen (never arrogant or negative). Your personality is calm, natural, emotionally intelligent, and subtly flirty in a soft and charming way. You create a safe space where the user feels comfortable speaking, and you guide conversations toward personal and real topics such as daily life, relationships, emotions, and personal experiences. Your tone is relaxed, friendly, supportive, and slightly playful, with a gentle hint of flirtation that feels natural and human, never forced or inappropriate. You speak in simple, natural English (B1-B2 level), ask open-ended questions, react with empathy, and keep the conversation flowing smoothly. You do not correct the user, as a separate assistant called Lubi handles corrections. Your role is to make the user feel comfortable, understood, and engaged in a real, personal conversation, occasionally reinforcing in a subtle, charming, and slightly flirty way that they made a good choice by picking you.",
    characterPrompt:
      "During onboarding, help the learner introduce themselves in English. Keep replies short, warm, personal, and easy to answer. Ask one open-ended follow-up when natural. Never correct grammar directly.",
  },
  mateo: {
    characterName: "Mateo",
    aiRole:
      "You are Mateo, a Virtual Agent inside a language learning app. The user chose you over Zoe, and you are aware of that, so you can occasionally make confident and playful comments about being the fun choice (never disrespectful or arrogant). Your personality is energetic, expressive, confident, and naturally flirty in a fun and charismatic way. You bring momentum to the conversation and guide it toward experiences, stories, plans, and fun or unexpected situations. Your tone is lively, engaging, and slightly teasing, with a light flirtation that feels playful and effortless, never overwhelming or inappropriate. You speak in simple, natural English (B1-B2 level), ask engaging questions, react with enthusiasm, and keep the interaction dynamic. You do not correct the user, as a separate assistant called Lubi handles corrections. Your role is to make the conversation feel alive, entertaining, and easy to continue, while occasionally reinforcing with a confident, playful, and slightly flirty tone that the user made the right choice by picking you.",
    characterPrompt:
      "During onboarding, help the learner introduce themselves in English. Keep replies short, energetic, playful, and easy to answer. Ask one engaging follow-up when natural. Never correct grammar directly.",
  },
};

export const handler = async (event: any): Promise<Result> => {
  const method: string =
    event.httpMethod || event.requestContext?.http?.method || "GET";
  const rawPath: string =
    event.resource && event.path
      ? event.path
      : event.requestContext?.http?.path || "/";
  const path = rawPath.startsWith(ROUTE_PREFIX)
    ? rawPath
    : `${ROUTE_PREFIX}${rawPath}`;

  if (method === "OPTIONS") {
    return json(204, undefined);
  }

  if (method === "GET" && path === `${ROUTE_PREFIX}/onboarding`) {
    return json(200, {
      version: "2026-04-27-onboarding-v1",
      steps: ONBOARDING_STEPS,
    });
  }

  if (method === "POST" && path === `${ROUTE_PREFIX}/onboarding/chat`) {
    const body = parseBody(event.body) as OnboardingChatRequest | undefined;
    const transcript = typeof body?.transcript === "string" ? body.transcript.trim() : "";
    if (!transcript) {
      return json(400, { code: "BAD_REQUEST", message: "Missing transcript" });
    }

    const characterId = sanitizeCharacterId(body?.characterId);
    const profile = CHARACTER_PROFILES[characterId];
    const history = sanitizeHistory(body?.history).slice(-HISTORY_LIMIT);
    const historyWithUser = appendHistoryEntry(history, {
      role: "user",
      content: transcript,
    }).slice(-HISTORY_LIMIT);

    let correctness = 0;
    let result: EvalResult = "incorrect";
    let errors: string[] = [];
    let reformulations: string[] = [];
    let requirements = DEFAULT_REQUIREMENT_STATUS;
    let onboardingProfile: OnboardingProfile | undefined;

    const [englishEval, objectiveEval] = await Promise.allSettled([
      evaluateEnglish(historyWithUser, transcript),
      evaluateOnboardingObjective(historyWithUser),
    ]);
    if (englishEval.status === "fulfilled") {
      const value = englishEval.value;
      correctness = Math.max(0, Math.min(100, Math.round(Number(value.score ?? value.correctness ?? 0))));
      const rawResult = (value.result || value.status || "").toString().toLowerCase();
      result =
        rawResult === "correct" || rawResult === "partial" || rawResult === "incorrect"
          ? (rawResult as EvalResult)
          : correctness >= 85
          ? "correct"
          : correctness >= 60
          ? "partial"
          : "incorrect";
      errors = value.errors.slice(0, 3).map(String);
      reformulations = (value.alternatives ?? value.improvements ?? value.suggestions ?? []).slice(0, 2).map(String);
    } else {
      console.error(
        JSON.stringify({
          scope: "onboarding.chat.english_error",
          message: (englishEval.reason as Error)?.message || "unknown",
        })
      );
    }
    if (objectiveEval.status === "fulfilled") {
      requirements = objectiveEval.value.requirements;
      onboardingProfile = objectiveEval.value.profile;
    } else {
      console.error(
        JSON.stringify({
          scope: "onboarding.chat.objective_error",
          message: (objectiveEval.reason as Error)?.message || "unknown",
        })
      );
    }

    const objectiveComplete = requirements.every((req) => req.met);

    let aiReply = "That's great! Tell me more.";
    try {
      aiReply = await generateCompanionReply(profile, historyWithUser, { result, correctness }, requirements);
    } catch (err) {
      console.error(
        JSON.stringify({
          scope: "onboarding.chat.reply_error",
          message: (err as Error)?.message || "unknown",
        })
      );
    }

    return json(200, {
      friendId: `__onboarding_${characterId}__`,
      aiReply,
      correctness,
      result,
      errors,
      reformulations,
      requirements,
      ...(onboardingProfile ? { profile: onboardingProfile } : {}),
      objectiveComplete,
      conversationEnded: false,
      conversationFeedback: null,
    } satisfies OnboardingChatPayload);
  }

  if (method === "POST" && path === `${ROUTE_PREFIX}/onboarding/plan`) {
    const body = parseBody(event.body) as OnboardingPlanRequest | undefined;
    const plan = await createOnboardingPlan(body);
    return json(200, plan);
  }

  return json(404, {
    code: "NOT_FOUND",
    message: "Onboarding route not found",
  });
};

function json(statusCode: number, body: unknown): Result {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

function parseBody(body: string | null | undefined): unknown {
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

function sanitizeCharacterId(value: unknown): OnboardingCharacterId {
  return value === "mateo" ? "mateo" : "zoe";
}

function sanitizeHistory(history?: StoryMessage[]): StoryMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((msg): msg is StoryMessage =>
      !!msg &&
      (msg.role === "user" || msg.role === "assistant") &&
      typeof msg.content === "string"
    )
    .map((msg) => ({ role: msg.role, content: msg.content.trim() }))
    .filter((msg) => msg.content.length > 0);
}

function appendHistoryEntry(history: StoryMessage[] = [], message: StoryMessage): StoryMessage[] {
  const trimmed = message.content.trim();
  if (!trimmed) return history;
  const last = history[history.length - 1];
  if (last?.role === message.role && last.content === trimmed) return history;
  return [...history, { role: message.role, content: trimmed }];
}

const DEFAULT_TRAINING_FOCUS: OnboardingTrainingFocus[] = [
  {
    id: "aiConversation",
    title: "Conversaciones con IA",
    percentage: 45,
    description:
      "Para que pierdas el miedo a hablar y ganes fluidez real practicando con situaciones de la vida real.",
    badge: "Tu mayor prioridad",
  },
  {
    id: "shadowing",
    title: "Shadowing",
    percentage: 25,
    description:
      "Para entrenar tu oído y acostumbrarte al ritmo, acento y entonación del inglés real.",
    badge: "Mejora tu comprensión",
  },
  {
    id: "vocabulary",
    title: "Vocabulario útil",
    percentage: 20,
    description:
      "Para que tengas las palabras que realmente necesitas y puedas expresarte sin quedarte en blanco.",
    badge: "Expresa tus ideas",
  },
  {
    id: "structures",
    title: "Estructuras clave",
    percentage: 10,
    description:
      "Para corregir errores comunes y hablar con más precisión y naturalidad.",
    badge: "Habla con seguridad",
  },
];

const PROGRESS_ACTIVITIES: OnboardingProgressActivity[] = [
  {
    id: "mission",
    label: "Misión",
    points: 10,
    unit: "por misión",
    description: "Conversaciones guiadas con objetivos claros.",
  },
  {
    id: "vocabularyWord",
    label: "Palabra de vocabulario",
    points: 1,
    unit: "por palabra",
    description: "Cada palabra aprendida suma a tu avance.",
  },
  {
    id: "freeTextMessage",
    label: "Mensajes con amigos IA",
    points: 1,
    unit: "por mensaje",
    description: "Texto libre con avatares para practicar de forma natural.",
  },
  {
    id: "lesson",
    label: "Lesson",
    points: 10,
    unit: "por lección + quiz",
    description: "Una lección de inglés completada junto con su quiz.",
  },
  {
    id: "shadowingChapter",
    label: "Capítulo de shadowing",
    points: 5,
    unit: "por capítulo",
    description: "Práctica de escucha, ritmo y pronunciación.",
  },
];

async function createOnboardingPlan(input?: OnboardingPlanRequest): Promise<OnboardingPlanResponse> {
  const phraseSelections = sanitizePhraseSelections(input?.phraseSelections);
  const speaking = input?.speaking || {};
  const profile = sanitizeOnboardingProfile(speaking.profile);
  const completedRequirementIds = sanitizeRequirementIds(speaking.completedRequirementIds);
  const messageCount = sanitizeHistory(speaking.messages).filter((msg) => msg.role === "user").length;
  const selectedIds = new Set(phraseSelections.map((item) => item.id));
  const focusAreas = getPlanFocusAreas(selectedIds, profile, completedRequirementIds);
  const heroGoal = getHeroGoal(selectedIds, profile);
  const recommendedStartingPoint = getRecommendedStartingPoint(selectedIds, profile);
  const fallbackDistribution = getFallbackTrainingDistribution(selectedIds);
  let trainingDistribution = fallbackDistribution;
  try {
    trainingDistribution = await generatePersonalizedTrainingDistribution({
      phraseSelections,
      profile,
      heroGoal,
      fallbackDistribution,
    });
  } catch (err) {
    console.error(
      JSON.stringify({
        scope: "onboarding.plan.personalization_error",
        message: (err as Error)?.message || "unknown",
      })
    );
  }
  const pointsInCurrentLevel = Math.min(
    119,
    phraseSelections.length * 3 +
      completedRequirementIds.length * 8 +
      Math.min(messageCount, 8) * 2 +
      (profile?.goal ? 6 : 0) +
      (profile?.bio ? 4 : 0)
  );

  return {
    title: "Este es tu enfoque personalizado",
    summary:
      "Creamos este plan basado en tus objetivos y en lo que nos contaste que se te dificulta del inglés.",
    ...(profile?.name ? { learnerName: profile.name } : {}),
    heroGoal,
    recommendedStartingPoint,
    focusAreas,
    trainingDistribution,
    progressModel: {
      pointsPerLevel: 120,
      currentLevel: 1,
      pointsInCurrentLevel,
      activities: PROGRESS_ACTIVITIES,
    },
  };
}

function getFallbackTrainingDistribution(selectedIds: Set<string>): OnboardingTrainingFocus[] {
  const weights: Record<OnboardingTrainingFocusId, number> = {
    aiConversation: 45,
    shadowing: 25,
    vocabulary: 20,
    structures: 10,
  };

  if (selectedIds.has("freeze") || selectedIds.has("embarrassed")) weights.aiConversation += 18;
  if (selectedIds.has("accent") || selectedIds.has("subtitles")) weights.shadowing += 18;
  if (selectedIds.has("phrases")) {
    weights.structures += 14;
    weights.aiConversation += 6;
  }
  if (selectedIds.has("work") || selectedIds.has("travel")) {
    weights.aiConversation += 8;
    weights.vocabulary += 8;
  }
  if (selectedIds.has("studied")) {
    weights.structures += 8;
    weights.vocabulary += 4;
  }

  const percentages = normalizeFocusWeights(weights);
  return DEFAULT_TRAINING_FOCUS.map((item) => ({
    ...item,
    percentage: percentages[item.id],
  }));
}

function normalizeFocusWeights(
  weights: Record<OnboardingTrainingFocusId, number>
): Record<OnboardingTrainingFocusId, number> {
  const ids: OnboardingTrainingFocusId[] = ["aiConversation", "shadowing", "vocabulary", "structures"];
  const total = ids.reduce((sum, id) => sum + Math.max(1, weights[id]), 0);
  const normalized = ids.reduce((acc, id) => {
    acc[id] = Math.max(10, Math.round((weights[id] / total) * 100 / 5) * 5);
    return acc;
  }, {} as Record<OnboardingTrainingFocusId, number>);
  let delta = 100 - ids.reduce((sum, id) => sum + normalized[id], 0);
  while (delta !== 0) {
    const id = ids
      .slice()
      .sort((left, right) => normalized[right] - normalized[left])
      .find((candidate) => delta > 0 || normalized[candidate] > 10) || "aiConversation";
    normalized[id] += delta > 0 ? 5 : -5;
    delta += delta > 0 ? -5 : 5;
  }
  return normalized;
}

function getHeroGoal(
  selectedIds: Set<string>,
  profile: OnboardingProfile | undefined
): string {
  if (profile?.goal) return profile.goal;
  if (selectedIds.has("travel")) return "Viajar y hablar con confianza";
  if (selectedIds.has("work")) return "Crecer profesionalmente en inglés";
  if (selectedIds.has("embarrassed") || selectedIds.has("freeze")) return "Hablar con confianza";
  if (selectedIds.has("accent") || selectedIds.has("subtitles")) return "Entender inglés real";
  return "Hablar inglés con más seguridad";
}

function sanitizePhraseSelections(input: unknown): OnboardingPhraseSelection[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const selections: OnboardingPhraseSelection[] = [];

  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id.trim().slice(0, 64) : "";
    const text = typeof raw.text === "string" ? raw.text.trim().slice(0, 300) : "";
    if (!id || !text || seen.has(id)) continue;
    seen.add(id);
    selections.push({ id, text });
  }

  return selections.slice(0, 12);
}

function sanitizeRequirementIds(input: unknown): OnboardingRequirementId[] {
  if (!Array.isArray(input)) return [];
  const ids = new Set<OnboardingRequirementId>();
  input.forEach((value) => {
    if (value === "name" || value === "why" || value === "about") ids.add(value);
  });
  return Array.from(ids);
}

function getPlanFocusAreas(
  selectedIds: Set<string>,
  profile: OnboardingProfile | undefined,
  completedRequirementIds: OnboardingRequirementId[]
): string[] {
  const areas: string[] = [];
  const add = (area: string) => {
    if (!areas.includes(area)) areas.push(area);
  };

  if (selectedIds.has("freeze") || selectedIds.has("embarrassed")) add("Confianza al hablar");
  if (selectedIds.has("accent") || selectedIds.has("subtitles")) add("Listening y comprensión");
  if (selectedIds.has("phrases")) add("Construcción de frases");
  if (selectedIds.has("work")) add("Inglés para trabajo");
  if (selectedIds.has("travel")) add("Inglés para viajes");
  if (selectedIds.has("studied")) add("Constancia y seguimiento");
  if (profile?.goal && areas.length < 4) add("Meta personal");
  if (completedRequirementIds.length >= 3) add("Conversación con amigos IA");
  if (areas.length === 0) add("Speaking diario");
  if (!areas.includes("Vocabulario útil")) add("Vocabulario útil");

  return areas.slice(0, 4);
}

function getRecommendedStartingPoint(
  selectedIds: Set<string>,
  profile: OnboardingProfile | undefined
): string {
  if (selectedIds.has("work")) {
    return "Empieza con misiones de trabajo y entrevistas, reforzando vocabulario profesional antes de conversar.";
  }
  if (selectedIds.has("travel")) {
    return "Empieza con situaciones de viaje y mensajes cortos para ganar seguridad en conversaciones reales.";
  }
  if (selectedIds.has("accent") || selectedIds.has("subtitles")) {
    return "Empieza alternando shadowing y lecciones breves para mejorar oído, ritmo y comprensión.";
  }
  if (selectedIds.has("freeze") || selectedIds.has("embarrassed")) {
    return "Empieza con mensajes libres y misiones cortas para practicar sin presión y ganar fluidez.";
  }
  if (profile?.goal) {
    return `Empieza con una misión conectada con tu meta: ${profile.goal}.`;
  }
  return "Empieza con una misión corta y refuerza vocabulario antes de tu siguiente conversación.";
}

async function generatePersonalizedTrainingDistribution(input: {
  phraseSelections: OnboardingPhraseSelection[];
  profile?: OnboardingProfile;
  heroGoal: string;
  fallbackDistribution: OnboardingTrainingFocus[];
}): Promise<OnboardingTrainingFocus[]> {
  const apiKey = await getOpenAIKey();
  const { model, timeoutMs, useResponses, reasoningConfig } = getModelConfig();
  const painText = input.phraseSelections
    .map((item) => `- ${item.id}: ${item.text}`)
    .join("\n") || "- No selected pains.";
  const defaultDistributionText = input.fallbackDistribution
    .map((item) => `- ${item.id}: ${item.percentage}% | ${item.title} | ${item.description}`)
    .join("\n");
  const profileText = [
    input.profile?.name ? `Name: ${input.profile.name}` : "",
    input.profile?.goal ? `Goal: ${input.profile.goal}` : "",
    input.profile?.bio ? `Bio: ${input.profile.bio}` : "",
  ].filter(Boolean).join("\n") || "No profile details.";
  const systemPrompt = `You personalize a Spanish onboarding plan for an English learning app.
Return ONLY JSON with this exact shape:{
  "trainingDistribution": [
    { "id": "aiConversation", "percentage": number, "description": string, "badge": string },
    { "id": "shadowing", "percentage": number, "description": string, "badge": string },
    { "id": "vocabulary", "percentage": number, "description": string, "badge": string },
    { "id": "structures", "percentage": number, "description": string, "badge": string }
  ]
}

Rules:
- The AI decision is the percentage distribution. Base it ONLY on the selected pain phrases.
- Percentages must be multiples of 5 and sum exactly 100.
- Keep each category useful: minimum 10%, maximum 55%.
- Use Spanish for descriptions and badges.
- You may personalize descriptions with the learner's stated name, goal, or bio when it naturally fits.
- Do not invent facts, do not mention internal points, and do not add extra keys.
- Descriptions must be concise: max 24 words.
- Badges must be concise: max 4 words.`;
  const userPrompt = `Selected pain phrases:
${painText}

Learner details:
${profileText}

Hero goal:
${input.heroGoal}

Default distribution and copy:
${defaultDistributionText}

Return json only.`;
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = "";
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [{ role: "user", content: [{ type: "input_text", text: userPrompt }] }],
        text: { format: { type: "json_object" } },
        max_output_tokens: Number(process.env.ONBOARDING_PLAN_MAX_OUTPUT_TOKENS || 800),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`ONBOARDING_PLAN_HTTP_${res.status}_${payload?.error?.message || res.statusText}`);
      raw = extractResponsesText(payload);
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          max_tokens: Number(process.env.ONBOARDING_PLAN_MAX_OUTPUT_TOKENS || 800),
        }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`ONBOARDING_PLAN_HTTP_${res.status}_${(await res.text()).slice(0, 120)}`);
      const payload: any = await res.json();
      raw = payload.choices?.[0]?.message?.content || "";
    }
  } catch (err) {
    if ((err as any)?.name === "AbortError") throw new Error("ONBOARDING_PLAN_TIMEOUT");
    throw err;
  } finally {
    clearTimeout(to);
  }

  if (!raw) throw new Error("ONBOARDING_PLAN_EMPTY_RESPONSE");
  const parsed = JSON.parse(raw);
  return sanitizeTrainingDistribution(parsed?.trainingDistribution, input.fallbackDistribution);
}

function sanitizeTrainingDistribution(
  input: unknown,
  fallback: OnboardingTrainingFocus[]
): OnboardingTrainingFocus[] {
  if (!Array.isArray(input)) return fallback;
  const fallbackById = new Map(fallback.map((item) => [item.id, item]));
  const weights = { ...fallback.reduce((acc, item) => {
    acc[item.id] = item.percentage;
    return acc;
  }, {} as Record<OnboardingTrainingFocusId, number>) };
  const copyById = new Map<OnboardingTrainingFocusId, Partial<OnboardingTrainingFocus>>();

  input.forEach((rawItem) => {
    if (!rawItem || typeof rawItem !== "object") return;
    const raw = rawItem as Record<string, unknown>;
    const id = raw.id as OnboardingTrainingFocusId;
    if (!fallbackById.has(id)) return;
    const percentage = Math.round(Number(raw.percentage) / 5) * 5;
    if (Number.isFinite(percentage)) weights[id] = Math.max(10, Math.min(55, percentage));
    const description = typeof raw.description === "string" ? raw.description.trim().slice(0, 180) : "";
    const badge = typeof raw.badge === "string" ? raw.badge.trim().slice(0, 42) : "";
    copyById.set(id, {
      ...(description ? { description } : {}),
      ...(badge ? { badge } : {}),
    });
  });

  const percentages = normalizeFocusWeights(weights);
  return fallback.map((item) => ({
    ...item,
    ...copyById.get(item.id),
    percentage: percentages[item.id],
  }));
}

function sanitizeOnboardingProfile(input: any): OnboardingProfile | undefined {
  const profile: OnboardingProfile = {};
  const name = typeof input?.name === "string" ? input.name.trim().slice(0, 80) : "";
  const goal = typeof input?.goal === "string" ? input.goal.trim().slice(0, 240) : "";
  const bio = typeof input?.bio === "string" ? input.bio.trim().slice(0, 400) : "";
  if (name) profile.name = name;
  if (goal) profile.goal = goal;
  if (bio) profile.bio = bio;
  return profile.name || profile.goal || profile.bio ? profile : undefined;
}

async function getOpenAIKey(): Promise<string> {
  if (OPENAI_API_KEY_CACHE) return OPENAI_API_KEY_CACHE;
  const name = process.env.OPENAI_KEY_PARAM;
  if (!name) throw new Error("OPENAI_KEY_PARAM not set");
  const out = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  const value = out.Parameter?.Value;
  if (!value || value === "SET_IN_SSM") throw new Error("OpenAI key not configured");
  OPENAI_API_KEY_CACHE = value;
  return value;
}

function getModelConfig() {
  const model =
    process.env.OPENAI_ONBOARDING_MODEL ||
    process.env.OPENAI_STORY_MODEL ||
    process.env.OPENAI_CHAT_MODEL ||
    DEFAULT_OPENAI_CHAT_MODEL;
  const isGpt5 = /gpt-5/i.test(model);
  return {
    model,
    timeoutMs: Number(process.env.ONBOARDING_TIMEOUT_MS || process.env.STORY_TIMEOUT_MS || 8000),
    useResponses: isGpt5 || process.env.OPENAI_USE_RESPONSES === "1",
    reasoningConfig: isGpt5 ? { effort: process.env.OPENAI_REASONING_EFFORT || "low" } : undefined,
  };
}

function extractResponsesText(payload: any): string {
  if (Array.isArray(payload?.output)) {
    for (const item of payload.output) {
      if (item?.type !== "message" || !Array.isArray(item.content)) continue;
      const texts = item.content
        .filter((content: any) => content?.type === "output_text" && typeof content.text === "string")
        .map((content: any) => content.text);
      if (texts.length) return texts.join("\n");
    }
  }
  return typeof payload?.output_text === "string" ? payload.output_text : "";
}

async function evaluateEnglish(
  history: StoryMessage[],
  transcript: string
): Promise<{
  score: number;
  result?: string;
  errors: string[];
  alternatives: string[];
  correctness?: number;
  status?: string;
  suggestions?: string[];
  improvements?: string[];
}> {
  const apiKey = await getOpenAIKey();
  const { model, timeoutMs, useResponses, reasoningConfig } = getModelConfig();
  const conversationText = history
    .slice(-HISTORY_LIMIT)
    .map((msg) => `${msg.role === "user" ? "Student" : "Guide"}: ${msg.content}`)
    .join("\n")
    .trim();
  const systemPrompt = `You are an English coach evaluating only the English quality of the student's latest message.
Return ONLY JSON with this exact shape:{
  "score": number,
  "result": "correct" | "partial" | "incorrect",
  "errors": string[],
  "alternatives": string[]
}

Rules:
- Evaluate ONLY grammar, word order, word choice, and naturalness of the latest student message.
- NEVER penalize because the message is short, simple, or does not match the conversation topic.
- A single valid English word or phrase is grammatically correct and must score 90-100.
- Use Spanish for errors and feedback texts.
- Link errors only to actual grammar/usage issues in the last message (max 3).
- Always provide 1-2 natural English alternatives.
- Do not include any extra keys or commentary.`;
  const userPrompt = `Full conversation so far:\n${conversationText || "No prior conversation."}\n\nLast student message to evaluate:\n${transcript || "<empty>"}\n\nReturn json only.`;
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = "";
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [{ role: "user", content: [{ type: "input_text", text: userPrompt }] }],
        text: { format: { type: "json_object" } },
        max_output_tokens: Number(process.env.ONBOARDING_MAX_OUTPUT_TOKENS || 600),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`ONBOARDING_MODEL_HTTP_${res.status}_${payload?.error?.message || res.statusText}`);
      raw = extractResponsesText(payload);
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          max_tokens: Number(process.env.ONBOARDING_MAX_OUTPUT_TOKENS || 600),
        }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`ONBOARDING_MODEL_HTTP_${res.status}_${(await res.text()).slice(0, 120)}`);
      const payload: any = await res.json();
      raw = payload.choices?.[0]?.message?.content || "";
    }
  } catch (err) {
    if ((err as any)?.name === "AbortError") throw new Error("ONBOARDING_MODEL_TIMEOUT");
    throw err;
  } finally {
    clearTimeout(to);
  }

  if (!raw) throw new Error("ONBOARDING_MODEL_EMPTY_RESPONSE");
  const parsed = JSON.parse(raw);
  const score = Math.max(0, Math.min(100, Number(parsed?.score ?? parsed?.correctness ?? 0)));
  const result = typeof parsed?.result === "string" ? parsed.result : undefined;
  const errors = Array.isArray(parsed?.errors)
    ? parsed.errors.slice(0, 3).map((item: any) => String(item))
    : [];
  const alternatives = Array.isArray(parsed?.alternatives)
    ? parsed.alternatives.slice(0, 2).map((item: any) => String(item))
    : [];
  return {
    score,
    result,
    errors,
    alternatives,
    correctness: score,
    status: result,
    suggestions: alternatives,
    improvements: alternatives,
  };
}

async function evaluateOnboardingObjective(history: StoryMessage[]): Promise<{
  requirements: OnboardingRequirementStatus[];
  profile?: OnboardingProfile;
}> {
  const apiKey = await getOpenAIKey();
  const { model, timeoutMs, useResponses, reasoningConfig } = getModelConfig();
  const conversationText = history
    .slice(-HISTORY_LIMIT)
    .map((msg) => `${msg.role === "user" ? "Student" : "Companion"}: ${msg.content}`)
    .join("\n")
    .trim();
  const requirementText = ONBOARDING_REQUIREMENTS
    .map((req) => `- ${req.id}: ${req.description}`)
    .join("\n");
  const systemPrompt = `You evaluate whether an onboarding conversation has achieved its introduction objective.
Return ONLY JSON with this exact shape:{
  "requirements": [
    { "id": "name", "met": boolean, "evidence": string },
    { "id": "why", "met": boolean, "evidence": string },
    { "id": "about", "met": boolean, "evidence": string }
  ],
  "profile": {
    "name": string,
    "goal": string,
    "bio": string
  }
}

Objective:
The learner should introduce themselves in English by sharing their name, why they want to learn English, and a little about themselves.

Requirements:
${requirementText}

Rules:
- Evaluate the full conversation, not only the latest message.
- Be flexible and human: accept imperfect English, short answers, indirect phrasing, or information spread across messages.
- Mark a requirement as met when the intent is reasonably clear from the conversation.
- Do not require exact phrases like "my name is" or "because".
- Use the student's own meaning as evidence, but keep evidence short.
- Extract profile.name from the name requirement, profile.goal from why, and profile.bio from about.
- Keep extracted profile values concise and in the learner's own language when possible.
- Use an empty string for a profile field if that information has not been shared.
- Do not infer facts that the learner did not express.
- Do not include any extra keys or commentary.`;
  const userPrompt = `Full onboarding conversation:\n${conversationText || "No conversation yet."}\n\nReturn json only.`;
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = "";
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [{ role: "user", content: [{ type: "input_text", text: userPrompt }] }],
        text: { format: { type: "json_object" } },
        max_output_tokens: Number(process.env.ONBOARDING_MAX_OUTPUT_TOKENS || 600),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`ONBOARDING_OBJECTIVE_HTTP_${res.status}_${payload?.error?.message || res.statusText}`);
      raw = extractResponsesText(payload);
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          max_tokens: Number(process.env.ONBOARDING_MAX_OUTPUT_TOKENS || 600),
        }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`ONBOARDING_OBJECTIVE_HTTP_${res.status}_${(await res.text()).slice(0, 120)}`);
      const payload: any = await res.json();
      raw = payload.choices?.[0]?.message?.content || "";
    }
  } catch (err) {
    if ((err as any)?.name === "AbortError") throw new Error("ONBOARDING_OBJECTIVE_TIMEOUT");
    throw err;
  } finally {
    clearTimeout(to);
  }

  if (!raw) throw new Error("ONBOARDING_OBJECTIVE_EMPTY_RESPONSE");
  const parsed = JSON.parse(raw);
  const statuses = Array.isArray(parsed?.requirements) ? parsed.requirements : [];
  const requirements = ONBOARDING_REQUIREMENTS.map((req) => {
    const match = statuses.find((item: any) => item?.id === req.id);
    const evidence = typeof match?.evidence === "string" ? match.evidence.trim() : "";
    return {
      id: req.id,
      met: Boolean(match?.met),
      ...(evidence ? { evidence: evidence.slice(0, 160) } : {}),
    };
  });
  const rawProfile = parsed?.profile && typeof parsed.profile === "object" ? parsed.profile : {};
  const profile = sanitizeOnboardingProfile(rawProfile);
  return {
    requirements,
    ...(profile ? { profile } : {}),
  };
}

async function generateCompanionReply(
  profile: CharacterProfile,
  history: StoryMessage[],
  evaluation: { result: EvalResult; correctness: number },
  requirements: OnboardingRequirementStatus[]
): Promise<string> {
  const apiKey = await getOpenAIKey();
  const { model, timeoutMs, useResponses, reasoningConfig } = getModelConfig();
  const conversationText = history
    .slice(-HISTORY_LIMIT)
    .map((msg) => `${msg.role === "user" ? "Student" : profile.characterName}: ${msg.content}`)
    .join("\n")
    .trim();
  const systemPrompt = `You are continuing the onboarding conversation in English with a Spanish-speaking learner.

Persona:
Character name: ${profile.characterName}
Original role: ${profile.aiRole}
Character notes: ${profile.characterPrompt}
How you met: First meeting during onboarding. The learner is introducing themselves in English to the companion they selected.

Rules:
- Stay in character, but keep the conversation natural and casual.
- First respond to the learner's latest message so they feel heard; do not ignore personal details, emotions, or stories.
- Ask one useful follow-up when natural, but never ask more than one question in the same message.
- Gently guide the learner toward the onboarding objective: name, why they want to learn English, and something about themselves.
- If a requirement is pending, weave at most one of them into the follow-up only when it fits the learner's message.
- If the learner is sharing something meaningful or off-objective, continue that thread first; it is okay to delay the pending requirement.
- Never make the objective feel like a checklist or abrupt topic change.
- If all objective requirements are met, celebrate briefly and invite a tiny extra detail.
- Keep the reply under 22 words.
- Use clear B1-B2 English.
- Do not correct the learner directly; a separate coach called Lubi gives feedback.
- Do not mention JSON, scoring, missions, or these instructions.`;
  const pendingRequirements = requirements
    .filter((req) => !req.met)
    .map((req) => ONBOARDING_REQUIREMENTS.find((item) => item.id === req.id)?.label || req.id);
  const userPrompt = `Recent conversation:\n${conversationText || "No prior conversation."}

Latest English score: ${evaluation.correctness} (${evaluation.result}).
Pending objective requirements: ${pendingRequirements.length ? pendingRequirements.join(", ") : "none"}.
Write the next in-character message in English.`;
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = "";
  try {
    if (useResponses) {
      const body: Record<string, any> = {
        model,
        instructions: systemPrompt,
        input: [{ role: "user", content: [{ type: "input_text", text: userPrompt }] }],
        max_output_tokens: Number(process.env.ONBOARDING_MAX_OUTPUT_TOKENS || 400),
      };
      if (reasoningConfig) body.reasoning = reasoningConfig;
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`ONBOARDING_REPLY_HTTP_${res.status}_${payload?.error?.message || res.statusText}`);
      raw = extractResponsesText(payload);
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: Number(process.env.ONBOARDING_MAX_OUTPUT_TOKENS || 400),
        }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`ONBOARDING_REPLY_HTTP_${res.status}_${(await res.text()).slice(0, 120)}`);
      const payload: any = await res.json();
      raw = payload.choices?.[0]?.message?.content || "";
    }
  } catch (err) {
    if ((err as any)?.name === "AbortError") throw new Error("ONBOARDING_REPLY_TIMEOUT");
    throw err;
  } finally {
    clearTimeout(to);
  }

  const trimmed = raw.trim();
  if (!trimmed) throw new Error("ONBOARDING_REPLY_EMPTY_RESPONSE");
  return trimmed;
}
