import { api } from '@/shared/api/client'

export type CardProgressStatus = 'todo' | 'learning' | 'learned'

export type CardProgressEntry = {
  status: CardProgressStatus
  updatedAt: string
}

export type CardProgressDocument = {
  updatedAt: string
  resetAt?: string
  items: Record<string, CardProgressEntry>
}

export type StoryProgressItem = {
  updatedAt: string
  deletedAt?: string
  storyCompletedAt?: string
  completedMissions: Record<string, string>
}

export type StoryProgressDocument = {
  updatedAt: string
  resetAt?: string
  items: Record<string, StoryProgressItem>
}

export type UserProgressRecord = {
  cards: CardProgressDocument
  stories: StoryProgressDocument
}

export type StoryCatalogItem = {
  storyId: string
  title: string
  summary: string
  level?: string
  tags: string[]
  missionsCount: number
}

type ProgressResponse = {
  progress?: UserProgressRecord
}

type StoriesResponse = {
  items?: StoryCatalogItem[]
}

export const EMPTY_PROGRESS: UserProgressRecord = {
  cards: { updatedAt: '1970-01-01T00:00:00.000Z', items: {} },
  stories: { updatedAt: '1970-01-01T00:00:00.000Z', items: {} },
}

export async function fetchDashboardData() {
  const [progressResponse, storiesResponse] = await Promise.all([
    api.get<ProgressResponse>('/users/me/progress'),
    api.get<StoriesResponse>('/stories'),
  ])

  return {
    progress: progressResponse.progress || EMPTY_PROGRESS,
    totalCards: __LUVA_TOTAL_CARD_COUNT__,
    stories: storiesResponse.items || [],
  }
}

export async function fetchUserProgress() {
  const response = await api.get<ProgressResponse>('/users/me/progress')
  return response.progress || EMPTY_PROGRESS
}

export async function mergeUserProgress(progress: Partial<UserProgressRecord>) {
  const response = await api.post<ProgressResponse>('/users/me/progress', { progress })
  return response.progress || EMPTY_PROGRESS
}
