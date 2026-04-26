import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { AdminAssetsPage } from '@/features/admin/ui/AdminAssetsPage'
import { AdminCharacterPostsPage } from '@/features/admin/ui/AdminCharacterPostsPage'
import { AdminFeedPostsPage } from '@/features/admin/ui/AdminFeedPostsPage'
import { AdminPortalPage } from '@/features/admin/ui/AdminPortalPage'
import { AdminStoryCharactersPage } from '@/features/admin/ui/AdminStoryCharactersPage'
import { AdminTikTokAuthPage } from '@/features/admin/ui/AdminTikTokAuthPage'
import { AdminVideoEditPage } from '@/features/admin/ui/AdminVideoEditPage'
import { AdminUsersPage } from '@/features/admin/ui/AdminUsersPage'
import { AdminVideosPage } from '@/features/admin/ui/AdminVideosPage'
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
      <Route
        path={appPaths.users}
        element={
          <ProtectedRoute
            requiredRoles={ADMIN_ROLES}
            deniedTitle="Tu cuenta no tiene acceso al portal administrativo."
            deniedMessage="Asigna el grupo o rol admin en Cognito y vuelve a iniciar sesión."
          >
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={appPaths.assets}
        element={
          <ProtectedRoute
            requiredRoles={ADMIN_ROLES}
            deniedTitle="Tu cuenta no tiene acceso al portal administrativo."
            deniedMessage="Asigna el grupo o rol admin en Cognito y vuelve a iniciar sesión."
          >
            <AdminAssetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={appPaths.posts}
        element={
          <ProtectedRoute
            requiredRoles={ADMIN_ROLES}
            deniedTitle="Tu cuenta no tiene acceso al portal administrativo."
            deniedMessage="Asigna el grupo o rol admin en Cognito y vuelve a iniciar sesión."
          >
            <AdminFeedPostsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={appPaths.stories}
        element={
          <ProtectedRoute
            requiredRoles={ADMIN_ROLES}
            deniedTitle="Tu cuenta no tiene acceso al portal administrativo."
            deniedMessage="Asigna el grupo o rol admin en Cognito y vuelve a iniciar sesión."
          >
            <AdminStoryCharactersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stories/:characterId"
        element={
          <ProtectedRoute
            requiredRoles={ADMIN_ROLES}
            deniedTitle="Tu cuenta no tiene acceso al portal administrativo."
            deniedMessage="Asigna el grupo o rol admin en Cognito y vuelve a iniciar sesión."
          >
            <AdminCharacterPostsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={appPaths.integrationsTikTok}
        element={
          <ProtectedRoute
            requiredRoles={ADMIN_ROLES}
            deniedTitle="Tu cuenta no tiene acceso al portal administrativo."
            deniedMessage="Asigna el grupo o rol admin en Cognito y vuelve a iniciar sesión."
          >
            <AdminTikTokAuthPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={appPaths.videos}
        element={
          <ProtectedRoute
            requiredRoles={ADMIN_ROLES}
            deniedTitle="Tu cuenta no tiene acceso al portal administrativo."
            deniedMessage="Asigna el grupo o rol admin en Cognito y vuelve a iniciar sesión."
          >
            <AdminVideosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/videos/:storyId/:videoId/edit"
        element={
          <ProtectedRoute
            requiredRoles={ADMIN_ROLES}
            deniedTitle="Tu cuenta no tiene acceso al portal administrativo."
            deniedMessage="Asigna el grupo o rol admin en Cognito y vuelve a iniciar sesión."
          >
            <AdminVideoEditPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={appPaths.home} replace />} />
    </Routes>
  )
}
