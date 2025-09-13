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
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: any) => Promise<T>;
  put: <T>(path: string, body?: any, headers?: Record<string, string>) => Promise<T>;
};

let bearer: string | undefined;

async function request<T>(method: HttpMethod, path: string, body?: any, headers?: Record<string, string>): Promise<T> {
  if (!API_BASE_URL) throw new Error('API_BASE_URL is not set');
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': body ? 'application/json' : 'application/json',
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
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
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: any) => request<T>('POST', path, body),
    put: <T>(path: string, body?: any, headers?: Record<string, string>) => request<T>('PUT', path, body, headers),
  };
}

export const api = createApi();

