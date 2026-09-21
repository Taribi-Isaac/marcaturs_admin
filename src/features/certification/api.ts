import { ApiClientError, apiDownload, apiRequest } from '@/shared/api'
import type {
  CertificationAssessment,
  CertificationAssessmentAttempt,
  CertificationAssessmentPayload,
  CertificationAward,
  CertificationCertificate,
  CertificationEnrollment,
  CertificationEnrollmentListParams,
  CertificationLesson,
  CertificationLessonPayload,
  CertificationModule,
  CertificationModulePayload,
  CertificationProgramme,
  CertificationProgrammePayload,
  CertificationProgrammeVersion,
  CertificationQuestion,
  CertificationQuestionPayload,
  CertificationResource,
  CertificationVersionPayload,
} from '@/features/certification/types'

/**
 * Admin Certification transport.
 *
 * Programme version paths are keyed by `version_number` (the backend binds
 * `CertificationProgrammeVersion` on its route key), never by version id.
 */
const PROGRAMMES = '/admin/certification/programmes'

function versionBase(programmeId: number | string, versionNumber: number | string): string {
  return `${PROGRAMMES}/${programmeId}/versions/${versionNumber}`
}

function moduleBase(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
): string {
  return `${versionBase(programmeId, versionNumber)}/modules/${moduleId}`
}

function lessonBase(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  lessonId: number | string,
): string {
  return `${moduleBase(programmeId, versionNumber, moduleId)}/lessons/${lessonId}`
}

/* Programmes ------------------------------------------------------------- */

export async function fetchCertificationProgrammes(
  signal?: AbortSignal,
): Promise<CertificationProgramme[]> {
  return apiRequest<CertificationProgramme[]>(PROGRAMMES, { method: 'GET', signal })
}

export async function fetchCertificationProgramme(
  programmeId: number | string,
  signal?: AbortSignal,
): Promise<CertificationProgramme> {
  return apiRequest<CertificationProgramme>(`${PROGRAMMES}/${programmeId}`, {
    method: 'GET',
    signal,
  })
}

export async function createCertificationProgramme(
  payload: CertificationProgrammePayload,
): Promise<CertificationProgramme> {
  return apiRequest<CertificationProgramme>(PROGRAMMES, { method: 'POST', body: payload })
}

export async function updateCertificationProgramme(
  programmeId: number | string,
  payload: CertificationProgrammePayload,
): Promise<CertificationProgramme> {
  return apiRequest<CertificationProgramme>(`${PROGRAMMES}/${programmeId}`, {
    method: 'PATCH',
    body: payload,
  })
}

/* Programme versions ----------------------------------------------------- */

export async function fetchCertificationVersions(
  programmeId: number | string,
  signal?: AbortSignal,
): Promise<CertificationProgrammeVersion[]> {
  return apiRequest<CertificationProgrammeVersion[]>(`${PROGRAMMES}/${programmeId}/versions`, {
    method: 'GET',
    signal,
  })
}

export async function fetchCertificationVersion(
  programmeId: number | string,
  versionNumber: number | string,
  signal?: AbortSignal,
): Promise<CertificationProgrammeVersion> {
  return apiRequest<CertificationProgrammeVersion>(versionBase(programmeId, versionNumber), {
    method: 'GET',
    signal,
  })
}

export async function createCertificationVersion(
  programmeId: number | string,
  payload: CertificationVersionPayload,
): Promise<CertificationProgrammeVersion> {
  return apiRequest<CertificationProgrammeVersion>(`${PROGRAMMES}/${programmeId}/versions`, {
    method: 'POST',
    body: payload,
  })
}

export async function updateCertificationVersion(
  programmeId: number | string,
  versionNumber: number | string,
  payload: CertificationVersionPayload,
): Promise<CertificationProgrammeVersion> {
  return apiRequest<CertificationProgrammeVersion>(versionBase(programmeId, versionNumber), {
    method: 'PATCH',
    body: payload,
  })
}

export async function publishCertificationVersion(
  programmeId: number | string,
  versionNumber: number | string,
): Promise<CertificationProgrammeVersion> {
  return apiRequest<CertificationProgrammeVersion>(
    `${versionBase(programmeId, versionNumber)}/publish`,
    { method: 'POST' },
  )
}

export async function unpublishCertificationVersion(
  programmeId: number | string,
  versionNumber: number | string,
): Promise<CertificationProgrammeVersion> {
  return apiRequest<CertificationProgrammeVersion>(
    `${versionBase(programmeId, versionNumber)}/unpublish`,
    { method: 'POST' },
  )
}

/* Curriculum ------------------------------------------------------------- */

/** Modules arrive with nested lessons and resources, so one call renders the tree. */
export async function fetchCertificationModules(
  programmeId: number | string,
  versionNumber: number | string,
  signal?: AbortSignal,
): Promise<CertificationModule[]> {
  return apiRequest<CertificationModule[]>(`${versionBase(programmeId, versionNumber)}/modules`, {
    method: 'GET',
    signal,
  })
}

export async function createCertificationModule(
  programmeId: number | string,
  versionNumber: number | string,
  payload: CertificationModulePayload,
): Promise<CertificationModule> {
  return apiRequest<CertificationModule>(`${versionBase(programmeId, versionNumber)}/modules`, {
    method: 'POST',
    body: payload,
  })
}

export async function updateCertificationModule(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  payload: CertificationModulePayload,
): Promise<CertificationModule> {
  return apiRequest<CertificationModule>(moduleBase(programmeId, versionNumber, moduleId), {
    method: 'PATCH',
    body: payload,
  })
}

export async function deleteCertificationModule(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(moduleBase(programmeId, versionNumber, moduleId), {
    method: 'DELETE',
  })
}

export async function reorderCertificationModules(
  programmeId: number | string,
  versionNumber: number | string,
  moduleIds: number[],
): Promise<CertificationModule[]> {
  return apiRequest<CertificationModule[]>(
    `${versionBase(programmeId, versionNumber)}/modules/reorder`,
    { method: 'POST', body: { module_ids: moduleIds } },
  )
}

export async function createCertificationLesson(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  payload: CertificationLessonPayload,
): Promise<CertificationLesson> {
  return apiRequest<CertificationLesson>(
    `${moduleBase(programmeId, versionNumber, moduleId)}/lessons`,
    { method: 'POST', body: payload },
  )
}

export async function updateCertificationLesson(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  lessonId: number | string,
  payload: CertificationLessonPayload,
): Promise<CertificationLesson> {
  return apiRequest<CertificationLesson>(
    lessonBase(programmeId, versionNumber, moduleId, lessonId),
    { method: 'PATCH', body: payload },
  )
}

export async function deleteCertificationLesson(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  lessonId: number | string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(
    lessonBase(programmeId, versionNumber, moduleId, lessonId),
    { method: 'DELETE' },
  )
}

export async function reorderCertificationLessons(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  lessonIds: number[],
): Promise<CertificationLesson[]> {
  return apiRequest<CertificationLesson[]>(
    `${moduleBase(programmeId, versionNumber, moduleId)}/lessons/reorder`,
    { method: 'POST', body: { lesson_ids: lessonIds } },
  )
}

/**
 * Resource create/update are multipart because `downloadable` resources carry a
 * file. The backend exposes update over POST (not PATCH) for the same reason.
 */
export async function createCertificationResource(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  lessonId: number | string,
  body: FormData,
): Promise<CertificationResource> {
  return apiRequest<CertificationResource>(
    `${lessonBase(programmeId, versionNumber, moduleId, lessonId)}/resources`,
    { method: 'POST', body },
  )
}

export async function updateCertificationResource(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  lessonId: number | string,
  resourceId: number | string,
  body: FormData,
): Promise<CertificationResource> {
  return apiRequest<CertificationResource>(
    `${lessonBase(programmeId, versionNumber, moduleId, lessonId)}/resources/${resourceId}`,
    { method: 'POST', body },
  )
}

export async function deleteCertificationResource(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  lessonId: number | string,
  resourceId: number | string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(
    `${lessonBase(programmeId, versionNumber, moduleId, lessonId)}/resources/${resourceId}`,
    { method: 'DELETE' },
  )
}

export async function reorderCertificationResources(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  lessonId: number | string,
  resourceIds: number[],
): Promise<CertificationResource[]> {
  return apiRequest<CertificationResource[]>(
    `${lessonBase(programmeId, versionNumber, moduleId, lessonId)}/resources/reorder`,
    { method: 'POST', body: { resource_ids: resourceIds } },
  )
}

export async function downloadCertificationResource(
  programmeId: number | string,
  versionNumber: number | string,
  moduleId: number | string,
  lessonId: number | string,
  resourceId: number | string,
  signal?: AbortSignal,
) {
  return apiDownload(
    `${lessonBase(programmeId, versionNumber, moduleId, lessonId)}/resources/${resourceId}/download`,
    { signal },
  )
}

/* Assessment ------------------------------------------------------------- */

/**
 * Returns `null` when the version has no assessment yet — the backend answers
 * 404 in that case, which is a normal authoring state rather than an error.
 */
export async function fetchCertificationAssessment(
  programmeId: number | string,
  versionNumber: number | string,
  signal?: AbortSignal,
): Promise<CertificationAssessment | null> {
  try {
    return await apiRequest<CertificationAssessment>(
      `${versionBase(programmeId, versionNumber)}/assessment`,
      { method: 'GET', signal },
    )
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function createCertificationAssessment(
  programmeId: number | string,
  versionNumber: number | string,
  payload: CertificationAssessmentPayload,
): Promise<CertificationAssessment> {
  return apiRequest<CertificationAssessment>(
    `${versionBase(programmeId, versionNumber)}/assessment`,
    { method: 'POST', body: payload },
  )
}

export async function updateCertificationAssessment(
  programmeId: number | string,
  versionNumber: number | string,
  payload: CertificationAssessmentPayload,
): Promise<CertificationAssessment> {
  return apiRequest<CertificationAssessment>(
    `${versionBase(programmeId, versionNumber)}/assessment`,
    { method: 'PATCH', body: payload },
  )
}

export async function createCertificationQuestion(
  programmeId: number | string,
  versionNumber: number | string,
  payload: CertificationQuestionPayload,
): Promise<CertificationQuestion> {
  return apiRequest<CertificationQuestion>(
    `${versionBase(programmeId, versionNumber)}/assessment/questions`,
    { method: 'POST', body: payload },
  )
}

export async function updateCertificationQuestion(
  programmeId: number | string,
  versionNumber: number | string,
  questionId: number | string,
  payload: CertificationQuestionPayload,
): Promise<CertificationQuestion> {
  return apiRequest<CertificationQuestion>(
    `${versionBase(programmeId, versionNumber)}/assessment/questions/${questionId}`,
    { method: 'PATCH', body: payload },
  )
}

export async function deleteCertificationQuestion(
  programmeId: number | string,
  versionNumber: number | string,
  questionId: number | string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(
    `${versionBase(programmeId, versionNumber)}/assessment/questions/${questionId}`,
    { method: 'DELETE' },
  )
}

export async function reorderCertificationQuestions(
  programmeId: number | string,
  versionNumber: number | string,
  questionIds: number[],
): Promise<CertificationQuestion[]> {
  return apiRequest<CertificationQuestion[]>(
    `${versionBase(programmeId, versionNumber)}/assessment/questions/reorder`,
    { method: 'POST', body: { question_ids: questionIds } },
  )
}

/* Learners --------------------------------------------------------------- */

export async function fetchCertificationEnrollments(
  params: CertificationEnrollmentListParams = {},
  signal?: AbortSignal,
): Promise<CertificationEnrollment[]> {
  const search = new URLSearchParams()
  if (params.programme_id) {
    search.set('programme_id', String(params.programme_id))
  }
  const query = search.toString()
  const path = query
    ? `/admin/certification/enrollments?${query}`
    : '/admin/certification/enrollments'

  return apiRequest<CertificationEnrollment[]>(path, { method: 'GET', signal })
}

export async function fetchCertificationEnrollment(
  enrollmentId: number | string,
  signal?: AbortSignal,
): Promise<CertificationEnrollment> {
  return apiRequest<CertificationEnrollment>(`/admin/certification/enrollments/${enrollmentId}`, {
    method: 'GET',
    signal,
  })
}

export async function fetchCertificationAttempts(
  enrollmentId: number | string,
  signal?: AbortSignal,
): Promise<CertificationAssessmentAttempt[]> {
  return apiRequest<CertificationAssessmentAttempt[]>(
    `/admin/certification/enrollments/${enrollmentId}/assessment/attempts`,
    { method: 'GET', signal },
  )
}

export async function fetchCertificationAttempt(
  enrollmentId: number | string,
  attemptId: number | string,
  signal?: AbortSignal,
): Promise<CertificationAssessmentAttempt> {
  return apiRequest<CertificationAssessmentAttempt>(
    `/admin/certification/enrollments/${enrollmentId}/assessment/attempts/${attemptId}`,
    { method: 'GET', signal },
  )
}

export async function fetchCertificationEnrollmentAwards(
  enrollmentId: number | string,
  signal?: AbortSignal,
): Promise<CertificationAward[]> {
  return apiRequest<CertificationAward[]>(
    `/admin/certification/enrollments/${enrollmentId}/awards`,
    { method: 'GET', signal },
  )
}

export async function fetchCertificationEnrollmentCertificates(
  enrollmentId: number | string,
  signal?: AbortSignal,
): Promise<CertificationCertificate[]> {
  return apiRequest<CertificationCertificate[]>(
    `/admin/certification/enrollments/${enrollmentId}/certificates`,
    { method: 'GET', signal },
  )
}

export async function fetchCertificationAward(
  awardId: number | string,
  signal?: AbortSignal,
): Promise<CertificationAward> {
  return apiRequest<CertificationAward>(`/admin/certification/awards/${awardId}`, {
    method: 'GET',
    signal,
  })
}

export async function fetchCertificationCertificate(
  certificateId: number | string,
  signal?: AbortSignal,
): Promise<CertificationCertificate> {
  return apiRequest<CertificationCertificate>(
    `/admin/certification/certificates/${certificateId}`,
    { method: 'GET', signal },
  )
}

export async function downloadCertificationCertificate(
  certificateId: number | string,
  signal?: AbortSignal,
) {
  return apiDownload(`/admin/certification/certificates/${certificateId}/download`, { signal })
}

/** Requires `certification.manage`; only valid while the artifact is retryable. */
export async function retryCertificationCertificateArtifact(
  certificateId: number | string,
): Promise<CertificationCertificate> {
  return apiRequest<CertificationCertificate>(
    `/admin/certification/certificates/${certificateId}/artifact/retry`,
    { method: 'POST' },
  )
}
