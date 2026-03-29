export type AuthProviderName = 'google' | 'email'
export type AuthMode = 'login' | 'signup'

export type AuthUser = {
  email: string
  displayName?: string
  givenName?: string
  familyName?: string
  pictureUrl?: string
  lastAuthProvider: string
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string
}

export type StoredSession = {
  accessToken?: string
  idToken?: string
  refreshToken?: string
  user?: AuthUser
}

export type AuthState = StoredSession & {
  error?: string
  isLoading: boolean
}

export type AuthConfig = {
  domain?: string
  clientId?: string
  redirectUri?: string
  isConfigured: boolean
}

export type AuthCallbackResult = {
  error?: string
  session?: StoredSession
}
