import { Notice } from './Notice'
import { StatusBadge } from './StatusBadge'
import type { StatusDomain } from '@/shared/lib/status'

export type ModulePlaceholderProps = {
  moduleName: string
  summary: string
  nextTaskHint: string
  relatedStatuses?: Array<{ domain: StatusDomain; status: string }>
}

/**
 * Honest placeholder for Phase-1 routes — no fake data or pretend workflows.
 */
export function ModulePlaceholder({
  moduleName,
  summary,
  nextTaskHint,
  relatedStatuses,
}: ModulePlaceholderProps) {
  return (
    <div className="module-placeholder">
      <Notice tone="info" title={`${moduleName} is not implemented yet`}>
        {summary} {nextTaskHint}
      </Notice>
      {relatedStatuses && relatedStatuses.length > 0 ? (
        <div>
          <p className="notice__body" style={{ marginBottom: '0.5rem' }}>
            Status presentation foundation (backend enums only):
          </p>
          <div className="module-placeholder__meta">
            {relatedStatuses.map((item) => (
              <StatusBadge
                key={`${item.domain}-${item.status}`}
                domain={item.domain}
                status={item.status}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
