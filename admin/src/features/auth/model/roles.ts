export const ADMIN_ROLE = 'admin'
export const ADMIN_ROLES = [ADMIN_ROLE] as const

export function normalizeRole(value: string) {
  return value.trim().toLowerCase()
}

export function normalizeRoles(values: Iterable<string | null | undefined>) {
  const unique = new Set<string>()

  for (const value of values) {
    if (!value) continue
    const normalized = normalizeRole(value)
    if (!normalized) continue
    unique.add(normalized)
  }

  return Array.from(unique)
}

export function hasRequiredRole(
  userRoles: readonly string[] | undefined,
  requiredRoles: readonly string[] | undefined,
) {
  if (!requiredRoles?.length) {
    return true
  }

  if (!userRoles?.length) {
    return false
  }

  const roles = new Set(normalizeRoles(userRoles))
  return requiredRoles.some((role) => roles.has(normalizeRole(role)))
}
