import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { useAuthSession } from '@/features/auth/model/use-auth-session'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { isSignedIn } = useAuthSession()

  if (!isSignedIn) {
    return (
      <Navigate
        to={appPaths.login}
        replace
        state={{ authMessage: 'Inicia sesión para abrir esta página protegida.' }}
      />
    )
  }

  return children
}
