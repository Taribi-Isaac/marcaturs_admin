import { accountStatuses, type AccountStatus } from '@/shared/types/domain'
import type { StaffRole } from '@/shared/types/auth'
import type { StaffStatusAction } from '@/features/staff/types'

export const STAFF_QUERY_KEYS = {
  all: ['staff'] as const,
  list: (params: {
    staff_role?: string
    status?: string
    q?: string
    page?: number
    per_page?: number
  }) => ['staff', 'list', params] as const,
  detail: (id: number | string) => ['staff', 'detail', String(id)] as const,
}

export const STAFF_ROLES: StaffRole[] = ['SUPER_ADMIN', 'OPERATIONS', 'VERIFICATION', 'MODERATION']

export const STAFF_ROLE_FILTER_OPTIONS: Array<{ value: 'all' | StaffRole; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'VERIFICATION', label: 'Verification' },
  { value: 'MODERATION', label: 'Moderation' },
]

export const STAFF_STATUS_FILTER_OPTIONS: Array<{ value: 'all' | AccountStatus; label: string }> = [
  { value: 'all', label: 'All' },
  ...accountStatuses.map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  })),
]

export const DEFAULT_STAFF_PER_PAGE = 15
export const MAX_STAFF_PER_PAGE = 100

export function staffDetailPath(id: number | string): string {
  return `/staff/${id}`
}

export function canDisableStaff(status: string): boolean {
  return status === 'active' || status === 'restricted'
}

export function canRestoreStaff(status: string): boolean {
  return status === 'suspended'
}

export function hasAnyStaffStatusAction(status: string): boolean {
  return canDisableStaff(status) || canRestoreStaff(status)
}

export function resultingStaffStatus(
  action: StaffStatusAction,
  currentStatus: string,
): AccountStatus | null {
  if (action === 'disable' && (currentStatus === 'active' || currentStatus === 'restricted')) {
    return 'suspended'
  }
  if (action === 'restore' && currentStatus === 'suspended') {
    return 'active'
  }
  return null
}

export function isSuperAdminRoleTransition(
  currentRole: StaffRole | null | undefined,
  nextRole: StaffRole,
): boolean {
  return currentRole === 'SUPER_ADMIN' || nextRole === 'SUPER_ADMIN'
}
