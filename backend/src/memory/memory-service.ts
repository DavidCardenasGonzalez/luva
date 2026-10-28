import { randomUUID } from "crypto";
import { getMemoryIndex, type UpsertRecord } from "./pinecone";
import { embedText } from "./embeddings";

// Memory record types stored in Pinecone metadata. Adding new memory types
// (e.g. global user memory, episodic memory) means adding a new method here —
// the chat pipeline only depends on this service, never on Pinecone directly.
export const MEMORY_TYPE_BIOGRAPHY = "character_biography";
export const MEMORY_TYPE_FRIENDSHIP = "friendship_memory";

export interface FriendshipMemoryInput {
  text: string;
  importance?: number;
}

export interface RetrievedFriendshipMemory {
  text: string;
  createdAt?: string;
  importance?: number;
}

export interface StoreFriendshipMemoriesParams {
  friendshipId: string;
  characterId: string;
  userId: string;
  memories: FriendshipMemoryInput[];
}

export interface RetrieveFriendshipMemoriesParams {
  friendshipId: string;
  queryText: string;
  topK?: number;
}

// Prefix for all of a character's biography chunk vectors. The biography is
// split (by GPT, upstream) into atomic facts, each stored as its own vector so
// chat can semantically retrieve only the relevant facts. Listing by this prefix
// lets us delete the previous chunks when the biography is re-saved.
function biographyVectorPrefix(characterId: string): string {
  return `${MEMORY_TYPE_BIOGRAPHY}#${characterId}#`;
}

function biographyChunkVectorId(characterId: string, index: number): string {
  return `${biographyVectorPrefix(characterId)}${index}`;
}

// Legacy id from the single-vector biography design; deleted on replace so old
// data does not linger alongside the new chunked vectors.
function legacyBiographyVectorId(characterId: string): string {
  return `${MEMORY_TYPE_BIOGRAPHY}#${characterId}`;
}

/**
 * Encapsulates every Pinecone read/write. The chat flow and admin handlers
 * depend only on this interface, so the vector backend (or an eventual
 * LlamaIndex layer) can change without touching callers.
 */
export class MemoryService {
  // --- Character biography (split into atomic facts, one vector each) ---

  // Replaces ALL of a character's biography chunks: deletes the previous ones
  // (and any legacy single vector) and upserts the new facts. Each fact is its
  // own vector so chat can semantically retrieve only the relevant ones.
  async replaceCharacterBiographyChunks(characterId: string, chunks: string[]): Promise<void> {
    if (!characterId) return;
    const index = await getMemoryIndex();
    await this.deleteCharacterBiography(characterId);

    const facts = chunks.map((c) => (c || "").trim()).filter(Boolean);
    if (!facts.length) return;

    const updatedAt = new Date().toISOString();
    const records: UpsertRecord[] = await Promise.all(
      facts.map(async (text, i) => ({
        id: biographyChunkVectorId(characterId, i),
        values: await embedText(text),
        metadata: {
          type: MEMORY_TYPE_BIOGRAPHY,
          characterId,
          text,
          chunkIndex: i,
          updatedAt,
        },
      }))
    );
    await index.upsert({ records });
  }

  // Semantic retrieval of the biography facts most relevant to the query.
  async retrieveCharacterBiography(params: {
    characterId: string;
    queryText: string;
    topK?: number;
  }): Promise<string[]> {
    const { characterId, queryText, topK = 5 } = params;
    if (!characterId || !(queryText || "").trim()) return [];
    const index = await getMemoryIndex();
    const vector = await embedText(queryText);
    const res = await index.query({
      vector,
      topK,
      includeMetadata: true,
      filter: { type: MEMORY_TYPE_BIOGRAPHY, characterId },
    });
    const out: string[] = [];
    for (const match of res.matches || []) {
      const md = (match.metadata || {}) as Record<string, unknown>;
      const text = typeof md.text === "string" ? md.text.trim() : "";
      if (text) out.push(text);
    }
    return out;
  }

  async deleteCharacterBiography(characterId: string): Promise<void> {
    if (!characterId) return;
    const index = await getMemoryIndex();
    const ids = await index.listIds(biographyVectorPrefix(characterId));
    ids.push(legacyBiographyVectorId(characterId)); // also drop legacy single vector
    await index.deleteMany(ids);
  }

  // --- Friendship memory (per user + character) ---

  async storeFriendshipMemories(params: StoreFriendshipMemoriesParams): Promise<void> {
    const { friendshipId, characterId, userId, memories } = params;
    if (!friendshipId || !memories?.length) return;
    const createdAt = new Date().toISOString();
    const vectors = await Promise.all(
      memories
        .map((memory) => ({ ...memory, text: (memory.text || "").trim() }))
        .filter((memory) => memory.text.length > 0)
        .map(async (memory) => ({
          id: `${MEMORY_TYPE_FRIENDSHIP}#${friendshipId}#${randomUUID()}`,
          values: await embedText(memory.text),
          metadata: {
            type: MEMORY_TYPE_FRIENDSHIP,
            friendshipId,
            characterId,
            userId,
            importance: typeof memory.importance === "number" ? memory.importance : 1,
            createdAt,
            text: memory.text,
          },
        }))
    );
    if (!vectors.length) return;
    const index = await getMemoryIndex();
    await index.upsert({ records: vectors });
  }

  // Memories are filtered by friendshipId, so two users talking to the same
  // character can never retrieve each other's memories.
  async retrieveFriendshipMemories(
    params: RetrieveFriendshipMemoriesParams
  ): Promise<RetrievedFriendshipMemory[]> {
    const { friendshipId, queryText, topK = 5 } = params;
    if (!friendshipId || !(queryText || "").trim()) return [];
    const index = await getMemoryIndex();
    const vector = await embedText(queryText);
    const res = await index.query({
      vector,
      topK,
      includeMetadata: true,
      filter: { type: MEMORY_TYPE_FRIENDSHIP, friendshipId },
    });
    const out: RetrievedFriendshipMemory[] = [];
    for (const match of res.matches || []) {
      const md = (match.metadata || {}) as Record<string, unknown>;
      const text = typeof md.text === "string" ? md.text : "";
      if (!text) continue;
      out.push({
        text,
        createdAt: typeof md.createdAt === "string" ? md.createdAt : undefined,
        importance: typeof md.importance === "number" ? md.importance : undefined,
      });
    }
    return out;
  }
}

let singleton: MemoryService | undefined;

export function getMemoryService(): MemoryService {
  if (!singleton) singleton = new MemoryService();
  return singleton;
}
