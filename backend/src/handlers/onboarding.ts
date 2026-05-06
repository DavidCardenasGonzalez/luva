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
- React to the learner's latest message and ask one useful follow-up when natural.
- Gently guide the learner toward the onboarding objective: name, why they want to learn English, and something about themselves.
- If any objective requirement is still pending, ask about exactly one pending item in a friendly, conversational way.
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
