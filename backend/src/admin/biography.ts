import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { getMemoryService } from '../memory/memory-service';
import { splitBiographyIntoFacts } from './biography-split';

// Source of truth for the admin-managed long-term biography. The text lives in
// DynamoDB (so the editor can load + re-embed it); the embedding itself lives in
// Pinecone behind MemoryService. This is distinct from the short `characterBio`
// tagline defined in characters.ts.
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const MAX_BIOGRAPHY_CHARS = 6000;

export interface CharacterBiographyRecord {
  characterId: string;
  biography: string;
  updatedAt?: string;
}

function getBiographiesTableName(): string {
  const name = process.env.CHARACTER_BIOGRAPHIES_TABLE_NAME;
  if (!name) throw new Error('CHARACTER_BIOGRAPHIES_TABLE_NAME not set');
  return name;
}

export async function getCharacterBiographyRecord(
  characterId: string,
): Promise<CharacterBiographyRecord> {
  const res = await dynamo.send(
    new GetCommand({
      TableName: getBiographiesTableName(),
      Key: { characterId },
    }),
  );
  const item = res.Item as CharacterBiographyRecord | undefined;
  return {
    characterId,
    biography: typeof item?.biography === 'string' ? item.biography : '',
    ...(item?.updatedAt ? { updatedAt: item.updatedAt } : {}),
  };
}

// Persists the biography (DynamoDB source of truth) and replaces the single
// biography embedding in Pinecone. If the biography is cleared, the embedding is
// removed too.
export async function saveCharacterBiography(
  characterId: string,
  biographyInput: unknown,
): Promise<CharacterBiographyRecord> {
  const biography =
    typeof biographyInput === 'string' ? biographyInput.trim().slice(0, MAX_BIOGRAPHY_CHARS) : '';
  const updatedAt = new Date().toISOString();

  await dynamo.send(
    new PutCommand({
      TableName: getBiographiesTableName(),
      Item: { characterId, biography, updatedAt },
    }),
  );

  const memory = getMemoryService();
  if (biography) {
    // Split into atomic facts (GPT), then store each as its own vector so chat
    // can semantically retrieve only the relevant parts of the biography.
    const facts = await splitBiographyIntoFacts(biography);
    await memory.replaceCharacterBiographyChunks(characterId, facts);
    console.log(
      JSON.stringify({ scope: 'admin.character.biography.saved', characterId, factCount: facts.length }),
    );
  } else {
    await memory.deleteCharacterBiography(characterId);
    console.log(JSON.stringify({ scope: 'admin.character.biography.cleared', characterId }));
  }

  return { characterId, biography, updatedAt };
}
