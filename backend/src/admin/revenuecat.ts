import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const REVENUECAT_API_BASE_URL = 'https://api.revenuecat.com';
const MIN_TIMESTAMP = '1970-01-01T00:00:00.000Z';

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
};

type StoredProAccess = {
  subscription?: StoredSubscriptionAccess;
  code?: StoredCodeAccess;
};

type StoredRevenueCatUserRecord = {
  email?: unknown;
  cognitoSub?: unknown;
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
};

type RevenueCatEntitlement = {
  expires_date?: unknown;
  grace_period_expires_date?: unknown;
  product_identifier?: unknown;
};

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
  };
};

type ResolvedRevenueCatEntitlement = {
  entitlementId?: string;
  entitlement?: RevenueCatEntitlement;
};

export type RevenueCatVerificationItem = {
  email: string;
  status: 'verified' | 'skipped' | 'error';
  changed?: boolean;
  previousIsActive?: boolean;
  currentIsActive?: boolean;
  appUserId?: string;
  reason?: string;
};

export type RevenueCatVerificationResponse = {
  checkedAt: string;
  summary: {
    scannedUsers: number;
    subscriptionUsers: number;
    verifiedUsers: number;
    updatedUsers: number;
    unchangedUsers: number;
    reactivatedUsers: number;
    deactivatedUsers: number;
    skippedMissingAppUserId: number;
    errors: number;
  };
  users: RevenueCatVerificationItem[];
};

export async function verifyRevenueCatPremiumUsers(): Promise<RevenueCatVerificationResponse> {
  const apiKey = getRevenueCatSecretKey();
  const defaultEntitlementId = firstNonEmpty(process.env.REVENUECAT_ENTITLEMENT_ID);
  const checkedAt = new Date().toISOString();
  const items = await scanAllUsers();
  const candidates = items
    .map((item) => toVerifiableUser(item))
    .filter((item): item is VerifiableRevenueCatUser => !!item);

  const users = await mapWithConcurrency(candidates, 5, async (item) =>
    verifyRevenueCatUser(item, {
      apiKey,
      checkedAt,
      defaultEntitlementId,
    }),
  );

  return {
    checkedAt,
    summary: {
      scannedUsers: items.length,
      subscriptionUsers: candidates.length,
      verifiedUsers: users.filter((item) => item.status === 'verified').length,
      updatedUsers: users.filter((item) => item.status === 'verified' && item.changed).length,
      unchangedUsers: users.filter((item) => item.status === 'verified' && !item.changed).length,
      reactivatedUsers: users.filter(
        (item) => item.status === 'verified' && !item.previousIsActive && item.currentIsActive,
      ).length,
      deactivatedUsers: users.filter(
        (item) => item.status === 'verified' && item.previousIsActive && !item.currentIsActive,
      ).length,
      skippedMissingAppUserId: users.filter(
        (item) => item.status === 'skipped' && item.reason === 'missing_app_user_id',
      ).length,
      errors: users.filter((item) => item.status === 'error').length,
    },
    users,
  };
}

type VerifiableRevenueCatUser = {
  email: string;
  currentIsPro: boolean;
  subscription: NormalizedSubscriptionAccess;
  code?: NormalizedCodeAccess;
};

type VerifyRevenueCatUserOptions = {
  apiKey: string;
  checkedAt: string;
  defaultEntitlementId?: string;
};

async function verifyRevenueCatUser(
  user: VerifiableRevenueCatUser,
  options: VerifyRevenueCatUserOptions,
): Promise<RevenueCatVerificationItem> {
  if (!user.subscription.appUserId) {
    return {
      email: user.email,
      status: 'skipped',
      previousIsActive: user.subscription.isActive,
      currentIsActive: user.subscription.isActive,
      reason: 'missing_app_user_id',
    };
  }

  try {
    const subscriber = await fetchRevenueCatSubscriber(user.subscription.appUserId, options.apiKey);
    const nextSubscription = buildSubscriptionStateFromRevenueCat(user.subscription, subscriber, {
      checkedAt: options.checkedAt,
      defaultEntitlementId: options.defaultEntitlementId,
    });
    const codeIsActive = isGrantActive(user.code, options.checkedAt);
    const nextIsPro = nextSubscription.isActive || codeIsActive;
    const changed =
      user.currentIsPro !== nextIsPro ||
      hasMeaningfulSubscriptionChange(user.subscription, nextSubscription);

    await persistRevenueCatVerification(user.email, {
      isPro: nextIsPro,
      updatedAt: options.checkedAt,
      proAccess: {
        ...(user.code ? { code: user.code } : {}),
        subscription: nextSubscription,
      },
    });

    return {
      email: user.email,
      status: 'verified',
      changed,
      previousIsActive: user.subscription.isActive,
      currentIsActive: nextSubscription.isActive,
      appUserId: nextSubscription.appUserId,
    };
  } catch (error) {
    return {
      email: user.email,
      status: 'error',
      previousIsActive: user.subscription.isActive,
      currentIsActive: user.subscription.isActive,
      appUserId: user.subscription.appUserId,
      reason: error instanceof Error ? error.message : 'revenuecat_request_failed',
    };
  }
}

export function buildSubscriptionStateFromRevenueCat(
  current: NormalizedSubscriptionAccess,
  subscriber: RevenueCatSubscriberResponse['subscriber'] | undefined,
  options: { checkedAt: string; defaultEntitlementId?: string },
): NormalizedSubscriptionAccess {
  const expectedEntitlementId = firstNonEmpty(current.entitlementId, options.defaultEntitlementId);
  const entitlements = asRecord(subscriber?.entitlements) as
    | Record<string, RevenueCatEntitlement>
    | undefined;
  const resolved = resolveRevenueCatEntitlement(
    entitlements,
    expectedEntitlementId,
    current.productId,
  );
  const entitlement = resolved.entitlement;
  const expiresAt = maxTimestamp(
    asTimestamp(entitlement?.expires_date),
    asTimestamp(entitlement?.grace_period_expires_date),
  );
  const isActive = isRevenueCatEntitlementActive(entitlement, options.checkedAt);

  return {
    isActive,
    updatedAt: options.checkedAt,
    ...(expiresAt !== MIN_TIMESTAMP ? { expiresAt } : {}),
    ...(firstNonEmpty(asString(entitlement?.product_identifier), current.productId)
      ? { productId: firstNonEmpty(asString(entitlement?.product_identifier), current.productId) }
      : {}),
    ...(firstNonEmpty(resolved.entitlementId, expectedEntitlementId)
      ? { entitlementId: firstNonEmpty(resolved.entitlementId, expectedEntitlementId) }
      : {}),
    ...(current.appUserId ? { appUserId: current.appUserId } : {}),
  };
}

export function resolveRevenueCatEntitlement(
  entitlements: Record<string, RevenueCatEntitlement> | undefined,
  expectedEntitlementId?: string,
  expectedProductId?: string,
): ResolvedRevenueCatEntitlement {
  if (!entitlements) {
    return {};
  }

  if (expectedEntitlementId && asRecord(entitlements[expectedEntitlementId])) {
    return {
      entitlementId: expectedEntitlementId,
      entitlement: entitlements[expectedEntitlementId],
    };
  }

  const entries = Object.entries(entitlements).filter(([, value]) => !!asRecord(value));
  if (expectedProductId) {
    const match = entries.find(([, value]) => asString(value.product_identifier) === expectedProductId);
    if (match) {
      return {
        entitlementId: match[0],
        entitlement: match[1],
      };
    }
  }

  if (entries.length === 1) {
    return {
      entitlementId: entries[0][0],
      entitlement: entries[0][1],
    };
  }

  return {};
}

function isRevenueCatEntitlementActive(
  entitlement: RevenueCatEntitlement | undefined,
  now: string,
): boolean {
  if (!entitlement) {
    return false;
  }

  const accessUntil = maxTimestamp(
    asTimestamp(entitlement.expires_date),
    asTimestamp(entitlement.grace_period_expires_date),
  );
  if (accessUntil === MIN_TIMESTAMP) {
    return true;
  }

  return accessUntil.localeCompare(now) > 0;
}

async function fetchRevenueCatSubscriber(
  appUserId: string,
  apiKey: string,
): Promise<RevenueCatSubscriberResponse['subscriber'] | undefined> {
  const response = await fetch(
    `${REVENUECAT_API_BASE_URL}/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`revenuecat_http_${response.status}`);
  }

  const payload = (await response.json()) as RevenueCatSubscriberResponse;
  return asRecord(payload.subscriber) as RevenueCatSubscriberResponse['subscriber'] | undefined;
}

async function persistRevenueCatVerification(
  email: string,
  input: {
    isPro: boolean;
    updatedAt: string;
    proAccess: {
      subscription: NormalizedSubscriptionAccess;
      code?: NormalizedCodeAccess;
    };
  },
): Promise<void> {
  await dynamo.send(
    new UpdateCommand({
      TableName: getUsersTableName(),
      Key: { email },
      UpdateExpression: 'SET isPro = :isPro, updatedAt = :updatedAt, proAccess = :proAccess',
      ExpressionAttributeValues: {
        ':isPro': input.isPro,
        ':updatedAt': input.updatedAt,
        ':proAccess': input.proAccess,
      },
    }),
  );
}

async function scanAllUsers(): Promise<unknown[]> {
  const items: unknown[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: getUsersTableName(),
        ExclusiveStartKey: exclusiveStartKey,
        ProjectionExpression: 'email, cognitoSub, isPro, proAccess',
      }),
    );

    items.push(...(page.Items || []));
    exclusiveStartKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);

  return items;
}

function toVerifiableUser(input: unknown): VerifiableRevenueCatUser | undefined {
  const raw = asRecord(input) as StoredRevenueCatUserRecord | undefined;
  const email = firstNonEmpty(asString(raw?.email));
  if (!email) {
    return undefined;
  }

  const proAccess = asRecord(raw?.proAccess);
  const subscription = normalizeStoredSubscriptionAccess(proAccess?.subscription);
  if (!subscription) {
    return undefined;
  }

  const code = normalizeStoredCodeAccess(proAccess?.code);
  const now = new Date().toISOString();
  const normalizedSubscription: NormalizedSubscriptionAccess = {
    ...subscription,
    ...(firstNonEmpty(subscription.appUserId, asString(raw?.cognitoSub))
      ? { appUserId: firstNonEmpty(subscription.appUserId, asString(raw?.cognitoSub)) }
      : {}),
  };
  const subscriptionIsActive = isGrantActive(normalizedSubscription, now);

  if (!subscriptionIsActive) {
    return undefined;
  }

  return {
    email,
    currentIsPro: subscriptionIsActive || isGrantActive(code, now) || (asBoolean(raw?.isPro) ?? false),
    subscription: normalizedSubscription,
    code,
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
    ...(firstNonEmpty(asString(raw.productId))
      ? { productId: firstNonEmpty(asString(raw.productId)) }
      : {}),
    ...(firstNonEmpty(asString(raw.entitlementId))
      ? { entitlementId: firstNonEmpty(asString(raw.entitlementId)) }
      : {}),
    ...(firstNonEmpty(asString(raw.appUserId))
      ? { appUserId: firstNonEmpty(asString(raw.appUserId)) }
      : {}),
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
  };
}

function isGrantActive(
  grant: { isActive: boolean; expiresAt?: string } | undefined,
  now: string,
): boolean {
  if (!grant?.isActive) {
    return false;
  }

  if (!grant.expiresAt) {
    return true;
  }

  return grant.expiresAt.localeCompare(now) > 0;
}

function hasMeaningfulSubscriptionChange(
  previous: NormalizedSubscriptionAccess,
  next: NormalizedSubscriptionAccess,
): boolean {
  return (
    previous.isActive !== next.isActive ||
    previous.expiresAt !== next.expiresAt ||
    previous.productId !== next.productId ||
    previous.entitlementId !== next.entitlementId ||
    previous.appUserId !== next.appUserId
  );
}

function getUsersTableName(): string {
  const tableName = process.env.USERS_TABLE_NAME;
  if (!tableName) {
    throw new Error('USERS_TABLE_NAME not set');
  }
  return tableName;
}

function getRevenueCatSecretKey(): string {
  const apiKey = firstNonEmpty(process.env.REVENUECAT_SECRET_KEY);
  if (!apiKey) {
    throw new Error('REVENUECAT_SECRET_KEY not set');
  }
  return apiKey;
}

async function mapWithConcurrency<T, TResult>(
  items: T[],
  concurrency: number,
  iteratee: (item: T, index: number) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length || 1) }, async () => {
    while (currentIndex < items.length) {
      const nextIndex = currentIndex;
      currentIndex += 1;
      results[nextIndex] = await iteratee(items[nextIndex], nextIndex);
    }
  });

  await Promise.all(workers);
  return results;
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
