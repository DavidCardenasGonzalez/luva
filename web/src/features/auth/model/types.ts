export type AuthProviderName = 'google' | 'email'
export type AuthMode = 'login' | 'signup'

export type AuthProGrant = {
  isActive: boolean
  updatedAt?: string
  expiresAt?: string
  productId?: string
  entitlementId?: string
}

export type AuthProAccess = {
  isActive: boolean
  source?: 'subscription' | 'code' | 'multiple'
  updatedAt?: string
  subscription?: AuthProGrant
  code?: AuthProGrant
}

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
  isPro?: boolean
  proAccess?: AuthProAccess
}

export type PromoCodeRedemptionResult = {
  code: string
  isValid: boolean
  premiumDays: number
  expiresAt?: string
}

export type CurrentUserUpdatePayload = {
  displayName?: string
  pictureUrl?: string
  authProvider?: AuthProviderName
  promoCode?: string
  subscriptionAccess?: {
    isActive?: boolean
    expiresAt?: string | null
    productId?: string
    entitlementId?: string
  }
}

export type CurrentUserUpdateResult = {
  user?: AuthUser
  promoCode?: PromoCodeRedemptionResult
}

export type EmailSignUpResult = {
  destination?: string
  deliveryMedium?: string
  requiresConfirmation: boolean
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
  cognitoRegion?: string
  redirectUri?: string
  isConfigured: boolean
  isHostedUiConfigured: boolean
  isEmailAuthConfigured: boolean
}

export type AuthCallbackResult = {
  error?: string
  session?: StoredSession
}
