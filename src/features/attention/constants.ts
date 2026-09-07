import type { DisputeStatus, VerificationSubmissionStatus } from '@/shared/types/domain'

/** Admin-actionable verification statuses (backend enum values). */
export const ATTENTION_VERIFICATION_STATUSES = [
  'pending',
  'under_review',
] as const satisfies readonly VerificationSubmissionStatus[]

/** Open dispute statuses that still require Admin work. */
export const ATTENTION_DISPUTE_STATUSES = [
  'submitted',
  'under_review',
  'evidence_requested',
  'decision_pending',
] as const satisfies readonly DisputeStatus[]

export const ATTENTION_QUERY_KEYS = {
  all: ['attention'] as const,
  verification: ['attention', 'verification'] as const,
  campaigns: ['attention', 'campaigns'] as const,
  disputes: ['attention', 'disputes'] as const,
  conversations: ['attention', 'conversations'] as const,
}

export const ATTENTION_DESTINATIONS = {
  verification: '/verification',
  campaigns: '/campaigns',
  disputes: '/disputes',
  conversations: '/moderation/reported-conversations',
} as const
