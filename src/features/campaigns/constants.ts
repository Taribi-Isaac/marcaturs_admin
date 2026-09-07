import { campaignStatuses, type CampaignStatus } from '@/shared/types/domain'

export const CAMPAIGN_QUERY_KEYS = {
  all: ['campaigns'] as const,
  list: (params: { status?: string; page?: number }) => ['campaigns', 'list', params] as const,
  detail: (id: number | string) => ['campaigns', 'detail', String(id)] as const,
  resources: (id: number | string) => ['campaigns', 'resources', String(id)] as const,
  featured: (id: number | string) => ['campaigns', 'featured', String(id)] as const,
  extensions: (id: number | string) => ['campaigns', 'extensions', String(id)] as const,
}

export const CAMPAIGN_STATUS_FILTER_OPTIONS: Array<{
  value: 'all' | CampaignStatus
  label: string
}> = [
  { value: 'all', label: 'All statuses' },
  ...campaignStatuses.map((status) => ({ value: status, label: status })),
]

export function campaignDetailPath(id: number | string): string {
  return `/campaigns/${id}`
}

export function canApprove(status: string): boolean {
  return status === 'submitted'
}

export function canReject(status: string): boolean {
  return status === 'submitted'
}

export function canRequestModification(status: string): boolean {
  return status === 'submitted'
}

export function canActivate(status: string): boolean {
  return status === 'approved'
}

export function canSuspend(status: string): boolean {
  return status === 'active' || status === 'expiring'
}

export function canClose(status: string): boolean {
  return (
    status === 'submitted' ||
    status === 'approved' ||
    status === 'active' ||
    status === 'expiring' ||
    status === 'suspended'
  )
}

export function hasAnyCampaignAction(status: string): boolean {
  return (
    canApprove(status) ||
    canReject(status) ||
    canRequestModification(status) ||
    canActivate(status) ||
    canSuspend(status) ||
    canClose(status)
  )
}
