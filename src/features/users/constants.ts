import { accountStatuses, type AccountStatus } from '@/shared/types/domain'
import type { ParticipantRole, UserStatusAction } from '@/features/users/types'

export const USER_QUERY_KEYS = {
  all: ['users'] as const,
  list: (params: {
    role?: string
    status?: string
    q?: string
    page?: number
    per_page?: number
  }) => ['users', 'list', params] as const,
  detail: (id: number | string) => ['users', 'detail', String(id)] as const,
}

export const USER_ROLE_FILTER_OPTIONS: Array<{ value: 'all' | ParticipantRole; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'AMBASSADOR', label: 'Ambassador' },
]

export const USER_STATUS_FILTER_OPTIONS: Array<{ value: 'all' | AccountStatus; label: string }> = [
  { value: 'all', label: 'All' },
  ...accountStatuses.map((status) => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1),
  })),
]

export const DEFAULT_USERS_PER_PAGE = 15
export const MAX_USERS_PER_PAGE = 100

export function userDetailPath(id: number | string): string {
  return `/users/${id}`
}

export function canRestrict(status: string): boolean {
  return status === 'active'
}

export function canSuspend(status: string): boolean {
  return status === 'active' || status === 'restricted'
}

export function canBan(status: string): boolean {
  return status === 'active' || status === 'restricted' || status === 'suspended'
}

export function canRestore(status: string): boolean {
  return status === 'restricted' || status === 'suspended' || status === 'banned'
}

export function hasAnyUserStatusAction(status: string): boolean {
  return canRestrict(status) || canSuspend(status) || canBan(status) || canRestore(status)
}

export function resultingStatus(
  action: UserStatusAction,
  currentStatus: string,
): AccountStatus | null {
  switch (action) {
    case 'restrict':
      return currentStatus === 'active' ? 'restricted' : null
    case 'suspend':
      return currentStatus === 'active' || currentStatus === 'restricted' ? 'suspended' : null
    case 'ban':
      return currentStatus === 'active' ||
        currentStatus === 'restricted' ||
        currentStatus === 'suspended'
        ? 'banned'
        : null
    case 'restore':
      if (currentStatus === 'restricted' || currentStatus === 'suspended') {
        return 'active'
      }
      if (currentStatus === 'banned') {
        return 'restricted'
      }
      return null
    default:
      return null
  }
}

export const USER_STATUS_ACTIONS: UserStatusAction[] = ['restrict', 'suspend', 'restore', 'ban']
