import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { CharacterDefinition } from './types';
import type { CharacterRecord } from './characters';

const SNAPSHOT_FIELDS = [
  'characterId', 'storyIsInitial', 'characterTags', 'aiRole', 'caracterName',
  'caracterPrompt', 'characterBio', 'characterSheetImageUrl', 'avatarImageUrl',
  'avatarImageXsUrl', 'avatarImageMdUrl',
] as const;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function validateCharacterSnapshot(characters: CharacterDefinition[]): string[] {
  const ids = new Set<string>();
  const errors: string[] = [];
  characters.forEach((character, index) => {
    if (!character.characterId?.trim()) errors.push(`row ${index}: missing characterId`);
    else if (ids.has(character.characterId)) errors.push(`row ${index}: duplicate characterId ${character.characterId}`);
    else ids.add(character.characterId);
    if (typeof character.aiRole !== 'string' || !character.aiRole.trim()) {
      errors.push(`row ${index}: missing aiRole for ${character.characterId || 'unknown'}`);
    }
  });
  return errors;
}

export function equalCharacterSnapshot(existing: Partial<CharacterDefinition>, source: CharacterDefinition): boolean {
  return SNAPSHOT_FIELDS.every(field => canonical(existing[field]) === canonical(source[field]));
}

export type CharacterMigrationCounts = {
  migrated: number;
  skipped: number;
  conflicts: string[];
  missing: string[];
};

export async function migrateCharacterSnapshot(
  characters: CharacterDefinition[],
  client: { send(command: unknown): Promise<any> },
  options: { tableName: string; apply: boolean },
): Promise<CharacterMigrationCounts> {
  const validation = validateCharacterSnapshot(characters);
  if (validation.length) throw new Error(`CHARACTER_SNAPSHOT_INVALID:${validation.join(';')}`);
  const result: CharacterMigrationCounts = { migrated: 0, skipped: 0, conflicts: [], missing: [] };
  for (const [catalogOrder, source] of characters.entries()) {
    const read = await client.send(new GetCommand({
      TableName: options.tableName,
      Key: { characterId: source.characterId },
      ConsistentRead: true,
    }));
    const existing = read.Item as CharacterRecord | undefined;
    if (existing) {
      if (equalCharacterSnapshot(existing, source)) result.skipped += 1;
      else result.conflicts.push(source.characterId);
      continue;
    }
    if (!options.apply) {
      result.missing.push(source.characterId);
      continue;
    }
    const now = new Date().toISOString();
    const item = {
      ...source,
      schemaVersion: 1,
      version: 1,
      catalogOrder,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await client.send(new PutCommand({
        TableName: options.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(characterId)',
      }));
      result.migrated += 1;
    } catch (error: any) {
      if (error?.name !== 'ConditionalCheckFailedException') throw error;
      const concurrent = await client.send(new GetCommand({
        TableName: options.tableName,
        Key: { characterId: source.characterId },
        ConsistentRead: true,
      }));
      if (concurrent.Item && equalCharacterSnapshot(concurrent.Item, source)) result.skipped += 1;
      else result.conflicts.push(source.characterId);
    }
  }
  return result;
}
