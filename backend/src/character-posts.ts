import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type { StoryDefinition, StoryMission } from './types';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const s3 = new S3Client({});
const ssm = new SSMClient({});

const MIN_TIMESTAMP = '1970-01-01T00:00:00.000Z';
let OPENAI_KEY_CACHE: string | undefined;

export type StoryCharacterSummary = {
  characterId: string;
  storyId: string;
  missionId: string;
  sceneIndex: number;
  storyTitle: string;
  missionTitle: string;
  characterName: string;
  avatarImageUrl?: string;
  avatarImageXsUrl?: string;
  avatarImageMdUrl?: string;
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
  context?: unknown;
  imageUrl?: unknown;
  imageURL?: unknown;
  thumbnailUrl?: unknown;
  thumbnailURL?: unknown;
  videoUrl?: unknown;
  videoURL?: unknown;
  subtitlesUrl?: unknown;
  subtitlesURL?: unknown;
  subtitlesKey?: unknown;
  order?: unknown;
  likeCount?: unknown;
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
  context?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  subtitlesUrl?: string;
  subtitlesKey?: string;
  order: number;
  likeCount: number;
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

export type CharacterPostLikeResponse = {
  characterId: string;
  postId: string;
  likeCount: number;
};

type CharacterPostRecord = CharacterPost;

type CharacterPostWriteInput = {
  postId?: unknown;
  caption?: unknown;
  text?: unknown;
  context?: unknown;
  imageUrl?: unknown;
  imageURL?: unknown;
  thumbnailUrl?: unknown;
  thumbnailURL?: unknown;
  videoUrl?: unknown;
  videoURL?: unknown;
  subtitlesUrl?: unknown;
  subtitlesURL?: unknown;
  subtitlesKey?: unknown;
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

export async function listPublicCharacterVideoPosts(limitInput = 80): Promise<CharacterPost[]> {
  const parsedLimit = Math.floor(Number(limitInput));
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(parsedLimit, 200)) : 80;

  try {
    const records = await scanAllCharacterPostRecords();
    return records
      .map((record) => toCharacterPost(record))
      .filter((post): post is CharacterPost => !!post?.videoUrl?.trim())
      .map((post) => ({ post, rank: Math.random() }))
      .sort((left, right) => left.rank - right.rank || compareCharacterPosts(left.post, right.post))
      .map(({ post }) => post)
      .slice(0, limit);
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
  const record = await ensureCharacterPostSubtitles(buildCharacterPostRecord(character, input, {
    postId: randomUUID(),
    defaultOrder: nextOrder,
    now: new Date().toISOString(),
  }));

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

  const record = await ensureCharacterPostSubtitles(buildCharacterPostRecord(character, input, {
    existing: existingPost,
    now: new Date().toISOString(),
  }), existingPost);

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

export async function incrementCharacterPostLike(
  characterIdInput: unknown,
  postIdInput: unknown,
): Promise<CharacterPostLikeResponse> {
  const characterId = normalizeCharacterId(characterIdInput);
  const postId = normalizePostId(postIdInput);
  if (!characterId) {
    throw new Error('INVALID_CHARACTER_ID');
  }
  if (!postId) {
    throw new Error('INVALID_CHARACTER_POST_ID');
  }

  const result = await dynamo.send(
    new UpdateCommand({
      TableName: getCharacterPostsTableName(),
      Key: { characterId, postId },
      UpdateExpression: 'SET likeCount = if_not_exists(likeCount, :zero) + :one',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1,
      },
      ConditionExpression: 'attribute_exists(characterId) AND attribute_exists(postId)',
      ReturnValues: 'ALL_NEW',
    }),
  );

  const likeCount = normalizeLikeCount(result.Attributes?.likeCount) ?? 0;
  return { characterId, postId, likeCount };
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
  const hasContextInput = Object.prototype.hasOwnProperty.call(input, 'context');
  const context = hasContextInput ? normalizeContext(input.context) : options?.existing?.context;

  const videoUrl = normalizeOptionalUrl(input.videoUrl ?? input.videoURL, 'INVALID_CHARACTER_POST_VIDEO_URL');
  const thumbnailUrl = normalizeOptionalUrl(
    input.thumbnailUrl ?? input.thumbnailURL,
    'INVALID_CHARACTER_POST_THUMBNAIL_URL',
  );
  const imageUrl = normalizeOptionalUrl(
    input.imageUrl ?? input.imageURL ?? thumbnailUrl,
    'INVALID_CHARACTER_POST_IMAGE_URL',
  );
  if (!imageUrl) {
    throw new Error('INVALID_CHARACTER_POST_IMAGE_URL');
  }
  const shouldKeepExistingSubtitles = !!options?.existing?.videoUrl && videoUrl === options.existing.videoUrl;
  const subtitlesUrl =
    normalizeOptionalUrl(input.subtitlesUrl ?? input.subtitlesURL, 'INVALID_CHARACTER_POST_SUBTITLES_URL') ||
    (shouldKeepExistingSubtitles ? options?.existing?.subtitlesUrl : undefined);
  const subtitlesKey =
    normalizeSubtitleKey(input.subtitlesKey) ||
    (shouldKeepExistingSubtitles ? options?.existing?.subtitlesKey : undefined);

  const order =
    normalizeOrder(input.order) ||
    options?.existing?.order ||
    normalizeOrder(options?.defaultOrder);
  if (!order) {
    throw new Error('INVALID_CHARACTER_POST_ORDER');
  }

  const now = asTimestamp(options?.now) || new Date().toISOString();
  const createdAt = options?.existing?.createdAt || now;
  const likeCount = normalizeLikeCount(options?.existing?.likeCount) ?? 0;

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
    ...(context ? { context } : {}),
    imageUrl,
    ...(thumbnailUrl || videoUrl ? { thumbnailUrl: thumbnailUrl || imageUrl } : {}),
    ...(videoUrl ? { videoUrl } : {}),
    ...(subtitlesUrl ? { subtitlesUrl } : {}),
    ...(subtitlesKey ? { subtitlesKey } : {}),
    order,
    likeCount,
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
  const context = normalizeContext(raw?.context);
  const videoUrl = normalizeStoredOptionalUrl(raw?.videoUrl ?? raw?.videoURL);
  const thumbnailUrl = normalizeStoredOptionalUrl(raw?.thumbnailUrl ?? raw?.thumbnailURL);
  const subtitlesUrl = normalizeStoredOptionalUrl(raw?.subtitlesUrl ?? raw?.subtitlesURL);
  const subtitlesKey = normalizeSubtitleKey(raw?.subtitlesKey);
  const imageUrl = normalizeStoredOptionalUrl(raw?.imageUrl ?? raw?.imageURL ?? thumbnailUrl);
  const order = normalizeOrder(raw?.order);
  const likeCount = normalizeLikeCount(raw?.likeCount) ?? 0;

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
    ...(context ? { context } : {}),
    imageUrl,
    ...(thumbnailUrl || videoUrl ? { thumbnailUrl: thumbnailUrl || imageUrl } : {}),
    ...(videoUrl ? { videoUrl } : {}),
    ...(subtitlesUrl ? { subtitlesUrl } : {}),
    ...(subtitlesKey ? { subtitlesKey } : {}),
    order,
    likeCount,
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
    ...(mission.avatarImageXsUrl ? { avatarImageXsUrl: mission.avatarImageXsUrl } : {}),
    ...(mission.avatarImageMdUrl ? { avatarImageMdUrl: mission.avatarImageMdUrl } : {}),
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

async function scanAllCharacterPostRecords(): Promise<unknown[]> {
  const items: unknown[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: getCharacterPostsTableName(),
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

async function ensureCharacterPostSubtitles(
  record: CharacterPostRecord,
  existing?: CharacterPost,
): Promise<CharacterPostRecord> {
  if (!record.videoUrl || record.subtitlesUrl) {
    return record;
  }

  if (existing?.videoUrl === record.videoUrl && existing.subtitlesUrl) {
    return {
      ...record,
      subtitlesUrl: existing.subtitlesUrl,
      ...(existing.subtitlesKey ? { subtitlesKey: existing.subtitlesKey } : {}),
    };
  }

  const srt = await transcribeCharacterPostVideo(record.videoUrl, buildCharacterPostVideoFilename(record));
  const trimmedSrt = srt.trim();
  if (!trimmedSrt) {
    throw new Error('OPENAI_TRANSCRIBE_EMPTY_RESPONSE');
  }

  const subtitlesKey = buildCharacterPostSubtitlesKey(record);
  await s3.send(
    new PutObjectCommand({
      Bucket: getAssetsBucketName(),
      Key: subtitlesKey,
      Body: `${trimmedSrt}\n`,
      ContentType: 'application/x-subrip; charset=utf-8',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return {
    ...record,
    subtitlesKey,
    subtitlesUrl: buildAssetUrl(subtitlesKey),
  };
}

async function transcribeCharacterPostVideo(videoUrl: string, filename: string): Promise<string> {
  const key = await getOpenAiKey();
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) {
    throw new Error(`CHARACTER_POST_VIDEO_FETCH_HTTP_${videoResponse.status}`);
  }

  const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
  const video = Buffer.from(await videoResponse.arrayBuffer());
  const form = new FormData();
  form.append('file', new Blob([video], { type: contentType }) as any, filename);
  form.append('model', 'whisper-1');
  form.append('response_format', 'srt');

  const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
    },
    body: form as any,
  });

  if (!transcriptionResponse.ok) {
    const detail = await transcriptionResponse.text().catch(() => '');
    console.warn('[CharacterPosts] Whisper failed', transcriptionResponse.status, detail.slice(0, 500));
    throw new Error(`OPENAI_TRANSCRIBE_HTTP_${transcriptionResponse.status}`);
  }

  return transcriptionResponse.text();
}

async function getOpenAiKey(): Promise<string> {
  if (OPENAI_KEY_CACHE) {
    return OPENAI_KEY_CACHE;
  }

  const direct = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (direct?.trim()) {
    OPENAI_KEY_CACHE = direct.trim();
    return OPENAI_KEY_CACHE;
  }

  const param = process.env.OPENAI_KEY_PARAM;
  if (!param) {
    throw new Error('OPENAI_KEY_PARAM not set');
  }

  const response = await ssm.send(new GetParameterCommand({ Name: param, WithDecryption: true }));
  const value = response.Parameter?.Value?.trim();
  if (!value) {
    throw new Error('OPENAI_KEY_PARAM empty');
  }

  OPENAI_KEY_CACHE = value;
  return value;
}

function getAssetsBucketName(): string {
  const name = process.env.ASSETS_BUCKET_NAME?.trim();
  if (!name) {
    throw new Error('ASSETS_BUCKET_NAME not set');
  }

  return name;
}

function getAssetsBaseUrl(): string {
  const url =
    process.env.ASSETS_CLOUDFRONT_URL?.trim() ||
    process.env.ASSETS_CLOUDFRONT_DOMAIN_NAME?.trim();
  if (!url) {
    throw new Error('ASSETS_CLOUDFRONT_DOMAIN_NAME not set');
  }

  return url.startsWith('http') ? url.replace(/\/$/, '') : `https://${url.replace(/\/$/, '')}`;
}

function buildAssetUrl(key: string): string {
  return `${getAssetsBaseUrl()}/${key}`;
}

function buildCharacterPostSubtitlesKey(record: CharacterPostRecord): string {
  return [
    'character-posts',
    sanitizeAssetPathSegment(record.characterId),
    sanitizeAssetPathSegment(record.postId),
    'subtitles.srt',
  ].join('/');
}

function buildCharacterPostVideoFilename(record: CharacterPostRecord): string {
  const extension = getUrlPathExtension(record.videoUrl || '') || 'mp4';
  return `${sanitizeAssetPathSegment(record.postId)}.${extension}`;
}

function getUrlPathExtension(url: string): string | undefined {
  try {
    const extension = new URL(url).pathname.split('.').pop()?.toLowerCase();
    if (!extension || !/^[a-z0-9]{2,8}$/.test(extension)) {
      return undefined;
    }
    return extension;
  } catch {
    return undefined;
  }
}

function sanitizeAssetPathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'post';
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

function normalizeContext(value: unknown): string | undefined {
  const normalized = asString(value)?.trim().replace(/\s+\n/g, '\n');
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 3000);
}

function normalizeSubtitleKey(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized || normalized.includes('..') || normalized.startsWith('/')) {
    return undefined;
  }

  return normalized.slice(0, 1024);
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

function normalizeLikeCount(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const count = Math.floor(parsed);
  return count >= 0 ? count : 0;
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

function normalizeOptionalUrl(
  value: unknown,
  errorCode: string = 'INVALID_CHARACTER_POST_IMAGE_URL',
): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error(errorCode);
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
