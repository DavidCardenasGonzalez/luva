import { useEffect, useState, type PropsWithChildren } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import {
  clearPendingAuth,
  clearStoredSession,
  completeAuthFromUrl,
  getAuthConfig,
  hasAuthResponse,
  loadStoredSession,
  redirectToHostedAuth,
  redirectToHostedLogout,
  subscribeToSessionChanges,
} from '@/features/auth/api/auth-client'
import { AuthContext } from '@/features/auth/model/auth-context'
import type { AuthMode, AuthProviderName, AuthState } from '@/features/auth/model/types'

export function AuthProvider({ children }: PropsWithChildren) {
  const authConfig = getAuthConfig()
  const location = useLocation()
  const navigate = useNavigate()
  const [auth, setAuth] = useState<AuthState>({ isLoading: true })

  useEffect(() => {
    return subscribeToSessionChanges((session) => {
      setAuth((current) => ({
        ...session,
        error: undefined,
        isLoading: current.isLoading,
      }))
    })
  }, [])

  useEffect(() => {
    let cancelled = false

    const bootstrapAuth = async () => {
      const storedSession = await loadStoredSession()

      try {
        if (hasAuthResponse(location.search)) {
          const result = await completeAuthFromUrl(location.search)
          if (cancelled) {
            return
          }

          if (result?.session) {
            setAuth({
              ...result.session,
              error: undefined,
              isLoading: false,
            })
            navigate(appPaths.dashboard, { replace: true })
            return
          }

          if (result?.error) {
            const nextPath =
              storedSession.accessToken || storedSession.idToken ? appPaths.dashboard : appPaths.login
            setAuth({
              ...storedSession,
              error: result.error,
              isLoading: false,
            })
            navigate(nextPath, { replace: true })
            return
          }
        }

        if (!cancelled) {
          setAuth({
            ...storedSession,
            error: undefined,
            isLoading: false,
          })
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        const message = error instanceof Error ? error.message : 'No pudimos completar el inicio de sesión.'
        const nextPath =
          storedSession.accessToken || storedSession.idToken ? appPaths.dashboard : appPaths.login

        setAuth({
          ...storedSession,
          error: message,
          isLoading: false,
        })
        navigate(nextPath, { replace: true })
      }
    }

    void bootstrapAuth()

    return () => {
      cancelled = true
    }
  }, [location.search, navigate])

  const startAuthFlow = (mode: AuthMode, provider: AuthProviderName) => {
    setAuth((current) => ({
      ...current,
      error: undefined,
      isLoading: true,
    }))

    try {
      redirectToHostedAuth(mode, provider)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos abrir Cognito.'
      setAuth((current) => ({
        ...current,
        error: message,
        isLoading: false,
      }))
    }
  }

  const signOut = () => {
    clearPendingAuth()
    clearStoredSession()
    setAuth({ isLoading: false })
    navigate(appPaths.home, { replace: true })

    try {
      redirectToHostedLogout()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos cerrar la sesión.'
      setAuth({
        error: message,
        isLoading: false,
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        auth,
        authConfig,
        isSignedIn: Boolean(auth.idToken || auth.accessToken),
        startAuthFlow,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
