import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ApiClientError } from '@/shared/api'
import { fetchAdminDeals } from '@/features/deals/api'
import {
  DEFAULT_DEALS_PER_PAGE,
  DEAL_QUERY_KEYS,
  MAX_DEALS_PER_PAGE,
} from '@/features/deals/constants'
import { DealFilters } from '@/features/deals/components/DealFilters'
import { DealTable } from '@/features/deals/components/DealTable'
import type { CommissionStatus, DealStatus } from '@/shared/types/domain'
import { commissionStatuses, dealStatuses } from '@/shared/types/domain'
import { ErrorState, ForbiddenState, PageHeader } from '@/shared/ui'

function parseDealStatus(value: string | null): DealStatus | undefined {
  if (value && (dealStatuses as readonly string[]).includes(value)) {
    return value as DealStatus
  }
  return undefined
}

function parseCommissionStatus(value: string | null): CommissionStatus | undefined {
  if (value && (commissionStatuses as readonly string[]).includes(value)) {
    return value as CommissionStatus
  }
  return undefined
}

export function DealsPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const status = parseDealStatus(searchParams.get('status'))
  const q = searchParams.get('q')?.trim() || undefined
  const openDispute = searchParams.get('open_dispute') === '1'
  const commissionOverdue = searchParams.get('commission_overdue') === '1'
  const commissionStatus = parseCommissionStatus(searchParams.get('commission_status'))
  const page = Number(searchParams.get('page') ?? '1') || 1
  const perPageRaw =
    Number(searchParams.get('per_page') ?? DEFAULT_DEALS_PER_PAGE) || DEFAULT_DEALS_PER_PAGE
  const perPage = Math.min(Math.max(1, perPageRaw), MAX_DEALS_PER_PAGE)

  const query = useQuery({
    queryKey: DEAL_QUERY_KEYS.list({
      status: status ?? 'all',
      q: q ?? '',
      open_dispute: openDispute ? '1' : 'all',
      commission_overdue: commissionOverdue ? '1' : 'all',
      commission_status: commissionStatus ?? 'all',
      page,
      per_page: perPage,
    }),
    queryFn: ({ signal }) =>
      fetchAdminDeals(
        {
          status,
          q,
          open_dispute: openDispute || undefined,
          commission_overdue: commissionOverdue || undefined,
          commission_status: commissionStatus,
          page,
          per_page: perPage,
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
      await queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
      await query.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const forbidden = query.error instanceof ApiClientError && query.error.status === 403

  return (
    <div className="deals-page">
      <PageHeader
        title="Deals"
        description="Read-only investigation desk for Deal lifecycle, evidence, commission liability, and disputes. Admin cannot confirm, cancel, settle, or edit Deals here."
        breadcrumbs={[{ label: 'Deals' }]}
      />

      <DealFilters
        onRefresh={() => {
          void handleRefresh()
        }}
        isRefreshing={isRefreshing || query.isFetching}
      />

      {forbidden ? (
        <ForbiddenState />
      ) : query.error ? (
        <ErrorState
          title="Unable to load Deals"
          description={
            query.error instanceof ApiClientError
              ? query.error.message
              : 'The Deal list could not be loaded.'
          }
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : (
        <DealTable
          rows={query.data?.items ?? []}
          isLoading={query.isLoading}
          pagination={query.data?.pagination}
          onResetFilters={() => setSearchParams({})}
        />
      )}
    </div>
  )
}
