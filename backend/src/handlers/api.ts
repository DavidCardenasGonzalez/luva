import type {
  APIGatewayProxyEventV2 as Event,
  APIGatewayProxyResultV2 as Result,
} from "aws-lambda";
import { randomUUID } from "crypto";
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
} from "../types";

const s3 = new S3Client({});
const ssm = new SSMClient({});
let OPENAI_API_KEY_CACHE: string | undefined;

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
      const { uploadUrl, sessionId } = await startSession();
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
        unlocked: { stories: ["restaurant_rush"] },
      });
    }

    if (method === "GET" && path === `${ROUTE_PREFIX}/stories`) {
      return json(200, { items: mockStories() });
    }

    const storyAdvance = path.match(/^\/v1\/stories\/([^/]+)\/advance$/);
    if (method === "POST" && storyAdvance) {
      return json(200, {
        sceneIndex: 1,
        feedback: ["Good intent recognized"],
        done: false,
      });
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

async function startSession(): Promise<{
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
  const sys = `Eres un profesor de inglés que habla español. 
  El alumno va a dar un ejemplo del uso de ${context.label} debe evaluar su respuesta.

Devuelve SOLO JSON (sin texto extra) con estas claves:
  - correctness: número 0-100 que indique qué tan correcta es la respuesta.
  - errors: arreglo con hasta 3 puntos breves y accionables en español (solo si hay errores reales, no inventes errores).
  - improvements: arreglo con 1 reformulación más natural para un nativo en inglés (frase concisa), sin explicaciones. Opcional si ya está perfecto.

Responde únicamente el JSON, da tu respuesta de una forma amable.`;

  const user = `${context.example}`;
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

function mockStories() {
  return [
    {
      storyId: "restaurant_rush",
      title: "Restaurant Rush",
      unlockCost: 50,
      tags: ["food", "service"],
      sceneOrder: [0, 1, 2, 3],
      locked: false,
    },
  ];
}
