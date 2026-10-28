# Long-term memory (Pinecone)

First version of permanent, cross-session memory for Luva characters. All
Pinecone access is encapsulated behind `MemoryService` (`memory-service.ts`); the
chat flow and admin handlers never touch Pinecone or embeddings directly, so the
backend can be swapped (e.g. to LlamaIndex) without changing callers.

## Two memory sources

1. **Character biography** — edited in the admin portal (`/characters/:id` →
   "Biografía del personaje"). Source of truth is the `CharacterBiographiesTable`
   (DynamoDB). On save, GPT splits the biography into **atomic facts**, each
   embedded as its own Pinecone vector (id `character_biography#<characterId>#<i>`)
   so chat can semantically retrieve only the relevant facts instead of injecting
   the whole biography. Re-saving lists the existing chunks by id prefix and
   replaces them (also clears the legacy single-vector id).
2. **Friendship memory** — per `friendshipId` (`<userId>#<friendId>`). Concise
   semantic facts extracted from a finished conversation, embedded and stored.
   The retrieval filter is scoped by `friendshipId`, so two users talking to the
   same character never share memories.

## Flow

- **Query rewrite (every message):** a nano LLM rewrites the learner's latest
  message into an optimized search query using recent context (resolving
  references like "what does he think?"), run in parallel with the English
  evaluation to hide its latency. Falls back to the raw message on failure.
- **Read (every message):** `advanceFriendChat` uses that query to semantically
  retrieve the top-5 biography facts + top-5 friendship memories, and injects
  them into the system prompt as factual "Character Biography" / "Previous
  Memories" bullet lists.
- **Write (conversation finish):** `finishFriendChat` calls
  `extractFriendshipMemories` (LLM) → `MemoryService.storeFriendshipMemories`.
  The raw transcript is never stored — only concise facts.

All memory operations are best-effort: failures are logged and never break chat.

## Pinecone metadata

```jsonc
// character_biography (one vector per atomic fact)
{ "type": "character_biography", "characterId": "...", "text": "...",
  "chunkIndex": 0, "updatedAt": "..." }
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
