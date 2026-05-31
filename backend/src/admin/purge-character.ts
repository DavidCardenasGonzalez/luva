import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DeleteObjectsCommand, S3Client } from '@aws-sdk/client-s3';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({});

export type PurgeCharacterResult = {
  characterId: string;
  posts: { scanned: number; deleted: number };
  videos: { scanned: number; deleted: number };
  friendships: { scanned: number; deleted: number };
  userProgress: { scanned: number; updated: number };
  s3: { assets: number; videos: number; failures: number };
};

export async function purgeCharacterEverywhere(characterId: string): Promise<PurgeCharacterResult> {
  const trimmed = (characterId || '').trim();
  if (!trimmed) {
    throw new Error('INVALID_CHARACTER_ID');
  }

  const characterPostsTable = requiredEnv('CHARACTER_POSTS_TABLE_NAME');
  const generatedVideosTable = requiredEnv('GENERATED_VIDEOS_TABLE_NAME');
  const friendshipsTable = requiredEnv('FRIENDSHIPS_TABLE_NAME');
  const usersTable = requiredEnv('USERS_TABLE_NAME');
  const assetsBucketName = requiredEnv('ASSETS_BUCKET_NAME');

  const result: PurgeCharacterResult = {
    characterId: trimmed,
    posts: { scanned: 0, deleted: 0 },
    videos: { scanned: 0, deleted: 0 },
    friendships: { scanned: 0, deleted: 0 },
    userProgress: { scanned: 0, updated: 0 },
    s3: { assets: 0, videos: 0, failures: 0 },
  };

  // 1. Character posts: query by characterId, collect S3 asset keys, delete each post.
  const assetKeys = new Set<string>();
  const postsToDelete: Array<{ characterId: string; postId: string }> = [];
  await pagedQuery(
    {
      TableName: characterPostsTable,
      KeyConditionExpression: '#characterId = :characterId',
      ExpressionAttributeNames: { '#characterId': 'characterId' },
      ExpressionAttributeValues: { ':characterId': trimmed },
    },
    (item) => {
      result.posts.scanned += 1;
      const postId = typeof item.postId === 'string' ? item.postId : undefined;
      if (!postId) return;
      postsToDelete.push({ characterId: trimmed, postId });
      collectAssetKey(item.imageUrl, assetKeys);
      collectAssetKey(item.thumbnailUrl, assetKeys);
      collectAssetKey(item.videoUrl, assetKeys);
      collectAssetKey(item.subtitlesUrl, assetKeys);
      if (typeof item.subtitlesKey === 'string') {
        assetKeys.add(item.subtitlesKey);
      }
    },
  );

  for (const key of postsToDelete) {
    await dynamo.send(
      new DeleteCommand({
        TableName: characterPostsTable,
        Key: key,
      }),
    );
    result.posts.deleted += 1;
  }

  // 2. Generated videos: query by storyId (= characterId), collect bucketName/bucketKey, delete each.
  const videoObjects: Array<{ bucket: string; key: string }> = [];
  const videosToDelete: Array<{ storyId: string; videoId: string }> = [];
  await pagedQuery(
    {
      TableName: generatedVideosTable,
      KeyConditionExpression: '#storyId = :storyId',
      ExpressionAttributeNames: { '#storyId': 'storyId' },
      ExpressionAttributeValues: { ':storyId': trimmed },
    },
    (item) => {
      result.videos.scanned += 1;
      const videoId = typeof item.videoId === 'string' ? item.videoId : undefined;
      if (!videoId) return;
      videosToDelete.push({ storyId: trimmed, videoId });
      const bucket = typeof item.bucketName === 'string' ? item.bucketName : undefined;
      const key = typeof item.bucketKey === 'string' ? item.bucketKey : undefined;
      if (bucket && key) {
        videoObjects.push({ bucket, key });
      }
    },
  );

  for (const key of videosToDelete) {
    await dynamo.send(
      new DeleteCommand({
        TableName: generatedVideosTable,
        Key: key,
      }),
    );
    result.videos.deleted += 1;
  }

  // 3. Friendships: scan, delete entries where friendId == characterId.
  const friendshipsToDelete: Array<{ userId: string; friendId: string }> = [];
  await pagedScan(
    {
      TableName: friendshipsTable,
      FilterExpression: '#friendId = :friendId',
      ExpressionAttributeNames: { '#friendId': 'friendId' },
      ExpressionAttributeValues: { ':friendId': trimmed },
    },
    (item) => {
      result.friendships.scanned += 1;
      const userId = typeof item.userId === 'string' ? item.userId : undefined;
      const friendId = typeof item.friendId === 'string' ? item.friendId : undefined;
      if (!userId || !friendId) return;
      friendshipsToDelete.push({ userId, friendId });
    },
  );

  for (const key of friendshipsToDelete) {
    await dynamo.send(
      new DeleteCommand({
        TableName: friendshipsTable,
        Key: key,
      }),
    );
    result.friendships.deleted += 1;
  }

  // 4. User progress: scan users, remove this characterId from appProgress.
  const { storyId: legacyStoryId, missionId: legacyMissionId } = splitCharacterId(trimmed);
  await pagedScan(
    {
      TableName: usersTable,
    },
    async (item) => {
      result.userProgress.scanned += 1;
      const email = typeof item.email === 'string' ? item.email : undefined;
      if (!email) return;
      const appProgress = asRecord(item.appProgress);
      if (!appProgress) return;
      const updated = removeCharacterFromProgress(appProgress, trimmed, legacyStoryId, legacyMissionId);
      if (!updated) return;
      await dynamo.send(
        new UpdateCommand({
          TableName: usersTable,
          Key: { email },
          UpdateExpression: 'SET appProgress = :progress, appProgressUpdatedAt = :now',
          ExpressionAttributeValues: {
            ':progress': appProgress,
            ':now': new Date().toISOString(),
          },
        }),
      );
      result.userProgress.updated += 1;
    },
  );

  // 5. Delete S3 assets (collected from character posts) + generated video objects.
  if (assetKeys.size > 0) {
    const deleted = await batchDeleteObjects(
      assetsBucketName,
      Array.from(assetKeys),
    );
    result.s3.assets = deleted.deleted;
    result.s3.failures += deleted.failures;
  }
  if (videoObjects.length > 0) {
    const byBucket = new Map<string, string[]>();
    for (const { bucket, key } of videoObjects) {
      const list = byBucket.get(bucket) || [];
      list.push(key);
      byBucket.set(bucket, list);
    }
    for (const [bucket, keys] of byBucket) {
      const deleted = await batchDeleteObjects(bucket, keys);
      result.s3.videos += deleted.deleted;
      result.s3.failures += deleted.failures;
    }
  }

  return result;
}

async function pagedQuery(
  baseParams: Record<string, unknown>,
  onItem: (item: Record<string, any>) => Promise<void> | void,
) {
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(
      new QueryCommand({ ...baseParams, ExclusiveStartKey: exclusiveStartKey } as any),
    );
    for (const item of page.Items || []) {
      await onItem(item);
    }
    exclusiveStartKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);
}

async function pagedScan(
  baseParams: Record<string, unknown>,
  onItem: (item: Record<string, any>) => Promise<void> | void,
) {
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(
      new ScanCommand({ ...baseParams, ExclusiveStartKey: exclusiveStartKey } as any),
    );
    for (const item of page.Items || []) {
      await onItem(item);
    }
    exclusiveStartKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);
}

async function batchDeleteObjects(
  bucket: string,
  keys: string[],
): Promise<{ deleted: number; failures: number }> {
  let deleted = 0;
  let failures = 0;
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    try {
      const response = await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: false },
        }),
      );
      deleted += (response.Deleted || []).length;
      failures += (response.Errors || []).length;
      for (const err of response.Errors || []) {
        console.warn(
          JSON.stringify({
            scope: 'purge.s3.error',
            bucket,
            key: err.Key,
            code: err.Code,
            message: err.Message,
          }),
        );
      }
    } catch (err: any) {
      console.warn(
        JSON.stringify({
          scope: 'purge.s3.exception',
          bucket,
          message: err?.message || 'unknown',
        }),
      );
      failures += chunk.length;
    }
  }
  return { deleted, failures };
}

function collectAssetKey(value: unknown, target: Set<string>) {
  const key = extractAssetKeyFromUrl(value);
  if (key) {
    target.add(key);
  }
}

function extractAssetKeyFromUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    const path = parsed.pathname.replace(/^\/+/, '');
    return path || undefined;
  } catch {
    return undefined;
  }
}

function splitCharacterId(characterId: string): { storyId: string; missionId: string } {
  const colon = characterId.indexOf(':');
  if (colon < 0) {
    return { storyId: characterId, missionId: characterId };
  }
  return {
    storyId: characterId.slice(0, colon),
    missionId: characterId.slice(colon + 1),
  };
}

function asRecord(value: unknown): Record<string, any> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, any>;
}

/**
 * Mutates `appProgress` removing every trace of `characterId` from the
 * canonical `characters.items` and the legacy `stories.items[storyId]
 * .completedMissions[missionId]`. Returns true if anything changed.
 */
function removeCharacterFromProgress(
  appProgress: Record<string, any>,
  characterId: string,
  legacyStoryId: string,
  legacyMissionId: string,
): boolean {
  let changed = false;
  const characters = asRecord(appProgress.characters);
  if (characters) {
    const items = asRecord(characters.items);
    if (items && Object.prototype.hasOwnProperty.call(items, characterId)) {
      delete items[characterId];
      changed = true;
    }
  }
  const stories = asRecord(appProgress.stories);
  if (stories) {
    const items = asRecord(stories.items);
    if (items) {
      const story = asRecord(items[legacyStoryId]);
      if (story) {
        const completed = asRecord(story.completedMissions);
        if (completed && Object.prototype.hasOwnProperty.call(completed, legacyMissionId)) {
          delete completed[legacyMissionId];
          changed = true;
        }
        // If the story now has no completions and no other meaningful fields, drop it.
        const remainingCompletions = completed ? Object.keys(completed).length : 0;
        if (
          remainingCompletions === 0 &&
          !story.deletedAt &&
          !story.storyCompletedAt &&
          !story.activeMission
        ) {
          delete items[legacyStoryId];
          changed = true;
        }
      }
    }
  }
  return changed;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} not set`);
  }
  return value;
}
