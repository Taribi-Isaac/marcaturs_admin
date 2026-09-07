import { http, HttpResponse } from 'msw'
import type { AdminDispute, DisputeAttachment, DisputeEvent } from '@/features/disputes/types'
import type { DisputeAttentionItem } from '@/features/attention/types'
import type { DisputeStatus } from '@/shared/types/domain'

function paginated<T>(items: T[], page = 1, perPage = 20) {
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

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true as const, data }, { status })
}

function error(status: number, code: string, message: string, details?: unknown) {
  return HttpResponse.json(
    {
      success: false as const,
      error: { code, message, ...(details ? { details } : {}) },
    },
    { status },
  )
}

const business = {
  id: 11,
  name: 'Ada Solar Ventures Ltd',
  role: 'BUSINESS',
}

const ambassador = {
  id: 21,
  name: 'Ada Nwosu',
  role: 'AMBASSADOR',
}

function baseDispute(
  overrides: Partial<AdminDispute> & Pick<AdminDispute, 'id' | 'reference' | 'status'>,
): AdminDispute {
  return {
    deal_id: 41,
    commission_id: 51,
    category: { id: 7, code: 'commission_amount_disputed', name: 'Commission amount disputed' },
    reporter: { id: 21, role: 'AMBASSADOR' },
    accused: { id: 11, role: 'BUSINESS' },
    description: 'Commission amount disputed after deal completion review.',
    decision_notes: null,
    action_notes: null,
    resolved_at: null,
    closed_at: null,
    attachments: [],
    events: [],
    deal: {
      id: 41,
      status: 'completed',
      business,
      ambassador,
      campaign: { id: 9, title: 'Solar reseller program', status: 'active' },
      campaign_version: { id: 90, version_number: 2 },
      open_dispute_count: 1,
      commission: {
        id: 51,
        status: 'due',
        amount: '15000.00',
        currency: 'NGN',
        due_at: '2026-09-01T12:00:00+00:00',
        paid_at: null,
        received_at: null,
        is_overdue: true,
      },
    },
    commission: {
      id: 51,
      status: 'due',
      amount: '15000.00',
      currency: 'NGN',
      due_at: '2026-09-01T12:00:00+00:00',
      paid_at: null,
      received_at: null,
      is_overdue: true,
    },
    created_at: '2026-09-05T08:00:00+00:00',
    updated_at: '2026-09-05T08:00:00+00:00',
    ...overrides,
  }
}

export const submittedDispute = baseDispute({
  id: 301,
  reference: 'MH-D-DEMO0001',
  status: 'submitted',
  events: [
    {
      id: 1,
      type: 'dispute_created',
      previous_status: null,
      new_status: 'submitted',
      actor: { id: 21, role: 'AMBASSADOR' },
      metadata: { deal_id: 41 },
      created_at: '2026-09-05T08:00:00+00:00',
    },
  ],
})

export const underReviewDispute = baseDispute({
  id: 302,
  reference: 'MH-D-DEMO0002',
  status: 'under_review',
  description: 'Demo dispute under review.',
  updated_at: '2026-09-06T09:00:00+00:00',
  events: [
    {
      id: 2,
      type: 'dispute_created',
      previous_status: null,
      new_status: 'submitted',
      actor: { id: 21, role: 'AMBASSADOR' },
      metadata: {},
      created_at: '2026-09-04T08:00:00+00:00',
    },
    {
      id: 3,
      type: 'dispute_review_started',
      previous_status: 'submitted',
      new_status: 'under_review',
      actor: { id: 1, role: 'ADMIN' },
      metadata: {},
      created_at: '2026-09-06T09:00:00+00:00',
    },
  ],
})

export const evidenceRequestedDispute = baseDispute({
  id: 303,
  reference: 'MH-D-DEMO0003',
  status: 'evidence_requested',
  description: 'Waiting for party evidence.',
  updated_at: '2026-09-06T12:00:00+00:00',
})

export const decisionPendingDispute = baseDispute({
  id: 304,
  reference: 'MH-D-DEMO0004',
  status: 'decision_pending',
  description: 'Decision pending after investigation.',
  updated_at: '2026-09-06T15:00:00+00:00',
})

export const resolvedDispute = baseDispute({
  id: 305,
  reference: 'MH-D-DEMO0005',
  status: 'resolved',
  description: 'Resolved operationally.',
  decision_notes: 'Demo resolution notes for UAT.',
  action_notes: 'No financial mutation; operational outcome only.',
  resolved_at: '2026-09-05T10:00:00+00:00',
  updated_at: '2026-09-05T10:00:00+00:00',
})

export const closedDispute = baseDispute({
  id: 399,
  reference: 'MH-D-DEMO0099',
  status: 'closed',
  description: 'Closed dispute should not require attention.',
  decision_notes: 'Closed after resolution.',
  action_notes: 'Administrative record only.',
  resolved_at: '2026-08-19T10:00:00+00:00',
  closed_at: '2026-08-20T10:00:00+00:00',
  created_at: '2026-08-01T08:00:00+00:00',
  updated_at: '2026-08-20T08:00:00+00:00',
})

export const demoAttachment: DisputeAttachment = {
  id: 801,
  uploader: { id: 21, role: 'AMBASSADOR' },
  original_filename: 'commission-screenshot.png',
  mime_type: 'image/png',
  size_bytes: 2048,
  note: 'Payment screenshot',
  has_file: true,
  created_at: '2026-09-05T09:00:00+00:00',
}

export const disputeOpenItem: DisputeAttentionItem = {
  id: submittedDispute.id,
  reference: submittedDispute.reference,
  status: submittedDispute.status,
  deal_id: submittedDispute.deal_id,
  commission_id: submittedDispute.commission_id,
  description: submittedDispute.description,
  created_at: submittedDispute.created_at,
  updated_at: submittedDispute.updated_at,
  category: submittedDispute.category,
  reporter: submittedDispute.reporter,
  accused: submittedDispute.accused,
  deal: {
    id: submittedDispute.deal!.id,
    business: submittedDispute.deal!.business,
    ambassador: submittedDispute.deal!.ambassador,
    campaign: submittedDispute.deal!.campaign
      ? {
          id: submittedDispute.deal!.campaign.id ?? 0,
          title: submittedDispute.deal!.campaign.title,
          status: submittedDispute.deal!.campaign.status,
        }
      : null,
  },
}

export const disputeClosedItem: DisputeAttentionItem = {
  id: closedDispute.id,
  reference: closedDispute.reference,
  status: closedDispute.status,
  deal_id: closedDispute.deal_id,
  commission_id: closedDispute.commission_id,
  description: closedDispute.description,
  created_at: closedDispute.created_at,
  updated_at: closedDispute.updated_at,
  category: closedDispute.category,
  reporter: closedDispute.reporter,
  accused: closedDispute.accused,
}

export type DisputeFixtureState = {
  disputes: AdminDispute[]
  failList: boolean
  forbidList: boolean
  conflictNextAction: boolean
  validationNextAction: boolean
  failDownload: boolean
}

function defaultDisputes(): AdminDispute[] {
  return [
    structuredClone(submittedDispute),
    structuredClone(underReviewDispute),
    structuredClone(evidenceRequestedDispute),
    structuredClone(decisionPendingDispute),
    structuredClone({
      ...structuredClone(underReviewDispute),
      id: 310,
      reference: 'MH-D-DEMO0010',
      attachments: [structuredClone(demoAttachment)],
    }),
    structuredClone(resolvedDispute),
    structuredClone(closedDispute),
  ]
}

export const disputeFixtures: DisputeFixtureState = {
  disputes: defaultDisputes(),
  failList: false,
  forbidList: false,
  conflictNextAction: false,
  validationNextAction: false,
  failDownload: false,
}

export function resetDisputeFixtures(): void {
  disputeFixtures.disputes = defaultDisputes()
  disputeFixtures.failList = false
  disputeFixtures.forbidList = false
  disputeFixtures.conflictNextAction = false
  disputeFixtures.validationNextAction = false
  disputeFixtures.failDownload = false
}

function findDispute(id: number): AdminDispute | undefined {
  return disputeFixtures.disputes.find((item) => item.id === id)
}

function applyStatus(
  dispute: AdminDispute,
  status: DisputeStatus,
  extras: Partial<AdminDispute> = {},
) {
  dispute.status = status
  dispute.updated_at = new Date().toISOString()
  Object.assign(dispute, extras)
  const event: DisputeEvent = {
    id: (dispute.events?.length ?? 0) + 1000,
    type: `dispute_${status}`,
    previous_status: null,
    new_status: status,
    actor: { id: 1, role: 'ADMIN' },
    metadata: {},
    created_at: dispute.updated_at,
  }
  dispute.events = [...(dispute.events ?? []), event]
  return dispute
}

function parseBody(request: Request): Promise<Record<string, unknown>> {
  return request.json().catch(() => ({}))
}

export const disputeHandlers = [
  http.get('/api/v1/admin/disputes', ({ request }) => {
    if (disputeFixtures.forbidList) {
      return error(403, 'forbidden', 'Forbidden.')
    }
    if (disputeFixtures.failList) {
      return error(500, 'server_error', 'Dispute queue unavailable.')
    }
    const page = Number(new URL(request.url).searchParams.get('page') ?? '1') || 1
    return HttpResponse.json(paginated(disputeFixtures.disputes, page, 20))
  }),

  http.get('/api/v1/admin/disputes/:id', ({ params }) => {
    const dispute = findDispute(Number(params.id))
    if (!dispute) {
      return error(404, 'not_found', 'Dispute not found.')
    }
    return ok(dispute)
  }),

  http.post('/api/v1/admin/disputes/:id/start-review', async ({ params, request }) => {
    const dispute = findDispute(Number(params.id))
    if (!dispute) {
      return error(404, 'not_found', 'Dispute not found.')
    }
    if (disputeFixtures.conflictNextAction) {
      disputeFixtures.conflictNextAction = false
      return error(
        422,
        'business_validation',
        'This Dispute cannot transition from under_review to under_review.',
      )
    }
    if (dispute.status !== 'submitted') {
      return error(
        422,
        'business_validation',
        `This Dispute cannot transition from ${dispute.status} to under_review.`,
      )
    }
    await parseBody(request)
    return ok(applyStatus(dispute, 'under_review'))
  }),

  http.post('/api/v1/admin/disputes/:id/request-evidence', async ({ params, request }) => {
    const dispute = findDispute(Number(params.id))
    if (!dispute) {
      return error(404, 'not_found', 'Dispute not found.')
    }
    if (disputeFixtures.validationNextAction) {
      disputeFixtures.validationNextAction = false
      return error(422, 'validation_error', 'The given data was invalid.', {
        reason: ['The reason field is required.'],
      })
    }
    const body = await parseBody(request)
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (reason.length < 3) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        reason: ['Reason must be at least 3 characters.'],
      })
    }
    if (dispute.status !== 'under_review' && dispute.status !== 'decision_pending') {
      return error(
        422,
        'business_validation',
        'Evidence can only be requested from under_review or decision_pending.',
      )
    }
    return ok(applyStatus(dispute, 'evidence_requested'))
  }),

  http.post('/api/v1/admin/disputes/:id/resume-review', async ({ params, request }) => {
    const dispute = findDispute(Number(params.id))
    if (!dispute) {
      return error(404, 'not_found', 'Dispute not found.')
    }
    await parseBody(request)
    if (dispute.status !== 'evidence_requested') {
      return error(
        422,
        'business_validation',
        `This Dispute cannot transition from ${dispute.status} to under_review.`,
      )
    }
    return ok(applyStatus(dispute, 'under_review'))
  }),

  http.post('/api/v1/admin/disputes/:id/mark-decision-pending', async ({ params, request }) => {
    const dispute = findDispute(Number(params.id))
    if (!dispute) {
      return error(404, 'not_found', 'Dispute not found.')
    }
    await parseBody(request)
    if (dispute.status !== 'under_review') {
      return error(
        422,
        'business_validation',
        `This Dispute cannot transition from ${dispute.status} to decision_pending.`,
      )
    }
    return ok(applyStatus(dispute, 'decision_pending'))
  }),

  http.post('/api/v1/admin/disputes/:id/resolve', async ({ params, request }) => {
    const dispute = findDispute(Number(params.id))
    if (!dispute) {
      return error(404, 'not_found', 'Dispute not found.')
    }
    const body = await parseBody(request)
    const decisionNotes = typeof body.decision_notes === 'string' ? body.decision_notes.trim() : ''
    const actionNotes = typeof body.action_notes === 'string' ? body.action_notes.trim() : ''
    if (decisionNotes.length < 3 || actionNotes.length < 3) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        decision_notes: decisionNotes.length < 3 ? ['Decision notes are required.'] : undefined,
        action_notes: actionNotes.length < 3 ? ['Action notes are required.'] : undefined,
      })
    }
    if (dispute.status !== 'decision_pending') {
      return error(422, 'business_validation', 'Only a decision_pending Dispute can be resolved.')
    }
    return ok(
      applyStatus(dispute, 'resolved', {
        decision_notes: decisionNotes,
        action_notes: actionNotes,
        resolved_at: new Date().toISOString(),
      }),
    )
  }),

  http.post('/api/v1/admin/disputes/:id/close', async ({ params, request }) => {
    const dispute = findDispute(Number(params.id))
    if (!dispute) {
      return error(404, 'not_found', 'Dispute not found.')
    }
    await parseBody(request)
    if (dispute.status !== 'resolved') {
      return error(
        422,
        'business_validation',
        `This Dispute cannot transition from ${dispute.status} to closed.`,
      )
    }
    return ok(
      applyStatus(dispute, 'closed', {
        closed_at: new Date().toISOString(),
      }),
    )
  }),

  http.get('/api/v1/admin/disputes/:id/attachments/:attachmentId/download', ({ params }) => {
    if (disputeFixtures.failDownload) {
      return error(404, 'not_found', 'Attachment file is missing from storage.')
    }
    const dispute = findDispute(Number(params.id))
    const attachment = dispute?.attachments?.find((item) => item.id === Number(params.attachmentId))
    if (!attachment || !attachment.has_file) {
      return error(404, 'not_found', 'Attachment not found.')
    }
    return new HttpResponse(
      new Blob(['demo-evidence'], { type: attachment.mime_type ?? 'text/plain' }),
      {
        status: 200,
        headers: {
          'Content-Type': attachment.mime_type ?? 'text/plain',
          'Content-Disposition': `attachment; filename="${attachment.original_filename ?? 'evidence.bin'}"`,
        },
      },
    )
  }),
]
