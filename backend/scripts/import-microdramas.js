#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { createCharactersRepository } = require('../dist/characters');
const { validateMicrodramaManifest, toMicrodramaDynamoItems } = require('../dist/microdramas-data');

function args(argv) {
  const out = { mode: 'dry-run' };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (['--manifest', '--table', '--characters-table', '--region', '--stage', '--report'].includes(key)) {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
      out[key.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
    } else if (['--dry-run', '--apply', '--verify'].includes(key)) out.mode = key.slice(2);
    else throw new Error(`Unknown option: ${key}`);
  }
  for (const field of ['manifest', 'table', 'charactersTable', 'region', 'stage']) if (!out[field]) throw new Error(`Missing --${field.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`);
  if (!['dev', 'prod'].includes(out.stage)) throw new Error('Stage must be dev or prod');
  if (out.stage === 'prod' && out.mode === 'apply') throw new Error('Production content upload requires an approved release and is disabled in this script.');
  return out;
}

function comparable(item) {
  const { createdAt, updatedAt, ...stable } = item;
  return JSON.stringify(Object.fromEntries(Object.entries(stable).sort(([a],[b]) => a.localeCompare(b))));
}

async function main() {
  const options = args(process.argv.slice(2));
  const manifestPath = path.resolve(options.manifest);
  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestText);
  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: options.region }), {
    marshallOptions: { removeUndefinedValues: true },
  });
  const characters = await createCharactersRepository(options.charactersTable, ddb).listCharacters();
  const errors = validateMicrodramaManifest(manifest, characters);
  if (errors.length) throw new Error(`Invalid manifest: ${errors.join('; ')}`);
  const items = toMicrodramaDynamoItems(manifest).map(item => ({ ...item, stage: options.stage }));
  const existing = [];
  const missing = [];
  for (const item of items) {
    const response = await ddb.send(new GetCommand({
      TableName: options.table,
      Key: { pk: item.pk, sk: item.sk },
      ConsistentRead: true,
    }));
    if (response.Item) {
      if (comparable(response.Item) === comparable(item)) existing.push(item.sk);
      else throw new Error(`MICRODRAMA_CONTENT_CONFLICT:${item.sk}`);
    } else missing.push(item);
  }
  if (options.mode === 'apply' && missing.length) {
    await ddb.send(new TransactWriteCommand({
      TransactItems: missing.map(Item => ({ Put: {
        TableName: options.table,
        Item,
        ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
      } })),
    }));
  }
  const report = {
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    stage: options.stage,
    table: options.table,
    region: options.region,
    seriesId: manifest.series.seriesId,
    manifestSha256: createHash('sha256').update(manifestText).digest('hex'),
    inserted: options.mode === 'apply' ? missing.length : 0,
    alreadyPresent: existing.length,
    wouldInsert: options.mode === 'dry-run' ? missing.length : 0,
  };
  if (options.report) fs.writeFileSync(path.resolve(options.report), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify(report));
}

main().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});
