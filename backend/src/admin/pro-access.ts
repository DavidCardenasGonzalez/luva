import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const MIN_TIMESTAMP = '1970-01-01T00:00:00.000Z';
const MAX_PREMIUM_DAYS = 36500;
const ADMIN_PORTAL_CODE = 'ADMIN_PORTAL';

type StoredSubscriptionAccess = {
  isActive?: unknown;
  updatedAt?: unknown;
  expiresAt?: unknown;
  productId?: unknown;
  entitlementId?: unknown;
  appUserId?: unknown;
};

type StoredCodeAccess = {
  isActive?: unknown;
  updatedAt?: unknown;
  expiresAt?: unknown;
  redeemedCode?: unknown;
};

type StoredProAccess = {
  subscription?: StoredSubscriptionAccess;
  code?: StoredCodeAccess;
};

type StoredAdminGrantUserRecord = {
  email?: unknown;
  isPro?: unknown;
  proAccess?: StoredProAccess;
};

type NormalizedSubscriptionAccess = {
  isActive: boolean;
  updatedAt: string;
  expiresAt?: string;
  productId?: string;
  entitlementId?: string;
  appUserId?: string;
};

type NormalizedCodeAccess = {
  isActive: boolean;
  updatedAt: string;
  expiresAt?: string;
  redeemedCode?: string;
};

export type GrantManualCodeProAccessInput = {
  email?: unknown;
  premiumDays?: unknown;
};

export type GrantManualCodeProAccessResponse = {
  email: string;
  premiumDays: number;
  effectiveFrom: string;
  expiresAt: string;
  previousCodeExpiresAt?: string;
  extendedExistingGrant: boolean;
  isPro: boolean;
  source: 'code' | 'multiple';
  updatedAt: string;
};

export type RevokeManualCodeProAccessInput = {
  email?: unknown;
};

export type RevokeManualCodeProAccessResponse = {
  email: string;
  revokedActiveGrant: boolean;
  previousCodeExpiresAt?: string;
  isPro: boolean;
  source: 'subscription' | 'free';
  updatedAt: string;
};

export function buildManualCodeGrantState(options: {
  currentCode?: NormalizedCodeAccess;
  currentSubscription?: NormalizedSubscriptionAccess;
  premiumDays: number;
  now?: string;
}): GrantManualCodeProAccessResponse & { nextCode: NormalizedCodeAccess } {
  const now = asTimestamp(options.now) || new Date().toISOString();
  const effectiveFrom = resolveCodeGrantEffectiveFrom(options.currentCode, now);
  const expiresAt = addDaysToTimestamp(effectiveFrom, options.premiumDays);
  const previousCodeExpiresAt = options.currentCode?.expiresAt;
  const extendedExistingGrant =
    !!previousCodeExpiresAt && previousCodeExpiresAt.localeCompare(now) > 0;
  const nextCode: NormalizedCodeAccess = {
    isActive: true,
    updatedAt: now,
    expiresAt,
    redeemedCode: ADMIN_PORTAL_CODE,
  };
  const subscriptionActive = isGrantActive(options.currentSubscription, now);

  return {
    email: '',
    premiumDays: options.premiumDays,
    effectiveFrom,
    expiresAt,
    ...(previousCodeExpiresAt ? { previousCodeExpiresAt } : {}),
    extendedExistingGrant,
    isPro: true,
    source: subscriptionActive ? 'multiple' : 'code',
    updatedAt: now,
    nextCode,
  };
}

export async function grantManualCodeProAccess(
  input: GrantManualCodeProAccessInput,
): Promise<GrantManualCodeProAccessResponse> {
  const email = normalizeEmail(asString(input.email));
  if (!email) {
    throw new Error('INVALID_EMAIL');
  }

  const premiumDays = normalizePremiumDays(input.premiumDays);
  if (!premiumDays) {
    throw new Error('INVALID_PREMIUM_DAYS');
  }

  const existing = await getCurrentStoredUser(email);
  if (!existing) {
    throw new Error('USER_NOT_FOUND');
  }

  const now = new Date().toISOString();
  const currentProAccess = normalizeStoredProAccess(existing.proAccess);
  const currentSubscription = currentProAccess?.subscription;
  const currentCode = currentProAccess?.code;
  const nextGrant = buildManualCodeGrantState({
    currentCode,
    currentSubscription,
    premiumDays,
    now,
  });

  await dynamo.send(
    new UpdateCommand({
      TableName: getUsersTableName(),
      Key: { email },
      UpdateExpression: 'SET isPro = :isPro, updatedAt = :updatedAt, proAccess = :proAccess',
      ExpressionAttributeValues: {
        ':isPro': true,
        ':updatedAt': nextGrant.updatedAt,
        ':proAccess': {
          ...(currentSubscription ? { subscription: currentSubscription } : {}),
          code: nextGrant.nextCode,
        },
      },
    }),
  );

  return {
    email,
    premiumDays: nextGrant.premiumDays,
    effectiveFrom: nextGrant.effectiveFrom,
    expiresAt: nextGrant.expiresAt,
    ...(nextGrant.previousCodeExpiresAt
      ? { previousCodeExpiresAt: nextGrant.previousCodeExpiresAt }
      : {}),
    extendedExistingGrant: nextGrant.extendedExistingGrant,
    isPro: nextGrant.isPro,
    source: nextGrant.source,
    updatedAt: nextGrant.updatedAt,
  };
}

export async function revokeManualCodeProAccess(
  input: RevokeManualCodeProAccessInput,
): Promise<RevokeManualCodeProAccessResponse> {
  const email = normalizeEmail(asString(input.email));
  if (!email) {
    throw new Error('INVALID_EMAIL');
  }

  const existing = await getCurrentStoredUser(email);
  if (!existing) {
    throw new Error('USER_NOT_FOUND');
  }

  const now = new Date().toISOString();
  const currentProAccess = normalizeStoredProAccess(existing.proAccess);
  const currentSubscription = currentProAccess?.subscription;
  const currentCode = currentProAccess?.code;
  const nextRevocation = buildManualCodeRevocationState({
    currentCode,
    currentSubscription,
    now,
  });
  if (!nextRevocation) {
    throw new Error('CODE_GRANT_NOT_ACTIVE');
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: getUsersTableName(),
      Key: { email },
      UpdateExpression: 'SET isPro = :isPro, updatedAt = :updatedAt, proAccess = :proAccess',
      ExpressionAttributeValues: {
        ':isPro': nextRevocation.isPro,
        ':updatedAt': nextRevocation.updatedAt,
        ':proAccess': {
          ...(currentSubscription ? { subscription: currentSubscription } : {}),
          code: nextRevocation.nextCode,
        },
      },
    }),
  );

  return {
    email,
    revokedActiveGrant: nextRevocation.revokedActiveGrant,
    ...(nextRevocation.previousCodeExpiresAt
      ? { previousCodeExpiresAt: nextRevocation.previousCodeExpiresAt }
      : {}),
    isPro: nextRevocation.isPro,
    source: nextRevocation.source,
    updatedAt: nextRevocation.updatedAt,
  };
}

export function buildManualCodeRevocationState(options: {
  currentCode?: NormalizedCodeAccess;
  currentSubscription?: NormalizedSubscriptionAccess;
  now?: string;
}): (RevokeManualCodeProAccessResponse & { nextCode: NormalizedCodeAccess }) | undefined {
  const now = asTimestamp(options.now) || new Date().toISOString();
  const codeIsActive = isGrantActive(options.currentCode, now);
  if (!codeIsActive) {
    return undefined;
  }

  const nextCode: NormalizedCodeAccess = {
    ...(options.currentCode || {
      isActive: false,
      updatedAt: now,
    }),
    isActive: false,
    updatedAt: now,
    expiresAt: now,
  };
  const subscriptionActive = isGrantActive(options.currentSubscription, now);

  return {
    email: '',
    revokedActiveGrant: true,
    ...(options.currentCode?.expiresAt
      ? { previousCodeExpiresAt: options.currentCode.expiresAt }
      : {}),
    isPro: subscriptionActive,
    source: subscriptionActive ? 'subscription' : 'free',
    updatedAt: now,
    nextCode,
  };
}

async function getCurrentStoredUser(email: string): Promise<StoredAdminGrantUserRecord | undefined> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: getUsersTableName(),
      Key: { email },
      ProjectionExpression: 'email, isPro, proAccess',
    }),
  );

  return result.Item as StoredAdminGrantUserRecord | undefined;
}

function normalizeStoredProAccess(input: unknown): {
  subscription?: NormalizedSubscriptionAccess;
  code?: NormalizedCodeAccess;
} | undefined {
  const raw = asRecord(input);
  if (!raw) {
    return undefined;
  }

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

function normalizeStoredSubscriptionAccess(
  input: unknown,
): NormalizedSubscriptionAccess | undefined {
  const raw = asRecord(input);
  if (!raw) {
    return undefined;
  }

  const updatedAt = asTimestamp(raw.updatedAt);
  if (!updatedAt) {
    return undefined;
  }

  return {
    isActive: asBoolean(raw.isActive) ?? false,
    updatedAt,
    ...(asTimestamp(raw.expiresAt) ? { expiresAt: asTimestamp(raw.expiresAt) } : {}),
    ...(firstNonEmpty(asString(raw.productId)) ? { productId: firstNonEmpty(asString(raw.productId)) } : {}),
    ...(firstNonEmpty(asString(raw.entitlementId))
      ? { entitlementId: firstNonEmpty(asString(raw.entitlementId)) }
      : {}),
    ...(firstNonEmpty(asString(raw.appUserId)) ? { appUserId: firstNonEmpty(asString(raw.appUserId)) } : {}),
  };
}

function normalizeStoredCodeAccess(input: unknown): NormalizedCodeAccess | undefined {
  const raw = asRecord(input);
  if (!raw) {
    return undefined;
  }

  const updatedAt = asTimestamp(raw.updatedAt);
  if (!updatedAt) {
    return undefined;
  }

  return {
    isActive: asBoolean(raw.isActive) ?? false,
    updatedAt,
    ...(asTimestamp(raw.expiresAt) ? { expiresAt: asTimestamp(raw.expiresAt) } : {}),
    ...(firstNonEmpty(asString(raw.redeemedCode))
      ? { redeemedCode: firstNonEmpty(asString(raw.redeemedCode)) }
      : {}),
  };
}

function resolveCodeGrantEffectiveFrom(
  currentCode: NormalizedCodeAccess | undefined,
  now: string,
): string {
  if (currentCode?.expiresAt && currentCode.expiresAt.localeCompare(now) > 0) {
    return currentCode.expiresAt;
  }

  return now;
}

function addDaysToTimestamp(value: string, premiumDays: number): string {
  const base = new Date(value);
  if (Number.isNaN(base.getTime())) {
    return new Date(Date.now() + premiumDays * 24 * 60 * 60 * 1000).toISOString();
  }

  return new Date(base.getTime() + premiumDays * 24 * 60 * 60 * 1000).toISOString();
}

function normalizePremiumDays(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
      ? Number(value)
      : NaN;

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  const integerDays = Math.floor(parsed);
  if (integerDays <= 0 || integerDays > MAX_PREMIUM_DAYS) {
    return undefined;
  }

  return integerDays;
}

function isGrantActive(
  grant?: { isActive: boolean; expiresAt?: string },
  now: string = new Date().toISOString(),
): boolean {
  if (!grant?.isActive) {
    return false;
  }

  if (!grant.expiresAt) {
    return true;
  }

  return grant.expiresAt.localeCompare(now) > 0;
}

function normalizeEmail(value?: string): string | undefined {
  const email = (value || '').trim().toLowerCase();
  return email || undefined;
}

function getUsersTableName(): string {
  const tableName = process.env.USERS_TABLE_NAME;
  if (!tableName) {
    throw new Error('USERS_TABLE_NAME not set');
  }
  return tableName;
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

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
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

function maxTimestamp(...values: Array<string | undefined>): string {
  let current = MIN_TIMESTAMP;
  for (const value of values) {
    if (!value) {
      continue;
    }
    if (value.localeCompare(current) > 0) {
      current = value;
    }
  }
  return current;
}
