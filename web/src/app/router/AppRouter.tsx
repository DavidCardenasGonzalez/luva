import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { resolveLegacyDestination } from '@/app/router/legacy-routes'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { LoadingPage } from '@/features/auth/ui/LoadingPage'
import { LoginPage } from '@/features/auth/ui/LoginPage'
import { ProtectedRoute } from '@/features/auth/ui/ProtectedRoute'
import { WelcomePage } from '@/features/auth/ui/WelcomePage'
import { HomePage } from '@/features/marketing/ui/HomePage'
import { LinksPage } from '@/features/marketing/ui/LinksPage'

function HomeRoute() {
  const location = useLocation()
  const legacyDestination = resolveLegacyDestination(location.search)

  if (legacyDestination) {
    return <Navigate to={legacyDestination} replace />
  }

  return <HomePage />
}

export function AppRouter() {
  const { auth, isSignedIn } = useAuthSession()

  if (auth.isLoading) {
    return <LoadingPage />
  }

  return (
    <Routes>
      <Route path={appPaths.home} element={<HomeRoute />} />
      <Route path={appPaths.links} element={<LinksPage />} />
      <Route
        path={appPaths.login}
        element={isSignedIn ? <Navigate to={appPaths.welcome} replace /> : <LoginPage />}
      />
      <Route
        path={appPaths.welcome}
        element={
          <ProtectedRoute>
            <WelcomePage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={appPaths.home} replace />} />
    </Routes>
  )
}
