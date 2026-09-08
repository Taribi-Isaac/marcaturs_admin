import { http, HttpResponse } from 'msw'
import type { AdminDealDetail, AdminDealListItem } from '@/features/deals/types'

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

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true as const, data }, { status })
}

function error(status: number, code: string, message: string) {
  return HttpResponse.json(
    {
      success: false as const,
      error: { code, message },
    },
    { status },
  )
}

const businessActive = {
  id: 111,
  name: 'Ada Solar Owner',
  email: 'business.solar@demo.marcaturshub.test',
  status: 'active',
  role: 'BUSINESS',
}

const ambassadorSuspended = {
  id: 116,
  name: 'Ada Marketer',
  email: 'ambassador.ada@demo.marcaturshub.test',
  status: 'suspended',
  role: 'AMBASSADOR',
}

const sealedDealDetail: AdminDealDetail = {
  id: 60,
  status: 'sealed',
  created_at: '2026-08-10T10:00:00+00:00',
  updated_at: '2026-08-12T10:00:00+00:00',
  confirmed_at: '2026-08-12T10:00:00+00:00',
  cancelled_at: null,
  business: businessActive,
  ambassador: ambassadorSuspended,
  campaign: {
    id: 20,
    title: 'Solar Street Kit',
    status: 'active',
    category: { id: 1, name: 'Energy', slug: 'energy' },
  },
  campaign_version: {
    id: 30,
    version_number: 2,
    status: 'published',
    product_name: 'Solar street light installation kit',
    product_description: 'Kit for campus installation.',
    pricing_method: 'fixed',
    price_amount: '250000.00',
    price_currency: 'NGN',
    service_area: 'Lagos',
    commission_type: 'percentage',
    commission_rate: '10.00',
    commission_amount: null,
    commission_trigger: 'payment_confirmation',
    commission_trigger_description: 'After Business confirms payment',
    commission_payment_deadline_days: 7,
    minimum_qualifying_amount: '100000.00',
    qualifying_conditions: 'Full kit sale',
    refund_cancellation_rules: 'No refund after install',
    approved_claims: 'Reliable solar lighting',
    prohibited_claims: 'Guaranteed ROI',
    brand_use_rules: 'Use approved logo only',
    geographic_customer_restrictions: 'Nigeria only',
    approved_copy: 'Light your campus safely.',
    marketing_links: ['https://adasolar.test/kit'],
    payment_destination_name: 'Ada Solar Ops',
    payment_provider: 'bank_transfer',
    terms: 'Standard terms',
    published_at: '2026-08-01T10:00:00+00:00',
  },
  product_name: 'Solar street light installation kit',
  commission_type: 'percentage',
  commission_amount: '25000.00',
  confirmed_payment_amount: '250000.00',
  has_evidence: true,
  evidence_count: 1,
  latest_evidence_status: 'submitted',
  open_dispute_count: 1,
  snapshot: {
    product_name: 'Solar street light installation kit',
    pricing_method: 'fixed',
    price_amount: '250000.00',
    price_currency: 'NGN',
    commission_type: 'percentage',
    commission_rate: '10.00',
    commission_amount: '25000.00',
    commission_trigger: 'payment_confirmation',
    commission_trigger_description: 'After Business confirms payment',
    commission_payment_deadline_days: 7,
    minimum_qualifying_amount: '100000.00',
    qualifying_conditions: 'Full kit sale',
    expected_transaction_amount: '250000.00',
    confirmed_payment_amount: '250000.00',
    confirmed_at: '2026-08-12T10:00:00+00:00',
  },
  payment_evidence: [
    {
      id: 501,
      deal_id: 60,
      kind: 'receipt',
      status: 'submitted',
      reference_number: 'REF-SOLAR-501',
      amount: '250000.00',
      currency: 'NGN',
      paid_on: '2026-08-11',
      note: 'Bank transfer receipt',
      has_file: true,
      original_filename: 'receipt.pdf',
      mime_type: 'application/pdf',
      size_bytes: 2048,
      submitted_by: { id: 116, role: 'AMBASSADOR' },
      submitted_at: '2026-08-11T12:00:00+00:00',
      created_at: '2026-08-11T12:00:00+00:00',
    },
    {
      id: 502,
      deal_id: 60,
      kind: 'transaction_reference',
      status: 'submitted',
      reference_number: 'TXN-NO-FILE',
      amount: null,
      currency: null,
      paid_on: null,
      note: null,
      has_file: false,
      original_filename: null,
      mime_type: null,
      size_bytes: null,
      submitted_by: { id: 116, role: 'AMBASSADOR' },
      submitted_at: '2026-08-11T13:00:00+00:00',
      created_at: '2026-08-11T13:00:00+00:00',
    },
  ],
  commission: {
    id: 80,
    status: 'due',
    amount: '25000.00',
    currency: 'NGN',
    commission_type: 'percentage',
    commission_rate: '10.00',
    became_due_at: '2026-08-12T10:00:00+00:00',
    due_at: '2026-08-05T10:00:00+00:00',
    paid_at: null,
    received_at: null,
    is_overdue: true,
    payment_reference: null,
    payment_note: null,
  },
  disputes: [
    {
      id: 90,
      reference: 'DSP-90',
      status: 'under_review',
      category: { id: 1, code: 'payment', name: 'Payment issue' },
    },
  ],
  events: [
    {
      id: 1,
      type: 'deal_created',
      actor: { id: 116, role: 'AMBASSADOR' },
      previous_status: null,
      new_status: 'payment_pending',
      metadata: { note: 'Deal opened' },
      created_at: '2026-08-10T10:00:00+00:00',
    },
    {
      id: 2,
      type: 'deal_sealed',
      actor: { id: 111, role: 'BUSINESS' },
      previous_status: 'payment_pending',
      new_status: 'sealed',
      metadata: { commission_id: 80 },
      created_at: '2026-08-12T10:00:00+00:00',
    },
  ],
}

function toListItem(detail: AdminDealDetail): AdminDealListItem {
  return {
    id: detail.id,
    status: detail.status,
    created_at: detail.created_at,
    updated_at: detail.updated_at,
    business: detail.business
      ? {
          id: detail.business.id,
          name: detail.business.name,
          email: detail.business.email,
          status: detail.business.status,
        }
      : null,
    ambassador: detail.ambassador
      ? {
          id: detail.ambassador.id,
          name: detail.ambassador.name,
          email: detail.ambassador.email,
          status: detail.ambassador.status,
        }
      : null,
    campaign: detail.campaign
      ? {
          id: detail.campaign.id,
          title: detail.campaign.title,
          status: detail.campaign.status,
        }
      : null,
    campaign_version: detail.campaign_version
      ? {
          id: detail.campaign_version.id,
          version_number: detail.campaign_version.version_number,
        }
      : null,
    product_name: detail.product_name,
    commission_type: detail.commission_type,
    commission_amount: detail.commission_amount,
    confirmed_payment_amount: detail.confirmed_payment_amount,
    confirmed_at: detail.confirmed_at,
    has_evidence: detail.has_evidence,
    evidence_count: detail.evidence_count,
    latest_evidence_status: detail.latest_evidence_status,
    commission: detail.commission
      ? {
          status: detail.commission.status,
          due_at: detail.commission.due_at,
          is_overdue: detail.commission.is_overdue,
        }
      : null,
    open_dispute_count: detail.open_dispute_count,
  }
}

const pendingDeal: AdminDealListItem = {
  ...toListItem({
    ...sealedDealDetail,
    id: 55,
    status: 'payment_pending',
    confirmed_at: null,
    confirmed_payment_amount: null,
    commission_amount: null,
    has_evidence: false,
    evidence_count: 0,
    latest_evidence_status: null,
    open_dispute_count: 0,
    commission: null,
    ambassador: {
      id: 117,
      name: 'Chi Marketer',
      email: 'ambassador.chi@demo.marcaturshub.test',
      status: 'active',
      role: 'AMBASSADOR',
    },
    product_name: 'Pending product',
    campaign: {
      id: 21,
      title: 'Pending Campaign',
      status: 'active',
      category: null,
    },
  }),
  confirmed_at: null,
  confirmed_payment_amount: null,
  commission: null,
  has_evidence: false,
  evidence_count: 0,
  latest_evidence_status: null,
  open_dispute_count: 0,
  product_name: 'Pending product',
  status: 'payment_pending',
}

const completedDeal: AdminDealListItem = {
  ...toListItem({
    ...sealedDealDetail,
    id: 40,
    status: 'completed',
    open_dispute_count: 0,
    commission: {
      ...sealedDealDetail.commission!,
      status: 'received',
      is_overdue: false,
      paid_at: '2026-08-15T10:00:00+00:00',
      received_at: '2026-08-16T10:00:00+00:00',
    },
    product_name: 'Completed kit',
    campaign: {
      id: 22,
      title: 'Completed Campaign',
      status: 'active',
      category: null,
    },
  }),
  status: 'completed',
  open_dispute_count: 0,
  commission: { status: 'received', due_at: '2026-08-19T10:00:00+00:00', is_overdue: false },
  product_name: 'Completed kit',
}

const cancelledDeal: AdminDealListItem = {
  ...toListItem({
    ...sealedDealDetail,
    id: 30,
    status: 'cancelled',
    confirmed_at: null,
    commission: null,
    open_dispute_count: 0,
    has_evidence: false,
    evidence_count: 0,
    product_name: 'Cancelled kit',
  }),
  status: 'cancelled',
  confirmed_at: null,
  commission: null,
  open_dispute_count: 0,
  has_evidence: false,
  evidence_count: 0,
  product_name: 'Cancelled kit',
}

const paidCommissionDeal: AdminDealListItem = {
  ...toListItem(sealedDealDetail),
  id: 50,
  product_name: 'Paid commission kit',
  open_dispute_count: 0,
  commission: { status: 'paid', due_at: '2026-08-19T10:00:00+00:00', is_overdue: false },
}

export const dealFixtures = {
  deals: [sealedDealDetail, pendingDeal, completedDeal, cancelledDeal, paidCommissionDeal] as Array<
    AdminDealDetail | AdminDealListItem
  >,
  details: {
    60: sealedDealDetail,
  } as Record<number, AdminDealDetail>,
  failList: false,
  failDetail: false,
  missingDetail: false,
  failDownload: false as false | 404 | 403 | 500,
}

export function resetDealFixtures() {
  dealFixtures.deals = [
    sealedDealDetail,
    pendingDeal,
    completedDeal,
    cancelledDeal,
    paidCommissionDeal,
  ]
  dealFixtures.details = { 60: sealedDealDetail }
  dealFixtures.failList = false
  dealFixtures.failDetail = false
  dealFixtures.missingDetail = false
  dealFixtures.failDownload = false
}

function asListItems(): AdminDealListItem[] {
  return dealFixtures.deals.map((deal) =>
    'snapshot' in deal ? toListItem(deal as AdminDealDetail) : (deal as AdminDealListItem),
  )
}

export const dealHandlers = [
  http.get('/api/v1/admin/deals', ({ request }) => {
    if (dealFixtures.failList) {
      return error(500, 'server_error', 'Deal list failed')
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
    const openDispute = url.searchParams.get('open_dispute') === '1'
    const overdue = url.searchParams.get('commission_overdue') === '1'
    const commissionStatus = url.searchParams.get('commission_status')
    const page = Number(url.searchParams.get('page') ?? '1') || 1
    const perPage = Number(url.searchParams.get('per_page') ?? '15') || 15

    let items = asListItems()

    if (status) {
      items = items.filter((item) => item.status === status)
    }
    if (openDispute) {
      items = items.filter((item) => item.open_dispute_count > 0)
    }
    if (overdue) {
      items = items.filter((item) => item.commission?.is_overdue)
    }
    if (commissionStatus) {
      items = items.filter((item) => item.commission?.status === commissionStatus)
    }
    if (q) {
      items = items.filter((item) => {
        const haystack = [
          String(item.id),
          item.business?.name,
          item.business?.email,
          item.ambassador?.name,
          item.ambassador?.email,
          item.campaign?.title,
          item.product_name,
          item.id === 60 ? 'REF-SOLAR-501' : '',
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
    }

    items = [...items].sort((a, b) => b.id - a.id)
    return HttpResponse.json(paginated(items, page, perPage))
  }),

  http.get('/api/v1/admin/deals/:dealId/payment-evidence/:evidenceId/download', ({ params }) => {
    if (dealFixtures.failDownload === 404) {
      return error(404, 'not_found', 'Evidence file not found')
    }
    if (dealFixtures.failDownload === 403) {
      return error(403, 'forbidden', 'Forbidden')
    }
    if (dealFixtures.failDownload === 500) {
      return error(500, 'server_error', 'Download failed')
    }

    const dealId = Number(params.dealId)
    const evidenceId = Number(params.evidenceId)
    const detail = dealFixtures.details[dealId]
    const evidence = detail?.payment_evidence.find((item) => item.id === evidenceId)
    if (!detail || !evidence || !evidence.has_file) {
      return error(404, 'not_found', 'Evidence file not found')
    }

    return new HttpResponse(new Uint8Array([37, 80, 68, 70]), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${evidence.original_filename ?? 'evidence.pdf'}"`,
      },
    })
  }),

  http.get('/api/v1/admin/deals/:id', ({ params }) => {
    if (dealFixtures.failDetail) {
      return error(500, 'server_error', 'Deal detail failed')
    }
    if (dealFixtures.missingDetail) {
      return error(404, 'not_found', 'Deal not found')
    }

    const id = Number(params.id)
    const detail = dealFixtures.details[id]
    if (!detail) {
      return error(404, 'not_found', 'Deal not found')
    }
    return ok(detail)
  }),
]

export { sealedDealDetail }
