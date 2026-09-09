import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import {
  fetchAdminCampaign,
  fetchCampaignExtensionHistory,
  fetchCampaignFeaturedHistory,
  fetchCampaignResources,
} from '@/features/campaigns/api'
import { CAMPAIGN_QUERY_KEYS } from '@/features/campaigns/constants'
import { formatCampaignTimestamp } from '@/features/campaigns/format'
import { CampaignActions } from '@/features/campaigns/components/CampaignActions'
import { CampaignCommercialTermsPanel } from '@/features/campaigns/components/CampaignCommercialTermsPanel'
import { CampaignExtensionsPanel } from '@/features/campaigns/components/CampaignExtensionsPanel'
import { CampaignFeaturedPanel } from '@/features/campaigns/components/CampaignFeaturedPanel'
import { CampaignResourcesPanel } from '@/features/campaigns/components/CampaignResourcesPanel'
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
  PageHeader,
  StatusBadge,
} from '@/shared/ui'

export function CampaignDetailPage() {
  const { id } = useParams()
  const campaignId = Number(id)

  const detailQuery = useQuery({
    queryKey: CAMPAIGN_QUERY_KEYS.detail(campaignId),
    queryFn: ({ signal }) => fetchAdminCampaign(campaignId, signal),
    enabled: Number.isFinite(campaignId) && campaignId > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const resourcesQuery = useQuery({
    queryKey: CAMPAIGN_QUERY_KEYS.resources(campaignId),
    queryFn: ({ signal }) => fetchCampaignResources(campaignId, signal),
    enabled: Number.isFinite(campaignId) && campaignId > 0 && detailQuery.isSuccess,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const featuredQuery = useQuery({
    queryKey: CAMPAIGN_QUERY_KEYS.featured(campaignId),
    queryFn: ({ signal }) => fetchCampaignFeaturedHistory(campaignId, signal),
    enabled: Number.isFinite(campaignId) && campaignId > 0 && detailQuery.isSuccess,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const extensionsQuery = useQuery({
    queryKey: CAMPAIGN_QUERY_KEYS.extensions(campaignId),
    queryFn: ({ signal }) => fetchCampaignExtensionHistory(campaignId, signal),
    enabled: Number.isFinite(campaignId) && campaignId > 0 && detailQuery.isSuccess,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (!Number.isFinite(campaignId) || campaignId <= 0) {
    return (
      <NotFoundState
        title="Campaign not found"
        description="The campaign identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to="/campaigns">
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
          title="Campaign"
          breadcrumbs={[{ label: 'Campaigns', to: '/campaigns' }, { label: 'Detail' }]}
        />
        <LoadingState label="Loading campaign" rows={6} />
      </>
    )
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Campaign not found"
        description="This campaign does not exist or is no longer available."
        action={
          <Link className="ui-button ui-button--secondary" to="/campaigns">
            Back to queue
          </Link>
        }
      />
    )
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <ErrorState
        title="Unable to load campaign"
        description={
          detailQuery.error instanceof ApiClientError
            ? detailQuery.error.message
            : 'The campaign could not be loaded.'
        }
        onRetry={() => {
          void detailQuery.refetch()
        }}
      />
    )
  }

  const campaign = detailQuery.data
  const activeFeatured = (featuredQuery.data ?? []).some((item) => item.is_active)

  return (
    <div className="campaign-page">
      <PageHeader
        title={campaign.title}
        description={`${campaign.user?.name ?? 'Business'} · ${campaign.category?.name ?? 'Uncategorized'}`}
        breadcrumbs={[
          { label: 'Campaigns', to: '/campaigns' },
          { label: `Campaign #${campaign.id}` },
        ]}
        actions={
          <div className="campaign-actions">
            <StatusBadge domain="campaign" status={campaign.status} />
            <Link className="ui-button ui-button--secondary" to="/campaigns">
              Back to queue
            </Link>
          </div>
        }
      />

      <div className="campaign-detail-grid">
        <section className="campaign-panel">
          <h2>Campaign overview</h2>
          <dl className="campaign-dl">
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge domain="campaign" status={campaign.status} />
              </dd>
            </div>
            <div>
              <dt>Featured now</dt>
              <dd>{featuredQuery.isLoading ? '…' : activeFeatured ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt>Business</dt>
              <dd>
                <div className="campaign-stack">
                  <span>{campaign.user?.name ?? '—'}</span>
                  <span className="campaign-muted">{campaign.user?.email ?? '—'}</span>
                </div>
              </dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{campaign.category?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatCampaignTimestamp(campaign.submitted_at)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatCampaignTimestamp(campaign.updated_at)}</dd>
            </div>
            {campaign.review_reason ? (
              <div className="campaign-dl__full">
                <dt>Review reason</dt>
                <dd>{campaign.review_reason}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="campaign-panel">
          <h2>Lifecycle timestamps</h2>
          <dl className="campaign-dl">
            <div>
              <dt>Approved</dt>
              <dd>{formatCampaignTimestamp(campaign.approved_at)}</dd>
            </div>
            <div>
              <dt>Activated</dt>
              <dd>{formatCampaignTimestamp(campaign.activated_at)}</dd>
            </div>
            <div>
              <dt>Listing starts</dt>
              <dd>{formatCampaignTimestamp(campaign.listing_starts_at)}</dd>
            </div>
            <div>
              <dt>Listing expires</dt>
              <dd>{formatCampaignTimestamp(campaign.listing_expires_at)}</dd>
            </div>
            <div>
              <dt>Suspended</dt>
              <dd>{formatCampaignTimestamp(campaign.suspended_at)}</dd>
            </div>
            <div>
              <dt>Expired</dt>
              <dd>{formatCampaignTimestamp(campaign.expired_at)}</dd>
            </div>
            <div>
              <dt>Deactivated</dt>
              <dd>{formatCampaignTimestamp(campaign.deactivated_at)}</dd>
            </div>
            <div>
              <dt>Closed</dt>
              <dd>{formatCampaignTimestamp(campaign.closed_at)}</dd>
            </div>
          </dl>
        </section>

        <CampaignCommercialTermsPanel version={campaign.current_version} />
      </div>

      <CampaignActions campaignId={campaign.id} status={campaign.status} />

      <CampaignResourcesPanel
        campaignId={campaign.id}
        resources={resourcesQuery.data ?? []}
        isLoading={resourcesQuery.isLoading}
        error={resourcesQuery.error}
        onRetry={() => {
          void resourcesQuery.refetch()
        }}
      />

      <CampaignFeaturedPanel
        purchases={featuredQuery.data ?? []}
        isLoading={featuredQuery.isLoading}
        error={featuredQuery.error}
        onRetry={() => {
          void featuredQuery.refetch()
        }}
      />

      <CampaignExtensionsPanel
        extensions={extensionsQuery.data ?? []}
        isLoading={extensionsQuery.isLoading}
        error={extensionsQuery.error}
        onRetry={() => {
          void extensionsQuery.refetch()
        }}
      />

      <section className="campaign-panel">
        <h2>Platform payment boundary</h2>
        <p className="campaign-muted">
          Payment rows above are MarcatursHub platform payments for Campaign Featured and Campaign
          Extension only. Customer→Business payments and Business→Ambassador commission settlements
          are out of scope for this console.
        </p>
      </section>
    </div>
  )
}
