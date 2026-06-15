import type { APIGatewayProxyResultV2 as Result } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  deriveLegacyStoriesDocument,
  mergeUserProgressRecords,
  normalizeUserProgressRecord,
  type UserProgressRecord,
} from '../progress';
import {
  calculatePromoExpirationIso,
  type PromoCodeValidationResult,
  validatePromoCode,
} from '../promo-codes';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const ROUTE_PREFIX = '/v1';

type CognitoClaims = Record<string, string | undefined>;

type StoredSubscriptionAccess = {
  isActive: boolean;
  updatedAt: string;
  expiresAt?: string;
  productId?: string;
  entitlementId?: string;
  appUserId?: string;
};

type StoredCodeAccess = {
  isActive: boolean;
  updatedAt: string;
  expiresAt?: string;
  redeemedCode?: string;
};

type StoredProAccess = {
  subscription?: StoredSubscriptionAccess;
  code?: StoredCodeAccess;
};

type UserProAccess = {
  isActive: boolean;
  source?: 'subscription' | 'code' | 'multiple';
  updatedAt?: string;
  subscription?: StoredSubscriptionAccess;
  code?: Omit<StoredCodeAccess, 'redeemedCode'>;
};

type UserReviewFeedback = {
  sentiment: 'positive' | 'negative';
  submittedAt: string;
  message?: string;
  source?: string;
  rewardCoins?: number;
};

type PromoCodeRedemptionResult = PromoCodeValidationResult & {
  expiresAt?: string;
};

type UserRecord = {
  email: string;
  cognitoSub?: string;
  displayName?: string;
  bio?: string;
  goal?: string;
  englishDifficulty?: 'easy' | 'medium' | 'hard';
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
  emailVerified?: boolean;
  status: 'active';
  lastAuthProvider: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  isPro: boolean;
  proAccess?: UserProAccess;
  reviewFeedback?: UserReviewFeedback;
};

type StoredUserRecord = Omit<UserRecord, 'proAccess'> & {
  proAccess?: StoredProAccess;
  appProgress?: UserProgressRecord;
  appProgressUpdatedAt?: string;
  photoRequestCreditSpentAt?: number[];
  photoRequestCreditsUpdatedAt?: string;
};

type UpsertUserPayload = {
  displayName?: string;
  bio?: string;
  goal?: string;
  englishDifficulty?: string;
  pictureUrl?: string;
  authProvider?: string;
  promoCode?: string;
  subscriptionAccess?: {
    isActive?: boolean;
    expiresAt?: string | null;
    productId?: string;
    entitlementId?: string;
    appUserId?: string;
  };
  reviewFeedback?: {
    sentiment?: string;
    message?: string;
    source?: string;
    rewardCoins?: number;
  };
};

type RegisterDevicePayload = {
  deviceId?: unknown;
  expoPushToken?: unknown;
  platform?: unknown;
  appVersion?: unknown;
  buildVersion?: unknown;
  deviceName?: unknown;
  osName?: unknown;
  osVersion?: unknown;
  permissionStatus?: unknown;
};

type DeviceRecord = {
  deviceId: string;
  userId: string;
  email: string;
  cognitoSub?: string;
  expoPushToken?: string;
  tokenType?: 'expo';
  platform: 'ios' | 'android' | 'web' | 'unknown';
  appVersion?: string;
  buildVersion?: string;
  deviceName?: string;
  osName?: string;
  osVersion?: string;
  permissionStatus?: string;
  isActive: boolean;
  pushEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRegisteredAt: string;
};

export const handler = async (event: any): Promise<Result> => {
  const method: string =
    event.httpMethod || event.requestContext?.http?.method || 'GET';
  const rawPath: string =
    event.resource && event.path
      ? event.path
      : event.requestContext?.http?.path || '/';
  const path = rawPath.startsWith(ROUTE_PREFIX)
    ? rawPath
    : `${ROUTE_PREFIX}${rawPath}`;

  try {
    if ((method === 'GET' || method === 'POST') && path === `${ROUTE_PREFIX}/users/me`) {
      const claims = getClaims(event);
      const email = normalizeEmail(claims.email || claims['cognito:username']);
      if (!email) {
        return json(401, { code: 'UNAUTHORIZED', message: 'Missing email claim' });
      }

      const payload = method === 'POST' ? parseBody(event.body) as UpsertUserPayload | undefined : undefined;
      const record = await upsertCurrentUser(email, claims, payload);
      return json(200, record);
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/users/me/devices`) {
      const claims = getClaims(event);
      const email = normalizeEmail(claims.email || claims['cognito:username']);
      if (!email) {
        return json(401, { code: 'UNAUTHORIZED', message: 'Missing email claim' });
      }

      const payload = parseBody(event.body) as RegisterDevicePayload | undefined;
      const device = await registerCurrentUserDevice(email, claims, payload);
      if (!device) {
        return json(400, {
          code: 'INVALID_DEVICE',
          message: 'Missing or invalid push device payload',
        });
      }
      return json(200, { device });
    }

    if (method === 'DELETE' && path.startsWith(`${ROUTE_PREFIX}/users/me/devices/`)) {
      const claims = getClaims(event);
      const email = normalizeEmail(claims.email || claims['cognito:username']);
      if (!email) {
        return json(401, { code: 'UNAUTHORIZED', message: 'Missing email claim' });
      }

      const encodedDeviceId = path.slice(`${ROUTE_PREFIX}/users/me/devices/`.length);
      const deviceId = sanitizeDeviceId(safeDecodeURIComponent(encodedDeviceId));
      if (!deviceId) {
        return json(400, { code: 'INVALID_DEVICE_ID', message: 'Missing device id' });
      }
      const deleted = await unregisterCurrentUserDevice(email, deviceId);
      return json(200, { deleted });
    }

    if (method === 'GET' && path === `${ROUTE_PREFIX}/users/me/progress`) {
      const claims = getClaims(event);
      const email = normalizeEmail(claims.email || claims['cognito:username']);
      if (!email) {
        return json(401, { code: 'UNAUTHORIZED', message: 'Missing email claim' });
      }

      const progress = await getCurrentUserProgress(email);
      return json(200, { progress: progressApiPayload(progress) });
    }

    if (method === 'POST' && path === `${ROUTE_PREFIX}/users/me/progress`) {
      const claims = getClaims(event);
      const email = normalizeEmail(claims.email || claims['cognito:username']);
      if (!email) {
        return json(401, { code: 'UNAUTHORIZED', message: 'Missing email claim' });
      }

      const payload = parseBody(event.body);
      const progressInput =
        payload && typeof payload === 'object' && 'progress' in payload
          ? (payload as Record<string, unknown>).progress
          : payload;
      const progress = await mergeCurrentUserProgress(email, progressInput);
      return json(200, { progress: progressApiPayload(progress) });
    }

    return json(404, { code: 'NOT_FOUND', message: 'Not found' });
  } catch (err: any) {
    console.error(
      JSON.stringify({
        scope: 'users.handler.error',
        message: err?.message || 'unknown',
      })
    );
    return json(500, { code: 'INTERNAL_ERROR', message: 'Internal error' });
  }
};

function json(statusCode: number, body: unknown): Result {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
    body: JSON.stringify(body),
  };
}

function parseBody(body: unknown): Record<string, unknown> | undefined {
  if (!body) return undefined;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return undefined;
    }
  }
  return typeof body === 'object' ? body as Record<string, unknown> : undefined;
}

function getClaims(event: any): CognitoClaims {
  const rawClaims =
    event?.requestContext?.authorizer?.claims ||
    event?.requestContext?.authorizer?.jwt?.claims ||
    {};
  const claims: CognitoClaims = {};
  for (const [key, value] of Object.entries(rawClaims)) {
    if (value == null) continue;
    claims[key] = typeof value === 'string' ? value : String(value);
  }
  return claims;
}

function normalizeEmail(value?: string): string | undefined {
  const email = (value || '').trim().toLowerCase();
  return email || undefined;
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = (value || '').trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function resolveEditableProfileField(
  payload: UpsertUserPayload | undefined,
  previous: Partial<StoredUserRecord> | undefined,
  key: 'bio' | 'goal'
): string | undefined {
  if (payload && hasOwn(payload, key)) {
    return firstNonEmpty(asString(payload[key]));
  }
  return firstNonEmpty(previous?.[key]);
}

function coerceBoolean(value?: string): boolean | undefined {
  if (value == null) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function normalizeProvider(value?: string): string | undefined {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'google') return 'google';
  if (normalized === 'apple' || normalized === 'signinwithapple') return 'apple';
  if (normalized === 'correo' || normalized === 'email' || normalized === 'cognito') return 'email';
  return normalized;
}

function deriveProviderFromClaims(claims: CognitoClaims): string {
  const identities = claims.identities;
  if (identities) {
    try {
      const providers = JSON.parse(identities) as Array<{ providerName?: string }>;
      const providerName = providers[0]?.providerName;
      const normalized = normalizeProvider(providerName);
      if (normalized) return normalized;
    } catch {
      // Ignore malformed provider hints from Cognito.
    }
  }
  return 'email';
}

function normalizeStoredProAccess(input: unknown): StoredProAccess | undefined {
  const raw = asRecord(input);
  if (!raw) return undefined;

  const subscription = normalizeStoredSubscriptionAccess(raw.subscription);
  const code = normalizeStoredCodeAccess(raw.code);
  if (!subscription && !code) {
    return undefined;
  }

  return {
    ...(subscription ? { subscription } : {}),
    ...(code ? { code } : {}),
  };
}

function normalizeStoredSubscriptionAccess(input: unknown): StoredSubscriptionAccess | undefined {
  const raw = asRecord(input);
  if (!raw) return undefined;

  const updatedAt = asTimestamp(raw.updatedAt);
  if (!updatedAt) return undefined;

  return {
    isActive: asBoolean(raw.isActive) ?? false,
    updatedAt,
    ...(asTimestamp(raw.expiresAt) ? { expiresAt: asTimestamp(raw.expiresAt) } : {}),
    ...(firstNonEmpty(asString(raw.productId)) ? { productId: firstNonEmpty(asString(raw.productId)) } : {}),
    ...(firstNonEmpty(asString(raw.entitlementId))
      ? { entitlementId: firstNonEmpty(asString(raw.entitlementId)) }
      : {}),
    ...(firstNonEmpty(asString(raw.appUserId))
      ? { appUserId: firstNonEmpty(asString(raw.appUserId)) }
      : {}),
  };
}

function normalizeStoredCodeAccess(input: unknown): StoredCodeAccess | undefined {
  const raw = asRecord(input);
  if (!raw) return undefined;

  const updatedAt = asTimestamp(raw.updatedAt);
  if (!updatedAt) return undefined;

  return {
    isActive: asBoolean(raw.isActive) ?? false,
    updatedAt,
    ...(asTimestamp(raw.expiresAt) ? { expiresAt: asTimestamp(raw.expiresAt) } : {}),
    ...(firstNonEmpty(asString(raw.redeemedCode))
      ? { redeemedCode: firstNonEmpty(asString(raw.redeemedCode)) }
      : {}),
  };
}

function summarizeProAccess(input: unknown, now: string): UserProAccess | undefined {
  const stored = normalizeStoredProAccess(input);
  if (!stored) return undefined;

  const subscription = stored.subscription
    ? {
        ...stored.subscription,
        isActive: isGrantActive(stored.subscription, now),
      }
    : undefined;
  const code = stored.code
    ? {
        isActive: isGrantActive(stored.code, now),
        updatedAt: stored.code.updatedAt,
        ...(stored.code.expiresAt ? { expiresAt: stored.code.expiresAt } : {}),
      }
    : undefined;

  const activeSources = [
    subscription?.isActive ? 'subscription' : undefined,
    code?.isActive ? 'code' : undefined,
  ].filter((value): value is 'subscription' | 'code' => !!value);

  const updatedAt = maxTimestamp(subscription?.updatedAt, code?.updatedAt);
  return {
    isActive: activeSources.length > 0,
    ...(activeSources.length === 1
      ? { source: activeSources[0] }
      : activeSources.length > 1
      ? { source: 'multiple' as const }
      : {}),
    ...(updatedAt !== '1970-01-01T00:00:00.000Z' ? { updatedAt } : {}),
    ...(subscription ? { subscription } : {}),
    ...(code ? { code } : {}),
  };
}

function isGrantActive(
  grant?: { isActive: boolean; expiresAt?: string },
  now: string = new Date().toISOString()
): boolean {
  if (!grant?.isActive) {
    return false;
  }
  if (!grant.expiresAt) {
    return true;
  }
  return grant.expiresAt.localeCompare(now) > 0;
}

function applySubscriptionAccess(
  current: StoredProAccess | undefined,
  input: unknown,
  now: string,
  fallbackAppUserId?: string,
): StoredProAccess | undefined {
  const raw = asRecord(input);
  if (!raw) {
    return current;
  }

  const currentSubscription = normalizeStoredSubscriptionAccess(current?.subscription);
  const nextSubscription: StoredSubscriptionAccess = {
    isActive: asBoolean(raw.isActive) ?? false,
    updatedAt: now,
    ...(asTimestamp(raw.expiresAt) ? { expiresAt: asTimestamp(raw.expiresAt) } : {}),
    ...(firstNonEmpty(asString(raw.productId)) ? { productId: firstNonEmpty(asString(raw.productId)) } : {}),
    ...(firstNonEmpty(asString(raw.entitlementId))
      ? { entitlementId: firstNonEmpty(asString(raw.entitlementId)) }
      : {}),
    ...(firstNonEmpty(
      asString(raw.appUserId),
      currentSubscription?.appUserId,
      fallbackAppUserId,
    )
      ? {
          appUserId: firstNonEmpty(
            asString(raw.appUserId),
            currentSubscription?.appUserId,
            fallbackAppUserId,
          ),
        }
      : {}),
  };

  return {
    ...(current || {}),
    subscription: nextSubscription,
  };
}

function normalizeReviewFeedback(
  input: unknown,
  previous: UserReviewFeedback | undefined,
  now: string,
): UserReviewFeedback | undefined {
  const raw = asRecord(input);
  if (!raw) {
    return previous;
  }

  const sentiment = asString(raw.sentiment)?.trim().toLowerCase();
  if (sentiment !== 'positive' && sentiment !== 'negative') {
    return previous;
  }

  const message = sanitizeUserText(raw.message, 1200);
  if (sentiment === 'negative' && !message) {
    return previous;
  }

  const source = sanitizeUserText(raw.source, 80);
  const rewardCoins =
    typeof raw.rewardCoins === 'number' && Number.isFinite(raw.rewardCoins) && raw.rewardCoins > 0
      ? Math.floor(raw.rewardCoins)
      : undefined;

  return {
    sentiment,
    submittedAt: now,
    ...(message ? { message } : {}),
    ...(source ? { source } : {}),
    ...(rewardCoins ? { rewardCoins } : {}),
  };
}

function redeemPromoCode(
  current: StoredProAccess | undefined,
  submittedCode: string
): { proAccess: StoredProAccess; result: PromoCodeRedemptionResult } {
  const validation = validatePromoCode(submittedCode);
  if (!validation.isValid) {
    return {
      proAccess: current || {},
      result: validation,
    };
  }

  const expiresAt = calculatePromoExpirationIso(validation.premiumDays);
  return {
    proAccess: {
      ...(current || {}),
      code: {
        isActive: true,
        updatedAt: new Date().toISOString(),
        expiresAt,
        redeemedCode: validation.code,
      },
    },
    result: {
      ...validation,
      expiresAt,
    },
  };
}

async function upsertCurrentUser(
  email: string,
  claims: CognitoClaims,
  payload?: UpsertUserPayload
): Promise<{ user: UserRecord; created: boolean; promoCode?: PromoCodeRedemptionResult }> {
  const previous = await getCurrentStoredUser(email);
  const now = new Date().toISOString();
  const previousProAccess = normalizeStoredProAccess(previous?.proAccess);
  let nextProAccess = previousProAccess;
  let promoCodeResult: PromoCodeRedemptionResult | undefined;

  const submittedPromoCode = asString(payload?.promoCode)?.trim();
  if (submittedPromoCode) {
    const nextPromo = redeemPromoCode(nextProAccess, submittedPromoCode);
    promoCodeResult = nextPromo.result;
    if (nextPromo.result.isValid) {
      nextProAccess = nextPromo.proAccess;
    }
  }

  if (payload && hasOwn(payload, 'subscriptionAccess')) {
    nextProAccess = applySubscriptionAccess(nextProAccess, payload.subscriptionAccess, now, claims.sub);
  }

  const summarizedProAccess = summarizeProAccess(nextProAccess, now);
  const bio = resolveEditableProfileField(payload, previous, 'bio');
  const goal = resolveEditableProfileField(payload, previous, 'goal');
  const reviewFeedback =
    payload && hasOwn(payload, 'reviewFeedback')
      ? normalizeReviewFeedback(payload.reviewFeedback, previous?.reviewFeedback, now)
      : previous?.reviewFeedback;
  const rawDifficulty = payload && hasOwn(payload, 'englishDifficulty')
    ? asString(payload.englishDifficulty)?.trim().toLowerCase()
    : previous?.englishDifficulty;
  const englishDifficulty: 'easy' | 'medium' | 'hard' | undefined =
    rawDifficulty === 'easy' || rawDifficulty === 'medium' || rawDifficulty === 'hard'
      ? rawDifficulty
      : undefined;
  const user: UserRecord = {
    email,
    cognitoSub: firstNonEmpty(claims.sub, previous?.cognitoSub),
    displayName: firstNonEmpty(
      asString(payload?.displayName),
      claims.name,
      previous?.displayName
    ),
    ...(bio ? { bio } : {}),
    ...(goal ? { goal } : {}),
    ...(englishDifficulty ? { englishDifficulty } : {}),
    givenName: firstNonEmpty(claims.given_name, previous?.givenName),
    familyName: firstNonEmpty(claims.family_name, previous?.familyName),
    pictureUrl: firstNonEmpty(
      asString(payload?.pictureUrl),
      claims.picture,
      previous?.pictureUrl
    ),
    emailVerified: coerceBoolean(claims.email_verified) ?? previous?.emailVerified ?? false,
    status: 'active',
    lastAuthProvider:
      normalizeProvider(asString(payload?.authProvider)) ||
      normalizeProvider(previous?.lastAuthProvider) ||
      deriveProviderFromClaims(claims),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    lastLoginAt: now,
    isPro: summarizedProAccess?.isActive ?? false,
    ...(summarizedProAccess ? { proAccess: summarizedProAccess } : {}),
    ...(reviewFeedback ? { reviewFeedback } : {}),
  };
  const storedUser: StoredUserRecord = {
    ...user,
    proAccess: nextProAccess,
    appProgress: previous?.appProgress,
    appProgressUpdatedAt: previous?.appProgressUpdatedAt,
    photoRequestCreditSpentAt: previous?.photoRequestCreditSpentAt,
    photoRequestCreditsUpdatedAt: previous?.photoRequestCreditsUpdatedAt,
  };

  await dynamo.send(
    new PutCommand({
      TableName: getUsersTableName(),
      Item: storedUser,
    })
  );

  return {
    user,
    created: !previous?.createdAt,
    ...(promoCodeResult ? { promoCode: promoCodeResult } : {}),
  };
}

async function getCurrentStoredUser(email: string): Promise<Partial<StoredUserRecord> | undefined> {
  const existing = await dynamo.send(
    new GetCommand({
      TableName: getUsersTableName(),
      Key: { email },
    })
  );
  return existing.Item as Partial<StoredUserRecord> | undefined;
}

async function getCurrentUserProgress(email: string): Promise<UserProgressRecord> {
  const previous = await getCurrentStoredUser(email);
  return normalizeUserProgressRecord(previous?.appProgress);
}

async function mergeCurrentUserProgress(
  email: string,
  input: unknown
): Promise<UserProgressRecord> {
  const previous = await getCurrentStoredUser(email);
  const progress = mergeUserProgressRecords(previous?.appProgress, input);
  const progressUpdatedAt = maxTimestamp(progress.cards.updatedAt, progress.characters.updatedAt);

  await dynamo.send(
    new UpdateCommand({
      TableName: getUsersTableName(),
      Key: { email },
      UpdateExpression: 'SET appProgress = :progress, appProgressUpdatedAt = :progressUpdatedAt',
      ExpressionAttributeValues: {
        ':progress': progress,
        ':progressUpdatedAt': progressUpdatedAt,
      },
    })
  );

  return progress;
}

async function registerCurrentUserDevice(
  email: string,
  claims: CognitoClaims,
  payload?: RegisterDevicePayload
): Promise<DeviceRecord | undefined> {
  const deviceId = sanitizeDeviceId(payload?.deviceId);
  const submittedExpoPushToken = asString(payload?.expoPushToken)?.trim();
  const expoPushToken = sanitizeExpoPushToken(payload?.expoPushToken);
  if (!deviceId || (submittedExpoPushToken && !expoPushToken)) {
    return undefined;
  }

  const now = new Date().toISOString();
  const platform = normalizeDevicePlatform(payload?.platform);
  const values: Record<string, unknown> = {
    ':deviceId': deviceId,
    ':userId': email,
    ':email': email,
    ':platform': platform,
    ':isActive': true,
    ':pushEnabled': Boolean(expoPushToken),
    ':now': now,
  };
  const names: Record<string, string> = {
    '#platform': 'platform',
  };
  const setParts = [
    'deviceId = :deviceId',
    'userId = :userId',
    'email = :email',
    '#platform = :platform',
    'isActive = :isActive',
    'pushEnabled = :pushEnabled',
    'createdAt = if_not_exists(createdAt, :now)',
    'updatedAt = :now',
    'lastRegisteredAt = :now',
  ];
  const removeParts: string[] = [];

  if (expoPushToken) {
    values[':expoPushToken'] = expoPushToken;
    values[':tokenType'] = 'expo';
    setParts.push('expoPushToken = :expoPushToken', 'tokenType = :tokenType');
  } else {
    removeParts.push('expoPushToken', 'tokenType');
  }

  const optionalFields: Array<keyof Pick<
    DeviceRecord,
    'cognitoSub' | 'appVersion' | 'buildVersion' | 'deviceName' | 'osName' | 'osVersion' | 'permissionStatus'
  >> = [
    'cognitoSub',
    'appVersion',
    'buildVersion',
    'deviceName',
    'osName',
    'osVersion',
    'permissionStatus',
  ];
  const sanitizedOptional: Partial<DeviceRecord> = {
    cognitoSub: firstNonEmpty(claims.sub),
    appVersion: sanitizeDeviceText(payload?.appVersion, 40),
    buildVersion: sanitizeDeviceText(payload?.buildVersion, 40),
    deviceName: sanitizeDeviceText(payload?.deviceName, 120),
    osName: sanitizeDeviceText(payload?.osName, 80),
    osVersion: sanitizeDeviceText(payload?.osVersion, 80),
    permissionStatus: sanitizeDeviceText(payload?.permissionStatus, 40),
  };

  for (const field of optionalFields) {
    const value = sanitizedOptional[field];
    if (!value) continue;
    const placeholder = `:${field}`;
    values[placeholder] = value;
    setParts.push(`${field} = ${placeholder}`);
  }

  const out = await dynamo.send(
    new UpdateCommand({
      TableName: getDevicesTableName(),
      Key: { deviceId },
      UpdateExpression: [
        `SET ${setParts.join(', ')}`,
        removeParts.length ? `REMOVE ${removeParts.join(', ')}` : '',
      ].filter(Boolean).join(' '),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    })
  );

  return out.Attributes as DeviceRecord | undefined;
}

async function unregisterCurrentUserDevice(email: string, deviceId: string): Promise<boolean> {
  try {
    await dynamo.send(
      new DeleteCommand({
        TableName: getDevicesTableName(),
        Key: { deviceId },
        ConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': email,
        },
      })
    );
    return true;
  } catch (err: any) {
    if (err?.name === 'ConditionalCheckFailedException') {
      return false;
    }
    throw err;
  }
}

function progressApiPayload(progress: UserProgressRecord) {
  // Emit both the canonical `characters` shape and the legacy `stories` shape so
  // existing mobile clients (which read `stories.items[storyId].completedMissions`)
  // keep working until they migrate to the characterId-flat shape.
  return {
    ...progress,
    stories: deriveLegacyStoriesDocument(progress.characters),
  };
}

function getUsersTableName(): string {
  const tableName = process.env.USERS_TABLE_NAME;
  if (!tableName) {
    throw new Error('USERS_TABLE_NAME not set');
  }
  return tableName;
}

function getDevicesTableName(): string {
  const tableName = process.env.DEVICES_TABLE_NAME;
  if (!tableName) {
    throw new Error('DEVICES_TABLE_NAME not set');
  }
  return tableName;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function asTimestamp(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function sanitizeDeviceId(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized || normalized.length > 120) {
    return undefined;
  }
  if (!/^[A-Za-z0-9._:-]+$/.test(normalized)) {
    return undefined;
  }
  return normalized;
}

function safeDecodeURIComponent(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function sanitizeExpoPushToken(value: unknown): string | undefined {
  const normalized = asString(value)?.trim();
  if (!normalized || normalized.length > 140) {
    return undefined;
  }
  if (!/^(ExpoPushToken|ExponentPushToken)\[[A-Za-z0-9_-]+\]$/.test(normalized)) {
    return undefined;
  }
  return normalized;
}

function sanitizeDeviceText(value: unknown, maxLength: number): string | undefined {
  const normalized = asString(value)?.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, maxLength);
}

function sanitizeUserText(value: unknown, maxLength: number): string | undefined {
  const normalized = asString(value)?.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return undefined;
  }
  return normalized.slice(0, maxLength);
}

function normalizeDevicePlatform(value: unknown): DeviceRecord['platform'] {
  const normalized = asString(value)?.trim().toLowerCase();
  if (normalized === 'ios' || normalized === 'android' || normalized === 'web') {
    return normalized;
  }
  return 'unknown';
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function maxTimestamp(...values: Array<string | undefined>): string {
  let next = '1970-01-01T00:00:00.000Z';
  for (const value of values) {
    if (!value) continue;
    if (value.localeCompare(next) > 0) {
      next = value;
    }
  }
  return next;
}
