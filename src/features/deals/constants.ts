import { commissionStatuses, dealStatuses } from '@/shared/types/domain'
import type { CommissionStatus, DealStatus } from '@/shared/types/domain'
import { formatStatusLabel } from '@/shared/lib/status'

export const DEAL_QUERY_KEYS = {
  all: ['deals'] as const,
  list: (params: {
    status?: string
    q?: string
    open_dispute?: string
    commission_overdue?: string
    commission_status?: string
    page?: number
    per_page?: number
  }) => ['deals', 'list', params] as const,
  detail: (id: number | string) => ['deals', 'detail', String(id)] as const,
}

export const DEAL_STATUS_FILTER_OPTIONS: Array<{ value: 'all' | DealStatus; label: string }> = [
  { value: 'all', label: 'All' },
  ...dealStatuses.map((status) => ({
    value: status,
    label: formatStatusLabel(status),
  })),
]

export const DEAL_OPEN_DISPUTE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '1', label: 'Has open dispute' },
] as const

export const DEAL_COMMISSION_OVERDUE_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: '1', label: 'Overdue' },
] as const

export const DEAL_COMMISSION_STATUS_FILTER_OPTIONS: Array<{
  value: 'all' | CommissionStatus
  label: string
}> = [
  { value: 'all', label: 'All' },
  ...commissionStatuses.map((status) => ({
    value: status,
    label: formatStatusLabel(status),
  })),
]

export const DEFAULT_DEALS_PER_PAGE = 15
export const MAX_DEALS_PER_PAGE = 100

export function dealDetailPath(id: number | string): string {
  return `/deals/${id}`
}
