import { useId } from 'react'
import { ApiClientError } from '@/shared/api'
import { formatCampaignTimestamp, formatMoneyMinor } from '@/features/campaigns/format'
import type { CampaignFeaturedPurchase } from '@/features/campaigns/types'
import { ErrorState, LoadingState, Notice } from '@/shared/ui'

export function CampaignFeaturedPanel({
  purchases,
  isLoading,
  error,
  onRetry,
}: {
  purchases: CampaignFeaturedPurchase[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
}) {
  const headingId = useId()
  const active = purchases.filter((item) => item.is_active)

  return (
    <section className="campaign-panel" aria-labelledby={headingId}>
      <h2 id={headingId}>Featured visibility</h2>
      <p className="campaign-muted">
        Featured visibility is a paid, time-bound MarcatursHub platform entitlement. This section is
        inspection only.
      </p>

      {isLoading ? <LoadingState label="Loading featured history" rows={3} /> : null}
      {!isLoading && error ? (
        <ErrorState
          title="Unable to load featured history"
          description={
            error instanceof ApiClientError
              ? error.message
              : 'Featured history could not be loaded.'
          }
          onRetry={onRetry}
        />
      ) : null}

      {!isLoading && !error ? (
        <>
          <Notice tone={active.length > 0 ? 'success' : 'info'} title="Current featured state">
            {active.length > 0
              ? `${active.length} active Featured entitlement${active.length === 1 ? '' : 's'} on this campaign.`
              : 'No active Featured entitlement on this campaign.'}
          </Notice>

          {purchases.length === 0 ? (
            <p className="campaign-muted">
              No Featured purchase history is recorded for this campaign.
            </p>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table data-table--compact">
                <caption className="sr-only">Featured purchase history</caption>
                <thead>
                  <tr>
                    <th scope="col">Package</th>
                    <th scope="col">Window</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Payment</th>
                    <th scope="col">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="campaign-stack">
                          <span className="campaign-primary">{item.package_name}</span>
                          <span className="campaign-muted">{item.duration_days} days</span>
                        </div>
                      </td>
                      <td>
                        <div className="campaign-stack">
                          <span className="campaign-muted">
                            {formatCampaignTimestamp(item.activated_at)}
                          </span>
                          <span className="campaign-muted">
                            → {formatCampaignTimestamp(item.expires_at)}
                          </span>
                        </div>
                      </td>
                      <td>{formatMoneyMinor(item.amount_minor, item.currency)}</td>
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
                      <td>{item.is_active ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}
