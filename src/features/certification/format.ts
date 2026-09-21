import { formatAmountMinor } from '@/shared/lib/money'
import type { CertificationProgrammeVersion } from '@/features/certification/types'

const dateTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatCertificationTimestamp(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return '—'
  }
  return dateTime.format(parsed)
}

/** Certification fees are integer minor units on the wire. */
export function formatCertificationFee(
  amountMinor: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (amountMinor == null) {
    return 'Not set'
  }
  return formatAmountMinor(amountMinor, currency?.trim() || 'NGN')
}

export function formatPassMark(value: string | null | undefined): string {
  if (value == null || value === '') {
    return 'Not set'
  }
  return `${value}%`
}

export function formatScore(
  scorePercent: string | null | undefined,
  correct: number | null | undefined,
  total: number | null | undefined,
): string {
  if (scorePercent == null || scorePercent === '') {
    return '—'
  }
  if (correct != null && total != null) {
    return `${scorePercent}% (${correct}/${total})`
  }
  return `${scorePercent}%`
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

/** Draft versions are the only mutable ones (MH-BE-CERT-02 immutability rule). */
export function isVersionMutable(
  version: Pick<CertificationProgrammeVersion, 'status'> | null | undefined,
): boolean {
  return version?.status === 'draft'
}

export function versionImmutabilityNote(status: string | null | undefined): string | null {
  if (status === 'published') {
    return 'This version is published and immutable. Curriculum, assessment, fee, and pass mark cannot be edited. Create a new draft version to change content.'
  }
  if (status === 'unpublished') {
    return 'This version is unpublished and immutable. It remains the historical record for learners bound to it and cannot be edited or re-published.'
  }
  return null
}

/** Maps Laravel validation `details` into flat field messages. */
export function formatFieldErrors(details: unknown): Record<string, string> {
  if (!details || typeof details !== 'object') {
    return {}
  }

  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      out[key] = value[0]
    } else if (typeof value === 'string') {
      out[key] = value
    }
  }
  return out
}
