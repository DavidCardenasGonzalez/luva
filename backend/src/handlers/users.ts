import type { APIGatewayProxyResultV2 as Result } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const ROUTE_PREFIX = '/v1';

type CognitoClaims = Record<string, string | undefined>;

type UserRecord = {
  email: string;
  cognitoSub?: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
  emailVerified?: boolean;
  status: 'active';
  lastAuthProvider: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
};

type UpsertUserPayload = {
  displayName?: string;
  pictureUrl?: string;
  authProvider?: string;
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

async function upsertCurrentUser(
  email: string,
  claims: CognitoClaims,
  payload?: UpsertUserPayload
): Promise<{ user: UserRecord; created: boolean }> {
  const tableName = process.env.USERS_TABLE_NAME;
  if (!tableName) {
    throw new Error('USERS_TABLE_NAME not set');
  }

  const existing = await dynamo.send(
    new GetCommand({
      TableName: tableName,
      Key: { email },
    })
  );
  const previous = existing.Item as Partial<UserRecord> | undefined;
  const now = new Date().toISOString();
  const user: UserRecord = {
    email,
    cognitoSub: firstNonEmpty(claims.sub, previous?.cognitoSub),
    displayName: firstNonEmpty(
      asString(payload?.displayName),
      claims.name,
      previous?.displayName
    ),
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
  };

  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: user,
    })
  );

  return {
    user,
    created: !previous,
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
