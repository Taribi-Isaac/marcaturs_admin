export type UserRole = 'ADMIN' | 'BUSINESS' | 'AMBASSADOR'

export type StaffRole = 'SUPER_ADMIN' | 'OPERATIONS' | 'VERIFICATION' | 'MODERATION'

export type AuthUser = {
  id: number
  name: string
  email: string
  role: UserRole
  status: 'active' | 'restricted' | 'suspended' | 'banned'
  email_verified_at: string | null
  last_login_at: string | null
  created_at: string | null
  staff_role?: StaffRole | null
  permissions?: string[]
}

export type AuthStatus =
  | 'unknown'
  | 'unauthenticated'
  | 'authenticated_admin'
  | 'authenticated_non_admin'
  | 'forbidden'
  | 'error'

export type LoginPayload = {
  email: string
  password: string
}

/**
 * Browser login authenticates through the Sanctum session cookie; the API does
 * not issue a personal access token to the SPA, so there is no `token` here.
 */
export type LoginResult = {
  user: AuthUser
}
