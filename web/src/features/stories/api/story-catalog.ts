import { api } from '@/shared/api/client'

export type StoryRequirement = {
  requirementId: string
  text: string
}

export type StoryMissionDefinition = {
  missionId: string
  title: string
  sceneSummary?: string
  aiRole: string
  caracterName?: string
  caracterPrompt?: string
  avatarImageUrl?: string
  requirements: StoryRequirement[]
}

export type StoryDefinition = {
  storyId: string
  title: string
  summary: string
  level?: string
  tags?: string[]
  unlockCost?: number
  missions: StoryMissionDefinition[]
}

export type StorySummary = {
  storyId: string
  title: string
  summary: string
  level?: string
  tags: string[]
  unlockCost: number
  locked: boolean
  missionsCount: number
}

export type StoryRequirementState = {
  requirementId: string
  text: string
  met: boolean
  feedback?: string
}

export type StoryMission = {
  missionId: string
  title: string
  sceneSummary?: string
  aiRole: string
  caracterName?: string
  caracterPrompt?: string
  avatarImageUrl?: string
  requirements: StoryRequirementState[]
}

export type StoryDetail = {
  storyId: string
  title: string
  summary: string
  level?: string
  tags?: string[]
  missions: StoryMission[]
}

type StoriesFullResponse = {
  version?: string
  items?: unknown[]
}

const BUNDLED_STORIES = sanitizeStories(__LUVA_STORIES__)

let memoryStories = BUNDLED_STORIES

export async function fetchStoryCatalog() {
  try {
    const response = await api.get<StoriesFullResponse>('/stories/full')
    const remoteStories = sanitizeStories(response.items)
    if (remoteStories.length) {
      memoryStories = remoteStories
      return remoteStories
    }
  } catch {
    // Keep bundled fallback below.
  }

  if (memoryStories.length) {
    return memoryStories
  }

  throw new Error('No pudimos cargar las historias.')
}

export async function fetchStorySummaries() {
  const stories = await fetchStoryCatalog()
  return stories.map(storySummaryFromDefinition)
}

export async function fetchStoryDetail(storyId?: string) {
  if (!storyId) {
    throw new Error('No se recibió un identificador de historia.')
  }

  const stories = await fetchStoryCatalog()
  const story = stories.find((item) => item.storyId === storyId)

  if (!story) {
    throw new Error('Historia no encontrada.')
  }

  return storyDetailFromDefinition(story)
}

function sanitizeRequirement(input: unknown): StoryRequirement | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const raw = input as Record<string, unknown>

  const requirementId =
    typeof raw.requirementId === 'string' ? raw.requirementId.trim() : undefined
  const text = typeof raw.text === 'string' ? raw.text.trim() : undefined

  if (!requirementId || !text) {
    return null
  }

  return { requirementId, text }
}

function sanitizeMission(input: unknown): StoryMissionDefinition | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const raw = input as Record<string, unknown>

  const missionId = typeof raw.missionId === 'string' ? raw.missionId.trim() : undefined
  const title = typeof raw.title === 'string' ? raw.title.trim() : undefined
  const aiRole = typeof raw.aiRole === 'string' ? raw.aiRole.trim() : undefined

  if (!missionId || !title || !aiRole) {
    return null
  }

  const requirements = Array.isArray(raw.requirements)
    ? raw.requirements
        .map((requirement) => sanitizeRequirement(requirement))
        .filter((requirement): requirement is StoryRequirement => Boolean(requirement))
    : []

  return {
    missionId,
    title,
    sceneSummary:
      typeof raw.sceneSummary === 'string' ? raw.sceneSummary.trim() || undefined : undefined,
    aiRole,
    caracterName:
      typeof raw.caracterName === 'string'
        ? raw.caracterName.trim() || undefined
        : typeof raw.characterName === 'string'
          ? raw.characterName.trim() || undefined
          : undefined,
    caracterPrompt:
      typeof raw.caracterPrompt === 'string'
        ? raw.caracterPrompt.trim() || undefined
        : typeof raw.characterPrompt === 'string'
          ? raw.characterPrompt.trim() || undefined
          : undefined,
    avatarImageUrl:
      typeof raw.avatarImageUrl === 'string'
        ? raw.avatarImageUrl.trim() || undefined
        : typeof raw.avatar_image_url === 'string'
          ? raw.avatar_image_url.trim() || undefined
          : undefined,
    requirements,
  }
}

function sanitizeStory(input: unknown): StoryDefinition | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const raw = input as Record<string, unknown>

  const storyId = typeof raw.storyId === 'string' ? raw.storyId.trim() : undefined
  const title = typeof raw.title === 'string' ? raw.title.trim() : undefined
  const summary = typeof raw.summary === 'string' ? raw.summary.trim() : undefined

  if (!storyId || !title || !summary) {
    return null
  }

  const missions = Array.isArray(raw.missions)
    ? raw.missions
        .map((mission) => sanitizeMission(mission))
        .filter((mission): mission is StoryMissionDefinition => Boolean(mission))
    : []

  if (!missions.length) {
    return null
  }

  return {
    storyId,
    title,
    summary,
    level: typeof raw.level === 'string' ? raw.level.trim() || undefined : undefined,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    unlockCost: typeof raw.unlockCost === 'number' ? raw.unlockCost : undefined,
    missions,
  }
}

function sanitizeStories(input: unknown) {
  if (!Array.isArray(input)) {
    return [] as StoryDefinition[]
  }

  return input
    .map((story) => sanitizeStory(story))
    .filter((story): story is StoryDefinition => Boolean(story))
}

function storySummaryFromDefinition(story: StoryDefinition): StorySummary {
  return {
    storyId: story.storyId,
    title: story.title,
    summary: story.summary,
    level: story.level,
    tags: story.tags || [],
    unlockCost: story.unlockCost ?? 0,
    locked: false,
    missionsCount: story.missions.length,
  }
}

function storyDetailFromDefinition(story: StoryDefinition): StoryDetail {
  return {
    storyId: story.storyId,
    title: story.title,
    summary: story.summary,
    level: story.level,
    tags: story.tags || [],
    missions: story.missions.map((mission) => ({
      missionId: mission.missionId,
      title: mission.title,
      sceneSummary: mission.sceneSummary,
      aiRole: mission.aiRole,
      caracterName: mission.caracterName,
      caracterPrompt: mission.caracterPrompt,
      avatarImageUrl: mission.avatarImageUrl,
      requirements: mission.requirements.map((requirement) => ({
        requirementId: requirement.requirementId,
        text: requirement.text,
        met: false,
      })),
    })),
  }
}
