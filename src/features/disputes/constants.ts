import { ATTENTION_DISPUTE_STATUSES } from '@/features/attention/constants'
import type { DisputeStatus } from '@/shared/types/domain'
import type { DisputeQueueView } from '@/features/disputes/types'

export const DISPUTE_QUERY_KEYS = {
  all: ['disputes'] as const,
  list: (params: { page?: number; view?: DisputeQueueView }) =>
    ['disputes', 'list', params] as const,
  detail: (id: number | string) => ['disputes', 'detail', String(id)] as const,
}

export const DISPUTE_QUEUE_VIEW_OPTIONS: Array<{ value: DisputeQueueView; label: string }> = [
  { value: 'actionable', label: 'Needs Admin action (this page)' },
  { value: 'historical', label: 'Resolved / closed (this page)' },
  { value: 'all', label: 'All on this page' },
]

export const ACTIONABLE_DISPUTE_STATUSES = ATTENTION_DISPUTE_STATUSES

export const HISTORICAL_DISPUTE_STATUSES = [
  'resolved',
  'closed',
] as const satisfies readonly DisputeStatus[]

export function disputeDetailPath(id: number | string): string {
  return `/disputes/${id}`
}

export function isActionableDisputeStatus(status: string): boolean {
  return (ACTIONABLE_DISPUTE_STATUSES as readonly string[]).includes(status)
}

export function isHistoricalDisputeStatus(status: string): boolean {
  return (HISTORICAL_DISPUTE_STATUSES as readonly string[]).includes(status)
}

export function canStartReview(status: string): boolean {
  return status === 'submitted'
}

export function canRequestEvidence(status: string): boolean {
  return status === 'under_review' || status === 'decision_pending'
}

export function canResumeReview(status: string): boolean {
  return status === 'evidence_requested'
}

export function canMarkDecisionPending(status: string): boolean {
  return status === 'under_review'
}

export function canResolve(status: string): boolean {
  return status === 'decision_pending'
}

export function canClose(status: string): boolean {
  return status === 'resolved'
}

export function hasAnyDisputeAction(status: string): boolean {
  return (
    canStartReview(status) ||
    canRequestEvidence(status) ||
    canResumeReview(status) ||
    canMarkDecisionPending(status) ||
    canResolve(status) ||
    canClose(status)
  )
}
