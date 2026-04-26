export const appPaths = {
  home: '/',
  login: '/login',
  assets: '/assets',
  posts: '/posts',
  stories: '/stories',
  users: '/users',
  videos: '/videos',
  integrationsTikTok: '/integrations/tiktok',
  storyCharacter: (characterId: string) => `/stories/${encodeURIComponent(characterId)}`,
  videoEdit: (storyId: string, videoId: string) => `/videos/${encodeURIComponent(storyId)}/${encodeURIComponent(videoId)}/edit`,
} as const
