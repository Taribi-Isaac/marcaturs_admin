import { Link, useSearchParams } from 'react-router-dom'
import type { AdminDispute } from '@/features/disputes/types'
import { disputeDetailPath, isActionableDisputeStatus } from '@/features/disputes/constants'
import { formatDisputeTimestamp, formatPartyLabel, truncateText } from '@/features/disputes/format'
import { Button, DataTable, StatusBadge, type DataTableColumn } from '@/shared/ui'

export type DisputeTableProps = {
  rows: AdminDispute[]
  isLoading: boolean
  pagination?: {
    current_page: number
    last_page: number
    total: number
    from: number | null
    to: number | null
  }
}

const columns: DataTableColumn<AdminDispute>[] = [
  {
    id: 'reference',
    header: 'Dispute',
    cell: (row) => (
      <div className="dispute-stack">
        <span className="dispute-primary">{row.reference}</span>
        <span className="dispute-muted">Deal #{row.deal_id}</span>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => (
      <div className="dispute-stack">
        <StatusBadge domain="dispute" status={row.status} />
        <span className="dispute-muted">
          {isActionableDisputeStatus(row.status) ? 'Needs Admin action' : 'Resolved / closed'}
        </span>
      </div>
    ),
  },
  {
    id: 'category',
    header: 'Category',
    cell: (row) => (
      <div className="dispute-stack">
        <span className="dispute-primary">{row.category?.name ?? '—'}</span>
        <span className="dispute-muted dispute-clamp">{truncateText(row.description, 72)}</span>
      </div>
    ),
  },
  {
    id: 'parties',
    header: 'Parties',
    cell: (row) => (
      <div className="dispute-stack">
        <span className="dispute-muted">
          Business: {formatPartyLabel(row.deal?.business ?? null)}
        </span>
        <span className="dispute-muted">
          Ambassador: {formatPartyLabel(row.deal?.ambassador ?? null)}
        </span>
      </div>
    ),
  },
  {
    id: 'opened',
    header: 'Opened',
    cell: (row) => formatDisputeTimestamp(row.created_at),
  },
  {
    id: 'updated',
    header: 'Updated',
    cell: (row) => formatDisputeTimestamp(row.updated_at),
  },
  {
    id: 'action',
    header: 'Action',
    align: 'right',
    cell: (row) => (
      <Link className="dispute-action-link" to={disputeDetailPath(row.id)}>
        Open dispute
      </Link>
    ),
  },
]

export function DisputeTable({ rows, isLoading, pagination }: DisputeTableProps) {
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
    <div className="dispute-table">
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => String(row.id)}
        isLoading={isLoading}
        emptyTitle="No disputes match this page view."
        emptyDescription="Change the queue view or page. Status filtering is page-local because the Admin list API has no status query."
        caption="Dispute administration queue"
      />

      {pagination && pagination.last_page > 1 ? (
        <div className="dispute-pagination" role="navigation" aria-label="Dispute pages">
          <span className="dispute-muted">
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
          </span>
          <div className="dispute-pagination__controls">
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
