import { randomUUID } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const s3 = new S3Client({});
const ssm = new SSMClient({});

const STATUS_PROGRAMADO = 'programado';
const STATUS_SUBIDO = 'subido';
const LOCK_WINDOW_MS = 6 * 60 * 1000;
const INSTAGRAM_POLL_INTERVAL_MS = 15_000;
const INSTAGRAM_MAX_POLLS = 8;
const TIKTOK_POLL_INTERVAL_MS = 15_000;
const TIKTOK_MAX_POLLS = 8;
const S3_URL_EXPIRATION_SECONDS = 6 * 60 * 60;
const TIKTOK_MIN_CHUNK_SIZE = 5 * 1024 * 1024;
const TIKTOK_MAX_CHUNK_SIZE = 64 * 1024 * 1024;
const TIKTOK_PREFERRED_CHUNK_SIZE = 10 * 1024 * 1024;
const TIKTOK_MAX_CHUNKS = 1000;

export const PLATFORM_PUBLISH_STATUSES = [
  'pendiente',
  'procesando',
  'subido',
  'error',
  'omitido',
] as const;

export type PlatformPublishStatus = (typeof PLATFORM_PUBLISH_STATUSES)[number];

type StoredVideoRecord = {
  storyId?: unknown;
  videoId?: unknown;
  title?: unknown;
  status?: unknown;
  publishOn?: unknown;
  bucketName?: unknown;
  bucketKey?: unknown;
  bucketPath?: unknown;
  contentType?: unknown;
  uploadedAt?: unknown;
  updatedAt?: unknown;
  sourceVideoFileSizeBytes?: unknown;
  instagramPublishStatus?: unknown;
  instagramPublishedAt?: unknown;
  instagramMediaId?: unknown;
  instagramContainerId?: unknown;
  instagramLastError?: unknown;
  tiktokPublishStatus?: unknown;
  tiktokPublishedAt?: unknown;
  tiktokPublishId?: unknown;
  tiktokPostId?: unknown;
  tiktokLastError?: unknown;
  lastPublishAttemptAt?: unknown;
  publishAttemptCount?: unknown;
  lastPublishError?: unknown;
  publishLockToken?: unknown;
  publishLockExpiresAt?: unknown;
};

export type ScheduledVideoRecord = {
  storyId: string;
  videoId: string;
  title: string;
  status: string;
  publishOn?: string;
  bucketName?: string;
  bucketKey?: string;
  bucketPath?: string;
  contentType?: string;
  uploadedAt?: string;
  updatedAt?: string;
  sourceVideoFileSizeBytes?: number;
  instagramPublishStatus: PlatformPublishStatus;
  instagramPublishedAt?: string;
  instagramMediaId?: string;
  instagramContainerId?: string;
  instagramLastError?: string;
  tiktokPublishStatus: PlatformPublishStatus;
  tiktokPublishedAt?: string;
  tiktokPublishId?: string;
  tiktokPostId?: string;
  tiktokLastError?: string;
  lastPublishAttemptAt?: string;
  publishAttemptCount?: number;
  lastPublishError?: string;
  publishLockToken?: string;
  publishLockExpiresAt?: string;
};

type EnabledPlatforms = {
  instagram: boolean;
  tiktok: boolean;
};

type InstagramPublisherConfig = {
  accessToken: string;
  igUserId: string;
  apiVersion: string;
  shareToFeed: boolean;
};

type TikTokPublisherConfig = {
  accessToken: string;
  defaultPrivacyLevel: TikTokPrivacyLevel;
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
};

type PublisherConfig = {
  captionSuffix?: string;
  enabledPlatforms: EnabledPlatforms;
  instagram?: InstagramPublisherConfig;
  tiktok?: TikTokPublisherConfig;
};

type ClaimedVideo = {
  lockToken: string;
  video: ScheduledVideoRecord;
};

type PlatformAttemptResult =
  | {
      status: 'subido';
      publishedAt: string;
      containerId?: string;
      mediaId?: string;
      publishId?: string;
      postId?: string;
    }
  | {
      status: 'procesando';
      containerId?: string;
      publishId?: string;
    }
  | {
      status: 'error';
      error: string;
      containerId?: string;
      publishId?: string;
    };

type PlatformAttemptMap = {
  instagram?: PlatformAttemptResult;
  tiktok?: PlatformAttemptResult;
};

export type VideoPublicationSettlement = {
  status: string;
  updatedAt: string;
  instagramPublishStatus?: PlatformPublishStatus;
  instagramPublishedAt?: string;
  instagramMediaId?: string;
  instagramContainerId?: string;
  instagramLastError?: string;
  tiktokPublishStatus?: PlatformPublishStatus;
  tiktokPublishedAt?: string;
  tiktokPublishId?: string;
  tiktokPostId?: string;
  tiktokLastError?: string;
  lastPublishError?: string;
};

export type ScheduledVideoPublisherSummary = {
  processedAt: string;
  enabledPlatforms: EnabledPlatforms;
  dueVideos: number;
  claimedVideos: number;
  publishedVideos: number;
  stillProcessingVideos: number;
  failedVideos: number;
  skippedVideos: number;
  results: Array<{
    storyId: string;
    videoId: string;
    status: string;
    instagramStatus: PlatformPublishStatus;
    tiktokStatus: PlatformPublishStatus;
    message?: string;
  }>;
};

type InstagramContainerStatus = {
  id: string;
  statusCode: string;
  statusText?: string;
};

type TikTokCreatorInfo = {
  privacyLevelOptions: TikTokPrivacyLevel[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
};

type TikTokInitializeResponse = {
  publishId: string;
  uploadUrl: string;
};

type TikTokPublishStatusResponse = {
  status: string;
  failReason?: string;
  publiclyAvailablePostIds: string[];
};

type TikTokPrivacyLevel =
  | 'PUBLIC_TO_EVERYONE'
  | 'MUTUAL_FOLLOW_FRIENDS'
  | 'FOLLOWER_OF_CREATOR'
  | 'SELF_ONLY';

type UpdateExpressionParts = {
  UpdateExpression: string;
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, unknown>;
};

export async function publishScheduledVideos(
  nowInput?: string,
): Promise<ScheduledVideoPublisherSummary> {
  const now = asTimestamp(nowInput) || new Date().toISOString();
  const config = await loadPublisherConfig();
  const dueVideos = await listDueScheduledVideos(now);
  const summary: ScheduledVideoPublisherSummary = {
    processedAt: now,
    enabledPlatforms: config.enabledPlatforms,
    dueVideos: dueVideos.length,
    claimedVideos: 0,
    publishedVideos: 0,
    stillProcessingVideos: 0,
    failedVideos: 0,
    skippedVideos: 0,
    results: [],
  };

  if (!config.enabledPlatforms.instagram && !config.enabledPlatforms.tiktok) {
    return summary;
  }

  for (const video of dueVideos) {
    const claimed = await acquirePublishLock(video, now);
    if (!claimed) {
      summary.skippedVideos += 1;
      continue;
    }

    summary.claimedVideos += 1;
    const processed = await processClaimedVideo(claimed, config, now);
    const result = {
      storyId: processed.storyId,
      videoId: processed.videoId,
      status: processed.status,
      instagramStatus: processed.instagramPublishStatus,
      tiktokStatus: processed.tiktokPublishStatus,
      ...(processed.lastPublishError ? { message: processed.lastPublishError } : {}),
    };
    summary.results.push(result);

    if (processed.status === STATUS_SUBIDO) {
      summary.publishedVideos += 1;
      continue;
    }

    if (
      processed.instagramPublishStatus === 'procesando' ||
      processed.tiktokPublishStatus === 'procesando'
    ) {
      summary.stillProcessingVideos += 1;
      continue;
    }

    if (
      processed.instagramPublishStatus === 'error' ||
      processed.tiktokPublishStatus === 'error'
    ) {
      summary.failedVideos += 1;
      continue;
    }

    summary.skippedVideos += 1;
  }

  return summary;
}

export function buildVideoPublicationSettlement(
  video: ScheduledVideoRecord,
  enabledPlatforms: EnabledPlatforms,
  attempts: PlatformAttemptMap,
  now: string,
): VideoPublicationSettlement {
  const instagram = mergePlatformAttempt('instagram', video, attempts.instagram, now);
  const tiktok = mergePlatformAttempt('tiktok', video, attempts.tiktok, now);
  const errors = [instagram.lastError, tiktok.lastError].filter(Boolean);
  const instagramComplete = !enabledPlatforms.instagram || instagram.status === 'subido';
  const tiktokComplete = !enabledPlatforms.tiktok || tiktok.status === 'subido';

  return {
    status: instagramComplete && tiktokComplete ? STATUS_SUBIDO : STATUS_PROGRAMADO,
    updatedAt: now,
    instagramPublishStatus: instagram.status,
    instagramPublishedAt: instagram.publishedAt,
    instagramMediaId: instagram.mediaId,
    instagramContainerId: instagram.containerId,
    instagramLastError: instagram.lastError,
    tiktokPublishStatus: tiktok.status,
    tiktokPublishedAt: tiktok.publishedAt,
    tiktokPublishId: tiktok.publishId,
    tiktokPostId: tiktok.postId,
    tiktokLastError: tiktok.lastError,
    ...(errors.length ? { lastPublishError: errors.join(' | ') } : {}),
  };
}

export function chooseTikTokPrivacyLevel(
  options: TikTokPrivacyLevel[],
  desired: TikTokPrivacyLevel,
): TikTokPrivacyLevel {
  if (options.includes(desired)) {
    return desired;
  }

  if (options.includes('SELF_ONLY')) {
    return 'SELF_ONLY';
  }

  return options[0] || 'SELF_ONLY';
}

async function processClaimedVideo(
  claimed: ClaimedVideo,
  config: PublisherConfig,
  now: string,
): Promise<ScheduledVideoRecord> {
  const { video, lockToken } = claimed;
  const attempts: PlatformAttemptMap = {};

  if (!video.bucketName || !video.bucketKey) {
    const errorResult: PlatformAttemptResult = {
      status: 'error',
      error: 'El registro no tiene bucketName/bucketKey válidos para publicar.',
    };
    if (config.enabledPlatforms.instagram) {
      attempts.instagram = errorResult;
    }
    if (config.enabledPlatforms.tiktok) {
      attempts.tiktok = errorResult;
    }
  } else {
    const instagramConfig = config.instagram;
    if (config.enabledPlatforms.instagram && instagramConfig) {
      attempts.instagram = await safelyPublishPlatform(() =>
        publishToInstagram(video, instagramConfig, now),
      );
    }

    const tiktokConfig = config.tiktok;
    if (config.enabledPlatforms.tiktok && tiktokConfig) {
      attempts.tiktok = await safelyPublishPlatform(() =>
        publishToTikTok(video, tiktokConfig, now),
      );
    }
  }

  const settlement = buildVideoPublicationSettlement(
    video,
    config.enabledPlatforms,
    attempts,
    now,
  );

  return applyPublicationSettlement(video, settlement, lockToken);
}

async function safelyPublishPlatform(
  fn: () => Promise<PlatformAttemptResult>,
): Promise<PlatformAttemptResult> {
  try {
    return await fn();
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Error desconocido publicando video.',
    };
  }
}

async function publishToInstagram(
  video: ScheduledVideoRecord,
  config: InstagramPublisherConfig,
  now: string,
): Promise<PlatformAttemptResult> {
  if (video.instagramPublishStatus === 'procesando' && video.instagramContainerId) {
    return continueInstagramPublication(video.instagramContainerId, config, now);
  }

  const videoUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: video.bucketName,
      Key: video.bucketKey,
      ...(video.contentType ? { ResponseContentType: video.contentType } : {}),
    }),
    { expiresIn: S3_URL_EXPIRATION_SECONDS },
  );

  const containerId = await createInstagramContainer(videoUrl, video, config);
  return continueInstagramPublication(containerId, config, now);
}

async function continueInstagramPublication(
  containerId: string,
  config: InstagramPublisherConfig,
  now: string,
): Promise<PlatformAttemptResult> {
  for (let index = 0; index < INSTAGRAM_MAX_POLLS; index += 1) {
    const status = await getInstagramContainerStatus(containerId, config);

    if (status.statusCode === 'FINISHED') {
      const mediaId = await publishInstagramContainer(containerId, config);
      return {
        status: 'subido',
        publishedAt: now,
        containerId,
        mediaId,
      };
    }

    if (status.statusCode === 'ERROR' || status.statusCode === 'EXPIRED') {
      return {
        status: 'error',
        error: firstNonEmpty(status.statusText, `Instagram status ${status.statusCode}`) || 'Instagram no pudo procesar el video.',
        containerId,
      };
    }

    if (index < INSTAGRAM_MAX_POLLS - 1) {
      await sleep(INSTAGRAM_POLL_INTERVAL_MS);
    }
  }

  return {
    status: 'procesando',
    containerId,
  };
}

async function createInstagramContainer(
  videoUrl: string,
  video: ScheduledVideoRecord,
  config: InstagramPublisherConfig,
): Promise<string> {
  const endpoint = `https://graph.facebook.com/${config.apiVersion}/${encodeURIComponent(config.igUserId)}/media`;
  const body = new URLSearchParams({
    media_type: 'REELS',
    video_url: videoUrl,
    caption: buildSocialCaption(video),
    share_to_feed: String(config.shareToFeed),
    access_token: config.accessToken,
  });
  const payload = await fetchJson(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body,
  });
  const containerId = normalizeKey(payload?.id);

  if (!containerId) {
    throw new Error('Instagram no devolvió el container id del Reel.');
  }

  return containerId;
}

async function getInstagramContainerStatus(
  containerId: string,
  config: InstagramPublisherConfig,
): Promise<InstagramContainerStatus> {
  const query = new URLSearchParams({
    fields: 'status_code,status',
    access_token: config.accessToken,
  });
  const payload = await fetchJson(
    `https://graph.facebook.com/${config.apiVersion}/${encodeURIComponent(containerId)}?${query.toString()}`,
    {
      method: 'GET',
    },
  );

  return {
    id: normalizeKey(payload?.id) || containerId,
    statusCode: firstNonEmpty(asString(payload?.status_code), 'UNKNOWN') || 'UNKNOWN',
    ...(firstNonEmpty(asString(payload?.status)) ? { statusText: firstNonEmpty(asString(payload?.status)) } : {}),
  };
}

async function publishInstagramContainer(
  containerId: string,
  config: InstagramPublisherConfig,
): Promise<string> {
  const endpoint = `https://graph.facebook.com/${config.apiVersion}/${encodeURIComponent(config.igUserId)}/media_publish`;
  const body = new URLSearchParams({
    creation_id: containerId,
    access_token: config.accessToken,
  });
  const payload = await fetchJson(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body,
  });
  const mediaId = normalizeKey(payload?.id);

  if (!mediaId) {
    throw new Error('Instagram no devolvió el media id del Reel publicado.');
  }

  return mediaId;
}

async function publishToTikTok(
  video: ScheduledVideoRecord,
  config: TikTokPublisherConfig,
  now: string,
): Promise<PlatformAttemptResult> {
  if (video.tiktokPublishStatus === 'procesando' && video.tiktokPublishId) {
    return continueTikTokPublication(video.tiktokPublishId, config, now);
  }

  if (!video.bucketName || !video.bucketKey) {
    throw new Error('TikTok requiere bucketName y bucketKey para descargar el video.');
  }

  const creatorInfo = await queryTikTokCreatorInfo(config.accessToken);
  const objectMeta = await getStoredVideoObjectMeta(video.bucketName, video.bucketKey);
  const chunkSize = chooseTikTokChunkSize(objectMeta.sizeBytes);
  const init = await initializeTikTokDirectPost(video, config, creatorInfo, {
    sizeBytes: objectMeta.sizeBytes,
    chunkSize,
  });

  await uploadTikTokVideoChunks(
    {
      bucketName: video.bucketName,
      bucketKey: video.bucketKey,
      contentType: normalizeTikTokContentType(objectMeta.contentType || video.contentType),
      sizeBytes: objectMeta.sizeBytes,
    },
    init.uploadUrl,
    chunkSize,
  );

  return continueTikTokPublication(init.publishId, config, now);
}

async function continueTikTokPublication(
  publishId: string,
  config: TikTokPublisherConfig,
  now: string,
): Promise<PlatformAttemptResult> {
  for (let index = 0; index < TIKTOK_MAX_POLLS; index += 1) {
    const status = await fetchTikTokPublishStatus(publishId, config.accessToken);

    if (status.status === 'PUBLISH_COMPLETE') {
      return {
        status: 'subido',
        publishedAt: now,
        publishId,
        ...(status.publiclyAvailablePostIds[0]
          ? { postId: status.publiclyAvailablePostIds[0] }
          : {}),
      };
    }

    if (status.status === 'FAILED') {
      return {
        status: 'error',
        error: firstNonEmpty(status.failReason, 'TikTok devolvió FAILED al publicar.') || 'TikTok devolvió FAILED al publicar.',
        publishId,
      };
    }

    if (index < TIKTOK_MAX_POLLS - 1) {
      await sleep(TIKTOK_POLL_INTERVAL_MS);
    }
  }

  return {
    status: 'procesando',
    publishId,
  };
}

async function queryTikTokCreatorInfo(accessToken: string): Promise<TikTokCreatorInfo> {
  const payload = await fetchJson('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({}),
  });
  const data = asRecord(payload?.data) || {};

  return {
    privacyLevelOptions: asStringArray(data.privacy_level_options)
      .map((item) => normalizeTikTokPrivacyLevel(item))
      .filter((item): item is TikTokPrivacyLevel => !!item),
    commentDisabled: asBoolean(data.comment_disabled),
    duetDisabled: asBoolean(data.duet_disabled),
    stitchDisabled: asBoolean(data.stitch_disabled),
  };
}

async function initializeTikTokDirectPost(
  video: ScheduledVideoRecord,
  config: TikTokPublisherConfig,
  creatorInfo: TikTokCreatorInfo,
  sourceInfo: {
    sizeBytes: number;
    chunkSize: number;
  },
): Promise<TikTokInitializeResponse> {
  const privacyLevel = chooseTikTokPrivacyLevel(
    creatorInfo.privacyLevelOptions,
    config.defaultPrivacyLevel,
  );
  const totalChunkCount = Math.ceil(sourceInfo.sizeBytes / sourceInfo.chunkSize);
  const payload = await fetchJson('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      post_info: {
        title: buildSocialCaption(video),
        privacy_level: privacyLevel,
        disable_comment: creatorInfo.commentDisabled || config.disableComment,
        disable_duet: creatorInfo.duetDisabled || config.disableDuet,
        disable_stitch: creatorInfo.stitchDisabled || config.disableStitch,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: sourceInfo.sizeBytes,
        chunk_size: sourceInfo.chunkSize,
        total_chunk_count: totalChunkCount,
      },
    }),
  });
  const data = asRecord(payload?.data);
  const publishId = normalizeKey(data?.publish_id);
  const uploadUrl = firstNonEmpty(asString(data?.upload_url));

  if (!publishId || !uploadUrl) {
    throw new Error('TikTok no devolvió publish_id o upload_url válidos.');
  }

  return {
    publishId,
    uploadUrl,
  };
}

async function uploadTikTokVideoChunks(
  input: {
    bucketName: string;
    bucketKey: string;
    contentType: string;
    sizeBytes: number;
  },
  uploadUrl: string,
  chunkSize: number,
): Promise<void> {
  let start = 0;

  while (start < input.sizeBytes) {
    const end = Math.min(start + chunkSize, input.sizeBytes) - 1;
    const chunk = await readS3ByteRange(input.bucketName, input.bucketKey, start, end);
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': input.contentType,
        'Content-Length': String(chunk.byteLength),
        'Content-Range': `bytes ${start}-${end}/${input.sizeBytes}`,
      },
      body: chunk,
    });

    if (!response.ok) {
      throw new Error(`TikTok rechazó el upload del chunk. HTTP ${response.status}`);
    }

    start = end + 1;
  }
}

async function fetchTikTokPublishStatus(
  publishId: string,
  accessToken: string,
): Promise<TikTokPublishStatusResponse> {
  const payload = await fetchJson('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      publish_id: publishId,
    }),
  });
  const data = asRecord(payload?.data) || {};

  return {
    status: firstNonEmpty(asString(data.status), 'UNKNOWN') || 'UNKNOWN',
    ...(firstNonEmpty(asString(data.fail_reason))
      ? { failReason: firstNonEmpty(asString(data.fail_reason)) }
      : {}),
    publiclyAvailablePostIds: asStringArray(data.publicaly_available_post_id),
  };
}

async function listDueScheduledVideos(now: string): Promise<ScheduledVideoRecord[]> {
  const videos: ScheduledVideoRecord[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const result = await dynamo.send(
      new QueryCommand({
        TableName: getGeneratedVideosTableName(),
        IndexName: getGeneratedVideosStatusIndexName(),
        KeyConditionExpression: '#status = :status AND publishOn <= :publishOn',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': STATUS_PROGRAMADO,
          ':publishOn': now,
        },
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );

    for (const item of result.Items || []) {
      const video = toScheduledVideoRecord(item);
      if (video) {
        videos.push(video);
      }
    }

    exclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);

  return videos;
}

async function acquirePublishLock(
  video: ScheduledVideoRecord,
  now: string,
): Promise<ClaimedVideo | undefined> {
  const lockToken = randomUUID();
  const lockExpiresAt = new Date(Date.parse(now) + LOCK_WINDOW_MS).toISOString();

  try {
    const result = await dynamo.send(
      new UpdateCommand({
        TableName: getGeneratedVideosTableName(),
        Key: {
          storyId: video.storyId,
          videoId: video.videoId,
        },
        UpdateExpression:
          'SET publishLockToken = :lockToken, publishLockExpiresAt = :lockExpiresAt, lastPublishAttemptAt = :now, updatedAt = :now, publishAttemptCount = if_not_exists(publishAttemptCount, :zero) + :one',
        ConditionExpression:
          '#status = :status AND publishOn <= :now AND (attribute_not_exists(publishLockExpiresAt) OR publishLockExpiresAt < :now)',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':lockToken': lockToken,
          ':lockExpiresAt': lockExpiresAt,
          ':status': STATUS_PROGRAMADO,
          ':now': now,
          ':zero': 0,
          ':one': 1,
        },
        ReturnValues: 'ALL_NEW',
      }),
    );

    const lockedVideo = toScheduledVideoRecord(result.Attributes);
    if (!lockedVideo) {
      return undefined;
    }

    return {
      lockToken,
      video: lockedVideo,
    };
  } catch (error) {
    if (isConditionalCheckFailed(error)) {
      return undefined;
    }
    throw error;
  }
}

async function applyPublicationSettlement(
  video: ScheduledVideoRecord,
  settlement: VideoPublicationSettlement,
  lockToken: string,
): Promise<ScheduledVideoRecord> {
  const updateParts = buildUpdateExpression({
    status: settlement.status,
    updatedAt: settlement.updatedAt,
    instagramPublishStatus: settlement.instagramPublishStatus,
    instagramPublishedAt: settlement.instagramPublishedAt,
    instagramMediaId: settlement.instagramMediaId,
    instagramContainerId: settlement.instagramContainerId,
    instagramLastError: settlement.instagramLastError,
    tiktokPublishStatus: settlement.tiktokPublishStatus,
    tiktokPublishedAt: settlement.tiktokPublishedAt,
    tiktokPublishId: settlement.tiktokPublishId,
    tiktokPostId: settlement.tiktokPostId,
    tiktokLastError: settlement.tiktokLastError,
    lastPublishError: settlement.lastPublishError,
    publishLockToken: undefined,
    publishLockExpiresAt: undefined,
  });
  const result = await dynamo.send(
    new UpdateCommand({
      TableName: getGeneratedVideosTableName(),
      Key: {
        storyId: video.storyId,
        videoId: video.videoId,
      },
      ...updateParts,
      ConditionExpression: '#publishLockToken = :expectedLockToken',
      ExpressionAttributeNames: {
        ...updateParts.ExpressionAttributeNames,
        '#publishLockToken': 'publishLockToken',
      },
      ExpressionAttributeValues: {
        ...updateParts.ExpressionAttributeValues,
        ':expectedLockToken': lockToken,
      },
      ReturnValues: 'ALL_NEW',
    }),
  );
  const updated = toScheduledVideoRecord(result.Attributes);

  if (!updated) {
    throw new Error('No pudimos reconstruir el video después de actualizar su publicación.');
  }

  return updated;
}

function mergePlatformAttempt(
  platform: 'instagram' | 'tiktok',
  video: ScheduledVideoRecord,
  attempt: PlatformAttemptResult | undefined,
  now: string,
): {
  status: PlatformPublishStatus;
  publishedAt?: string;
  mediaId?: string;
  containerId?: string;
  publishId?: string;
  postId?: string;
  lastError?: string;
} {
  if (platform === 'instagram') {
    if (!attempt) {
      return {
        status: video.instagramPublishStatus,
        publishedAt: video.instagramPublishedAt,
        mediaId: video.instagramMediaId,
        containerId: video.instagramContainerId,
        lastError: video.instagramLastError,
      };
    }

    if (attempt.status === 'subido') {
      return {
        status: 'subido',
        publishedAt: attempt.publishedAt || now,
        mediaId: attempt.mediaId,
        containerId: attempt.containerId,
      };
    }

    if (attempt.status === 'procesando') {
      return {
        status: 'procesando',
        publishedAt: video.instagramPublishedAt,
        mediaId: video.instagramMediaId,
        containerId: attempt.containerId || video.instagramContainerId,
      };
    }

    return {
      status: 'error',
      publishedAt: video.instagramPublishedAt,
      mediaId: video.instagramMediaId,
      containerId: attempt.containerId || video.instagramContainerId,
      lastError: attempt.error,
    };
  }

  if (!attempt) {
    return {
      status: video.tiktokPublishStatus,
      publishedAt: video.tiktokPublishedAt,
      publishId: video.tiktokPublishId,
      postId: video.tiktokPostId,
      lastError: video.tiktokLastError,
    };
  }

  if (attempt.status === 'subido') {
    return {
      status: 'subido',
      publishedAt: attempt.publishedAt || now,
      publishId: attempt.publishId,
      postId: attempt.postId,
    };
  }

  if (attempt.status === 'procesando') {
    return {
      status: 'procesando',
      publishedAt: video.tiktokPublishedAt,
      publishId: attempt.publishId || video.tiktokPublishId,
      postId: video.tiktokPostId,
    };
  }

  return {
    status: 'error',
    publishedAt: video.tiktokPublishedAt,
    publishId: attempt.publishId || video.tiktokPublishId,
    postId: video.tiktokPostId,
    lastError: attempt.error,
  };
}

async function loadPublisherConfig(): Promise<PublisherConfig> {
  const enabledPlatforms: EnabledPlatforms = {
    instagram: asBoolean(process.env.INSTAGRAM_AUTOPUBLISH_ENABLED),
    tiktok: asBoolean(process.env.TIKTOK_AUTOPUBLISH_ENABLED),
  };

  const config: PublisherConfig = {
    enabledPlatforms,
    captionSuffix: firstNonEmpty(process.env.SOCIAL_POST_CAPTION_SUFFIX),
  };

  if (enabledPlatforms.instagram) {
    const accessToken = await getSecretValue({
      directValue: process.env.INSTAGRAM_ACCESS_TOKEN,
      paramName: process.env.INSTAGRAM_ACCESS_TOKEN_PARAM,
    });
    const igUserId = normalizeKey(process.env.INSTAGRAM_IG_USER_ID);

    if (!accessToken || !igUserId) {
      throw new Error('Configura INSTAGRAM_ACCESS_TOKEN(_PARAM) e INSTAGRAM_IG_USER_ID para autopublicar en Instagram.');
    }

    config.instagram = {
      accessToken,
      igUserId,
      apiVersion: firstNonEmpty(process.env.INSTAGRAM_GRAPH_API_VERSION, 'v23.0') || 'v23.0',
      shareToFeed: asBoolean(process.env.INSTAGRAM_SHARE_TO_FEED),
    };
  }

  if (enabledPlatforms.tiktok) {
    const accessToken = await getSecretValue({
      directValue: process.env.TIKTOK_ACCESS_TOKEN,
      paramName: process.env.TIKTOK_ACCESS_TOKEN_PARAM,
    });

    if (!accessToken) {
      throw new Error('Configura TIKTOK_ACCESS_TOKEN(_PARAM) para autopublicar en TikTok.');
    }

    config.tiktok = {
      accessToken,
      defaultPrivacyLevel:
        normalizeTikTokPrivacyLevel(process.env.TIKTOK_DEFAULT_PRIVACY_LEVEL) || 'SELF_ONLY',
      disableComment: asBoolean(process.env.TIKTOK_DISABLE_COMMENT),
      disableDuet: asBoolean(process.env.TIKTOK_DISABLE_DUET),
      disableStitch: asBoolean(process.env.TIKTOK_DISABLE_STITCH),
    };
  }

  return config;
}

async function getSecretValue(input: {
  directValue?: string;
  paramName?: string;
}): Promise<string | undefined> {
  const directValue = firstNonEmpty(input.directValue);
  if (directValue && directValue !== 'SET_IN_SSM') {
    return directValue;
  }

  const paramName = firstNonEmpty(input.paramName);
  if (!paramName) {
    return undefined;
  }

  const result = await ssm.send(
    new GetParameterCommand({
      Name: paramName,
      WithDecryption: true,
    }),
  );
  const value = firstNonEmpty(result.Parameter?.Value);

  return value && value !== 'SET_IN_SSM' ? value : undefined;
}

async function getStoredVideoObjectMeta(
  bucketName: string,
  bucketKey: string,
): Promise<{ sizeBytes: number; contentType?: string }> {
  const head = await s3.send(
    new HeadObjectCommand({
      Bucket: bucketName,
      Key: bucketKey,
    }),
  );
  const sizeBytes = head.ContentLength;

  if (!sizeBytes || sizeBytes <= 0) {
    throw new Error('No pudimos resolver el tamaño actual del video en S3.');
  }

  return {
    sizeBytes,
    ...(firstNonEmpty(head.ContentType) ? { contentType: firstNonEmpty(head.ContentType) } : {}),
  };
}

async function readS3ByteRange(
  bucketName: string,
  bucketKey: string,
  start: number,
  end: number,
): Promise<Uint8Array> {
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: bucketKey,
      Range: `bytes=${start}-${end}`,
    }),
  );

  if (!response.Body) {
    throw new Error('S3 no devolvió contenido para el rango solicitado.');
  }

  return readBodyToUint8Array(response.Body);
}

async function readBodyToUint8Array(body: unknown): Promise<Uint8Array> {
  if (
    body &&
    typeof body === 'object' &&
    'transformToByteArray' in body &&
    typeof (body as { transformToByteArray?: unknown }).transformToByteArray === 'function'
  ) {
    return Uint8Array.from(await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray());
  }

  if (
    body &&
    typeof body === 'object' &&
    Symbol.asyncIterator in (body as AsyncIterable<Uint8Array>)
  ) {
    const chunks: Uint8Array[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array | Buffer | string>) {
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
      } else {
        chunks.push(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
      }
    }
    return Uint8Array.from(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))));
  }

  throw new Error('No pudimos leer el cuerpo del objeto de S3.');
}

function buildSocialCaption(video: ScheduledVideoRecord): string {
  const pieces = [
    firstNonEmpty(video.title, video.storyId),
    firstNonEmpty(process.env.SOCIAL_POST_CAPTION_SUFFIX),
  ].filter(Boolean);
  const caption = pieces.join('\n\n').trim();

  return caption.slice(0, 2200);
}

function chooseTikTokChunkSize(sizeBytes: number): number {
  if (sizeBytes <= TIKTOK_MIN_CHUNK_SIZE) {
    return sizeBytes;
  }

  if (sizeBytes <= TIKTOK_MAX_CHUNK_SIZE) {
    return sizeBytes;
  }

  const minChunkSizeForCount = Math.ceil(sizeBytes / TIKTOK_MAX_CHUNKS);
  const normalized = Math.max(
    TIKTOK_MIN_CHUNK_SIZE,
    minChunkSizeForCount,
    TIKTOK_PREFERRED_CHUNK_SIZE,
  );

  return Math.min(normalized, TIKTOK_MAX_CHUNK_SIZE);
}

function normalizeTikTokContentType(value?: string): string {
  const contentType = firstNonEmpty(value)?.toLowerCase();
  if (contentType === 'video/mp4' || contentType === 'video/quicktime' || contentType === 'video/webm') {
    return contentType;
  }
  return 'video/mp4';
}

function normalizeTikTokPrivacyLevel(value: unknown): TikTokPrivacyLevel | undefined {
  const normalized = asString(value)?.trim().toUpperCase();
  if (
    normalized === 'PUBLIC_TO_EVERYONE' ||
    normalized === 'MUTUAL_FOLLOW_FRIENDS' ||
    normalized === 'FOLLOWER_OF_CREATOR' ||
    normalized === 'SELF_ONLY'
  ) {
    return normalized;
  }
  return undefined;
}

async function fetchJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, init);
  const payload = await parseJsonResponse(response);
  const topLevelError = asRecord(payload?.error);

  if (!response.ok || (topLevelError && firstNonEmpty(asString(topLevelError.code)) !== 'ok' && firstNonEmpty(asString(topLevelError.message)))) {
    const message =
      firstNonEmpty(
        asString(topLevelError?.message),
        asString((asRecord(payload?.error) || {}).error_user_msg),
        asString((asRecord(payload?.error) || {}).error_user_title),
      ) || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function parseJsonResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Respuesta JSON inválida de ${response.url || 'endpoint remoto'}.`);
  }
}

function buildUpdateExpression(values: Record<string, unknown>): UpdateExpressionParts {
  const setParts: string[] = [];
  const removeParts: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};
  let index = 0;

  for (const [key, value] of Object.entries(values)) {
    const nameKey = `#field${index}`;
    expressionAttributeNames[nameKey] = key;

    if (value === undefined) {
      removeParts.push(nameKey);
    } else {
      const valueKey = `:value${index}`;
      expressionAttributeValues[valueKey] = value;
      setParts.push(`${nameKey} = ${valueKey}`);
    }

    index += 1;
  }

  const parts: string[] = [];
  if (setParts.length) {
    parts.push(`SET ${setParts.join(', ')}`);
  }
  if (removeParts.length) {
    parts.push(`REMOVE ${removeParts.join(', ')}`);
  }

  return {
    UpdateExpression: parts.join(' '),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };
}

function toScheduledVideoRecord(input: unknown): ScheduledVideoRecord | undefined {
  const raw = asRecord(input) as StoredVideoRecord | undefined;
  const storyId = normalizeKey(raw?.storyId);
  const videoId = normalizeKey(raw?.videoId);
  const status = normalizeKey(raw?.status);

  if (!storyId || !videoId || !status) {
    return undefined;
  }

  return {
    storyId,
    videoId,
    title: firstNonEmpty(asString(raw?.title), storyId) || storyId,
    status,
    ...(asTimestamp(raw?.publishOn) ? { publishOn: asTimestamp(raw?.publishOn) } : {}),
    ...(firstNonEmpty(asString(raw?.bucketName)) ? { bucketName: firstNonEmpty(asString(raw?.bucketName)) } : {}),
    ...(firstNonEmpty(asString(raw?.bucketKey)) ? { bucketKey: firstNonEmpty(asString(raw?.bucketKey)) } : {}),
    ...(firstNonEmpty(asString(raw?.bucketPath)) ? { bucketPath: firstNonEmpty(asString(raw?.bucketPath)) } : {}),
    ...(firstNonEmpty(asString(raw?.contentType)) ? { contentType: firstNonEmpty(asString(raw?.contentType)) } : {}),
    ...(asTimestamp(raw?.uploadedAt) ? { uploadedAt: asTimestamp(raw?.uploadedAt) } : {}),
    ...(asTimestamp(raw?.updatedAt) ? { updatedAt: asTimestamp(raw?.updatedAt) } : {}),
    ...(asNumber(raw?.sourceVideoFileSizeBytes) !== undefined
      ? { sourceVideoFileSizeBytes: asNumber(raw?.sourceVideoFileSizeBytes) }
      : {}),
    instagramPublishStatus: normalizePlatformPublishStatus(raw?.instagramPublishStatus),
    ...(asTimestamp(raw?.instagramPublishedAt)
      ? { instagramPublishedAt: asTimestamp(raw?.instagramPublishedAt) }
      : {}),
    ...(firstNonEmpty(asString(raw?.instagramMediaId))
      ? { instagramMediaId: firstNonEmpty(asString(raw?.instagramMediaId)) }
      : {}),
    ...(firstNonEmpty(asString(raw?.instagramContainerId))
      ? { instagramContainerId: firstNonEmpty(asString(raw?.instagramContainerId)) }
      : {}),
    ...(firstNonEmpty(asString(raw?.instagramLastError))
      ? { instagramLastError: firstNonEmpty(asString(raw?.instagramLastError)) }
      : {}),
    tiktokPublishStatus: normalizePlatformPublishStatus(raw?.tiktokPublishStatus),
    ...(asTimestamp(raw?.tiktokPublishedAt)
      ? { tiktokPublishedAt: asTimestamp(raw?.tiktokPublishedAt) }
      : {}),
    ...(firstNonEmpty(asString(raw?.tiktokPublishId))
      ? { tiktokPublishId: firstNonEmpty(asString(raw?.tiktokPublishId)) }
      : {}),
    ...(firstNonEmpty(asString(raw?.tiktokPostId))
      ? { tiktokPostId: firstNonEmpty(asString(raw?.tiktokPostId)) }
      : {}),
    ...(firstNonEmpty(asString(raw?.tiktokLastError))
      ? { tiktokLastError: firstNonEmpty(asString(raw?.tiktokLastError)) }
      : {}),
    ...(asTimestamp(raw?.lastPublishAttemptAt)
      ? { lastPublishAttemptAt: asTimestamp(raw?.lastPublishAttemptAt) }
      : {}),
    ...(asNumber(raw?.publishAttemptCount) !== undefined
      ? { publishAttemptCount: asNumber(raw?.publishAttemptCount) }
      : {}),
    ...(firstNonEmpty(asString(raw?.lastPublishError))
      ? { lastPublishError: firstNonEmpty(asString(raw?.lastPublishError)) }
      : {}),
    ...(firstNonEmpty(asString(raw?.publishLockToken))
      ? { publishLockToken: firstNonEmpty(asString(raw?.publishLockToken)) }
      : {}),
    ...(asTimestamp(raw?.publishLockExpiresAt)
      ? { publishLockExpiresAt: asTimestamp(raw?.publishLockExpiresAt) }
      : {}),
  };
}

function normalizePlatformPublishStatus(value: unknown): PlatformPublishStatus {
  const normalized = asString(value)?.trim().toLowerCase();
  if ((PLATFORM_PUBLISH_STATUSES as readonly string[]).includes(normalized || '')) {
    return normalized as PlatformPublishStatus;
  }
  return 'pendiente';
}

function getGeneratedVideosTableName(): string {
  const tableName = process.env.GENERATED_VIDEOS_TABLE_NAME;
  if (!tableName) {
    throw new Error('GENERATED_VIDEOS_TABLE_NAME not set');
  }
  return tableName;
}

function getGeneratedVideosStatusIndexName(): string {
  const indexName = process.env.GENERATED_VIDEOS_STATUS_PUBLISH_ON_INDEX_NAME;
  if (!indexName) {
    throw new Error('GENERATED_VIDEOS_STATUS_PUBLISH_ON_INDEX_NAME not set');
  }
  return indexName;
}

function isConditionalCheckFailed(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: string }).name === 'ConditionalCheckFailedException'
  );
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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item): item is string => !!item);
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  return false;
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
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed.toISOString();
}

function normalizeKey(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  return normalized || undefined;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
