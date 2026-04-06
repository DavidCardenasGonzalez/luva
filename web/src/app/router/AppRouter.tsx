import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import { resolveLegacyDestination } from '@/app/router/legacy-routes'
import { useAuthSession } from '@/features/auth/model/use-auth-session'
import { AppShell } from '@/features/app-shell/ui/AppShell'
import { AccountPage } from '@/features/account/ui/AccountPage'
import { LoadingPage } from '@/features/auth/ui/LoadingPage'
import { LoginPage } from '@/features/auth/ui/LoginPage'
import { ProtectedRoute } from '@/features/auth/ui/ProtectedRoute'
import { DashboardHomePage } from '@/features/dashboard/ui/DashboardHomePage'
import { HomePage } from '@/features/marketing/ui/HomePage'
import { LinksPage } from '@/features/marketing/ui/LinksPage'
import { StoryChatPage } from '@/features/stories/ui/StoryChatPage'
import { StoryMissionsPage } from '@/features/stories/ui/StoryMissionsPage'
import { StoriesIndexPage } from '@/features/stories/ui/StoriesIndexPage'
import { VocabularyDeckPage } from '@/features/vocabulary/ui/VocabularyDeckPage'
import { VocabularyPracticePage } from '@/features/vocabulary/ui/VocabularyPracticePage'

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
        element={isSignedIn ? <Navigate to={appPaths.dashboard} replace /> : <LoginPage />}
      />
      <Route
        path={appPaths.dashboard}
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHomePage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="vocabulary" element={<VocabularyDeckPage />} />
        <Route path="vocabulary/:cardId" element={<VocabularyPracticePage />} />
        <Route path="stories" element={<StoriesIndexPage />} />
        <Route path="stories/:storyId" element={<StoryMissionsPage />} />
        <Route path="stories/:storyId/mission/:sceneIndex" element={<StoryChatPage />} />
      </Route>
      <Route path={appPaths.welcome} element={<Navigate to={appPaths.dashboard} replace />} />
      <Route path="*" element={<Navigate to={appPaths.home} replace />} />
    </Routes>
  )
}
