import type { VerificationSubmissionStatus } from '@/shared/types/domain'
import type { VerificationRequirementType } from '@/features/verification/types'

export const VERIFICATION_QUERY_KEYS = {
  all: ['verification'] as const,
  submissions: (params: { status?: string; page?: number }) =>
    ['verification', 'submissions', params] as const,
  submission: (id: number | string) => ['verification', 'submission', String(id)] as const,
  events: (id: number | string) => ['verification', 'events', String(id)] as const,
  requirements: ['verification', 'requirements'] as const,
}

export const VERIFICATION_STATUS_OPTIONS: Array<{
  value: '' | VerificationSubmissionStatus
  label: string
}> = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'pending' },
  { value: 'under_review', label: 'under_review' },
  { value: 'approved', label: 'approved' },
  { value: 'rejected', label: 'rejected' },
  { value: 'more_information_required', label: 'more_information_required' },
]

export const VERIFICATION_REQUIREMENT_TYPES: VerificationRequirementType[] = [
  'text',
  'document',
  'email',
  'phone',
  'other',
]

export const VERIFICATION_PARTICIPANT_TYPES = ['BUSINESS', 'AMBASSADOR'] as const

export function canStartReview(status: string): boolean {
  return status === 'pending'
}

export function canReviewSubmission(status: string): boolean {
  return status === 'pending' || status === 'under_review'
}

export function submissionDetailPath(id: number | string): string {
  return `/verification/submissions/${id}`
}
