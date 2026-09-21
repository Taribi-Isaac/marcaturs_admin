import type { AccountStatus } from '@/shared/types/domain'
import type { StaffRole } from '@/shared/types/auth'

export type AdminStaffListItem = {
  id: number
  name: string
  email: string
  role: 'ADMIN'
  staff_role: StaffRole | null
  status: AccountStatus
  email_verified_at: string | null
  last_login_at: string | null
  created_at: string | null
  permissions: string[]
}

export type AdminStaffActorRef = {
  id: number
  name: string
  email: string
}

export type AdminStaffEvent = {
  id: number
  action: string
  previous_staff_role: StaffRole | null
  new_staff_role: StaffRole | null
  previous_status: AccountStatus | null
  new_status: AccountStatus | null
  reason: string | null
  actor: AdminStaffActorRef | null
  created_at: string | null
}

export type AdminStaffDetail = AdminStaffListItem & {
  created_by: AdminStaffActorRef | null
  events: AdminStaffEvent[]
}

export type StaffListParams = {
  staff_role?: StaffRole
  status?: AccountStatus
  q?: string
  page?: number
  per_page?: number
}

export type InviteStaffPayload = {
  name: string
  email: string
  staff_role: StaffRole
}

export type AdminStaffInvitation = {
  id: number
  email: string
  name: string
  staff_role: StaffRole
  expires_at: string | null
  accepted_at: string | null
  revoked_at: string | null
  created_at: string | null
  invited_by_user_id: number | null
  debug_token?: string
}

export type ChangeStaffRolePayload = {
  staff_role: StaffRole
}

export type StaffStatusActionPayload = {
  reason: string
}

export type AcceptStaffInvitationPayload = {
  token: string
  password: string
  password_confirmation: string
}

export type StaffStatusAction = 'disable' | 'restore'
