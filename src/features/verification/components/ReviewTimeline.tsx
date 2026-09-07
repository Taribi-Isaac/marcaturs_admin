import { useId } from 'react'
import { formatReviewAction, formatVerificationTimestamp } from '@/features/verification/format'
import type { VerificationReviewEvent } from '@/features/verification/types'
import { ErrorState, LoadingState } from '@/shared/ui'

export type ReviewTimelineProps = {
  events: VerificationReviewEvent[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
}

export function ReviewTimeline({ events, isLoading, error, onRetry }: ReviewTimelineProps) {
  const headingId = useId()

  return (
    <section className="verification-panel" aria-labelledby={headingId}>
      <h2 id={headingId}>Review history</h2>

      {isLoading ? <LoadingState label="Loading review history" rows={3} /> : null}

      {!isLoading && error ? (
        <ErrorState
          title="Unable to load review history"
          description="Review events could not be retrieved for this submission."
          onRetry={onRetry}
        />
      ) : null}

      {!isLoading && !error && events.length === 0 ? (
        <p className="verification-muted">No review events have been recorded yet.</p>
      ) : null}

      {!isLoading && !error && events.length > 0 ? (
        <ol className="verification-timeline">
          {[...events]
            .sort(
              (a, b) =>
                (Date.parse(b.created_at ?? '') || 0) - (Date.parse(a.created_at ?? '') || 0),
            )
            .map((event) => (
              <li key={event.id} className="verification-timeline__item">
                <div className="verification-timeline__header">
                  <strong>{formatReviewAction(event.action)}</strong>
                  <span>{formatVerificationTimestamp(event.created_at)}</span>
                </div>
                <div className="verification-stack__secondary">
                  {event.previous_status ?? '—'} → {event.new_status}
                  {event.actor_id != null ? ` · Actor #${event.actor_id}` : ''}
                </div>
                {event.reason ? (
                  <p className="verification-timeline__note">Reason: {event.reason}</p>
                ) : null}
                {event.reviewer_notes ? (
                  <p className="verification-timeline__note">Notes: {event.reviewer_notes}</p>
                ) : null}
              </li>
            ))}
        </ol>
      ) : null}
    </section>
  )
}
