import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDisputeAttentionQueue } from '@/features/attention/api'
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
import type { DisputeAttentionItem } from '@/features/attention/types'
import { StatusBadge, type DataTableColumn } from '@/shared/ui'

export function DisputeAttentionQueue() {
  const query = useQuery({
    queryKey: ATTENTION_QUERY_KEYS.disputes,
    queryFn: ({ signal }) => fetchDisputeAttentionQueue(signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const columns = useMemo<DataTableColumn<DisputeAttentionItem>[]>(
    () => [
      {
        id: 'reference',
        header: 'Dispute',
        cell: (row) => (
          <div className="attention-queue__stack">
            <span className="attention-queue__primary">{row.reference}</span>
            <span className="attention-queue__secondary">Deal #{row.deal_id}</span>
          </div>
        ),
      },
      {
        id: 'parties',
        header: 'Parties',
        cell: (row) => {
          const reporterName =
            row.deal?.ambassador?.role === row.reporter?.role
              ? formatPartyLabel(row.deal?.ambassador)
              : row.deal?.business?.role === row.reporter?.role
                ? formatPartyLabel(row.deal?.business)
                : formatPartyLabel(row.reporter)
          const accusedName =
            row.deal?.business?.role === row.accused?.role
              ? formatPartyLabel(row.deal?.business)
              : row.deal?.ambassador?.role === row.accused?.role
                ? formatPartyLabel(row.deal?.ambassador)
                : formatPartyLabel(row.accused)

          return (
            <div className="attention-queue__stack">
              <span className="attention-queue__secondary">Reporter: {reporterName}</span>
              <span className="attention-queue__secondary">Accused: {accusedName}</span>
            </div>
          )
        },
      },
      {
        id: 'category',
        header: 'Category',
        cell: (row) => (
          <div className="attention-queue__stack">
            <span className="attention-queue__clamp">{row.category?.name ?? '—'}</span>
            <span className="attention-queue__secondary attention-queue__clamp">
              {truncateText(row.description, 64)}
            </span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <StatusBadge domain="dispute" status={row.status} />,
      },
      {
        id: 'updated',
        header: 'Updated',
        cell: (row) => formatAttentionTimestamp(row.updated_at ?? row.created_at),
      },
      {
        id: 'action',
        header: 'Action',
        align: 'right',
        cell: (row) => (
          <AttentionOpenLink
            to={`${ATTENTION_DESTINATIONS.disputes}/${row.id}`}
            label="Open dispute"
          />
        ),
      },
    ],
    [],
  )

  return (
    <AttentionQueueSection
      title="Disputes"
      description="Open disputes that still require Admin investigation or decision."
      count={query.data?.count ?? null}
      columns={columns}
      rows={query.data?.items ?? []}
      getRowId={(row) => String(row.id)}
      isLoading={query.isLoading}
      isFetching={query.isFetching}
      error={query.error}
      emptyTitle="No open disputes currently require attention."
      emptyDescription="Submitted, under-review, evidence-requested, and decision-pending disputes will appear here."
      onRetry={() => {
        void query.refetch()
      }}
      caption="Dispute attention queue"
      footerNote={
        query.data?.count.kind === 'showing' && query.data.count.truncated
          ? 'Showing open disputes from the latest disputes page. The Admin disputes list has no status filter yet.'
          : undefined
      }
    />
  )
}
