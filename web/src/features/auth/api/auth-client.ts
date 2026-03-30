import { api, isApiConfigured } from '@/shared/api/client'
import { env } from '@/shared/config/env'
import type {
  AuthCallbackResult,
  AuthConfig,
  AuthMode,
  AuthProviderName,
  AuthUser,
  StoredSession,
} from '@/features/auth/model/types'

type TokenExchangeResponse = {
  access_token?: string
  id_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

type CurrentUserResponse = {
  user?: AuthUser
  created?: boolean
}

type JwtClaims = Record<string, unknown>

const ACCESS_TOKEN_KEY = 'luva_web_access'
const ID_TOKEN_KEY = 'luva_web_id'
const REFRESH_TOKEN_KEY = 'luva_web_refresh'
const USER_KEY = 'luva_web_user'
const PENDING_STATE_KEY = 'luva_web_pending_state'
const PENDING_PROVIDER_KEY = 'luva_web_pending_provider'
const SESSION_EXPIRY_SKEW_MS = 30_000

const IDENTITY_PROVIDER_MAP = {
  google: 'Google',
  email: 'COGNITO',
} satisfies Record<AuthProviderName, string>

let inFlightAuthCallbackSearch: string | undefined
let inFlightAuthCallbackPromise: Promise<AuthCallbackResult | undefined> | undefined
let inFlightRefreshPromise: Promise<StoredSession | undefined> | undefined
let currentSession: StoredSession = {}
let hasHydratedSession = false
const sessionListeners = new Set<(session: StoredSession) => void>()

function getLocalStorage() {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.localStorage
}

function getSessionStorage() {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.sessionStorage
}

function normalizeHostedUiDomain(value?: string) {
  const trimmed = (value || '').trim().replace(/\/+$/, '')
  if (!trimmed) return undefined
  if (trimmed.includes('cognito-idp.')) return undefined
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, 'https://')
  }
  return `https://${trimmed}`
}

function normalizeRedirectUri(value?: string) {
  const trimmed = (value || '').trim()
  if (!trimmed) return undefined
  try {
    return new URL(trimmed).toString()
  } catch {
    return undefined
  }
}

function getDefaultRedirectUri(): string | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  return new URL('/', window.location.origin).toString()
}

export function getAuthConfig(): AuthConfig {
  const domain = normalizeHostedUiDomain(env.cognitoDomain)
  const clientId = env.cognitoClientId
  const redirectUri = normalizeRedirectUri(env.redirectUri) || getDefaultRedirectUri()

  return {
    domain,
    clientId,
    redirectUri,
    isConfigured: Boolean(domain && clientId && redirectUri),
  }
}

function createRandomState() {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    if (typeof crypto.getRandomValues === 'function') {
      const values = crypto.getRandomValues(new Uint32Array(4))
      return Array.from(values, (value) => value.toString(36)).join('-')
    }
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function storePendingAuth(state: string, provider: AuthProviderName) {
  const storage = getSessionStorage()
  if (!storage) return
  storage.setItem(PENDING_STATE_KEY, state)
  storage.setItem(PENDING_PROVIDER_KEY, provider)
}

export function clearPendingAuth() {
  const storage = getSessionStorage()
  storage?.removeItem(PENDING_STATE_KEY)
  storage?.removeItem(PENDING_PROVIDER_KEY)
}

function consumePendingAuth() {
  const storage = getSessionStorage()
  const pendingState = storage?.getItem(PENDING_STATE_KEY) || undefined
  const pendingProvider = storage?.getItem(PENDING_PROVIDER_KEY) || undefined

  clearPendingAuth()

  const provider: AuthProviderName | undefined =
    pendingProvider === 'google' || pendingProvider === 'email' ? pendingProvider : undefined
  return {
    state: pendingState,
    provider,
  }
}

function buildHostedUiUrl(mode: AuthMode, provider: AuthProviderName, state: string) {
  const { domain, clientId, redirectUri, isConfigured } = getAuthConfig()
  if (!isConfigured || !domain || !clientId || !redirectUri) {
    throw new Error(
      'Configura VITE_COGNITO_DOMAIN y VITE_COGNITO_CLIENT_ID para habilitar el login web.',
    )
  }

  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('response_type', 'code')
  params.append('scope', 'openid email profile')
  params.append('redirect_uri', redirectUri)
  params.append('state', state)
  params.append('identity_provider', IDENTITY_PROVIDER_MAP[provider])

  const endpoint = mode === 'signup' ? 'signup' : 'oauth2/authorize'
  return `${domain}/${endpoint}?${params.toString()}`
}

function buildLogoutUrl() {
  const { domain, clientId, redirectUri, isConfigured } = getAuthConfig()
  if (!isConfigured || !domain || !clientId || !redirectUri) {
    throw new Error(
      'Configura VITE_COGNITO_DOMAIN y VITE_COGNITO_CLIENT_ID para cerrar la sesion web.',
    )
  }

  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('logout_uri', redirectUri)
  return `${domain}/logout?${params.toString()}`
}

function decodeJwtPayload(token?: string): JwtClaims | undefined {
  if (!token) return undefined
  const parts = token.split('.')
  if (parts.length < 2) return undefined

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')

  try {
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims
  } catch {
    return undefined
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function asNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined
}

function normalizeProvider(value?: string) {
  const normalized = (value || '').trim().toLowerCase()
  if (!normalized) return undefined
  if (normalized === 'google') return 'google'
  if (normalized === 'email' || normalized === 'correo' || normalized === 'cognito') return 'email'
  return normalized
}

function deriveProviderFromClaims(claims?: JwtClaims, fallback?: AuthProviderName) {
  const identities = asString(claims?.identities)
  if (identities) {
    try {
      const providers = JSON.parse(identities) as Array<{ providerName?: string }>
      const providerName = providers[0]?.providerName
      const normalized = normalizeProvider(providerName)
      if (normalized) {
        return normalized
      }
    } catch {
      // Ignore malformed identities and fall back to the provider passed by the app.
    }
  }

  return fallback || 'email'
}

function buildFallbackUser(idToken?: string, fallbackProvider?: AuthProviderName): AuthUser | undefined {
  const claims = decodeJwtPayload(idToken)
  const email = asString(claims?.email) || asString(claims?.['cognito:username'])
  if (!email) {
    return undefined
  }

  return {
    email: email.trim().toLowerCase(),
    displayName: asString(claims?.name),
    givenName: asString(claims?.given_name),
    familyName: asString(claims?.family_name),
    pictureUrl: asString(claims?.picture),
    lastAuthProvider: deriveProviderFromClaims(claims, fallbackProvider),
  }
}

function isTokenExpired(token?: string) {
  const claims = decodeJwtPayload(token)
  const expiresAtSeconds = asNumber(claims?.exp)
  if (!expiresAtSeconds) {
    return false
  }

  return expiresAtSeconds * 1000 <= Date.now() + SESSION_EXPIRY_SKEW_MS
}

function parseStoredUser(raw?: string | null): AuthUser | undefined {
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return undefined
  }
}

function getBearer(session?: StoredSession) {
  return session?.idToken || session?.accessToken
}

function normalizeSession(
  session: StoredSession,
  fallbackProvider?: AuthProviderName,
): StoredSession {
  return {
    accessToken: session.accessToken,
    idToken: session.idToken,
    refreshToken: session.refreshToken,
    user: session.user || buildFallbackUser(session.idToken, fallbackProvider),
  }
}

function hydrateStoredSession() {
  const storage = getLocalStorage()
  if (!storage) {
    hasHydratedSession = true
    currentSession = {}
    api.setToken(undefined)
    return currentSession
  }

  const nextSession = normalizeSession({
    accessToken: storage.getItem(ACCESS_TOKEN_KEY) || undefined,
    idToken: storage.getItem(ID_TOKEN_KEY) || undefined,
    refreshToken: storage.getItem(REFRESH_TOKEN_KEY) || undefined,
    user: parseStoredUser(storage.getItem(USER_KEY)),
  })

  hasHydratedSession = true
  currentSession = nextSession
  api.setToken(getBearer(nextSession))
  return nextSession
}

function getCurrentSession() {
  if (!hasHydratedSession) {
    return hydrateStoredSession()
  }
  return currentSession
}

function notifySessionListeners(session: StoredSession) {
  for (const listener of sessionListeners) {
    listener(session)
  }
}

function persistSession(session: StoredSession, fallbackProvider?: AuthProviderName) {
  const normalizedSession = normalizeSession(session, fallbackProvider)
  currentSession = normalizedSession
  hasHydratedSession = true

  const storage = getLocalStorage()

  if (storage) {
    if (normalizedSession.accessToken) {
      storage.setItem(ACCESS_TOKEN_KEY, normalizedSession.accessToken)
    } else {
      storage.removeItem(ACCESS_TOKEN_KEY)
    }

    if (normalizedSession.idToken) {
      storage.setItem(ID_TOKEN_KEY, normalizedSession.idToken)
    } else {
      storage.removeItem(ID_TOKEN_KEY)
    }

    if (normalizedSession.refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, normalizedSession.refreshToken)
    } else {
      storage.removeItem(REFRESH_TOKEN_KEY)
    }

    if (normalizedSession.user) {
      storage.setItem(USER_KEY, JSON.stringify(normalizedSession.user))
    } else {
      storage.removeItem(USER_KEY)
    }
  }

  api.setToken(getBearer(normalizedSession))
  notifySessionListeners(normalizedSession)
  return normalizedSession
}

export function clearStoredSession() {
  currentSession = {}
  hasHydratedSession = true
  inFlightRefreshPromise = undefined

  const storage = getLocalStorage()
  storage?.removeItem(ACCESS_TOKEN_KEY)
  storage?.removeItem(ID_TOKEN_KEY)
  storage?.removeItem(REFRESH_TOKEN_KEY)
  storage?.removeItem(USER_KEY)
  api.setToken(undefined)
  notifySessionListeners(currentSession)
}

export function subscribeToSessionChanges(listener: (session: StoredSession) => void) {
  sessionListeners.add(listener)
  return () => {
    sessionListeners.delete(listener)
  }
}

async function refreshTokens(refreshToken: string): Promise<TokenExchangeResponse> {
  const { domain, clientId, isConfigured } = getAuthConfig()
  if (!isConfigured || !domain || !clientId) {
    throw new Error('La configuracion de Cognito no esta completa.')
  }

  const form = new URLSearchParams()
  form.append('grant_type', 'refresh_token')
  form.append('client_id', clientId)
  form.append('refresh_token', refreshToken)

  const response = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  const payload = (await response.json()) as TokenExchangeResponse
  if (!response.ok || payload.error) {
    throw new Error(payload.error_description || payload.error || 'No se pudo refrescar la sesión.')
  }

  return payload
}

async function refreshStoredSession(force = false): Promise<StoredSession | undefined> {
  const session = getCurrentSession()
  const bearer = getBearer(session)

  if (!force && bearer && !isTokenExpired(bearer)) {
    api.setToken(bearer)
    return session
  }

  if (!session.refreshToken) {
    if (bearer && isTokenExpired(bearer)) {
      clearStoredSession()
      return undefined
    }
    return bearer ? session : undefined
  }

  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise
  }

  inFlightRefreshPromise = (async () => {
    try {
      const tokenResponse = await refreshTokens(session.refreshToken as string)
      const accessToken = tokenResponse.access_token
      const idToken = tokenResponse.id_token
      const refreshToken = tokenResponse.refresh_token || session.refreshToken
      const nextBearer = idToken || accessToken

      if (!accessToken || !nextBearer) {
        throw new Error('Cognito no devolvio tokens validos al refrescar la sesión.')
      }

      return persistSession({
        accessToken,
        idToken,
        refreshToken,
        user: session.user,
      })
    } catch (error) {
      console.warn('web.auth.refresh.failed', error)
      clearStoredSession()
      return undefined
    } finally {
      inFlightRefreshPromise = undefined
    }
  })()

  return inFlightRefreshPromise
}

export async function loadStoredSession(): Promise<StoredSession> {
  const session = getCurrentSession()
  const bearer = getBearer(session)
  if (!bearer) {
    return session
  }

  if (!isTokenExpired(bearer)) {
    api.setToken(bearer)
    return session
  }

  return (await refreshStoredSession(true)) || getCurrentSession()
}

async function exchangeCodeForTokens(code: string): Promise<TokenExchangeResponse> {
  const { domain, clientId, redirectUri, isConfigured } = getAuthConfig()
  if (!isConfigured || !domain || !clientId || !redirectUri) {
    throw new Error('La configuracion de Cognito no esta completa.')
  }

  const form = new URLSearchParams()
  form.append('grant_type', 'authorization_code')
  form.append('client_id', clientId)
  form.append('code', code)
  form.append('redirect_uri', redirectUri)

  const response = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  const payload = (await response.json()) as TokenExchangeResponse
  if (!response.ok || payload.error) {
    throw new Error(payload.error_description || payload.error || 'No se pudo canjear el codigo de acceso.')
  }

  return payload
}

async function syncCurrentUser(
  authToken: string,
  authProvider?: AuthProviderName,
  idToken?: string,
): Promise<AuthUser | undefined> {
  const fallbackUser = buildFallbackUser(idToken, authProvider)
  if (!isApiConfigured()) {
    return fallbackUser
  }

  api.setToken(authToken)
  try {
    const response = await api.post<CurrentUserResponse>(
      '/users/me',
      authProvider ? { authProvider } : undefined,
    )
    return response.user || fallbackUser
  } catch (error) {
    console.warn('web.user.sync.failed', error)
    return fallbackUser
  }
}

export function hasAuthResponse(search: string) {
  const params = new URLSearchParams(search)
  return Boolean(params.get('code') || params.get('error'))
}

async function resolveAuthCallback(search: string): Promise<AuthCallbackResult | undefined> {
  if (!hasAuthResponse(search)) {
    return undefined
  }

  const params = new URLSearchParams(search)
  const returnedError = params.get('error')
  const returnedDescription = params.get('error_description')

  if (returnedError) {
    consumePendingAuth()
    return {
      error: returnedDescription || returnedError,
    }
  }

  const returnedState = params.get('state') || undefined
  const code = params.get('code') || ''
  const pendingAuth = consumePendingAuth()

  if (!pendingAuth.state || pendingAuth.state !== returnedState) {
    return {
      error: 'La respuesta de autenticacion no coincide con la solicitud original.',
    }
  }

  if (!code) {
    return {
      error: 'Cognito no devolvio un codigo de autorizacion.',
    }
  }

  const tokenResponse = await exchangeCodeForTokens(code)
  const accessToken = tokenResponse.access_token
  const idToken = tokenResponse.id_token
  const refreshToken = tokenResponse.refresh_token
  const bearer = idToken || accessToken

  if (!accessToken || !bearer) {
    return {
      error: 'Cognito no devolvio tokens validos.',
    }
  }

  const baseSession = persistSession(
    {
      accessToken,
      idToken,
      refreshToken,
    },
    pendingAuth.provider,
  )
  const user = await syncCurrentUser(bearer, pendingAuth.provider, idToken)
  const session = persistSession({
    accessToken,
    idToken,
    refreshToken,
    user: user || baseSession.user,
  })
  return { session }
}

export function completeAuthFromUrl(search: string): Promise<AuthCallbackResult | undefined> {
  if (!hasAuthResponse(search)) {
    return Promise.resolve(undefined)
  }

  if (inFlightAuthCallbackSearch === search && inFlightAuthCallbackPromise) {
    return inFlightAuthCallbackPromise
  }

  const callbackPromise = resolveAuthCallback(search).finally(() => {
    if (inFlightAuthCallbackSearch === search) {
      inFlightAuthCallbackSearch = undefined
      inFlightAuthCallbackPromise = undefined
    }
  })

  inFlightAuthCallbackSearch = search
  inFlightAuthCallbackPromise = callbackPromise
  return callbackPromise
}

export function redirectToHostedAuth(mode: AuthMode, provider: AuthProviderName) {
  const state = createRandomState()
  storePendingAuth(state, provider)
  window.location.assign(buildHostedUiUrl(mode, provider, state))
}

export function redirectToHostedLogout() {
  window.location.assign(buildLogoutUrl())
}

api.setTokenResolver({
  getToken: async () => getBearer(await loadStoredSession()),
  refreshToken: async () => getBearer(await refreshStoredSession(true)),
})
