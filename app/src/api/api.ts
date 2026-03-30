import Constants from 'expo-constants';

type ApiError = { code?: string; message: string; retryable?: boolean };

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
};

export type AuthTokenResolver = {
  getToken?: () => Promise<string | undefined>;
  refreshToken?: () => Promise<string | undefined>;
};

let bearer: string | undefined;
let tokenResolver: AuthTokenResolver | undefined;

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

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: any,
  headers?: Record<string, string>,
  allowRetry = true
): Promise<T> {
  if (!API_BASE_URL) throw new Error('API_BASE_URL is not set');
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const authToken = await resolveBearer();
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': body ? 'application/json' : 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && allowRetry && tokenResolver?.refreshToken) {
    const refreshedToken = await resolveBearer(true);
    if (refreshedToken && refreshedToken !== authToken) {
      return request<T>(method, path, body, headers, false);
    }
  }
  if (!res.ok) {
    let err: ApiError = { message: `HTTP ${res.status}` };
    try { err = await res.json(); } catch {}
    throw err;
  }
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { return undefined as unknown as T; }
}

export function createApi(): ApiClient {
  return {
    setToken: (t?: string) => { bearer = t; },
    setTokenResolver: (resolver?: AuthTokenResolver) => { tokenResolver = resolver; },
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: any) => request<T>('POST', path, body),
    put: <T>(path: string, body?: any, headers?: Record<string, string>) => request<T>('PUT', path, body, headers),
  };
}

export const api = createApi();
