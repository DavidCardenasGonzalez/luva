import { randomUUID } from "crypto";
import { getMemoryIndex } from "./pinecone";
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

function biographyVectorId(characterId: string): string {
  return `${MEMORY_TYPE_BIOGRAPHY}#${characterId}`;
}

/**
 * Encapsulates every Pinecone read/write. The chat flow and admin handlers
 * depend only on this interface, so the vector backend (or an eventual
 * LlamaIndex layer) can change without touching callers.
 */
export class MemoryService {
  // --- Character biography (one document per character) ---

  // Deterministic id means re-saving replaces the previous embedding instead of
  // creating duplicates.
  async upsertCharacterBiography(characterId: string, text: string): Promise<void> {
    const trimmed = (text || "").trim();
    if (!characterId || !trimmed) return;
    const index = await getMemoryIndex();
    const values = await embedText(trimmed);
    await index.upsert({
      records: [
        {
          id: biographyVectorId(characterId),
          values,
          metadata: {
            type: MEMORY_TYPE_BIOGRAPHY,
            characterId,
            text: trimmed,
            updatedAt: new Date().toISOString(),
          },
        },
      ],
    });
  }

  async getCharacterBiography(characterId: string): Promise<string | undefined> {
    if (!characterId) return undefined;
    const id = biographyVectorId(characterId);
    const index = await getMemoryIndex();
    const res = await index.fetch({ ids: [id] });
    const text = res.records?.[id]?.metadata?.text;
    return typeof text === "string" && text.trim() ? text.trim() : undefined;
  }

  async deleteCharacterBiography(characterId: string): Promise<void> {
    if (!characterId) return;
    const index = await getMemoryIndex();
    await index.deleteOne({ id: biographyVectorId(characterId) });
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
