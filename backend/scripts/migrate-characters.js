#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { CHARACTERS } = require('../dist/data/characters');
const { migrateCharacterSnapshot, validateCharacterSnapshot } = require('../dist/character-migration');

function argumentsFrom(argv) {
  const options = { mode: 'dry-run' };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (['--table', '--region', '--report', '--backup-arn', '--stage'].includes(token)) {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${token}`);
      options[token.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = value;
    } else if (['--dry-run', '--apply', '--verify', '--allow-production'].includes(token)) {
      if (token === '--allow-production') options.allowProduction = true;
      else options.mode = token.slice(2);
    } else throw new Error(`Unknown option ${token}`);
  }
  if (!options.table || !options.region || !['dev', 'prod'].includes(options.stage)) throw new Error('Usage: migrate-characters.js --table <name> --region <region> --stage dev|prod [--dry-run|--apply|--verify] [--report <path>] [--allow-production --backup-arn <arn>]');
  if (options.mode === 'apply' && options.stage === 'prod' && (!options.allowProduction || !options.backupArn)) {
    throw new Error('Production apply requires --allow-production and the ARN of a verified backup.');
  }
  if (options.mode === 'verify' && options.allowProduction) throw new Error('--allow-production is only valid with --apply.');
  if (options.allowProduction && (options.stage !== 'prod' || !options.backupArn)) throw new Error('--allow-production is only valid for prod and requires --backup-arn.');
  return options;
}

async function main() {
  const options = argumentsFrom(process.argv.slice(2));
  const validationErrors = validateCharacterSnapshot(CHARACTERS);
  if (validationErrors.length) throw new Error(`Invalid source: ${validationErrors.join('; ')}`);
  console.log(JSON.stringify({ mode: options.mode, stage: options.stage, table: options.table, region: options.region, sourceCount: CHARACTERS.length, backupArn: options.backupArn || undefined }));
  const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: options.region }), {
    marshallOptions: { removeUndefinedValues: true },
  });
  const counts = await migrateCharacterSnapshot(CHARACTERS, client, {
    tableName: options.table,
    apply: options.mode === 'apply',
  });
  const report = {
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    stage: options.stage,
    table: options.table,
    region: options.region,
    backupArn: options.backupArn,
    sourceCount: CHARACTERS.length,
    sourceIdsSha256: require('node:crypto').createHash('sha256')
      .update(CHARACTERS.map(character => character.characterId).join('\n')).digest('hex'),
    ...counts,
  };
  if (options.report) fs.writeFileSync(path.resolve(options.report), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify(report));
  if (counts.conflicts.length || counts.missing.length) process.exitCode = 2;
}

main().catch(error => {
  console.error(error.message || error);
  process.exitCode = 1;
});
