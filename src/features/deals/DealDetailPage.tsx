import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { fetchAdminDeal } from '@/features/deals/api'
import { DEAL_QUERY_KEYS } from '@/features/deals/constants'
import { DealEvidencePanel } from '@/features/deals/components/DealEvidencePanel'
import { DealTimeline } from '@/features/deals/components/DealTimeline'
import {
  formatCommissionRate,
  formatDealMoney,
  formatDealTimestamp,
  formatPartyRole,
} from '@/features/deals/format'
import type { AdminDealDetail, DealCampaignVersionSummary } from '@/features/deals/types'
import { campaignDetailPath } from '@/features/campaigns/constants'
import { disputeDetailPath } from '@/features/disputes/constants'
import { userDetailPath } from '@/features/users/constants'
import { formatStatusLabel } from '@/shared/lib/status'
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
  PageHeader,
  StatusBadge,
} from '@/shared/ui'

function displayText(value: string | number | null | undefined): string {
  if (value == null || value === '') {
    return '—'
  }
  return String(value)
}

function PartyBlock({ title, party }: { title: string; party: AdminDealDetail['business'] }) {
  if (!party) {
    return (
      <section className="deals-panel">
        <h2>{title}</h2>
        <p className="deals-muted">Party record unavailable.</p>
      </section>
    )
  }

  return (
    <section className="deals-panel">
      <h2>{title}</h2>
      <dl className="deals-dl">
        <div>
          <dt>Name</dt>
          <dd>{party.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd className="deals-break">{party.email}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{formatPartyRole(party.role)}</dd>
        </div>
        <div>
          <dt>Account status</dt>
          <dd>
            <StatusBadge domain="account" status={String(party.status)} />
          </dd>
        </div>
        <div className="deals-dl__full">
          <dt>Admin Users</dt>
          <dd>
            <Link className="deals-action-link" to={userDetailPath(party.id)}>
              Open participant #{party.id}
            </Link>
          </dd>
        </div>
      </dl>
    </section>
  )
}

function CampaignVersionFields({ version }: { version: DealCampaignVersionSummary }) {
  const hasCommercial =
    version.product_name != null ||
    version.price_amount != null ||
    version.commission_type != null ||
    version.terms != null

  return (
    <dl className="deals-dl">
      <div>
        <dt>Version ID</dt>
        <dd>#{version.id}</dd>
      </div>
      <div>
        <dt>Version number</dt>
        <dd>{version.version_number}</dd>
      </div>
      <div>
        <dt>Version status</dt>
        <dd>{version.status ? formatStatusLabel(version.status) : '—'}</dd>
      </div>
      <div>
        <dt>Published</dt>
        <dd>{formatDealTimestamp(version.published_at)}</dd>
      </div>
      {!hasCommercial ? (
        <div className="deals-dl__full">
          <dt>Commercial terms</dt>
          <dd className="deals-muted">
            Published commercial fields are not available for this version status. The Deal snapshot
            remains the historical commercial truth.
          </dd>
        </div>
      ) : (
        <>
          <div>
            <dt>Product</dt>
            <dd>{displayText(version.product_name)}</dd>
          </div>
          <div>
            <dt>Pricing</dt>
            <dd>
              {version.pricing_method ? formatStatusLabel(version.pricing_method) : '—'}
              {version.price_amount != null
                ? ` · ${formatDealMoney(version.price_amount, version.price_currency)}`
                : ''}
            </dd>
          </div>
          <div className="deals-dl__full">
            <dt>Product description</dt>
            <dd>{displayText(version.product_description)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Service area</dt>
            <dd>{displayText(version.service_area)}</dd>
          </div>
          <div>
            <dt>Commission</dt>
            <dd>
              {formatCommissionRate(
                version.commission_type,
                version.commission_rate,
                version.commission_amount,
                version.price_currency,
              )}
              {version.commission_trigger
                ? ` · ${formatStatusLabel(version.commission_trigger)}`
                : ''}
            </dd>
          </div>
          <div>
            <dt>Payment deadline</dt>
            <dd>
              {version.commission_payment_deadline_days != null
                ? `${version.commission_payment_deadline_days} days`
                : '—'}
            </dd>
          </div>
          <div className="deals-dl__full">
            <dt>Trigger description</dt>
            <dd>{displayText(version.commission_trigger_description)}</dd>
          </div>
          <div>
            <dt>Minimum qualifying amount</dt>
            <dd>{formatDealMoney(version.minimum_qualifying_amount, version.price_currency)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Qualifying conditions</dt>
            <dd>{displayText(version.qualifying_conditions)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Refund / cancellation rules</dt>
            <dd>{displayText(version.refund_cancellation_rules)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Approved claims</dt>
            <dd>{displayText(version.approved_claims)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Prohibited claims</dt>
            <dd>{displayText(version.prohibited_claims)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Brand use rules</dt>
            <dd>{displayText(version.brand_use_rules)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Geographic / customer restrictions</dt>
            <dd>{displayText(version.geographic_customer_restrictions)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Approved copy</dt>
            <dd>{displayText(version.approved_copy)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Marketing links</dt>
            <dd>
              {version.marketing_links && version.marketing_links.length > 0
                ? version.marketing_links.join(', ')
                : '—'}
            </dd>
          </div>
          <div>
            <dt>Payment destination</dt>
            <dd>{displayText(version.payment_destination_name)}</dd>
          </div>
          <div>
            <dt>Payment provider</dt>
            <dd>{displayText(version.payment_provider)}</dd>
          </div>
          <div className="deals-dl__full">
            <dt>Terms</dt>
            <dd>{displayText(version.terms)}</dd>
          </div>
        </>
      )}
    </dl>
  )
}

export function DealDetailPage() {
  const { id } = useParams()
  const dealId = Number(id)

  const detailQuery = useQuery({
    queryKey: DEAL_QUERY_KEYS.detail(dealId),
    queryFn: ({ signal }) => fetchAdminDeal(dealId, signal),
    enabled: Number.isFinite(dealId) && dealId > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (!Number.isFinite(dealId) || dealId <= 0) {
    return (
      <NotFoundState
        title="Deal not found"
        description="The Deal identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to="/deals">
            Back to Deals
          </Link>
        }
      />
    )
  }

  if (detailQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Deal"
          breadcrumbs={[{ label: 'Deals', to: '/deals' }, { label: 'Detail' }]}
        />
        <LoadingState label="Loading Deal" rows={8} />
      </>
    )
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Deal not found"
        description="This Deal does not exist or is no longer available."
        action={
          <Link className="ui-button ui-button--secondary" to="/deals">
            Back to Deals
          </Link>
        }
      />
    )
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <ErrorState
        title="Unable to load Deal"
        description={
          detailQuery.error instanceof ApiClientError
            ? detailQuery.error.message
            : 'The Deal could not be loaded.'
        }
        onRetry={() => {
          void detailQuery.refetch()
        }}
      />
    )
  }

  const deal = detailQuery.data
  const snapshot = deal.snapshot
  const version = deal.campaign_version

  return (
    <div className="deals-page">
      <PageHeader
        title={`Deal #${deal.id}`}
        description="Investigation workspace. This desk is read-only — Deal mutations belong to participant workflows."
        breadcrumbs={[{ label: 'Deals', to: '/deals' }, { label: `Deal #${deal.id}` }]}
        actions={
          <div className="deals-actions">
            <StatusBadge domain="deal" status={String(deal.status)} />
            <Link className="ui-button ui-button--secondary" to="/deals">
              Back to Deals
            </Link>
          </div>
        }
      />

      <section className="deals-panel">
        <h2>Identity</h2>
        <dl className="deals-dl">
          <div>
            <dt>Deal ID</dt>
            <dd>#{deal.id}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge domain="deal" status={String(deal.status)} />
            </dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatDealTimestamp(deal.created_at)}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{formatDealTimestamp(deal.updated_at)}</dd>
          </div>
          <div>
            <dt>Confirmed</dt>
            <dd>{formatDealTimestamp(deal.confirmed_at)}</dd>
          </div>
          <div>
            <dt>Cancelled</dt>
            <dd>{formatDealTimestamp(deal.cancelled_at)}</dd>
          </div>
        </dl>
      </section>

      <div className="deals-detail-grid">
        <PartyBlock title="Business" party={deal.business} />
        <PartyBlock title="Ambassador" party={deal.ambassador} />

        <section className="deals-panel">
          <h2>Campaign</h2>
          <dl className="deals-dl">
            <div>
              <dt>Title</dt>
              <dd>{deal.campaign?.title ?? '—'}</dd>
            </div>
            <div>
              <dt>Campaign ID</dt>
              <dd>{deal.campaign ? `#${deal.campaign.id}` : '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                {deal.campaign?.status ? (
                  <StatusBadge domain="campaign" status={String(deal.campaign.status)} />
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{deal.campaign?.category?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Bound version</dt>
              <dd>{version?.version_number != null ? `Version ${version.version_number}` : '—'}</dd>
            </div>
            {deal.campaign ? (
              <div className="deals-dl__full">
                <dt>Campaign desk</dt>
                <dd>
                  <Link className="deals-action-link" to={campaignDetailPath(deal.campaign.id)}>
                    Open campaign #{deal.campaign.id}
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="deals-panel">
          <h2>Payment confirmation</h2>
          <p className="deals-muted">
            Record of the Business confirming a qualifying customer payment. MarcatursHub does not
            process or hold customer funds.
          </p>
          <dl className="deals-dl">
            <div>
              <dt>Confirmation</dt>
              <dd>
                {deal.confirmed_at
                  ? 'Confirmed by Business'
                  : deal.status === 'payment_pending'
                    ? 'Awaiting Business confirmation'
                    : 'Not confirmed'}
              </dd>
            </div>
            <div>
              <dt>Confirmed payment amount</dt>
              <dd>
                {formatDealMoney(
                  deal.confirmed_payment_amount ?? snapshot?.confirmed_payment_amount,
                  snapshot?.price_currency,
                )}
              </dd>
            </div>
            <div>
              <dt>Confirmed at</dt>
              <dd>{formatDealTimestamp(deal.confirmed_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="deals-panel deals-panel--wide">
          <h2>Campaign Version at Deal creation</h2>
          <p className="deals-muted">
            Contextual published terms bound when the Deal was created. This is not the historical
            commercial truth of the Deal — use the Deal Snapshot below for that.
          </p>
          {version ? (
            <CampaignVersionFields version={version} />
          ) : (
            <p className="deals-muted">No bound Campaign Version is available.</p>
          )}
        </section>

        <section className="deals-panel deals-panel--wide deals-panel--snapshot">
          <h2>Deal Snapshot</h2>
          <p className="deals-muted">
            Immutable commercial snapshot recorded on the Deal. Never reconstruct Deal economics
            from the current Campaign or Campaign Version.
          </p>
          {snapshot ? (
            <dl className="deals-dl">
              <div>
                <dt>Product</dt>
                <dd>{displayText(snapshot.product_name)}</dd>
              </div>
              <div>
                <dt>Pricing method</dt>
                <dd>
                  {snapshot.pricing_method ? formatStatusLabel(snapshot.pricing_method) : '—'}
                </dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{formatDealMoney(snapshot.price_amount, snapshot.price_currency)}</dd>
              </div>
              <div>
                <dt>Currency</dt>
                <dd>{displayText(snapshot.price_currency)}</dd>
              </div>
              <div>
                <dt>Commission type</dt>
                <dd>
                  {snapshot.commission_type ? formatStatusLabel(snapshot.commission_type) : '—'}
                </dd>
              </div>
              <div>
                <dt>Commission rate / amount</dt>
                <dd>
                  {formatCommissionRate(
                    snapshot.commission_type,
                    snapshot.commission_rate,
                    snapshot.commission_amount,
                    snapshot.price_currency,
                  )}
                </dd>
              </div>
              <div>
                <dt>Commission trigger</dt>
                <dd>
                  {snapshot.commission_trigger
                    ? formatStatusLabel(snapshot.commission_trigger)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>Payment deadline</dt>
                <dd>
                  {snapshot.commission_payment_deadline_days != null
                    ? `${snapshot.commission_payment_deadline_days} days`
                    : '—'}
                </dd>
              </div>
              <div className="deals-dl__full">
                <dt>Trigger description</dt>
                <dd>{displayText(snapshot.commission_trigger_description)}</dd>
              </div>
              <div>
                <dt>Minimum qualifying amount</dt>
                <dd>
                  {formatDealMoney(snapshot.minimum_qualifying_amount, snapshot.price_currency)}
                </dd>
              </div>
              <div>
                <dt>Expected transaction amount</dt>
                <dd>
                  {formatDealMoney(snapshot.expected_transaction_amount, snapshot.price_currency)}
                </dd>
              </div>
              <div className="deals-dl__full">
                <dt>Qualifying conditions</dt>
                <dd>{displayText(snapshot.qualifying_conditions)}</dd>
              </div>
              <div>
                <dt>Confirmed payment amount</dt>
                <dd>
                  {formatDealMoney(snapshot.confirmed_payment_amount, snapshot.price_currency)}
                </dd>
              </div>
              <div>
                <dt>Confirmed at</dt>
                <dd>{formatDealTimestamp(snapshot.confirmed_at)}</dd>
              </div>
            </dl>
          ) : (
            <p className="deals-muted">Snapshot fields were not returned for this Deal.</p>
          )}
        </section>

        <DealEvidencePanel dealId={deal.id} evidence={deal.payment_evidence ?? []} />

        <section className="deals-panel">
          <h2>Ambassador commission</h2>
          <p className="deals-muted">
            Business → Ambassador liability on this Deal. This is not MarcatursHub platform revenue.
          </p>
          {deal.commission ? (
            <dl className="deals-dl">
              <div>
                <dt>Commission ID</dt>
                <dd>#{deal.commission.id}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge domain="commission" status={String(deal.commission.status)} />
                  {deal.commission.is_overdue ? (
                    <span className="deals-overdue"> · Overdue</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{formatDealMoney(deal.commission.amount, deal.commission.currency)}</dd>
              </div>
              <div>
                <dt>Type / rate</dt>
                <dd>
                  {formatCommissionRate(
                    deal.commission.commission_type,
                    deal.commission.commission_rate,
                    deal.commission.amount,
                    deal.commission.currency,
                  )}
                </dd>
              </div>
              <div>
                <dt>Became due</dt>
                <dd>{formatDealTimestamp(deal.commission.became_due_at)}</dd>
              </div>
              <div>
                <dt>Due at</dt>
                <dd>{formatDealTimestamp(deal.commission.due_at)}</dd>
              </div>
              <div>
                <dt>Paid at</dt>
                <dd>{formatDealTimestamp(deal.commission.paid_at)}</dd>
              </div>
              <div>
                <dt>Received at</dt>
                <dd>{formatDealTimestamp(deal.commission.received_at)}</dd>
              </div>
              <div>
                <dt>Payment reference</dt>
                <dd>{displayText(deal.commission.payment_reference)}</dd>
              </div>
              <div className="deals-dl__full">
                <dt>Payment note</dt>
                <dd>{displayText(deal.commission.payment_note)}</dd>
              </div>
            </dl>
          ) : (
            <p className="deals-muted">No commission liability exists on this Deal yet.</p>
          )}
        </section>

        <section className="deals-panel">
          <h2>Disputes</h2>
          <p className="deals-muted">
            Open disputes: {deal.open_dispute_count}. Summaries only — investigate in the Disputes
            desk.
          </p>
          {(deal.disputes ?? []).length === 0 ? (
            <p className="deals-muted">No disputes are linked to this Deal.</p>
          ) : (
            <ul className="deals-dispute-list">
              {deal.disputes.map((dispute) => (
                <li key={dispute.id} className="deals-dispute-list__item">
                  <div className="deals-stack">
                    <span className="deals-primary">{dispute.reference}</span>
                    <span className="deals-muted">
                      #{dispute.id}
                      {dispute.category ? ` · ${dispute.category.name}` : ''}
                    </span>
                    <StatusBadge domain="dispute" status={String(dispute.status)} />
                  </div>
                  <Link className="deals-action-link" to={disputeDetailPath(dispute.id)}>
                    Open dispute
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <DealTimeline events={deal.events ?? []} />
      </div>
    </div>
  )
}
