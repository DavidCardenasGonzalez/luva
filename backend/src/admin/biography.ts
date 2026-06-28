import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { getMemoryService } from '../memory/memory-service';

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

  console.log(JSON.stringify({ scope: 'admin.character.biography.dynamo_ok', characterId }));

  const memory = getMemoryService();
  try {
    if (biography) {
      await memory.upsertCharacterBiography(characterId, biography);
    } else {
      await memory.deleteCharacterBiography(characterId);
    }
    console.log(JSON.stringify({ scope: 'admin.character.biography.pinecone_ok', characterId }));
  } catch (pineconeErr: any) {
    console.error(JSON.stringify({
      scope: 'admin.character.biography.pinecone_error',
      characterId,
      message: pineconeErr?.message,
      name: pineconeErr?.name,
      stack: pineconeErr?.stack?.split('\n').slice(0, 5),
    }));
    throw pineconeErr;
  }

  return { characterId, biography, updatedAt };
}
