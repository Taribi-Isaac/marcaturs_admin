import { Link, useSearchParams } from 'react-router-dom'
import { reportedConversationDetailPath } from '@/features/moderation/constants'
import {
  formatModerationTimestamp,
  formatPartyLabel,
  truncateText,
} from '@/features/moderation/format'
import type { PaginationInfo, ReportedConversation } from '@/features/moderation/types'
import { Button, DataTable, type DataTableColumn } from '@/shared/ui'

export type ReportedConversationTableProps = {
  rows: ReportedConversation[]
  isLoading: boolean
  pagination?: PaginationInfo
}

const columns: DataTableColumn<ReportedConversation>[] = [
  {
    id: 'conversation',
    header: 'Conversation',
    cell: (row) => (
      <div className="moderation-stack">
        <span className="moderation-primary">#{row.id}</span>
        <span className="moderation-muted">
          Business: {formatPartyLabel(row.business)} · Ambassador:{' '}
          {formatPartyLabel(row.ambassador)}
        </span>
      </div>
    ),
  },
  {
    id: 'report',
    header: 'Report',
    cell: (row) => (
      <div className="moderation-stack">
        <span className="moderation-muted">
          Reporter: {formatPartyLabel(row.reported_by)}
          {row.reported_by?.role ? ` (${row.reported_by.role})` : ''}
        </span>
        <span className="moderation-clamp">{truncateText(row.report_reason, 100)}</span>
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
    cell: (row) => formatModerationTimestamp(row.reported_at),
  },
  {
    id: 'updated',
    header: 'Updated',
    cell: (row) => formatModerationTimestamp(row.updated_at),
  },
  {
    id: 'action',
    header: 'Action',
    align: 'right',
    cell: (row) => (
      <Link className="moderation-action-link" to={reportedConversationDetailPath(row.id)}>
        Inspect
      </Link>
    ),
  },
]

export function ReportedConversationTable({
  rows,
  isLoading,
  pagination,
}: ReportedConversationTableProps) {
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
    <div className="moderation-table">
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => String(row.id)}
        isLoading={isLoading}
        emptyTitle="No reported conversations currently require moderation."
        emptyDescription="When a Business or Ambassador reports a conversation, it appears here for Admin inspection. The seeded scenario may include zero reports."
        caption="Reported conversations moderation queue"
      />

      {pagination && pagination.last_page > 1 ? (
        <div
          className="moderation-pagination"
          role="navigation"
          aria-label="Reported conversation pages"
        >
          <span className="moderation-muted">
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
          </span>
          <div className="moderation-pagination__controls">
            <Button
              variant="secondary"
              disabled={pagination.current_page <= 1}
              onClick={() => goToPage(pagination.current_page - 1)}
            >
              Previous
            </Button>
            <span className="moderation-muted">
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
