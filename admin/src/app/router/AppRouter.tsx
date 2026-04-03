import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { AdminPortalPage } from '@/features/admin/ui/AdminPortalPage'
import { LoadingPage } from '@/features/auth/ui/LoadingPage'
import { LoginPage } from '@/features/auth/ui/LoginPage'
import { ADMIN_ROLES } from '@/features/auth/model/roles'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { ProtectedRoute } from '@/features/auth/ui/ProtectedRoute'

function LoginRoute() {
  const location = useLocation()
  const { isSignedIn } = useAuthSession()
  const nextPath = (location.state as { nextPath?: string } | null)?.nextPath

  if (isSignedIn) {
    return <Navigate to={nextPath || appPaths.home} replace />
  }

  return <LoginPage />
}

export function AppRouter() {
  const { auth } = useAuthSession()

  if (auth.isLoading) {
    return <LoadingPage />
  }

  return (
    <Routes>
      <Route path={appPaths.login} element={<LoginRoute />} />
      <Route
        path={appPaths.home}
        element={
          <ProtectedRoute
            requiredRoles={ADMIN_ROLES}
            deniedTitle="Tu cuenta no tiene acceso al portal administrativo."
            deniedMessage="Asigna el grupo o rol admin en Cognito y vuelve a iniciar sesión."
          >
            <AdminPortalPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={appPaths.home} replace />} />
    </Routes>
  )
}
