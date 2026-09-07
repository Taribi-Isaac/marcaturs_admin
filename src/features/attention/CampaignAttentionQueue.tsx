import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCampaignAttentionQueue } from '@/features/attention/api'
import { ATTENTION_DESTINATIONS, ATTENTION_QUERY_KEYS } from '@/features/attention/constants'
import {
  AttentionOpenLink,
  AttentionQueueSection,
} from '@/features/attention/AttentionQueueSection'
import { formatAttentionTimestamp, formatPartyLabel } from '@/features/attention/format'
import type { CampaignAttentionItem } from '@/features/attention/types'
import { StatusBadge, type DataTableColumn } from '@/shared/ui'

export function CampaignAttentionQueue() {
  const query = useQuery({
    queryKey: ATTENTION_QUERY_KEYS.campaigns,
    queryFn: ({ signal }) => fetchCampaignAttentionQueue(signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const columns = useMemo<DataTableColumn<CampaignAttentionItem>[]>(
    () => [
      {
        id: 'campaign',
        header: 'Campaign',
        cell: (row) => (
          <span className="attention-queue__clamp attention-queue__primary">{row.title}</span>
        ),
      },
      {
        id: 'business',
        header: 'Business',
        cell: (row) => formatPartyLabel(row.user),
      },
      {
        id: 'category',
        header: 'Category',
        cell: (row) => row.category?.name ?? '—',
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <StatusBadge domain="campaign" status={row.status} />,
      },
      {
        id: 'submitted',
        header: 'Submitted',
        cell: (row) => formatAttentionTimestamp(row.submitted_at),
      },
      {
        id: 'action',
        header: 'Action',
        align: 'right',
        cell: () => (
          <AttentionOpenLink to={ATTENTION_DESTINATIONS.campaigns} label="Open campaigns" />
        ),
      },
    ],
    [],
  )

  return (
    <AttentionQueueSection
      title="Campaign moderation"
      description="Campaigns submitted for Admin moderation."
      count={query.data?.count ?? null}
      columns={columns}
      rows={query.data?.items ?? []}
      getRowId={(row) => String(row.id)}
      isLoading={query.isLoading}
      isFetching={query.isFetching}
      error={query.error}
      emptyTitle="No campaigns currently require moderation."
      emptyDescription="Submitted campaigns awaiting approve, reject, or modification request will appear here."
      onRetry={() => {
        void query.refetch()
      }}
      caption="Campaign moderation attention queue"
    />
  )
}
