import type { StaffRole } from '@/shared/types/auth'
import { formatStatusLabel } from '@/shared/lib/status'

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatStaffTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }

  return dateTime.format(parsed)
}

export function formatStaffRole(role: StaffRole | null | undefined): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Admin'
    case 'OPERATIONS':
      return 'Operations'
    case 'VERIFICATION':
      return 'Verification'
    case 'MODERATION':
      return 'Moderation'
    default:
      return role ?? '—'
  }
}

export function formatAccountStatusLabel(status: string): string {
  return formatStatusLabel(status)
}

export function formatStaffEventAction(action: string): string {
  return formatStatusLabel(action)
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
