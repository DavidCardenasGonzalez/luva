export const appPaths = {
  home: '/',
  links: '/links',
  login: '/login',
  welcome: '/welcome',
} as const

export function buildHomeSectionHref(id: string) {
  return `${appPaths.home}#${id}`
}
