import { adminApi } from '@/shared/api/client'
import type {
  AdminAssetFolder,
  AdminAssetUploadResponse,
  AdminFeedPostDeleteResponse,
  AdminFeedPostMutationResponse,
  AdminFeedPostsResponse,
  AdminFeedPostType,
  AdminManualCodeProGrantResponse,
  AdminManualCodeProRevokeResponse,
  AdminOverview,
  AdminTikTokAuthCompleteResponse,
  AdminTikTokAuthStartResponse,
  AdminTikTokAuthStatusResponse,
  AdminVideoPreviewResponse,
  AdminVideoReplaceUploadResponse,
  AdminRevenueCatVerificationResponse,
  AdminVideoStatus,
  AdminVideoUpdateResponse,
  AdminVideosResponse,
  AdminUsersResponse,
} from '@/features/admin/model/types'

export type AdminFeedPostWritePayload = {
  postId?: string
  text: string
  imageUrl?: string
  videoUrl?: string
  order: number
  postType: AdminFeedPostType
  practiceId?: string
  missionId?: string
  coinAmount?: number
}

export function getAdminOverview() {
  return adminApi.get<AdminOverview>('/overview')
}

export function getAdminUsers(search?: string) {
  const query = new URLSearchParams()
  if (search?.trim()) {
    query.set('search', search.trim())
  }

  const suffix = query.size ? `?${query.toString()}` : ''
  return adminApi.get<AdminUsersResponse>(`/users${suffix}`)
}

export function getAdminVideos() {
  return adminApi.get<AdminVideosResponse>('/videos')
}

export function getAdminFeedPosts() {
  return adminApi.get<AdminFeedPostsResponse>('/feed-posts')
}

export function createAdminFeedPost(payload: AdminFeedPostWritePayload) {
  return adminApi.post<AdminFeedPostMutationResponse>('/feed-posts', payload)
}

export function updateAdminFeedPost(payload: AdminFeedPostWritePayload & { postId: string }) {
  return adminApi.post<AdminFeedPostMutationResponse>('/feed-posts/update', payload)
}

export function deleteAdminFeedPost(postId: string) {
  return adminApi.post<AdminFeedPostDeleteResponse>('/feed-posts/delete', { postId })
}

export function createAdminAssetUpload(
  folder: AdminAssetFolder,
  contentType: string,
  fileName: string,
) {
  return adminApi.post<AdminAssetUploadResponse>('/assets/upload', {
    folder,
    contentType,
    fileName,
  })
}

export function getAdminTikTokAuthStatus() {
  return adminApi.get<AdminTikTokAuthStatusResponse>('/social/tiktok')
}

export function startAdminTikTokAuth() {
  return adminApi.post<AdminTikTokAuthStartResponse>('/social/tiktok/start')
}

export function completeAdminTikTokAuth(code: string, codeVerifier: string) {
  return adminApi.post<AdminTikTokAuthCompleteResponse>('/social/tiktok/complete', {
    code,
    codeVerifier,
  })
}

export function getAdminVideoPreview(storyId: string, videoId: string) {
  const query = new URLSearchParams({
    storyId,
    videoId,
  })

  return adminApi.get<AdminVideoPreviewResponse>(`/videos/preview?${query.toString()}`)
}

export function createAdminVideoReplaceUpload(
  storyId: string,
  videoId: string,
  contentType: string,
) {
  return adminApi.post<AdminVideoReplaceUploadResponse>('/videos/replace-upload', {
    storyId,
    videoId,
    contentType,
  })
}

export function completeAdminVideoReplace(
  storyId: string,
  videoId: string,
  contentType: string,
  sizeBytes: number,
) {
  return adminApi.post<AdminVideoUpdateResponse>('/videos/replace-complete', {
    storyId,
    videoId,
    contentType,
    sizeBytes,
  })
}

export function updateAdminVideo(
  storyId: string,
  videoId: string,
  status: AdminVideoStatus,
  publishOn?: string | null,
) {
  return adminApi.post<AdminVideoUpdateResponse>('/videos/update', {
    storyId,
    videoId,
    status,
    publishOn,
  })
}

export function verifyRevenueCatUsers() {
  return adminApi.post<AdminRevenueCatVerificationResponse>('/users/revenuecat/verify')
}

export function grantManualCodeProAccess(email: string, premiumDays: number) {
  return adminApi.post<AdminManualCodeProGrantResponse>('/users/pro-access/code-grant', {
    email,
    premiumDays,
  })
}

export function revokeManualCodeProAccess(email: string) {
  return adminApi.post<AdminManualCodeProRevokeResponse>('/users/pro-access/code-revoke', {
    email,
  })
}
