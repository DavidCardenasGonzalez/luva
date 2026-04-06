export const appPaths = {
  home: '/',
  links: '/links',
  login: '/login',
  dashboard: '/dashboard',
  account: '/dashboard/account',
  vocabulary: '/dashboard/vocabulary',
  stories: '/dashboard/stories',
  welcome: '/welcome',
} as const

export function buildHomeSectionHref(id: string) {
  return `${appPaths.home}#${id}`
}

export function buildVocabularyPracticePath(cardId: string | number) {
  return `${appPaths.vocabulary}/${String(cardId)}`
}

export function buildStoryMissionsPath(storyId: string) {
  return `${appPaths.stories}/${encodeURIComponent(storyId)}`
}

export function buildStoryChatPath(storyId: string, sceneIndex: number) {
  return `${buildStoryMissionsPath(storyId)}/mission/${Math.max(0, sceneIndex)}`
}
