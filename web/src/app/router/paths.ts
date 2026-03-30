export const appPaths = {
  home: '/',
  links: '/links',
  login: '/login',
  dashboard: '/dashboard',
  welcome: '/welcome',
} as const

export function buildHomeSectionHref(id: string) {
  return `${appPaths.home}#${id}`
}
