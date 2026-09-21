import { apiRequest, apiRequestResult } from '@/shared/api'
import type {
  AcceptStaffInvitationPayload,
  AdminStaffDetail,
  AdminStaffInvitation,
  AdminStaffListItem,
  ChangeStaffRolePayload,
  InviteStaffPayload,
  StaffListParams,
  StaffStatusActionPayload,
} from '@/features/staff/types'
import type { AuthUser } from '@/shared/types/auth'

export type StaffListResult = {
  items: AdminStaffListItem[]
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
  }
}

export async function fetchAdminStaff(
  params: StaffListParams = {},
  signal?: AbortSignal,
): Promise<StaffListResult> {
  const search = new URLSearchParams()
  if (params.staff_role) {
    search.set('staff_role', params.staff_role)
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
  const path = query ? `/admin/staff?${query}` : '/admin/staff'
  const result = await apiRequestResult<AdminStaffListItem[]>(path, { method: 'GET', signal })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}

export async function fetchAdminStaffMember(
  id: number | string,
  signal?: AbortSignal,
): Promise<AdminStaffDetail> {
  return apiRequest<AdminStaffDetail>(`/admin/staff/${id}`, { method: 'GET', signal })
}

export async function inviteAdminStaff(payload: InviteStaffPayload): Promise<AdminStaffInvitation> {
  return apiRequest<AdminStaffInvitation>('/admin/staff/invitations', {
    method: 'POST',
    body: payload,
  })
}

export async function changeAdminStaffRole(
  id: number | string,
  payload: ChangeStaffRolePayload,
): Promise<AdminStaffListItem> {
  return apiRequest<AdminStaffListItem>(`/admin/staff/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function disableAdminStaff(
  id: number | string,
  payload: StaffStatusActionPayload,
): Promise<AdminStaffListItem> {
  return apiRequest<AdminStaffListItem>(`/admin/staff/${id}/disable`, {
    method: 'POST',
    body: payload,
  })
}

export async function restoreAdminStaff(
  id: number | string,
  payload: StaffStatusActionPayload,
): Promise<AdminStaffListItem> {
  return apiRequest<AdminStaffListItem>(`/admin/staff/${id}/restore`, {
    method: 'POST',
    body: payload,
  })
}

export async function acceptStaffInvitation(
  payload: AcceptStaffInvitationPayload,
): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/staff-invitations/accept', {
    method: 'POST',
    body: payload,
    notifyOnUnauthorized: false,
  })
}
