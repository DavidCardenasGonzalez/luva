import type {
  StoryProgressItem,
  UserProgressRecord,
} from '@/features/progress/api/progress-client'

export function getStoryProgressItem(
  progress: UserProgressRecord | undefined,
  storyId?: string,
): StoryProgressItem | undefined {
  if (!progress || !storyId) {
    return undefined
  }

  const item = progress.stories.items[storyId]
  if (!item) {
    return undefined
  }

  if (item.deletedAt && compareTimestamps(item.deletedAt, item.updatedAt) >= 0) {
    return undefined
  }

  const completedMissions = Object.fromEntries(
    Object.entries(item.completedMissions || {}).filter(([, completedAt]) => {
      if (progress.stories.resetAt && compareTimestamps(completedAt, progress.stories.resetAt) <= 0) {
        return false
      }
      if (item.deletedAt && compareTimestamps(completedAt, item.deletedAt) <= 0) {
        return false
      }
      return true
    }),
  )

  const storyCompletedAt =
    item.storyCompletedAt &&
    (!progress.stories.resetAt ||
      compareTimestamps(item.storyCompletedAt, progress.stories.resetAt) > 0) &&
    (!item.deletedAt || compareTimestamps(item.storyCompletedAt, item.deletedAt) > 0)
      ? item.storyCompletedAt
      : undefined

  if (!storyCompletedAt && !Object.keys(completedMissions).length) {
    return undefined
  }

  return {
    ...item,
    ...(storyCompletedAt ? { storyCompletedAt } : {}),
    completedMissions,
  }
}

export function isStoryMissionCompleted(
  progress: UserProgressRecord | undefined,
  storyId?: string,
  missionId?: string,
) {
  if (!storyId || !missionId) {
    return false
  }

  return Boolean(getStoryProgressItem(progress, storyId)?.completedMissions?.[missionId])
}

export function getCompletedMissionsCount(
  progress: UserProgressRecord | undefined,
  storyId?: string,
) {
  return Object.keys(getStoryProgressItem(progress, storyId)?.completedMissions || {}).length
}

export function isStoryCompleted(progress: UserProgressRecord | undefined, storyId?: string) {
  return Boolean(getStoryProgressItem(progress, storyId)?.storyCompletedAt)
}

export function mergeStoryMissionCompletionIntoProgress(
  progress: UserProgressRecord,
  storyId: string,
  missionId: string,
  storyCompleted = false,
  completedAt = new Date().toISOString(),
): UserProgressRecord {
  const previousItem = getStoryProgressItem(progress, storyId)

  const nextItem: StoryProgressItem = {
    updatedAt: completedAt,
    completedMissions: {
      ...(previousItem?.completedMissions || {}),
      [missionId]: previousItem?.completedMissions?.[missionId] || completedAt,
    },
    ...(storyCompleted
      ? { storyCompletedAt: previousItem?.storyCompletedAt || completedAt }
      : previousItem?.storyCompletedAt
        ? { storyCompletedAt: previousItem.storyCompletedAt }
        : {}),
  }

  return {
    ...progress,
    stories: {
      ...progress.stories,
      updatedAt: maxTimestamp(progress.stories.updatedAt, completedAt),
      items: {
        ...progress.stories.items,
        [storyId]: nextItem,
      },
    },
  }
}

export function compareTimestamps(left?: string, right?: string) {
  return (left || '').localeCompare(right || '')
}

function maxTimestamp(...values: Array<string | undefined>) {
  let next = '1970-01-01T00:00:00.000Z'
  for (const value of values) {
    if (value && compareTimestamps(value, next) > 0) {
      next = value
    }
  }
  return next
}
