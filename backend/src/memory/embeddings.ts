import { getSsmSecret } from "./secrets";

// Embedding model + dimension. text-embedding-3-small returns 1536 dims, which
// must match the Pinecone index dimension (see pinecone.ts).
const DEFAULT_EMBED_MODEL = "text-embedding-3-small";
export const EMBED_DIMENSION = 1536;
const MAX_EMBED_CHARS = 8000;

let openAiKeyCache: string | undefined;

async function getOpenAiKey(): Promise<string> {
  if (openAiKeyCache) return openAiKeyCache;
  const direct = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (direct?.trim()) {
    openAiKeyCache = direct.trim();
    return openAiKeyCache;
  }
  const name = process.env.OPENAI_KEY_PARAM;
  if (!name) throw new Error("OPENAI_KEY_PARAM not set");
  openAiKeyCache = await getSsmSecret(name);
  return openAiKeyCache;
}

export async function embedText(text: string): Promise<number[]> {
  const input = (text || "").trim().slice(0, MAX_EMBED_CHARS);
  if (!input) throw new Error("EMBEDDING_EMPTY_INPUT");
  const apiKey = await getOpenAiKey();
  const model = process.env.OPENAI_EMBED_MODEL || DEFAULT_EMBED_MODEL;
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EMBEDDING_HTTP_${res.status}_${body.slice(0, 160)}`);
  }
  const data: any = await res.json();
  const vector = data?.data?.[0]?.embedding;
  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("EMBEDDING_EMPTY_RESPONSE");
  }
  return vector as number[];
}
