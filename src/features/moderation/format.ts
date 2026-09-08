const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatModerationTimestamp(value: string | null | undefined): string {
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
  party: { id: number; name?: string; role: string } | null | undefined,
): string {
  if (!party) {
    return '—'
  }
  if (party.name) {
    return party.name
  }
  return `${party.role} #${party.id}`
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

export function truncateText(value: string | null | undefined, max = 96): string {
  if (!value) {
    return '—'
  }
  const trimmed = value.trim()
  if (trimmed.length <= max) {
    return trimmed
  }
  return `${trimmed.slice(0, max - 1)}…`
}

export function resolveSenderLabel(
  senderId: number,
  business: { id: number; name?: string; role: string } | null | undefined,
  ambassador: { id: number; name?: string; role: string } | null | undefined,
): string {
  if (business?.id === senderId) {
    return formatPartyLabel(business)
  }
  if (ambassador?.id === senderId) {
    return formatPartyLabel(ambassador)
  }
  return `Participant #${senderId}`
}
