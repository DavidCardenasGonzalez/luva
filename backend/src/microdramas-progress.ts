import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { MicrodramaEpisode } from './microdramas';
import { createMicrodramasRepository } from './microdramas';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const catalog = createMicrodramasRepository();

export type MicrodramaProgressSummary = {
  seriesId: string;
  resumeEpisodeId: string;
  resumePositionMs: number;
  revision: number;
  updatedAt: string;
  completedAt?: string;
};
export type MicrodramaEpisodeProgress = {
  seriesId: string;
  episodeId: string;
  positionMs: number;
  completed: boolean;
  updatedAt: string;
};
type ProgressRecord = {
  pk: string; sk: string; seriesId: string; episodeId?: string;
  resumeEpisodeId?: string; resumePositionMs?: number; revision?: number;
  positionMs?: number; completed?: boolean; updatedAt: string; completedAt?: string;
};

function getTableName(): string {
  const name = process.env.TABLE_NAME?.trim();
  if (!name) throw new Error('TABLE_NAME not set');
  return name;
}
function validId(value: string): boolean { return /^[a-zA-Z0-9][a-zA-Z0-9_:-]{0,99}$/.test(value); }
function partition(userId: string) { return `USER#${encodeURIComponent(userId)}`; }
function summaryKey(seriesId: string) { return `MICRODRAMA#${encodeURIComponent(seriesId)}#SUMMARY`; }
function episodeKey(seriesId: string, episodeId: string) { return `MICRODRAMA#${encodeURIComponent(seriesId)}#EPISODE#${encodeURIComponent(episodeId)}`; }
function summaryDto(item?: ProgressRecord): MicrodramaProgressSummary | undefined {
  if (!item?.resumeEpisodeId) return undefined;
  return {
    seriesId: item.seriesId,
    resumeEpisodeId: item.resumeEpisodeId,
    resumePositionMs: item.resumePositionMs || 0,
    revision: item.revision || 0,
    updatedAt: item.updatedAt,
    ...(item.completedAt ? { completedAt: item.completedAt } : {}),
  };
}
function episodeDto(item: ProgressRecord): MicrodramaEpisodeProgress {
  return {
    seriesId: item.seriesId,
    episodeId: item.episodeId!,
    positionMs: item.positionMs || 0,
    completed: Boolean(item.completed),
    updatedAt: item.updatedAt,
  };
}
async function getItem(client: DynamoDBDocumentClient, userId: string, sk: string): Promise<ProgressRecord | undefined> {
  const response = await client.send(new GetCommand({ TableName: getTableName(), Key: { pk: partition(userId), sk }, ConsistentRead: true }));
  return response.Item as ProgressRecord | undefined;
}
async function getEpisode(seriesId: string, episodeId: string): Promise<MicrodramaEpisode | undefined> {
  const detail = await catalog.getSeriesDetail(seriesId);
  return detail?.episodes.find(episode => episode.episodeId === episodeId);
}

export class MicrodramaProgressConflict extends Error {
  constructor(public current: MicrodramaProgressSummary | undefined) { super('MICRODRAMA_PROGRESS_CONFLICT'); }
}

export function createMicrodramaProgressRepository(
  client: DynamoDBDocumentClient = dynamo,
  getPublicEpisode = getEpisode,
) {
  return {
    async get(userId: string, seriesId: string) {
      if (!validId(seriesId)) throw new Error('INVALID_SERIES_ID');
      const [summary, page] = await Promise.all([
        getItem(client, userId, summaryKey(seriesId)),
        client.send(new QueryCommand({
          TableName: getTableName(),
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: {
            ':pk': partition(userId),
            ':prefix': `MICRODRAMA#${encodeURIComponent(seriesId)}#EPISODE#`,
          },
          ConsistentRead: true,
        })),
      ]);
      return {
        summary: summaryDto(summary as ProgressRecord | undefined),
        episodes: ((page.Items || []) as ProgressRecord[]).map(episodeDto),
      };
    },

    async getBatch(userId: string, seriesIds: string[]) {
      if (!Array.isArray(seriesIds) || seriesIds.length > 20 || seriesIds.some(id => !validId(id))) throw new Error('INVALID_PROGRESS_BATCH');
      const keys = [...new Set(seriesIds)].map(seriesId => ({ pk: partition(userId), sk: summaryKey(seriesId) }));
      if (!keys.length) return { items: [] };
      let pending = keys;
      const records = new Map<string, ProgressRecord>();
      for (let attempt = 0; pending.length && attempt < 4; attempt += 1) {
        const response = await client.send(new BatchGetCommand({ RequestItems: { [getTableName()]: { Keys: pending } } }));
        for (const record of (response.Responses?.[getTableName()] || []) as ProgressRecord[]) records.set(record.seriesId, record);
        pending = response.UnprocessedKeys?.[getTableName()]?.Keys as typeof keys || [];
        if (pending.length && attempt < 3) await new Promise(resolve => setTimeout(resolve, 25 * 2 ** attempt));
      }
      if (pending.length) throw new Error('MICRODRAMA_PROGRESS_BATCH_INCOMPLETE');
      return { items: [...new Set(seriesIds)].flatMap(id => {
        const summary = summaryDto(records.get(id));
        return summary ? [summary] : [];
      }) };
    },

    async save(userId: string, seriesId: string, input: {
      episodeId: string; positionMs: number; event: 'position' | 'ended'; expectedRevision: number;
    }) {
      if (!validId(seriesId) || !validId(input.episodeId)) throw new Error('INVALID_MICRODRAMA_ID');
      if (!Number.isFinite(input.positionMs) || input.positionMs < 0 || !Number.isInteger(input.expectedRevision) || input.expectedRevision < 0 || !['position', 'ended'].includes(input.event)) {
        throw new Error('INVALID_MICRODRAMA_PROGRESS');
      }
      const episode = await getPublicEpisode(seriesId, input.episodeId);
      if (!episode) throw new Error('MICRODRAMA_EPISODE_NOT_FOUND');
      const positionMs = Math.min(Math.floor(input.positionMs), episode.durationMs);
      if (input.event === 'ended' && episode.durationMs - positionMs > 2000) throw new Error('MICRODRAMA_EPISODE_NOT_ENDED');
      const [oldSummary, oldEpisode] = await Promise.all([
        getItem(client, userId, summaryKey(seriesId)),
        getItem(client, userId, episodeKey(seriesId, input.episodeId)),
      ]);
      const currentRevision = oldSummary?.revision || 0;
      if (currentRevision !== input.expectedRevision) throw new MicrodramaProgressConflict(summaryDto(oldSummary));
      const now = new Date().toISOString();
      const ending = input.event === 'ended';
      let resumeEpisodeId = input.episodeId;
      let resumePositionMs = positionMs;
      let completedAt: string | undefined;
      if (ending) {
        const detail = await catalog.getSeriesDetail(seriesId);
        const next = detail?.episodes.find(candidate => candidate.episodeNumber === episode.episodeNumber + 1);
        if (next) {
          resumeEpisodeId = next.episodeId;
          resumePositionMs = 0;
        } else {
          completedAt = now;
          resumePositionMs = episode.durationMs;
        }
      }
      const summary: ProgressRecord = {
        pk: partition(userId), sk: summaryKey(seriesId), seriesId,
        resumeEpisodeId, resumePositionMs, revision: currentRevision + 1,
        updatedAt: now,
        ...(!ending && oldSummary?.completedAt ? { completedAt: oldSummary.completedAt } : {}),
        ...(completedAt ? { completedAt } : {}),
      };
      const episodeRecord: ProgressRecord = {
        pk: partition(userId), sk: episodeKey(seriesId, input.episodeId), seriesId,
        episodeId: input.episodeId,
        positionMs: ending ? episode.durationMs : positionMs,
        completed: Boolean(oldEpisode?.completed || ending),
        updatedAt: now,
      };
      const summaryCondition = oldSummary
        ? { ConditionExpression: '#revision = :expected', ExpressionAttributeNames: { '#revision': 'revision' }, ExpressionAttributeValues: { ':expected': input.expectedRevision } }
        : { ConditionExpression: 'attribute_not_exists(pk)' };
      const episodeCondition = oldEpisode
        ? { ConditionExpression: '#updatedAt = :previous', ExpressionAttributeNames: { '#updatedAt': 'updatedAt' }, ExpressionAttributeValues: { ':previous': oldEpisode.updatedAt } }
        : { ConditionExpression: 'attribute_not_exists(pk)' };
      try {
        await client.send(new TransactWriteCommand({ TransactItems: [
          { Put: { TableName: getTableName(), Item: summary, ...summaryCondition } },
          { Put: { TableName: getTableName(), Item: episodeRecord, ...episodeCondition } },
        ] }));
      } catch (error: any) {
        if (error?.name === 'TransactionCanceledException' || error?.name === 'ConditionalCheckFailedException') {
          throw new MicrodramaProgressConflict(summaryDto(await getItem(client, userId, summaryKey(seriesId))));
        }
        throw error;
      }
      return { summary: summaryDto(summary), episode: episodeDto(episodeRecord) };
    },
  };
}
