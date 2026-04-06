export const appPaths = {
  home: '/',
  login: '/login',
  users: '/users',
  videos: '/videos',
  videoEdit: (storyId: string, videoId: string) => `/videos/${encodeURIComponent(storyId)}/${encodeURIComponent(videoId)}/edit`,
} as const
