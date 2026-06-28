# Long-term memory (Pinecone)

First version of permanent, cross-session memory for Luva characters. All
Pinecone access is encapsulated behind `MemoryService` (`memory-service.ts`); the
chat flow and admin handlers never touch Pinecone or embeddings directly, so the
backend can be swapped (e.g. to LlamaIndex) without changing callers.

## Two memory sources

1. **Character biography** — one document per character, edited in the admin
   portal (`/characters/:id` → "Biografía del personaje"). Source of truth is the
   `CharacterBiographiesTable` (DynamoDB); the embedding lives in Pinecone under a
   deterministic id (`character_biography#<characterId>`) so re-saving replaces it.
2. **Friendship memory** — per `friendshipId` (`<userId>#<friendId>`). Concise
   semantic facts extracted from a finished conversation, embedded and stored.
   The retrieval filter is scoped by `friendshipId`, so two users talking to the
   same character never share memories.

## Flow

- **Read (every message):** `advanceFriendChat` embeds the user message, fetches
  the biography + top-5 friendship memories, and injects them into the chat
  system prompt as factual "Character Biography" / "Previous Memories" sections.
- **Write (conversation finish):** `finishFriendChat` calls
  `extractFriendshipMemories` (LLM) → `MemoryService.storeFriendshipMemories`.
  The raw transcript is never stored — only concise facts.

All memory operations are best-effort: failures are logged and never break chat.

## Pinecone metadata

```jsonc
// character_biography
{ "type": "character_biography", "characterId": "...", "text": "...", "updatedAt": "..." }
// friendship_memory
{ "type": "friendship_memory", "friendshipId": "...", "characterId": "...",
  "userId": "...", "importance": 1, "createdAt": "...", "text": "..." }
```

## One-time setup

1. Create a Pinecone account and an API key.
2. Store the key in SSM as a SecureString (managed outside CDK):
   ```sh
   aws ssm put-parameter --type SecureString \
     --name /luva/<stage>/pinecone/apiKey --value <key>
   # prod uses /luva/pinecone/apiKey
   ```
3. `cd infra && cdk deploy` — creates `CharacterBiographiesTable`, wires the
   Pinecone env vars (`PINECONE_KEY_PARAM`, `PINECONE_INDEX_NAME`,
   `PINECONE_CLOUD`, `PINECONE_REGION`, `OPENAI_EMBED_MODEL`) and grants.
4. The index (`luva-memory`) auto-creates on first use, or provision it ahead of
   time:
   ```sh
   PINECONE_API_KEY=<key> node scripts/ensure-pinecone-index.js
   ```

## Relevant env vars

- `PINECONE_KEY_PARAM` — SSM path of the Pinecone API key (or `PINECONE_API_KEY` directly for local).
- `PINECONE_INDEX_NAME` (default `luva-memory`), `PINECONE_CLOUD` (`aws`), `PINECONE_REGION` (`us-east-1`).
- `OPENAI_EMBED_MODEL` (default `text-embedding-3-small`, 1536 dims).
- `OPENAI_KEY_PARAM` — reused for embeddings.
