import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { MIN_PROGRESS_TIMESTAMP, normalizeUserProgressRecord } from '../progress';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

type AdminUserProvider = 'email' | 'google' | 'apple' | 'other';

type StoredProGrant = {
  isActive?: unknown;
  updatedAt?: unknown;
  expiresAt?: unknown;
  productId?: unknown;
  entitlementId?: unknown;
};

type StoredCodeGrant = {
  isActive?: unknown;
  updatedAt?: unknown;
  expiresAt?: unknown;
};

type StoredAdminUserRecord = {
  email?: unknown;
  displayName?: unknown;
  givenName?: unknown;
  familyName?: unknown;
  pictureUrl?: unknown;
  emailVerified?: unknown;
  status?: unknown;
  lastAuthProvider?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastLoginAt?: unknown;
  isPro?: unknown;
  proAccess?: {
    isActive?: unknown;
    source?: unknown;
    updatedAt?: unknown;
    subscription?: StoredProGrant;
    code?: StoredCodeGrant;
  };
  appProgress?: unknown;
};

export type AdminUserSummary = {
  email: string;
  displayName: string;
  pictureUrl?: string;
  emailVerified: boolean;
  status: string;
  lastAuthProvider: string;
  provider: AdminUserProvider;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  isPro: boolean;
  proAccess: {
    isActive: boolean;
    source?: string;
    updatedAt?: string;
    expiresAt?: string;
  };
  progress: {
    cardsTotal: number;
    cardsLearning: number;
    cardsLearned: number;
    storiesStarted: number;
    storiesCompleted: number;
    updatedAt?: string;
  };
};

export type AdminUsersResponse = {
  users: AdminUserSummary[];
  stats: {
    totalUsers: number;
    proUsers: number;
    verifiedUsers: number;
    activeToday: number;
    providers: {
      email: number;
      google: number;
      apple: number;
      other: number;
    };
  };
  filters: {
    search?: string;
  };
  generatedAt: string;
};

export async function listAdminUsers(options?: { search?: string }): Promise<AdminUsersResponse> {
  const items = await scanAllUsers();
  return buildAdminUsersResponse(items, options);
}

export function buildAdminUsersResponse(
  items: unknown[],
  options?: { search?: string },
): AdminUsersResponse {
  const normalizedSearch = normalizeSearch(options?.search);
  const users = items
    .map((item) => toAdminUserSummary(item))
    .filter((item): item is AdminUserSummary => !!item)
    .filter((item) => matchesSearch(item, normalizedSearch))
    .sort(compareUsers);

  return {
    users,
    stats: summarizeUsers(users),
    filters: {
      ...(normalizedSearch ? { search: normalizedSearch } : {}),
    },
    generatedAt: new Date().toISOString(),
  };
}

async function scanAllUsers(): Promise<unknown[]> {
  const items: unknown[] = [];
  let exclusiveStartKey: Record<string, unknown> | undefined;

  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: getUsersTableName(),
        ExclusiveStartKey: exclusiveStartKey,
        ProjectionExpression:
          'email, displayName, givenName, familyName, pictureUrl, emailVerified, #status, lastAuthProvider, createdAt, updatedAt, lastLoginAt, isPro, proAccess, appProgress',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
      }),
    );

    items.push(...(page.Items || []));
    exclusiveStartKey = page.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (exclusiveStartKey);

  return items;
}

function toAdminUserSummary(input: unknown): AdminUserSummary | undefined {
  const raw = asRecord(input) as StoredAdminUserRecord | undefined;
  const email = normalizeEmail(asString(raw?.email));
  if (!email) {
    return undefined;
  }

  const displayName = buildDisplayName(raw, email);
  const provider = normalizeProvider(asString(raw?.lastAuthProvider));
  const progress = summarizeProgress(raw?.appProgress);
  const proAccess = summarizeProAccess(raw?.proAccess);
  const storedIsPro = asBoolean(raw?.isPro) ?? false;
  const isPro = storedIsPro || proAccess.isActive;

  return {
    email,
    displayName,
    ...(firstNonEmpty(asString(raw?.pictureUrl)) ? { pictureUrl: firstNonEmpty(asString(raw?.pictureUrl)) } : {}),
    emailVerified: asBoolean(raw?.emailVerified) ?? false,
    status: firstNonEmpty(asString(raw?.status)) || 'active',
    lastAuthProvider: firstNonEmpty(asString(raw?.lastAuthProvider)) || 'email',
    provider,
    createdAt: asTimestamp(raw?.createdAt) || MIN_PROGRESS_TIMESTAMP,
    updatedAt: asTimestamp(raw?.updatedAt) || MIN_PROGRESS_TIMESTAMP,
    lastLoginAt: asTimestamp(raw?.lastLoginAt) || MIN_PROGRESS_TIMESTAMP,
    isPro,
    proAccess,
    progress,
  };
}

function summarizeProgress(input: unknown): AdminUserSummary['progress'] {
  const progress = normalizeUserProgressRecord(input);
  const cards = Object.values(progress.cards.items);
  const stories = Object.values(progress.stories.items).filter((item) => !item.deletedAt);
  const updatedAt = maxTimestamp(progress.cards.updatedAt, progress.stories.updatedAt);

  return {
    cardsTotal: cards.length,
    cardsLearning: cards.filter((item) => item.status === 'learning').length,
    cardsLearned: cards.filter((item) => item.status === 'learned').length,
    storiesStarted: stories.length,
    storiesCompleted: stories.filter((item) => !!item.storyCompletedAt).length,
    ...(updatedAt !== MIN_PROGRESS_TIMESTAMP ? { updatedAt } : {}),
  };
}

function summarizeProAccess(input: unknown): AdminUserSummary['proAccess'] {
  const raw = asRecord(input);
  if (!raw) {
    return { isActive: false };
  }

  const subscription = asRecord(raw.subscription);
  const code = asRecord(raw.code);
  const now = new Date().toISOString();
  const subscriptionExpiresAt = asTimestamp(subscription?.expiresAt);
  const codeExpiresAt = asTimestamp(code?.expiresAt);
  const subscriptionActive = isGrantActive(subscription, now);
  const codeActive = isGrantActive(code, now);
  const isActive = subscriptionActive || codeActive;
  const source = getProSource(subscriptionActive, codeActive, asString(raw.source));

  return {
    isActive,
    ...(source ? { source } : {}),
    ...(asTimestamp(raw.updatedAt) ? { updatedAt: asTimestamp(raw.updatedAt) } : {}),
    ...(maxTimestamp(subscriptionExpiresAt, codeExpiresAt) !== MIN_PROGRESS_TIMESTAMP
      ? { expiresAt: maxTimestamp(subscriptionExpiresAt, codeExpiresAt) }
      : {}),
  };
}

function isGrantActive(
  grant?: Record<string, unknown>,
  now: string = new Date().toISOString(),
): boolean {
  if (!grant) {
    return false;
  }

  const isActive = asBoolean(grant.isActive) ?? false;
  if (!isActive) {
    return false;
  }

  const expiresAt = asTimestamp(grant.expiresAt);
  if (!expiresAt) {
    return true;
  }

  return expiresAt.localeCompare(now) > 0;
}

function getProSource(
  subscriptionActive: boolean,
  codeActive: boolean,
  fallback?: string,
): string | undefined {
  if (subscriptionActive && codeActive) {
    return 'multiple';
  }

  if (subscriptionActive) {
    return 'subscription';
  }

  if (codeActive) {
    return 'code';
  }

  return firstNonEmpty(fallback);
}

function summarizeUsers(users: AdminUserSummary[]): AdminUsersResponse['stats'] {
  const providers = {
    email: 0,
    google: 0,
    apple: 0,
    other: 0,
  };
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  for (const user of users) {
    providers[user.provider] += 1;
  }

  return {
    totalUsers: users.length,
    proUsers: users.filter((user) => user.isPro).length,
    verifiedUsers: users.filter((user) => user.emailVerified).length,
    activeToday: users.filter((user) => user.lastLoginAt.localeCompare(todayStartIso) >= 0).length,
    providers,
  };
}

function matchesSearch(user: AdminUserSummary, search?: string): boolean {
  if (!search) {
    return true;
  }

  const haystack = [
    user.email,
    user.displayName,
    user.lastAuthProvider,
    user.status,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(search);
}

function compareUsers(left: AdminUserSummary, right: AdminUserSummary): number {
  return (
    right.lastLoginAt.localeCompare(left.lastLoginAt) ||
    right.updatedAt.localeCompare(left.updatedAt) ||
    left.email.localeCompare(right.email)
  );
}

function buildDisplayName(raw: StoredAdminUserRecord | undefined, fallbackEmail: string): string {
  return (
    firstNonEmpty(
      asString(raw?.displayName),
      [asString(raw?.givenName), asString(raw?.familyName)].filter(Boolean).join(' ').trim(),
    ) || fallbackEmail
  );
}

function normalizeProvider(value?: string): AdminUserProvider {
  const normalized = (value || '').trim().toLowerCase();
  if (!normalized) return 'email';
  if (normalized === 'google') return 'google';
  if (normalized === 'apple' || normalized === 'signinwithapple') return 'apple';
  if (normalized === 'correo' || normalized === 'email' || normalized === 'cognito') return 'email';
  return 'other';
}

function normalizeSearch(value?: string): string | undefined {
  const normalized = (value || '').trim().toLowerCase();
  return normalized || undefined;
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

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = (value || '').trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

function maxTimestamp(...values: Array<string | undefined>): string {
  let next = MIN_PROGRESS_TIMESTAMP;
  for (const value of values) {
    if (!value) continue;
    if (value.localeCompare(next) > 0) {
      next = value;
    }
  }
  return next;
}
