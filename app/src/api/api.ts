import Constants from 'expo-constants';
import { getCurrentAppLanguage, getCurrentSupportLanguage } from '../i18n/language';

type ApiError = { code?: string; message: string; retryable?: boolean; status?: number };

const extra = Constants.expoConfig?.extra || {};
const API_BASE_URL: string = extra.API_BASE_URL || '';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type AuthTokens = {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
};

export type ApiClient = {
  setToken: (t?: string) => void;
  setTokenResolver: (resolver?: AuthTokenResolver) => void;
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: any) => Promise<T>;
  put: <T>(path: string, body?: any, headers?: Record<string, string>) => Promise<T>;
  delete: <T>(path: string) => Promise<T>;
};

export type AuthTokenResolver = {
  getToken?: () => Promise<string | undefined>;
  refreshToken?: () => Promise<string | undefined>;
};

let bearer: string | undefined;
let tokenResolver: AuthTokenResolver | undefined;
const GET_RETRY_DELAYS_MS = [300, 900];

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableRequestError(error: any) {
  const status =
    typeof error?.status === 'number'
      ? error.status
      : typeof error?.status === 'string'
        ? Number(error.status)
        : undefined;
  return error?.retryable === true || status === 0 || (typeof status === 'number' && status >= 500);
}

async function resolveBearer(forceRefresh = false): Promise<string | undefined> {
  if (forceRefresh) {
    if (tokenResolver?.refreshToken) {
      bearer = await tokenResolver.refreshToken();
    }
    return bearer;
  }

  if (tokenResolver?.getToken) {
    bearer = await tokenResolver.getToken();
  }

  return bearer;
}

async function requestOnce<T>(
  method: HttpMethod,
  path: string,
  body?: any,
  headers?: Record<string, string>,
  allowRetry = true
): Promise<T> {
  if (!API_BASE_URL) throw new Error('API_BASE_URL is not set');
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const authToken = await resolveBearer();
  const appLanguage = getCurrentAppLanguage();
  const supportLanguage = getCurrentSupportLanguage();
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        'Content-Type': body ? 'application/json' : 'application/json',
        'Accept-Language': appLanguage,
        'X-Luva-UI-Language': appLanguage,
        'X-Luva-App-Language': appLanguage,
        'X-Luva-Support-Language': supportLanguage,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err: any) {
    throw {
      code: 'NETWORK_ERROR',
      message: err?.message || 'Network error',
      retryable: true,
      status: 0,
    } satisfies ApiError;
  }
  if (res.status === 401 && allowRetry && tokenResolver?.refreshToken) {
    const refreshedToken = await resolveBearer(true);
    if (refreshedToken && refreshedToken !== authToken) {
      return requestOnce<T>(method, path, body, headers, false);
    }
  }
  if (!res.ok) {
    let err: ApiError = {
      message: `HTTP ${res.status}`,
      retryable: res.status >= 500,
      status: res.status,
    };
    try {
      const parsed = await res.json();
      const parsedError =
        parsed && typeof parsed === 'object'
          ? (parsed as Partial<ApiError>)
          : {};
      err = {
        ...parsedError,
        message: parsedError.message || err.message,
        retryable: parsedError.retryable ?? err.retryable,
        status: res.status,
      };
    } catch {}
    throw err;
  }
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { return undefined as unknown as T; }
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: any,
  headers?: Record<string, string>
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await requestOnce<T>(method, path, body, headers);
    } catch (err: any) {
      const retryDelay = GET_RETRY_DELAYS_MS[attempt];
      if (method !== 'GET' || retryDelay == null || !isRetryableRequestError(err)) {
        throw err;
      }
      await wait(retryDelay);
    }
  }
}

export function createApi(): ApiClient {
  return {
    setToken: (t?: string) => { bearer = t; },
    setTokenResolver: (resolver?: AuthTokenResolver) => { tokenResolver = resolver; },
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: any) => request<T>('POST', path, body),
    put: <T>(path: string, body?: any, headers?: Record<string, string>) => request<T>('PUT', path, body, headers),
    delete: <T>(path: string) => request<T>('DELETE', path),
  };
}

export const api = createApi();
