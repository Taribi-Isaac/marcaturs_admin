import { apiRequest, apiRequestResult } from '@/shared/api'
import type {
  AdminUserDetail,
  AdminUserListItem,
  UserListParams,
  UserStatusActionPayload,
} from '@/features/users/types'

export type UserListResult = {
  items: AdminUserListItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export async function fetchAdminUsers(
  params: UserListParams = {},
  signal?: AbortSignal,
): Promise<UserListResult> {
  const search = new URLSearchParams()
  if (params.role) {
    search.set('role', params.role)
  }
  if (params.status) {
    search.set('status', params.status)
  }
  if (params.q?.trim()) {
    search.set('q', params.q.trim())
  }
  if (params.page && params.page > 1) {
    search.set('page', String(params.page))
  }
  if (params.per_page && params.per_page !== 15) {
    search.set('per_page', String(params.per_page))
  }

  const query = search.toString()
  const path = query ? `/admin/users?${query}` : '/admin/users'
  const result = await apiRequestResult<AdminUserListItem[]>(path, { method: 'GET', signal })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}

export async function fetchAdminUser(
  id: number | string,
  signal?: AbortSignal,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${id}`, { method: 'GET', signal })
}

export async function restrictAdminUser(
  id: number | string,
  payload: UserStatusActionPayload,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${id}/restrict`, {
    method: 'POST',
    body: payload,
  })
}

export async function suspendAdminUser(
  id: number | string,
  payload: UserStatusActionPayload,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${id}/suspend`, {
    method: 'POST',
    body: payload,
  })
}

export async function restoreAdminUser(
  id: number | string,
  payload: UserStatusActionPayload,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${id}/restore`, {
    method: 'POST',
    body: payload,
  })
}

export async function banAdminUser(
  id: number | string,
  payload: UserStatusActionPayload,
): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${id}/ban`, {
    method: 'POST',
    body: payload,
  })
}
