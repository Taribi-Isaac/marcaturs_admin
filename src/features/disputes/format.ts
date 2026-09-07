export function formatDisputeTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

export function formatBytes(size: number | null | undefined): string {
  if (size == null || Number.isNaN(size)) {
    return '—'
  }
  if (size < 1024) {
    return `${size} B`
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function formatPartyRole(role: string | null | undefined): string {
  if (!role) {
    return '—'
  }
  if (role === 'BUSINESS') {
    return 'Business'
  }
  if (role === 'AMBASSADOR') {
    return 'Ambassador'
  }
  if (role === 'ADMIN') {
    return 'Admin'
  }
  return role
}

export function formatPartyLabel(
  party:
    | {
        id?: number
        name?: string
        role?: string
      }
    | null
    | undefined,
): string {
  if (!party) {
    return '—'
  }
  if (party.name) {
    return party.name
  }
  return `${formatPartyRole(party.role)} #${party.id}`
}

export function formatEventType(type: string): string {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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

export function truncateText(value: string | null | undefined, max = 80): string {
  if (!value) {
    return '—'
  }
  if (value.length <= max) {
    return value
  }
  return `${value.slice(0, max - 1)}…`
}
