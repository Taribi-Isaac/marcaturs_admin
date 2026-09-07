import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { fetchAdminDispute } from '@/features/disputes/api'
import { DISPUTE_QUERY_KEYS } from '@/features/disputes/constants'
import {
  formatDisputeTimestamp,
  formatPartyLabel,
  formatPartyRole,
} from '@/features/disputes/format'
import { DisputeActions } from '@/features/disputes/components/DisputeActions'
import { DisputeDealContextPanel } from '@/features/disputes/components/DisputeDealContextPanel'
import { DisputeEvidencePanel } from '@/features/disputes/components/DisputeEvidencePanel'
import { DisputeTimeline } from '@/features/disputes/components/DisputeTimeline'
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  Notice,
  NotFoundState,
  PageHeader,
  StatusBadge,
} from '@/shared/ui'

export function DisputeDetailPage() {
  const { id } = useParams()
  const disputeId = Number(id)

  const detailQuery = useQuery({
    queryKey: DISPUTE_QUERY_KEYS.detail(disputeId),
    queryFn: ({ signal }) => fetchAdminDispute(disputeId, signal),
    enabled: Number.isFinite(disputeId) && disputeId > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (!Number.isFinite(disputeId) || disputeId <= 0) {
    return (
      <NotFoundState
        title="Dispute not found"
        description="The dispute identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to="/disputes">
            Back to queue
          </Link>
        }
      />
    )
  }

  if (detailQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Dispute"
          breadcrumbs={[{ label: 'Disputes', to: '/disputes' }, { label: 'Detail' }]}
        />
        <LoadingState label="Loading dispute" rows={6} />
      </>
    )
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Dispute not found"
        description="This dispute does not exist or is no longer available."
        action={
          <Link className="ui-button ui-button--secondary" to="/disputes">
            Back to queue
          </Link>
        }
      />
    )
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <ErrorState
        title="Unable to load dispute"
        description={
          detailQuery.error instanceof ApiClientError
            ? detailQuery.error.message
            : 'The dispute could not be loaded.'
        }
        onRetry={() => {
          void detailQuery.refetch()
        }}
      />
    )
  }

  const dispute = detailQuery.data

  return (
    <div className="dispute-page">
      <PageHeader
        title={dispute.reference}
        description={`${dispute.category?.name ?? 'Uncategorized'} · Deal #${dispute.deal_id}`}
        breadcrumbs={[{ label: 'Disputes', to: '/disputes' }, { label: dispute.reference }]}
        actions={
          <div className="dispute-actions">
            <StatusBadge domain="dispute" status={dispute.status} />
            <Link className="ui-button ui-button--secondary" to="/disputes">
              Back to queue
            </Link>
          </div>
        }
      />

      <Notice tone="info" title="Operational case boundary">
        A Dispute is a separate investigation case. Resolving or closing it does not cancel the
        Deal, reverse commission, issue refunds, or freeze settlement.
      </Notice>

      <div className="dispute-detail-grid">
        <section className="dispute-panel">
          <h2>Dispute overview</h2>
          <dl className="dispute-dl">
            <div>
              <dt>Reference</dt>
              <dd>{dispute.reference}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge domain="dispute" status={dispute.status} />
              </dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{dispute.category?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Deal</dt>
              <dd>#{dispute.deal_id}</dd>
            </div>
            <div>
              <dt>Reporter</dt>
              <dd>
                {formatPartyLabel(
                  dispute.deal?.ambassador?.role === dispute.reporter?.role
                    ? (dispute.deal?.ambassador ?? null)
                    : dispute.deal?.business?.role === dispute.reporter?.role
                      ? (dispute.deal?.business ?? null)
                      : dispute.reporter,
                )}{' '}
                ({formatPartyRole(dispute.reporter?.role)})
              </dd>
            </div>
            <div>
              <dt>Accused</dt>
              <dd>
                {formatPartyLabel(
                  dispute.deal?.business?.role === dispute.accused?.role
                    ? (dispute.deal?.business ?? null)
                    : dispute.deal?.ambassador?.role === dispute.accused?.role
                      ? (dispute.deal?.ambassador ?? null)
                      : dispute.accused,
                )}{' '}
                ({formatPartyRole(dispute.accused?.role)})
              </dd>
            </div>
            <div>
              <dt>Opened</dt>
              <dd>{formatDisputeTimestamp(dispute.created_at)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDisputeTimestamp(dispute.updated_at)}</dd>
            </div>
            <div>
              <dt>Resolved</dt>
              <dd>{formatDisputeTimestamp(dispute.resolved_at)}</dd>
            </div>
            <div>
              <dt>Closed</dt>
              <dd>{formatDisputeTimestamp(dispute.closed_at)}</dd>
            </div>
            <div className="dispute-dl__full">
              <dt>Description</dt>
              <dd>{dispute.description || '—'}</dd>
            </div>
            {dispute.decision_notes ? (
              <div className="dispute-dl__full">
                <dt>Decision notes</dt>
                <dd>{dispute.decision_notes}</dd>
              </div>
            ) : null}
            {dispute.action_notes ? (
              <div className="dispute-dl__full">
                <dt>Administrative action notes</dt>
                <dd>{dispute.action_notes}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <DisputeDealContextPanel deal={dispute.deal} commission={dispute.commission} />
      </div>

      <DisputeActions disputeId={dispute.id} status={dispute.status} />

      <DisputeEvidencePanel disputeId={dispute.id} attachments={dispute.attachments ?? []} />

      <DisputeTimeline events={dispute.events ?? []} />
    </div>
  )
}
