import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});

export const ADMIN_ASSET_FOLDERS = [
  'storiesProfile',
  'avatarPosts',
  'missionIntroVideos',
  'feedPostImages',
  'feedPostVideos',
] as const;

export type AdminAssetFolder = (typeof ADMIN_ASSET_FOLDERS)[number];

type AdminAssetUploadInput = {
  folder?: unknown;
  contentType?: unknown;
  fileName?: unknown;
};

export type AdminAssetUploadRequest = {
  folder: AdminAssetFolder;
  contentType: string;
};

export type AdminAssetUploadResponse = {
  folder: AdminAssetFolder;
  key: string;
  bucketName: string;
  uploadUrl: string;
  url: string;
  expiresAt: string;
  contentType: string;
  cacheControl: string;
};

export const ADMIN_ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const VIDEO_CONTENT_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/mpeg': 'mpeg',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'video/x-m4v': 'm4v',
};

const ASSET_CONTENT_TYPE_CONFIG: Record<
  AdminAssetFolder,
  {
    contentTypes: Record<string, string>;
    contentTypeByExtension: Record<string, string>;
  }
> = {
  storiesProfile: {
    contentTypes: IMAGE_CONTENT_TYPES,
    contentTypeByExtension: buildContentTypeByExtension(IMAGE_CONTENT_TYPES, {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    }),
  },
  avatarPosts: {
    contentTypes: IMAGE_CONTENT_TYPES,
    contentTypeByExtension: buildContentTypeByExtension(IMAGE_CONTENT_TYPES, {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    }),
  },
  feedPostImages: {
    contentTypes: IMAGE_CONTENT_TYPES,
    contentTypeByExtension: buildContentTypeByExtension(IMAGE_CONTENT_TYPES, {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
    }),
  },
  missionIntroVideos: {
    contentTypes: VIDEO_CONTENT_TYPES,
    contentTypeByExtension: buildContentTypeByExtension(VIDEO_CONTENT_TYPES, {
      mov: 'video/quicktime',
      m4v: 'video/x-m4v',
    }),
  },
  feedPostVideos: {
    contentTypes: VIDEO_CONTENT_TYPES,
    contentTypeByExtension: buildContentTypeByExtension(VIDEO_CONTENT_TYPES, {
      mov: 'video/quicktime',
      m4v: 'video/x-m4v',
    }),
  },
};

export async function createAdminAssetUpload(
  input: AdminAssetUploadInput,
): Promise<AdminAssetUploadResponse> {
  const request = normalizeAdminAssetUploadRequest(input);
  const bucketName = getAssetsBucketName();
  const key = buildAdminAssetObjectKey({
    folder: request.folder,
    contentType: request.contentType,
    id: randomUUID(),
  });
  const expiresInSeconds = 60 * 10;
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: request.contentType,
      CacheControl: ADMIN_ASSET_CACHE_CONTROL,
    }),
    { expiresIn: expiresInSeconds },
  );

  return {
    folder: request.folder,
    key,
    bucketName,
    uploadUrl,
    url: buildAssetPublicUrl(key, getAssetsPublicBaseUrl()),
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    contentType: request.contentType,
    cacheControl: ADMIN_ASSET_CACHE_CONTROL,
  };
}

export function normalizeAdminAssetUploadRequest(
  input: AdminAssetUploadInput,
): AdminAssetUploadRequest {
  const folder = normalizeAssetFolder(input.folder);
  if (!folder) {
    throw new Error('INVALID_ASSET_FOLDER');
  }

  const contentType = normalizeAssetContentType(folder, input.contentType, input.fileName);
  if (!contentType) {
    throw new Error('INVALID_ASSET_CONTENT_TYPE');
  }

  return {
    folder,
    contentType,
  };
}

export function buildAdminAssetObjectKey(input: {
  folder: AdminAssetFolder;
  contentType: string;
  id: string;
  now?: string;
}): string {
  const extension = ASSET_CONTENT_TYPE_CONFIG[input.folder].contentTypes[input.contentType];
  if (!extension) {
    throw new Error('INVALID_ASSET_CONTENT_TYPE');
  }

  const parsedDate = input.now ? new Date(input.now) : new Date();
  const timestamp = Number.isNaN(parsedDate.getTime())
    ? new Date().toISOString()
    : parsedDate.toISOString();
  const compactTimestamp = timestamp.replace(/\D/g, '').slice(0, 14);
  const safeId = input.id.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 80);

  if (!safeId) {
    throw new Error('INVALID_ASSET_ID');
  }

  return `${input.folder}/${compactTimestamp}-${safeId}.${extension}`;
}

export function buildAssetPublicUrl(key: string, baseUrl: string): string {
  const normalizedBaseUrl = normalizePublicBaseUrl(baseUrl);
  const encodedKey = key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${normalizedBaseUrl}/${encodedKey}`;
}

function normalizeAssetFolder(value: unknown): AdminAssetFolder | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized) {
    return undefined;
  }

  return (ADMIN_ASSET_FOLDERS as readonly string[]).includes(normalized)
    ? (normalized as AdminAssetFolder)
    : undefined;
}

function normalizeAssetContentType(
  folder: AdminAssetFolder,
  contentType: unknown,
  fileName: unknown,
): string | undefined {
  const config = ASSET_CONTENT_TYPE_CONFIG[folder];
  const normalizedContentType = asString(contentType)
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();

  if (normalizedContentType && config.contentTypes[normalizedContentType]) {
    return normalizedContentType;
  }

  const extension = getFileExtension(asString(fileName));
  if (extension && config.contentTypeByExtension[extension]) {
    return config.contentTypeByExtension[extension];
  }

  return undefined;
}

function buildContentTypeByExtension(
  contentTypes: Record<string, string>,
  aliases: Record<string, string> = {},
): Record<string, string> {
  return {
    ...Object.fromEntries(
      Object.entries(contentTypes).map(([contentType, extension]) => [extension, contentType]),
    ),
    ...aliases,
  };
}

function getFileExtension(fileName?: string): string | undefined {
  const trimmed = fileName?.trim().toLowerCase();
  if (!trimmed) {
    return undefined;
  }

  const dotIndex = trimmed.lastIndexOf('.');
  if (dotIndex < 0 || dotIndex === trimmed.length - 1) {
    return undefined;
  }

  return trimmed.slice(dotIndex + 1);
}

function getAssetsBucketName(): string {
  const bucketName = process.env.ASSETS_BUCKET_NAME?.trim();
  if (!bucketName) {
    throw new Error('ASSETS_BUCKET_NAME not set');
  }
  return bucketName;
}

function getAssetsPublicBaseUrl(): string {
  const baseUrl =
    process.env.ASSETS_CLOUDFRONT_URL?.trim() ||
    process.env.ASSETS_CLOUDFRONT_DOMAIN_NAME?.trim();
  if (!baseUrl) {
    throw new Error('ASSETS_CLOUDFRONT_DOMAIN_NAME not set');
  }

  return baseUrl;
}

function normalizePublicBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('ASSETS_CLOUDFRONT_DOMAIN_NAME not set');
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
