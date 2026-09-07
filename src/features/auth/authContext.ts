import { createContext } from 'react'
import type { AuthStatus, AuthUser, LoginPayload } from '@/shared/types/auth'

export type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  bootstrapError: string | null
  isBootstrapping: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
