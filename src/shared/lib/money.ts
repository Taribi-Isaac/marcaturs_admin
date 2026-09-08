/**
 * Integer-safe money helpers for Admin display and form conversion.
 * Never use floating-point multiplication/division for monetary values.
 */

/** Format minor units using integer division only. */
export function formatAmountMinor(
  amountMinor: number | null | undefined,
  currency = 'NGN',
): string {
  if (amountMinor == null || Number.isNaN(amountMinor)) {
    return '—'
  }

  const negative = amountMinor < 0
  const abs = Math.abs(Math.trunc(amountMinor))
  const whole = Math.trunc(abs / 100)
  const fraction = String(abs % 100).padStart(2, '0')
  return `${negative ? '-' : ''}${whole}.${fraction} ${currency}`
}

/**
 * Convert a major-unit decimal string (e.g. "25000.50") to integer minor units.
 * Rejects invalid shapes; never uses floating multiplication for money.
 */
export function majorAmountToMinor(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null
  }
  const [wholePart, fractionPart = ''] = trimmed.split('.')
  const whole = Number(wholePart)
  const fraction = Number((fractionPart + '00').slice(0, 2))
  if (!Number.isFinite(whole) || !Number.isFinite(fraction)) {
    return null
  }
  return whole * 100 + fraction
}

export function minorAmountToMajorInput(amountMinor: number): string {
  const abs = Math.abs(Math.trunc(amountMinor))
  const whole = Math.trunc(abs / 100)
  const fraction = abs % 100
  return `${whole}.${String(fraction).padStart(2, '0')}`
}
