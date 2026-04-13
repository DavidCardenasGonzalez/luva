export const appPaths = {
  home: '/',
  login: '/login',
  assets: '/assets',
  users: '/users',
  videos: '/videos',
  integrationsTikTok: '/integrations/tiktok',
  videoEdit: (storyId: string, videoId: string) => `/videos/${encodeURIComponent(storyId)}/${encodeURIComponent(videoId)}/edit`,
} as const
