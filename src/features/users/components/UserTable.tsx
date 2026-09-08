import { Link, useSearchParams } from 'react-router-dom'
import type { AdminUserListItem } from '@/features/users/types'
import { userDetailPath } from '@/features/users/constants'
import {
  commissionAttentionLabel,
  formatOverallVerification,
  formatParticipantRole,
  formatUserTimestamp,
  participantPrimaryLabel,
  profileDisplayName,
} from '@/features/users/format'
import { Button, DataTable, StatusBadge, type DataTableColumn } from '@/shared/ui'

export type UserTableProps = {
  rows: AdminUserListItem[]
  isLoading: boolean
  pagination?: {
    current_page: number
    last_page: number
    total: number
    from: number | null
    to: number | null
    per_page?: number
  }
  onResetFilters?: () => void
}

const columns: DataTableColumn<AdminUserListItem>[] = [
  {
    id: 'participant',
    header: 'Participant',
    cell: (row) => {
      const profileName = profileDisplayName(row.role, row.profile_summary)
      return (
        <div className="users-stack">
          <span className="users-primary users-clamp">{participantPrimaryLabel(row)}</span>
          <span className="users-muted users-clamp">{row.email}</span>
          {profileName && profileName !== row.name ? (
            <span className="users-muted users-clamp">{row.name}</span>
          ) : null}
        </div>
      )
    },
  },
  {
    id: 'role',
    header: 'Role',
    cell: (row) => formatParticipantRole(row.role),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge domain="account" status={row.status} />,
  },
  {
    id: 'verification',
    header: 'Verification',
    cell: (row) => (
      <StatusBadge
        domain="verification_overall"
        status={row.verification_status}
        label={formatOverallVerification(row.verification_status)}
      />
    ),
  },
  {
    id: 'campaigns',
    header: 'Campaigns',
    cell: (row) => row.counts.campaigns,
  },
  {
    id: 'deals',
    header: 'Deals',
    cell: (row) => row.counts.deals,
  },
  {
    id: 'disputes',
    header: 'Open disputes',
    cell: (row) => row.counts.open_disputes,
  },
  {
    id: 'commissions',
    header: 'Commission attention',
    cell: (row) => commissionAttentionLabel(row.counts),
  },
  {
    id: 'created',
    header: 'Created',
    cell: (row) => formatUserTimestamp(row.created_at),
  },
  {
    id: 'action',
    header: 'Actions',
    align: 'right',
    cell: (row) => (
      <Link className="users-action-link" to={userDetailPath(row.id)}>
        Open
      </Link>
    ),
  },
]

export function UserTable({ rows, isLoading, pagination, onResetFilters }: UserTableProps) {
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
    <div className="users-table">
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => String(row.id)}
        isLoading={isLoading}
        emptyTitle="No participants match these filters."
        emptyDescription="Adjust role, status, or search, or reset filters to see all Business and Ambassador accounts."
        caption="Admin participant accounts"
      />

      {!isLoading && rows.length === 0 && onResetFilters ? (
        <div className="users-empty-actions">
          <Button variant="secondary" onClick={onResetFilters}>
            Reset filters
          </Button>
        </div>
      ) : null}

      {pagination && pagination.total > 0 ? (
        <div className="users-pagination" role="navigation" aria-label="User pages">
          <span className="users-muted">
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
          </span>
          {pagination.last_page > 1 ? (
            <div className="users-pagination__controls">
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
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
