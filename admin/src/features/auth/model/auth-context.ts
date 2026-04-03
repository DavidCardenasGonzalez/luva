import { createContext } from 'react'
import type { AuthConfig, AuthMode, AuthProviderName, AuthState } from '@/features/auth/model/types'

export type AuthContextValue = {
  auth: AuthState
  authConfig: AuthConfig
  isSignedIn: boolean
  startAuthFlow: (mode: AuthMode, provider: AuthProviderName, redirectPath?: string) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
