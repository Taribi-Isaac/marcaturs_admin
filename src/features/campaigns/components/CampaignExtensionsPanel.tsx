import { useId } from 'react'
import { ApiClientError } from '@/shared/api'
import { formatCampaignTimestamp, formatMoneyMinor } from '@/features/campaigns/format'
import type { CampaignExtension } from '@/features/campaigns/types'
import { ErrorState, LoadingState } from '@/shared/ui'

export function CampaignExtensionsPanel({
  extensions,
  isLoading,
  error,
  onRetry,
}: {
  extensions: CampaignExtension[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
}) {
  const headingId = useId()

  return (
    <section className="campaign-panel" aria-labelledby={headingId}>
      <h2 id={headingId}>Listing extensions</h2>
      <p className="campaign-muted">
        Campaign Extension is a paid MarcatursHub platform payment that extends listing duration.
        Inspection only — no manual activation or refunds from this console.
      </p>

      {isLoading ? <LoadingState label="Loading extension history" rows={3} /> : null}
      {!isLoading && error ? (
        <ErrorState
          title="Unable to load extension history"
          description={
            error instanceof ApiClientError
              ? error.message
              : 'Extension history could not be loaded.'
          }
          onRetry={onRetry}
        />
      ) : null}

      {!isLoading && !error && extensions.length === 0 ? (
        <p className="campaign-muted">No extension history is recorded for this campaign.</p>
      ) : null}

      {!isLoading && !error && extensions.length > 0 ? (
        <div className="data-table-wrap">
          <table className="data-table data-table--compact">
            <caption className="sr-only">Campaign extension history</caption>
            <thead>
              <tr>
                <th scope="col">Applied</th>
                <th scope="col">Duration</th>
                <th scope="col">Listing expiry</th>
                <th scope="col">Status transition</th>
                <th scope="col">Payment</th>
              </tr>
            </thead>
            <tbody>
              {extensions.map((item) => (
                <tr key={item.id}>
                  <td>{formatCampaignTimestamp(item.applied_at)}</td>
                  <td>
                    {item.duration_days} days · {formatMoneyMinor(item.amount_minor, item.currency)}
                  </td>
                  <td>
                    <div className="campaign-stack">
                      <span className="campaign-muted">
                        {formatCampaignTimestamp(item.previous_listing_expires_at)}
                      </span>
                      <span className="campaign-muted">
                        → {formatCampaignTimestamp(item.resulting_listing_expires_at)}
                      </span>
                    </div>
                  </td>
                  <td>{(item.previous_status ?? '—') + ' → ' + (item.resulting_status ?? '—')}</td>
                  <td>
                    {item.payment ? (
                      <div className="campaign-stack">
                        <span>{item.payment.reference}</span>
                        <span className="campaign-muted">
                          {item.payment.status} · {item.payment.purpose}
                        </span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
