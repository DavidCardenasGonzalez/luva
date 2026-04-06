import { useEffect, useState, type PropsWithChildren } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { appPaths } from '@/app/router/paths'
import {
  clearPendingAuth,
  clearStoredSession,
  confirmEmailSignUp,
  completeAuthFromUrl,
  getAuthConfig,
  hasAuthResponse,
  loadStoredSession,
  redirectToHostedAuth,
  redirectToHostedLogout,
  resendEmailSignUpCode,
  signInWithEmail,
  signUpWithEmail,
  subscribeToSessionChanges,
  updateCurrentUser,
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

  const startEmailSignIn = async (email: string, password: string) => {
    setAuth((current) => ({
      ...current,
      error: undefined,
      isLoading: true,
    }))

    try {
      const session = await signInWithEmail(email, password)
      setAuth({
        ...session,
        error: undefined,
        isLoading: false,
      })
      navigate(appPaths.dashboard, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos iniciar sesión con correo.'
      setAuth((current) => ({
        ...current,
        error: message,
        isLoading: false,
      }))
      throw error
    }
  }

  const startEmailSignUp = async (email: string, password: string) => {
    setAuth((current) => ({
      ...current,
      error: undefined,
      isLoading: true,
    }))

    try {
      const result = await signUpWithEmail(email, password)
      setAuth((current) => ({
        ...current,
        error: undefined,
        isLoading: false,
      }))

      if (!result.requiresConfirmation) {
        navigate(appPaths.dashboard, { replace: true })
      }

      return result
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos crear tu cuenta.'
      setAuth((current) => ({
        ...current,
        error: message,
        isLoading: false,
      }))
      throw error
    }
  }

  const completeEmailSignUp = async (email: string, code: string, password: string) => {
    setAuth((current) => ({
      ...current,
      error: undefined,
      isLoading: true,
    }))

    try {
      const session = await confirmEmailSignUp(email, code, password)
      setAuth({
        ...session,
        error: undefined,
        isLoading: false,
      })
      navigate(appPaths.dashboard, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos confirmar tu cuenta.'
      setAuth((current) => ({
        ...current,
        error: message,
        isLoading: false,
      }))
      throw error
    }
  }

  const resendEmailCode = async (email: string) => {
    setAuth((current) => ({
      ...current,
      error: undefined,
      isLoading: true,
    }))

    try {
      await resendEmailSignUpCode(email)
      setAuth((current) => ({
        ...current,
        error: undefined,
        isLoading: false,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos reenviar el código.'
      setAuth((current) => ({
        ...current,
        error: message,
        isLoading: false,
      }))
      throw error
    }
  }

  const signOut = () => {
    const provider = auth.user?.lastAuthProvider?.trim().toLowerCase()
    const shouldRedirectToHostedLogout = Boolean(
      authConfig.isHostedUiConfigured && provider && provider !== 'email',
    )

    clearPendingAuth()
    clearStoredSession()
    setAuth({ isLoading: false })
    navigate(appPaths.home, { replace: true })

    try {
      if (shouldRedirectToHostedLogout) {
        redirectToHostedLogout()
      }
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
        signInWithEmail: startEmailSignIn,
        signUpWithEmail: startEmailSignUp,
        confirmEmailSignUp: completeEmailSignUp,
        resendEmailSignUpCode: resendEmailCode,
        signOut,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
