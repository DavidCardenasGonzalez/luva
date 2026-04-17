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

function logPublisher(scope: string, details: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      scope: `video-publisher.${scope}`,
      ...sanitizeLogValue(details) as Record<string, unknown>,
    }),
  );
}

function sanitizeLogValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item));
  }

  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      output[key] = isSecretLogKey(key) ? '[redacted]' : sanitizeLogValue(raw);
    }
    return output;
  }

  return value;
}

function isSecretLogKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    normalized === 'authorization' ||
    normalized === 'password' ||
    normalized === 'token' ||
    normalized === 'accesstoken' ||
    normalized === 'refreshtoken' ||
    normalized === 'idtoken' ||
    normalized.includes('access_token') ||
    normalized.includes('refresh_token') ||
    normalized.includes('clientsecret') ||
    normalized.endsWith('secret') ||
    normalized.includes('signedurl') ||
    normalized.includes('videourl') ||
    normalized.includes('uploadurl')
  );
}

function logVideoFields(video: ScheduledVideoRecord): Record<string, unknown> {
  return {
    storyId: video.storyId,
    videoId: video.videoId,
    title: video.title,
    status: video.status,
    publishOn: video.publishOn,
    bucketName: video.bucketName,
    bucketKey: video.bucketKey,
    instagramPublishStatus: video.instagramPublishStatus,
    instagramContainerId: video.instagramContainerId,
    tiktokPublishStatus: video.tiktokPublishStatus,
    tiktokPublishId: video.tiktokPublishId,
    publishAttemptCount: video.publishAttemptCount,
    lastPublishAttemptAt: video.lastPublishAttemptAt,
  };
}

function logAttemptFields(attempt?: PlatformAttemptResult): Record<string, unknown> {
  if (!attempt) {
    return { status: 'not_attempted' };
  }

  return {
    status: attempt.status,
    containerId: 'containerId' in attempt ? attempt.containerId : undefined,
    mediaId: 'mediaId' in attempt ? attempt.mediaId : undefined,
    publishId: 'publishId' in attempt ? attempt.publishId : undefined,
    postId: 'postId' in attempt ? attempt.postId : undefined,
    error: 'error' in attempt ? attempt.error : undefined,
  };
}

function safeEndpoint(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0] || url;
  }
}

export async function publishScheduledVideos(
  nowInput?: string,
): Promise<ScheduledVideoPublisherSummary> {
  const now = asTimestamp(nowInput) || new Date().toISOString();
  logPublisher('run.start', {
    now,
    nowInput,
  });
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
  logPublisher('run.loaded', {
    now,
    enabledPlatforms: config.enabledPlatforms,
    dueVideos: dueVideos.length,
  });

  if (!config.enabledPlatforms.instagram && !config.enabledPlatforms.tiktok) {
    logPublisher('run.skip.no_platforms_enabled', {
      now,
      summary,
    });
    return summary;
  }

  for (const video of dueVideos) {
    logPublisher('video.candidate', logVideoFields(video));
    const claimed = await acquirePublishLock(video, now);
    if (!claimed) {
      logPublisher('video.lock.skipped', {
        ...logVideoFields(video),
        reason: 'not_claimed',
      });
      summary.skippedVideos += 1;
      continue;
    }

    summary.claimedVideos += 1;
    logPublisher('video.lock.claimed', {
      ...logVideoFields(claimed.video),
      lockToken: claimed.lockToken,
    });
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
    logPublisher('video.processed', {
      ...logVideoFields(processed),
      result,
    });

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

  logPublisher('run.complete', {
    summary,
  });
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
  logPublisher('video.process.start', {
    ...logVideoFields(video),
    enabledPlatforms: config.enabledPlatforms,
  });

  if (!video.bucketName || !video.bucketKey) {
    const errorResult: PlatformAttemptResult = {
      status: 'error',
      error: 'El registro no tiene bucketName/bucketKey válidos para publicar.',
    };
    logPublisher('video.process.missing_source', {
      ...logVideoFields(video),
      error: errorResult.error,
    });
    if (config.enabledPlatforms.instagram) {
      attempts.instagram = errorResult;
    }
    if (config.enabledPlatforms.tiktok) {
      attempts.tiktok = errorResult;
    }
  } else {
    const instagramConfig = config.instagram;
    if (config.enabledPlatforms.instagram && instagramConfig) {
      logPublisher('platform.instagram.start', logVideoFields(video));
      attempts.instagram = await safelyPublishPlatform('instagram', video, () =>
        publishToInstagram(video, instagramConfig, now),
      );
      logPublisher('platform.instagram.result', {
        ...logVideoFields(video),
        attempt: logAttemptFields(attempts.instagram),
      });
    }

    const tiktokConfig = config.tiktok;
    if (config.enabledPlatforms.tiktok && tiktokConfig) {
      logPublisher('platform.tiktok.start', logVideoFields(video));
      attempts.tiktok = await safelyPublishPlatform('tiktok', video, () =>
        publishToTikTok(video, tiktokConfig, now),
      );
      logPublisher('platform.tiktok.result', {
        ...logVideoFields(video),
        attempt: logAttemptFields(attempts.tiktok),
      });
    }
  }

  const settlement = buildVideoPublicationSettlement(
    video,
    config.enabledPlatforms,
    attempts,
    now,
  );
  logPublisher('video.settlement.built', {
    ...logVideoFields(video),
    instagramAttempt: logAttemptFields(attempts.instagram),
    tiktokAttempt: logAttemptFields(attempts.tiktok),
    settlement,
  });

  return applyPublicationSettlement(video, settlement, lockToken);
}

async function safelyPublishPlatform(
  platform: 'instagram' | 'tiktok',
  video: ScheduledVideoRecord,
  fn: () => Promise<PlatformAttemptResult>,
): Promise<PlatformAttemptResult> {
  try {
    const result = await fn();
    logPublisher('platform.safe.success', {
      platform,
      ...logVideoFields(video),
      attempt: logAttemptFields(result),
    });
    return result;
  } catch (error) {
    logPublisher('platform.safe.error', {
      platform,
      ...logVideoFields(video),
      error,
    });
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
  logPublisher('instagram.publish.start', {
    ...logVideoFields(video),
    apiVersion: config.apiVersion,
    igUserId: config.igUserId,
    shareToFeed: config.shareToFeed,
  });

  if (video.instagramPublishStatus === 'procesando' && video.instagramContainerId) {
    logPublisher('instagram.publish.continue_existing', {
      ...logVideoFields(video),
      containerId: video.instagramContainerId,
    });
    return continueInstagramPublication(video.instagramContainerId, config, now);
  }

  logPublisher('instagram.s3.signed_url.start', {
    bucketName: video.bucketName,
    bucketKey: video.bucketKey,
    contentType: video.contentType,
    expiresIn: S3_URL_EXPIRATION_SECONDS,
  });
  const videoUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: video.bucketName,
      Key: video.bucketKey,
      ...(video.contentType ? { ResponseContentType: video.contentType } : {}),
    }),
    { expiresIn: S3_URL_EXPIRATION_SECONDS },
  );
  logPublisher('instagram.s3.signed_url.created', {
    bucketName: video.bucketName,
    bucketKey: video.bucketKey,
    expiresIn: S3_URL_EXPIRATION_SECONDS,
    signedUrl: videoUrl,
  });

  const containerId = await createInstagramContainer(videoUrl, video, config);
  logPublisher('instagram.container.created', {
    ...logVideoFields(video),
    containerId,
  });
  return continueInstagramPublication(containerId, config, now);
}

async function continueInstagramPublication(
  containerId: string,
  config: InstagramPublisherConfig,
  now: string,
): Promise<PlatformAttemptResult> {
  logPublisher('instagram.poll.start', {
    containerId,
    maxPolls: INSTAGRAM_MAX_POLLS,
    pollIntervalMs: INSTAGRAM_POLL_INTERVAL_MS,
  });

  for (let index = 0; index < INSTAGRAM_MAX_POLLS; index += 1) {
    const status = await getInstagramContainerStatus(containerId, config);
    logPublisher('instagram.poll.status', {
      containerId,
      pollIndex: index + 1,
      maxPolls: INSTAGRAM_MAX_POLLS,
      statusCode: status.statusCode,
      statusText: status.statusText,
    });

    if (status.statusCode === 'FINISHED') {
      logPublisher('instagram.publish_container.start', {
        containerId,
      });
      const mediaId = await publishInstagramContainer(containerId, config);
      logPublisher('instagram.poll.finished', {
        containerId,
        mediaId,
      });
      return {
        status: 'subido',
        publishedAt: now,
        containerId,
        mediaId,
      };
    }

    if (status.statusCode === 'ERROR' || status.statusCode === 'EXPIRED') {
      logPublisher('instagram.poll.failed', {
        containerId,
        statusCode: status.statusCode,
        statusText: status.statusText,
      });
      return {
        status: 'error',
        error: firstNonEmpty(status.statusText, `Instagram status ${status.statusCode}`) || 'Instagram no pudo procesar el video.',
        containerId,
      };
    }

    if (index < INSTAGRAM_MAX_POLLS - 1) {
      logPublisher('instagram.poll.sleep', {
        containerId,
        nextPollIndex: index + 2,
        pollIntervalMs: INSTAGRAM_POLL_INTERVAL_MS,
      });
      await sleep(INSTAGRAM_POLL_INTERVAL_MS);
    }
  }

  logPublisher('instagram.poll.timeout', {
    containerId,
    maxPolls: INSTAGRAM_MAX_POLLS,
  });
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
  logPublisher('instagram.container.create.request', {
    endpoint: safeEndpoint(endpoint),
    igUserId: config.igUserId,
    mediaType: 'REELS',
    shareToFeed: config.shareToFeed,
    captionLength: buildSocialCaption(video).length,
    videoUrl,
  });
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
    logPublisher('instagram.container.create.invalid_response', {
      endpoint: safeEndpoint(endpoint),
      payloadKeys: Object.keys(payload || {}),
    });
    throw new Error('Instagram no devolvió el container id del Reel.');
  }

  logPublisher('instagram.container.create.response', {
    endpoint: safeEndpoint(endpoint),
    containerId,
  });
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
  const endpoint = `https://graph.facebook.com/${config.apiVersion}/${encodeURIComponent(containerId)}?${query.toString()}`;
  logPublisher('instagram.container.status.request', {
    endpoint: safeEndpoint(endpoint),
    containerId,
  });
  const payload = await fetchJson(
    endpoint,
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
  logPublisher('instagram.container.publish.request', {
    endpoint: safeEndpoint(endpoint),
    igUserId: config.igUserId,
    containerId,
  });
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
    logPublisher('instagram.container.publish.invalid_response', {
      endpoint: safeEndpoint(endpoint),
      containerId,
      payloadKeys: Object.keys(payload || {}),
    });
    throw new Error('Instagram no devolvió el media id del Reel publicado.');
  }

  logPublisher('instagram.container.publish.response', {
    endpoint: safeEndpoint(endpoint),
    containerId,
    mediaId,
  });
  return mediaId;
}

async function publishToTikTok(
  video: ScheduledVideoRecord,
  config: TikTokPublisherConfig,
  now: string,
): Promise<PlatformAttemptResult> {
  logPublisher('tiktok.publish.start', {
    ...logVideoFields(video),
    defaultPrivacyLevel: config.defaultPrivacyLevel,
    disableComment: config.disableComment,
    disableDuet: config.disableDuet,
    disableStitch: config.disableStitch,
  });

  if (video.tiktokPublishStatus === 'procesando' && video.tiktokPublishId) {
    logPublisher('tiktok.publish.continue_existing', {
      ...logVideoFields(video),
      publishId: video.tiktokPublishId,
    });
    return continueTikTokPublication(video.tiktokPublishId, config, now);
  }

  if (!video.bucketName || !video.bucketKey) {
    logPublisher('tiktok.publish.missing_source', logVideoFields(video));
    throw new Error('TikTok requiere bucketName y bucketKey para descargar el video.');
  }

  const creatorInfo = await queryTikTokCreatorInfo(config.accessToken);
  logPublisher('tiktok.creator_info.loaded', {
    ...logVideoFields(video),
    privacyLevelOptions: creatorInfo.privacyLevelOptions,
    commentDisabled: creatorInfo.commentDisabled,
    duetDisabled: creatorInfo.duetDisabled,
    stitchDisabled: creatorInfo.stitchDisabled,
  });
  const objectMeta = await getStoredVideoObjectMeta(video.bucketName, video.bucketKey);
  const chunkSize = chooseTikTokChunkSize(objectMeta.sizeBytes);
  logPublisher('tiktok.source.meta_loaded', {
    ...logVideoFields(video),
    objectMeta,
    chunkSize,
    totalChunkCount: Math.ceil(objectMeta.sizeBytes / chunkSize),
  });
  const init = await initializeTikTokDirectPost(video, config, creatorInfo, {
    sizeBytes: objectMeta.sizeBytes,
    chunkSize,
  });
  logPublisher('tiktok.direct_post.initialized', {
    ...logVideoFields(video),
    publishId: init.publishId,
    uploadUrl: init.uploadUrl,
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
  logPublisher('tiktok.upload.complete', {
    ...logVideoFields(video),
    publishId: init.publishId,
    sizeBytes: objectMeta.sizeBytes,
    chunkSize,
  });

  return continueTikTokPublication(init.publishId, config, now);
}

async function continueTikTokPublication(
  publishId: string,
  config: TikTokPublisherConfig,
  now: string,
): Promise<PlatformAttemptResult> {
  logPublisher('tiktok.poll.start', {
    publishId,
    maxPolls: TIKTOK_MAX_POLLS,
    pollIntervalMs: TIKTOK_POLL_INTERVAL_MS,
  });

  for (let index = 0; index < TIKTOK_MAX_POLLS; index += 1) {
    const status = await fetchTikTokPublishStatus(publishId, config.accessToken);
    logPublisher('tiktok.poll.status', {
      publishId,
      pollIndex: index + 1,
      maxPolls: TIKTOK_MAX_POLLS,
      status: status.status,
      failReason: status.failReason,
      publiclyAvailablePostIds: status.publiclyAvailablePostIds,
    });

    if (status.status === 'PUBLISH_COMPLETE') {
      logPublisher('tiktok.poll.finished', {
        publishId,
        postId: status.publiclyAvailablePostIds[0],
      });
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
      logPublisher('tiktok.poll.failed', {
        publishId,
        failReason: status.failReason,
      });
      return {
        status: 'error',
        error: firstNonEmpty(status.failReason, 'TikTok devolvió FAILED al publicar.') || 'TikTok devolvió FAILED al publicar.',
        publishId,
      };
    }

    if (index < TIKTOK_MAX_POLLS - 1) {
      logPublisher('tiktok.poll.sleep', {
        publishId,
        nextPollIndex: index + 2,
        pollIntervalMs: TIKTOK_POLL_INTERVAL_MS,
      });
      await sleep(TIKTOK_POLL_INTERVAL_MS);
    }
  }

  logPublisher('tiktok.poll.timeout', {
    publishId,
    maxPolls: TIKTOK_MAX_POLLS,
  });
  return {
    status: 'procesando',
    publishId,
  };
}

async function queryTikTokCreatorInfo(accessToken: string): Promise<TikTokCreatorInfo> {
  const endpoint = 'https://open.tiktokapis.com/v2/post/publish/creator_info/query/';
  logPublisher('tiktok.creator_info.request', {
    endpoint: safeEndpoint(endpoint),
  });
  const payload = await fetchJson(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({}),
  });
  const data = asRecord(payload?.data) || {};
  logPublisher('tiktok.creator_info.response', {
    endpoint: safeEndpoint(endpoint),
    dataKeys: Object.keys(data),
    privacyLevelOptions: asStringArray(data.privacy_level_options),
    commentDisabled: asBoolean(data.comment_disabled),
    duetDisabled: asBoolean(data.duet_disabled),
    stitchDisabled: asBoolean(data.stitch_disabled),
  });

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
  const endpoint = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
  logPublisher('tiktok.direct_post.init.request', {
    endpoint: safeEndpoint(endpoint),
    ...logVideoFields(video),
    requestedPrivacyLevel: config.defaultPrivacyLevel,
    selectedPrivacyLevel: privacyLevel,
    sourceInfo: {
      sizeBytes: sourceInfo.sizeBytes,
      chunkSize: sourceInfo.chunkSize,
      totalChunkCount,
    },
    postInfo: {
      titleLength: buildSocialCaption(video).length,
      disableComment: creatorInfo.commentDisabled || config.disableComment,
      disableDuet: creatorInfo.duetDisabled || config.disableDuet,
      disableStitch: creatorInfo.stitchDisabled || config.disableStitch,
    },
  });
  const payload = await fetchJson(endpoint, {
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
    logPublisher('tiktok.direct_post.init.invalid_response', {
      endpoint: safeEndpoint(endpoint),
      dataKeys: data ? Object.keys(data) : [],
      publishId,
      hasUploadUrl: !!uploadUrl,
    });
    throw new Error('TikTok no devolvió publish_id o upload_url válidos.');
  }

  logPublisher('tiktok.direct_post.init.response', {
    endpoint: safeEndpoint(endpoint),
    publishId,
    uploadUrl,
  });
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
  let chunkIndex = 0;
  const totalChunkCount = Math.ceil(input.sizeBytes / chunkSize);
  logPublisher('tiktok.upload.start', {
    bucketName: input.bucketName,
    bucketKey: input.bucketKey,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
    chunkSize,
    totalChunkCount,
    uploadUrl,
  });

  while (start < input.sizeBytes) {
    const end = Math.min(start + chunkSize, input.sizeBytes) - 1;
    chunkIndex += 1;
    logPublisher('tiktok.upload.chunk.read_start', {
      bucketName: input.bucketName,
      bucketKey: input.bucketKey,
      chunkIndex,
      totalChunkCount,
      start,
      end,
    });
    const chunk = await readS3ByteRange(input.bucketName, input.bucketKey, start, end);
    logPublisher('tiktok.upload.chunk.put_start', {
      chunkIndex,
      totalChunkCount,
      start,
      end,
      byteLength: chunk.byteLength,
      contentRange: `bytes ${start}-${end}/${input.sizeBytes}`,
      uploadUrl,
    });
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': input.contentType,
        'Content-Length': String(chunk.byteLength),
        'Content-Range': `bytes ${start}-${end}/${input.sizeBytes}`,
      },
      body: chunk,
    });
    logPublisher('tiktok.upload.chunk.put_response', {
      chunkIndex,
      totalChunkCount,
      start,
      end,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      throw new Error(`TikTok rechazó el upload del chunk. HTTP ${response.status}`);
    }

    start = end + 1;
  }

  logPublisher('tiktok.upload.done', {
    bucketName: input.bucketName,
    bucketKey: input.bucketKey,
    sizeBytes: input.sizeBytes,
    chunkSize,
    totalChunkCount,
  });
}

async function fetchTikTokPublishStatus(
  publishId: string,
  accessToken: string,
): Promise<TikTokPublishStatusResponse> {
  const endpoint = 'https://open.tiktokapis.com/v2/post/publish/status/fetch/';
  logPublisher('tiktok.status.request', {
    endpoint: safeEndpoint(endpoint),
    publishId,
  });
  const payload = await fetchJson(endpoint, {
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
  logPublisher('tiktok.status.response', {
    endpoint: safeEndpoint(endpoint),
    publishId,
    dataKeys: Object.keys(data),
    status: firstNonEmpty(asString(data.status), 'UNKNOWN') || 'UNKNOWN',
    failReason: firstNonEmpty(asString(data.fail_reason)),
    publiclyAvailablePostIds: asStringArray(data.publicaly_available_post_id),
  });

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
  let page = 0;
  logPublisher('dynamodb.query_due.start', {
    now,
    tableName: getGeneratedVideosTableName(),
    indexName: getGeneratedVideosStatusIndexName(),
    status: STATUS_PROGRAMADO,
  });

  do {
    page += 1;
    logPublisher('dynamodb.query_due.page.start', {
      page,
      hasExclusiveStartKey: !!exclusiveStartKey,
    });
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
    logPublisher('dynamodb.query_due.page.response', {
      page,
      itemCount: result.Items?.length || 0,
      scannedCount: result.ScannedCount,
      count: result.Count,
      hasLastEvaluatedKey: !!result.LastEvaluatedKey,
    });

    for (const item of result.Items || []) {
      const video = toScheduledVideoRecord(item);
      if (video) {
        videos.push(video);
        logPublisher('dynamodb.query_due.item', logVideoFields(video));
      } else {
        logPublisher('dynamodb.query_due.item.skipped_invalid', {
          page,
          keys: Object.keys(item || {}),
        });
      }
    }

    exclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);

  logPublisher('dynamodb.query_due.complete', {
    now,
    totalVideos: videos.length,
    pages: page,
  });
  return videos;
}

async function acquirePublishLock(
  video: ScheduledVideoRecord,
  now: string,
): Promise<ClaimedVideo | undefined> {
  const lockToken = randomUUID();
  const lockExpiresAt = new Date(Date.parse(now) + LOCK_WINDOW_MS).toISOString();
  logPublisher('dynamodb.lock.attempt', {
    ...logVideoFields(video),
    lockToken,
    lockExpiresAt,
  });

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
      logPublisher('dynamodb.lock.invalid_response', {
        ...logVideoFields(video),
        returnedKeys: Object.keys(result.Attributes || {}),
      });
      return undefined;
    }

    logPublisher('dynamodb.lock.acquired', {
      ...logVideoFields(lockedVideo),
      lockToken,
      lockExpiresAt,
    });
    return {
      lockToken,
      video: lockedVideo,
    };
  } catch (error) {
    if (isConditionalCheckFailed(error)) {
      logPublisher('dynamodb.lock.conditional_failed', {
        ...logVideoFields(video),
        lockExpiresAt: video.publishLockExpiresAt,
      });
      return undefined;
    }
    logPublisher('dynamodb.lock.error', {
      ...logVideoFields(video),
      error,
    });
    throw error;
  }
}

async function applyPublicationSettlement(
  video: ScheduledVideoRecord,
  settlement: VideoPublicationSettlement,
  lockToken: string,
): Promise<ScheduledVideoRecord> {
  logPublisher('dynamodb.settlement.apply.start', {
    ...logVideoFields(video),
    lockToken,
    settlement,
  });
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
    logPublisher('dynamodb.settlement.apply.invalid_response', {
      ...logVideoFields(video),
      settlement,
      returnedKeys: Object.keys(result.Attributes || {}),
    });
    throw new Error('No pudimos reconstruir el video después de actualizar su publicación.');
  }

  logPublisher('dynamodb.settlement.apply.complete', {
    ...logVideoFields(updated),
    lockToken,
  });
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
  logPublisher('config.load.start', {
    env: {
      instagramEnabled: process.env.INSTAGRAM_AUTOPUBLISH_ENABLED,
      tiktokEnabled: process.env.TIKTOK_AUTOPUBLISH_ENABLED,
      instagramAccessTokenParam: process.env.INSTAGRAM_ACCESS_TOKEN_PARAM,
      tiktokAccessTokenParam: process.env.TIKTOK_ACCESS_TOKEN_PARAM,
      instagramGraphApiVersion: process.env.INSTAGRAM_GRAPH_API_VERSION,
      tiktokDefaultPrivacyLevel: process.env.TIKTOK_DEFAULT_PRIVACY_LEVEL,
      generatedVideosTableName: process.env.GENERATED_VIDEOS_TABLE_NAME,
      generatedVideosStatusIndexName: process.env.GENERATED_VIDEOS_STATUS_PUBLISH_ON_INDEX_NAME,
    },
  });
  const enabledPlatforms: EnabledPlatforms = {
    instagram: asBoolean(process.env.INSTAGRAM_AUTOPUBLISH_ENABLED),
    tiktok: asBoolean(process.env.TIKTOK_AUTOPUBLISH_ENABLED),
  };

  const config: PublisherConfig = {
    enabledPlatforms,
    captionSuffix: firstNonEmpty(process.env.SOCIAL_POST_CAPTION_SUFFIX),
  };

  if (enabledPlatforms.instagram) {
    logPublisher('config.instagram.load.start', {
      accessTokenSource: firstNonEmpty(process.env.INSTAGRAM_ACCESS_TOKEN) ? 'env' : 'ssm',
      paramName: process.env.INSTAGRAM_ACCESS_TOKEN_PARAM,
      igUserIdConfigured: !!normalizeKey(process.env.INSTAGRAM_IG_USER_ID),
    });
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
    logPublisher('config.instagram.load.complete', {
      accessTokenConfigured: !!accessToken,
      igUserId,
      apiVersion: config.instagram.apiVersion,
      shareToFeed: config.instagram.shareToFeed,
    });
  }

  if (enabledPlatforms.tiktok) {
    logPublisher('config.tiktok.load.start', {
      accessTokenSource: firstNonEmpty(process.env.TIKTOK_ACCESS_TOKEN) ? 'env' : 'ssm',
      paramName: process.env.TIKTOK_ACCESS_TOKEN_PARAM,
      defaultPrivacyLevel: process.env.TIKTOK_DEFAULT_PRIVACY_LEVEL,
    });
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
    logPublisher('config.tiktok.load.complete', {
      accessTokenConfigured: !!accessToken,
      defaultPrivacyLevel: config.tiktok.defaultPrivacyLevel,
      disableComment: config.tiktok.disableComment,
      disableDuet: config.tiktok.disableDuet,
      disableStitch: config.tiktok.disableStitch,
    });
  }

  logPublisher('config.load.complete', {
    enabledPlatforms,
    hasCaptionSuffix: !!config.captionSuffix,
    instagramConfigured: !!config.instagram,
    tiktokConfigured: !!config.tiktok,
  });
  return config;
}

async function getSecretValue(input: {
  directValue?: string;
  paramName?: string;
}): Promise<string | undefined> {
  const directValue = firstNonEmpty(input.directValue);
  if (directValue && directValue !== 'SET_IN_SSM') {
    logPublisher('secret.load.direct', {
      hasDirectValue: true,
    });
    return directValue;
  }

  const paramName = firstNonEmpty(input.paramName);
  if (!paramName) {
    logPublisher('secret.load.missing_param_name', {
      hasDirectValue: !!directValue,
    });
    return undefined;
  }

  logPublisher('secret.load.ssm.start', {
    paramName,
  });
  const result = await ssm.send(
    new GetParameterCommand({
      Name: paramName,
      WithDecryption: true,
    }),
  );
  const value = firstNonEmpty(result.Parameter?.Value);

  logPublisher('secret.load.ssm.complete', {
    paramName,
    hasValue: !!value,
    valueIgnoredAsPlaceholder: value === 'SET_IN_SSM',
  });
  return value && value !== 'SET_IN_SSM' ? value : undefined;
}

async function getStoredVideoObjectMeta(
  bucketName: string,
  bucketKey: string,
): Promise<{ sizeBytes: number; contentType?: string }> {
  logPublisher('s3.head.start', {
    bucketName,
    bucketKey,
  });
  const head = await s3.send(
    new HeadObjectCommand({
      Bucket: bucketName,
      Key: bucketKey,
    }),
  );
  const sizeBytes = head.ContentLength;

  if (!sizeBytes || sizeBytes <= 0) {
    logPublisher('s3.head.invalid_size', {
      bucketName,
      bucketKey,
      contentLength: head.ContentLength,
      contentType: head.ContentType,
    });
    throw new Error('No pudimos resolver el tamaño actual del video en S3.');
  }

  logPublisher('s3.head.complete', {
    bucketName,
    bucketKey,
    sizeBytes,
    contentType: head.ContentType,
  });
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
  logPublisher('s3.range.read.start', {
    bucketName,
    bucketKey,
    start,
    end,
    range: `bytes=${start}-${end}`,
  });
  const response = await s3.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: bucketKey,
      Range: `bytes=${start}-${end}`,
    }),
  );

  if (!response.Body) {
    logPublisher('s3.range.read.empty_body', {
      bucketName,
      bucketKey,
      start,
      end,
    });
    throw new Error('S3 no devolvió contenido para el rango solicitado.');
  }

  const bytes = await readBodyToUint8Array(response.Body);
  logPublisher('s3.range.read.complete', {
    bucketName,
    bucketKey,
    start,
    end,
    byteLength: bytes.byteLength,
  });
  return bytes;
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
  logPublisher('http.fetch.start', {
    endpoint: safeEndpoint(url),
    method: init.method || 'GET',
  });
  const response = await fetch(url, init);
  const payload = await parseJsonResponse(response);
  const topLevelError = asRecord(payload?.error);
  logPublisher('http.fetch.response', {
    endpoint: safeEndpoint(url),
    method: init.method || 'GET',
    status: response.status,
    ok: response.ok,
    payloadKeys: Object.keys(payload || {}),
    errorCode: firstNonEmpty(asString(topLevelError?.code)),
    errorMessage: firstNonEmpty(asString(topLevelError?.message)),
  });

  if (!response.ok || (topLevelError && firstNonEmpty(asString(topLevelError.code)) !== 'ok' && firstNonEmpty(asString(topLevelError.message)))) {
    const message =
      firstNonEmpty(
        asString(topLevelError?.message),
        asString((asRecord(payload?.error) || {}).error_user_msg),
        asString((asRecord(payload?.error) || {}).error_user_title),
      ) || `HTTP ${response.status}`;
    logPublisher('http.fetch.error', {
      endpoint: safeEndpoint(url),
      method: init.method || 'GET',
      status: response.status,
      message,
    });
    throw new Error(message);
  }

  return payload;
}

async function parseJsonResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text.trim()) {
    logPublisher('http.fetch.empty_body', {
      endpoint: safeEndpoint(response.url || ''),
      status: response.status,
    });
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch (error) {
    logPublisher('http.fetch.invalid_json', {
      endpoint: safeEndpoint(response.url || ''),
      status: response.status,
      textPreview: text.slice(0, 180),
    });
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
