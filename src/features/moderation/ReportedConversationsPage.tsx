import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ApiClientError } from '@/shared/api'
import { fetchReportedConversations } from '@/features/moderation/api'
import { MODERATION_QUERY_KEYS } from '@/features/moderation/constants'
import { ReportedConversationTable } from '@/features/moderation/components/ReportedConversationTable'
import { Button, ErrorState, FilterBar, ForbiddenState, Notice, PageHeader } from '@/shared/ui'

export function ReportedConversationsPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const page = Number(searchParams.get('page') ?? '1') || 1

  const query = useQuery({
    queryKey: MODERATION_QUERY_KEYS.list({ page }),
    queryFn: ({ signal }) => fetchReportedConversations({ page }, signal),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: MODERATION_QUERY_KEYS.conversations })
      await query.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const forbidden = query.error instanceof ApiClientError && query.error.status === 403

  return (
    <div className="moderation-page">
      <PageHeader
        title="Reported conversations"
        description="Inspect Business ↔ Ambassador conversations that participants have reported. Admin is not a chat participant and cannot send messages."
        breadcrumbs={[{ label: 'Moderation' }, { label: 'Reported conversations' }]}
      />

      <Notice tone="info" title="Read-only moderation">
        The Admin API supports listing, opening, and reading message history for reported
        conversations only. Dismiss, resolve, suspend, and delete actions are not available.
      </Notice>

      <FilterBar>
        <div className="moderation-filters__actions">
          <Button
            variant="secondary"
            onClick={() => {
              void handleRefresh()
            }}
            disabled={isRefreshing || query.isFetching}
          >
            {isRefreshing || query.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </FilterBar>

      {forbidden ? (
        <ForbiddenState />
      ) : query.error ? (
        <ErrorState
          title="Unable to load reported conversations"
          description={
            query.error instanceof ApiClientError
              ? query.error.message
              : 'The reported conversation queue could not be loaded.'
          }
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : (
        <ReportedConversationTable
          rows={query.data?.items ?? []}
          isLoading={query.isLoading}
          pagination={query.data?.pagination}
        />
      )}
    </div>
  )
}
