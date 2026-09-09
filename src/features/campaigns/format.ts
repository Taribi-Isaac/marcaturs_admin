const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatCampaignTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }

  return dateTime.format(parsed)
}

/** Integer-safe money display — aliases the shared Admin money helper. */
export { formatAmountMinor as formatMoneyMinor } from '@/shared/lib/money'

/** Campaign commercial amounts are major-unit decimals from the Admin API. */
export function formatCampaignMoney(
  amount: string | number | null | undefined,
  currency: string | null | undefined = 'NGN',
): string {
  if (amount == null || amount === '') {
    return '—'
  }
  const code = currency?.trim() || 'NGN'
  return `${String(amount)} ${code}`
}

export function formatCampaignCommission(
  type: string | null | undefined,
  rate: string | number | null | undefined,
  amount: string | number | null | undefined,
  currency: string | null | undefined = 'NGN',
): string {
  if (type === 'percentage' && rate != null && rate !== '') {
    return `${rate}%`
  }
  if (type === 'fixed') {
    return formatCampaignMoney(amount, currency)
  }
  if (amount != null && amount !== '') {
    return formatCampaignMoney(amount, currency)
  }
  if (rate != null && rate !== '') {
    return String(rate)
  }
  return '—'
}

export function displayCampaignText(value: string | number | null | undefined): string {
  if (value == null || value === '') {
    return '—'
  }
  return String(value)
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
