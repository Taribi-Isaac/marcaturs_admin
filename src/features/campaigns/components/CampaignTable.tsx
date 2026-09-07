import { Link, useSearchParams } from 'react-router-dom'
import type { AdminCampaign } from '@/features/campaigns/types'
import { campaignDetailPath } from '@/features/campaigns/constants'
import { formatCampaignTimestamp } from '@/features/campaigns/format'
import { Button, DataTable, StatusBadge, type DataTableColumn } from '@/shared/ui'

export type CampaignTableProps = {
  rows: AdminCampaign[]
  isLoading: boolean
  pagination?: {
    current_page: number
    last_page: number
    total: number
    from: number | null
    to: number | null
  }
}

const columns: DataTableColumn<AdminCampaign>[] = [
  {
    id: 'campaign',
    header: 'Campaign',
    cell: (row) => <span className="campaign-clamp campaign-primary">{row.title}</span>,
  },
  {
    id: 'business',
    header: 'Business',
    cell: (row) => (
      <div className="campaign-stack">
        <span className="campaign-primary">{row.user?.name ?? '—'}</span>
        <span className="campaign-muted">{row.user?.email ?? '—'}</span>
      </div>
    ),
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
    id: 'version',
    header: 'Version',
    cell: (row) =>
      row.current_version
        ? `v${row.current_version.version_number} (${row.current_version.status})`
        : '—',
  },
  {
    id: 'listing',
    header: 'Listing window',
    cell: (row) => (
      <div className="campaign-stack">
        <span className="campaign-muted">
          Starts {formatCampaignTimestamp(row.listing_starts_at)}
        </span>
        <span className="campaign-muted">
          Expires {formatCampaignTimestamp(row.listing_expires_at)}
        </span>
      </div>
    ),
  },
  {
    id: 'submitted',
    header: 'Submitted',
    cell: (row) => formatCampaignTimestamp(row.submitted_at ?? row.created_at),
  },
  {
    id: 'action',
    header: 'Action',
    align: 'right',
    cell: (row) => (
      <Link className="campaign-action-link" to={campaignDetailPath(row.id)}>
        Open campaign
      </Link>
    ),
  },
]

export function CampaignTable({ rows, isLoading, pagination }: CampaignTableProps) {
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
    <div className="campaign-table">
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => String(row.id)}
        isLoading={isLoading}
        emptyTitle="No campaigns match the current filters."
        emptyDescription="Adjust the status filter to inspect other campaign lifecycle states."
        caption="Campaign moderation queue"
      />

      {pagination && pagination.last_page > 1 ? (
        <div className="campaign-pagination" role="navigation" aria-label="Campaign pages">
          <span className="campaign-muted">
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
          </span>
          <div className="campaign-pagination__controls">
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
