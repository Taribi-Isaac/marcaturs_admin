import { useId, useMemo } from 'react'
import {
  formatActorLabel,
  formatDealTimestamp,
  formatEventMetadata,
  formatEventType,
} from '@/features/deals/format'
import type { DealEvent } from '@/features/deals/types'
import { formatStatusLabel } from '@/shared/lib/status'

export function DealTimeline({ events }: { events: DealEvent[] }) {
  const headingId = useId()
  const ordered = useMemo(
    () =>
      [...events].sort((a, b) => {
        if (a.id !== b.id) {
          return a.id - b.id
        }
        const aTime = Date.parse(a.created_at ?? '') || 0
        const bTime = Date.parse(b.created_at ?? '') || 0
        return aTime - bTime
      }),
    [events],
  )

  return (
    <section className="deals-panel deals-panel--wide" aria-labelledby={headingId}>
      <h2 id={headingId}>Deal timeline</h2>
      <p className="deals-muted">Chronological Deal events (oldest → newest). Read-only.</p>

      {ordered.length === 0 ? (
        <p className="deals-muted">No Deal events are recorded yet.</p>
      ) : (
        <ol className="deals-timeline">
          {ordered.map((event) => {
            const metaLines = formatEventMetadata(event.metadata)
            return (
              <li key={event.id} className="deals-timeline__item">
                <div className="deals-stack">
                  <span className="deals-primary">{formatEventType(event.type)}</span>
                  <span className="deals-muted">
                    {formatDealTimestamp(event.created_at)} · {formatActorLabel(event.actor)}
                    {event.previous_status
                      ? ` · ${formatStatusLabel(String(event.previous_status))} → ${formatStatusLabel(String(event.new_status))}`
                      : ` · ${formatStatusLabel(String(event.new_status))}`}
                  </span>
                  {metaLines.map((line) => (
                    <span key={line} className="deals-muted">
                      {line}
                    </span>
                  ))}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
