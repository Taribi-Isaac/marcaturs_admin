import { useId } from 'react'
import { formatDisputeTimestamp, formatPartyLabel } from '@/features/disputes/format'
import type { DisputeCommissionSummary, DisputeDealContext } from '@/features/disputes/types'
import { StatusBadge } from '@/shared/ui'

export function DisputeDealContextPanel({
  deal,
  commission,
}: {
  deal: DisputeDealContext | null | undefined
  commission: DisputeCommissionSummary | null | undefined
}) {
  const headingId = useId()

  if (!deal) {
    return (
      <section className="dispute-panel" aria-labelledby={headingId}>
        <h2 id={headingId}>Deal context</h2>
        <p className="dispute-muted">
          Deal context was not included on this dispute response. No secondary Deal API is invented
          here.
        </p>
      </section>
    )
  }

  const commissionRow = commission ?? deal.commission ?? null

  return (
    <section className="dispute-panel" aria-labelledby={headingId}>
      <h2 id={headingId}>Deal context</h2>
      <p className="dispute-muted">
        Read-only investigation context. This console does not mutate Deal or commission financial
        state.
      </p>
      <dl className="dispute-dl">
        <div>
          <dt>Deal</dt>
          <dd>#{deal.id}</dd>
        </div>
        <div>
          <dt>Deal status</dt>
          <dd>
            <StatusBadge domain="deal" status={String(deal.status)} />
          </dd>
        </div>
        <div>
          <dt>Business</dt>
          <dd>{formatPartyLabel(deal.business)}</dd>
        </div>
        <div>
          <dt>Ambassador</dt>
          <dd>{formatPartyLabel(deal.ambassador)}</dd>
        </div>
        <div>
          <dt>Campaign</dt>
          <dd>{deal.campaign?.title ?? '—'}</dd>
        </div>
        <div>
          <dt>Campaign version</dt>
          <dd>
            {deal.campaign_version?.version_number != null
              ? `v${deal.campaign_version.version_number}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Confirmed</dt>
          <dd>{formatDisputeTimestamp(deal.confirmed_at)}</dd>
        </div>
        <div>
          <dt>Open disputes on Deal</dt>
          <dd>{deal.open_dispute_count ?? '—'}</dd>
        </div>
        {commissionRow ? (
          <>
            <div>
              <dt>Commission status</dt>
              <dd>
                <StatusBadge domain="commission" status={String(commissionRow.status)} />
                {commissionRow.is_overdue ? ' (overdue)' : ''}
              </dd>
            </div>
            <div>
              <dt>Commission amount</dt>
              <dd>
                {commissionRow.amount != null
                  ? `${commissionRow.amount} ${commissionRow.currency ?? ''}`.trim()
                  : '—'}
              </dd>
            </div>
          </>
        ) : null}
      </dl>
    </section>
  )
}
