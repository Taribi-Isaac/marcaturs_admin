import type {
  AdminUserListItem,
  AdminUserProfileSummary,
  OverallVerificationStatus,
  ParticipantRole,
} from '@/features/users/types'
import { formatStatusLabel } from '@/shared/lib/status'

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatUserTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }

  return dateTime.format(parsed)
}

export function formatParticipantRole(role: ParticipantRole | string): string {
  if (role === 'BUSINESS') {
    return 'Business'
  }
  if (role === 'AMBASSADOR') {
    return 'Ambassador'
  }
  return role
}

export function formatOverallVerification(status: OverallVerificationStatus | string): string {
  return formatStatusLabel(status.toLowerCase())
}

export function formatAccountStatusLabel(status: string): string {
  return formatStatusLabel(status)
}

export function profileDisplayName(
  role: ParticipantRole | string,
  summary: AdminUserProfileSummary | null | undefined,
): string | null {
  if (!summary) {
    return null
  }
  if (role === 'BUSINESS' && 'legal_name' in summary) {
    return summary.trading_name?.trim() || summary.legal_name
  }
  if (role === 'AMBASSADOR' && 'display_name' in summary) {
    return summary.display_name
  }
  return null
}

export function participantPrimaryLabel(
  user: Pick<AdminUserListItem, 'name' | 'role' | 'profile_summary'>,
): string {
  return profileDisplayName(user.role, user.profile_summary) ?? user.name
}

export function commissionAttentionLabel(counts: AdminUserListItem['counts']): string {
  const overdue = counts.commissions_overdue
  const due = counts.commissions_due
  if (overdue === 0 && due === 0) {
    return '—'
  }
  const parts: string[] = []
  if (overdue > 0) {
    parts.push(`${overdue} overdue`)
  }
  if (due > 0) {
    parts.push(`${due} due`)
  }
  return parts.join(' · ')
}

export function formatFieldErrors(details: unknown): Record<string, string> {
  if (!details || typeof details !== 'object') {
    return {}
  }

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      result[key] = value[0]
    } else if (typeof value === 'string') {
      result[key] = value
    }
  }
  return result
}
