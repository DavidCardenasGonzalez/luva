import { randomUUID } from 'crypto';
import { GetParameterCommand, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({});

type TikTokTokenMeta = {
  openId?: string;
  scope?: string;
  tokenType?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  updatedAt: string;
};

export type AdminTikTokAuthStatusResponse = {
  configured: boolean;
  clientKeyConfigured: boolean;
  clientSecretConfigured: boolean;
  redirectUriConfigured: boolean;
  redirectUri?: string;
  scopes: string[];
  connected: boolean;
  token: {
    accessTokenStored: boolean;
    refreshTokenStored: boolean;
    openId?: string;
    scope?: string;
    tokenType?: string;
    accessTokenExpiresAt?: string;
    refreshTokenExpiresAt?: string;
    updatedAt?: string;
  };
};

export type AdminTikTokAuthStartResponse = {
  authUrl: string;
  state: string;
  redirectUri: string;
  scopes: string[];
};

export type AdminTikTokAuthCompleteResponse = {
  connected: boolean;
  redirectUri: string;
  scopes: string[];
  token: {
    openId?: string;
    scope?: string;
    tokenType?: string;
    accessTokenExpiresAt?: string;
    refreshTokenExpiresAt?: string;
    updatedAt: string;
  };
};

export async function getAdminTikTokAuthStatus(): Promise<AdminTikTokAuthStatusResponse> {
  const config = getTikTokOAuthConfig();
  const [accessToken, refreshToken, tokenMeta] = await Promise.all([
    getOptionalParameter(getTikTokAccessTokenParamName()),
    getOptionalParameter(getTikTokRefreshTokenParamName()),
    getOptionalParameter(getTikTokTokenMetaParamName()),
  ]);
  const parsedMeta = parseTokenMeta(tokenMeta);

  return {
    configured: config.clientKeyConfigured && config.clientSecretConfigured && config.redirectUriConfigured,
    clientKeyConfigured: config.clientKeyConfigured,
    clientSecretConfigured: config.clientSecretConfigured,
    redirectUriConfigured: config.redirectUriConfigured,
    ...(config.redirectUri ? { redirectUri: config.redirectUri } : {}),
    scopes: config.scopes,
    connected: !!accessToken && !!refreshToken,
    token: {
      accessTokenStored: !!accessToken,
      refreshTokenStored: !!refreshToken,
      ...(parsedMeta?.openId ? { openId: parsedMeta.openId } : {}),
      ...(parsedMeta?.scope ? { scope: parsedMeta.scope } : {}),
      ...(parsedMeta?.tokenType ? { tokenType: parsedMeta.tokenType } : {}),
      ...(parsedMeta?.accessTokenExpiresAt
        ? { accessTokenExpiresAt: parsedMeta.accessTokenExpiresAt }
        : {}),
      ...(parsedMeta?.refreshTokenExpiresAt
        ? { refreshTokenExpiresAt: parsedMeta.refreshTokenExpiresAt }
        : {}),
      ...(parsedMeta?.updatedAt ? { updatedAt: parsedMeta.updatedAt } : {}),
    },
  };
}

export async function createAdminTikTokAuthStart(): Promise<AdminTikTokAuthStartResponse> {
  const config = getTikTokOAuthConfig(true);
  const state = randomUUID();
  const query = new URLSearchParams({
    client_key: config.clientKey,
    scope: config.scopes.join(','),
    response_type: 'code',
    redirect_uri: config.redirectUri,
    state,
  });

  return {
    authUrl: `https://www.tiktok.com/v2/auth/authorize/?${query.toString()}`,
    state,
    redirectUri: config.redirectUri,
    scopes: config.scopes,
  };
}

export async function completeAdminTikTokAuth(input: {
  code?: unknown;
}): Promise<AdminTikTokAuthCompleteResponse> {
  const code = asString(input.code)?.trim();
  const config = getTikTokOAuthConfig(true);

  if (!code) {
    throw new Error('INVALID_TIKTOK_CODE');
  }

  const body = new URLSearchParams({
    client_key: config.clientKey,
    client_secret: config.clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: config.redirectUri,
  });
  const payload = await fetchJson('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const accessToken = firstNonEmpty(asString(payload.access_token));
  const refreshToken = firstNonEmpty(asString(payload.refresh_token));

  if (!accessToken || !refreshToken) {
    throw new Error('INVALID_TIKTOK_TOKEN_RESPONSE');
  }

  const now = new Date().toISOString();
  const accessTokenExpiresAt = computeExpiry(now, asNumber(payload.expires_in));
  const refreshTokenExpiresAt = computeExpiry(now, asNumber(payload.refresh_expires_in));
  const meta: TikTokTokenMeta = {
    ...(firstNonEmpty(asString(payload.open_id)) ? { openId: firstNonEmpty(asString(payload.open_id)) } : {}),
    ...(firstNonEmpty(asString(payload.scope)) ? { scope: firstNonEmpty(asString(payload.scope)) } : {}),
    ...(firstNonEmpty(asString(payload.token_type)) ? { tokenType: firstNonEmpty(asString(payload.token_type)) } : {}),
    ...(accessTokenExpiresAt ? { accessTokenExpiresAt } : {}),
    ...(refreshTokenExpiresAt ? { refreshTokenExpiresAt } : {}),
    updatedAt: now,
  };

  await Promise.all([
    putParameter(getTikTokAccessTokenParamName(), accessToken),
    putParameter(getTikTokRefreshTokenParamName(), refreshToken),
    putParameter(getTikTokTokenMetaParamName(), JSON.stringify(meta)),
  ]);

  return {
    connected: true,
    redirectUri: config.redirectUri,
    scopes: config.scopes,
    token: {
      ...(meta.openId ? { openId: meta.openId } : {}),
      ...(meta.scope ? { scope: meta.scope } : {}),
      ...(meta.tokenType ? { tokenType: meta.tokenType } : {}),
      ...(meta.accessTokenExpiresAt ? { accessTokenExpiresAt: meta.accessTokenExpiresAt } : {}),
      ...(meta.refreshTokenExpiresAt ? { refreshTokenExpiresAt: meta.refreshTokenExpiresAt } : {}),
      updatedAt: meta.updatedAt,
    },
  };
}

function getTikTokOAuthConfig(requireComplete = false) {
  const clientKey = firstNonEmpty(process.env.TIKTOK_CLIENT_KEY);
  const clientSecret = firstNonEmpty(process.env.TIKTOK_CLIENT_SECRET);
  const redirectUri = firstNonEmpty(process.env.TIKTOK_REDIRECT_URI);
  const scopes = (process.env.TIKTOK_AUTH_SCOPES || 'video.publish')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const config = {
    clientKeyConfigured: !!clientKey,
    clientSecretConfigured: !!clientSecret,
    redirectUriConfigured: !!redirectUri,
    ...(clientKey ? { clientKey } : {}),
    ...(clientSecret ? { clientSecret } : {}),
    ...(redirectUri ? { redirectUri } : {}),
    scopes,
  };

  if (
    requireComplete &&
    (!config.clientKeyConfigured || !config.clientSecretConfigured || !config.redirectUriConfigured)
  ) {
    throw new Error('TIKTOK_OAUTH_NOT_CONFIGURED');
  }

  return config as {
    clientKeyConfigured: boolean;
    clientSecretConfigured: boolean;
    redirectUriConfigured: boolean;
    clientKey: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
  };
}

async function getOptionalParameter(name: string): Promise<string | undefined> {
  try {
    const result = await ssm.send(
      new GetParameterCommand({
        Name: name,
        WithDecryption: true,
      }),
    );
    return firstNonEmpty(result.Parameter?.Value);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: string }).name === 'ParameterNotFound'
    ) {
      return undefined;
    }
    throw error;
  }
}

async function putParameter(name: string, value: string) {
  await ssm.send(
    new PutParameterCommand({
      Name: name,
      Value: value,
      Type: 'SecureString',
      Overwrite: true,
    }),
  );
}

async function fetchJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload: Record<string, unknown> = {};

  if (text.trim()) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error(`Respuesta JSON inválida de TikTok: ${text.slice(0, 180)}`);
    }
  }

  if (!response.ok) {
    const errorDescription =
      firstNonEmpty(asString(payload.error_description), asString(payload.description), asString(payload.message)) ||
      `HTTP ${response.status}`;
    throw new Error(errorDescription);
  }

  return payload;
}

function parseTokenMeta(value?: string): TikTokTokenMeta | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return {
      ...(firstNonEmpty(asString(parsed.openId)) ? { openId: firstNonEmpty(asString(parsed.openId)) } : {}),
      ...(firstNonEmpty(asString(parsed.scope)) ? { scope: firstNonEmpty(asString(parsed.scope)) } : {}),
      ...(firstNonEmpty(asString(parsed.tokenType)) ? { tokenType: firstNonEmpty(asString(parsed.tokenType)) } : {}),
      ...(firstNonEmpty(asString(parsed.accessTokenExpiresAt))
        ? { accessTokenExpiresAt: firstNonEmpty(asString(parsed.accessTokenExpiresAt)) }
        : {}),
      ...(firstNonEmpty(asString(parsed.refreshTokenExpiresAt))
        ? { refreshTokenExpiresAt: firstNonEmpty(asString(parsed.refreshTokenExpiresAt)) }
        : {}),
      updatedAt: firstNonEmpty(asString(parsed.updatedAt)) || '',
    };
  } catch {
    return undefined;
  }
}

function computeExpiry(now: string, seconds?: number): string | undefined {
  if (!seconds || seconds <= 0) {
    return undefined;
  }

  return new Date(Date.parse(now) + seconds * 1000).toISOString();
}

function getTikTokAccessTokenParamName(): string {
  const name = firstNonEmpty(process.env.TIKTOK_ACCESS_TOKEN_PARAM);
  if (!name) {
    throw new Error('TIKTOK_ACCESS_TOKEN_PARAM not set');
  }
  return name;
}

function getTikTokRefreshTokenParamName(): string {
  const name = firstNonEmpty(process.env.TIKTOK_REFRESH_TOKEN_PARAM);
  if (!name) {
    throw new Error('TIKTOK_REFRESH_TOKEN_PARAM not set');
  }
  return name;
}

function getTikTokTokenMetaParamName(): string {
  const name = firstNonEmpty(process.env.TIKTOK_TOKEN_META_PARAM);
  if (!name) {
    throw new Error('TIKTOK_TOKEN_META_PARAM not set');
  }
  return name;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
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
