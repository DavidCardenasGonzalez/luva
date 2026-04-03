import type { AuthUser } from '@/features/auth/model/types'

export function getDisplayName(user?: AuthUser) {
  return user?.displayName || user?.givenName || user?.email || 'Luva admin'
}
