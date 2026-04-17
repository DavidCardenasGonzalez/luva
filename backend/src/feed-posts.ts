import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const DEFAULT_FEED_PK = 'FEED#DEFAULT';
const DEFAULT_ORDER_INDEX_NAME = 'FeedPostsByOrderIndex';
const MIN_TIMESTAMP = '1970-01-01T00:00:00.000Z';

export const FEED_POST_TYPES = [
  'normal',
  'practice_guide',
  'mission_guide',
  'extra',
] as const;

export type FeedPostType = (typeof FEED_POST_TYPES)[number];

export type StoredFeedPostRecord = {
  postId?: unknown;
  feedPk?: unknown;
  text?: unknown;
  imageUrl?: unknown;
  videoUrl?: unknown;
  order?: unknown;
  postType?: unknown;
  type?: unknown;
  practiceId?: unknown;
  missionId?: unknown;
  coinAmount?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type FeedPost = {
  postId: string;
  text: string;
  order: number;
  postType: FeedPostType;
  imageUrl?: string;
  videoUrl?: string;
  practiceId?: string;
  missionId?: string;
  coinAmount?: number;
  createdAt: string;
  updatedAt: string;
};

export type FeedPostsResponse = {
  posts: FeedPost[];
  generatedAt: string;
};

export type FeedPostMutationResponse = {
  post: FeedPost;
  updatedAt: string;
};

export type FeedPostDeleteResponse = {
  postId: string;
  deletedAt: string;
};

type FeedPostRecord = FeedPost & {
  feedPk: string;
};

type FeedPostWriteInput = {
  postId?: unknown;
  text?: unknown;
  imageUrl?: unknown;
  imageURL?: unknown;
  imagenURL?: unknown;
  videoUrl?: unknown;
  videoURL?: unknown;
  order?: unknown;
  postType?: unknown;
  type?: unknown;
  practiceId?: unknown;
  practice_id?: unknown;
  missionId?: unknown;
  mission_id?: unknown;
  coinAmount?: unknown;
  coins?: unknown;
  monedas?: unknown;
};

export async function listFeedPosts(): Promise<FeedPostsResponse> {
  const records = await queryAllFeedPostRecords();
  return buildFeedPostsResponse(records);
}

export async function listPublicFeedPosts(): Promise<FeedPostsResponse> {
  try {
    return await listFeedPosts();
  } catch (error) {
    if (error instanceof Error && error.message === 'FEED_POSTS_TABLE_NAME not set') {
      return {
        posts: [],
        generatedAt: new Date().toISOString(),
      };
    }

    throw error;
  }
}

export function buildFeedPostsResponse(items: unknown[]): FeedPostsResponse {
  const posts = items
    .map((item) => toFeedPost(item))
    .filter((item): item is FeedPost => !!item)
    .sort(compareFeedPosts);

  return {
    posts,
    generatedAt: new Date().toISOString(),
  };
}

export async function createAdminFeedPost(
  input: FeedPostWriteInput,
): Promise<FeedPostMutationResponse> {
  const record = buildFeedPostRecord(input, {
    postId: randomUUID(),
    now: new Date().toISOString(),
  });

  await dynamo.send(
    new PutCommand({
      TableName: getFeedPostsTableName(),
      Item: record,
      ConditionExpression: 'attribute_not_exists(postId)',
    }),
  );

  return {
    post: stripStorageFields(record),
    updatedAt: record.updatedAt,
  };
}

export async function updateAdminFeedPost(
  input: FeedPostWriteInput,
): Promise<FeedPostMutationResponse> {
  const postId = normalizePostId(input.postId);
  if (!postId) {
    throw new Error('INVALID_FEED_POST_ID');
  }

  const existingRecord = await getStoredFeedPost(postId);
  const existingPost = toFeedPost(existingRecord);
  if (!existingPost) {
    throw new Error('FEED_POST_NOT_FOUND');
  }

  const record = buildFeedPostRecord(input, {
    existing: existingPost,
    now: new Date().toISOString(),
  });

  await dynamo.send(
    new PutCommand({
      TableName: getFeedPostsTableName(),
      Item: record,
      ConditionExpression: 'attribute_exists(postId)',
    }),
  );

  return {
    post: stripStorageFields(record),
    updatedAt: record.updatedAt,
  };
}

export async function deleteAdminFeedPost(input: { postId?: unknown }): Promise<FeedPostDeleteResponse> {
  const postId = normalizePostId(input.postId);
  if (!postId) {
    throw new Error('INVALID_FEED_POST_ID');
  }

  const existingRecord = await getStoredFeedPost(postId);
  if (!toFeedPost(existingRecord)) {
    throw new Error('FEED_POST_NOT_FOUND');
  }

  await dynamo.send(
    new DeleteCommand({
      TableName: getFeedPostsTableName(),
      Key: { postId },
      ConditionExpression: 'attribute_exists(postId)',
    }),
  );

  return {
    postId,
    deletedAt: new Date().toISOString(),
  };
}

export function buildFeedPostRecord(
  input: FeedPostWriteInput,
  options?: { existing?: FeedPost; postId?: string; now?: string },
): FeedPostRecord {
  const postId =
    options?.existing?.postId ||
    normalizePostId(input.postId) ||
    normalizePostId(options?.postId);
  if (!postId) {
    throw new Error('INVALID_FEED_POST_ID');
  }

  const text = normalizeText(input.text);
  if (!text) {
    throw new Error('INVALID_FEED_POST_TEXT');
  }

  const order = normalizeOrder(input.order);
  if (!order) {
    throw new Error('INVALID_FEED_POST_ORDER');
  }

  const postType = normalizeFeedPostType(input.postType ?? input.type);
  if (!postType) {
    throw new Error('INVALID_FEED_POST_TYPE');
  }

  const now = asTimestamp(options?.now) || new Date().toISOString();
  const createdAt = options?.existing?.createdAt || now;
  const imageUrl = normalizeOptionalUrl(input.imageUrl ?? input.imageURL ?? input.imagenURL);
  const videoUrl = normalizeOptionalUrl(input.videoUrl ?? input.videoURL);
  const record: FeedPostRecord = {
    postId,
    feedPk: DEFAULT_FEED_PK,
    text,
    order,
    postType,
    ...(imageUrl ? { imageUrl } : {}),
    ...(videoUrl ? { videoUrl } : {}),
    createdAt,
    updatedAt: now,
  };

  if (postType === 'practice_guide') {
    const practiceId = normalizeTargetId(input.practiceId ?? input.practice_id);
    if (!practiceId) {
      throw new Error('INVALID_FEED_POST_TARGET');
    }
    record.practiceId = practiceId;
  }

  if (postType === 'mission_guide') {
    const missionId = normalizeTargetId(input.missionId ?? input.mission_id);
    if (!missionId) {
      throw new Error('INVALID_FEED_POST_TARGET');
    }
    record.missionId = missionId;
  }

  if (postType === 'extra') {
    const coinAmount = normalizeCoinAmount(input.coinAmount ?? input.coins ?? input.monedas);
    if (!coinAmount) {
      throw new Error('INVALID_FEED_POST_COIN_AMOUNT');
    }
    record.coinAmount = coinAmount;
  }

  return record;
}

export function toFeedPost(input: unknown): FeedPost | undefined {
  const raw = asRecord(input) as StoredFeedPostRecord | undefined;
  const postId = normalizePostId(raw?.postId);
  const text = normalizeText(raw?.text);
  const order = normalizeOrder(raw?.order);
  const postType = normalizeFeedPostType(raw?.postType ?? raw?.type);

  if (!postId || !text || !order || !postType) {
    return undefined;
  }

  const createdAt = asTimestamp(raw?.createdAt) || MIN_TIMESTAMP;
  const updatedAt = asTimestamp(raw?.updatedAt) || createdAt;
  const imageUrl = normalizeStoredOptionalUrl(raw?.imageUrl);
  const videoUrl = normalizeStoredOptionalUrl(raw?.videoUrl);
  const practiceId = normalizeTargetId(raw?.practiceId);
  const missionId = normalizeTargetId(raw?.missionId);
  const coinAmount = normalizeCoinAmount(raw?.coinAmount);

  if (postType === 'practice_guide' && !practiceId) {
    return undefined;
  }

  if (postType === 'mission_guide' && !missionId) {
    return undefined;
  }

  if (postType === 'extra' && !coinAmount) {
    return undefined;
  }

  return {
    postId,
    text,
    order,
    postType,
    ...(imageUrl ? { imageUrl } : {}),
    ...(videoUrl ? { videoUrl } : {}),
    ...(postType === 'practice_guide' && practiceId ? { practiceId } : {}),
    ...(postType === 'mission_guide' && missionId ? { missionId } : {}),
    ...(postType === 'extra' && coinAmount ? { coinAmount } : {}),
    createdAt,
    updatedAt,
  };
}

function stripStorageFields(record: FeedPostRecord): FeedPost {
  const { feedPk: _feedPk, ...post } = record;
  return post;
}

async function getStoredFeedPost(postId: string): Promise<unknown | undefined> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: getFeedPostsTableName(),
      Key: { postId },
    }),
  );

  return result.Item;
}

async function queryAllFeedPostRecords(): Promise<unknown[]> {
  const items: unknown[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new QueryCommand({
        TableName: getFeedPostsTableName(),
        IndexName: getFeedPostsOrderIndexName(),
        KeyConditionExpression: '#feedPk = :feedPk',
        ExpressionAttributeNames: {
          '#feedPk': 'feedPk',
        },
        ExpressionAttributeValues: {
          ':feedPk': DEFAULT_FEED_PK,
        },
        ScanIndexForward: true,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    items.push(...(page.Items || []));
    exclusiveStartKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);

  return items;
}

function compareFeedPosts(left: FeedPost, right: FeedPost): number {
  return (
    left.order - right.order ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.postId.localeCompare(right.postId)
  );
}

function normalizePostId(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 120);
}

function normalizeText(value: unknown): string | undefined {
  const normalized = asString(value)?.trim().replace(/\s+\n/g, '\n');
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 5000);
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

function normalizeFeedPostType(value: unknown): FeedPostType | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  return (FEED_POST_TYPES as readonly string[]).includes(normalized)
    ? (normalized as FeedPostType)
    : undefined;
}

function normalizeTargetId(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 180);
}

function normalizeOptionalUrl(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  if (!/^https?:\/\//i.test(normalized)) {
    throw new Error('INVALID_FEED_POST_URL');
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

function normalizeCoinAmount(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
      ? Number(value.trim())
      : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const amount = Math.floor(parsed);
  return amount >= 1 && amount <= 100000 ? amount : undefined;
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

function getFeedPostsTableName(): string {
  const tableName = process.env.FEED_POSTS_TABLE_NAME?.trim();
  if (!tableName) {
    throw new Error('FEED_POSTS_TABLE_NAME not set');
  }

  return tableName;
}

function getFeedPostsOrderIndexName(): string {
  return process.env.FEED_POSTS_BY_ORDER_INDEX_NAME?.trim() || DEFAULT_ORDER_INDEX_NAME;
}
