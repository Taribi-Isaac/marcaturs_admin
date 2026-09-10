import { apiDownload, apiRequest, apiRequestResult } from '@/shared/api'
import type {
  AdminCampaign,
  CampaignClosePayload,
  CampaignExtension,
  CampaignFeaturedPurchase,
  CampaignListParams,
  CampaignMarketingResource,
  CampaignReviewPayload,
} from '@/features/campaigns/types'

export type CampaignListResult = {
  items: AdminCampaign[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export async function fetchAdminCampaigns(
  params: CampaignListParams = {},
  signal?: AbortSignal,
): Promise<CampaignListResult> {
  const search = new URLSearchParams()
  if (params.status) {
    search.set('status', params.status)
  }
  if (params.page && params.page > 1) {
    search.set('page', String(params.page))
  }

  const query = search.toString()
  const path = query ? `/admin/campaigns?${query}` : '/admin/campaigns'
  const result = await apiRequestResult<AdminCampaign[]>(path, { method: 'GET', signal })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}

export async function fetchAdminCampaign(
  id: number | string,
  signal?: AbortSignal,
): Promise<AdminCampaign> {
  return apiRequest<AdminCampaign>(`/admin/campaigns/${id}`, { method: 'GET', signal })
}

export async function approveCampaign(id: number | string): Promise<AdminCampaign> {
  return apiRequest<AdminCampaign>(`/admin/campaigns/${id}/approve`, {
    method: 'POST',
    body: {},
  })
}

export async function rejectCampaign(
  id: number | string,
  payload: CampaignReviewPayload,
): Promise<AdminCampaign> {
  return apiRequest<AdminCampaign>(`/admin/campaigns/${id}/reject`, {
    method: 'POST',
    body: payload,
  })
}

export async function requestCampaignModification(
  id: number | string,
  payload: CampaignReviewPayload,
): Promise<AdminCampaign> {
  return apiRequest<AdminCampaign>(`/admin/campaigns/${id}/request-modification`, {
    method: 'POST',
    body: payload,
  })
}

export async function activateCampaign(id: number | string): Promise<AdminCampaign> {
  return apiRequest<AdminCampaign>(`/admin/campaigns/${id}/activate`, {
    method: 'POST',
    body: {},
  })
}

export async function suspendCampaign(
  id: number | string,
  payload: CampaignReviewPayload,
): Promise<AdminCampaign> {
  return apiRequest<AdminCampaign>(`/admin/campaigns/${id}/suspend`, {
    method: 'POST',
    body: payload,
  })
}

export async function closeCampaign(
  id: number | string,
  payload: CampaignClosePayload = {},
): Promise<AdminCampaign> {
  return apiRequest<AdminCampaign>(`/admin/campaigns/${id}/close`, {
    method: 'POST',
    body: payload,
  })
}

export async function fetchCampaignResources(
  id: number | string,
  signal?: AbortSignal,
): Promise<CampaignMarketingResource[]> {
  return apiRequest<CampaignMarketingResource[]>(`/admin/campaigns/${id}/resources`, {
    method: 'GET',
    signal,
  })
}

export async function downloadCampaignResource(
  campaignId: number | string,
  resourceId: number | string,
): Promise<{ blob: Blob; filename: string | null }> {
  return apiDownload(`/admin/campaigns/${campaignId}/resources/${resourceId}/download`)
}

export async function downloadCampaignCover(
  campaignId: number | string,
): Promise<{ blob: Blob; filename: string | null }> {
  return apiDownload(`/admin/campaigns/${campaignId}/cover/download`)
}

export async function fetchCampaignFeaturedHistory(
  id: number | string,
  signal?: AbortSignal,
): Promise<CampaignFeaturedPurchase[]> {
  return apiRequest<CampaignFeaturedPurchase[]>(`/admin/campaigns/${id}/featured`, {
    method: 'GET',
    signal,
  })
}

export async function fetchCampaignExtensionHistory(
  id: number | string,
  signal?: AbortSignal,
): Promise<CampaignExtension[]> {
  return apiRequest<CampaignExtension[]>(`/admin/campaigns/${id}/extensions`, {
    method: 'GET',
    signal,
  })
}
