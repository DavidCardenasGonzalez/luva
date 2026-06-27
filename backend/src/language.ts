export type AppLanguage = "en" | "es";
export type SupportLanguageCode = string;

export const DEFAULT_APP_LANGUAGE: AppLanguage = "en";
export const DEFAULT_SUPPORT_LANGUAGE: SupportLanguageCode = "en";

export type PromptLanguageContext = {
  supportLanguage: SupportLanguageCode;
  feedbackLanguageName: string;
  feedbackLanguageLower: string;
  appLanguageDescription: string;
  supportLanguageInstruction: string;
  nonEnglishMessageInstruction: string;
  translationHelpInstruction: string;
  reusablePhraseInstruction: string;
};

const SUPPORT_LANGUAGE_ALIASES: Record<string, string> = {
  iw: "he",
  tl: "fil",
  nb: "no",
  zh: "zh-CN",
  "zh-hans": "zh-CN",
  "zh-cn": "zh-CN",
  "zh-sg": "zh-CN",
  "zh-hant": "zh-TW",
  "zh-tw": "zh-TW",
  "zh-hk": "zh-TW",
  "pt-br": "pt",
  "pt-pt": "pt",
};

const SUPPORT_LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ja: "Japanese",
  ko: "Korean",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
};

export function normalizeAppLanguage(value: unknown): AppLanguage | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === "es" || normalized.startsWith("es-") || normalized.startsWith("es_")) {
    return "es";
  }
  if (normalized === "en" || normalized.startsWith("en-") || normalized.startsWith("en_")) {
    return "en";
  }
  return undefined;
}

function readHeader(headers: unknown, name: string): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() === target && typeof value === "string") {
      return value;
    }
  }
  return undefined;
}

function normalizeAcceptLanguage(value: unknown): AppLanguage | undefined {
  if (typeof value !== "string") return undefined;
  const parts = value.split(",");
  for (const part of parts) {
    const language = normalizeAppLanguage(part.split(";")[0]);
    if (language) return language;
  }
  return undefined;
}

function normalizeAcceptSupportLanguage(value: unknown): SupportLanguageCode | undefined {
  if (typeof value !== "string") return undefined;
  const parts = value.split(",");
  for (const part of parts) {
    const language = normalizeSupportLanguageCode(part.split(";")[0]);
    if (language) return language;
  }
  return undefined;
}

export function normalizeSupportLanguageCode(value: unknown): SupportLanguageCode | undefined {
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().replace(/_/g, "-");
  if (!cleaned) return undefined;

  const lower = cleaned.toLowerCase();
  const alias = SUPPORT_LANGUAGE_ALIASES[lower];
  if (alias) return alias;

  if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i.test(cleaned)) return undefined;

  const [base] = lower.split("-");
  const baseAlias = SUPPORT_LANGUAGE_ALIASES[base];
  if (baseAlias) return baseAlias;

  if (cleaned.includes("-")) {
    const [, ...subtags] = cleaned.split("-");
    return [base, ...subtags].join("-");
  }
  return base;
}

export function getRequestUiLanguage(event: any, body?: unknown): AppLanguage {
  const rawBody = body && typeof body === "object" ? body as Record<string, unknown> : {};
  return (
    normalizeAppLanguage(rawBody.uiLanguage) ||
    normalizeAppLanguage(rawBody.appLanguage) ||
    normalizeAppLanguage(readHeader(event?.headers, "x-luva-ui-language")) ||
    normalizeAppLanguage(readHeader(event?.headers, "x-luva-app-language")) ||
    normalizeAcceptLanguage(readHeader(event?.headers, "accept-language")) ||
    DEFAULT_APP_LANGUAGE
  );
}

export function getRequestAppLanguage(event: any, body?: unknown): AppLanguage {
  return getRequestUiLanguage(event, body);
}

export function getRequestSupportLanguage(event: any, body?: unknown): SupportLanguageCode {
  const rawBody = body && typeof body === "object" ? body as Record<string, unknown> : {};
  return (
    normalizeSupportLanguageCode(rawBody.supportLanguage) ||
    normalizeSupportLanguageCode(readHeader(event?.headers, "x-luva-support-language")) ||
    normalizeSupportLanguageCode(rawBody.appLanguage) ||
    normalizeSupportLanguageCode(readHeader(event?.headers, "x-luva-app-language")) ||
    normalizeAcceptSupportLanguage(readHeader(event?.headers, "accept-language")) ||
    DEFAULT_SUPPORT_LANGUAGE
  );
}

function getSupportLanguageName(language: SupportLanguageCode): string {
  const named = SUPPORT_LANGUAGE_NAMES[language];
  if (named) return named;
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(language) || language;
  } catch {
    return language;
  }
}

export function getPromptLanguageContext(supportLanguage: SupportLanguageCode): PromptLanguageContext {
  const normalizedSupportLanguage = normalizeSupportLanguageCode(supportLanguage) || DEFAULT_SUPPORT_LANGUAGE;
  const feedbackLanguageName = getSupportLanguageName(normalizedSupportLanguage);

  if (normalizedSupportLanguage === "es") {
    return {
      supportLanguage: normalizedSupportLanguage,
      feedbackLanguageName: "Spanish",
      feedbackLanguageLower: "Spanish",
      appLanguageDescription:
        "The learner's support language for feedback and translations is Spanish. They may use Spanish, their native language, or mixed language when they do not know how to express an idea in English.",
      supportLanguageInstruction: "Use Spanish for errors, coaching notes, summaries, badges, and feedback texts.",
      nonEnglishMessageInstruction:
        "If the latest message is not English, mostly their native language, or mixed with a clear non-English base, assume the learner did not know how to express that idea in English.",
      translationHelpInstruction:
        'For non-English messages, write notes like: "Para decir esa idea en inglés, puedes usar..." or "Una forma natural de decirlo sería..."; avoid scolding or saying they wrote in the wrong language.',
      reusablePhraseInstruction:
        `Each item must include the English chunk and its Spanish meaning, for example: "\"That sounds fun\" = \"Eso suena divertido\" — para reaccionar de forma natural."`,
    };
  }

  if (normalizedSupportLanguage !== "en") {
    return {
      supportLanguage: normalizedSupportLanguage,
      feedbackLanguageName,
      feedbackLanguageLower: feedbackLanguageName,
      appLanguageDescription:
        `The learner's support language for feedback and translations is ${feedbackLanguageName}. They may use ${feedbackLanguageName}, their native language, or mixed language when they do not know how to express an idea in English.`,
      supportLanguageInstruction: `Use ${feedbackLanguageName} for errors, coaching notes, summaries, badges, and feedback texts.`,
      nonEnglishMessageInstruction:
        "If the latest message is not English, mostly their native language, or mixed with a clear non-English base, assume the learner did not know how to express that idea in English.",
      translationHelpInstruction:
        `For non-English messages, write notes in ${feedbackLanguageName} that teach how to say the same idea in English; avoid scolding or saying they wrote in the wrong language.`,
      reusablePhraseInstruction:
        `Each item must include the English chunk and a short meaning in ${feedbackLanguageName}, for example: "\"That sounds fun\" — explain how to react naturally.`,
    };
  }

  return {
    supportLanguage: normalizedSupportLanguage,
    feedbackLanguageName: "English",
    feedbackLanguageLower: "English",
    appLanguageDescription:
      "The learner's support language for feedback and translations is English. If they use another native language or mixed language, treat that as normal translation help.",
    supportLanguageInstruction: "Use English for errors, coaching notes, summaries, badges, and feedback texts.",
    nonEnglishMessageInstruction:
      "If the latest message is not English, mostly their native language, or mixed with a clear non-English base, assume the learner did not know how to express that idea in English.",
    translationHelpInstruction:
      'For non-English messages, write notes like: "To say that idea in English, you can use..." or "A natural way to say it would be..."; avoid scolding or saying they wrote in the wrong language.',
    reusablePhraseInstruction:
      `Each item must include the English chunk and a short English meaning, for example: "\"That sounds fun\" — use it to react naturally."`,
  };
}
