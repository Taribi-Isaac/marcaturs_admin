import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ApiClientError } from '@/shared/api'
import { fetchAdminCampaigns } from '@/features/campaigns/api'
import { CAMPAIGN_QUERY_KEYS } from '@/features/campaigns/constants'
import { CampaignFilters } from '@/features/campaigns/components/CampaignFilters'
import { CampaignTable } from '@/features/campaigns/components/CampaignTable'
import type { CampaignStatus } from '@/shared/types/domain'
import { ErrorState, ForbiddenState, PageHeader } from '@/shared/ui'

export function CampaignsPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const statusParam = searchParams.get('status') ?? 'submitted'
  const status = statusParam === 'all' ? '' : (statusParam as CampaignStatus | '')
  const page = Number(searchParams.get('page') ?? '1') || 1

  const query = useQuery({
    queryKey: CAMPAIGN_QUERY_KEYS.list({ status: status || 'all', page }),
    queryFn: ({ signal }) =>
      fetchAdminCampaigns(
        {
          status: status || undefined,
          page,
        },
        signal,
      ),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: CAMPAIGN_QUERY_KEYS.all })
      await query.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const forbidden = query.error instanceof ApiClientError && query.error.status === 403

  return (
    <div className="campaign-page">
      <PageHeader
        title="Campaigns"
        description="Moderate campaign lifecycle states and inspect related commercial entitlements."
        breadcrumbs={[{ label: 'Campaigns' }]}
      />

      <CampaignFilters
        onRefresh={() => {
          void handleRefresh()
        }}
        isRefreshing={isRefreshing || query.isFetching}
      />

      {forbidden ? (
        <ForbiddenState />
      ) : query.error ? (
        <ErrorState
          title="Unable to load campaigns"
          description={
            query.error instanceof ApiClientError
              ? query.error.message
              : 'The campaign queue could not be loaded.'
          }
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : (
        <CampaignTable
          rows={query.data?.items ?? []}
          isLoading={query.isLoading}
          pagination={query.data?.pagination}
        />
      )}
    </div>
  )
}
