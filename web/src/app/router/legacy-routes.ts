import { hasAuthResponse } from '@/features/auth/api/auth-client'
import { appPaths } from '@/app/router/paths'

export function resolveLegacyDestination(search: string) {
  if (!search || hasAuthResponse(search)) {
    return null
  }

  const params = new URLSearchParams(search)

  if (params.get('view') === 'links') {
    const nextParams = new URLSearchParams()
    if (params.get('no_redirect') === '1') {
      nextParams.set('no_redirect', '1')
    }

    const query = nextParams.toString()
    return query ? `${appPaths.links}?${query}` : appPaths.links
  }

  const screen = params.get('screen')
  if (screen === 'login') {
    return appPaths.login
  }

  if (screen === 'welcome') {
    return appPaths.welcome
  }

  return null
}
