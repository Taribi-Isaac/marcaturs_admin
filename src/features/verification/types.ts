import type { VerificationSubmissionStatus } from '@/shared/types/domain'

export type VerificationRequirementType = 'text' | 'document' | 'email' | 'phone' | 'other'

export type VerificationParticipantType = 'BUSINESS' | 'AMBASSADOR'

export type VerificationReviewAction =
  'submitted' | 'resubmitted' | 'started_review' | 'approved' | 'rejected' | 'requested_information'

export type VerificationParty = {
  id: number
  name: string
  email: string
  role: string
}

export type VerificationRequirement = {
  id: number
  name: string
  description: string | null
  participant_type: VerificationParticipantType
  requirement_type: VerificationRequirementType
  is_required: boolean
  is_active: boolean
  sort_order: number
  config: Record<string, unknown> | null
}

export type VerificationEvidence = {
  id: number
  original_filename: string
  mime_type: string
  size_bytes: number
  created_at: string | null
}

export type VerificationSubmission = {
  id: number
  user_id: number
  user?: VerificationParty | null
  requirement?: VerificationRequirement | null
  status: VerificationSubmissionStatus
  text_value: string | null
  current_version: number
  review_reason: string | null
  reviewer_notes: string | null
  reviewed_at: string | null
  submitted_at: string | null
  evidence?: VerificationEvidence[]
}

export type VerificationReviewEvent = {
  id: number
  actor_id: number | null
  action: VerificationReviewAction | string
  previous_status: string | null
  new_status: string
  reason: string | null
  reviewer_notes: string | null
  created_at: string | null
}

export type CreateVerificationRequirementPayload = {
  name: string
  description?: string | null
  participant_type: VerificationParticipantType
  requirement_type: VerificationRequirementType
  is_required?: boolean
  is_active?: boolean
  sort_order?: number
  config?: Record<string, unknown> | null
}

export type UpdateVerificationRequirementPayload = Partial<CreateVerificationRequirementPayload>

export type ApproveVerificationPayload = {
  notes?: string | null
}

export type ReviewVerificationPayload = {
  reason: string
  notes?: string | null
}

export type VerificationSubmissionListParams = {
  status?: VerificationSubmissionStatus | ''
  page?: number
}
