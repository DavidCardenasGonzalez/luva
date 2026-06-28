import { getSsmSecret } from "./secrets";
import { EMBED_DIMENSION } from "./embeddings";

// Minimal Pinecone client built on native fetch.
//
// We deliberately do NOT use @pinecone-database/pinecone at runtime: esbuild
// bundling breaks the SDK's HTTP layer inside the Lambda, surfacing as a fast
// PineconeConnectionError even though outbound internet works (the OpenAI calls
// over native fetch succeed from the same function). Talking to the REST API
// directly with the same fetch that already works avoids that whole class of
// bundling issues and keeps the Lambda bundle small.
//
// All Pinecone access in the codebase goes through getMemoryIndex(); nothing
// else imports the SDK directly.
const DEFAULT_INDEX_NAME = "luva-memory";
const DEFAULT_CLOUD = "aws";
const DEFAULT_REGION = "us-east-1";
const CONTROL_PLANE = "https://api.pinecone.io";
const API_VERSION = "2025-01";

let apiKeyPromise: Promise<string> | undefined;
// Memoized so concurrent first calls (e.g. biography + memories via Promise.all)
// share a single describe round trip instead of racing.
let indexHostPromise: Promise<string> | undefined;

// Strips surrounding whitespace and stray wrapping quotes (straight OR curly).
// Guards against a key pasted into SSM with smart quotes, which otherwise blows
// up when used as an HTTP header value (headers must be latin1 ByteStrings).
function sanitizeApiKey(raw: string): string {
  return raw
    .trim()
    .replace(/^["'“”‘’]+/, "")
    .replace(/["'“”‘’]+$/, "")
    .trim();
}

async function getPineconeApiKey(): Promise<string> {
  if (!apiKeyPromise) {
    apiKeyPromise = (async () => {
      const direct = process.env.PINECONE_API_KEY;
      if (direct?.trim()) return sanitizeApiKey(direct);
      const name = process.env.PINECONE_KEY_PARAM;
      if (!name) throw new Error("PINECONE_KEY_PARAM not set");
      return sanitizeApiKey(await getSsmSecret(name));
    })().catch((err) => {
      apiKeyPromise = undefined; // allow retry on failure
      throw err;
    });
  }
  return apiKeyPromise;
}

function getIndexName(): string {
  return process.env.PINECONE_INDEX_NAME || DEFAULT_INDEX_NAME;
}

async function pineconeFetch(url: string, init: RequestInit & { apiKey: string }): Promise<any> {
  const { apiKey, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
      "X-Pinecone-Api-Version": API_VERSION,
      ...(rest.headers || {}),
    },
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    const err: any = new Error(
      `Pinecone ${rest.method || "GET"} ${url} -> ${res.status} ${text.slice(0, 300)}`
    );
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : {};
}

// Resolves (and caches) the data-plane host for the index, creating the index
// if it does not exist yet. Creating a serverless index is slow (10-60s) and we
// never block a request on readiness; if it is still provisioning the data-plane
// call simply fails and the user can retry.
async function resolveIndexHost(): Promise<string> {
  const apiKey = await getPineconeApiKey();
  const name = getIndexName();
  try {
    const desc = await pineconeFetch(`${CONTROL_PLANE}/indexes/${name}`, {
      method: "GET",
      apiKey,
    });
    if (desc?.host) return desc.host as string;
  } catch (err: any) {
    if (err?.status !== 404) throw err; // network/auth -> bubble up
  }

  // Index missing: create without waiting for readiness.
  await pineconeFetch(`${CONTROL_PLANE}/indexes`, {
    method: "POST",
    apiKey,
    body: JSON.stringify({
      name,
      dimension: EMBED_DIMENSION,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: process.env.PINECONE_CLOUD || DEFAULT_CLOUD,
          region: process.env.PINECONE_REGION || DEFAULT_REGION,
        },
      },
    }),
  }).catch((err: any) => {
    // 409 => another caller already created it; fall through to re-describe.
    if (err?.status !== 409) throw err;
  });

  const desc = await pineconeFetch(`${CONTROL_PLANE}/indexes/${name}`, {
    method: "GET",
    apiKey,
  });
  if (!desc?.host) throw new Error(`Pinecone index "${name}" has no host yet (still provisioning)`);
  return desc.host as string;
}

function getIndexHost(): Promise<string> {
  if (!indexHostPromise) {
    indexHostPromise = resolveIndexHost().catch((err) => {
      indexHostPromise = undefined; // reset so a later call retries
      throw err;
    });
  }
  return indexHostPromise;
}

export interface UpsertRecord {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface QueryParams {
  vector: number[];
  topK: number;
  includeMetadata?: boolean;
  filter?: Record<string, unknown>;
}

export interface QueryMatch {
  id: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

export interface FetchResult {
  records: Record<string, { id: string; metadata?: Record<string, unknown> }>;
}

// Thin data-plane wrapper exposing only what MemoryService needs. Method shapes
// mirror the previous SDK surface so MemoryService did not have to change.
export class MemoryIndex {
  constructor(private readonly host: string, private readonly apiKey: string) {}

  async upsert(params: { records: UpsertRecord[] }): Promise<void> {
    const vectors = params.records.map((r) => ({
      id: r.id,
      values: r.values,
      ...(r.metadata ? { metadata: r.metadata } : {}),
    }));
    if (!vectors.length) return;
    await pineconeFetch(`https://${this.host}/vectors/upsert`, {
      method: "POST",
      apiKey: this.apiKey,
      body: JSON.stringify({ vectors }),
    });
  }

  async fetch(params: { ids: string[] }): Promise<FetchResult> {
    if (!params.ids.length) return { records: {} };
    const qs = params.ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
    const res = await pineconeFetch(`https://${this.host}/vectors/fetch?${qs}`, {
      method: "GET",
      apiKey: this.apiKey,
    });
    // REST returns { vectors: { id: {...} } }; normalize to { records }.
    return { records: res?.vectors || {} };
  }

  async query(params: QueryParams): Promise<{ matches: QueryMatch[] }> {
    const res = await pineconeFetch(`https://${this.host}/query`, {
      method: "POST",
      apiKey: this.apiKey,
      body: JSON.stringify({
        vector: params.vector,
        topK: params.topK,
        includeMetadata: params.includeMetadata ?? true,
        ...(params.filter ? { filter: params.filter } : {}),
      }),
    });
    return { matches: (res?.matches as QueryMatch[]) || [] };
  }

  async deleteOne(params: { id: string }): Promise<void> {
    await pineconeFetch(`https://${this.host}/vectors/delete`, {
      method: "POST",
      apiKey: this.apiKey,
      body: JSON.stringify({ ids: [params.id] }),
    });
  }
}

export async function getMemoryIndex(): Promise<MemoryIndex> {
  const [host, apiKey] = await Promise.all([getIndexHost(), getPineconeApiKey()]);
  return new MemoryIndex(host, apiKey);
}
