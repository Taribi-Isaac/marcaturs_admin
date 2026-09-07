import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchVerificationAttentionQueue } from '@/features/attention/api'
import { ATTENTION_DESTINATIONS, ATTENTION_QUERY_KEYS } from '@/features/attention/constants'
import {
  AttentionOpenLink,
  AttentionQueueSection,
} from '@/features/attention/AttentionQueueSection'
import { formatAttentionTimestamp, formatPartyLabel } from '@/features/attention/format'
import type { VerificationSubmissionAttentionItem } from '@/features/attention/types'
import { StatusBadge, type DataTableColumn } from '@/shared/ui'

export function VerificationAttentionQueue() {
  const query = useQuery({
    queryKey: ATTENTION_QUERY_KEYS.verification,
    queryFn: ({ signal }) => fetchVerificationAttentionQueue(signal),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const columns = useMemo<DataTableColumn<VerificationSubmissionAttentionItem>[]>(
    () => [
      {
        id: 'participant',
        header: 'Participant',
        cell: (row) => (
          <div className="attention-queue__stack">
            <span className="attention-queue__primary">{formatPartyLabel(row.user)}</span>
            <span className="attention-queue__secondary">{row.user?.role ?? '—'}</span>
          </div>
        ),
      },
      {
        id: 'requirement',
        header: 'Requirement',
        cell: (row) => (
          <span className="attention-queue__clamp">{row.requirement?.name ?? '—'}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <StatusBadge domain="verification_submission" status={row.status} />,
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
        cell: (row) => (
          <AttentionOpenLink
            to={`${ATTENTION_DESTINATIONS.verification}/submissions/${row.id}`}
            label="Open verification"
          />
        ),
      },
    ],
    [],
  )

  return (
    <AttentionQueueSection
      title="Verification"
      description="Submissions awaiting Admin review."
      count={query.data?.count ?? null}
      columns={columns}
      rows={query.data?.items ?? []}
      getRowId={(row) => String(row.id)}
      isLoading={query.isLoading}
      isFetching={query.isFetching}
      error={query.error}
      emptyTitle="No verification items currently require attention."
      emptyDescription="Pending and under-review submissions will appear here when participants submit verification evidence."
      onRetry={() => {
        void query.refetch()
      }}
      caption="Verification attention queue"
    />
  )
}
