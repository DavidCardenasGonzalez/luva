import { createHash } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

export type ReviewSource = {
  type: 'microdrama' | 'feed_video';
  seriesId?: string;
  episodeId?: string;
  characterId?: string;
  postId?: string;
  positionMs?: number;
  title?: string;
};
export type ReviewItem = {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  contextText?: string;
  source: ReviewSource;
  status: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

function tableName() {
  const value = process.env.TABLE_NAME?.trim();
  if (!value) throw new Error('TABLE_NAME not set');
  return value;
}
function partition(userId: string) { return `USER#${encodeURIComponent(userId)}`; }
function normalized(value: string) { return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase(); }
function recordId(originalText: string, sourceLanguage: string, targetLanguage: string) {
  return createHash('sha256').update([normalized(originalText), sourceLanguage.toLowerCase(), targetLanguage.toLowerCase()].join('\u0000')).digest('hex');
}
function itemKey(item: Pick<ReviewItem, 'createdAt' | 'id'>) { return `REVIEW_ITEM#${item.createdAt}#${item.id}`; }
function toItem(value: any): ReviewItem | undefined {
  if (!value || typeof value.id !== 'string' || typeof value.originalText !== 'string') return undefined;
  const { pk: _pk, sk: _sk, ...item } = value;
  return item as ReviewItem;
}
function encodeCursor(key: Record<string, unknown> | undefined) {
  return key ? Buffer.from(JSON.stringify(key)).toString('base64url') : undefined;
}
function decodeCursor(cursor?: string) {
  if (!cursor) return undefined;
  try {
    const key = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (!key || typeof key.pk !== 'string' || typeof key.sk !== 'string' || !key.sk.startsWith('REVIEW_ITEM#')) throw new Error();
    return key;
  } catch { throw new Error('INVALID_CURSOR'); }
}

export function createReviewItemsRepository(client: DynamoDBDocumentClient = dynamo) {
  async function getById(userId: string, id: string): Promise<ReviewItem | undefined> {
    if (!/^[a-f0-9]{64}$/.test(id)) return undefined;
    const pk = partition(userId);
    const lookup = await client.send(new GetCommand({ TableName: tableName(), Key: { pk, sk: `REVIEW_LOOKUP#${id}` }, ConsistentRead: true }));
    if (typeof lookup.Item?.itemKey !== 'string') return undefined;
    const result = await client.send(new GetCommand({ TableName: tableName(), Key: { pk, sk: lookup.Item.itemKey }, ConsistentRead: true }));
    return toItem(result.Item);
  }

  return {
    async save(userId: string, input: Omit<ReviewItem, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'completedAt'>) {
      const id = recordId(input.originalText, input.sourceLanguage, input.targetLanguage);
      const pk = partition(userId);
      const now = new Date().toISOString();
      const item: ReviewItem = { ...input, id, status: 'pending', createdAt: now, updatedAt: now };
      const sk = itemKey(item);
      try {
        await client.send(new TransactWriteCommand({ TransactItems: [
          { Put: { TableName: tableName(), Item: { pk, sk: `REVIEW_LOOKUP#${id}`, itemKey: sk, createdAt: now }, ConditionExpression: 'attribute_not_exists(pk)' } },
          { Put: { TableName: tableName(), Item: { pk, sk, ...item }, ConditionExpression: 'attribute_not_exists(pk)' } },
        ] }));
        return { item, created: true };
      } catch (error: any) {
        if (error?.name !== 'TransactionCanceledException' && error?.name !== 'ConditionalCheckFailedException') throw error;
        const existing = await getById(userId, id);
        if (!existing) throw error;
        return { item: existing, created: false };
      }
    },
    async get(userId: string, id: string) { return getById(userId, id); },
    async list(userId: string, options: { status?: 'pending' | 'completed'; limit: number; cursor?: string }) {
      const pk = partition(userId);
      let startKey = decodeCursor(options.cursor);
      if (startKey && startKey.pk !== pk) throw new Error('INVALID_CURSOR');
      const items: ReviewItem[] = [];
      let pages = 0;
      while (items.length < options.limit && pages < 8) {
        const result = await client.send(new QueryCommand({
          TableName: tableName(),
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': 'REVIEW_ITEM#' },
          ScanIndexForward: false,
          Limit: Math.max(options.limit, 30),
          ...(startKey ? { ExclusiveStartKey: startKey } : {}),
          ConsistentRead: true,
        }));
        let reachedLimit = false;
        for (const raw of result.Items || []) {
          const item = toItem(raw);
          if (item && (!options.status || item.status === options.status)) {
            items.push(item);
            if (items.length === options.limit) {
              startKey = { pk, sk: String((raw as any).sk) };
              reachedLimit = true;
              break;
            }
          }
        }
        if (!reachedLimit) startKey = result.LastEvaluatedKey;
        pages += 1;
        if (!startKey) break;
      }
      return { items, nextCursor: encodeCursor(startKey) };
    },
    async setStatus(userId: string, id: string, status: 'pending' | 'completed') {
      const current = await getById(userId, id);
      if (!current) return undefined;
      const now = new Date().toISOString();
      const completedAt = status === 'completed' ? current.completedAt || now : undefined;
      const result = await client.send(new UpdateCommand({
        TableName: tableName(), Key: { pk: partition(userId), sk: itemKey(current) },
        UpdateExpression: status === 'completed'
          ? 'SET #status = :status, updatedAt = :now, completedAt = :completedAt'
          : 'SET #status = :status, updatedAt = :now REMOVE completedAt',
        ConditionExpression: 'attribute_exists(pk)',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status, ':now': now, ...(completedAt ? { ':completedAt': completedAt } : {}) },
        ReturnValues: 'ALL_NEW',
      }));
      return toItem(result.Attributes);
    },
  };
}
