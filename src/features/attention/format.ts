const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatAttentionTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }

  return dateTime.format(parsed)
}

export function formatPartyLabel(
  party: { name?: string; email?: string; role: string; id: number } | null | undefined,
): string {
  if (!party) {
    return '—'
  }

  if (party.name) {
    return party.name
  }

  if (party.email) {
    return party.email
  }

  return `${party.role} #${party.id}`
}

export function truncateText(value: string | null | undefined, max = 72): string {
  if (!value) {
    return '—'
  }

  const trimmed = value.trim()
  if (trimmed.length <= max) {
    return trimmed
  }

  return `${trimmed.slice(0, max - 1)}…`
}
