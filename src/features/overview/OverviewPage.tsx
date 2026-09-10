import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ApiClientError } from '@/shared/api'
import { formatAmountMinor } from '@/shared/lib/money'
import { Button, ErrorState, ForbiddenState, LoadingState, PageHeader } from '@/shared/ui'
import { fetchAdminOverview } from './api'
import {
  LIVE_CAMPAIGN_STATUSES,
  OVERVIEW_DESTINATIONS,
  OVERVIEW_QUERY_KEYS,
  OVERVIEW_QUERY_OPTIONS,
} from './constants'
import {
  formatCampaignStatusLabel,
  formatDisputeStatusLabel,
  formatGeneratedAt,
  orderedCampaignStatuses,
} from './format'
import type {
  AdminOverview,
  AdminOverviewAttention,
  PlatformPaymentCurrencyBucket,
  PlatformPaymentWindow,
} from './types'

type AttentionItemConfig = {
  key: keyof AdminOverviewAttention
  count: number
  title: string
  zeroTitle: string
  description: string
  actionLabel: string
  to: string
}

function attentionItems(attention: AdminOverviewAttention): AttentionItemConfig[] {
  return [
    {
      key: 'verification_submissions_awaiting_review',
      count: attention.verification_submissions_awaiting_review,
      title: 'Verification awaiting review',
      zeroTitle: 'No verification awaiting review',
      description: 'Participant submissions currently pending or under review.',
      actionLabel: 'Review verification →',
      to: OVERVIEW_DESTINATIONS.verificationPending,
    },
    {
      key: 'campaigns_awaiting_review',
      count: attention.campaigns_awaiting_review,
      title: 'Campaigns awaiting review',
      zeroTitle: 'No campaigns awaiting review',
      description: 'Submitted campaigns waiting for Admin moderation.',
      actionLabel: 'Review campaigns →',
      to: OVERVIEW_DESTINATIONS.campaignsSubmitted,
    },
    {
      key: 'open_disputes',
      count: attention.open_disputes,
      title: 'Open disputes',
      zeroTitle: 'No open disputes',
      description: 'Dispute cases in open investigation statuses (independent of Deal lifecycle).',
      actionLabel: 'Open disputes →',
      to: OVERVIEW_DESTINATIONS.disputes,
    },
    {
      key: 'commissions_overdue',
      count: attention.commissions_overdue,
      title: 'Overdue commissions',
      zeroTitle: 'No overdue commissions',
      description:
        'Businesses currently have outstanding ambassador obligations past their due date.',
      actionLabel: 'Review commissions →',
      to: OVERVIEW_DESTINATIONS.dealsCommissionOverdue,
    },
    {
      key: 'deals_payment_pending',
      count: attention.deals_payment_pending,
      title: 'Payment-pending Deals',
      zeroTitle: 'No payment-pending Deals',
      description: 'Deals waiting for customer payment confirmation before sealing.',
      actionLabel: 'Review Deals →',
      to: OVERVIEW_DESTINATIONS.dealsPaymentPending,
    },
    {
      key: 'reported_conversations',
      count: attention.reported_conversations,
      title: 'Reported conversations',
      zeroTitle: 'No reported conversations',
      description: 'Business↔Ambassador conversations flagged for Admin inspection.',
      actionLabel: 'Open moderation →',
      to: OVERVIEW_DESTINATIONS.moderation,
    },
  ]
}

function MetricLink({
  to,
  value,
  label,
  context,
  tone = 'default',
}: {
  to?: string
  value: number | string
  label: string
  context?: string
  tone?: 'default' | 'live' | 'quiet' | 'emphasis'
}) {
  const content = (
    <>
      <span className="overview-metric__value">{value}</span>
      <span className="overview-metric__label">{label}</span>
      {context ? <span className="overview-metric__context">{context}</span> : null}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={`overview-metric overview-metric--link overview-metric--${tone}`}
        aria-label={`${label}: ${value}`}
      >
        {content}
      </Link>
    )
  }

  return (
    <div className={`overview-metric overview-metric--${tone}`} aria-label={`${label}: ${value}`}>
      {content}
    </div>
  )
}

function Panel({
  title,
  description,
  children,
  actions,
}: {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <section
      className="overview-panel"
      aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-heading`}
    >
      <header className="overview-panel__header">
        <div>
          <h2
            id={`${title.replace(/\s+/g, '-').toLowerCase()}-heading`}
            className="overview-panel__title"
          >
            {title}
          </h2>
          {description ? <p className="overview-panel__description">{description}</p> : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  )
}

function PlatformPaymentWindowBlock({
  label,
  window,
}: {
  label: string
  window: PlatformPaymentWindow
}) {
  if (window.by_currency.length === 0) {
    return (
      <div className="overview-payment-window">
        <h3 className="overview-payment-window__title">{label}</h3>
        <p className="overview-quiet">No successful platform payments in this window.</p>
      </div>
    )
  }

  return (
    <div className="overview-payment-window">
      <h3 className="overview-payment-window__title">{label}</h3>
      <div className="overview-payment-window__currencies">
        {window.by_currency.map((bucket) => (
          <CurrencyPaymentCard key={`${label}-${bucket.currency}`} bucket={bucket} />
        ))}
      </div>
    </div>
  )
}

function CurrencyPaymentCard({ bucket }: { bucket: PlatformPaymentCurrencyBucket }) {
  return (
    <div className="overview-payment-card">
      <div className="overview-payment-card__total">
        <span className="overview-metric__value">
          {formatAmountMinor(bucket.successful_amount_minor, bucket.currency)}
        </span>
        <span className="overview-metric__label">
          {bucket.successful_payment_count} successful payment
          {bucket.successful_payment_count === 1 ? '' : 's'} ({bucket.currency})
        </span>
      </div>
      <dl className="overview-payment-card__purposes">
        <div>
          <dt>Campaign Extensions</dt>
          <dd>
            {bucket.by_purpose.campaign_extension.successful_payment_count} ·{' '}
            {formatAmountMinor(
              bucket.by_purpose.campaign_extension.successful_amount_minor,
              bucket.currency,
            )}
          </dd>
        </div>
        <div>
          <dt>Featured Campaigns</dt>
          <dd>
            {bucket.by_purpose.campaign_featured.successful_payment_count} ·{' '}
            {formatAmountMinor(
              bucket.by_purpose.campaign_featured.successful_amount_minor,
              bucket.currency,
            )}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function OverviewDashboard({ data }: { data: AdminOverview }) {
  const attention = attentionItems(data.attention)
  const campaignStatuses = orderedCampaignStatuses(data.campaigns.by_status)
  const disputeStatuses = Object.entries(data.disputes.by_status).sort(([a], [b]) =>
    a.localeCompare(b),
  )

  return (
    <div className="overview-dashboard">
      <section className="overview-status" aria-labelledby="overview-status-heading">
        <h2 id="overview-status-heading" className="sr-only">
          Platform snapshot
        </h2>
        <p className="overview-status__lead">
          Operational snapshot of MarcatursHub participants, marketplace activity, and exceptions
          requiring Admin action.
        </p>
        <p className="overview-status__meta">
          Generated {formatGeneratedAt(data.generated_at, data.timezone)}
        </p>
      </section>

      <Panel
        title="Priority attention"
        description="Authoritative exception counts from the overview API. Open the matching desk to act."
        actions={
          <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.attention}>
            Open Attention queues →
          </Link>
        }
      >
        <ul className="overview-attention-grid">
          {attention.map((item) => {
            const active = item.count > 0
            return (
              <li
                key={item.key}
                className={
                  active
                    ? 'overview-attention-card'
                    : 'overview-attention-card overview-attention-card--quiet'
                }
              >
                {active ? (
                  <>
                    <p className="overview-attention-card__count" aria-hidden="true">
                      {item.count}
                    </p>
                    <h3 className="overview-attention-card__title">{item.title}</h3>
                    <p className="overview-attention-card__description">{item.description}</p>
                    <Link className="overview-action-link" to={item.to}>
                      {item.actionLabel}
                    </Link>
                    <span className="sr-only">
                      {item.count} {item.title}. {item.description}
                    </span>
                  </>
                ) : (
                  <>
                    <h3 className="overview-attention-card__title">{item.zeroTitle}</h3>
                    <p className="overview-attention-card__description">{item.description}</p>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      </Panel>

      <Panel
        title="Participants"
        description="Business and Ambassador accounts only. ADMIN accounts are excluded."
      >
        <div className="overview-metric-grid">
          <MetricLink
            to={OVERVIEW_DESTINATIONS.usersBusiness}
            value={data.users.business_registered}
            label="Businesses registered"
            context={`${data.users.business_active} active · ${data.users.business_verified} verified`}
          />
          <MetricLink
            to={OVERVIEW_DESTINATIONS.usersAmbassador}
            value={data.users.ambassador_registered}
            label="Ambassadors registered"
            context={`${data.users.ambassador_active} active · ${data.users.ambassador_verified} verified`}
          />
          <MetricLink
            to={OVERVIEW_DESTINATIONS.usersRestricted}
            value={data.users.restricted}
            label="Restricted"
            tone={data.users.restricted > 0 ? 'emphasis' : 'quiet'}
          />
          <MetricLink
            to={OVERVIEW_DESTINATIONS.usersSuspended}
            value={data.users.suspended}
            label="Suspended"
            tone={data.users.suspended > 0 ? 'emphasis' : 'quiet'}
          />
          <MetricLink
            to={OVERVIEW_DESTINATIONS.usersBanned}
            value={data.users.banned}
            label="Banned"
            tone={data.users.banned > 0 ? 'emphasis' : 'quiet'}
          />
        </div>
      </Panel>

      <Panel
        title="Campaigns"
        description="Lifecycle inventory. Active and Expiring are live marketplace states; other statuses are not."
        actions={
          data.campaigns.awaiting_admin_review > 0 ? (
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.campaignsSubmitted}>
              Review submitted ({data.campaigns.awaiting_admin_review}) →
            </Link>
          ) : null
        }
      >
        <div className="overview-metric-grid overview-metric-grid--campaigns">
          {campaignStatuses.map(({ status, count }) => (
            <MetricLink
              key={status}
              to={
                status === 'submitted'
                  ? OVERVIEW_DESTINATIONS.campaignsSubmitted
                  : status === 'active'
                    ? OVERVIEW_DESTINATIONS.campaignsActive
                    : '/campaigns?status=all'
              }
              value={count}
              label={formatCampaignStatusLabel(status)}
              tone={LIVE_CAMPAIGN_STATUSES.has(status) ? 'live' : count === 0 ? 'quiet' : 'default'}
            />
          ))}
          <MetricLink
            to="/campaigns?status=all"
            value={data.campaigns.featured_flagged}
            label="Featured flagged"
            context="Campaigns with is_featured=true"
          />
        </div>
      </Panel>

      <div className="overview-split">
        <Panel title="Deals" description="Commercial Deal activity. Deal is not a lead.">
          <div className="overview-metric-grid">
            <MetricLink
              to={OVERVIEW_DESTINATIONS.deals}
              value={data.deals.total}
              label="Total Deals"
            />
            <MetricLink
              to={OVERVIEW_DESTINATIONS.dealsPaymentPending}
              value={data.deals.payment_pending}
              label="Payment pending"
              tone={data.deals.payment_pending > 0 ? 'emphasis' : 'quiet'}
            />
            <MetricLink to="/deals?status=sealed" value={data.deals.sealed} label="Sealed" />
            <MetricLink
              to="/deals?status=completed"
              value={data.deals.completed}
              label="Completed"
            />
            <MetricLink
              to="/deals?status=cancelled"
              value={data.deals.cancelled}
              label="Cancelled"
            />
            <MetricLink
              to={OVERVIEW_DESTINATIONS.deals}
              value={data.deals.payment_confirmed}
              label="Payment confirmed"
              context="Sealed + completed (API definition)"
            />
          </div>
        </Panel>

        <Panel
          title="Ambassador commission obligations"
          description="Business → Ambassador obligations. Not platform revenue and not Platform Payment Volume."
        >
          <p className="overview-boundary" role="note">
            Boundary: {data.commissions.boundary.replaceAll('_', ' ')}
          </p>
          <div className="overview-metric-grid">
            <MetricLink
              to="/deals?commission_status=due"
              value={data.commissions.due}
              label="Due"
              tone={data.commissions.due > 0 ? 'emphasis' : 'quiet'}
            />
            <MetricLink
              to={OVERVIEW_DESTINATIONS.dealsCommissionOverdue}
              value={data.commissions.overdue}
              label="Overdue"
              context={
                data.commissions.overdue > 0
                  ? `${data.commissions.overdue} commissions overdue`
                  : 'No overdue commissions'
              }
              tone={data.commissions.overdue > 0 ? 'emphasis' : 'quiet'}
            />
            <MetricLink
              to="/deals?commission_status=paid"
              value={data.commissions.paid}
              label="Paid"
            />
            <MetricLink
              to="/deals?commission_status=received"
              value={data.commissions.received}
              label="Received"
            />
          </div>
        </Panel>
      </div>

      <div className="overview-split">
        <Panel
          title="Disputes"
          description="Open disputes are case-status signals, not Deal disputed flags."
          actions={
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.disputes}>
              Open disputes desk →
            </Link>
          }
        >
          <div className="overview-metric-grid">
            <MetricLink
              to={OVERVIEW_DESTINATIONS.disputes}
              value={data.disputes.open}
              label="Open disputes"
              tone={data.disputes.open > 0 ? 'emphasis' : 'quiet'}
              context={data.disputes.open === 0 ? 'No open disputes' : undefined}
            />
            {disputeStatuses.map(([status, count]) => (
              <MetricLink
                key={status}
                to={OVERVIEW_DESTINATIONS.disputes}
                value={count}
                label={formatDisputeStatusLabel(status)}
                tone={count === 0 ? 'quiet' : 'default'}
              />
            ))}
          </div>
        </Panel>

        <Panel
          title="Verification"
          description="Submission queue metrics aligned with the Verification desk."
          actions={
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.verification}>
              Open verification →
            </Link>
          }
        >
          <div className="overview-metric-grid">
            <MetricLink
              to={OVERVIEW_DESTINATIONS.verificationPending}
              value={data.verification.submissions_awaiting_review}
              label="Awaiting review"
              tone={data.verification.submissions_awaiting_review > 0 ? 'emphasis' : 'quiet'}
            />
            <MetricLink
              to="/verification?status=more_information_required"
              value={data.verification.submissions_more_information_required}
              label="More information required"
            />
            <MetricLink
              to="/verification?status=approved"
              value={data.verification.submissions_approved}
              label="Approved"
            />
            <MetricLink
              to="/verification?status=rejected"
              value={data.verification.submissions_rejected}
              label="Rejected"
            />
          </div>
        </Panel>
      </div>

      <Panel
        title="Platform Payment Volume"
        description="Successful Business → MarcatursHub payments for Campaign Extensions and Featured Campaigns only (status=paid). Distinct from ambassador commission obligations."
      >
        <p className="overview-boundary" role="note">
          Terminology: {data.platform_payments.terminology.replaceAll('_', ' ')}. Boundary:{' '}
          {data.platform_payments.boundary.replaceAll('_', ' ')}. Success:{' '}
          {data.platform_payments.success_definition}.
        </p>
        <div className="overview-payment-windows">
          <PlatformPaymentWindowBlock label="Today" window={data.platform_payments.today} />
          <PlatformPaymentWindowBlock
            label="This month"
            window={data.platform_payments.this_month}
          />
          <PlatformPaymentWindowBlock label="All time" window={data.platform_payments.all_time} />
        </div>
      </Panel>

      <Panel
        title="Quick actions"
        description="Jump to operational desks without inventing new workflows."
      >
        <ul className="overview-quick-actions">
          <li>
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.attention}>
              Attention queues →
            </Link>
          </li>
          <li>
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.verificationPending}>
              Verification review →
            </Link>
          </li>
          <li>
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.campaignsSubmitted}>
              Campaign moderation →
            </Link>
          </li>
          <li>
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.deals}>
              Deals & commissions →
            </Link>
          </li>
          <li>
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.disputes}>
              Disputes →
            </Link>
          </li>
          <li>
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.users}>
              Participants →
            </Link>
          </li>
          <li>
            <Link className="overview-action-link" to={OVERVIEW_DESTINATIONS.moderation}>
              Reported conversations →
            </Link>
          </li>
        </ul>
      </Panel>
    </div>
  )
}

export function OverviewPage() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const query = useQuery({
    queryKey: OVERVIEW_QUERY_KEYS.detail(),
    queryFn: ({ signal }) => fetchAdminOverview(signal),
    ...OVERVIEW_QUERY_OPTIONS,
  })

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: OVERVIEW_QUERY_KEYS.all })
      await query.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const forbidden = query.error instanceof ApiClientError && query.error.status === 403

  function errorDescription(): string {
    if (!(query.error instanceof ApiClientError)) {
      return 'The overview could not be loaded. Try again.'
    }
    if (query.error.status === 401) {
      return 'Your session is no longer valid. Sign in again to load the overview.'
    }
    if (query.error.status === 429) {
      return 'Too many requests. Wait briefly, then retry the overview.'
    }
    if (query.error.status >= 500) {
      return 'The overview service is temporarily unavailable. Try again shortly.'
    }
    if (query.error.code === 'network_error') {
      return 'Unable to reach the MarcatursHub API. Check connectivity and retry.'
    }
    return query.error.message || 'The overview could not be loaded. Try again.'
  }

  return (
    <div className="overview-page">
      <PageHeader
        title="Overview"
        description="Operational command centre for MarcatursHub Admin. Metrics come from GET /api/v1/admin/overview only."
        breadcrumbs={[{ label: 'Overview' }]}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              void handleRefresh()
            }}
            disabled={isRefreshing || query.isFetching}
          >
            {isRefreshing || query.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      {forbidden ? (
        <ForbiddenState description="Admin authorization is required to view the operational overview." />
      ) : query.error ? (
        <ErrorState
          title="Unable to load overview"
          description={errorDescription()}
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : query.isLoading || !query.data ? (
        <LoadingState label="Loading operational overview" rows={8} />
      ) : (
        <OverviewDashboard data={query.data} />
      )}
    </div>
  )
}
