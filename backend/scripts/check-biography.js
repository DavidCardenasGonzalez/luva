#!/usr/bin/env node
/**
 * Diagnostic: verify a character biography vector exists in Pinecone and is
 * retrievable by its deterministic id, using the SAME REST path the Lambda uses.
 *
 * Usage:
 *   PINECONE_API_KEY=... node scripts/check-biography.js "<characterId>"
 *
 * Example:
 *   PINECONE_API_KEY=pcsk_... node scripts/check-biography.js "initials:meet_mateo_first_mission"
 */
const API_VERSION = '2025-01';
const CONTROL_PLANE = 'https://api.pinecone.io';

async function pc(url, apiKey, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
      'X-Pinecone-Api-Version': API_VERSION,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${url} -> ${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

async function main() {
  const apiKey = process.env.PINECONE_API_KEY;
  const characterId = process.argv[2];
  if (!apiKey || !characterId) {
    console.error('Usage: PINECONE_API_KEY=... node scripts/check-biography.js "<characterId>"');
    process.exit(1);
  }
  const name = process.env.PINECONE_INDEX_NAME || 'luva-memory';
  const desc = await pc(`${CONTROL_PLANE}/indexes/${name}`, apiKey);
  const host = desc.host;
  console.log(`Index "${name}" host: ${host}`);

  const id = `character_biography#${characterId}`;
  console.log(`Fetching vector id: ${id}`);
  const fetched = await pc(`https://${host}/vectors/fetch?ids=${encodeURIComponent(id)}`, apiKey);
  const vec = fetched?.vectors?.[id];
  if (vec) {
    console.log('✅ FOUND biography vector. Metadata:');
    console.log(JSON.stringify(vec.metadata, null, 2));
  } else {
    console.log('❌ NOT FOUND under that id.');
  }

  // List all biography vectors so we can see what ids actually exist.
  console.log('\nQuerying all character_biography vectors (to see stored ids):');
  const q = await pc(`https://${host}/query`, apiKey, {
    method: 'POST',
    body: JSON.stringify({
      vector: new Array(1536).fill(0),
      topK: 50,
      includeMetadata: true,
      filter: { type: 'character_biography' },
    }),
  });
  const ids = (q.matches || []).map((m) => `${m.id}  (characterId=${m.metadata?.characterId})`);
  console.log(ids.length ? ids.join('\n') : '(none found)');
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
