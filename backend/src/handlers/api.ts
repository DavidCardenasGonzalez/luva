import type { APIGatewayProxyEventV2 as Event, APIGatewayProxyResultV2 as Result } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EvaluationResponse, ApiResponse, SessionStartResponse, CardItem } from '../types';

const s3 = new S3Client({});
const ssm = new SSMClient({});
let OPENAI_API_KEY_CACHE: string | undefined;

function json(statusCode: number, data: unknown): ApiResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

function notFound(): ApiResponse { return json(404, { message: 'Not Found' }); }
function badRequest(message: string): ApiResponse { return json(400, { message }); }

const ROUTE_PREFIX = '/v1';

export const handler = async (event: any): Promise<Result> => {
  const method: string = event.httpMethod || event.requestContext?.http?.method || 'GET';
  const rawPath: string = event.resource && event.path ? event.path : event.requestContext?.http?.path || '/';
  const path = rawPath.startsWith(ROUTE_PREFIX) ? rawPath : `${ROUTE_PREFIX}${rawPath}`;

  try {
    if (method === 'GET' && path === `${ROUTE_PREFIX}/cards`) {
      return json(200, { items: mockCards(), nextCursor: null });
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/sessions/start`) {
      const { uploadUrl, sessionId } = await startSession();
      return json(200, { sessionId, uploadUrl } satisfies SessionStartResponse);
    }

    const sessionTranscribe = path.match(/^\/v1\/sessions\/([^/]+)\/transcribe$/);
    if (method === 'POST' && sessionTranscribe) {
      const sessionId = sessionTranscribe[1];
      const transcript = await transcribeWhisper(sessionId);
      return json(200, { transcript });
    }

    const sessionEvaluate = path.match(/^\/v1\/sessions\/([^/]+)\/evaluate$/);
    if (method === 'POST' && sessionEvaluate) {
      const sessionId = sessionEvaluate[1];
      const body = parseBody(event.body);
      const transcript = body?.transcript ?? '';
      const evalResponse = evaluateMock(transcript);
      return json(200, evalResponse satisfies EvaluationResponse);
    }

    const cardComplete = path.match(/^\/v1\/cards\/([^/]+)\/complete$/);
    if (method === 'POST' && cardComplete) {
      // Normally update streak/points in DynamoDB
      return json(200, { newPoints: 5, unlocked: { stories: ["restaurant_rush"] } });
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/stories`) {
      return json(200, { items: mockStories() });
    }

    const storyAdvance = path.match(/^\/v1\/stories\/([^/]+)\/advance$/);
    if (method === 'POST' && storyAdvance) {
      return json(200, { sceneIndex: 1, feedback: ["Good intent recognized"], done: false });
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/me/progress`) {
      return json(200, { points: 120, streaks: { max: 7, current: 2 }, recent: [] });
    }

    return notFound();
  } catch (err: any) {
    console.error('Error', err);
    return json(500, { message: 'Internal error', code: 'INTERNAL_ERROR' });
  }
};

function parseBody(body: any): any {
  if (!body) return undefined;
  try { return typeof body === 'string' ? JSON.parse(body) : body; } catch { return undefined; }
}

async function startSession(): Promise<{ sessionId: string; uploadUrl: string; }> {
  const sessionId = randomUUID();
  const audioBucket = process.env.AUDIO_BUCKET;
  if (!audioBucket) throw new Error('AUDIO_BUCKET not set');
  const key = `sessions/${sessionId}/audio.m4a`;
  const cmd = new PutObjectCommand({ Bucket: audioBucket, Key: key, ContentType: 'audio/mp4' });
  const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 });
  return { sessionId, uploadUrl };
}

async function transcribeMock(sessionId: string): Promise<string> {
  // Placeholder: In real impl, fetch S3 object and call Whisper
  return `Transcription for session ${sessionId} (mock)`;
}

async function transcribeWhisper(sessionId: string): Promise<string> {
  const audioBucket = process.env.AUDIO_BUCKET;
  if (!audioBucket) throw new Error('AUDIO_BUCKET not set');
  const key = `sessions/${sessionId}/audio.m4a`;
  const body = await getObjectBuffer(audioBucket, key);
  const apiKey = await getOpenAIKey();

  // Use Node 18+ fetch + FormData/Blob
  const form = new FormData();
  const file = new Blob([body], { type: 'audio/m4a' });
  form.append('file', file as any, 'audio.m4a');
  form.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form as any,
  } as any);
  if (!res.ok) {
    const txt = await res.text();
    console.error('Whisper error', res.status, txt);
    throw new Error('TRANSCRIBE_FAILED');
  }
  const data: any = await res.json();
  return data.text || '';
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
  console.log('Fetching OpenAI key from SSM param', name);
  if (!name) throw new Error('OPENAI_KEY_PARAM not set');
  const out = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  console.log('SSM get param result', out);
  const value = out.Parameter?.Value;
  if (!value || value === 'SET_IN_SSM') throw new Error('OpenAI key not configured');
  OPENAI_API_KEY_CACHE = value;
  return value;
}

function evaluateMock(transcript: string): EvaluationResponse {
  // Very naive scoring for demo
  const score = Math.min(100, Math.max(0, Math.round(50 + (transcript.length % 50))));
  const result = score > 80 ? 'correct' : score > 60 ? 'partial' : 'incorrect';
  return {
    score,
    result,
    feedback: {
      grammar: ["Mind verb tenses; prefer present perfect when needed."],
      wording: ["Prefer 'set up' over 'mount' in IT contexts."],
      naturalness: ["Be concise: 'Could you help me set up the router?'"],
      register: ["Polite requests: 'Could I get...?' in restaurants."],
    },
    suggestions: [
      "Try: 'I set up the meeting for tomorrow at 10.'",
    ],
    nextHint: "Remember separable: 'set it up'.",
  };
}

function mockCards(): CardItem[] {
  return [
    {
      cardId: 'pv_set_up_001',
      type: 'phrasal',
      prompt: "What does 'set up' mean in this context: 'We need to set up the new router'?",
      answers: ['install', 'configure', 'prepare'],
      hints: ['Separable: set it up', "Similar to 'install'"],
      examples: ["I'll set up the projector", 'She set up a meeting'],
      tags: ['B2', 'tech', 'separable'],
      difficulty: 'B2',
    },
    {
      cardId: 'st_inversion_001',
      type: 'structure',
      prompt: "Reformulate: 'I had never seen such a view' (B2 style)",
      answers: ['Never had I seen such a view'],
      hints: ['Use inversion after negative adverbials'],
      examples: ['Rarely have I been so moved'],
      tags: ['B2', 'grammar'],
      difficulty: 'B2',
    },
    {
      cardId: 'vb_workplace_001',
      type: 'vocab',
      prompt: "Natural alternative to 'do a meeting'?",
      answers: ['have a meeting', 'hold a meeting'],
      hints: ['Collocation: have/hold a meeting'],
      examples: ['We have a meeting at 10'],
      tags: ['B1+', 'workplace', 'collocation'],
      difficulty: 'B1+',
    },
  ];
}

function mockStories() {
  return [
    {
      storyId: 'restaurant_rush',
      title: 'Restaurant Rush',
      unlockCost: 50,
      tags: ['food', 'service'],
      sceneOrder: [0, 1, 2, 3],
      locked: false,
    },
  ];
}
