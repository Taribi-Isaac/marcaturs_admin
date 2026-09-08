import type { AccountStatus } from '@/shared/types/domain'

export type ParticipantRole = 'BUSINESS' | 'AMBASSADOR'

export type OverallVerificationStatus =
  'NOT_STARTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'MORE_INFORMATION_REQUIRED'

export type AdminUserCounts = {
  campaigns: number
  deals: number
  open_disputes: number
  commissions_due: number
  commissions_overdue: number
}

export type AdminUserProfileSummary =
  | {
      legal_name: string
      trading_name: string | null
    }
  | {
      display_name: string
    }

export type BusinessProfileDetail = {
  id: number
  legal_name: string
  trading_name: string | null
  description: string | null
  category: string | null
  address: string | null
  operating_location: string | null
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  social_links: Record<string, string> | Record<string, never>
  created_at: string | null
  updated_at: string | null
}

export type AmbassadorProfileDetail = {
  id: number
  display_name: string
  profile_description: string | null
  location: string | null
  skills: string[]
  marketing_interests: string[]
  experience: string | null
  created_at: string | null
  updated_at: string | null
}

export type AdminUserVerificationSubmission = {
  id: number
  requirement_id: number
  status: string
  current_version: number
  submitted_at: string | null
  reviewed_at: string | null
}

export type AdminUserListItem = {
  id: number
  role: ParticipantRole
  name: string
  email: string
  status: AccountStatus
  email_verified_at: string | null
  created_at: string | null
  updated_at: string | null
  profile_summary: AdminUserProfileSummary | null
  verification_status: OverallVerificationStatus
  counts: AdminUserCounts
}

export type AdminUserDetail = AdminUserListItem & {
  last_login_at: string | null
  profile: BusinessProfileDetail | AmbassadorProfileDetail | null
  verification_submissions: AdminUserVerificationSubmission[]
}

export type UserListParams = {
  role?: ParticipantRole
  status?: AccountStatus
  q?: string
  page?: number
  per_page?: number
}

export type UserStatusAction = 'restrict' | 'suspend' | 'restore' | 'ban'

export type UserStatusActionPayload = {
  reason: string
}
