import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ApiClientError } from '@/shared/api'
import { fetchAdminDisputes } from '@/features/disputes/api'
import {
  DISPUTE_QUERY_KEYS,
  isActionableDisputeStatus,
  isHistoricalDisputeStatus,
} from '@/features/disputes/constants'
import { DisputeFilters } from '@/features/disputes/components/DisputeFilters'
import { DisputeTable } from '@/features/disputes/components/DisputeTable'
import type { DisputeQueueView } from '@/features/disputes/types'
import { ErrorState, ForbiddenState, Notice, PageHeader } from '@/shared/ui'

export function DisputesPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const view = (searchParams.get('view') as DisputeQueueView | null) ?? 'actionable'
  const page = Number(searchParams.get('page') ?? '1') || 1

  const query = useQuery({
    queryKey: DISPUTE_QUERY_KEYS.list({ page, view }),
    queryFn: ({ signal }) => fetchAdminDisputes({ page }, signal),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const rows = useMemo(() => {
    const items = [...(query.data?.items ?? [])]
    items.sort((a, b) => {
      const aActionable = isActionableDisputeStatus(a.status) ? 0 : 1
      const bActionable = isActionableDisputeStatus(b.status) ? 0 : 1
      if (aActionable !== bActionable) {
        return aActionable - bActionable
      }
      const aTime = Date.parse(a.updated_at ?? a.created_at ?? '') || 0
      const bTime = Date.parse(b.updated_at ?? b.created_at ?? '') || 0
      return bTime - aTime
    })

    if (view === 'actionable') {
      return items.filter((item) => isActionableDisputeStatus(item.status))
    }
    if (view === 'historical') {
      return items.filter((item) => isHistoricalDisputeStatus(item.status))
    }
    return items
  }, [query.data?.items, view])

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: DISPUTE_QUERY_KEYS.all })
      await query.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const forbidden = query.error instanceof ApiClientError && query.error.status === 403

  return (
    <div className="dispute-page">
      <PageHeader
        title="Disputes"
        description="Investigate and resolve dispute cases without mutating Deal or commission finances."
        breadcrumbs={[{ label: 'Disputes' }]}
      />

      <Notice tone="info" title="List API has no status filter">
        The Admin disputes endpoint returns paginated cases without a status query. Queue views
        filter the current page only and are not a complete-dataset filter.
      </Notice>

      <DisputeFilters
        onRefresh={() => {
          void handleRefresh()
        }}
        isRefreshing={isRefreshing || query.isFetching}
      />

      {forbidden ? (
        <ForbiddenState />
      ) : query.error ? (
        <ErrorState
          title="Unable to load disputes"
          description={
            query.error instanceof ApiClientError
              ? query.error.message
              : 'The dispute queue could not be loaded.'
          }
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : (
        <DisputeTable rows={rows} isLoading={query.isLoading} pagination={query.data?.pagination} />
      )}
    </div>
  )
}
