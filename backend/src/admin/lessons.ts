import { createHash, randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({});
const ssm = new SSMClient({});

const MIN_TIMESTAMP = '1970-01-01T00:00:00.000Z';

// ── SSM key caches ────────────────────────────────────────────────────────────
let openAiKeyCache: string | undefined;
let geminiTtsKeyCache: string | undefined;
let googleTranslateKeyCache: string | undefined;

async function getSsmParam(name: string): Promise<string> {
  const res = await ssm.send(
    new GetParameterCommand({ Name: name, WithDecryption: true }),
  );
  const value = res.Parameter?.Value?.trim();
  if (!value) throw new Error(`SSM param empty: ${name}`);
  return value;
}

async function getOpenAiKey(): Promise<string> {
  if (openAiKeyCache) return openAiKeyCache;
  const direct = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (direct) { openAiKeyCache = direct; return direct; }
  const param = process.env.OPENAI_KEY_PARAM;
  if (!param) throw new Error('OPENAI_KEY_PARAM not set');
  openAiKeyCache = await getSsmParam(param);
  return openAiKeyCache;
}

async function getGeminiTtsKey(): Promise<string> {
  if (geminiTtsKeyCache) return geminiTtsKeyCache;
  const direct =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_TTS_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (direct) { geminiTtsKeyCache = direct; return direct; }
  const param =
    process.env.GEMINI_API_KEY_PARAM ||
    process.env.GOOGLE_TTS_API_KEY_PARAM ||
    process.env.GOOGLE_TRANSLATE_API_KEY_PARAM;
  if (!param) throw new Error('GEMINI_API_KEY_PARAM not set');
  geminiTtsKeyCache = await getSsmParam(param);
  return geminiTtsKeyCache;
}

function describeSecretForLogs(value: string): Record<string, unknown> {
  const trimmed = value.trim();
  return {
    length: trimmed.length,
    prefix: trimmed.slice(0, 6),
    suffix: trimmed.slice(-4),
    sha256: createHash('sha256').update(trimmed).digest('hex').slice(0, 16),
    isPlaceholder: trimmed === 'SET_IN_SSM',
    hasWhitespace: trimmed !== value,
    key: trimmed
  };
}

async function getGoogleTranslateKey(): Promise<string> {
  if (googleTranslateKeyCache) return googleTranslateKeyCache;
  const direct = process.env.GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_API_KEY;
  if (direct) { googleTranslateKeyCache = direct; return direct; }
  const param = process.env.GOOGLE_TRANSLATE_API_KEY_PARAM;
  if (!param) throw new Error('GOOGLE_TRANSLATE_API_KEY_PARAM not set');
  googleTranslateKeyCache = await getSsmParam(param);
  return googleTranslateKeyCache;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type LessonAudioStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type Lesson = {
  lessonId: string;
  title: string;
  prompt: string;
  script?: string;
  quiz?: QuizQuestion[];
  voiceId?: string;
  audioKey?: string;
  audioUrl?: string;
  audioStatus?: LessonAudioStatus;
  audioError?: string;
  audioJobId?: string;
  audioRequestedAt?: string;
  audioStartedAt?: string;
  audioCompletedAt?: string;
  subtitlesKey?: string;
  subtitlesUrl?: string;
  translatedSubtitlesKey?: string;
  translatedSubtitlesUrl?: string;
  videoKey?: string;
  videoUrl?: string;
  status: 'draft' | 'ready';
  createdAt: string;
  updatedAt: string;
};

export type LessonsResponse = {
  lessons: Lesson[];
  generatedAt: string;
};

export type PublicLesson = {
  lessonId: string;
  title: string;
  prompt?: string;
  videoUrl: string;
  subtitlesUrl?: string;
  translatedSubtitlesUrl?: string;
  quiz?: QuizQuestion[];
  createdAt: string;
  updatedAt: string;
};

export type PublicLessonsResponse = {
  lessons: PublicLesson[];
  generatedAt: string;
};

export type LessonHelpCue = {
  startSeconds?: number;
  endSeconds?: number;
  english?: string;
  spanish?: string;
};

export type LessonHelpResponse = {
  answer: string;
};

export type LessonMutationResponse = {
  lesson: Lesson;
  updatedAt: string;
};

export type LessonAudioGenerationResponse = LessonMutationResponse & {
  audioJobId: string;
};

export type LessonDeleteResponse = {
  lessonId: string;
  deletedAt: string;
};

export type LessonVoice = {
  id: string;
  name: string;
  languageCode: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  type: 'Standard' | 'WaveNet' | 'Neural2' | 'Studio' | 'Gemini';
};

export type LessonVoicesResponse = {
  voices: LessonVoice[];
};

// ── DynamoDB helpers ──────────────────────────────────────────────────────────
function getLessonsTableName(): string {
  const name = process.env.LESSONS_TABLE_NAME?.trim();
  if (!name) throw new Error('LESSONS_TABLE_NAME not set');
  return name;
}

function getAssetsBucketName(): string {
  const name = process.env.ASSETS_BUCKET_NAME?.trim();
  if (!name) throw new Error('ASSETS_BUCKET_NAME not set');
  return name;
}

function getAssetsBaseUrl(): string {
  const url =
    process.env.ASSETS_CLOUDFRONT_URL?.trim() ||
    process.env.ASSETS_CLOUDFRONT_DOMAIN_NAME?.trim();
  if (!url) throw new Error('ASSETS_CLOUDFRONT_DOMAIN_NAME not set');
  return url.startsWith('http') ? url.replace(/\/$/, '') : `https://${url.replace(/\/$/, '')}`;
}

function buildAssetUrl(key: string): string {
  return `${getAssetsBaseUrl()}/${key}`;
}

async function getLessonRecord(lessonId: string): Promise<Lesson | undefined> {
  const res = await dynamo.send(
    new GetCommand({ TableName: getLessonsTableName(), Key: { lessonId } }),
  );
  return toLesson(res.Item);
}

function toLesson(item: unknown): Lesson | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const r = item as Record<string, unknown>;
  const lessonId = asString(r.lessonId)?.trim();
  const title = asString(r.title)?.trim();
  const prompt = asString(r.prompt)?.trim();
  if (!lessonId || !title || !prompt) return undefined;

  const status = r.status === 'ready' ? 'ready' : 'draft';
  const createdAt = asString(r.createdAt) || MIN_TIMESTAMP;
  const updatedAt = asString(r.updatedAt) || createdAt;

  const lesson: Lesson = {
    lessonId,
    title,
    prompt,
    status,
    createdAt,
    updatedAt,
  };

  const script = asString(r.script)?.trim();
  if (script) lesson.script = script;

  if (Array.isArray(r.quiz)) {
    const quiz = r.quiz
      .map((q: unknown) => toQuizQuestion(q))
      .filter((q): q is QuizQuestion => !!q);
    if (quiz.length) lesson.quiz = quiz;
  }

  const voiceId = asString(r.voiceId)?.trim();
  if (voiceId) lesson.voiceId = voiceId;

  const audioKey = asString(r.audioKey)?.trim();
  if (audioKey) { lesson.audioKey = audioKey; lesson.audioUrl = buildAssetUrl(audioKey); }

  const audioStatus = toLessonAudioStatus(r.audioStatus) || (audioKey ? 'ready' : undefined);
  if (audioStatus) lesson.audioStatus = audioStatus;

  const audioError = asString(r.audioError)?.trim();
  if (audioError) lesson.audioError = audioError;

  const audioJobId = asString(r.audioJobId)?.trim();
  if (audioJobId) lesson.audioJobId = audioJobId;

  const audioRequestedAt = asString(r.audioRequestedAt)?.trim();
  if (audioRequestedAt) lesson.audioRequestedAt = audioRequestedAt;

  const audioStartedAt = asString(r.audioStartedAt)?.trim();
  if (audioStartedAt) lesson.audioStartedAt = audioStartedAt;

  const audioCompletedAt = asString(r.audioCompletedAt)?.trim();
  if (audioCompletedAt) lesson.audioCompletedAt = audioCompletedAt;

  const subtitlesKey = asString(r.subtitlesKey)?.trim();
  if (subtitlesKey) { lesson.subtitlesKey = subtitlesKey; lesson.subtitlesUrl = buildAssetUrl(subtitlesKey); }

  const translatedSubtitlesKey = asString(r.translatedSubtitlesKey)?.trim();
  if (translatedSubtitlesKey) { lesson.translatedSubtitlesKey = translatedSubtitlesKey; lesson.translatedSubtitlesUrl = buildAssetUrl(translatedSubtitlesKey); }

  const videoKey = asString(r.videoKey)?.trim();
  if (videoKey) { lesson.videoKey = videoKey; lesson.videoUrl = buildAssetUrl(videoKey); }

  return lesson;
}

function toLessonAudioStatus(value: unknown): LessonAudioStatus | undefined {
  if (
    value === 'pending' ||
    value === 'processing' ||
    value === 'ready' ||
    value === 'failed'
  ) {
    return value;
  }

  return undefined;
}

function toQuizQuestion(item: unknown): QuizQuestion | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const r = item as Record<string, unknown>;
  const question = asString(r.question)?.trim();
  if (!question) return undefined;
  if (!Array.isArray(r.options) || r.options.length !== 4) return undefined;
  const options = r.options.map((o) => asString(o)?.trim()).filter(Boolean) as string[];
  if (options.length !== 4) return undefined;
  const correctIndex = typeof r.correctIndex === 'number' ? r.correctIndex : Number(r.correctIndex);
  if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) return undefined;
  return { question, options, correctIndex };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
export async function listAdminLessons(): Promise<LessonsResponse> {
  const items: unknown[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: getLessonsTableName(),
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  const lessons = items
    .map(toLesson)
    .filter((l): l is Lesson => !!l)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { lessons, generatedAt: new Date().toISOString() };
}

function toPublicLesson(lesson: Lesson): PublicLesson | undefined {
  if (lesson.status !== 'ready' || !lesson.videoUrl) return undefined;
  return {
    lessonId: lesson.lessonId,
    title: lesson.title,
    prompt: lesson.prompt,
    videoUrl: lesson.videoUrl,
    subtitlesUrl: lesson.subtitlesUrl,
    translatedSubtitlesUrl: lesson.translatedSubtitlesUrl,
    quiz: lesson.quiz,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

export async function listPublicLessons(): Promise<PublicLessonsResponse> {
  const all = await listAdminLessons();
  return {
    lessons: all.lessons
      .map(toPublicLesson)
      .filter((lesson): lesson is PublicLesson => !!lesson),
    generatedAt: all.generatedAt,
  };
}

export async function getPublicLesson(input: {
  lessonId?: unknown;
}): Promise<{ lesson: PublicLesson }> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');
  const lesson = await getLessonRecord(lessonId);
  const publicLesson = lesson ? toPublicLesson(lesson) : undefined;
  if (!publicLesson) throw new Error('LESSON_NOT_FOUND');
  return { lesson: publicLesson };
}

function normalizeNumber(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeLessonHelpCue(input: unknown): LessonHelpCue | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const raw = input as Record<string, unknown>;
  const startSeconds =
    normalizeNumber(raw.startSeconds) ??
    (normalizeNumber(raw.startMs) != null ? normalizeNumber(raw.startMs)! / 1000 : undefined);
  const endSeconds =
    normalizeNumber(raw.endSeconds) ??
    (normalizeNumber(raw.endMs) != null ? normalizeNumber(raw.endMs)! / 1000 : undefined);
  const english = asString(raw.english ?? raw.text)?.trim().slice(0, 600);
  const spanish = asString(raw.spanish ?? raw.translatedText)?.trim().slice(0, 600);
  if (!english && !spanish) return undefined;
  return {
    startSeconds,
    endSeconds,
    english: english || undefined,
    spanish: spanish || undefined,
  };
}

function normalizeLessonHelpCues(input: unknown): LessonHelpCue[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(normalizeLessonHelpCue)
    .filter((cue): cue is LessonHelpCue => !!cue)
    .slice(0, 12);
}

function formatCueTime(seconds?: number): string {
  if (!Number.isFinite(seconds)) return '--:--';
  const totalSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(totalSeconds / 60);
  const rest = totalSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function buildLessonHelpContext(cues: LessonHelpCue[]): string {
  return cues
    .map((cue) => {
      const range = `${formatCueTime(cue.startSeconds)}-${formatCueTime(cue.endSeconds)}`;
      const parts = [
        cue.english ? `EN: ${cue.english}` : '',
        cue.spanish ? `ES: ${cue.spanish}` : '',
      ].filter(Boolean);
      return `[${range}] ${parts.join(' | ')}`;
    })
    .join('\n');
}

export async function answerLessonHelp(input: {
  lessonId?: unknown;
  question?: unknown;
  currentTimeSeconds?: unknown;
  subtitleMode?: unknown;
  currentCaptionEnglish?: unknown;
  currentCaptionSpanish?: unknown;
  subtitles?: unknown;
}): Promise<LessonHelpResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const question = asString(input.question)?.trim().slice(0, 1200);
  if (!question) throw new Error('INVALID_LESSON_HELP_QUESTION');

  const lesson = await getLessonRecord(lessonId);
  const publicLesson = lesson ? toPublicLesson(lesson) : undefined;
  if (!lesson || !publicLesson) throw new Error('LESSON_NOT_FOUND');

  const currentTimeSeconds = normalizeNumber(input.currentTimeSeconds);
  const subtitleMode = asString(input.subtitleMode)?.trim() === 'en_es' ? 'en_es' : 'en';
  const currentCaptionEnglish = asString(input.currentCaptionEnglish)?.trim().slice(0, 600);
  const currentCaptionSpanish = asString(input.currentCaptionSpanish)?.trim().slice(0, 600);
  const cues = normalizeLessonHelpCues(input.subtitles);

  const apiKey = await getOpenAiKey();
  const model = process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;
  const currentSecondLabel =
    Number.isFinite(currentTimeSeconds) ? `${Math.max(0, Math.floor(currentTimeSeconds || 0))}s` : 'unknown';
  const cueContext = buildLessonHelpContext(cues);

  const systemPrompt = `Eres Luvi, una tutora de inglés para hispanohablantes. Responde en español, breve y accionable.
Usa el subtítulo actual, el segundo del video y el guion de la lección para explicar dudas de vocabulario, gramática, pronunciación o comprensión.
Si conviene, incluye un ejemplo corto en inglés. No inventes contenido fuera de la lección. No uses JSON ni emojis.`;

  const userPrompt = `Lección: ${lesson.title}
Tema de la lección: ${lesson.prompt}
Segundo actual del video: ${currentSecondLabel}
Modo de subtítulos seleccionado: ${subtitleMode === 'en_es' ? 'inglés y español' : 'solo inglés'}
Subtítulo actual en inglés: ${currentCaptionEnglish || 'N/D'}
Subtítulo actual en español: ${currentCaptionSpanish || 'N/D'}

Subtítulos cercanos:
${cueContext || 'N/D'}

Guion de referencia:
${(lesson.script || '').slice(0, 8000) || 'N/D'}

Pregunta del alumno:
${question}`;

  const answer = await callOpenAIChatCompletion(apiKey, model, systemPrompt, userPrompt, 500);
  return { answer };
}

export async function createAdminLesson(input: {
  title?: unknown;
  prompt?: unknown;
}): Promise<LessonMutationResponse> {
  const title = asString(input.title)?.trim().slice(0, 200);
  if (!title) throw new Error('INVALID_LESSON_TITLE');

  const prompt = asString(input.prompt)?.trim().slice(0, 4000);
  if (!prompt) throw new Error('INVALID_LESSON_PROMPT');

  const now = new Date().toISOString();
  const lessonId = randomUUID();

  const item: Lesson = {
    lessonId,
    title,
    prompt,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: getLessonsTableName(),
      Item: item,
      ConditionExpression: 'attribute_not_exists(lessonId)',
    }),
  );

  return { lesson: item, updatedAt: now };
}

export async function deleteAdminLesson(input: {
  lessonId?: unknown;
}): Promise<LessonDeleteResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');

  const bucket = getAssetsBucketName();
  const keysToDelete = [
    lesson.audioKey,
    lesson.subtitlesKey,
    lesson.translatedSubtitlesKey,
    lesson.videoKey,
  ].filter(Boolean) as string[];

  await Promise.all(
    keysToDelete.map((key) =>
      s3
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        .catch(() => undefined),
    ),
  );

  await dynamo.send(
    new DeleteCommand({
      TableName: getLessonsTableName(),
      Key: { lessonId },
    }),
  );

  return { lessonId, deletedAt: new Date().toISOString() };
}

// ── Script generation ─────────────────────────────────────────────────────────
const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-5.5';

export async function generateLessonScript(input: {
  lessonId?: unknown;
}): Promise<LessonMutationResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');

  const apiKey = await getOpenAiKey();
  const model = process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;

  const systemPrompt = `You are an expert English teacher creating engaging video lesson scripts for Spanish-speaking learners at B1-C1 level.

Create a clear, natural video script based on the given topic. The script must:
- Be in English (the language being learned)
- Have a warm introduction, clear main content with examples, and a brief conclusion
- Use natural spoken language suitable for Text-to-Speech
- Be approximately 600-1000 words
- NOT include stage directions, speaker names, or markdown formatting
- Be a single flowing narration ready to be read aloud
- Start with a hook in the first sentence to grab attention

Return ONLY the script text, nothing else.`;

  const script = await callOpenAIChatCompletion(apiKey, model, systemPrompt, lesson.prompt, 1024);

  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: getLessonsTableName(),
      Key: { lessonId },
      UpdateExpression: 'SET #script = :script, updatedAt = :now',
      ExpressionAttributeNames: { '#script': 'script' },
      ExpressionAttributeValues: { ':script': script, ':now': now },
    }),
  );

  const updated: Lesson = { ...lesson, script, updatedAt: now };
  return { lesson: updated, updatedAt: now };
}

export async function updateLessonScript(input: {
  lessonId?: unknown;
  script?: unknown;
}): Promise<LessonMutationResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const script = asString(input.script)?.trim();
  if (!script) throw new Error('INVALID_LESSON_SCRIPT');

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');

  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: getLessonsTableName(),
      Key: { lessonId },
      UpdateExpression: 'SET #script = :script, updatedAt = :now',
      ExpressionAttributeNames: { '#script': 'script' },
      ExpressionAttributeValues: { ':script': script.slice(0, 10000), ':now': now },
    }),
  );

  const updated: Lesson = { ...lesson, script, updatedAt: now };
  return { lesson: updated, updatedAt: now };
}

// ── Quiz generation ───────────────────────────────────────────────────────────
export async function generateLessonQuiz(input: {
  lessonId?: unknown;
}): Promise<LessonMutationResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');
  if (!lesson.script) throw new Error('LESSON_SCRIPT_REQUIRED');

  const apiKey = await getOpenAiKey();
  const model = process.env.OPENAI_CHAT_MODEL || DEFAULT_OPENAI_CHAT_MODEL;

  const systemPrompt = `You are an English teacher creating comprehension quizzes for Spanish-speaking learners.

Based on the provided lesson script, create exactly 5 multiple-choice questions that test understanding of the content.

Rules:
- Each question must have exactly 4 answer options (A, B, C, D)
- Only one option is correct
- Questions should test real comprehension, not trivial details
- Keep language at B1-C1 English level
- Questions and options must be in English

Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
- "question": string
- "options": array of exactly 4 strings
- "correctIndex": number 0-3 (index of the correct option)

Example format:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]`;

  const raw = await callOpenAIChatCompletion(apiKey, model, systemPrompt, lesson.script, 1200);

  let quiz: QuizQuestion[];
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch?.[0] || raw);
    quiz = parsed
      .map((q: unknown) => toQuizQuestion(q))
      .filter((q: QuizQuestion | undefined): q is QuizQuestion => !!q);
  } catch {
    throw new Error('QUIZ_PARSE_FAILED');
  }

  if (quiz.length < 3) throw new Error('QUIZ_TOO_SHORT');

  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: getLessonsTableName(),
      Key: { lessonId },
      UpdateExpression: 'SET quiz = :quiz, updatedAt = :now',
      ExpressionAttributeValues: { ':quiz': quiz, ':now': now },
    }),
  );

  const updated: Lesson = { ...lesson, quiz, updatedAt: now };
  return { lesson: updated, updatedAt: now };
}

// ── Gemini TTS ────────────────────────────────────────────────────────────────
const CURATED_VOICES: LessonVoice[] = [
  { id: 'Iapetus', name: 'Iapetus (Clear)', languageCode: 'en-US', gender: 'NEUTRAL', type: 'Gemini' },
  { id: 'Kore', name: 'Kore (Firm)', languageCode: 'en-US', gender: 'NEUTRAL', type: 'Gemini' },
  { id: 'Charon', name: 'Charon (Informative)', languageCode: 'en-US', gender: 'NEUTRAL', type: 'Gemini' },
  { id: 'Orus', name: 'Orus (Firm)', languageCode: 'en-US', gender: 'NEUTRAL', type: 'Gemini' },
  { id: 'Rasalgethi', name: 'Rasalgethi (Informative)', languageCode: 'en-US', gender: 'NEUTRAL', type: 'Gemini' },
  { id: 'Schedar', name: 'Schedar (Even)', languageCode: 'en-US', gender: 'NEUTRAL', type: 'Gemini' },
  { id: 'Alnilam', name: 'Alnilam (Firm)', languageCode: 'en-US', gender: 'NEUTRAL', type: 'Gemini' },
  { id: 'Pulcherrima', name: 'Pulcherrima (Forward)', languageCode: 'en-US', gender: 'NEUTRAL', type: 'Gemini' },
];

const DEFAULT_GEMINI_TTS_MODEL = 'gemini-3.1-flash-tts-preview';
const DEFAULT_GEMINI_TTS_VOICE = 'Iapetus';
const LEGACY_GOOGLE_TTS_VOICE_ALIASES: Record<string, string> = {
  'en-US-Neural2-F': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Neural2-A': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Neural2-C': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Neural2-D': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Neural2-E': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Neural2-H': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Neural2-I': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Neural2-J': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Wavenet-A': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Wavenet-C': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Wavenet-D': DEFAULT_GEMINI_TTS_VOICE,
  'en-US-Wavenet-F': DEFAULT_GEMINI_TTS_VOICE,
  'en-GB-Neural2-A': DEFAULT_GEMINI_TTS_VOICE,
  'en-GB-Neural2-B': DEFAULT_GEMINI_TTS_VOICE,
  'en-GB-Wavenet-A': DEFAULT_GEMINI_TTS_VOICE,
  'en-GB-Wavenet-B': DEFAULT_GEMINI_TTS_VOICE,
};

function resolveGeminiVoiceId(voiceId: string): string | undefined {
  if (CURATED_VOICES.some((v) => v.id === voiceId)) return voiceId;
  return LEGACY_GOOGLE_TTS_VOICE_ALIASES[voiceId];
}

function buildGeminiTtsPrompt(transcript: string): string {
  return `Read the following transcript based on the audio profile and director's note.

# Audio Profile
A clear and authoritative corporate trainer.

# Director's note
Style: Warm, understanding, soft tone with gentle inflections. Pace: Slow, liquid, zero urgency. Long pauses for breath. Accent: American (Gen).

## Scene:
Modern learning studio.

## Sample Context:
English learning guidance. Clear pronunciation, moderate speed, natural pauses after examples, encouraging tone, highly understandable for non-native learners.

## Transcript:
${transcript}`;
}

function extractGeminiAudio(response: any): { data: string; mimeType?: string } | undefined {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return undefined;

  for (const part of parts) {
    const inlineData = part?.inlineData || part?.inline_data;
    const data = inlineData?.data;
    if (typeof data === 'string' && data.length > 0) {
      return {
        data,
        mimeType: asString(inlineData?.mimeType || inlineData?.mime_type),
      };
    }
  }

  return undefined;
}

function summarizeGeminiTtsResponse(response: any): Record<string, unknown> {
  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
  return {
    candidateCount: candidates.length,
    finishReasons: candidates.map((candidate: any) => candidate?.finishReason).filter(Boolean),
    partTypes: candidates.flatMap((candidate: any) => {
      const parts = candidate?.content?.parts;
      if (!Array.isArray(parts)) return [];
      return parts.map((part: any) => {
        const inlineData = part?.inlineData || part?.inline_data;
        if (inlineData) {
          return {
            type: 'inlineData',
            mimeType: inlineData?.mimeType || inlineData?.mime_type,
            dataLength: typeof inlineData?.data === 'string' ? inlineData.data.length : 0,
          };
        }
        if (typeof part?.text === 'string') {
          return { type: 'text', length: part.text.length };
        }
        return { type: Object.keys(part || {}).join(',') || 'unknown' };
      });
    }),
    promptFeedback: response?.promptFeedback,
    usageMetadata: response?.usageMetadata,
  };
}

function isWavMimeType(mimeType?: string): boolean {
  return /^audio\/(wav|wave|x-wav)\b/i.test(mimeType || '');
}

function convertToWav(audioData: Buffer, mimeType?: string): Buffer {
  const { bitsPerSample, sampleRate } = parseAudioMimeType(mimeType);
  const numChannels = 1;
  const dataSize = audioData.length;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, audioData]);
}

function parseAudioMimeType(mimeType?: string): { bitsPerSample: number; sampleRate: number } {
  let bitsPerSample = 16;
  let sampleRate = 24000;

  for (const param of (mimeType || '').split(';')) {
    const trimmed = param.trim();
    const bits = trimmed.match(/^audio\/L(\d+)$/i);
    if (bits?.[1]) bitsPerSample = Number(bits[1]) || bitsPerSample;

    const rate = trimmed.match(/^rate=(\d+)$/i);
    if (rate?.[1]) sampleRate = Number(rate[1]) || sampleRate;
  }

  return { bitsPerSample, sampleRate };
}

export function listLessonVoices(): LessonVoicesResponse {
  return { voices: CURATED_VOICES };
}

export async function startLessonAudioGeneration(input: {
  lessonId?: unknown;
  voiceId?: unknown;
}): Promise<LessonAudioGenerationResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const requestedVoiceId = asString(input.voiceId)?.trim();
  if (!requestedVoiceId) throw new Error('INVALID_LESSON_VOICE');

  const voiceId = resolveGeminiVoiceId(requestedVoiceId);
  const validVoice = CURATED_VOICES.find((v) => v.id === voiceId);
  if (!voiceId || !validVoice) throw new Error('INVALID_LESSON_VOICE');

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');
  if (!lesson.script) throw new Error('LESSON_SCRIPT_REQUIRED');

  const now = new Date().toISOString();
  const audioJobId = randomUUID();

  await dynamo.send(
    new UpdateCommand({
      TableName: getLessonsTableName(),
      Key: { lessonId },
      UpdateExpression:
        'SET audioStatus = :status, audioJobId = :audioJobId, audioRequestedAt = :now, voiceId = :voiceId, updatedAt = :now REMOVE audioError, audioStartedAt, audioCompletedAt',
      ExpressionAttributeValues: {
        ':status': 'pending',
        ':audioJobId': audioJobId,
        ':now': now,
        ':voiceId': voiceId,
      },
    }),
  );

  const updated: Lesson = {
    ...lesson,
    voiceId,
    audioStatus: 'pending',
    audioJobId,
    audioRequestedAt: now,
    updatedAt: now,
  };
  delete updated.audioError;
  delete updated.audioStartedAt;
  delete updated.audioCompletedAt;

  return { lesson: updated, updatedAt: now, audioJobId };
}

export async function runLessonAudioGenerationJob(input: {
  lessonId?: unknown;
  voiceId?: unknown;
  audioJobId?: unknown;
}): Promise<void> {
  const lessonId = asString(input.lessonId)?.trim();
  const voiceId = asString(input.voiceId)?.trim();
  const audioJobId = asString(input.audioJobId)?.trim();
  if (!lessonId || !voiceId || !audioJobId) {
    console.error(JSON.stringify({
      scope: 'admin.lessons.audioJob.invalidPayload',
      lessonId,
      voiceId,
      audioJobId,
    }));
    return;
  }

  const startedAt = new Date().toISOString();
  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: getLessonsTableName(),
        Key: { lessonId },
        UpdateExpression: 'SET audioStatus = :status, audioStartedAt = :now, updatedAt = :now',
        ConditionExpression: 'audioJobId = :audioJobId',
        ExpressionAttributeValues: {
          ':status': 'processing',
          ':now': startedAt,
          ':audioJobId': audioJobId,
        },
      }),
    );
  } catch (error) {
    console.warn(JSON.stringify({
      scope: 'admin.lessons.audioJob.skipped',
      lessonId,
      audioJobId,
      message: error instanceof Error ? error.message : String(error),
    }));
    return;
  }

  try {
    await generateLessonAudio({ lessonId, voiceId, audioJobId });
  } catch (error) {
    if (error instanceof Error && error.message === 'LESSON_AUDIO_JOB_SUPERSEDED') {
      console.warn(JSON.stringify({
        scope: 'admin.lessons.audioJob.superseded',
        lessonId,
        audioJobId,
      }));
      return;
    }

    await markLessonAudioGenerationFailed(lessonId, audioJobId, error);
  }
}

export async function markLessonAudioGenerationFailed(
  lessonId: string,
  audioJobId: string,
  error: unknown,
): Promise<void> {
  const now = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);

  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: getLessonsTableName(),
        Key: { lessonId },
        UpdateExpression: 'SET audioStatus = :status, audioError = :error, audioCompletedAt = :now, updatedAt = :now',
        ConditionExpression: 'audioJobId = :audioJobId',
        ExpressionAttributeValues: {
          ':status': 'failed',
          ':error': message.slice(0, 500),
          ':now': now,
          ':audioJobId': audioJobId,
        },
      }),
    );
  } catch (updateError) {
    console.warn(JSON.stringify({
      scope: 'admin.lessons.audioJob.failMarkSkipped',
      lessonId,
      audioJobId,
      message: updateError instanceof Error ? updateError.message : String(updateError),
    }));
  }
}

async function isCurrentAudioJob(lessonId: string, audioJobId?: string): Promise<boolean> {
  if (!audioJobId) return true;
  const lesson = await getLessonRecord(lessonId);
  return lesson?.audioJobId === audioJobId;
}

export async function generateLessonAudio(input: {
  lessonId?: unknown;
  voiceId?: unknown;
  audioJobId?: unknown;
}): Promise<LessonMutationResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const requestedVoiceId = asString(input.voiceId)?.trim();
  if (!requestedVoiceId) throw new Error('INVALID_LESSON_VOICE');
  const audioJobId = asString(input.audioJobId)?.trim();

  const voiceId = resolveGeminiVoiceId(requestedVoiceId);
  const validVoice = CURATED_VOICES.find((v) => v.id === voiceId);
  if (!voiceId || !validVoice) throw new Error('INVALID_LESSON_VOICE');

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');
  if (!lesson.script) throw new Error('LESSON_SCRIPT_REQUIRED');

  const apiKey = await getGeminiTtsKey();
  const model = process.env.GEMINI_TTS_MODEL || DEFAULT_GEMINI_TTS_MODEL;
  const prompt = buildGeminiTtsPrompt(lesson.script);
  const keyDiagnostics = describeSecretForLogs(apiKey);

  console.log(JSON.stringify({
    scope: 'admin.lessons.geminiTts.begin',
    lessonId,
    requestedVoiceId,
    resolvedVoiceId: voiceId,
    model,
    transcriptLength: lesson.script.length,
    promptLength: prompt.length,
    keySource: process.env.GEMINI_API_KEY
      ? 'env:GEMINI_API_KEY'
      : process.env.GOOGLE_TTS_API_KEY
        ? 'env:GOOGLE_TTS_API_KEY'
        : process.env.GOOGLE_API_KEY
          ? 'env:GOOGLE_API_KEY'
          : process.env.GEMINI_API_KEY_PARAM
            ? 'ssm:GEMINI_API_KEY_PARAM'
            : process.env.GOOGLE_TTS_API_KEY_PARAM
              ? 'ssm:GOOGLE_TTS_API_KEY_PARAM'
              : 'ssm:GOOGLE_TRANSLATE_API_KEY_PARAM',
    keyDiagnostics,
  }));

  let ttsRes: Response;
  try {
    ttsRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 1,
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceId,
                },
              },
            },
          },
          model,
        }),
      },
    );
  } catch (error) {
    console.error(JSON.stringify({
      scope: 'admin.lessons.geminiTts.requestFailed',
      lessonId,
      requestedVoiceId,
      resolvedVoiceId: voiceId,
      model,
      message: error instanceof Error ? error.message : String(error),
    }));
    throw new Error('GEMINI_TTS_REQUEST_FAILED');
  }

  if (!ttsRes.ok) {
    const err: any = await ttsRes.json().catch(() => ({}));
    console.error(JSON.stringify({
      scope: 'admin.lessons.geminiTts.httpError',
      lessonId,
      requestedVoiceId,
      resolvedVoiceId: voiceId,
      model,
      status: ttsRes.status,
      statusText: ttsRes.statusText,
      errorCode: err?.error?.code,
      errorStatus: err?.error?.status,
      errorMessage: String(err?.error?.message || '').slice(0, 1000),
      keyDiagnostics,
    }));
    throw new Error(`GEMINI_TTS_HTTP_${ttsRes.status}: ${err?.error?.message || ''}`);
  }

  const ttsData: any = await ttsRes.json();
  const audio = extractGeminiAudio(ttsData);
  console.log(JSON.stringify({
    scope: 'admin.lessons.geminiTts.response',
    lessonId,
    requestedVoiceId,
    resolvedVoiceId: voiceId,
    model,
    status: ttsRes.status,
    summary: summarizeGeminiTtsResponse(ttsData),
  }));
  if (!audio) {
    console.error(JSON.stringify({
      scope: 'admin.lessons.geminiTts.emptyResponse',
      lessonId,
      requestedVoiceId,
      resolvedVoiceId: voiceId,
      model,
      summary: summarizeGeminiTtsResponse(ttsData),
    }));
    throw new Error('GEMINI_TTS_EMPTY_RESPONSE');
  }

  const rawAudioBuffer = Buffer.from(audio.data, 'base64');
  const audioBuffer = isWavMimeType(audio.mimeType)
    ? rawAudioBuffer
    : convertToWav(rawAudioBuffer, audio.mimeType);
  const audioKey = `lessons/${lessonId}/audio.wav`;
  const bucket = getAssetsBucketName();

  if (!(await isCurrentAudioJob(lessonId, audioJobId))) {
    throw new Error('LESSON_AUDIO_JOB_SUPERSEDED');
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: audioKey,
      Body: audioBuffer,
      ContentType: 'audio/wav',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  console.log(JSON.stringify({
    scope: 'admin.lessons.geminiTts.uploaded',
    lessonId,
    requestedVoiceId,
    resolvedVoiceId: voiceId,
    model,
    audioKey,
    sourceMimeType: audio.mimeType,
    rawAudioBytes: rawAudioBuffer.length,
    wavBytes: audioBuffer.length,
  }));

  const now = new Date().toISOString();
  const updateInput: any = {
    TableName: getLessonsTableName(),
    Key: { lessonId },
    UpdateExpression:
      'SET audioKey = :audioKey, voiceId = :voiceId, audioStatus = :status, audioCompletedAt = :now, updatedAt = :now REMOVE audioError',
    ExpressionAttributeValues: {
      ':audioKey': audioKey,
      ':voiceId': voiceId,
      ':status': 'ready',
      ':now': now,
    },
  };
  if (audioJobId) {
    updateInput.ConditionExpression = 'audioJobId = :audioJobId';
    updateInput.ExpressionAttributeValues[':audioJobId'] = audioJobId;
  }

  await dynamo.send(new UpdateCommand(updateInput));

  const updated: Lesson = {
    ...lesson,
    voiceId,
    audioKey,
    audioUrl: buildAssetUrl(audioKey),
    audioStatus: 'ready',
    ...(audioJobId ? { audioJobId } : {}),
    audioCompletedAt: now,
    updatedAt: now,
  };
  delete updated.audioError;
  return { lesson: updated, updatedAt: now };
}

// ── Subtitle (SRT) generation ─────────────────────────────────────────────────
async function getObjectBuffer(bucket: string, key: string): Promise<Buffer> {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const body = out.Body as any;
  if (!body) return Buffer.alloc(0);
  if (typeof body.transformToByteArray === 'function') {
    return Buffer.from(await body.transformToByteArray());
  }

  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function getObjectText(bucket: string, key: string): Promise<string> {
  return (await getObjectBuffer(bucket, key)).toString('utf-8');
}

async function transcribeLessonAudioToSrt(audio: Buffer, filename: string): Promise<string> {
  const apiKey = await getOpenAiKey();
  const form = new FormData();
  const file = new Blob([audio], { type: 'audio/wav' });
  form.append('file', file as any, filename);
  form.append('model', 'whisper-1');
  form.append('response_format', 'srt');

  const t0 = Date.now();
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form as any,
  } as any);

  const text = await res.text();
  if (!res.ok) {
    console.error(JSON.stringify({
      scope: 'admin.lessons.whisper.error',
      status: res.status,
      body: text.slice(0, 500),
    }));
    throw new Error(`OPENAI_TRANSCRIBE_HTTP_${res.status}`);
  }

  const srt = text.trim();
  if (!srt) throw new Error('OPENAI_TRANSCRIBE_EMPTY_RESPONSE');
  console.log(JSON.stringify({
    scope: 'admin.lessons.whisper.success',
    ms: Date.now() - t0,
    srtBytes: Buffer.byteLength(srt, 'utf-8'),
  }));
  return srt;
}

export async function generateLessonSubtitles(input: {
  lessonId?: unknown;
}): Promise<LessonMutationResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');
  if (!lesson.audioKey) throw new Error('LESSON_AUDIO_REQUIRED');

  const subtitlesKey = `lessons/${lessonId}/subtitles_en.srt`;
  const bucket = getAssetsBucketName();
  const audio = await getObjectBuffer(bucket, lesson.audioKey);
  const srtContent = await transcribeLessonAudioToSrt(audio, 'audio.wav');

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: subtitlesKey,
      Body: Buffer.from(srtContent, 'utf-8'),
      ContentType: 'text/plain; charset=utf-8',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: getLessonsTableName(),
      Key: { lessonId },
      UpdateExpression: 'SET subtitlesKey = :subtitlesKey, updatedAt = :now',
      ExpressionAttributeValues: { ':subtitlesKey': subtitlesKey, ':now': now },
    }),
  );

  const updated: Lesson = {
    ...lesson,
    subtitlesKey,
    subtitlesUrl: buildAssetUrl(subtitlesKey),
    updatedAt: now,
  };
  return { lesson: updated, updatedAt: now };
}

// ── Translate subtitles ───────────────────────────────────────────────────────
function extractSrtText(srt: string): string[] {
  return srt
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.trim().split('\n');
      return lines.slice(2).join(' ').trim();
    })
    .filter(Boolean);
}

function rebuildSrtWithTranslations(srt: string, translations: string[]): string {
  const blocks = srt.split(/\n\n+/).filter((b) => b.trim());
  return blocks
    .map((block, i) => {
      const lines = block.trim().split('\n');
      const header = lines.slice(0, 2).join('\n');
      const translatedText = translations[i] || lines.slice(2).join('\n');
      return `${header}\n${translatedText}`;
    })
    .join('\n\n');
}

export async function translateLessonSubtitles(input: {
  lessonId?: unknown;
  targetLanguage?: unknown;
}): Promise<LessonMutationResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const targetLang = asString(input.targetLanguage)?.trim() || 'es';

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');
  if (!lesson.subtitlesKey) throw new Error('LESSON_SUBTITLES_REQUIRED');

  const srtContent = await getObjectText(getAssetsBucketName(), lesson.subtitlesKey);
  const texts = extractSrtText(srtContent);

  const apiKey = await getGoogleTranslateKey();

  // Translate all sentences in one batch request
  const translateRes = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        source: 'en',
        target: targetLang,
        format: 'text',
      }),
    },
  );

  if (!translateRes.ok) {
    throw new Error(`GOOGLE_TRANSLATE_HTTP_${translateRes.status}`);
  }

  const translateData: any = await translateRes.json();
  const translations: string[] = (translateData?.data?.translations || []).map(
    (t: any) => decodeHtmlEntities(asString(t?.translatedText) || ''),
  );

  const translatedSrt = rebuildSrtWithTranslations(srtContent, translations);
  const langCode = targetLang.replace('-', '_');
  const translatedKey = `lessons/${lessonId}/subtitles_${langCode}.srt`;
  const bucket = getAssetsBucketName();

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: translatedKey,
      Body: Buffer.from(translatedSrt, 'utf-8'),
      ContentType: 'text/plain; charset=utf-8',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: getLessonsTableName(),
      Key: { lessonId },
      UpdateExpression:
        'SET translatedSubtitlesKey = :key, updatedAt = :now',
      ExpressionAttributeValues: { ':key': translatedKey, ':now': now },
    }),
  );

  const updated: Lesson = {
    ...lesson,
    translatedSubtitlesKey: translatedKey,
    translatedSubtitlesUrl: buildAssetUrl(translatedKey),
    updatedAt: now,
  };
  return { lesson: updated, updatedAt: now };
}

// ── Video upload ──────────────────────────────────────────────────────────────
export async function createLessonVideoUpload(input: {
  lessonId?: unknown;
  contentType?: unknown;
}): Promise<{ uploadUrl: string; key: string; expiresAt: string }> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const contentType = asString(input.contentType)?.trim() || 'video/mp4';
  const validVideoTypes: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/webm': 'webm',
    'video/x-m4v': 'm4v',
    'video/mpeg': 'mpeg',
  };
  const ext = validVideoTypes[contentType];
  if (!ext) throw new Error('INVALID_VIDEO_CONTENT_TYPE');

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');

  const videoKey = `lessons/${lessonId}/video.${ext}`;
  const bucket = getAssetsBucketName();
  const expiresInSeconds = 60 * 15;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: videoKey,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
    { expiresIn: expiresInSeconds },
  );

  return {
    uploadUrl,
    key: videoKey,
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
  };
}

export async function completeLessonVideoUpload(input: {
  lessonId?: unknown;
  videoKey?: unknown;
}): Promise<LessonMutationResponse> {
  const lessonId = asString(input.lessonId)?.trim();
  if (!lessonId) throw new Error('INVALID_LESSON_ID');

  const videoKey = asString(input.videoKey)?.trim();
  if (!videoKey || !videoKey.startsWith(`lessons/${lessonId}/`)) {
    throw new Error('INVALID_VIDEO_KEY');
  }

  const lesson = await getLessonRecord(lessonId);
  if (!lesson) throw new Error('LESSON_NOT_FOUND');

  const now = new Date().toISOString();
  await dynamo.send(
    new UpdateCommand({
      TableName: getLessonsTableName(),
      Key: { lessonId },
      UpdateExpression: 'SET videoKey = :videoKey, #status = :status, updatedAt = :now',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':videoKey': videoKey,
        ':status': 'ready',
        ':now': now,
      },
    }),
  );

  const updated: Lesson = {
    ...lesson,
    videoKey,
    videoUrl: buildAssetUrl(videoKey),
    status: 'ready',
    updatedAt: now,
  };
  return { lesson: updated, updatedAt: now };
}

// ── OpenAI helper ─────────────────────────────────────────────────────────────
async function callOpenAIChatCompletion(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string,
  maxTokens: number,
): Promise<string> {
  const isGpt5 = /gpt-5/i.test(model);
  const isGpt45 = /gpt-4\.5/i.test(model);
  const useResponses = isGpt5 || isGpt45 || process.env.OPENAI_USE_RESPONSES === '1';
  const timeoutMs = Number(process.env.LESSON_GEN_TIMEOUT_MS || 30000);
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  try {
    if (useResponses) {
      const body: Record<string, unknown> = {
        model,
        instructions: systemPrompt,
        input: [{ role: 'user', content: [{ type: 'input_text', text: userContent }] }],
        max_output_tokens: maxTokens,
      };
      if (isGpt5) body.reasoning = { effort: process.env.OPENAI_REASONING_EFFORT || 'low' };

      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      const full: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`OPENAI_HTTP_${res.status}: ${full?.error?.message || ''}`);

      if (Array.isArray(full?.output)) {
        for (const item of full.output) {
          if (item?.type === 'message' && Array.isArray(item?.content)) {
            for (const part of item.content) {
              if (part?.type === 'output_text' && typeof part.text === 'string') {
                return part.text.trim();
              }
            }
          }
        }
      }
      throw new Error('OPENAI_EMPTY_RESPONSE');
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
      signal: ac.signal,
    });
    const full: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`OPENAI_HTTP_${res.status}: ${full?.error?.message || ''}`);

    const text = full?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) throw new Error('OPENAI_EMPTY_RESPONSE');
    return text.trim();
  } finally {
    clearTimeout(timer);
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────
function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
