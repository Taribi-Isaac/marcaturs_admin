import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchReportedConversationAttentionQueue } from '@/features/attention/api'
import { ATTENTION_DESTINATIONS, ATTENTION_QUERY_KEYS } from '@/features/attention/constants'
import {
  AttentionOpenLink,
  AttentionQueueSection,
} from '@/features/attention/AttentionQueueSection'
import {
  formatAttentionTimestamp,
  formatPartyLabel,
  truncateText,
} from '@/features/attention/format'
import type { ReportedConversationAttentionItem } from '@/features/attention/types'
import type { DataTableColumn } from '@/shared/ui'

export function ReportedConversationAttentionQueue() {
  const query = useQuery({
    queryKey: ATTENTION_QUERY_KEYS.conversations,
    queryFn: ({ signal }) => fetchReportedConversationAttentionQueue(signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const columns = useMemo<DataTableColumn<ReportedConversationAttentionItem>[]>(
    () => [
      {
        id: 'conversation',
        header: 'Conversation',
        cell: (row) => (
          <div className="attention-queue__stack">
            <span className="attention-queue__primary">#{row.id}</span>
            <span className="attention-queue__secondary">
              {formatPartyLabel(row.business)} · {formatPartyLabel(row.ambassador)}
            </span>
          </div>
        ),
      },
      {
        id: 'report',
        header: 'Report',
        cell: (row) => (
          <div className="attention-queue__stack">
            <span className="attention-queue__secondary">
              Reporter: {formatPartyLabel(row.reported_by)}
            </span>
            <span className="attention-queue__clamp">{truncateText(row.report_reason, 80)}</span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: () => (
          <span className="status-badge status-badge--warning">
            <span className="status-badge__dot" aria-hidden="true" />
            <span>Reported</span>
          </span>
        ),
      },
      {
        id: 'reported',
        header: 'Reported',
        cell: (row) => formatAttentionTimestamp(row.reported_at),
      },
      {
        id: 'action',
        header: 'Action',
        align: 'right',
        cell: () => (
          <AttentionOpenLink to={ATTENTION_DESTINATIONS.conversations} label="Open moderation" />
        ),
      },
    ],
    [],
  )

  return (
    <AttentionQueueSection
      title="Reported conversations"
      description="Business↔Ambassador conversations that have been reported. Viewing is supported; the API does not currently provide dismiss or resolve actions."
      count={query.data?.count ?? null}
      columns={columns}
      rows={query.data?.items ?? []}
      getRowId={(row) => String(row.id)}
      isLoading={query.isLoading}
      isFetching={query.isFetching}
      error={query.error}
      emptyTitle="No reported conversations currently require attention."
      emptyDescription="Reported chats will appear here when participants report a conversation."
      onRetry={() => {
        void query.refetch()
      }}
      caption="Reported conversations attention queue"
      footerNote="Moderation actions beyond viewing are not available from the current Admin API."
    />
  )
}
