import { Link, useSearchParams } from 'react-router-dom'
import type { AdminStaffListItem } from '@/features/staff/types'
import { staffDetailPath } from '@/features/staff/constants'
import { formatStaffRole, formatStaffTimestamp } from '@/features/staff/format'
import { Button, DataTable, StatusBadge, type DataTableColumn } from '@/shared/ui'

export type StaffTableProps = {
  rows: AdminStaffListItem[]
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

const columns: DataTableColumn<AdminStaffListItem>[] = [
  {
    id: 'staff',
    header: 'Staff',
    cell: (row) => (
      <div className="users-stack">
        <span className="users-primary users-clamp">{row.name}</span>
        <span className="users-muted users-clamp">{row.email}</span>
      </div>
    ),
  },
  {
    id: 'staff_role',
    header: 'Staff role',
    cell: (row) => formatStaffRole(row.staff_role),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge domain="account" status={row.status} />,
  },
  {
    id: 'created',
    header: 'Created',
    cell: (row) => formatStaffTimestamp(row.created_at),
  },
  {
    id: 'last_login',
    header: 'Last login',
    cell: (row) => formatStaffTimestamp(row.last_login_at),
  },
  {
    id: 'action',
    header: 'Actions',
    align: 'right',
    cell: (row) => (
      <Link className="users-action-link" to={staffDetailPath(row.id)}>
        Open
      </Link>
    ),
  },
]

export function StaffTable({ rows, isLoading, pagination, onResetFilters }: StaffTableProps) {
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
        emptyTitle="No staff match these filters."
        emptyDescription="Adjust staff role, status, or search, or reset filters to see all Admin staff accounts."
        caption="Admin staff accounts"
      />

      {!isLoading && rows.length === 0 && onResetFilters ? (
        <div className="users-empty-actions">
          <Button variant="secondary" onClick={onResetFilters}>
            Reset filters
          </Button>
        </div>
      ) : null}

      {pagination && pagination.total > 0 ? (
        <div className="users-pagination" role="navigation" aria-label="Staff pages">
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
