export const appPaths = {
  home: '/',
  login: '/login',
  assets: '/assets',
  posts: '/posts',
  stories: '/stories',
  users: '/users',
  videos: '/videos',
  lessons: '/lessons',
  integrationsTikTok: '/integrations/tiktok',
  storyCharacter: (characterId: string) => `/stories/${encodeURIComponent(characterId)}`,
  videoEdit: (storyId: string, videoId: string) => `/videos/${encodeURIComponent(storyId)}/${encodeURIComponent(videoId)}/edit`,
  lessonEditor: (lessonId: string) => `/lessons/${encodeURIComponent(lessonId)}/edit`,
} as const
