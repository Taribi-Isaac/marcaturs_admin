import { Link, useSearchParams } from 'react-router-dom'
import type { AdminDealListItem } from '@/features/deals/types'
import { dealDetailPath } from '@/features/deals/constants'
import {
  formatCommissionRate,
  formatDealMoney,
  formatDealTimestamp,
  formatPartyLine,
} from '@/features/deals/format'
import { formatStatusLabel } from '@/shared/lib/status'
import { Button, DataTable, StatusBadge, type DataTableColumn } from '@/shared/ui'

export type DealTableProps = {
  rows: AdminDealListItem[]
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

function PartyCell({
  party,
}: {
  party: AdminDealListItem['business'] | AdminDealListItem['ambassador']
}) {
  const line = formatPartyLine(party)
  return (
    <div className="deals-stack">
      <span className="deals-primary deals-clamp">{line.name}</span>
      <span className="deals-muted deals-clamp">{line.email}</span>
      {line.status ? (
        <StatusBadge domain="account" status={line.status} label={formatStatusLabel(line.status)} />
      ) : null}
    </div>
  )
}

const columns: DataTableColumn<AdminDealListItem>[] = [
  {
    id: 'deal',
    header: 'Deal',
    cell: (row) => (
      <div className="deals-stack">
        <span className="deals-primary">#{row.id}</span>
        <StatusBadge domain="deal" status={String(row.status)} />
        <span className="deals-muted">{formatDealTimestamp(row.created_at)}</span>
      </div>
    ),
  },
  {
    id: 'business',
    header: 'Business',
    cell: (row) => <PartyCell party={row.business} />,
  },
  {
    id: 'ambassador',
    header: 'Ambassador',
    cell: (row) => <PartyCell party={row.ambassador} />,
  },
  {
    id: 'campaign',
    header: 'Campaign',
    cell: (row) => (
      <div className="deals-stack">
        <span className="deals-primary deals-clamp">{row.campaign?.title ?? '—'}</span>
        <span className="deals-muted">
          {row.campaign_version?.version_number != null
            ? `Version ${row.campaign_version.version_number}`
            : '—'}
        </span>
      </div>
    ),
  },
  {
    id: 'commercial',
    header: 'Commercial',
    cell: (row) => (
      <div className="deals-stack">
        <span className="deals-primary deals-clamp">{row.product_name ?? '—'}</span>
        <span className="deals-muted">
          {formatCommissionRate(row.commission_type, null, row.commission_amount)}
        </span>
      </div>
    ),
  },
  {
    id: 'ops',
    header: 'Operational state',
    cell: (row) => (
      <div className="deals-stack">
        <span className="deals-muted">
          Evidence:{' '}
          {row.has_evidence
            ? `${row.evidence_count}${
                row.latest_evidence_status
                  ? ` · ${formatStatusLabel(row.latest_evidence_status)}`
                  : ''
              }`
            : 'None'}
        </span>
        <span className="deals-muted">
          Payment:{' '}
          {row.confirmed_at
            ? formatDealMoney(row.confirmed_payment_amount)
            : row.status === 'payment_pending'
              ? 'Pending confirmation'
              : '—'}
        </span>
        <span className="deals-muted">
          Commission:{' '}
          {row.commission ? (
            <>
              <StatusBadge domain="commission" status={String(row.commission.status)} />
              {row.commission.is_overdue ? <span className="deals-overdue"> · Overdue</span> : null}
            </>
          ) : (
            '—'
          )}
        </span>
        <span className="deals-muted">
          Dispute:{' '}
          {row.open_dispute_count > 0 ? (
            <span className="deals-overdue">{row.open_dispute_count} open</span>
          ) : (
            'None open'
          )}
        </span>
      </div>
    ),
  },
  {
    id: 'action',
    header: 'Actions',
    align: 'right',
    cell: (row) => (
      <Link className="deals-action-link" to={dealDetailPath(row.id)}>
        Open
      </Link>
    ),
  },
]

export function DealTable({ rows, isLoading, pagination, onResetFilters }: DealTableProps) {
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
    <div className="deals-table">
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => String(row.id)}
        isLoading={isLoading}
        emptyTitle="No Deals match these filters."
        emptyDescription="Adjust status, search, or commission/dispute filters, or reset to see all Deals."
        caption="Admin Deals investigation list"
      />

      {!isLoading && rows.length === 0 && onResetFilters ? (
        <div className="deals-empty-actions">
          <Button variant="secondary" onClick={onResetFilters}>
            Reset filters
          </Button>
        </div>
      ) : null}

      {pagination && pagination.total > 0 ? (
        <div className="deals-pagination" role="navigation" aria-label="Deal pages">
          <span className="deals-muted">
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
          </span>
          {pagination.last_page > 1 ? (
            <div className="deals-pagination__controls">
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
