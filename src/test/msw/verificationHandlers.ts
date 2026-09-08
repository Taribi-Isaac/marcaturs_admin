import { http, HttpResponse } from 'msw'
import type {
  VerificationRequirement,
  VerificationReviewEvent,
  VerificationSubmission,
} from '@/features/verification/types'

function paginated<T>(items: T[], page = 1, perPage = 15) {
  const total = items.length
  const start = (page - 1) * perPage
  const slice = items.slice(start, start + perPage)
  return {
    success: true as const,
    data: slice,
    meta: {
      pagination: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.max(1, Math.ceil(total / perPage) || 1),
        from: slice.length ? start + 1 : null,
        to: slice.length ? start + slice.length : null,
      },
    },
  }
}

export const demoRequirement: VerificationRequirement = {
  id: 1,
  name: 'Demo Business registration evidence',
  description: 'Upload registration evidence.',
  participant_type: 'BUSINESS',
  requirement_type: 'document',
  is_required: true,
  is_active: true,
  sort_order: 1,
  config: null,
}

export const pendingSubmission: VerificationSubmission = {
  id: 101,
  user_id: 11,
  status: 'pending',
  text_value: 'Demo submission for registration',
  current_version: 1,
  review_reason: null,
  reviewer_notes: null,
  reviewed_at: null,
  submitted_at: '2026-09-07T09:00:00+00:00',
  user: {
    id: 11,
    name: 'Ada Solar Ventures Ltd',
    email: 'business.solar@demo.marcaturshub.test',
    role: 'BUSINESS',
  },
  requirement: {
    id: 1,
    name: 'Business registration certificate',
    description: 'Upload registration evidence.',
    participant_type: 'BUSINESS',
    requirement_type: 'document',
    is_required: true,
    is_active: true,
    sort_order: 1,
    config: null,
  },
  evidence: [
    {
      id: 501,
      original_filename: 'registration.pdf',
      mime_type: 'application/pdf',
      size_bytes: 2048,
      created_at: '2026-09-06T10:01:00+00:00',
    },
  ],
}

export const underReviewSubmission: VerificationSubmission = {
  id: 102,
  user_id: 12,
  status: 'under_review',
  text_value: 'Demo legal name',
  current_version: 1,
  review_reason: null,
  reviewer_notes: null,
  reviewed_at: null,
  submitted_at: '2026-09-06T14:00:00+00:00',
  user: {
    id: 12,
    name: 'Chidi Okonkwo',
    email: 'ambassador.chidi@demo.marcaturshub.test',
    role: 'AMBASSADOR',
  },
  requirement: {
    id: 2,
    name: 'Government-issued ID',
    description: null,
    participant_type: 'AMBASSADOR',
    requirement_type: 'document',
    is_required: true,
    is_active: true,
    sort_order: 2,
    config: null,
  },
  evidence: [],
}

export const approvedSubmission: VerificationSubmission = {
  ...pendingSubmission,
  id: 103,
  status: 'approved',
  reviewed_at: '2026-09-01T12:00:00+00:00',
  evidence: [],
  user: {
    id: 14,
    name: 'Ada Nwosu',
    email: 'ambassador.ada@demo.marcaturshub.test',
    role: 'AMBASSADOR',
  },
  requirement: {
    ...demoRequirement,
    id: 3,
    name: 'Demo Ambassador identity evidence',
    participant_type: 'AMBASSADOR',
  },
}

export type VerificationFixtureState = {
  requirements: VerificationRequirement[]
  submissions: VerificationSubmission[]
  events: Record<number, VerificationReviewEvent[]>
  failList?: boolean
  failDetail?: boolean
  forbidList?: boolean
  failDownload?: boolean
}

export const verificationFixtures: VerificationFixtureState = {
  requirements: [structuredClone(demoRequirement)],
  submissions: [pendingSubmission, underReviewSubmission, approvedSubmission],
  events: {
    101: [
      {
        id: 1,
        actor_id: 11,
        action: 'submitted',
        previous_status: null,
        new_status: 'pending',
        reason: null,
        reviewer_notes: null,
        created_at: '2026-09-06T10:00:00+00:00',
      },
    ],
    102: [
      {
        id: 2,
        actor_id: 11,
        action: 'submitted',
        previous_status: null,
        new_status: 'pending',
        reason: null,
        reviewer_notes: null,
        created_at: '2026-09-05T10:00:00+00:00',
      },
      {
        id: 3,
        actor_id: 1,
        action: 'started_review',
        previous_status: 'pending',
        new_status: 'under_review',
        reason: null,
        reviewer_notes: null,
        created_at: '2026-09-05T11:00:00+00:00',
      },
    ],
  },
}

export function resetVerificationFixtures(): void {
  verificationFixtures.requirements = [structuredClone(demoRequirement)]
  verificationFixtures.submissions = [
    { ...pendingSubmission, evidence: [...(pendingSubmission.evidence ?? [])] },
    { ...underReviewSubmission },
    { ...approvedSubmission },
  ]
  verificationFixtures.events = {
    101: [...(verificationFixtures.events[101] ?? [])],
    102: [
      {
        id: 2,
        actor_id: 11,
        action: 'submitted',
        previous_status: null,
        new_status: 'pending',
        reason: null,
        reviewer_notes: null,
        created_at: '2026-09-05T10:00:00+00:00',
      },
      {
        id: 3,
        actor_id: 1,
        action: 'started_review',
        previous_status: 'pending',
        new_status: 'under_review',
        reason: null,
        reviewer_notes: null,
        created_at: '2026-09-05T11:00:00+00:00',
      },
    ],
  }
  // re-seed events for 101 cleanly
  verificationFixtures.events[101] = [
    {
      id: 1,
      actor_id: 11,
      action: 'submitted',
      previous_status: null,
      new_status: 'pending',
      reason: null,
      reviewer_notes: null,
      created_at: '2026-09-06T10:00:00+00:00',
    },
  ]
  verificationFixtures.failList = false
  verificationFixtures.failDetail = false
  verificationFixtures.forbidList = false
  verificationFixtures.failDownload = false
}

function findSubmission(id: string) {
  return verificationFixtures.submissions.find((item) => String(item.id) === id)
}

function appendEvent(submission: VerificationSubmission, action: string, previous: string | null) {
  const list = verificationFixtures.events[submission.id] ?? []
  list.push({
    id: list.length + 100,
    actor_id: 1,
    action,
    previous_status: previous,
    new_status: submission.status,
    reason: submission.review_reason,
    reviewer_notes: submission.reviewer_notes,
    created_at: new Date().toISOString(),
  })
  verificationFixtures.events[submission.id] = list
}

export const verificationHandlers = [
  http.get('/api/v1/admin/verification/requirements', () => {
    return HttpResponse.json({ success: true, data: verificationFixtures.requirements })
  }),

  http.post('/api/v1/admin/verification/requirements', async ({ request }) => {
    const body = (await request.json()) as Partial<VerificationRequirement>
    if (!body.name || !body.participant_type || !body.requirement_type) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'validation_error',
            message: 'The given data was invalid.',
            details: {
              name: body.name ? undefined : ['The name field is required.'],
            },
          },
        },
        { status: 400 },
      )
    }

    const created: VerificationRequirement = {
      id: Math.max(0, ...verificationFixtures.requirements.map((item) => item.id)) + 1,
      name: body.name,
      description: body.description ?? null,
      participant_type: body.participant_type,
      requirement_type: body.requirement_type,
      is_required: body.is_required ?? true,
      is_active: body.is_active ?? true,
      sort_order: body.sort_order ?? 0,
      config: body.config ?? null,
    }
    verificationFixtures.requirements.push(created)
    return HttpResponse.json({ success: true, data: created }, { status: 201 })
  }),

  http.patch('/api/v1/admin/verification/requirements/:id', async ({ params, request }) => {
    const requirement = verificationFixtures.requirements.find(
      (item) => String(item.id) === params.id,
    )
    if (!requirement) {
      return HttpResponse.json(
        { success: false, error: { code: 'not_found', message: 'Not found.' } },
        { status: 404 },
      )
    }

    const body = (await request.json()) as Partial<VerificationRequirement>
    Object.assign(requirement, body)
    return HttpResponse.json({ success: true, data: requirement })
  }),

  http.get('/api/v1/admin/verification/submissions', ({ request }) => {
    if (verificationFixtures.forbidList) {
      return HttpResponse.json(
        { success: false, error: { code: 'forbidden', message: 'Forbidden.' } },
        { status: 403 },
      )
    }
    if (verificationFixtures.failList) {
      return HttpResponse.json(
        { success: false, error: { code: 'server_error', message: 'Queue unavailable.' } },
        { status: 500 },
      )
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = Number(url.searchParams.get('page') ?? '1') || 1
    let items = verificationFixtures.submissions
    if (status) {
      items = items.filter((item) => item.status === status)
    }
    return HttpResponse.json(paginated(items, page))
  }),

  http.get('/api/v1/admin/verification/submissions/:id', ({ params }) => {
    if (verificationFixtures.failDetail) {
      return HttpResponse.json(
        { success: false, error: { code: 'server_error', message: 'Detail unavailable.' } },
        { status: 500 },
      )
    }

    const submission = findSubmission(String(params.id))
    if (!submission) {
      return HttpResponse.json(
        { success: false, error: { code: 'not_found', message: 'Not found.' } },
        { status: 404 },
      )
    }

    return HttpResponse.json({ success: true, data: submission })
  }),

  http.get('/api/v1/admin/verification/submissions/:id/events', ({ params }) => {
    const id = Number(params.id)
    return HttpResponse.json({
      success: true,
      data: verificationFixtures.events[id] ?? [],
    })
  }),

  http.post('/api/v1/admin/verification/submissions/:id/start-review', ({ params }) => {
    const submission = findSubmission(String(params.id))
    if (!submission) {
      return HttpResponse.json(
        { success: false, error: { code: 'not_found', message: 'Not found.' } },
        { status: 404 },
      )
    }
    if (submission.status !== 'pending') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'conflict',
            message: 'Only pending submissions can be moved to review.',
          },
        },
        { status: 409 },
      )
    }
    const previous = submission.status
    submission.status = 'under_review'
    appendEvent(submission, 'started_review', previous)
    return HttpResponse.json({ success: true, data: submission })
  }),

  http.post('/api/v1/admin/verification/submissions/:id/approve', async ({ params, request }) => {
    const submission = findSubmission(String(params.id))
    if (!submission) {
      return HttpResponse.json(
        { success: false, error: { code: 'not_found', message: 'Not found.' } },
        { status: 404 },
      )
    }
    if (submission.status !== 'pending' && submission.status !== 'under_review') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'conflict', message: 'Submission cannot be reviewed.' },
        },
        { status: 409 },
      )
    }
    const body = (await request.json()) as { notes?: string | null }
    const previous = submission.status
    submission.status = 'approved'
    submission.reviewer_notes = body.notes ?? null
    submission.reviewed_at = new Date().toISOString()
    appendEvent(submission, 'approved', previous)
    return HttpResponse.json({ success: true, data: submission })
  }),

  http.post('/api/v1/admin/verification/submissions/:id/reject', async ({ params, request }) => {
    const submission = findSubmission(String(params.id))
    if (!submission) {
      return HttpResponse.json(
        { success: false, error: { code: 'not_found', message: 'Not found.' } },
        { status: 404 },
      )
    }
    const body = (await request.json()) as { reason?: string; notes?: string | null }
    if (!body.reason) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'validation_error',
            message: 'The given data was invalid.',
            details: { reason: ['The reason field is required.'] },
          },
        },
        { status: 400 },
      )
    }
    const previous = submission.status
    submission.status = 'rejected'
    submission.review_reason = body.reason
    submission.reviewer_notes = body.notes ?? null
    submission.reviewed_at = new Date().toISOString()
    appendEvent(submission, 'rejected', previous)
    return HttpResponse.json({ success: true, data: submission })
  }),

  http.post(
    '/api/v1/admin/verification/submissions/:id/request-information',
    async ({ params, request }) => {
      const submission = findSubmission(String(params.id))
      if (!submission) {
        return HttpResponse.json(
          { success: false, error: { code: 'not_found', message: 'Not found.' } },
          { status: 404 },
        )
      }
      const body = (await request.json()) as { reason?: string; notes?: string | null }
      if (!body.reason) {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: 'validation_error',
              message: 'The given data was invalid.',
              details: { reason: ['The reason field is required.'] },
            },
          },
          { status: 400 },
        )
      }
      const previous = submission.status
      submission.status = 'more_information_required'
      submission.review_reason = body.reason
      submission.reviewer_notes = body.notes ?? null
      submission.reviewed_at = new Date().toISOString()
      appendEvent(submission, 'requested_information', previous)
      return HttpResponse.json({ success: true, data: submission })
    },
  ),

  http.get(
    '/api/v1/admin/verification/submissions/:submissionId/evidence/:evidenceId/download',
    ({ params }) => {
      if (verificationFixtures.failDownload) {
        return HttpResponse.json(
          { success: false, error: { code: 'not_found', message: 'Evidence missing.' } },
          { status: 404 },
        )
      }

      const submission = findSubmission(String(params.submissionId))
      const evidence = submission?.evidence?.find((item) => String(item.id) === params.evidenceId)
      if (!evidence) {
        return HttpResponse.json(
          { success: false, error: { code: 'not_found', message: 'Evidence missing.' } },
          { status: 404 },
        )
      }

      return new HttpResponse(new Blob(['demo-evidence'], { type: evidence.mime_type }), {
        status: 200,
        headers: {
          'Content-Type': evidence.mime_type,
          'Content-Disposition': `attachment; filename="${evidence.original_filename}"`,
        },
      })
    },
  ),
]
