import { http, HttpResponse } from 'msw'
import type {
  CertificationAssessment,
  CertificationAssessmentAttempt,
  CertificationAward,
  CertificationCertificate,
  CertificationEnrollment,
  CertificationModule,
  CertificationProgramme,
  CertificationProgrammeVersion,
} from '@/features/certification/types'

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true as const, data }, { status })
}

function error(status: number, code: string, message: string) {
  return HttpResponse.json({ success: false as const, error: { code, message } }, { status })
}

export const publishedVersion: CertificationProgrammeVersion = {
  id: 11,
  programme_id: 1,
  version_number: 1,
  status: 'published',
  fee_amount_minor: 2500000,
  fee_currency: 'NGN',
  pass_mark_percent: '70.00',
  published_at: '2026-08-01T10:00:00+00:00',
  unpublished_at: null,
  created_at: '2026-07-20T10:00:00+00:00',
  updated_at: '2026-08-01T10:00:00+00:00',
}

export const draftVersion: CertificationProgrammeVersion = {
  id: 12,
  programme_id: 1,
  version_number: 2,
  status: 'draft',
  fee_amount_minor: null,
  fee_currency: 'NGN',
  pass_mark_percent: null,
  published_at: null,
  unpublished_at: null,
  created_at: '2026-08-20T10:00:00+00:00',
  updated_at: '2026-08-20T10:00:00+00:00',
}

export const foundationsProgramme: CertificationProgramme = {
  id: 1,
  name: 'Ambassador Professional Foundations',
  description: 'Core professional practice for MarcatursHub Ambassadors.',
  learning_objectives: 'Understand campaign terms, disclosure, and commission integrity.',
  status: 'published',
  current_published_version_id: 11,
  current_published_version: publishedVersion,
  versions: [publishedVersion, draftVersion],
  created_at: '2026-07-20T10:00:00+00:00',
  updated_at: '2026-08-20T10:00:00+00:00',
  created_by_user_id: 1,
}

export const draftProgramme: CertificationProgramme = {
  id: 2,
  name: 'Advanced Ambassador Practice',
  description: null,
  learning_objectives: null,
  status: 'draft',
  current_published_version_id: null,
  current_published_version: null,
  versions: [],
  created_at: '2026-09-01T10:00:00+00:00',
  updated_at: '2026-09-01T10:00:00+00:00',
  created_by_user_id: 1,
}

const publishedModules: CertificationModule[] = [
  {
    id: 301,
    programme_version_id: 11,
    title: 'Professional conduct',
    description: 'Baseline expectations.',
    sort_order: 1,
    lessons: [
      {
        id: 401,
        module_id: 301,
        title: 'Disclosure obligations',
        description: 'What must be disclosed to customers.',
        content_type: 'text',
        is_required: true,
        sort_order: 1,
        resources: [
          {
            id: 501,
            lesson_id: 401,
            type: 'text',
            title: 'Disclosure primer',
            sort_order: 1,
            body_text: 'Always disclose the commercial relationship.',
            external_url: null,
            original_filename: null,
            mime_type: null,
            size_bytes: null,
            has_file: false,
          },
          {
            id: 502,
            lesson_id: 401,
            type: 'downloadable',
            title: 'Disclosure checklist',
            sort_order: 2,
            body_text: null,
            external_url: null,
            original_filename: 'checklist.pdf',
            mime_type: 'application/pdf',
            size_bytes: 4096,
            has_file: true,
          },
        ],
      },
    ],
  },
]

const draftModules: CertificationModule[] = [
  {
    id: 311,
    programme_version_id: 12,
    title: 'Draft module',
    description: null,
    sort_order: 1,
    lessons: [],
  },
]

const publishedAssessment: CertificationAssessment = {
  id: 601,
  programme_version_id: 11,
  title: 'Foundations final assessment',
  instructions: 'Answer every question. One attempt per sitting.',
  pass_mark_percent: '70.00',
  question_count: 1,
  questions: [
    {
      id: 701,
      assessment_id: 601,
      prompt: 'Must an Ambassador disclose their commercial relationship?',
      type: 'single_choice',
      sort_order: 1,
      options: [
        { id: 801, question_id: 701, label: 'Yes, always', sort_order: 1, is_correct: true },
        { id: 802, question_id: 701, label: 'Only when asked', sort_order: 2, is_correct: false },
      ],
    },
  ],
}

export const activeEnrollment: CertificationEnrollment = {
  id: 901,
  status: 'active',
  programme_id: 1,
  programme_version_id: 11,
  programme: { id: 1, name: 'Ambassador Professional Foundations', status: 'published' },
  programme_version: { id: 11, version_number: 1, status: 'published' },
  fee_amount_minor: 2500000,
  fee_currency: 'NGN',
  enrolled_at: '2026-08-15T10:00:00+00:00',
  payment: {
    id: 1001,
    reference: 'mh_cert_901',
    purpose: 'certification_enrollment',
    provider: 'paystack',
    status: 'paid',
    amount_minor: 2500000,
    currency: 'NGN',
    duration_days: null,
    paid_at: '2026-08-15T10:05:00+00:00',
  },
  user: { id: 116, name: 'Ada Marketer', email: 'ambassador.ada@demo.marcaturshub.test' },
  created_at: '2026-08-15T10:00:00+00:00',
}

export const secondEnrollment: CertificationEnrollment = {
  ...activeEnrollment,
  id: 902,
  programme_id: 2,
  programme_version_id: 21,
  programme: { id: 2, name: 'Advanced Ambassador Practice', status: 'draft' },
  programme_version: { id: 21, version_number: 1, status: 'published' },
  payment: null,
  user: { id: 117, name: 'Chi Marketer', email: 'ambassador.chi@demo.marcaturshub.test' },
}

const passingAttempt: CertificationAssessmentAttempt = {
  id: 1101,
  enrollment_id: 901,
  assessment_id: 601,
  programme_version_id: 11,
  attempt_number: 1,
  status: 'submitted',
  started_at: '2026-08-20T10:00:00+00:00',
  submitted_at: '2026-08-20T10:20:00+00:00',
  pass_mark_percent: '70.00',
  correct_count: 9,
  total_questions: 10,
  score_percent: '90.00',
  passed: true,
  assessment: { id: 601, title: 'Foundations final assessment', programme_version_id: 11 },
  answers: [{ question_id: 701, selected_option_id: 801, is_correct: true }],
  created_at: '2026-08-20T10:00:00+00:00',
}

export const earnedAward: CertificationAward = {
  id: 1201,
  status: 'awarded',
  user_id: 116,
  programme_id: 1,
  programme_version_id: 11,
  enrollment_id: 901,
  assessment_attempt_id: 1101,
  awarded_at: '2026-08-20T10:21:00+00:00',
  programme: { id: 1, name: 'Ambassador Professional Foundations', status: 'published' },
  programme_version: { id: 11, version_number: 1, status: 'published' },
  assessment_attempt: {
    id: 1101,
    attempt_number: 1,
    score_percent: '90.00',
    passed: true,
    submitted_at: '2026-08-20T10:20:00+00:00',
  },
  user: { id: 116, name: 'Ada Marketer', email: 'ambassador.ada@demo.marcaturshub.test' },
  created_at: '2026-08-20T10:21:00+00:00',
}

export const pendingCertificate: CertificationCertificate = {
  id: 1301,
  award_id: 1201,
  certificate_number: 'MH-CERT-0001301',
  status: 'issued',
  issued_at: '2026-08-20T10:21:00+00:00',
  recipient_name: 'Ada Marketer',
  programme_name: 'Ambassador Professional Foundations',
  programme_version_number: 1,
  issuer_name: 'MarcatursHub',
  artifact_status: 'pending_generation',
  artifact_generated_at: null,
  artifact_available: false,
  artifact_error_code: null,
  artifact_failed_at: null,
  award: {
    id: 1201,
    status: 'awarded',
    programme_id: 1,
    programme_version_id: 11,
    enrollment_id: 901,
    assessment_attempt_id: 1101,
    awarded_at: '2026-08-20T10:21:00+00:00',
    user: { id: 116, name: 'Ada Marketer', email: 'ambassador.ada@demo.marcaturshub.test' },
  },
  created_at: '2026-08-20T10:21:00+00:00',
}

export const failedCertificate: CertificationCertificate = {
  ...pendingCertificate,
  id: 1302,
  certificate_number: 'MH-CERT-0001302',
  artifact_status: 'failed_retryable',
  artifact_available: false,
  artifact_error_code: 'renderer_timeout',
  artifact_failed_at: '2026-08-20T10:30:00+00:00',
}

export const generatedCertificate: CertificationCertificate = {
  ...pendingCertificate,
  id: 1303,
  certificate_number: 'MH-CERT-0001303',
  artifact_status: 'generated',
  artifact_generated_at: '2026-08-20T10:25:00+00:00',
  artifact_available: true,
}

type CertificationFixtures = {
  programmes: CertificationProgramme[]
  modules: Record<number, CertificationModule[]>
  assessments: Record<number, CertificationAssessment | null>
  enrollments: CertificationEnrollment[]
  attempts: Record<number, CertificationAssessmentAttempt[]>
  awards: Record<number, CertificationAward[]>
  certificates: CertificationCertificate[]
  enrollmentCertificates: Record<number, number[]>
  failProgrammes: boolean
  failEnrollments: boolean
  missingProgramme: boolean
  forbidProgrammes: boolean
}

function initialFixtures(): CertificationFixtures {
  return {
    programmes: [structuredClone(foundationsProgramme), structuredClone(draftProgramme)],
    // Keyed by version_number within programme 1.
    modules: { 1: structuredClone(publishedModules), 2: structuredClone(draftModules) },
    assessments: { 1: structuredClone(publishedAssessment), 2: null },
    enrollments: [structuredClone(activeEnrollment), structuredClone(secondEnrollment)],
    attempts: { 901: [structuredClone(passingAttempt)], 902: [] },
    awards: { 901: [structuredClone(earnedAward)], 902: [] },
    certificates: [
      structuredClone(pendingCertificate),
      structuredClone(failedCertificate),
      structuredClone(generatedCertificate),
    ],
    enrollmentCertificates: { 901: [1301, 1302, 1303], 902: [] },
    failProgrammes: false,
    failEnrollments: false,
    missingProgramme: false,
    forbidProgrammes: false,
  }
}

export const certificationFixtures: CertificationFixtures = initialFixtures()

export function resetCertificationFixtures(): void {
  Object.assign(certificationFixtures, initialFixtures())
}

function findProgramme(id: number): CertificationProgramme | undefined {
  return certificationFixtures.programmes.find((programme) => programme.id === id)
}

function findVersion(
  programmeId: number,
  versionNumber: number,
): CertificationProgrammeVersion | undefined {
  return findProgramme(programmeId)?.versions?.find(
    (version) => version.version_number === versionNumber,
  )
}

export const certificationHandlers = [
  /* Programmes ----------------------------------------------------------- */

  http.get('/api/v1/admin/certification/programmes', () => {
    if (certificationFixtures.forbidProgrammes) {
      return error(403, 'forbidden', 'Forbidden')
    }
    if (certificationFixtures.failProgrammes) {
      return error(500, 'server_error', 'Programme list failed')
    }
    return ok(certificationFixtures.programmes)
  }),

  http.post('/api/v1/admin/certification/programmes', async ({ request }) => {
    const body = (await request.json()) as {
      name?: string
      description?: string | null
      learning_objectives?: string | null
    }
    if (!body.name) {
      return error(400, 'validation_error', 'The name field is required.')
    }
    const created: CertificationProgramme = {
      id: 3,
      name: body.name,
      description: body.description ?? null,
      learning_objectives: body.learning_objectives ?? null,
      status: 'draft',
      current_published_version_id: null,
      current_published_version: null,
      versions: [],
      created_at: '2026-09-10T10:00:00+00:00',
      updated_at: '2026-09-10T10:00:00+00:00',
      created_by_user_id: 1,
    }
    certificationFixtures.programmes = [...certificationFixtures.programmes, created]
    return ok(created, 201)
  }),

  http.get('/api/v1/admin/certification/programmes/:programmeId', ({ params }) => {
    if (certificationFixtures.missingProgramme) {
      return error(404, 'not_found', 'Programme not found')
    }
    const programme = findProgramme(Number(params.programmeId))
    if (!programme) {
      return error(404, 'not_found', 'Programme not found')
    }
    return ok(programme)
  }),

  http.patch('/api/v1/admin/certification/programmes/:programmeId', async ({ params, request }) => {
    const programme = findProgramme(Number(params.programmeId))
    if (!programme) {
      return error(404, 'not_found', 'Programme not found')
    }
    const body = (await request.json()) as Record<string, unknown>
    Object.assign(programme, body)
    return ok(programme)
  }),

  /* Versions ------------------------------------------------------------- */

  http.get('/api/v1/admin/certification/programmes/:programmeId/versions', ({ params }) => {
    const programme = findProgramme(Number(params.programmeId))
    if (!programme) {
      return error(404, 'not_found', 'Programme not found')
    }
    return ok(programme.versions ?? [])
  }),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions',
    async ({ params, request }) => {
      const programme = findProgramme(Number(params.programmeId))
      if (!programme) {
        return error(404, 'not_found', 'Programme not found')
      }
      const body = (await request.json()) as Record<string, unknown>
      const nextNumber = (programme.versions?.length ?? 0) + 1
      const created: CertificationProgrammeVersion = {
        id: 900 + nextNumber,
        programme_id: programme.id,
        version_number: nextNumber,
        status: 'draft',
        fee_amount_minor: (body.fee_amount_minor as number | null) ?? null,
        fee_currency: (body.fee_currency as string) ?? 'NGN',
        pass_mark_percent: (body.pass_mark_percent as string | null) ?? null,
        published_at: null,
        unpublished_at: null,
        created_at: '2026-09-10T10:00:00+00:00',
        updated_at: '2026-09-10T10:00:00+00:00',
      }
      programme.versions = [...(programme.versions ?? []), created]
      certificationFixtures.modules[nextNumber] = []
      certificationFixtures.assessments[nextNumber] = null
      return ok(created, 201)
    },
  ),

  http.get(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber',
    ({ params }) => {
      const version = findVersion(Number(params.programmeId), Number(params.versionNumber))
      if (!version) {
        return error(404, 'not_found', 'Version not found')
      }
      return ok(version)
    },
  ),

  http.patch(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber',
    async ({ params, request }) => {
      const version = findVersion(Number(params.programmeId), Number(params.versionNumber))
      if (!version) {
        return error(404, 'not_found', 'Version not found')
      }
      if (version.status !== 'draft') {
        return error(409, 'conflict', 'Published and unpublished programme versions are immutable.')
      }
      Object.assign(version, (await request.json()) as Record<string, unknown>)
      return ok(version)
    },
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/publish',
    ({ params }) => {
      const programme = findProgramme(Number(params.programmeId))
      const version = findVersion(Number(params.programmeId), Number(params.versionNumber))
      if (!programme || !version) {
        return error(404, 'not_found', 'Version not found')
      }
      if (version.fee_amount_minor == null || version.pass_mark_percent == null) {
        return error(
          400,
          'validation_error',
          'A programme fee must be configured before publishing.',
        )
      }
      version.status = 'published'
      version.published_at = '2026-09-11T10:00:00+00:00'
      programme.current_published_version_id = version.id
      programme.status = 'published'
      return ok(version)
    },
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/unpublish',
    ({ params }) => {
      const programme = findProgramme(Number(params.programmeId))
      const version = findVersion(Number(params.programmeId), Number(params.versionNumber))
      if (!programme || !version) {
        return error(404, 'not_found', 'Version not found')
      }
      if (version.status !== 'published') {
        return error(409, 'conflict', 'Only published versions can be unpublished.')
      }
      version.status = 'unpublished'
      version.unpublished_at = '2026-09-12T10:00:00+00:00'
      programme.current_published_version_id = null
      programme.status = 'unpublished'
      return ok(version)
    },
  ),

  /* Curriculum ----------------------------------------------------------- */

  http.get(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules',
    ({ params }) => {
      return ok(certificationFixtures.modules[Number(params.versionNumber)] ?? [])
    },
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules',
    async ({ params, request }) => {
      const versionNumber = Number(params.versionNumber)
      const body = (await request.json()) as { title?: string; description?: string | null }
      const list = certificationFixtures.modules[versionNumber] ?? []
      const created: CertificationModule = {
        id: 900 + list.length + 1,
        programme_version_id: versionNumber,
        title: body.title ?? 'Untitled module',
        description: body.description ?? null,
        sort_order: list.length + 1,
        lessons: [],
      }
      certificationFixtures.modules[versionNumber] = [...list, created]
      return ok(created, 201)
    },
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/reorder',
    ({ params }) => ok(certificationFixtures.modules[Number(params.versionNumber)] ?? []),
  ),

  http.patch(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId',
    async ({ params, request }) => {
      const list = certificationFixtures.modules[Number(params.versionNumber)] ?? []
      const module = list.find((item) => item.id === Number(params.moduleId))
      if (!module) {
        return error(404, 'not_found', 'Module not found')
      }
      Object.assign(module, (await request.json()) as Record<string, unknown>)
      return ok(module)
    },
  ),

  http.delete(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId',
    ({ params }) => {
      const versionNumber = Number(params.versionNumber)
      certificationFixtures.modules[versionNumber] = (
        certificationFixtures.modules[versionNumber] ?? []
      ).filter((item) => item.id !== Number(params.moduleId))
      return ok({ deleted: true })
    },
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId/lessons',
    async ({ params, request }) => {
      const list = certificationFixtures.modules[Number(params.versionNumber)] ?? []
      const module = list.find((item) => item.id === Number(params.moduleId))
      if (!module) {
        return error(404, 'not_found', 'Module not found')
      }
      const body = (await request.json()) as Record<string, unknown>
      const lessons = module.lessons ?? []
      const created = {
        id: 1900 + lessons.length + 1,
        module_id: module.id,
        title: (body.title as string) ?? 'Untitled lesson',
        description: (body.description as string | null) ?? null,
        content_type: (body.content_type as string) ?? 'text',
        is_required: (body.is_required as boolean) ?? true,
        sort_order: lessons.length + 1,
        resources: [],
      }
      module.lessons = [...lessons, created]
      return ok(created, 201)
    },
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId/lessons/reorder',
    () => ok([]),
  ),

  http.patch(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId/lessons/:lessonId',
    async ({ request }) => ok((await request.json()) as Record<string, unknown>),
  ),

  http.delete(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId/lessons/:lessonId',
    ({ params }) => {
      const list = certificationFixtures.modules[Number(params.versionNumber)] ?? []
      const module = list.find((item) => item.id === Number(params.moduleId))
      if (module) {
        module.lessons = (module.lessons ?? []).filter(
          (lesson) => lesson.id !== Number(params.lessonId),
        )
      }
      return ok({ deleted: true })
    },
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId/lessons/:lessonId/resources',
    () => ok({ ...publishedModules[0]!.lessons![0]!.resources![0]! }, 201),
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId/lessons/:lessonId/resources/reorder',
    () => ok([]),
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId/lessons/:lessonId/resources/:resourceId',
    () => ok({ ...publishedModules[0]!.lessons![0]!.resources![0]! }),
  ),

  http.delete(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId/lessons/:lessonId/resources/:resourceId',
    () => ok({ deleted: true }),
  ),

  http.get(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/modules/:moduleId/lessons/:lessonId/resources/:resourceId/download',
    () =>
      new HttpResponse(new Uint8Array([37, 80, 68, 70]), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="checklist.pdf"',
        },
      }),
  ),

  /* Assessment ----------------------------------------------------------- */

  http.get(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/assessment',
    ({ params }) => {
      const assessment = certificationFixtures.assessments[Number(params.versionNumber)]
      if (!assessment) {
        return error(404, 'not_found', 'The requested resource was not found.')
      }
      return ok(assessment)
    },
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/assessment',
    async ({ params, request }) => {
      const versionNumber = Number(params.versionNumber)
      const body = (await request.json()) as Record<string, unknown>
      const version = findVersion(Number(params.programmeId), versionNumber)
      const created: CertificationAssessment = {
        id: 6100 + versionNumber,
        programme_version_id: version?.id ?? versionNumber,
        title: (body.title as string) ?? 'Assessment',
        instructions: (body.instructions as string | null) ?? null,
        pass_mark_percent: version?.pass_mark_percent ?? '70.00',
        question_count: 0,
        questions: [],
      }
      certificationFixtures.assessments[versionNumber] = created
      return ok(created, 201)
    },
  ),

  http.patch(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/assessment',
    async ({ params, request }) => {
      const assessment = certificationFixtures.assessments[Number(params.versionNumber)]
      if (!assessment) {
        return error(404, 'not_found', 'The requested resource was not found.')
      }
      const body = (await request.json()) as Record<string, unknown>
      if (body.title !== undefined) {
        assessment.title = String(body.title)
      }
      if (body.instructions !== undefined) {
        assessment.instructions = (body.instructions as string | null) ?? null
      }
      // Pass mark remains derived from the programme version; body cannot override it.
      const version = findVersion(Number(params.programmeId), Number(params.versionNumber))
      assessment.pass_mark_percent = version?.pass_mark_percent ?? assessment.pass_mark_percent
      return ok(assessment)
    },
  ),

  http.get(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/assessment/questions',
    ({ params }) =>
      ok(certificationFixtures.assessments[Number(params.versionNumber)]?.questions ?? []),
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/assessment/questions/reorder',
    ({ params }) =>
      ok(certificationFixtures.assessments[Number(params.versionNumber)]?.questions ?? []),
  ),

  http.post(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/assessment/questions',
    async ({ params, request }) => {
      const assessment = certificationFixtures.assessments[Number(params.versionNumber)]
      if (!assessment) {
        return error(404, 'not_found', 'The requested resource was not found.')
      }
      const body = (await request.json()) as {
        prompt?: string
        options?: Array<{ label: string; is_correct: boolean }>
      }
      const questions = assessment.questions ?? []
      const created = {
        id: 7100 + questions.length + 1,
        assessment_id: assessment.id,
        prompt: body.prompt ?? 'Untitled question',
        type: 'single_choice',
        sort_order: questions.length + 1,
        options: (body.options ?? []).map((option, index) => ({
          id: 8100 + index,
          question_id: 7100 + questions.length + 1,
          label: option.label,
          sort_order: index + 1,
          is_correct: option.is_correct,
        })),
      }
      assessment.questions = [...questions, created]
      assessment.question_count = assessment.questions.length
      return ok(created, 201)
    },
  ),

  http.patch(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/assessment/questions/:questionId',
    async ({ request }) => ok((await request.json()) as Record<string, unknown>),
  ),

  http.delete(
    '/api/v1/admin/certification/programmes/:programmeId/versions/:versionNumber/assessment/questions/:questionId',
    ({ params }) => {
      const assessment = certificationFixtures.assessments[Number(params.versionNumber)]
      if (assessment) {
        assessment.questions = (assessment.questions ?? []).filter(
          (question) => question.id !== Number(params.questionId),
        )
        assessment.question_count = assessment.questions.length
      }
      return ok({ deleted: true })
    },
  ),

  /* Learners ------------------------------------------------------------- */

  http.get('/api/v1/admin/certification/enrollments', ({ request }) => {
    if (certificationFixtures.failEnrollments) {
      return error(500, 'server_error', 'Enrollment list failed')
    }
    const url = new URL(request.url)
    const programmeId = url.searchParams.get('programme_id')
    let items = certificationFixtures.enrollments
    if (programmeId) {
      items = items.filter((item) => item.programme_id === Number(programmeId))
    }
    return ok(items)
  }),

  http.get('/api/v1/admin/certification/enrollments/:enrollmentId', ({ params }) => {
    const enrollment = certificationFixtures.enrollments.find(
      (item) => item.id === Number(params.enrollmentId),
    )
    if (!enrollment) {
      return error(404, 'not_found', 'Enrollment not found')
    }
    return ok(enrollment)
  }),

  http.get(
    '/api/v1/admin/certification/enrollments/:enrollmentId/assessment/attempts',
    ({ params }) => ok(certificationFixtures.attempts[Number(params.enrollmentId)] ?? []),
  ),

  http.get(
    '/api/v1/admin/certification/enrollments/:enrollmentId/assessment/attempts/:attemptId',
    ({ params }) => {
      const attempt = (certificationFixtures.attempts[Number(params.enrollmentId)] ?? []).find(
        (item) => item.id === Number(params.attemptId),
      )
      if (!attempt) {
        return error(404, 'not_found', 'Attempt not found')
      }
      return ok(attempt)
    },
  ),

  http.get('/api/v1/admin/certification/enrollments/:enrollmentId/awards', ({ params }) =>
    ok(certificationFixtures.awards[Number(params.enrollmentId)] ?? []),
  ),

  http.get('/api/v1/admin/certification/enrollments/:enrollmentId/certificates', ({ params }) => {
    const ids = certificationFixtures.enrollmentCertificates[Number(params.enrollmentId)] ?? []
    return ok(certificationFixtures.certificates.filter((item) => ids.includes(item.id)))
  }),

  http.get('/api/v1/admin/certification/awards/:awardId', ({ params }) => {
    const awardId = Number(params.awardId)
    const award = Object.values(certificationFixtures.awards)
      .flat()
      .find((item) => item.id === awardId)
    if (!award) {
      return error(404, 'not_found', 'Award not found')
    }
    return ok(award)
  }),

  http.get('/api/v1/admin/certification/certificates/:certificateId', ({ params }) => {
    const certificate = certificationFixtures.certificates.find(
      (item) => item.id === Number(params.certificateId),
    )
    if (!certificate) {
      return error(404, 'not_found', 'Certificate not found')
    }
    return ok(certificate)
  }),

  http.get('/api/v1/admin/certification/certificates/:certificateId/download', ({ params }) => {
    const certificate = certificationFixtures.certificates.find(
      (item) => item.id === Number(params.certificateId),
    )
    if (!certificate?.artifact_available) {
      return error(404, 'not_found', 'The certificate PDF is not available.')
    }
    return new HttpResponse(new Uint8Array([37, 80, 68, 70]), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certificate.certificate_number}.pdf"`,
      },
    })
  }),

  http.post(
    '/api/v1/admin/certification/certificates/:certificateId/artifact/retry',
    ({ params }) => {
      const certificate = certificationFixtures.certificates.find(
        (item) => item.id === Number(params.certificateId),
      )
      if (!certificate) {
        return error(404, 'not_found', 'Certificate not found')
      }
      if (certificate.artifact_status !== 'failed_retryable') {
        return error(409, 'conflict', 'Only retryable artifacts can be regenerated.')
      }
      certificate.artifact_status = 'pending_generation'
      certificate.artifact_error_code = null
      return ok(certificate)
    },
  ),
]
