import { formatStatusLabel } from '@/shared/lib/status'
import type { DealPartySummary } from '@/features/deals/types'

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const dateOnly = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
})

export function formatDealTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }
  return dateTime.format(parsed)
}

export function formatDealDate(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }
  return dateOnly.format(parsed)
}

/** Deal/commercial amounts are major-unit decimals from the API (not minor units). */
export function formatDealMoney(
  amount: string | number | null | undefined,
  currency: string | null | undefined = 'NGN',
): string {
  if (amount == null || amount === '') {
    return '—'
  }
  const code = currency?.trim() || 'NGN'
  return `${String(amount)} ${code}`
}

export function formatCommissionRate(
  type: string | null | undefined,
  rate: string | number | null | undefined,
  amount: string | number | null | undefined,
  currency: string | null | undefined = 'NGN',
): string {
  if (type === 'percentage' && rate != null && rate !== '') {
    return `${rate}%`
  }
  if (type === 'fixed') {
    return formatDealMoney(amount, currency)
  }
  if (amount != null && amount !== '') {
    return formatDealMoney(amount, currency)
  }
  if (rate != null && rate !== '') {
    return String(rate)
  }
  return '—'
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

export function formatActorLabel(
  actor: { id: number; role: string; name?: string } | null | undefined,
): string {
  if (!actor) {
    return 'System'
  }
  if (actor.name) {
    return actor.name
  }
  return `${formatPartyRole(actor.role)} #${actor.id}`
}

export function formatEventType(type: string): string {
  return formatStatusLabel(type)
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

export function partySanctionVisible(status: string | null | undefined): boolean {
  return Boolean(status && status !== 'active')
}

export function formatPartyLine(party: DealPartySummary | null | undefined): {
  name: string
  email: string
  status: string | null
} {
  if (!party) {
    return { name: '—', email: '—', status: null }
  }
  return {
    name: party.name,
    email: party.email,
    status: partySanctionVisible(party.status) ? party.status : null,
  }
}

const SENSITIVE_METADATA_KEYS = new Set([
  'password',
  'token',
  'remember_token',
  'payment_account_identifier',
  'payment_instructions',
  'payment_contact',
  'storage_path',
  'disk',
  'path',
  'key',
  'signed_url',
])

export function formatEventMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string[] {
  if (!metadata || typeof metadata !== 'object') {
    return []
  }

  const lines: string[] = []
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_METADATA_KEYS.has(key)) {
      continue
    }
    if (value == null) {
      continue
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${formatStatusLabel(key)}: ${String(value)}`)
      continue
    }
    if (Array.isArray(value) && value.every((item) => typeof item !== 'object')) {
      lines.push(`${formatStatusLabel(key)}: ${value.map(String).join(', ')}`)
      continue
    }
    lines.push(`${formatStatusLabel(key)}: [structured]`)
  }
  return lines
}
