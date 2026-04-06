import { loadStoredSession } from '@/features/auth/api/auth-client'
import { env } from '@/shared/config/env'

export type ApiError = {
  code?: string
  message: string
}

type HttpMethod = 'GET' | 'POST'

function getApiBaseUrl() {
  const baseUrl = env.adminApiBaseUrl?.replace(/\/+$/, '')
  if (!baseUrl) {
    throw new Error('Configura VITE_ADMIN_API_BASE_URL para conectar el backend administrativo.')
  }

  return baseUrl
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const session = await loadStoredSession()
  const token = session.idToken || session.accessToken
  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let error: ApiError = { message: `HTTP ${response.status}` }

    try {
      error = (await response.json()) as ApiError
    } catch {
      // Fall back to the default HTTP error message when the payload is not JSON.
    }

    throw new Error(error.message || `HTTP ${response.status}`)
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export const adminApi = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
}

