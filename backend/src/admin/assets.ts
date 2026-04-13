import { randomUUID } from 'crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({});

export const ADMIN_ASSET_FOLDERS = ['storiesProfile'] as const;

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
};

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = Object.fromEntries(
  Object.entries(IMAGE_CONTENT_TYPES).map(([contentType, extension]) => [extension, contentType]),
);
CONTENT_TYPE_BY_EXTENSION.jpg = 'image/jpeg';
CONTENT_TYPE_BY_EXTENSION.jpeg = 'image/jpeg';

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
  };
}

export function normalizeAdminAssetUploadRequest(
  input: AdminAssetUploadInput,
): AdminAssetUploadRequest {
  const folder = normalizeAssetFolder(input.folder);
  if (!folder) {
    throw new Error('INVALID_ASSET_FOLDER');
  }

  const contentType = normalizeImageContentType(input.contentType, input.fileName);
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
  const extension = IMAGE_CONTENT_TYPES[input.contentType];
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

function normalizeImageContentType(contentType: unknown, fileName: unknown): string | undefined {
  const normalizedContentType = asString(contentType)
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();

  if (normalizedContentType && IMAGE_CONTENT_TYPES[normalizedContentType]) {
    return normalizedContentType;
  }

  const extension = getFileExtension(asString(fileName));
  if (extension && CONTENT_TYPE_BY_EXTENSION[extension]) {
    return CONTENT_TYPE_BY_EXTENSION[extension];
  }

  return undefined;
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
