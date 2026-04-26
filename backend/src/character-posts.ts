import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import type { StoryDefinition, StoryMission } from './types';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const MIN_TIMESTAMP = '1970-01-01T00:00:00.000Z';

export type StoryCharacterSummary = {
  characterId: string;
  storyId: string;
  missionId: string;
  sceneIndex: number;
  storyTitle: string;
  missionTitle: string;
  characterName: string;
  avatarImageUrl?: string;
  sceneSummary?: string;
};

export type StoryCharactersResponse = {
  characters: StoryCharacterSummary[];
  generatedAt: string;
};

export type StoredCharacterPostRecord = {
  characterId?: unknown;
  postId?: unknown;
  storyId?: unknown;
  missionId?: unknown;
  sceneIndex?: unknown;
  storyTitle?: unknown;
  missionTitle?: unknown;
  characterName?: unknown;
  avatarImageUrl?: unknown;
  caption?: unknown;
  imageUrl?: unknown;
  imageURL?: unknown;
  order?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type CharacterPost = {
  characterId: string;
  postId: string;
  storyId: string;
  missionId: string;
  sceneIndex: number;
  storyTitle: string;
  missionTitle: string;
  characterName: string;
  caption: string;
  imageUrl: string;
  order: number;
  avatarImageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type CharacterPostsResponse = {
  character: StoryCharacterSummary;
  posts: CharacterPost[];
  generatedAt: string;
};

export type CharacterPostMutationResponse = {
  post: CharacterPost;
  updatedAt: string;
};

export type CharacterPostDeleteResponse = {
  characterId: string;
  postId: string;
  deletedAt: string;
};

type CharacterPostRecord = CharacterPost;

type CharacterPostWriteInput = {
  postId?: unknown;
  caption?: unknown;
  text?: unknown;
  imageUrl?: unknown;
  imageURL?: unknown;
  order?: unknown;
};

export function buildCharacterId(storyId: string, missionId: string): string {
  return `${storyId}:${missionId}`;
}

export function listStoryCharacters(stories: StoryDefinition[]): StoryCharactersResponse {
  return {
    characters: flattenStoryCharacters(stories),
    generatedAt: new Date().toISOString(),
  };
}

export function findStoryCharacter(
  stories: StoryDefinition[],
  characterId: string,
): StoryCharacterSummary | undefined {
  const normalizedCharacterId = normalizeCharacterId(characterId);
  if (!normalizedCharacterId) {
    return undefined;
  }

  return flattenStoryCharacters(stories).find(
    (character) => character.characterId === normalizedCharacterId,
  );
}

export async function listCharacterPosts(
  character: StoryCharacterSummary,
): Promise<CharacterPostsResponse> {
  const records = await queryAllCharacterPostRecords(character.characterId);
  return buildCharacterPostsResponse(character, records);
}

export async function listPublicCharacterPosts(characterId: string): Promise<CharacterPost[]> {
  try {
    const records = await queryAllCharacterPostRecords(characterId);
    return records
      .map((record) => toCharacterPost(record))
      .filter((post): post is CharacterPost => !!post)
      .sort(compareCharacterPosts);
  } catch (error) {
    if (error instanceof Error && error.message === 'CHARACTER_POSTS_TABLE_NAME not set') {
      return [];
    }

    throw error;
  }
}

export function buildCharacterPostsResponse(
  character: StoryCharacterSummary,
  items: unknown[],
): CharacterPostsResponse {
  const posts = items
    .map((item) => toCharacterPost(item))
    .filter((post): post is CharacterPost => !!post)
    .sort(compareCharacterPosts);

  return {
    character,
    posts,
    generatedAt: new Date().toISOString(),
  };
}

export async function createAdminCharacterPost(
  character: StoryCharacterSummary,
  input: CharacterPostWriteInput,
): Promise<CharacterPostMutationResponse> {
  const existingPosts = await listPublicCharacterPosts(character.characterId);
  const nextOrder = existingPosts.reduce((max, post) => Math.max(max, post.order), 0) + 1;
  const record = buildCharacterPostRecord(character, input, {
    postId: randomUUID(),
    defaultOrder: nextOrder,
    now: new Date().toISOString(),
  });

  await dynamo.send(
    new PutCommand({
      TableName: getCharacterPostsTableName(),
      Item: record,
      ConditionExpression: 'attribute_not_exists(characterId) AND attribute_not_exists(postId)',
    }),
  );

  return {
    post: record,
    updatedAt: record.updatedAt,
  };
}

export async function updateAdminCharacterPost(
  character: StoryCharacterSummary,
  input: CharacterPostWriteInput,
): Promise<CharacterPostMutationResponse> {
  const postId = normalizePostId(input.postId);
  if (!postId) {
    throw new Error('INVALID_CHARACTER_POST_ID');
  }

  const existingRecord = await getStoredCharacterPost(character.characterId, postId);
  const existingPost = toCharacterPost(existingRecord);
  if (!existingPost) {
    throw new Error('CHARACTER_POST_NOT_FOUND');
  }

  const record = buildCharacterPostRecord(character, input, {
    existing: existingPost,
    now: new Date().toISOString(),
  });

  await dynamo.send(
    new PutCommand({
      TableName: getCharacterPostsTableName(),
      Item: record,
      ConditionExpression: 'attribute_exists(characterId) AND attribute_exists(postId)',
    }),
  );

  return {
    post: record,
    updatedAt: record.updatedAt,
  };
}

export async function deleteAdminCharacterPost(
  characterIdInput: unknown,
  input: { postId?: unknown },
): Promise<CharacterPostDeleteResponse> {
  const characterId = normalizeCharacterId(characterIdInput);
  const postId = normalizePostId(input.postId);
  if (!characterId) {
    throw new Error('INVALID_CHARACTER_ID');
  }
  if (!postId) {
    throw new Error('INVALID_CHARACTER_POST_ID');
  }

  const existingRecord = await getStoredCharacterPost(characterId, postId);
  if (!toCharacterPost(existingRecord)) {
    throw new Error('CHARACTER_POST_NOT_FOUND');
  }

  await dynamo.send(
    new DeleteCommand({
      TableName: getCharacterPostsTableName(),
      Key: { characterId, postId },
      ConditionExpression: 'attribute_exists(characterId) AND attribute_exists(postId)',
    }),
  );

  return {
    characterId,
    postId,
    deletedAt: new Date().toISOString(),
  };
}

export function buildCharacterPostRecord(
  character: StoryCharacterSummary,
  input: CharacterPostWriteInput,
  options?: {
    existing?: CharacterPost;
    postId?: string;
    defaultOrder?: number;
    now?: string;
  },
): CharacterPostRecord {
  const characterId = normalizeCharacterId(character.characterId);
  if (!characterId) {
    throw new Error('INVALID_CHARACTER_ID');
  }

  const postId =
    options?.existing?.postId ||
    normalizePostId(input.postId) ||
    normalizePostId(options?.postId);
  if (!postId) {
    throw new Error('INVALID_CHARACTER_POST_ID');
  }

  const caption = normalizeCaption(input.caption ?? input.text);
  if (!caption) {
    throw new Error('INVALID_CHARACTER_POST_CAPTION');
  }

  const imageUrl = normalizeOptionalUrl(input.imageUrl ?? input.imageURL);
  if (!imageUrl) {
    throw new Error('INVALID_CHARACTER_POST_IMAGE_URL');
  }

  const order =
    normalizeOrder(input.order) ||
    options?.existing?.order ||
    normalizeOrder(options?.defaultOrder);
  if (!order) {
    throw new Error('INVALID_CHARACTER_POST_ORDER');
  }

  const now = asTimestamp(options?.now) || new Date().toISOString();
  const createdAt = options?.existing?.createdAt || now;

  return {
    characterId,
    postId,
    storyId: character.storyId,
    missionId: character.missionId,
    sceneIndex: character.sceneIndex,
    storyTitle: character.storyTitle,
    missionTitle: character.missionTitle,
    characterName: character.characterName,
    ...(character.avatarImageUrl ? { avatarImageUrl: character.avatarImageUrl } : {}),
    caption,
    imageUrl,
    order,
    createdAt,
    updatedAt: now,
  };
}

export function toCharacterPost(input: unknown): CharacterPost | undefined {
  const raw = asRecord(input) as StoredCharacterPostRecord | undefined;
  const characterId = normalizeCharacterId(raw?.characterId);
  const postId = normalizePostId(raw?.postId);
  const storyId = normalizeTargetId(raw?.storyId);
  const missionId = normalizeTargetId(raw?.missionId);
  const sceneIndex = normalizeSceneIndex(raw?.sceneIndex);
  const storyTitle = normalizeLabel(raw?.storyTitle);
  const missionTitle = normalizeLabel(raw?.missionTitle);
  const characterName = normalizeLabel(raw?.characterName);
  const caption = normalizeCaption(raw?.caption);
  const imageUrl = normalizeStoredOptionalUrl(raw?.imageUrl ?? raw?.imageURL);
  const order = normalizeOrder(raw?.order);

  if (
    !characterId ||
    !postId ||
    !storyId ||
    !missionId ||
    sceneIndex === undefined ||
    !storyTitle ||
    !missionTitle ||
    !characterName ||
    !caption ||
    !imageUrl ||
    !order
  ) {
    return undefined;
  }

  const createdAt = asTimestamp(raw?.createdAt) || MIN_TIMESTAMP;
  const updatedAt = asTimestamp(raw?.updatedAt) || createdAt;
  const avatarImageUrl = normalizeStoredOptionalUrl(raw?.avatarImageUrl);

  return {
    characterId,
    postId,
    storyId,
    missionId,
    sceneIndex,
    storyTitle,
    missionTitle,
    characterName,
    ...(avatarImageUrl ? { avatarImageUrl } : {}),
    caption,
    imageUrl,
    order,
    createdAt,
    updatedAt,
  };
}

function flattenStoryCharacters(stories: StoryDefinition[]): StoryCharacterSummary[] {
  return (stories || []).flatMap((story) =>
    (story.missions || []).map((mission, sceneIndex) =>
      buildStoryCharacterSummary(story, mission, sceneIndex),
    ),
  );
}

function buildStoryCharacterSummary(
  story: StoryDefinition,
  mission: StoryMission,
  sceneIndex: number,
): StoryCharacterSummary {
  const characterName = mission.caracterName || mission.title || 'Personaje';
  return {
    characterId: buildCharacterId(story.storyId, mission.missionId),
    storyId: story.storyId,
    missionId: mission.missionId,
    sceneIndex,
    storyTitle: story.title,
    missionTitle: mission.title,
    characterName,
    ...(mission.avatarImageUrl ? { avatarImageUrl: mission.avatarImageUrl } : {}),
    ...(mission.sceneSummary ? { sceneSummary: mission.sceneSummary } : {}),
  };
}

async function getStoredCharacterPost(
  characterId: string,
  postId: string,
): Promise<unknown | undefined> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: getCharacterPostsTableName(),
      Key: { characterId, postId },
    }),
  );

  return result.Item;
}

async function queryAllCharacterPostRecords(characterIdInput: string): Promise<unknown[]> {
  const characterId = normalizeCharacterId(characterIdInput);
  if (!characterId) {
    throw new Error('INVALID_CHARACTER_ID');
  }

  const items: unknown[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new QueryCommand({
        TableName: getCharacterPostsTableName(),
        KeyConditionExpression: '#characterId = :characterId',
        ExpressionAttributeNames: {
          '#characterId': 'characterId',
        },
        ExpressionAttributeValues: {
          ':characterId': characterId,
        },
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    items.push(...(page.Items || []));
    exclusiveStartKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);

  return items;
}

function compareCharacterPosts(left: CharacterPost, right: CharacterPost): number {
  return (
    left.order - right.order ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.postId.localeCompare(right.postId)
  );
}

function normalizeCharacterId(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 220);
}

function normalizePostId(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 120);
}

function normalizeTargetId(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 180);
}

function normalizeLabel(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 240);
}

function normalizeCaption(value: unknown): string | undefined {
  const normalized = asString(value)?.trim().replace(/\s+\n/g, '\n');
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 2200);
}

function normalizeOrder(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const order = Math.floor(parsed);
  return order >= 1 && order <= 999999 ? order : undefined;
}

function normalizeSceneIndex(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.max(0, Math.floor(parsed));
}

function normalizeOptionalUrl(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error('INVALID_CHARACTER_POST_IMAGE_URL');
  }

  return normalized.slice(0, 2048);
}

function normalizeStoredOptionalUrl(value: unknown): string | undefined {
  try {
    return normalizeOptionalUrl(value);
  } catch {
    return undefined;
  }
}

function asTimestamp(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function getCharacterPostsTableName(): string {
  const tableName = process.env.CHARACTER_POSTS_TABLE_NAME?.trim();
  if (!tableName) {
    throw new Error('CHARACTER_POSTS_TABLE_NAME not set');
  }

  return tableName;
}
