import { apiDownload, apiRequest, apiRequestResult } from '@/shared/api'
import type { AdminDealDetail, AdminDealListItem, DealListParams } from '@/features/deals/types'

export type DealListResult = {
  items: AdminDealListItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export async function fetchAdminDeals(
  params: DealListParams = {},
  signal?: AbortSignal,
): Promise<DealListResult> {
  const search = new URLSearchParams()
  if (params.status) {
    search.set('status', params.status)
  }
  if (params.q?.trim()) {
    search.set('q', params.q.trim())
  }
  if (params.open_dispute === true) {
    search.set('open_dispute', '1')
  }
  if (params.commission_overdue === true) {
    search.set('commission_overdue', '1')
  }
  if (params.commission_status) {
    search.set('commission_status', params.commission_status)
  }
  if (params.page && params.page > 1) {
    search.set('page', String(params.page))
  }
  if (params.per_page && params.per_page !== 15) {
    search.set('per_page', String(params.per_page))
  }

  const query = search.toString()
  const path = query ? `/admin/deals?${query}` : '/admin/deals'
  const result = await apiRequestResult<AdminDealListItem[]>(path, { method: 'GET', signal })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}

export async function fetchAdminDeal(
  id: number | string,
  signal?: AbortSignal,
): Promise<AdminDealDetail> {
  return apiRequest<AdminDealDetail>(`/admin/deals/${id}`, { method: 'GET', signal })
}

export async function downloadAdminDealPaymentEvidence(
  dealId: number | string,
  evidenceId: number | string,
  signal?: AbortSignal,
) {
  return apiDownload(`/admin/deals/${dealId}/payment-evidence/${evidenceId}/download`, { signal })
}
