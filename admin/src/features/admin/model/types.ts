export type AdminModuleStatus = 'ready' | 'planned'

export type AdminModuleSummary = {
  id: string
  label: string
  description: string
  status: AdminModuleStatus
}

export type AdminOverview = {
  admin: {
    email: string
    displayName?: string
    roles: string[]
    lastAuthProvider?: string
  }
  permissions: {
    isAdmin: boolean
    matchedRoles: string[]
  }
  portal: {
    name: string
    stage: string
    routePrefix: string
    lambda: string
    protection: string
  }
  modules: AdminModuleSummary[]
  generatedAt: string
}

export type AdminUserProvider = 'email' | 'google' | 'apple' | 'other'

export type AdminUserSummary = {
  email: string
  displayName: string
  pictureUrl?: string
  emailVerified: boolean
  status: string
  lastAuthProvider: string
  provider: AdminUserProvider
  createdAt: string
  updatedAt: string
  lastLoginAt: string
  isPro: boolean
  proAccess: {
    isActive: boolean
    source?: string
    updatedAt?: string
    expiresAt?: string
  }
  progress: {
    cardsTotal: number
    cardsLearning: number
    cardsLearned: number
    storiesStarted: number
    storiesCompleted: number
    updatedAt?: string
  }
}

export type AdminUsersResponse = {
  users: AdminUserSummary[]
  stats: {
    totalUsers: number
    proUsers: number
    verifiedUsers: number
    activeToday: number
    providers: {
      email: number
      google: number
      apple: number
      other: number
    }
  }
  filters: {
    search?: string
  }
  generatedAt: string
}

export type AdminRevenueCatVerificationItem = {
  email: string
  status: 'verified' | 'skipped' | 'error'
  changed?: boolean
  previousIsActive?: boolean
  currentIsActive?: boolean
  appUserId?: string
  reason?: string
}

export type AdminRevenueCatVerificationResponse = {
  checkedAt: string
  summary: {
    scannedUsers: number
    subscriptionUsers: number
    verifiedUsers: number
    updatedUsers: number
    unchangedUsers: number
    reactivatedUsers: number
    deactivatedUsers: number
    skippedMissingAppUserId: number
    errors: number
  }
  users: AdminRevenueCatVerificationItem[]
}

export type AdminManualCodeProGrantResponse = {
  email: string
  premiumDays: number
  effectiveFrom: string
  expiresAt: string
  previousCodeExpiresAt?: string
  extendedExistingGrant: boolean
  isPro: boolean
  source: 'code' | 'multiple'
  updatedAt: string
}

export type AdminManualCodeProRevokeResponse = {
  email: string
  revokedActiveGrant: boolean
  previousCodeExpiresAt?: string
  isPro: boolean
  source: 'subscription' | 'free'
  updatedAt: string
}
