import { Link, useSearchParams } from 'react-router-dom'
import type { VerificationSubmission } from '@/features/verification/types'
import { submissionDetailPath } from '@/features/verification/constants'
import { formatVerificationTimestamp } from '@/features/verification/format'
import { Button, DataTable, StatusBadge, type DataTableColumn } from '@/shared/ui'

export type VerificationSubmissionTableProps = {
  rows: VerificationSubmission[]
  isLoading: boolean
  pagination?: {
    current_page: number
    last_page: number
    total: number
    from: number | null
    to: number | null
  }
}

const columns: DataTableColumn<VerificationSubmission>[] = [
  {
    id: 'participant',
    header: 'Participant',
    cell: (row) => (
      <div className="verification-stack">
        <span className="verification-stack__primary">
          {row.user?.name ?? `User #${row.user_id}`}
        </span>
        <span className="verification-stack__secondary">{row.user?.email ?? '—'}</span>
      </div>
    ),
  },
  {
    id: 'type',
    header: 'Type',
    cell: (row) => row.user?.role ?? row.requirement?.participant_type ?? '—',
  },
  {
    id: 'requirement',
    header: 'Requirement',
    cell: (row) => (
      <div className="verification-stack">
        <span className="verification-clamp">{row.requirement?.name ?? '—'}</span>
        <span className="verification-stack__secondary">
          {row.requirement?.requirement_type ?? '—'}
        </span>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge domain="verification_submission" status={row.status} />,
  },
  {
    id: 'version',
    header: 'Version',
    cell: (row) => `v${row.current_version}`,
  },
  {
    id: 'submitted',
    header: 'Submitted',
    cell: (row) => formatVerificationTimestamp(row.submitted_at),
  },
  {
    id: 'action',
    header: 'Action',
    align: 'right',
    cell: (row) => (
      <Link className="verification-action-link" to={submissionDetailPath(row.id)}>
        Open submission
      </Link>
    ),
  },
]

export function VerificationSubmissionTable({
  rows,
  isLoading,
  pagination,
}: VerificationSubmissionTableProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams)
    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    setSearchParams(params)
  }

  return (
    <div className="verification-table">
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => String(row.id)}
        isLoading={isLoading}
        emptyTitle="No verification submissions match the current filters."
        emptyDescription="Adjust the status filter, or wait for participants to submit verification evidence."
        caption="Verification submissions queue"
      />

      {pagination && pagination.last_page > 1 ? (
        <div className="verification-pagination" role="navigation" aria-label="Submissions pages">
          <span className="verification-pagination__meta">
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
          </span>
          <div className="verification-pagination__controls">
            <Button
              variant="secondary"
              disabled={pagination.current_page <= 1}
              onClick={() => goToPage(pagination.current_page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <Button
              variant="secondary"
              disabled={pagination.current_page >= pagination.last_page}
              onClick={() => goToPage(pagination.current_page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
