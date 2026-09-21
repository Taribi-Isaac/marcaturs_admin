import { certificationLessonContentTypes, certificationResourceTypes } from '@/shared/types/domain'
import { formatStatusLabel } from '@/shared/lib/status'

export const CERTIFICATION_QUERY_KEYS = {
  all: ['certification'] as const,
  programmes: () => ['certification', 'programmes'] as const,
  programme: (programmeId: number | string) =>
    ['certification', 'programme', String(programmeId)] as const,
  version: (programmeId: number | string, versionNumber: number | string) =>
    ['certification', 'version', String(programmeId), String(versionNumber)] as const,
  modules: (programmeId: number | string, versionNumber: number | string) =>
    ['certification', 'modules', String(programmeId), String(versionNumber)] as const,
  assessment: (programmeId: number | string, versionNumber: number | string) =>
    ['certification', 'assessment', String(programmeId), String(versionNumber)] as const,
  enrollments: (programmeId?: number) =>
    ['certification', 'enrollments', programmeId ?? 'all'] as const,
  enrollment: (enrollmentId: number | string) =>
    ['certification', 'enrollment', String(enrollmentId)] as const,
  attempts: (enrollmentId: number | string) =>
    ['certification', 'attempts', String(enrollmentId)] as const,
  attempt: (enrollmentId: number | string, attemptId: number | string) =>
    ['certification', 'attempt', String(enrollmentId), String(attemptId)] as const,
  awards: (enrollmentId: number | string) =>
    ['certification', 'awards', String(enrollmentId)] as const,
  certificates: (enrollmentId: number | string) =>
    ['certification', 'certificates', String(enrollmentId)] as const,
  award: (awardId: number | string) => ['certification', 'award', String(awardId)] as const,
  certificate: (certificateId: number | string) =>
    ['certification', 'certificate', String(certificateId)] as const,
}

export const CERTIFICATION_PROGRAMMES_PATH = '/certification/programmes'
export const CERTIFICATION_LEARNERS_PATH = '/certification/learners'

export function certificationProgrammePath(programmeId: number | string): string {
  return `${CERTIFICATION_PROGRAMMES_PATH}/${programmeId}`
}

export function certificationVersionPath(
  programmeId: number | string,
  versionNumber: number | string,
): string {
  return `${CERTIFICATION_PROGRAMMES_PATH}/${programmeId}/versions/${versionNumber}`
}

export function certificationLearnerPath(enrollmentId: number | string): string {
  return `${CERTIFICATION_LEARNERS_PATH}/${enrollmentId}`
}

export function certificationCertificatePath(certificateId: number | string): string {
  return `/certification/certificates/${certificateId}`
}

export const LESSON_CONTENT_TYPE_OPTIONS = certificationLessonContentTypes.map((value) => ({
  value,
  label: formatStatusLabel(value),
}))

export const RESOURCE_TYPE_OPTIONS = certificationResourceTypes.map((value) => ({
  value,
  label: formatStatusLabel(value),
}))

/** The backend only supports single-choice questions today (MH-BE-CERT-04). */
export const QUESTION_TYPE_OPTIONS = [{ value: 'single_choice', label: 'Single choice' }] as const

export const CERTIFICATION_FEE_CURRENCY_OPTIONS = ['NGN'] as const

/**
 * Actions intentionally absent from this console, documented so reviewers do not
 * read them as missing work. See docs/certification.md.
 */
export const CERTIFICATION_UNAVAILABLE_ACTIONS = [
  'Awards and passes are earned by learners through scored attempts; there is no manual award or manual pass.',
  'Certificates cannot be revoked — the backend exposes no revocation endpoint.',
  'Lesson progress is not inspectable: there is no Admin lesson-progress API.',
  'Published and unpublished programme versions are immutable; content changes require a new draft version.',
] as const
