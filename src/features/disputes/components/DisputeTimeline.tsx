import { useId, useMemo } from 'react'
import {
  formatDisputeTimestamp,
  formatEventType,
  formatPartyLabel,
} from '@/features/disputes/format'
import type { DisputeEvent } from '@/features/disputes/types'

export function DisputeTimeline({ events }: { events: DisputeEvent[] }) {
  const headingId = useId()
  const ordered = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aTime = Date.parse(a.created_at ?? '') || 0
        const bTime = Date.parse(b.created_at ?? '') || 0
        return aTime - bTime
      }),
    [events],
  )

  return (
    <section className="dispute-panel" aria-labelledby={headingId}>
      <h2 id={headingId}>Case timeline</h2>
      <p className="dispute-muted">Events returned by the Admin dispute show API.</p>

      {ordered.length === 0 ? (
        <p className="dispute-muted">No dispute events are recorded for this case.</p>
      ) : (
        <ol className="dispute-timeline">
          {ordered.map((event) => {
            const reason = typeof event.metadata?.reason === 'string' ? event.metadata.reason : null
            const note =
              typeof event.metadata?.note === 'string'
                ? event.metadata.note
                : typeof event.metadata?.classification_note === 'string'
                  ? event.metadata.classification_note
                  : typeof event.metadata?.close_note === 'string'
                    ? event.metadata.close_note
                    : null

            return (
              <li key={event.id} className="dispute-timeline__item">
                <div className="dispute-stack">
                  <span className="dispute-primary">{formatEventType(event.type)}</span>
                  <span className="dispute-muted">
                    {formatDisputeTimestamp(event.created_at)} ·{' '}
                    {formatPartyLabel(event.actor ?? null)}
                    {event.previous_status
                      ? ` · ${event.previous_status} → ${event.new_status}`
                      : ` · ${event.new_status}`}
                  </span>
                  {reason ? <span className="dispute-muted">Reason: {reason}</span> : null}
                  {note ? <span className="dispute-muted">Note: {note}</span> : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
