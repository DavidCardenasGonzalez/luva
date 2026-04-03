import { env } from '@/shared/config/env'
import { normalizeRoles } from '@/features/auth/model/roles'
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

type JwtClaims = Record<string, unknown>

const ACCESS_TOKEN_KEY = 'luva_admin_access'
const ID_TOKEN_KEY = 'luva_admin_id'
const REFRESH_TOKEN_KEY = 'luva_admin_refresh'
const USER_KEY = 'luva_admin_user'
const PENDING_STATE_KEY = 'luva_admin_pending_state'
const PENDING_PROVIDER_KEY = 'luva_admin_pending_provider'
const PENDING_REDIRECT_PATH_KEY = 'luva_admin_pending_redirect_path'
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

function normalizeRedirectPath(value?: string) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return undefined
  }
  return trimmed
}

function storePendingAuth(state: string, provider: AuthProviderName, redirectPath?: string) {
  const storage = getSessionStorage()
  if (!storage) return
  storage.setItem(PENDING_STATE_KEY, state)
  storage.setItem(PENDING_PROVIDER_KEY, provider)

  const safeRedirectPath = normalizeRedirectPath(redirectPath)
  if (safeRedirectPath) {
    storage.setItem(PENDING_REDIRECT_PATH_KEY, safeRedirectPath)
  } else {
    storage.removeItem(PENDING_REDIRECT_PATH_KEY)
  }
}

export function clearPendingAuth() {
  const storage = getSessionStorage()
  storage?.removeItem(PENDING_STATE_KEY)
  storage?.removeItem(PENDING_PROVIDER_KEY)
  storage?.removeItem(PENDING_REDIRECT_PATH_KEY)
}

function consumePendingAuth() {
  const storage = getSessionStorage()
  const pendingState = storage?.getItem(PENDING_STATE_KEY) || undefined
  const pendingProvider = storage?.getItem(PENDING_PROVIDER_KEY) || undefined
  const pendingRedirectPath = normalizeRedirectPath(
    storage?.getItem(PENDING_REDIRECT_PATH_KEY) || undefined,
  )

  clearPendingAuth()

  const provider: AuthProviderName | undefined =
    pendingProvider === 'google' || pendingProvider === 'email' ? pendingProvider : undefined

  return {
    state: pendingState,
    provider,
    redirectPath: pendingRedirectPath,
  }
}

function buildHostedUiUrl(mode: AuthMode, provider: AuthProviderName, state: string) {
  const { domain, clientId, redirectUri, isConfigured } = getAuthConfig()
  if (!isConfigured || !domain || !clientId || !redirectUri) {
    throw new Error(
      'Configura VITE_COGNITO_DOMAIN y VITE_COGNITO_CLIENT_ID para habilitar el login admin.',
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
      'Configura VITE_COGNITO_DOMAIN y VITE_COGNITO_CLIENT_ID para cerrar la sesión admin.',
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
      // Ignore malformed identities and use the current fallback.
    }
  }

  return fallback || 'email'
}

function parseClaimList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value !== 'string') {
    return []
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return []
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      return parseClaimList(JSON.parse(trimmed))
    } catch {
      return [trimmed]
    }
  }

  if (trimmed.includes(',')) {
    return trimmed.split(',')
  }

  return [trimmed]
}

function extractRolesFromClaims(...claimsList: Array<JwtClaims | undefined>) {
  const collected: string[] = []

  for (const claims of claimsList) {
    if (!claims) continue

    collected.push(
      ...parseClaimList(claims['cognito:groups']),
      ...parseClaimList(claims.groups),
      ...parseClaimList(claims.group),
      ...parseClaimList(claims['custom:roles']),
      ...parseClaimList(claims['custom:role']),
      ...parseClaimList(claims.roles),
      ...parseClaimList(claims.role),
    )
  }

  return normalizeRoles(collected)
}

function deriveUserFromClaims(
  idToken?: string,
  accessToken?: string,
  fallbackProvider?: AuthProviderName,
) {
  const claims = decodeJwtPayload(idToken)
  const accessClaims = decodeJwtPayload(accessToken)

  return {
    email:
      asString(claims?.email)?.trim().toLowerCase() ||
      asString(claims?.['cognito:username'])?.trim().toLowerCase() ||
      asString(accessClaims?.username)?.trim().toLowerCase(),
    displayName: asString(claims?.name),
    givenName: asString(claims?.given_name),
    familyName: asString(claims?.family_name),
    pictureUrl: asString(claims?.picture),
    lastAuthProvider: deriveProviderFromClaims(claims, fallbackProvider),
    roles: extractRolesFromClaims(claims, accessClaims),
  }
}

function mergeUsers(sessionUser?: AuthUser, derivedUser?: Partial<AuthUser>) {
  const email = sessionUser?.email || derivedUser?.email
  if (!email) {
    return undefined
  }

  return {
    email,
    displayName: sessionUser?.displayName || derivedUser?.displayName,
    givenName: sessionUser?.givenName || derivedUser?.givenName,
    familyName: sessionUser?.familyName || derivedUser?.familyName,
    pictureUrl: sessionUser?.pictureUrl || derivedUser?.pictureUrl,
    roles: normalizeRoles([...(sessionUser?.roles || []), ...(derivedUser?.roles || [])]),
    lastAuthProvider: sessionUser?.lastAuthProvider || derivedUser?.lastAuthProvider || 'email',
  } satisfies AuthUser
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
  const derivedUser = deriveUserFromClaims(session.idToken, session.accessToken, fallbackProvider)

  return {
    accessToken: session.accessToken,
    idToken: session.idToken,
    refreshToken: session.refreshToken,
    user: mergeUsers(session.user, derivedUser),
  }
}

function hydrateStoredSession() {
  const storage = getLocalStorage()
  if (!storage) {
    hasHydratedSession = true
    currentSession = {}
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
    throw new Error('La configuración de Cognito no está completa.')
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
        throw new Error('Cognito no devolvió tokens válidos al refrescar la sesión.')
      }

      return persistSession({
        accessToken,
        idToken,
        refreshToken,
        user: session.user,
      })
    } catch (error) {
      console.warn('admin.auth.refresh.failed', error)
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
    return session
  }

  return (await refreshStoredSession(true)) || getCurrentSession()
}

async function exchangeCodeForTokens(code: string): Promise<TokenExchangeResponse> {
  const { domain, clientId, redirectUri, isConfigured } = getAuthConfig()
  if (!isConfigured || !domain || !clientId || !redirectUri) {
    throw new Error('La configuración de Cognito no está completa.')
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
    throw new Error(
      payload.error_description || payload.error || 'No se pudo canjear el código de acceso.',
    )
  }

  return payload
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
    const pendingAuth = consumePendingAuth()
    return {
      error: returnedDescription || returnedError,
      redirectPath: pendingAuth.redirectPath,
    }
  }

  const returnedState = params.get('state') || undefined
  const code = params.get('code') || ''
  const pendingAuth = consumePendingAuth()

  if (!pendingAuth.state || pendingAuth.state !== returnedState) {
    return {
      error: 'La respuesta de autenticación no coincide con la solicitud original.',
      redirectPath: pendingAuth.redirectPath,
    }
  }

  if (!code) {
    return {
      error: 'Cognito no devolvió un código de autorización.',
      redirectPath: pendingAuth.redirectPath,
    }
  }

  const tokenResponse = await exchangeCodeForTokens(code)
  const accessToken = tokenResponse.access_token
  const idToken = tokenResponse.id_token
  const refreshToken = tokenResponse.refresh_token
  const bearer = idToken || accessToken

  if (!accessToken || !bearer) {
    return {
      error: 'Cognito no devolvió tokens válidos.',
      redirectPath: pendingAuth.redirectPath,
    }
  }

  const session = persistSession(
    {
      accessToken,
      idToken,
      refreshToken,
    },
    pendingAuth.provider,
  )

  return {
    redirectPath: pendingAuth.redirectPath,
    session,
  }
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

export function redirectToHostedAuth(
  mode: AuthMode,
  provider: AuthProviderName,
  redirectPath?: string,
) {
  const state = createRandomState()
  storePendingAuth(state, provider, redirectPath)
  window.location.assign(buildHostedUiUrl(mode, provider, state))
}

export function redirectToHostedLogout() {
  window.location.assign(buildLogoutUrl())
}
