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

export type AdminVideoStatus = 'por_programar' | 'programado' | 'subido' | 'descartado'

export type AdminVideoSummary = {
  storyId: string
  videoId: string
  title: string
  status: AdminVideoStatus
  hasCaption: boolean
  caption?: string
  publishOn?: string
  bucketPath?: string
  bucketName?: string
  bucketKey?: string
  uploadedAt: string
  updatedAt: string
  contentType?: string
  sourceVideoFileName?: string
  sourceVideoFileSizeBytes?: number
  generationUpdatedAt?: string
}

export type AdminVideosResponse = {
  videos: AdminVideoSummary[]
  stats: {
    totalVideos: number
    pendingToSchedule: number
    scheduledVideos: number
    uploadedVideos: number
    discardedVideos: number
    scheduledByDay: Array<{
      date: string
      count: number
    }>
  }
  generatedAt: string
}

export type AdminVideoUpdateResponse = {
  video: AdminVideoSummary
  updatedAt: string
}

export type AdminVideoPreviewResponse = {
  storyId: string
  videoId: string
  previewUrl: string
  expiresAt: string
  contentType?: string
}

export type AdminVideoReplaceUploadResponse = {
  storyId: string
  videoId: string
  uploadUrl: string
  expiresAt: string
  contentType: string
}

export type AdminAssetFolder = 'storiesProfile' | 'avatarPosts' | 'missionIntroVideos' | 'feedPostImages' | 'feedPostVideos'

export type AdminAssetUploadResponse = {
  folder: AdminAssetFolder
  key: string
  bucketName: string
  uploadUrl: string
  url: string
  expiresAt: string
  contentType: string
  cacheControl: string
}

export type AdminFeedPostType = 'normal' | 'practice_guide' | 'mission_guide' | 'extra'

export type AdminFeedPost = {
  postId: string
  text: string
  order: number
  postType: AdminFeedPostType
  imageUrl?: string
  videoUrl?: string
  practiceId?: string
  missionId?: string
  coinAmount?: number
  createdAt: string
  updatedAt: string
}

export type AdminFeedPostsResponse = {
  posts: AdminFeedPost[]
  generatedAt: string
}

export type AdminFeedPostMutationResponse = {
  post: AdminFeedPost
  updatedAt: string
}

export type AdminFeedPostDeleteResponse = {
  postId: string
  deletedAt: string
}

export type AdminStoryCharacter = {
  characterId: string
  storyId: string
  missionId: string
  sceneIndex: number
  storyTitle: string
  missionTitle: string
  characterName: string
  avatarImageUrl?: string
  sceneSummary?: string
}

export type AdminStoryCharactersResponse = {
  characters: AdminStoryCharacter[]
  generatedAt: string
}

export type AdminCharacterPost = {
  characterId: string
  postId: string
  storyId: string
  missionId: string
  sceneIndex: number
  storyTitle: string
  missionTitle: string
  characterName: string
  caption: string
  imageUrl: string
  order: number
  avatarImageUrl?: string
  createdAt: string
  updatedAt: string
}

export type AdminCharacterPostsResponse = {
  character: AdminStoryCharacter
  posts: AdminCharacterPost[]
  generatedAt: string
}

export type AdminCharacterPostMutationResponse = {
  post: AdminCharacterPost
  updatedAt: string
}

export type AdminCharacterPostDeleteResponse = {
  characterId: string
  postId: string
  deletedAt: string
}

export type AdminTikTokAuthStatusResponse = {
  configured: boolean
  clientKeyConfigured: boolean
  clientSecretConfigured: boolean
  redirectUriConfigured: boolean
  redirectUri?: string
  scopes: string[]
  connected: boolean
  token: {
    accessTokenStored: boolean
    refreshTokenStored: boolean
    openId?: string
    scope?: string
    tokenType?: string
    accessTokenExpiresAt?: string
    refreshTokenExpiresAt?: string
    updatedAt?: string
  }
}

export type AdminTikTokAuthStartResponse = {
  authUrl: string
  state: string
  codeVerifier: string
  redirectUri: string
  scopes: string[]
}

export type AdminTikTokAuthCompleteResponse = {
  connected: boolean
  redirectUri: string
  scopes: string[]
  token: {
    openId?: string
    scope?: string
    tokenType?: string
    accessTokenExpiresAt?: string
    refreshTokenExpiresAt?: string
    updatedAt: string
  }
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
