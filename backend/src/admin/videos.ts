import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const s3 = new S3Client({});

const MIN_TIMESTAMP = '1970-01-01T00:00:00.000Z';
const ADMIN_VIDEO_RUNTIME_FIELDS = [
  'instagramPublishStatus',
  'instagramPublishedAt',
  'instagramMediaId',
  'instagramContainerId',
  'instagramLastError',
  'tiktokPublishStatus',
  'tiktokPublishedAt',
  'tiktokPublishId',
  'tiktokPostId',
  'tiktokLastError',
  'lastPublishAttemptAt',
  'publishAttemptCount',
  'lastPublishError',
  'publishLockToken',
  'publishLockExpiresAt',
] as const;

export const ADMIN_VIDEO_STATUSES = [
  'por_programar',
  'programado',
  'subido',
  'descartado',
] as const;

export type AdminVideoStatus = (typeof ADMIN_VIDEO_STATUSES)[number];

type StoredAdminVideoRecord = {
  storyId?: unknown;
  videoId?: unknown;
  title?: unknown;
  caption?: unknown;
  status?: unknown;
  publishOn?: unknown;
  bucketPath?: unknown;
  bucketName?: unknown;
  bucketKey?: unknown;
  uploadedAt?: unknown;
  updatedAt?: unknown;
  contentType?: unknown;
  sourceVideoFileName?: unknown;
  sourceVideoFileSizeBytes?: unknown;
  generationUpdatedAt?: unknown;
};

export type AdminVideoSummary = {
  storyId: string;
  videoId: string;
  title: string;
  status: AdminVideoStatus;
  hasCaption: boolean;
  caption?: string;
  publishOn?: string;
  bucketPath?: string;
  bucketName?: string;
  bucketKey?: string;
  uploadedAt: string;
  updatedAt: string;
  contentType?: string;
  sourceVideoFileName?: string;
  sourceVideoFileSizeBytes?: number;
  generationUpdatedAt?: string;
};

export type AdminVideosResponse = {
  videos: AdminVideoSummary[];
  stats: {
    totalVideos: number;
    pendingToSchedule: number;
    scheduledVideos: number;
    uploadedVideos: number;
    discardedVideos: number;
    scheduledByDay: Array<{
      date: string;
      count: number;
    }>;
  };
  generatedAt: string;
};

export type UpdateAdminVideoInput = {
  storyId?: unknown;
  videoId?: unknown;
  status?: unknown;
  publishOn?: unknown;
};

export type UpdateAdminVideoResponse = {
  video: AdminVideoSummary;
  updatedAt: string;
};

export type AdminVideoPreviewResponse = {
  storyId: string;
  videoId: string;
  previewUrl: string;
  expiresAt: string;
  contentType?: string;
};

export type AdminVideoReplaceUploadInput = {
  storyId?: unknown;
  videoId?: unknown;
  contentType?: unknown;
};

export type AdminVideoReplaceUploadResponse = {
  storyId: string;
  videoId: string;
  uploadUrl: string;
  expiresAt: string;
  contentType: string;
};

export type CompleteAdminVideoReplaceInput = {
  storyId?: unknown;
  videoId?: unknown;
  contentType?: unknown;
  sizeBytes?: unknown;
};

export type CompleteAdminVideoReplaceResponse = {
  video: AdminVideoSummary;
  updatedAt: string;
};

export async function listAdminVideos(): Promise<AdminVideosResponse> {
  const items = await scanAllVideos();
  return buildAdminVideosResponse(items);
}

export function buildAdminVideosResponse(items: unknown[]): AdminVideosResponse {
  const videos = items
    .map((item) => toAdminVideoSummary(item))
    .filter((item): item is AdminVideoSummary => !!item)
    .sort(compareVideos);

  return {
    videos,
    stats: summarizeVideos(videos),
    generatedAt: new Date().toISOString(),
  };
}

export function buildAdminVideoPublicationState(
  existing: AdminVideoSummary,
  input: Pick<UpdateAdminVideoInput, 'status' | 'publishOn'>,
  options?: { now?: string },
): AdminVideoSummary {
  const nextStatus = normalizeVideoStatus(input.status);
  if (!nextStatus) {
    throw new Error('INVALID_VIDEO_STATUS');
  }

  const now = asTimestamp(options?.now) || new Date().toISOString();
  const hasPublishOn = hasOwn(input, 'publishOn');
  let nextPublishOn = hasPublishOn
    ? normalizeRequestedPublishOn(input.publishOn)
    : existing.publishOn;

  if (nextStatus === 'por_programar') {
    nextPublishOn = undefined;
  }

  if (nextStatus === 'programado' && !nextPublishOn) {
    throw new Error('PUBLISH_ON_REQUIRED_FOR_PROGRAMADO');
  }

  const { publishOn: _existingPublishOn, ...rest } = existing;

  return {
    ...rest,
    status: nextStatus,
    ...(nextPublishOn ? { publishOn: nextPublishOn } : {}),
    updatedAt: now,
  };
}

export async function updateAdminVideoPublication(
  input: UpdateAdminVideoInput,
): Promise<UpdateAdminVideoResponse> {
  const storyId = normalizeKey(input.storyId);
  const videoId = normalizeKey(input.videoId);

  if (!storyId || !videoId) {
    throw new Error('INVALID_VIDEO_KEY');
  }

  const existing = await getCurrentStoredVideo(storyId, videoId);
  if (!existing) {
    throw new Error('VIDEO_NOT_FOUND');
  }

  const existingSummary = toAdminVideoSummary(existing);
  if (!existingSummary) {
    throw new Error('VIDEO_NOT_FOUND');
  }

  const nextVideo = buildAdminVideoPublicationState(existingSummary, input, {
    now: new Date().toISOString(),
  });
  const shouldSetPublishOn = !!nextVideo.publishOn;
  const shouldRemovePublishOn = !nextVideo.publishOn && !!existingSummary.publishOn;
  const expressionAttributeNames: Record<string, string> = {
    '#status': 'status',
  };
  const expressionAttributeValues: Record<string, unknown> = {
    ':status': nextVideo.status,
    ':updatedAt': nextVideo.updatedAt,
  };
  let updateExpression = 'SET #status = :status, updatedAt = :updatedAt';

  if (shouldSetPublishOn) {
    expressionAttributeValues[':publishOn'] = nextVideo.publishOn;
    updateExpression += ', publishOn = :publishOn';
  }

  if (shouldRemovePublishOn) {
    updateExpression += ' REMOVE publishOn';
  }

  if (nextVideo.status !== 'subido') {
    const removeFields = ADMIN_VIDEO_RUNTIME_FIELDS.join(', ');
    updateExpression += shouldRemovePublishOn
      ? `, ${removeFields}`
      : ` REMOVE ${removeFields}`;
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: getGeneratedVideosTableName(),
      Key: { storyId, videoId },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression:
        'attribute_exists(storyId) AND attribute_exists(videoId)',
    }),
  );

  return {
    video: nextVideo,
    updatedAt: nextVideo.updatedAt,
  };
}

export async function getAdminVideoPreview(input: {
  storyId?: unknown;
  videoId?: unknown;
}): Promise<AdminVideoPreviewResponse> {
  const storyId = normalizeKey(input.storyId);
  const videoId = normalizeKey(input.videoId);

  if (!storyId || !videoId) {
    throw new Error('INVALID_VIDEO_KEY');
  }

  const existing = await getCurrentStoredVideo(storyId, videoId);
  const summary = toAdminVideoSummary(existing);

  if (!summary || !summary.bucketName || !summary.bucketKey) {
    throw new Error('VIDEO_NOT_FOUND');
  }

  const expiresInSeconds = 60 * 15;
  const previewUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: summary.bucketName,
      Key: summary.bucketKey,
      ResponseContentType: summary.contentType || 'video/mp4',
    }),
    { expiresIn: expiresInSeconds },
  );
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return {
    storyId,
    videoId,
    previewUrl,
    expiresAt,
    ...(summary.contentType ? { contentType: summary.contentType } : {}),
  };
}

export async function createAdminVideoReplaceUpload(
  input: AdminVideoReplaceUploadInput,
): Promise<AdminVideoReplaceUploadResponse> {
  const storyId = normalizeKey(input.storyId);
  const videoId = normalizeKey(input.videoId);
  const contentType = normalizeContentType(input.contentType) || 'video/mp4';

  if (!storyId || !videoId) {
    throw new Error('INVALID_VIDEO_KEY');
  }

  const existing = await getCurrentStoredVideo(storyId, videoId);
  const summary = toAdminVideoSummary(existing);

  if (!summary || !summary.bucketName || !summary.bucketKey) {
    throw new Error('VIDEO_NOT_FOUND');
  }

  const expiresInSeconds = 60 * 15;
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: summary.bucketName,
      Key: summary.bucketKey,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds },
  );
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  return {
    storyId,
    videoId,
    uploadUrl,
    expiresAt,
    contentType,
  };
}

export async function completeAdminVideoReplace(
  input: CompleteAdminVideoReplaceInput,
): Promise<CompleteAdminVideoReplaceResponse> {
  const storyId = normalizeKey(input.storyId);
  const videoId = normalizeKey(input.videoId);
  const contentType = normalizeContentType(input.contentType);
  const sizeBytes = asNumber(input.sizeBytes);

  if (!storyId || !videoId) {
    throw new Error('INVALID_VIDEO_KEY');
  }

  const existing = await getCurrentStoredVideo(storyId, videoId);
  const summary = toAdminVideoSummary(existing);

  if (!summary) {
    throw new Error('VIDEO_NOT_FOUND');
  }

  const updatedAt = new Date().toISOString();
  const expressionAttributeValues: Record<string, unknown> = {
    ':updatedAt': updatedAt,
  };
  let updateExpression = 'SET updatedAt = :updatedAt';

  if (contentType) {
    expressionAttributeValues[':contentType'] = contentType;
    updateExpression += ', contentType = :contentType';
  }

  if (sizeBytes !== undefined) {
    expressionAttributeValues[':sizeBytes'] = sizeBytes;
    updateExpression += ', sourceVideoFileSizeBytes = :sizeBytes';
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: getGeneratedVideosTableName(),
      Key: { storyId, videoId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression:
        'attribute_exists(storyId) AND attribute_exists(videoId)',
    }),
  );

  return {
    video: {
      ...summary,
      ...(contentType ? { contentType } : {}),
      ...(sizeBytes !== undefined ? { sourceVideoFileSizeBytes: sizeBytes } : {}),
      updatedAt,
    },
    updatedAt,
  };
}

async function scanAllVideos(): Promise<unknown[]> {
  const items: unknown[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: getGeneratedVideosTableName(),
        ExclusiveStartKey: exclusiveStartKey,
        ProjectionExpression:
          'storyId, videoId, title, caption, #status, publishOn, bucketPath, bucketName, bucketKey, uploadedAt, updatedAt, contentType, sourceVideoFileName, sourceVideoFileSizeBytes, generationUpdatedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
      }),
    );

    items.push(...(page.Items || []));
    exclusiveStartKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);

  return items;
}

async function getCurrentStoredVideo(
  storyId: string,
  videoId: string,
): Promise<StoredAdminVideoRecord | undefined> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: getGeneratedVideosTableName(),
      Key: { storyId, videoId },
    }),
  );

  return asRecord(result.Item) as StoredAdminVideoRecord | undefined;
}

function toAdminVideoSummary(input: unknown): AdminVideoSummary | undefined {
  const raw = asRecord(input) as StoredAdminVideoRecord | undefined;
  const storyId = normalizeKey(raw?.storyId);
  const videoId = normalizeKey(raw?.videoId);

  if (!storyId || !videoId) {
    return undefined;
  }

  const uploadedAt = asTimestamp(raw?.uploadedAt) || MIN_TIMESTAMP;
  const updatedAt = asTimestamp(raw?.updatedAt) || uploadedAt;
  const publishOn = normalizePublishOn(raw?.publishOn);
  const status = normalizeVideoStatus(raw?.status, publishOn);

  if (!status) {
    return undefined;
  }

  return {
    storyId,
    videoId,
    title: firstNonEmpty(asString(raw?.title), storyId) || storyId,
    status,
    hasCaption: hasAdminVideoCaption(raw),
    ...(firstNonEmpty(asString(raw?.caption)) ? { caption: firstNonEmpty(asString(raw?.caption)) } : {}),
    ...(publishOn ? { publishOn } : {}),
    ...(firstNonEmpty(asString(raw?.bucketPath)) ? { bucketPath: firstNonEmpty(asString(raw?.bucketPath)) } : {}),
    ...(firstNonEmpty(asString(raw?.bucketName)) ? { bucketName: firstNonEmpty(asString(raw?.bucketName)) } : {}),
    ...(firstNonEmpty(asString(raw?.bucketKey)) ? { bucketKey: firstNonEmpty(asString(raw?.bucketKey)) } : {}),
    uploadedAt,
    updatedAt,
    ...(firstNonEmpty(asString(raw?.contentType)) ? { contentType: firstNonEmpty(asString(raw?.contentType)) } : {}),
    ...(firstNonEmpty(asString(raw?.sourceVideoFileName))
      ? { sourceVideoFileName: firstNonEmpty(asString(raw?.sourceVideoFileName)) }
      : {}),
    ...(asNumber(raw?.sourceVideoFileSizeBytes) !== undefined
      ? { sourceVideoFileSizeBytes: asNumber(raw?.sourceVideoFileSizeBytes) }
      : {}),
    ...(asTimestamp(raw?.generationUpdatedAt)
      ? { generationUpdatedAt: asTimestamp(raw?.generationUpdatedAt) }
      : {}),
  };
}

function hasAdminVideoCaption(raw?: StoredAdminVideoRecord): boolean {
  return !!firstNonEmpty(asString(raw?.caption));
}

function summarizeVideos(videos: AdminVideoSummary[]): AdminVideosResponse['stats'] {
  const scheduledByDay = new Map<string, number>();

  for (const video of videos) {
    if (video.status === 'programado' && video.publishOn) {
      const publishDay = getPublishDay(video.publishOn);
      scheduledByDay.set(publishDay, (scheduledByDay.get(publishDay) || 0) + 1);
    }
  }

  return {
    totalVideos: videos.length,
    pendingToSchedule: videos.filter((video) => video.status === 'por_programar').length,
    scheduledVideos: videos.filter((video) => video.status === 'programado').length,
    uploadedVideos: videos.filter((video) => video.status === 'subido').length,
    discardedVideos: videos.filter((video) => video.status === 'descartado').length,
    scheduledByDay: Array.from(scheduledByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((left, right) => left.date.localeCompare(right.date)),
  };
}

function compareVideos(left: AdminVideoSummary, right: AdminVideoSummary): number {
  return (
    compareVideoStatus(left.status, right.status) ||
    comparePublishDates(left.publishOn, right.publishOn) ||
    right.uploadedAt.localeCompare(left.uploadedAt) ||
    right.updatedAt.localeCompare(left.updatedAt) ||
    left.storyId.localeCompare(right.storyId) ||
    left.videoId.localeCompare(right.videoId)
  );
}

function compareVideoStatus(left: AdminVideoStatus, right: AdminVideoStatus): number {
  return getStatusOrder(left) - getStatusOrder(right);
}

function getStatusOrder(status: AdminVideoStatus): number {
  switch (status) {
    case 'por_programar':
      return 0;
    case 'programado':
      return 1;
    case 'subido':
      return 2;
    case 'descartado':
      return 3;
    default:
      return 99;
  }
}

function comparePublishDates(left?: string, right?: string): number {
  if (left && right) {
    return left.localeCompare(right);
  }

  if (left) {
    return -1;
  }

  if (right) {
    return 1;
  }

  return 0;
}

function normalizeVideoStatus(
  value: unknown,
  fallbackPublishOn?: string,
): AdminVideoStatus | undefined {
  const normalized = asString(value)?.trim().toLowerCase();

  if (!normalized) {
    return fallbackPublishOn ? 'programado' : 'por_programar';
  }

  if ((ADMIN_VIDEO_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as AdminVideoStatus;
  }

  return undefined;
}

function normalizePublishOn(value: unknown): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function normalizeRequestedPublishOn(value: unknown): string | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  const normalized = normalizePublishOn(value);
  if (!normalized) {
    throw new Error('INVALID_PUBLISH_ON');
  }

  return normalized;
}

function getPublishDay(value: string): string {
  return value.slice(0, 10);
}

function normalizeContentType(value: unknown): string | undefined {
  const normalized = asString(value)?.trim().toLowerCase();
  return normalized || undefined;
}

function normalizeKey(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  return normalized || undefined;
}

function getGeneratedVideosTableName(): string {
  const tableName = process.env.GENERATED_VIDEOS_TABLE_NAME;
  if (!tableName) {
    throw new Error('GENERATED_VIDEOS_TABLE_NAME not set');
  }
  return tableName;
}

function hasOwn(value: unknown, key: string): boolean {
  return !!value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function asTimestamp(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = (value || '').trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}
