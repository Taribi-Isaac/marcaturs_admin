import { apiDownload, apiRequest, apiRequestResult } from '@/shared/api'
import type {
  ApproveVerificationPayload,
  CreateVerificationRequirementPayload,
  ReviewVerificationPayload,
  UpdateVerificationRequirementPayload,
  VerificationRequirement,
  VerificationReviewEvent,
  VerificationSubmission,
  VerificationSubmissionListParams,
} from '@/features/verification/types'

export type VerificationSubmissionListResult = {
  items: VerificationSubmission[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export async function fetchVerificationSubmissions(
  params: VerificationSubmissionListParams = {},
  signal?: AbortSignal,
): Promise<VerificationSubmissionListResult> {
  const search = new URLSearchParams()
  if (params.status) {
    search.set('status', params.status)
  }
  if (params.page && params.page > 1) {
    search.set('page', String(params.page))
  }

  const query = search.toString()
  const path = query
    ? `/admin/verification/submissions?${query}`
    : '/admin/verification/submissions'

  const result = await apiRequestResult<VerificationSubmission[]>(path, {
    method: 'GET',
    signal,
  })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}

export async function fetchVerificationSubmission(
  id: number | string,
  signal?: AbortSignal,
): Promise<VerificationSubmission> {
  return apiRequest<VerificationSubmission>(`/admin/verification/submissions/${id}`, {
    method: 'GET',
    signal,
  })
}

export async function fetchVerificationEvents(
  id: number | string,
  signal?: AbortSignal,
): Promise<VerificationReviewEvent[]> {
  return apiRequest<VerificationReviewEvent[]>(`/admin/verification/submissions/${id}/events`, {
    method: 'GET',
    signal,
  })
}

export async function startVerificationReview(
  id: number | string,
): Promise<VerificationSubmission> {
  return apiRequest<VerificationSubmission>(`/admin/verification/submissions/${id}/start-review`, {
    method: 'POST',
    body: {},
  })
}

export async function approveVerificationSubmission(
  id: number | string,
  payload: ApproveVerificationPayload,
): Promise<VerificationSubmission> {
  return apiRequest<VerificationSubmission>(`/admin/verification/submissions/${id}/approve`, {
    method: 'POST',
    body: payload,
  })
}

export async function rejectVerificationSubmission(
  id: number | string,
  payload: ReviewVerificationPayload,
): Promise<VerificationSubmission> {
  return apiRequest<VerificationSubmission>(`/admin/verification/submissions/${id}/reject`, {
    method: 'POST',
    body: payload,
  })
}

export async function requestVerificationInformation(
  id: number | string,
  payload: ReviewVerificationPayload,
): Promise<VerificationSubmission> {
  return apiRequest<VerificationSubmission>(
    `/admin/verification/submissions/${id}/request-information`,
    {
      method: 'POST',
      body: payload,
    },
  )
}

export async function downloadVerificationEvidence(
  submissionId: number | string,
  evidenceId: number | string,
): Promise<{ blob: Blob; filename: string | null }> {
  return apiDownload(
    `/admin/verification/submissions/${submissionId}/evidence/${evidenceId}/download`,
  )
}

export async function fetchVerificationRequirements(
  signal?: AbortSignal,
): Promise<VerificationRequirement[]> {
  return apiRequest<VerificationRequirement[]>('/admin/verification/requirements', {
    method: 'GET',
    signal,
  })
}

export async function createVerificationRequirement(
  payload: CreateVerificationRequirementPayload,
): Promise<VerificationRequirement> {
  return apiRequest<VerificationRequirement>('/admin/verification/requirements', {
    method: 'POST',
    body: payload,
  })
}

export async function updateVerificationRequirement(
  id: number | string,
  payload: UpdateVerificationRequirementPayload,
): Promise<VerificationRequirement> {
  return apiRequest<VerificationRequirement>(`/admin/verification/requirements/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}
