import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { hasRequiredRole } from '@/features/auth/model/roles'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { AccessDeniedPage } from '@/features/auth/ui/AccessDeniedPage'

type ProtectedRouteProps = PropsWithChildren<{
  requiredRoles?: readonly string[]
  deniedTitle?: string
  deniedMessage?: string
}>

export function ProtectedRoute({
  children,
  requiredRoles,
  deniedTitle,
  deniedMessage,
}: ProtectedRouteProps) {
  const location = useLocation()
  const { auth, isSignedIn } = useAuthSession()
  const nextPath = `${location.pathname}${location.search}${location.hash}`

  if (!isSignedIn) {
    return (
      <Navigate
        to={appPaths.login}
        replace
        state={{
          authMessage: 'Inicia sesión para abrir esta página protegida.',
          nextPath,
        }}
      />
    )
  }

  if (!hasRequiredRole(auth.user?.roles, requiredRoles)) {
    return <AccessDeniedPage title={deniedTitle} message={deniedMessage} />
  }

  return children
}
