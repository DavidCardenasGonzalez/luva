import { useContext } from 'react'
import { AuthContext } from '@/features/auth/model/auth-context'

export function useAuthSession() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthSession must be used inside AuthProvider')
  }
  return context
}
