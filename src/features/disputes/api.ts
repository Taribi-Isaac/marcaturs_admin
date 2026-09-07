import { apiDownload, apiRequest, apiRequestResult } from '@/shared/api'
import type {
  AdminDispute,
  DisputeListParams,
  DisputeNotePayload,
  DisputeRequestEvidencePayload,
  DisputeResolvePayload,
} from '@/features/disputes/types'

export type DisputeListResult = {
  items: AdminDispute[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export async function fetchAdminDisputes(
  params: DisputeListParams = {},
  signal?: AbortSignal,
): Promise<DisputeListResult> {
  const search = new URLSearchParams()
  if (params.page && params.page > 1) {
    search.set('page', String(params.page))
  }

  const query = search.toString()
  const path = query ? `/admin/disputes?${query}` : '/admin/disputes'
  const result = await apiRequestResult<AdminDispute[]>(path, { method: 'GET', signal })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}

export async function fetchAdminDispute(
  id: number | string,
  signal?: AbortSignal,
): Promise<AdminDispute> {
  return apiRequest<AdminDispute>(`/admin/disputes/${id}`, { method: 'GET', signal })
}

export async function startDisputeReview(
  id: number | string,
  payload: DisputeNotePayload = {},
): Promise<AdminDispute> {
  return apiRequest<AdminDispute>(`/admin/disputes/${id}/start-review`, {
    method: 'POST',
    body: payload,
  })
}

export async function requestDisputeEvidence(
  id: number | string,
  payload: DisputeRequestEvidencePayload,
): Promise<AdminDispute> {
  return apiRequest<AdminDispute>(`/admin/disputes/${id}/request-evidence`, {
    method: 'POST',
    body: payload,
  })
}

export async function resumeDisputeReview(
  id: number | string,
  payload: DisputeNotePayload = {},
): Promise<AdminDispute> {
  return apiRequest<AdminDispute>(`/admin/disputes/${id}/resume-review`, {
    method: 'POST',
    body: payload,
  })
}

export async function markDisputeDecisionPending(
  id: number | string,
  payload: DisputeNotePayload = {},
): Promise<AdminDispute> {
  return apiRequest<AdminDispute>(`/admin/disputes/${id}/mark-decision-pending`, {
    method: 'POST',
    body: payload,
  })
}

export async function resolveDispute(
  id: number | string,
  payload: DisputeResolvePayload,
): Promise<AdminDispute> {
  return apiRequest<AdminDispute>(`/admin/disputes/${id}/resolve`, {
    method: 'POST',
    body: payload,
  })
}

export async function closeDispute(
  id: number | string,
  payload: DisputeNotePayload = {},
): Promise<AdminDispute> {
  return apiRequest<AdminDispute>(`/admin/disputes/${id}/close`, {
    method: 'POST',
    body: payload,
  })
}

export async function downloadDisputeAttachment(
  disputeId: number | string,
  attachmentId: number | string,
): Promise<{ blob: Blob; filename: string | null }> {
  return apiDownload(`/admin/disputes/${disputeId}/attachments/${attachmentId}/download`)
}
