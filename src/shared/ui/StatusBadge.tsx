import { formatStatusLabel, resolveStatusTone, type StatusDomain } from '@/shared/lib/status'
import type { DomainStatusTone } from '@/shared/types/domain'

export type StatusBadgeProps = {
  domain: StatusDomain
  status: string
  label?: string
}

export function StatusBadge({ domain, status, label }: StatusBadgeProps) {
  const tone: DomainStatusTone = resolveStatusTone(domain, status)
  const text = label ?? formatStatusLabel(status)

  return (
    <span className={`status-badge status-badge--${tone}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      <span>{text}</span>
    </span>
  )
}
