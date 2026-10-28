import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import type { CharacterDefinition } from './types';

export type CharacterRecord = CharacterDefinition & {
  schemaVersion: 1;
  version: number;
  catalogOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CharacterPresentation = {
  characterId: string;
  name: string;
  avatarUrl?: string;
  avatarXsUrl?: string;
  avatarMdUrl?: string;
};

const CHARACTER_FIELDS = [
  'characterId', 'storyIsInitial', 'characterTags', 'aiRole', 'caracterName',
  'caracterPrompt', 'characterBio', 'characterSheetImageUrl', 'avatarImageUrl',
  'avatarImageXsUrl', 'avatarImageMdUrl',
] as const;
const PRESENTATION_FIELDS = 'characterId, caracterName, avatarImageUrl, avatarImageXsUrl, avatarImageMdUrl';
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

export function getCharactersTableName(env: NodeJS.ProcessEnv = process.env): string {
  const name = env.CHARACTERS_TABLE_NAME?.trim();
  if (!name) throw new Error('CHARACTERS_TABLE_NAME not set');
  return name;
}

function cleanCharacterId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('INVALID_CHARACTER_ID');
  return value.trim();
}

function pickCharacterFields(input: CharacterDefinition): Partial<CharacterDefinition> {
  return Object.fromEntries(CHARACTER_FIELDS.flatMap(field => input[field] === undefined ? [] : [[field, input[field]]])) as Partial<CharacterDefinition>;
}

export function toCharacterPresentation(input: CharacterDefinition): CharacterPresentation {
  return {
    characterId: input.characterId,
    name: input.caracterName || 'Personaje',
    ...(input.avatarImageUrl ? { avatarUrl: input.avatarImageUrl } : {}),
    ...(input.avatarImageXsUrl ? { avatarXsUrl: input.avatarImageXsUrl } : {}),
    ...(input.avatarImageMdUrl ? { avatarMdUrl: input.avatarImageMdUrl } : {}),
  };
}

export function createCharactersRepository(tableName?: string, client = dynamo) {
  const getTableName = () => tableName || getCharactersTableName();
  return {
    async getCharacter(characterIdInput: string): Promise<CharacterRecord | undefined> {
      const characterId = cleanCharacterId(characterIdInput);
      const result = await client.send(new GetCommand({ TableName: getTableName(), Key: { characterId } }));
      return result.Item as CharacterRecord | undefined;
    },

    async listCharacters(): Promise<CharacterRecord[]> {
      const records: CharacterRecord[] = [];
      let ExclusiveStartKey: Record<string, unknown> | undefined;
      do {
        const page = await client.send(new ScanCommand({
          TableName: getTableName(),
          ...(ExclusiveStartKey ? { ExclusiveStartKey } : {}),
        }));
        records.push(...(page.Items as CharacterRecord[] | undefined || []));
        ExclusiveStartKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
      } while (ExclusiveStartKey);
      return records.sort((a, b) => a.catalogOrder - b.catalogOrder || a.characterId.localeCompare(b.characterId));
    },

    async getCharacterPresentations(ids: string[]): Promise<CharacterPresentation[]> {
      const orderedIds = [...new Set(ids.map(cleanCharacterId))];
      const records = new Map<string, CharacterRecord>();
      for (let start = 0; start < orderedIds.length; start += 100) {
        let pending = orderedIds.slice(start, start + 100);
        for (let attempt = 0; pending.length && attempt < 4; attempt += 1) {
          const result = await client.send(new BatchGetCommand({
            RequestItems: {
              [getTableName()]: {
                Keys: pending.map(characterId => ({ characterId })),
                ProjectionExpression: '#id, caracterName, avatarImageUrl, avatarImageXsUrl, avatarImageMdUrl',
                ExpressionAttributeNames: { '#id': 'characterId' },
              },
            },
          }));
          for (const item of result.Responses?.[getTableName()] || []) {
            records.set(item.characterId as string, item as CharacterRecord);
          }
          pending = (result.UnprocessedKeys?.[getTableName()]?.Keys || [])
            .map(key => key.characterId as string)
            .filter(Boolean);
          if (pending.length && attempt < 3) await new Promise(resolve => setTimeout(resolve, 25 * (2 ** attempt)));
        }
        if (pending.length) throw new Error('CHARACTER_BATCH_GET_INCOMPLETE');
      }
      const missing = orderedIds.filter(id => !records.has(id));
      if (missing.length) throw new Error(`CHARACTER_REFERENCE_MISSING:${missing.join(',')}`);
      return orderedIds.map(id => toCharacterPresentation(records.get(id)!));
    },

    async insertMigratedCharacter(input: CharacterDefinition, catalogOrder: number): Promise<void> {
      const characterId = cleanCharacterId(input.characterId);
      const now = new Date().toISOString();
      const Item = {
        ...Object.fromEntries(CHARACTER_FIELDS.flatMap(field => input[field] === undefined ? [] : [[field, input[field]]])),
        characterId,
        catalogOrder,
        schemaVersion: 1 as const,
        version: 1,
        createdAt: now,
        updatedAt: now,
      };
      await client.send(new PutCommand({
        TableName: getTableName(),
        Item,
        ConditionExpression: 'attribute_not_exists(characterId)',
      }));
    },

    async createCharacter(input: CharacterDefinition): Promise<CharacterRecord> {
      const characterId = cleanCharacterId(input.characterId);
      if (typeof input.aiRole !== 'string' || !input.aiRole.trim()) throw new Error('INVALID_CHARACTER_AI_ROLE');
      const existingCharacters = await this.listCharacters();
      const now = new Date().toISOString();
      const Item: CharacterRecord = {
        ...pickCharacterFields(input),
        aiRole: input.aiRole.trim(),
        characterId,
        schemaVersion: 1,
        version: 1,
        catalogOrder: existingCharacters.reduce((max, row) => Math.max(max, row.catalogOrder || 0), -1) + 1,
        createdAt: now,
        updatedAt: now,
      };
      await client.send(new PutCommand({
        TableName: getTableName(),
        Item,
        ConditionExpression: 'attribute_not_exists(characterId)',
      }));
      return Item;
    },

    async updateCharacter(
      characterIdInput: string,
      patchInput: Record<string, unknown>,
      expectedVersion: number,
    ): Promise<CharacterRecord> {
      const characterId = cleanCharacterId(characterIdInput);
      if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new Error('INVALID_CHARACTER_VERSION');
      const patch: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(patchInput)) {
        if (!(CHARACTER_FIELDS as readonly string[]).includes(key) || key === 'characterId') continue;
        if (key === 'aiRole' && (typeof value !== 'string' || !value.trim())) throw new Error('INVALID_CHARACTER_AI_ROLE');
        if (['caracterName', 'caracterPrompt', 'characterBio', 'characterSheetImageUrl', 'avatarImageUrl', 'avatarImageXsUrl', 'avatarImageMdUrl'].includes(key)
          && value !== undefined && typeof value !== 'string') throw new Error(`INVALID_CHARACTER_FIELD:${key}`);
        if (key === 'characterTags' && value !== undefined
          && (!Array.isArray(value) || value.some(tag => typeof tag !== 'string'))) throw new Error('INVALID_CHARACTER_FIELD:characterTags');
        if (key === 'storyIsInitial' && value !== undefined && typeof value !== 'boolean') throw new Error('INVALID_CHARACTER_FIELD:storyIsInitial');
        patch[key] = value;
      }
      if (!Object.keys(patch).length) throw new Error('EMPTY_CHARACTER_PATCH');
      const current = await client.send(new GetCommand({ TableName: getTableName(), Key: { characterId } }));
      if (!current.Item) throw new Error('CHARACTER_NOT_FOUND');
      const record = current.Item as CharacterRecord;
      if (record.version !== expectedVersion) throw new Error('CHARACTER_VERSION_CONFLICT');
      const Item = {
        ...record,
        ...patch,
        characterId,
        version: expectedVersion + 1,
        updatedAt: new Date().toISOString(),
      };
      try {
        await client.send(new PutCommand({
          TableName: getTableName(),
          Item,
          ConditionExpression: '#version = :expectedVersion',
          ExpressionAttributeNames: { '#version': 'version' },
          ExpressionAttributeValues: { ':expectedVersion': expectedVersion },
        }));
      } catch (error: any) {
        if (error?.name === 'ConditionalCheckFailedException') throw new Error('CHARACTER_VERSION_CONFLICT');
        throw error;
      }
      return Item;
    },
  };
}
