import { env } from '@/shared/config/env'

export type ApiError = {
  code?: string
  message: string
  retryable?: boolean
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type ApiClient = {
  setToken: (token?: string) => void
  setTokenResolver: (resolver?: AuthTokenResolver) => void
  get: <T>(path: string) => Promise<T>
  post: <T>(path: string, body?: unknown) => Promise<T>
  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) => Promise<T>
}

export type AuthTokenResolver = {
  getToken?: () => Promise<string | undefined>
  refreshToken?: () => Promise<string | undefined>
}

const API_BASE_URL = env.apiBaseUrl

let bearer: string | undefined
let tokenResolver: AuthTokenResolver | undefined

async function resolveBearer(forceRefresh = false) {
  if (forceRefresh) {
    if (tokenResolver?.refreshToken) {
      bearer = await tokenResolver.refreshToken()
    }
    return bearer
  }

  if (tokenResolver?.getToken) {
    bearer = await tokenResolver.getToken()
  }

  return bearer
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
  allowRetry = true,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not set')
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`
  const authToken = await resolveBearer()
  const response = await fetch(url, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401 && allowRetry && tokenResolver?.refreshToken) {
    const refreshedToken = await resolveBearer(true)
    if (refreshedToken && refreshedToken !== authToken) {
      return request<T>(method, path, body, headers, false)
    }
  }

  if (!response.ok) {
    let error: ApiError = { message: `HTTP ${response.status}` }
    try {
      error = (await response.json()) as ApiError
    } catch {
      // Ignore malformed API errors and use the HTTP fallback above.
    }
    throw error
  }

  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined as T
  }
}

function createApi(): ApiClient {
  return {
    setToken: (token?: string) => {
      bearer = token
    },
    setTokenResolver: (resolver?: AuthTokenResolver) => {
      tokenResolver = resolver
    },
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    put: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
      request<T>('PUT', path, body, headers),
  }
}

export function isApiConfigured() {
  return Boolean(API_BASE_URL)
}

export const api = createApi()
