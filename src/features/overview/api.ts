import { apiRequest } from '@/shared/api'
import type { AdminOverview } from './types'

export async function fetchAdminOverview(signal?: AbortSignal): Promise<AdminOverview> {
  return apiRequest<AdminOverview>('/admin/overview', {
    method: 'GET',
    signal,
  })
}
