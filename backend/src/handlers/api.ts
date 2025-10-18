import type {
  APIGatewayProxyEventV2 as Event,
  APIGatewayProxyResultV2 as Result,
} from "aws-lambda";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  EvaluationResponse,
  ApiResponse,
  SessionStartResponse,
  CardItem,
  StoryDefinition,
  StorySummaryItem,
  StoryAdvanceRequest,
  StoryAdvancePayload,
  StoryMission,
  StoryRequirement,
  StoryAdvanceRequirementState,
  EvalResult
} from "../types";
import { STORIES_SEED } from "../data/stories-seed";

const s3 = new S3Client({});
const ssm = new SSMClient({});
let OPENAI_API_KEY_CACHE: string | undefined;
const STORIES_PATH_CANDIDATES: (string | undefined)[] = [
  process.env.STORIES_PATH,
  path.resolve(__dirname, '../../data/stories.json'),
  path.resolve(__dirname, '../data/stories.json'),
  path.resolve(process.cwd(), 'data/stories.json'),
];
let STORIES_CACHE: StoryDefinition[] | null = null;

function sanitizeStoriesList(input: any[], fallbackPrefix: string): StoryDefinition[] {
  const sanitized: StoryDefinition[] = [];
  input.forEach((story, index) => {
    const fallbackId = `${fallbackPrefix}_${index}`;
    const normalized = sanitizeStoryDefinition(story, fallbackId);
    if (normalized) sanitized.push(normalized);
  });
  return sanitized;
}

function readStoriesFromDisk(): StoryDefinition[] | undefined {
  for (const candidate of STORIES_PATH_CANDIDATES) {
    if (!candidate) continue;
    try {
      if (!fs.existsSync(candidate)) continue;
      const raw = fs.readFileSync(candidate, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn(
          JSON.stringify({ scope: 'stories.load.invalidFormat', path: candidate })
        );
        continue;
      }
      const sanitized = sanitizeStoriesList(parsed, 'file');
      if (sanitized.length) {
        console.log(
          JSON.stringify({ scope: 'stories.load.success', path: candidate, items: sanitized.length })
        );
        return sanitized;
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          scope: 'stories.load.error',
          message: (err as Error)?.message || 'unknown',
          path: candidate,
        })
      );
    }
  }
  return undefined;
}

function loadStories(): StoryDefinition[] {
  if (STORIES_CACHE) return STORIES_CACHE;
  const fromDisk = readStoriesFromDisk();
  if (fromDisk && fromDisk.length) {
    STORIES_CACHE = fromDisk;
    return STORIES_CACHE;
  }
  const fallbackStories = sanitizeStoriesList(STORIES_SEED, 'seed');
  STORIES_CACHE = fallbackStories;
  return STORIES_CACHE;
}

function listStorySummaries(): StorySummaryItem[] {
  return loadStories().map((story) => ({
    storyId: story.storyId,
    title: story.title,
    summary: story.summary,
    level: story.level,
    tags: story.tags || [],
    unlockCost: story.unlockCost ?? 0,
    locked: false,
    missionsCount: story.missions?.length || 0,
  }));
}

function getStory(storyId: string): StoryDefinition | undefined {
  return loadStories().find((s) => s.storyId === storyId);
}

function initialRequirementStates(mission: StoryMission): StoryAdvanceRequirementState[] {
  return (mission.requirements || []).map((req) => ({
    requirementId: req.requirementId,
    text: req.text,
    met: false,
  }));
}

type StoryMessage = { role: 'user' | 'assistant'; content: string };
const STORY_HISTORY_LIMIT = 20;

type StorySessionState = {
  storyId?: string;
  missionIndex: number;
  history: StoryMessage[];
  requirements: StoryAdvanceRequirementState[];
  story?: StoryDefinition;
  lastUpdated: number;
};

const STORY_SESSIONS = new Map<string, StorySessionState>();
function pruneStorySessions(maxEntries: number = 200, ttlMs: number = 1000 * 60 * 30) {
  const now = Date.now();
  for (const [id, session] of STORY_SESSIONS) {
    if (session.lastUpdated + ttlMs < now) {
      STORY_SESSIONS.delete(id);
    }
  }
  if (STORY_SESSIONS.size > maxEntries) {
    const entries = Array.from(STORY_SESSIONS.entries()).sort((a, b) => a[1].lastUpdated - b[1].lastUpdated);
    for (let i = 0; i < entries.length && STORY_SESSIONS.size > maxEntries; i++) {
      STORY_SESSIONS.delete(entries[i][0]);
    }
  }
}

function mergeHistory(base: StoryMessage[] = [], additions: StoryMessage[] = []): StoryMessage[] {
  const merged: StoryMessage[] = [...base];
  for (const message of additions) {
    if (!message) continue;
    const trimmed = (message.content || '').trim();
    if (!trimmed) continue;
    const normalized: StoryMessage = { role: message.role, content: trimmed };
    if (normalized.role !== 'user' && normalized.role !== 'assistant') {
      continue;
    }
    const last = merged[merged.length - 1];
    if (!last || last.role !== normalized.role || last.content !== normalized.content) {
      merged.push(normalized);
      if (merged.length > STORY_HISTORY_LIMIT) {
        merged.splice(0, merged.length - STORY_HISTORY_LIMIT);
      }
    }
  }
  return merged;
}

function appendHistoryEntry(history: StoryMessage[] = [], message: StoryMessage): StoryMessage[] {
  return mergeHistory(history, [message]);
}

function sanitizeSessionContext(input: any): { storyId?: string; sceneIndex?: number; story?: StoryDefinition } {
  if (!input || typeof input !== 'object') return {};
  const rawStoryId = typeof input.storyId === 'string' ? input.storyId : undefined;
  const rawSceneIndex =
    input.sceneIndex ?? input.missionIndex ?? input.scene_index ?? input.scene ?? input.stepIndex;
  const sceneIndex = Number.isFinite(Number(rawSceneIndex))
    ? Math.max(0, Math.floor(Number(rawSceneIndex)))
    : undefined;
  const storyFromBody = input.storyDefinition
    ? sanitizeStoryDefinition(input.storyDefinition, rawStoryId)
    : undefined;
  return {
    storyId: storyFromBody?.storyId ?? rawStoryId,
    sceneIndex,
    story: storyFromBody,
  };
}
function sanitizeHistory(history?: StoryAdvanceRequest['history']): StoryMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter((msg): msg is StoryMessage => !!msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string')
    .map((msg) => ({ role: msg.role, content: msg.content.trim() }));
}

function sanitizeStoryRequirement(input: any): StoryRequirement | undefined {
  if (!input) return undefined;
  const requirementId =
    typeof input.requirementId === 'string'
      ? input.requirementId
      : typeof input.requirement_id === 'string'
      ? input.requirement_id
      : undefined;
  const text =
    typeof input.text === 'string'
      ? input.text
      : typeof input.description === 'string'
      ? input.description
      : undefined;
  if (!requirementId || !text) return undefined;
  return { requirementId, text };
}

function sanitizeStoryMission(input: any): StoryMission | undefined {
  if (!input) return undefined;
  const missionIdRaw = input.missionId ?? input.id;
  const missionId =
    typeof missionIdRaw === 'string'
      ? missionIdRaw
      : typeof missionIdRaw === 'number'
      ? String(missionIdRaw)
      : undefined;
  const title = typeof input.title === 'string' ? input.title : undefined;
  const aiRole =
    typeof input.aiRole === 'string'
      ? input.aiRole
      : typeof input.ai_role === 'string'
      ? input.ai_role
      : undefined;
  if (!missionId || !title || !aiRole) return undefined;
  const sceneSummary =
    typeof input.sceneSummary === 'string'
      ? input.sceneSummary
      : typeof input.scene_summary === 'string'
      ? input.scene_summary
      : undefined;
  const requirementsRaw = Array.isArray(input.requirements) ? input.requirements : [];
  const requirements = requirementsRaw
    .map((req: any) => sanitizeStoryRequirement(req))
    .filter((req: StoryRequirement | undefined): req is StoryRequirement => !!req);
  return {
    missionId,
    title,
    sceneSummary,
    aiRole,
    requirements,
  };
}

function sanitizeStoryDefinition(input: any, fallbackId?: string): StoryDefinition | undefined {
  if (!input) return undefined;
  const storyId = typeof input.storyId === 'string' ? input.storyId : fallbackId;
  const title = typeof input.title === 'string' ? input.title : undefined;
  const summary = typeof input.summary === 'string' ? input.summary : undefined;
  if (!storyId || !title || !summary) return undefined;
  const missionsRaw = Array.isArray(input.missions) ? input.missions : [];
  const missions = missionsRaw
    .map((mission: any) => sanitizeStoryMission(mission))
    .filter((mission: StoryMission | undefined): mission is StoryMission => !!mission);
  if (!missions.length) return undefined;
  return {
    storyId,
    title,
    summary,
    level: typeof input.level === 'string' ? input.level : undefined,
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
    unlockCost: typeof input.unlockCost === 'number' ? input.unlockCost : 0,
    missions,
  };
}
function json(statusCode: number, data: unknown): ApiResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(data),
  };
}

function notFound(): ApiResponse {
  return json(404, { message: "Not Found" });
}
function badRequest(message: string): ApiResponse {
  return json(400, { message });
}

const ROUTE_PREFIX = "/v1";

export const handler = async (event: any, context?: any): Promise<Result> => {
  const method: string =
    event.httpMethod || event.requestContext?.http?.method || "GET";
  const rawPath: string =
    event.resource && event.path
      ? event.path
      : event.requestContext?.http?.path || "/";
  const path = rawPath.startsWith(ROUTE_PREFIX)
    ? rawPath
    : `${ROUTE_PREFIX}${rawPath}`;
  const reqId: string | undefined =
    event.requestContext?.requestId ||
    event.requestContext?.http?.requestId ||
    context?.awsRequestId;
  const stage = process.env.STAGE || "dev";

  const log = (scope: string, extra?: Record<string, unknown>) => {
    try {
      console.log(
        JSON.stringify({ scope, method, path, reqId, stage, ...extra })
      );
    } catch {
      // fallback minimal log
      console.log(`[${scope}] ${method} ${path} ${reqId || ""}`);
    }
  };

  log("request.received");

  try {
    if (method === "GET" && path === `${ROUTE_PREFIX}/cards`) {
      log("cards.list");
      return json(200, { items: mockCards(), nextCursor: null });
    }

    if (method === "POST" && path === `${ROUTE_PREFIX}/sessions/start`) {
      log("sessions.start.begin");
      const startBody = parseBody(event.body);
      const { uploadUrl, sessionId } = await startSession(startBody);
      log("sessions.start.success", { sessionId });
      return json(200, { sessionId, uploadUrl } satisfies SessionStartResponse);
    }

    const sessionTranscribe = path.match(
      /^\/v1\/sessions\/([^/]+)\/transcribe$/
    );
    if (method === "POST" && sessionTranscribe) {
      const sessionId = sessionTranscribe[1];
      log("sessions.transcribe.begin", { sessionId });
      const t0 = Date.now();
      const transcript = await transcribeWhisper(sessionId);
      log("sessions.transcribe.success", {
        sessionId,
        ms: Date.now() - t0,
        length: transcript?.length || 0,
      });
      return json(200, { transcript });
    }

    const sessionEvaluate = path.match(/^\/v1\/sessions\/([^/]+)\/evaluate$/);
    if (method === "POST" && sessionEvaluate) {
      const sessionId = sessionEvaluate[1];
      const body = parseBody(event.body);
      const transcript = body?.transcript ?? "";
      const label = body?.label as string | undefined;
      const example = body?.example as string | undefined;
      log("sessions.evaluate.begin", {
        sessionId,
        hasLabel: !!label,
        exampleProvided: !!example,
        tLen: transcript?.length || 0,
      });
      const t0 = Date.now();
      const evalResponse = await evaluateAI(transcript, { label, example });
      log("sessions.evaluate.success", {
        sessionId,
        ms: Date.now() - t0,
        score: (evalResponse as any)?.score,
      });
      return json(200, evalResponse as any);
    }

    const cardComplete = path.match(/^\/v1\/cards\/([^/]+)\/complete$/);
    if (method === "POST" && cardComplete) {
      // Normally update streak/points in DynamoDB
      return json(200, {
        newPoints: 5,
        unlocked: { stories: ["london_trip"] },
      });
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/stories`) {
      return json(200, { items: listStorySummaries() });
    }

    const storyDetail = path.match(/^\/v1\/stories\/([^/]+)$/);
    if (method === "GET" && storyDetail) {
      const storyId = storyDetail[1];
      const story = getStory(storyId);
      if (!story) {
        return notFound();
      }
      return json(200, {
        storyId: story.storyId,
        title: story.title,
        summary: story.summary,
        level: story.level,
        missions: story.missions?.map((mission) => ({
          missionId: mission.missionId,
          title: mission.title,
          sceneSummary: mission.sceneSummary,
          aiRole: mission.aiRole,
          requirements: initialRequirementStates(mission),
        })) || [],
      });
    }

    const storyAdvance = path.match(/^\/v1\/stories\/([^/]+)\/advance$/);
    if (method === "POST" && storyAdvance) {
      let storyId = storyAdvance[1];
      const body = parseBody(event.body) as StoryAdvanceRequest;
      if (!body || typeof body.transcript !== 'string' || !body.transcript.trim()) {
        return badRequest('Missing transcript');
      }
      if (!body.sessionId || typeof body.sessionId !== 'string') {
        return badRequest('Missing sessionId');
      }
      const sessionState = STORY_SESSIONS.get(body.sessionId);
      if (!storyId && sessionState?.storyId) {
        storyId = sessionState.storyId;
      }
      const fallbackStory = sanitizeStoryDefinition(body.storyDefinition, storyId);
      let story = storyId ? getStory(storyId) : undefined;
      if (!story && sessionState?.story) {
        story = sessionState.story;
      }
      if (!story && fallbackStory) {
        story = fallbackStory;
      }
      if (!story) {
        return notFound();
      }
      const payload = await advanceStoryMission(story, body);
      if (sessionState) {
        sessionState.story = story;
        sessionState.storyId = story.storyId;
      }
      return json(200, payload);
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/me/progress`) {
      return json(200, {
        points: 120,
        streaks: { max: 7, current: 2 },
        recent: [],
      });
    }

    return notFound();
  } catch (err: any) {
    log("request.unhandledError", { error: err?.message || "unknown" });
    return json(500, { message: "Internal error", code: "INTERNAL_ERROR" });
  }
};

function parseBody(body: any): any {
  if (!body) return undefined;
  try {
    return typeof body === "string" ? JSON.parse(body) : body;
  } catch {
    return undefined;
  }
}

async function startSession(body?: any): Promise<{
  sessionId: string;
  uploadUrl: string;
}> {
  const sessionId = randomUUID();
  const audioBucket = process.env.AUDIO_BUCKET;
  if (!audioBucket) throw new Error("AUDIO_BUCKET not set");
  const key = `sessions/${sessionId}/audio.m4a`;
  const cmd = new PutObjectCommand({
    Bucket: audioBucket,
    Key: key,
    ContentType: "audio/mp4",
  });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 });
  try {
    const context = sanitizeSessionContext(body);
    if (context.storyId || context.story) {
      const storedStory =
        context.story ||
        (context.storyId ? getStory(context.storyId) : undefined) ||
        (body?.storyDefinition ? sanitizeStoryDefinition(body.storyDefinition, context.storyId) : undefined) ||
        undefined;
      STORY_SESSIONS.set(sessionId, {
        storyId: storedStory?.storyId || context.storyId,
        missionIndex: context.sceneIndex ?? 0,
        history: [],
        requirements: [],
        story: storedStory,
        lastUpdated: Date.now(),
      });
      pruneStorySessions();
    }
  } catch (err) {
    console.warn(
      JSON.stringify({
        scope: 'sessions.start.context_error',
        message: (err as Error)?.message || 'unknown',
      })
    );
  }
  console.log(
    JSON.stringify({
      scope: "sessions.start.presigned",
      sessionId,
      bucket: audioBucket,
      key,
    })
  );
  return { sessionId, uploadUrl };
}

async function transcribeMock(sessionId: string): Promise<string> {
  // Placeholder: In real impl, fetch S3 object and call Whisper
  return `Transcription for session ${sessionId} (mock)`;
}

async function transcribeWhisper(sessionId: string): Promise<string> {
  const audioBucket = process.env.AUDIO_BUCKET;
  if (!audioBucket) throw new Error("AUDIO_BUCKET not set");
  const key = `sessions/${sessionId}/audio.m4a`;
  console.log(
    JSON.stringify({
      scope: "transcribe.fetchS3.begin",
      sessionId,
      bucket: audioBucket,
      key,
    })
  );
  const body = await getObjectBuffer(audioBucket, key);
  const apiKey = await getOpenAIKey();

  // Use Node 18+ fetch + FormData/Blob
  const form = new FormData();
  const file = new Blob([body], { type: "audio/m4a" });
  form.append("file", file as any, "audio.m4a");
  form.append("model", "whisper-1");

  const t0 = Date.now();
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form as any,
  } as any);
  if (!res.ok) {
    const txt = await res.text();
    console.error(
      JSON.stringify({
        scope: "transcribe.whisper.error",
        status: res.status,
        body: txt?.slice(0, 200),
      })
    );
    throw new Error("TRANSCRIBE_FAILED");
  }
  const data: any = await res.json();
  console.log(
    JSON.stringify({
      scope: "transcribe.whisper.success",
      ms: Date.now() - t0,
      textLen: (data?.text || "").length,
    })
  );
  return data.text || "";
}

async function getObjectBuffer(bucket: string, key: string): Promise<Buffer> {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const stream = out.Body as any; // Readable
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk as Uint8Array);
  return Buffer.concat(chunks);
}

async function getOpenAIKey(): Promise<string> {
  if (OPENAI_API_KEY_CACHE) return OPENAI_API_KEY_CACHE;
  const name = process.env.OPENAI_KEY_PARAM;
  console.log("Fetching OpenAI key from SSM param", name);
  if (!name) throw new Error("OPENAI_KEY_PARAM not set");
  const out = await ssm.send(
    new GetParameterCommand({ Name: name, WithDecryption: true })
  );
  console.log("SSM get param result", out);
  const value = out.Parameter?.Value;
  if (!value || value === "SET_IN_SSM")
    throw new Error("OpenAI key not configured");
  OPENAI_API_KEY_CACHE = value;
  return value;
}

async function evaluateAI(
  transcript: string,
  context: { label?: string; example?: string }
): Promise<
  EvaluationResponse & { errors?: string[]; improvements?: string[] }
> {
  const apiKey = await getOpenAIKey();
  const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
  const timeoutMs = Number(process.env.EVAL_TIMEOUT_MS || 8000);
  const sys = `Eres un profesor de inglÃ©s que habla espaÃ±ol. 
  El alumno va a dar un ejemplo del uso de ${context.label}; debes evaluar su respuesta.

Devuelve SOLO JSON (sin texto extra) con estas claves:
  - correctness: nÃºmero 0-100 que indique quÃ© tan correcta es la respuesta.
  - errors: arreglo con hasta 3 puntos breves y accionables en espaÃ±ol (solo si hay errores reales, no inventes errores). Cuando detectes un problema de estructura o de colocaciÃ³n clave, indica claramente quÃ© parte de la estructura estÃ¡ mal y ofrece una guÃ­a corta para corregirla (por ejemplo â€œEstructura: falta el auxiliar ...â€ o â€œEstructura: orden incorrecto, deberÃ­a ser ...â€).
  - improvements: arreglo con 1 reformulaciÃ³n mÃ¡s natural para un nativo en inglÃ©s (frase concisa), sin explicaciones. Opcional si ya estÃ¡ perfecto.

Responde Ãºnicamente el JSON, da tu respuesta de una forma amable.`;

  const user = `${transcript}`;
  // Use Responses API for GPT-5 family, else fallback to Chat Completions
  const useResponses =
    /gpt-5/i.test(model) || process.env.OPENAI_USE_RESPONSES === "1";
  console.log(
    JSON.stringify({
      scope: "evaluate.openai.begin",
      model,
      mode: useResponses ? "responses" : "chat",
      tLen: transcript?.length || 0,
      hasLabel: !!context.label,
      hasExample: !!context.example,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let contentText = "";
  try {
    if (useResponses) {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: sys,
          input: [
            {
              role: "user",
              content: [{ type: "input_text", text: user }],
            },
          ],
          max_output_tokens: Number(process.env.EVAL_MAX_OUTPUT_TOKENS || 512),
        }),
        signal: ac.signal,
      });
      const full: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = full?.error?.message || res.statusText;
        console.error(
          JSON.stringify({
            scope: "evaluate.openai.httpError",
            status: res.status,
            body: String(reason).slice(0, 200),
          })
        );
        throw new Error(`EVALUATE_HTTP_${res.status}`);
      }
      // Extract output_text from Responses API
      if (Array.isArray(full?.output)) {
        for (const item of full.output) {
          if (item?.type === "message" && Array.isArray(item.content)) {
            const texts = item.content
              .filter(
                (c: any) =>
                  c?.type === "output_text" && typeof c.text === "string"
              )
              .map((c: any) => c.text);
            if (texts.length) {
              contentText = texts.join("\n");
              break;
            }
          }
        }
      }
      if (!contentText && full?.choices && full.choices[0]?.message?.content) {
        contentText = full.choices[0].message.content;
      }
      // Log basic usage
      const usage = full?.usage || {};
      console.log(
        JSON.stringify({
          scope: "evaluate.openai.success",
          mode: "responses",
          input_tokens: usage?.input_tokens,
          output_tokens: usage?.output_tokens,
        })
      );
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const txt = await res.text();
        console.error(
          JSON.stringify({
            scope: "evaluate.openai.httpError",
            status: res.status,
            body: txt?.slice(0, 200),
          })
        );
        throw new Error(`EVALUATE_HTTP_${res.status}`);
      }
      const data: any = await res.json();
      contentText = data.choices?.[0]?.message?.content || "";
      console.log(
        JSON.stringify({ scope: "evaluate.openai.success", mode: "chat" })
      );
    }
  } catch (e: any) {
    clearTimeout(to);
    if (e?.name === "AbortError") {
      console.error(
        JSON.stringify({ scope: "evaluate.openai.timeout", timeoutMs })
      );
      throw new Error("EVALUATE_TIMEOUT");
    }
    console.error(
      JSON.stringify({
        scope: "evaluate.openai.fetchError",
        message: e?.message || "unknown",
      })
    );
    throw e;
  } finally {
    clearTimeout(to);
  }

  if (!contentText) {
    throw new Error("EVALUATE_EMPTY_CONTENT");
  }

  let parsed: any = {};
  try {
    parsed = JSON.parse(contentText);
  } catch (e) {
    console.error(
      JSON.stringify({
        scope: "evaluate.openai.parseError",
        sample: String(contentText).slice(0, 120),
      })
    );
    throw new Error("EVALUATE_BAD_JSON");
  }
  const correctness = Math.max(
    0,
    Math.min(100, Number(parsed.correctness ?? 0))
  );
  const errors: string[] = Array.isArray(parsed.errors)
    ? parsed.errors.slice(0, 5)
    : [];
  const improvements: string[] = Array.isArray(parsed.improvements)
    ? parsed.improvements.slice(0, 2)
    : [];
  const result =
    correctness >= 85 ? "correct" : correctness >= 60 ? "partial" : "incorrect";
  console.log(
    JSON.stringify({
      scope: "evaluate.openai.parsed",
      score: correctness,
      errors: errors.length,
      improvements: improvements.length,
    })
  );
  return {
    score: correctness,
    result,
    feedback: {
      grammar: errors,
      wording: [],
      naturalness: [],
      register: [],
    },
    suggestions: improvements,
    nextHint: undefined,
    errors,
    improvements,
  } as any;
}

async function advanceStoryMission(
  story: StoryDefinition,
  body: StoryAdvanceRequest
): Promise<StoryAdvancePayload> {
  const missions = story.missions || [];
  const rawIndex =
    typeof body.sceneIndex === 'number' ? body.sceneIndex : Number(body.sceneIndex);
  const targetIndex = Number.isFinite(rawIndex)
    ? Math.max(0, Math.min(missions.length - 1, Math.floor(rawIndex)))
    : 0;
  let mission = missions[targetIndex];
  if (!mission && body.missionDefinition) {
    const fallbackMission = sanitizeStoryMission(body.missionDefinition);
    if (fallbackMission) {
      missions[targetIndex] = fallbackMission;
      mission = fallbackMission;
    }
  }
  if (!mission) {
    throw new Error('STORY_MISSION_NOT_FOUND');
  }

  const transcript = (body.transcript || '').trim();
  const requestHistory = sanitizeHistory(body.history).slice(-STORY_HISTORY_LIMIT);
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined;
  let sessionState = sessionId ? STORY_SESSIONS.get(sessionId) : undefined;

  if (!sessionState && sessionId) {
    sessionState = {
      storyId: story.storyId,
      missionIndex: targetIndex,
      history: requestHistory,
      requirements: [],
      lastUpdated: Date.now(),
      story,
    };
    STORY_SESSIONS.set(sessionId, sessionState);
    pruneStorySessions();
  }

  if (sessionState) {
    sessionState.storyId = sessionState.storyId || story.storyId;
    sessionState.story = sessionState.story || story;
    sessionState.missionIndex = targetIndex;
    if (requestHistory.length) {
      sessionState.history = mergeHistory(sessionState.history, requestHistory);
    }
  }

  let conversationHistory: StoryMessage[] = sessionState ? sessionState.history : requestHistory;
  conversationHistory = appendHistoryEntry(conversationHistory, {
    role: 'user',
    content: transcript,
  });
  if (sessionState) {
    sessionState.history = conversationHistory;
  }

  let correctness = 0;
  let result: EvalResult = 'incorrect';
  let errors: string[] = [];
  let reformulations: string[] = [];
  const missionRequirementIds = new Set(
    (mission.requirements || []).map((item) => item.requirementId)
  );
  let requirements = alignRequirementStates(mission, []);
  const previousRequirements =
    sessionState?.requirements &&
    sessionState.requirements.every((req) => missionRequirementIds.has(req.requirementId))
      ? sessionState.requirements
      : [];
  try {
    const missionEval = await evaluateStoryMissionProgress(
      story,
      mission,
      conversationHistory,
      transcript
    );
    const rawScore = Number(missionEval.score ?? (missionEval as any).correctness ?? 0);
    correctness = Math.max(0, Math.min(100, Math.round(rawScore)));
    const rawResult = (missionEval.result || (missionEval as any).status || '')
      .toString()
      .toLowerCase();
    if (rawResult === 'correct' || rawResult === 'partial' || rawResult === 'incorrect') {
      result = rawResult as EvalResult;
    } else {
      result = correctness >= 85 ? 'correct' : correctness >= 60 ? 'partial' : 'incorrect';
    }
    if (Array.isArray(missionEval.errors)) {
      errors = missionEval.errors.slice(0, 3).map((item) => String(item));
    }
    const alternatives =
      missionEval.alternatives ??
      (missionEval as any).improvements ??
      (missionEval as any).suggestions ??
      [];
    if (Array.isArray(alternatives)) {
      reformulations = alternatives.slice(0, 2).map((item) => String(item));
    }
    if (Array.isArray(missionEval.requirements)) {
      requirements = alignRequirementStates(mission, missionEval.requirements);
    }
  } catch (err) {
    console.error(
      JSON.stringify({
        scope: 'stories.advance.progress_error',
        message: (err as Error)?.message || 'unknown',
      })
    );
  }

  requirements = mergeRequirementProgress(previousRequirements, requirements);

  let aiReply = 'Thanks for sharing! Could you add a bit more detail?';
  try {
    aiReply = await generateStoryReply(
      story,
      mission,
      conversationHistory,
      requirements,
      { result, correctness }
    );
  } catch (err) {
    console.error(
      JSON.stringify({
        scope: 'stories.advance.reply_error',
        message: (err as Error)?.message || 'unknown',
      })
    );
  }

  conversationHistory = appendHistoryEntry(conversationHistory, {
    role: 'assistant',
    content: aiReply,
  });
  if (sessionState) {
    sessionState.history = conversationHistory;
  }

  const missionCompleted = requirements.every((req) => req.met);
  const nextIndex = missionCompleted ? targetIndex + 1 : targetIndex;
  const storyCompleted = missionCompleted && nextIndex >= missions.length;

  if (sessionState) {
    sessionState.requirements = requirements;
    sessionState.missionIndex = storyCompleted ? nextIndex : targetIndex;
    sessionState.story = story;
    if (storyCompleted && sessionId) {
      STORY_SESSIONS.delete(sessionId);
    }
  }

  return {
    sceneIndex: storyCompleted ? targetIndex : nextIndex,
    missionCompleted,
    storyCompleted,
    requirements,
    aiReply,
    correctness,
    result,
    errors,
    reformulations,
  };
}


async function evaluateStoryMissionProgress(
  story: StoryDefinition,
  mission: StoryMission,
  history: StoryMessage[],
  transcript: string
): Promise<{
  requirements: any[];
  score: number;
  result?: string;
  errors: string[];
  alternatives: string[];
  objectivesMet: boolean;
  correctness?: number;
  status?: string;
  suggestions?: string[];
  improvements?: string[];
}> {
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 8000);
  const useResponses =
    /gpt-5/i.test(model) || process.env.OPENAI_USE_RESPONSES === '1';
  const conversation = history.slice(-STORY_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) => `${msg.role === 'user' ? 'Student' : 'Guide'}: ${msg.content}`)
    .join('\n')
    .trim();
  const requirementsList = (mission.requirements || [])
    .map((req, index) => `${index + 1}. ${req.requirementId}: ${req.text}`)
    .join('\n');
  const systemPrompt = `You are an English coach evaluating the student's latest message inside a role-play mission.
Return ONLY JSON with this exact shape:{
  "score": number,
  "result": "correct" | "partial" | "incorrect",
  "errors": string[],
  "alternatives": string[],
  "requirements": [
    {"requirementId": "string", "met": boolean, "feedback": "string"}
  ],
  "objectives_met": boolean
}

Rules:
- Just evaluate the last student message English, don’t evaluate if the message helps to achieve the requirements.
- Use Spanish for errors and feedback texts.
- Evaluate the student's last message using the full conversation context (only to interpret meaning, not for grading progress).
- Link errors to issues in the last message (max 3).
- Provide up to 2 natural English alternatives for the last message.
- Keep the requirements array in the original order.
- objectives_met must be true only if every requirement is met across the conversation.
- Do not include any extra keys or commentary.

Language evaluation rubric (for the last message only):
- correct: No significant grammar or usage errors; natural and fluent.
- partial: Understandable but with 1–2 noticeable grammar or word choice issues.
- incorrect: Serious grammatical or lexical errors that make the message hard to understand.

Scoring:
- Start from 100 and subtract 10–40 points per error depending on severity.
`;

  const userPrompt = `Story: ${story.title}\nMission: ${mission.title}\nRole: ${mission.aiRole}\nMission summary: ${mission.sceneSummary || 'No summary provided.'}\nObjectives:\n${requirementsList || 'No explicit objectives listed.'}\n\nFull conversation so far (Student is the learner, Guide is the coach):\n
  ${conversationText || 'No prior conversation.'}\n\nLast student message to evaluate:\n${transcript || '<empty>'}`;
  console.log(
    JSON.stringify({
      scope: 'stories.evaluate.begin',
      storyId: story.storyId,
      missionId: mission.missionId,
      userPrompt,
      systemPrompt,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = '';
  try {
    if (useResponses) {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: systemPrompt,
          input: [
            {
              role: 'user',
              content: [{ type: 'input_text', text: userPrompt }],
            },
          ],
          response_format: { type: 'json_object' },
          max_output_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 600),
        }),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join('\n');
              break;
            }
          }
        }
      }
      if (!raw && payload?.output_text) {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 600),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      throw new Error('STORY_MODEL_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  if (!raw) {
    throw new Error('STORY_MODEL_EMPTY_RESPONSE');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error('STORY_MODEL_BAD_JSON');
  }

  const score = Math.max(0, Math.min(100, Number(parsed?.score ?? parsed?.correctness ?? 0)));
  const result = typeof parsed?.result === 'string' ? parsed.result : undefined;
  const errors = Array.isArray(parsed?.errors)
    ? parsed.errors.slice(0, 3).map((item: any) => String(item))
    : [];
  const alternatives = Array.isArray(parsed?.alternatives)
    ? parsed.alternatives.slice(0, 2).map((item: any) => String(item))
    : [];
  const requirements = Array.isArray(parsed?.requirements) ? parsed.requirements : [];
  const objectivesMet =
    typeof parsed?.objectives_met === 'boolean'
      ? parsed.objectives_met
      : requirements.length
      ? requirements.every((item: any) => !!(item?.met ?? item?.completed ?? false))
      : true;

  return {
    requirements,
    score,
    result,
    errors,
    alternatives,
    objectivesMet,
    correctness: score,
    status: result,
    suggestions: alternatives,
    improvements: alternatives,
  };
}

async function generateStoryReply(
  story: StoryDefinition,
  mission: StoryMission,
  history: StoryMessage[],
  requirements: StoryAdvanceRequirementState[],
  evaluation: { result: EvalResult; correctness: number }
): Promise<string> {
  const apiKey = await getOpenAIKey();
  const model =
    process.env.OPENAI_STORY_MODEL || process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';
  const timeoutMs = Number(process.env.STORY_TIMEOUT_MS || 8000);
  const useResponses =
    /gpt-5/i.test(model) || process.env.OPENAI_USE_RESPONSES === '1';
  const conversation = history.slice(-STORY_HISTORY_LIMIT);
  const conversationText = conversation
    .map((msg) => `${msg.role === 'user' ? 'Student' : 'Guide'}: ${msg.content}`)
    .join('\n')
    .trim();
  const systemPrompt = `You are ${mission.aiRole}. Continue the role-play in English as the guide.\n
  Stay coherent with the scene, be encouraging, and keep the reply under 10 words.\nTry to use a B2 level of English.`;
  const userPrompt = `Story: ${story.title}\nMission: ${mission.title}\nMission summary: ${mission.sceneSummary || 'No summary provided.'}
  ${conversationText || 'No prior conversation.'}\n\nWrite the next Guide message in English, sounding natural and aligned with ${mission.aiRole}.`;
  console.log(
    JSON.stringify({
      scope: 'stories.reply.openai.begin',
      storyId: story.storyId,
      missionId: mission.missionId,
      userPrompt,
      systemPrompt,
    })
  );

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), timeoutMs);
  let raw = '';
  try {
    if (useResponses) {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          instructions: systemPrompt,
          input: [
            {
              role: 'user',
              content: [{ type: 'input_text', text: userPrompt }],
            },
          ],
          max_output_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 400),
        }),
        signal: ac.signal,
      });
      const payload: any = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = payload?.error?.message || res.statusText;
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${reason}`);
      }
      if (Array.isArray(payload?.output)) {
        for (const item of payload.output) {
          if (item?.type === 'message' && Array.isArray(item.content)) {
            const texts = item.content
              .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
              .map((c: any) => c.text);
            if (texts.length) {
              raw = texts.join('\n');
              break;
            }
          }
        }
      }
      if (!raw && payload?.output_text) {
        raw = payload.output_text;
      }
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: Number(process.env.STORY_MAX_OUTPUT_TOKENS || 400),
        }),
        signal: ac.signal,
      });
      if (!res.ok) {
        const bodyTxt = await res.text();
        throw new Error(`STORY_MODEL_HTTP_${res.status}_${bodyTxt.slice(0, 120)}`);
      }
      const data: any = await res.json();
      raw = data.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    if ((err as any)?.name === 'AbortError') {
      throw new Error('STORY_MODEL_TIMEOUT');
    }
    throw err;
  } finally {
    clearTimeout(to);
  }

  if (!raw) {
    throw new Error('STORY_MODEL_EMPTY_RESPONSE');
  }

  return raw.trim();
}


function mergeRequirementProgress(
  previous: StoryAdvanceRequirementState[],
  current: StoryAdvanceRequirementState[]
): StoryAdvanceRequirementState[] {
  if (!previous.length) return current;
  const prevById = new Map(previous.map((item) => [item.requirementId, item]));
  return current.map((state) => {
    const prev = prevById.get(state.requirementId);
    if (!prev) return state;
    if (prev.met && !state.met) {
      return {
        ...state,
        met: true,
        feedback: prev.feedback || state.feedback,
      };
    }
    if (prev.met && state.met) {
      return {
        ...state,
        feedback: state.feedback || prev.feedback,
      };
    }
    return state;
  });
}

function alignRequirementStates(
  mission: StoryMission,
  rawStates: any[]
): StoryAdvanceRequirementState[] {
  return (mission.requirements || []).map((req, index) => {
    const match = Array.isArray(rawStates)
      ? rawStates.find((item) =>
          item?.requirementId === req.requirementId ||
          item?.requirement_id === req.requirementId ||
          item?.index === index
        )
      : undefined;
    const met = !!(match?.met ?? match?.completed ?? false);
    let feedback: string | undefined;
    if (typeof match?.feedback === 'string') feedback = match.feedback;
    else if (typeof match?.note === 'string') feedback = match.note;
    else if (typeof match?.explanation === 'string') feedback = match.explanation;
    if (!feedback && met) feedback = 'Listo, requisito cubierto.';
    if (!feedback && !met) feedback = 'Aun falta mencionar este punto.';
    return {
      requirementId: req.requirementId,
      text: req.text,
      met,
      feedback,
    };
  });
}
function mockCards(): CardItem[] {
  return [
    {
      cardId: "pv_set_up_001",
      type: "phrasal",
      prompt:
        "What does 'set up' mean in this context: 'We need to set up the new router'?",
      answers: ["install", "configure", "prepare"],
      hints: ["Separable: set it up", "Similar to 'install'"],
      examples: ["I'll set up the projector", "She set up a meeting"],
      tags: ["B2", "tech", "separable"],
      difficulty: "B2",
    },
    {
      cardId: "st_inversion_001",
      type: "structure",
      prompt: "Reformulate: 'I had never seen such a view' (B2 style)",
      answers: ["Never had I seen such a view"],
      hints: ["Use inversion after negative adverbials"],
      examples: ["Rarely have I been so moved"],
      tags: ["B2", "grammar"],
      difficulty: "B2",
    },
    {
      cardId: "vb_workplace_001",
      type: "vocab",
      prompt: "Natural alternative to 'do a meeting'?",
      answers: ["have a meeting", "hold a meeting"],
      hints: ["Collocation: have/hold a meeting"],
      examples: ["We have a meeting at 10"],
      tags: ["B1+", "workplace", "collocation"],
      difficulty: "B1+",
    },
  ];
}






















