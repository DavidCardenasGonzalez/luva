import { createContext } from 'react'
import type {
  AuthConfig,
  AuthMode,
  AuthProviderName,
  AuthState,
  CurrentUserUpdatePayload,
  CurrentUserUpdateResult,
  EmailSignUpResult,
} from '@/features/auth/model/types'

export type AuthContextValue = {
  auth: AuthState
  authConfig: AuthConfig
  isSignedIn: boolean
  startAuthFlow: (mode: AuthMode, provider: AuthProviderName) => void
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<EmailSignUpResult>
  confirmEmailSignUp: (email: string, code: string, password: string) => Promise<void>
  resendEmailSignUpCode: (email: string) => Promise<void>
  signOut: () => void
  updateCurrentUser: (payload?: CurrentUserUpdatePayload) => Promise<CurrentUserUpdateResult>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
