#!/usr/bin/env node
/**
 * Provisions the Pinecone serverless index used for long-term memory.
 *
 * The backend also auto-creates the index lazily on first use, but running this
 * once ahead of a deploy avoids paying the (slow) one-time creation latency on a
 * real user request.
 *
 * Usage:
 *   PINECONE_API_KEY=... node scripts/ensure-pinecone-index.js
 *
 * Optional env (defaults match infra/lib/luva-stack.ts):
 *   PINECONE_INDEX_NAME (default: luva-memory)
 *   PINECONE_CLOUD      (default: aws)
 *   PINECONE_REGION     (default: us-east-1)
 */
const { Pinecone } = require('@pinecone-database/pinecone');

const DIMENSION = 1536; // text-embedding-3-small

async function main() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    console.error('PINECONE_API_KEY is required');
    process.exit(1);
  }
  const name = process.env.PINECONE_INDEX_NAME || 'luva-memory';
  const cloud = process.env.PINECONE_CLOUD || 'aws';
  const region = process.env.PINECONE_REGION || 'us-east-1';

  const pc = new Pinecone({ apiKey });
  console.log(`Ensuring Pinecone index "${name}" (${cloud}/${region}, dim ${DIMENSION})...`);
  await pc.createIndex({
    name,
    dimension: DIMENSION,
    metric: 'cosine',
    spec: { serverless: { cloud, region } },
    waitUntilReady: true,
    suppressConflicts: true,
  });
  const description = await pc.describeIndex(name);
  console.log('Index ready:', JSON.stringify(description, null, 2));
}

main().catch((err) => {
  console.error('Failed to ensure Pinecone index:', err);
  process.exit(1);
});
