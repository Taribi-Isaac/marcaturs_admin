import type {
  CertificationArtifactStatus,
  CertificationLessonContentType,
  CertificationProgrammeStatus,
  CertificationResourceType,
  CertificationVersionStatus,
} from '@/shared/types/domain'

/**
 * Admin Certification response shapes (MH-BE-CERT-01…10 Admin surface).
 * Fields mirror the Laravel resources exactly — the Admin console never
 * receives storage disks, paths, or signed URLs for private artifacts.
 */

export type CertificationProgrammeVersion = {
  id: number
  programme_id: number
  version_number: number
  status: CertificationVersionStatus | string
  fee_amount_minor: number | null
  fee_currency: string | null
  /** Admin-only field; hidden from Ambassador representations. */
  pass_mark_percent?: string | null
  published_at: string | null
  unpublished_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type CertificationProgramme = {
  id: number
  name: string
  description: string | null
  learning_objectives: string | null
  status: CertificationProgrammeStatus | string
  current_published_version_id: number | null
  current_published_version?: CertificationProgrammeVersion | null
  versions?: CertificationProgrammeVersion[]
  created_at: string | null
  updated_at?: string | null
  created_by_user_id?: number | null
}

export type CertificationResource = {
  id: number
  lesson_id: number
  type: CertificationResourceType | string
  title: string
  sort_order: number
  body_text: string | null
  external_url: string | null
  original_filename: string | null
  mime_type: string | null
  size_bytes: number | null
  /** Presence of a private file only — never the disk or path. */
  has_file: boolean
  created_at?: string | null
  updated_at?: string | null
}

export type CertificationLesson = {
  id: number
  module_id: number
  title: string
  description: string | null
  content_type: CertificationLessonContentType | string
  is_required: boolean
  sort_order: number
  resources?: CertificationResource[]
  created_at?: string | null
  updated_at?: string | null
}

export type CertificationModule = {
  id: number
  programme_version_id: number
  title: string
  description: string | null
  sort_order: number
  lessons?: CertificationLesson[]
  created_at?: string | null
  updated_at?: string | null
}

export type CertificationQuestionOption = {
  id: number
  question_id: number
  label: string
  sort_order: number
  /** Admin-only; the answer key is never exposed to learners. */
  is_correct?: boolean
}

export type CertificationQuestion = {
  id: number
  assessment_id: number
  prompt: string
  type: string
  sort_order: number
  options?: CertificationQuestionOption[]
  created_at?: string | null
  updated_at?: string | null
}

export type CertificationAssessment = {
  id: number
  programme_version_id: number
  title: string
  instructions: string | null
  pass_mark_percent: string | null
  question_count?: number
  questions?: CertificationQuestion[]
  created_at?: string | null
  updated_at?: string | null
}

export type CertificationPlatformPayment = {
  id: number
  reference: string
  purpose: string
  provider: string | null
  status: string
  amount_minor: number | null
  currency: string | null
  duration_days: number | null
  paid_at: string | null
}

export type CertificationEnrollment = {
  id: number
  status: string
  programme_id: number
  programme_version_id: number
  programme?: { id: number; name: string; status: string } | null
  programme_version?: { id: number; version_number: number; status: string } | null
  fee_amount_minor: number | null
  fee_currency: string | null
  enrolled_at: string | null
  payment?: CertificationPlatformPayment | null
  user?: { id: number; name: string; email: string } | null
  created_at?: string | null
}

export type CertificationAttemptAnswer = {
  question_id: number
  selected_option_id: number | null
  /** Admin-only marking outcome. */
  is_correct?: boolean
}

export type CertificationAssessmentAttempt = {
  id: number
  enrollment_id: number
  assessment_id: number
  programme_version_id: number
  attempt_number: number
  status: string
  started_at: string | null
  submitted_at: string | null
  pass_mark_percent: string | null
  correct_count?: number | null
  total_questions?: number | null
  score_percent?: string | null
  passed?: boolean | null
  assessment?: { id: number; title: string; programme_version_id: number } | null
  answers?: CertificationAttemptAnswer[]
  created_at?: string | null
}

export type CertificationAward = {
  id: number
  status: string
  user_id: number
  programme_id: number
  programme_version_id: number
  enrollment_id: number
  assessment_attempt_id: number | null
  awarded_at: string | null
  programme?: { id: number; name: string; status: string } | null
  programme_version?: { id: number; version_number: number; status: string } | null
  assessment_attempt?: {
    id: number
    attempt_number: number
    score_percent: string | null
    passed: boolean | null
    submitted_at: string | null
  } | null
  user?: { id: number; name: string; email: string } | null
  created_at?: string | null
}

export type CertificationCertificate = {
  id: number
  award_id: number
  certificate_number: string
  status: string
  issued_at: string | null
  recipient_name: string | null
  programme_name: string | null
  programme_version_number: number | null
  issuer_name: string | null
  artifact_status: CertificationArtifactStatus | string
  artifact_generated_at: string | null
  /** Whether a generated PDF can be streamed; no storage location is exposed. */
  artifact_available: boolean
  artifact_error_code?: string | null
  artifact_failed_at?: string | null
  award?: {
    id: number
    status: string
    programme_id: number
    programme_version_id: number
    enrollment_id: number
    assessment_attempt_id: number | null
    awarded_at: string | null
    user?: { id: number; name: string; email: string } | null
  } | null
  created_at?: string | null
}

export type CertificationProgrammePayload = {
  name?: string
  description?: string | null
  learning_objectives?: string | null
  status?: 'archived' | 'unpublished'
}

export type CertificationVersionPayload = {
  fee_amount_minor?: number | null
  fee_currency?: string
  pass_mark_percent?: string | null
}

export type CertificationModulePayload = {
  title?: string
  description?: string | null
}

export type CertificationLessonPayload = {
  title?: string
  description?: string | null
  content_type?: CertificationLessonContentType
  is_required?: boolean
}

export type CertificationAssessmentPayload = {
  title?: string
  instructions?: string | null
}

export type CertificationQuestionPayload = {
  prompt?: string
  type?: string
  options?: Array<{ label: string; is_correct: boolean }>
}

export type CertificationEnrollmentListParams = {
  programme_id?: number
}
