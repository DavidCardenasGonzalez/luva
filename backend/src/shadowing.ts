import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({});

const MIN_TIMESTAMP = '1970-01-01T00:00:00.000Z';
const AUDIO_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const AUDIO_CONTENT_TYPES: Record<string, string> = {
  'audio/aac': 'aac',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'audio/x-m4a': 'm4a',
  'audio/x-wav': 'wav',
};

const AUDIO_CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  webm: 'audio/webm',
};

export type ShadowingStatus = 'draft' | 'published';
export type ShadowingChapterStatus = 'draft' | 'ready';
export type ShadowingAudioKind = 'audio' | 'spanishAudio';

export type ShadowingList = {
  listId: string;
  name: string;
  category: string;
  order: number;
  status: ShadowingStatus;
  createdAt: string;
  updatedAt: string;
};

export type ShadowingChapter = {
  listId: string;
  chapterId: string;
  title: string;
  description: string;
  order: number;
  status: ShadowingChapterStatus;
  audioKey?: string;
  audioUrl?: string;
  spanishAudioKey?: string;
  spanishAudioUrl?: string;
  assetsBucketName?: string;
  durationSeconds?: number;
  createdAt: string;
  updatedAt: string;
};

export type ShadowingListWithChapters = ShadowingList & {
  chapters: ShadowingChapter[];
};

export type ShadowingCatalogResponse = {
  lists: ShadowingListWithChapters[];
  generatedAt: string;
};

export type ShadowingAdminResponse = ShadowingCatalogResponse;

export type ShadowingListMutationResponse = {
  list: ShadowingList;
  updatedAt: string;
};

export type ShadowingChapterMutationResponse = {
  chapter: ShadowingChapter;
  updatedAt: string;
};

export type ShadowingDeleteResponse = {
  listId: string;
  chapterId?: string;
  deletedAt: string;
};

export type ShadowingAudioUploadResponse = {
  uploadUrl: string;
  key: string;
  bucketName: string;
  url: string;
  expiresAt: string;
  contentType: string;
  cacheControl: string;
};

type ShadowingListWriteInput = {
  listId?: unknown;
  name?: unknown;
  category?: unknown;
  order?: unknown;
  status?: unknown;
};

type ShadowingChapterWriteInput = {
  listId?: unknown;
  chapterId?: unknown;
  title?: unknown;
  description?: unknown;
  order?: unknown;
  status?: unknown;
  durationSeconds?: unknown;
};

type ShadowingAudioUploadInput = {
  listId?: unknown;
  chapterId?: unknown;
  kind?: unknown;
  contentType?: unknown;
  fileName?: unknown;
};

type ShadowingAudioCompleteInput = ShadowingAudioUploadInput & {
  audioKey?: unknown;
  key?: unknown;
};

function getShadowingListsTableName(): string {
  const name = process.env.SHADOWING_LISTS_TABLE_NAME?.trim();
  if (!name) throw new Error('SHADOWING_LISTS_TABLE_NAME not set');
  return name;
}

function getShadowingChaptersTableName(): string {
  const name = process.env.SHADOWING_CHAPTERS_TABLE_NAME?.trim();
  if (!name) throw new Error('SHADOWING_CHAPTERS_TABLE_NAME not set');
  return name;
}

function getAssetsBucketName(): string {
  const name = process.env.ASSETS_BUCKET_NAME?.trim();
  if (!name) throw new Error('ASSETS_BUCKET_NAME not set');
  return name;
}

function getAssetsBaseUrl(): string {
  const url =
    process.env.ASSETS_CLOUDFRONT_URL?.trim() ||
    process.env.ASSETS_CLOUDFRONT_DOMAIN_NAME?.trim();
  if (!url) throw new Error('ASSETS_CLOUDFRONT_DOMAIN_NAME not set');
  return url.startsWith('http') ? url.replace(/\/$/, '') : `https://${url.replace(/\/$/, '')}`;
}

function buildAssetUrl(key: string): string {
  return `${getAssetsBaseUrl()}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value.trim())
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeOrder(value: unknown, fallback = 1): number {
  const parsed = normalizeNumber(value);
  if (parsed == null || !Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.floor(parsed));
}

function normalizeListStatus(value: unknown): ShadowingStatus {
  return value === 'published' ? 'published' : 'draft';
}

function normalizeChapterStatus(value: unknown): ShadowingChapterStatus {
  return value === 'ready' ? 'ready' : 'draft';
}

function normalizeAudioKind(value: unknown): ShadowingAudioKind {
  if (value === 'audio' || value === 'spanishAudio') return value;
  throw new Error('INVALID_SHADOWING_AUDIO_KIND');
}

function getFileExtension(fileName?: string): string | undefined {
  const trimmed = fileName?.trim().toLowerCase();
  if (!trimmed) return undefined;
  const dotIndex = trimmed.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex === trimmed.length - 1) return undefined;
  return trimmed.slice(dotIndex + 1);
}

function normalizeAudioContentType(contentType: unknown, fileName: unknown): string | undefined {
  const normalizedContentType = asString(contentType)
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();
  if (normalizedContentType && AUDIO_CONTENT_TYPES[normalizedContentType]) {
    return normalizedContentType;
  }

  const extension = getFileExtension(asString(fileName));
  return extension ? AUDIO_CONTENT_TYPE_BY_EXTENSION[extension] : undefined;
}

function toShadowingList(item: unknown): ShadowingList | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const raw = item as Record<string, unknown>;
  const listId = asString(raw.listId)?.trim();
  const name = asString(raw.name)?.trim();
  const category = asString(raw.category)?.trim();
  if (!listId || !name || !category) return undefined;

  return {
    listId,
    name,
    category,
    order: normalizeOrder(raw.order),
    status: normalizeListStatus(raw.status),
    createdAt: asString(raw.createdAt)?.trim() || MIN_TIMESTAMP,
    updatedAt: asString(raw.updatedAt)?.trim() || MIN_TIMESTAMP,
  };
}

function toShadowingChapter(item: unknown): ShadowingChapter | undefined {
  if (!item || typeof item !== 'object') return undefined;
  const raw = item as Record<string, unknown>;
  const listId = asString(raw.listId)?.trim();
  const chapterId = asString(raw.chapterId)?.trim();
  const title = asString(raw.title)?.trim();
  if (!listId || !chapterId || !title) return undefined;

  const audioKey = asString(raw.audioKey)?.trim();
  const spanishAudioKey = asString(raw.spanishAudioKey)?.trim();
  const durationSeconds = normalizeNumber(raw.durationSeconds);

  return {
    listId,
    chapterId,
    title,
    description: asString(raw.description)?.trim() || '',
    order: normalizeOrder(raw.order),
    status: normalizeChapterStatus(raw.status),
    audioKey,
    audioUrl: asString(raw.audioUrl)?.trim() || (audioKey ? buildAssetUrl(audioKey) : undefined),
    spanishAudioKey,
    spanishAudioUrl:
      asString(raw.spanishAudioUrl)?.trim() ||
      (spanishAudioKey ? buildAssetUrl(spanishAudioKey) : undefined),
    assetsBucketName: asString(raw.assetsBucketName)?.trim(),
    durationSeconds: durationSeconds != null && durationSeconds > 0 ? durationSeconds : undefined,
    createdAt: asString(raw.createdAt)?.trim() || MIN_TIMESTAMP,
    updatedAt: asString(raw.updatedAt)?.trim() || MIN_TIMESTAMP,
  };
}

function compareLists(left: ShadowingList, right: ShadowingList): number {
  if (left.order !== right.order) return left.order - right.order;
  const categoryComparison = left.category.localeCompare(right.category);
  if (categoryComparison !== 0) return categoryComparison;
  return left.name.localeCompare(right.name);
}

function compareChapters(left: ShadowingChapter, right: ShadowingChapter): number {
  if (left.order !== right.order) return left.order - right.order;
  return left.createdAt.localeCompare(right.createdAt);
}

async function getListRecord(listId: string): Promise<ShadowingList | undefined> {
  const response = await dynamo.send(
    new GetCommand({
      TableName: getShadowingListsTableName(),
      Key: { listId },
    }),
  );
  return toShadowingList(response.Item);
}

async function getChapterRecord(
  listId: string,
  chapterId: string,
): Promise<ShadowingChapter | undefined> {
  const response = await dynamo.send(
    new GetCommand({
      TableName: getShadowingChaptersTableName(),
      Key: { listId, chapterId },
    }),
  );
  return toShadowingChapter(response.Item);
}

async function listAllShadowingLists(): Promise<ShadowingList[]> {
  const items: unknown[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: getShadowingListsTableName(),
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return items
    .map(toShadowingList)
    .filter((list): list is ShadowingList => !!list)
    .sort(compareLists);
}

async function listAllShadowingChapters(): Promise<ShadowingChapter[]> {
  const items: unknown[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: getShadowingChaptersTableName(),
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return items
    .map(toShadowingChapter)
    .filter((chapter): chapter is ShadowingChapter => !!chapter)
    .sort(compareChapters);
}

async function listChaptersForList(listId: string): Promise<ShadowingChapter[]> {
  const items: unknown[] = [];
  let lastKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new QueryCommand({
        TableName: getShadowingChaptersTableName(),
        KeyConditionExpression: 'listId = :listId',
        ExpressionAttributeValues: { ':listId': listId },
        ExclusiveStartKey: lastKey,
      }),
    );
    items.push(...(page.Items || []));
    lastKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);

  return items
    .map(toShadowingChapter)
    .filter((chapter): chapter is ShadowingChapter => !!chapter)
    .sort(compareChapters);
}

function attachChapters(
  lists: ShadowingList[],
  chapters: ShadowingChapter[],
): ShadowingListWithChapters[] {
  const chaptersByList = new Map<string, ShadowingChapter[]>();
  chapters.forEach((chapter) => {
    const current = chaptersByList.get(chapter.listId) || [];
    current.push(chapter);
    chaptersByList.set(chapter.listId, current);
  });

  return lists.map((list) => ({
    ...list,
    chapters: (chaptersByList.get(list.listId) || []).sort(compareChapters),
  }));
}

export async function listAdminShadowing(): Promise<ShadowingAdminResponse> {
  const [lists, chapters] = await Promise.all([
    listAllShadowingLists(),
    listAllShadowingChapters(),
  ]);

  return {
    lists: attachChapters(lists, chapters),
    generatedAt: new Date().toISOString(),
  };
}

export async function listPublicShadowingCatalog(): Promise<ShadowingCatalogResponse> {
  const adminCatalog = await listAdminShadowing();
  return {
    lists: adminCatalog.lists
      .filter((list) => list.status === 'published')
      .map((list) => ({
        ...list,
        chapters: list.chapters.filter(
          (chapter) => chapter.status === 'ready' && Boolean(chapter.audioUrl),
        ),
      }))
      .filter((list) => list.chapters.length > 0),
    generatedAt: adminCatalog.generatedAt,
  };
}

export async function createAdminShadowingList(
  input: ShadowingListWriteInput,
): Promise<ShadowingListMutationResponse> {
  const name = asString(input.name)?.trim().slice(0, 140);
  if (!name) throw new Error('INVALID_SHADOWING_LIST_NAME');

  const category = asString(input.category)?.trim().slice(0, 100);
  if (!category) throw new Error('INVALID_SHADOWING_LIST_CATEGORY');

  const now = new Date().toISOString();
  const list: ShadowingList = {
    listId: randomUUID(),
    name,
    category,
    order: normalizeOrder(input.order),
    status: normalizeListStatus(input.status),
    createdAt: now,
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: getShadowingListsTableName(),
      Item: list,
      ConditionExpression: 'attribute_not_exists(listId)',
    }),
  );

  return { list, updatedAt: now };
}

export async function updateAdminShadowingList(
  input: ShadowingListWriteInput,
): Promise<ShadowingListMutationResponse> {
  const listId = asString(input.listId)?.trim();
  if (!listId) throw new Error('INVALID_SHADOWING_LIST_ID');

  const existing = await getListRecord(listId);
  if (!existing) throw new Error('SHADOWING_LIST_NOT_FOUND');

  const name = asString(input.name)?.trim().slice(0, 140);
  if (!name) throw new Error('INVALID_SHADOWING_LIST_NAME');

  const category = asString(input.category)?.trim().slice(0, 100);
  if (!category) throw new Error('INVALID_SHADOWING_LIST_CATEGORY');

  const now = new Date().toISOString();
  const list: ShadowingList = {
    ...existing,
    name,
    category,
    order: normalizeOrder(input.order, existing.order),
    status: normalizeListStatus(input.status),
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: getShadowingListsTableName(),
      Item: list,
      ConditionExpression: 'attribute_exists(listId)',
    }),
  );

  return { list, updatedAt: now };
}

export async function deleteAdminShadowingList(input: {
  listId?: unknown;
}): Promise<ShadowingDeleteResponse> {
  const listId = asString(input.listId)?.trim();
  if (!listId) throw new Error('INVALID_SHADOWING_LIST_ID');

  const existing = await getListRecord(listId);
  if (!existing) throw new Error('SHADOWING_LIST_NOT_FOUND');

  const chapters = await listChaptersForList(listId);
  await Promise.all(chapters.map((chapter) => deleteAdminShadowingChapter(chapter)));

  await dynamo.send(
    new DeleteCommand({
      TableName: getShadowingListsTableName(),
      Key: { listId },
      ConditionExpression: 'attribute_exists(listId)',
    }),
  );

  return { listId, deletedAt: new Date().toISOString() };
}

export async function createAdminShadowingChapter(
  input: ShadowingChapterWriteInput,
): Promise<ShadowingChapterMutationResponse> {
  const listId = asString(input.listId)?.trim();
  if (!listId) throw new Error('INVALID_SHADOWING_LIST_ID');

  const list = await getListRecord(listId);
  if (!list) throw new Error('SHADOWING_LIST_NOT_FOUND');

  const title = asString(input.title)?.trim().slice(0, 180);
  if (!title) throw new Error('INVALID_SHADOWING_CHAPTER_TITLE');

  const now = new Date().toISOString();
  const durationSeconds = normalizeNumber(input.durationSeconds);
  const chapter: ShadowingChapter = {
    listId,
    chapterId: randomUUID(),
    title,
    description: asString(input.description)?.trim().slice(0, 1200) || '',
    order: normalizeOrder(input.order),
    status: normalizeChapterStatus(input.status),
    assetsBucketName: getAssetsBucketName(),
    durationSeconds: durationSeconds != null && durationSeconds > 0 ? durationSeconds : undefined,
    createdAt: now,
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: getShadowingChaptersTableName(),
      Item: chapter,
      ConditionExpression: 'attribute_not_exists(listId) AND attribute_not_exists(chapterId)',
    }),
  );

  return { chapter, updatedAt: now };
}

export async function updateAdminShadowingChapter(
  input: ShadowingChapterWriteInput,
): Promise<ShadowingChapterMutationResponse> {
  const listId = asString(input.listId)?.trim();
  if (!listId) throw new Error('INVALID_SHADOWING_LIST_ID');

  const chapterId = asString(input.chapterId)?.trim();
  if (!chapterId) throw new Error('INVALID_SHADOWING_CHAPTER_ID');

  const existing = await getChapterRecord(listId, chapterId);
  if (!existing) throw new Error('SHADOWING_CHAPTER_NOT_FOUND');

  const title = asString(input.title)?.trim().slice(0, 180);
  if (!title) throw new Error('INVALID_SHADOWING_CHAPTER_TITLE');

  const durationSeconds = normalizeNumber(input.durationSeconds);
  const requestedStatus = normalizeChapterStatus(input.status);
  const status = requestedStatus === 'ready' && !existing.audioKey ? 'draft' : requestedStatus;
  const now = new Date().toISOString();
  const chapter: ShadowingChapter = {
    ...existing,
    title,
    description: asString(input.description)?.trim().slice(0, 1200) || '',
    order: normalizeOrder(input.order, existing.order),
    status,
    durationSeconds: durationSeconds != null && durationSeconds > 0 ? durationSeconds : undefined,
    assetsBucketName: existing.assetsBucketName || getAssetsBucketName(),
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: getShadowingChaptersTableName(),
      Item: chapter,
      ConditionExpression: 'attribute_exists(listId) AND attribute_exists(chapterId)',
    }),
  );

  return { chapter, updatedAt: now };
}

export async function deleteAdminShadowingChapter(input: {
  listId?: unknown;
  chapterId?: unknown;
}): Promise<ShadowingDeleteResponse> {
  const listId = asString(input.listId)?.trim();
  if (!listId) throw new Error('INVALID_SHADOWING_LIST_ID');

  const chapterId = asString(input.chapterId)?.trim();
  if (!chapterId) throw new Error('INVALID_SHADOWING_CHAPTER_ID');

  const existing = await getChapterRecord(listId, chapterId);
  if (!existing) throw new Error('SHADOWING_CHAPTER_NOT_FOUND');

  await dynamo.send(
    new DeleteCommand({
      TableName: getShadowingChaptersTableName(),
      Key: { listId, chapterId },
      ConditionExpression: 'attribute_exists(listId) AND attribute_exists(chapterId)',
    }),
  );

  await Promise.all(
    [existing.audioKey, existing.spanishAudioKey]
      .filter((key): key is string => !!key)
      .map((key) =>
        s3.send(
          new DeleteObjectCommand({
            Bucket: existing.assetsBucketName || getAssetsBucketName(),
            Key: key,
          }),
        ).catch(() => undefined),
      ),
  );

  return { listId, chapterId, deletedAt: new Date().toISOString() };
}

export async function createShadowingAudioUpload(
  input: ShadowingAudioUploadInput,
): Promise<ShadowingAudioUploadResponse> {
  const listId = asString(input.listId)?.trim();
  if (!listId) throw new Error('INVALID_SHADOWING_LIST_ID');

  const chapterId = asString(input.chapterId)?.trim();
  if (!chapterId) throw new Error('INVALID_SHADOWING_CHAPTER_ID');

  const chapter = await getChapterRecord(listId, chapterId);
  if (!chapter) throw new Error('SHADOWING_CHAPTER_NOT_FOUND');

  const kind = normalizeAudioKind(input.kind);
  const contentType = normalizeAudioContentType(input.contentType, input.fileName);
  if (!contentType) throw new Error('INVALID_SHADOWING_AUDIO_CONTENT_TYPE');

  const bucketName = getAssetsBucketName();
  const extension = AUDIO_CONTENT_TYPES[contentType];
  const key = `shadowing/${listId}/${chapterId}/${kind}.${extension}`;
  const expiresInSeconds = 60 * 15;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
      CacheControl: AUDIO_CACHE_CONTROL,
    }),
    { expiresIn: expiresInSeconds },
  );

  return {
    uploadUrl,
    key,
    bucketName,
    url: buildAssetUrl(key),
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    contentType,
    cacheControl: AUDIO_CACHE_CONTROL,
  };
}

export async function completeShadowingAudioUpload(
  input: ShadowingAudioCompleteInput,
): Promise<ShadowingChapterMutationResponse> {
  const listId = asString(input.listId)?.trim();
  if (!listId) throw new Error('INVALID_SHADOWING_LIST_ID');

  const chapterId = asString(input.chapterId)?.trim();
  if (!chapterId) throw new Error('INVALID_SHADOWING_CHAPTER_ID');

  const kind = normalizeAudioKind(input.kind);
  const key = asString(input.audioKey ?? input.key)?.trim();
  if (!key || !key.startsWith(`shadowing/${listId}/${chapterId}/`)) {
    throw new Error('INVALID_SHADOWING_AUDIO_KEY');
  }

  const existing = await getChapterRecord(listId, chapterId);
  if (!existing) throw new Error('SHADOWING_CHAPTER_NOT_FOUND');

  const now = new Date().toISOString();
  const nextChapter: ShadowingChapter = {
    ...existing,
    ...(kind === 'audio'
      ? { audioKey: key, audioUrl: buildAssetUrl(key) }
      : { spanishAudioKey: key, spanishAudioUrl: buildAssetUrl(key) }),
    assetsBucketName: getAssetsBucketName(),
    status: kind === 'audio' ? 'ready' : existing.status,
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: getShadowingChaptersTableName(),
      Item: nextChapter,
      ConditionExpression: 'attribute_exists(listId) AND attribute_exists(chapterId)',
    }),
  );

  return { chapter: nextChapter, updatedAt: now };
}
