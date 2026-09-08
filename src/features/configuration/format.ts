const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatConfigTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }
  return dateTime.format(parsed)
}

export { formatAmountMinor, majorAmountToMinor, minorAmountToMajorInput } from '@/shared/lib/money'

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

export function formatActiveLabel(isActive: boolean | undefined): string {
  if (isActive === undefined) {
    return '—'
  }
  return isActive ? 'Active' : 'Inactive'
}

export function formatListingStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
