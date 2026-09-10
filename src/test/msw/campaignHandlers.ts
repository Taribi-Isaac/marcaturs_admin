import { http, HttpResponse } from 'msw'
import type {
  AdminCampaign,
  CampaignExtension,
  CampaignFeaturedPurchase,
  CampaignMarketingResource,
} from '@/features/campaigns/types'
import type { CampaignAttentionItem } from '@/features/attention/types'
import type { CampaignStatus } from '@/shared/types/domain'

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

function error(status: number, code: string, message: string, details?: unknown) {
  return HttpResponse.json(
    {
      success: false as const,
      error: { code, message, ...(details ? { details } : {}) },
    },
    { status },
  )
}

const techUser = {
  id: 13,
  name: 'TechNova Systems Limited with an Unusually Long Legal Name',
  email: 'business.tech@demo.marcaturshub.test',
  role: 'BUSINESS',
}

const solarUser = {
  id: 11,
  name: 'Ada Solar Ventures Ltd',
  email: 'business.solar@demo.marcaturshub.test',
  role: 'BUSINESS',
}

export const submittedCampaign: AdminCampaign = {
  id: 201,
  title: 'Enterprise Solar Partner Outreach for West Africa Distribution',
  status: 'submitted',
  category: { id: 3, name: 'Technology', slug: 'demo-technology' },
  current_version: { id: 901, version_number: 2, status: 'submitted' },
  listing_starts_at: null,
  listing_expires_at: null,
  submitted_at: '2026-09-06T11:00:00+00:00',
  approved_at: null,
  activated_at: null,
  deactivated_at: null,
  expired_at: null,
  closed_at: null,
  suspended_at: null,
  review_reason: null,
  created_at: '2026-09-01T11:00:00+00:00',
  updated_at: '2026-09-06T11:00:00+00:00',
  user: techUser,
}

export const approvedCampaign: AdminCampaign = {
  id: 203,
  title: 'Approved logistics channel program',
  status: 'approved',
  category: { id: 4, name: 'Logistics', slug: 'demo-logistics' },
  current_version: { id: 903, version_number: 1, status: 'approved' },
  listing_starts_at: null,
  listing_expires_at: null,
  submitted_at: '2026-08-20T10:00:00+00:00',
  approved_at: '2026-08-21T10:00:00+00:00',
  activated_at: null,
  deactivated_at: null,
  expired_at: null,
  closed_at: null,
  suspended_at: null,
  review_reason: null,
  created_at: '2026-08-15T10:00:00+00:00',
  updated_at: '2026-08-21T10:00:00+00:00',
  user: solarUser,
}

export const activeCampaign: AdminCampaign = {
  id: 202,
  title: 'Active solar reseller program',
  status: 'active',
  category: { id: 1, name: 'Energy', slug: 'demo-energy' },
  current_version: {
    id: 902,
    version_number: 3,
    status: 'published',
    product_name: 'Solar street light installation kit',
    product_description: 'Campus solar kit for municipal and school installs.',
    pricing_method: 'fixed',
    price_amount: '250000.00',
    price_currency: 'NGN',
    service_area: 'Lagos and Ogun',
    commission_type: 'percentage',
    commission_rate: '10.00',
    commission_amount: null,
    commission_trigger: 'payment_confirmation',
    commission_trigger_description: 'After Business confirms qualifying payment',
    commission_payment_deadline_days: 7,
    minimum_qualifying_amount: '100000.00',
    qualifying_conditions: 'Full kit sale completed',
    refund_cancellation_rules: 'No refund after installation begins',
    approved_claims: 'Reliable solar lighting for campuses',
    prohibited_claims: 'Guaranteed investment returns',
    brand_use_rules: 'Use approved logo assets only',
    geographic_customer_restrictions: 'Nigeria only',
    approved_copy: 'Light your campus safely with Ada Solar.',
    marketing_links: ['https://adasolar.test/kit'],
    payment_destination_name: 'Ada Solar Ops',
    payment_provider: 'bank_transfer',
    terms: 'Standard partner terms apply.',
    published_at: '2026-07-25T11:00:00+00:00',
  },
  listing_starts_at: '2026-08-01T00:00:00+00:00',
  listing_expires_at: '2026-10-01T00:00:00+00:00',
  submitted_at: '2026-07-20T11:00:00+00:00',
  approved_at: '2026-07-21T11:00:00+00:00',
  activated_at: '2026-08-01T00:00:00+00:00',
  deactivated_at: null,
  expired_at: null,
  closed_at: null,
  suspended_at: null,
  review_reason: null,
  created_at: '2026-07-15T11:00:00+00:00',
  updated_at: '2026-08-10T11:00:00+00:00',
  user: solarUser,
  cover_image: {
    available: true,
    url: 'http://localhost/api/v1/admin/campaigns/202/cover/download',
    mime_type: 'image/jpeg',
    size_bytes: 20480,
    original_filename: 'solar-cover.jpg',
  },
}

/** Active campaign with published version but sparse optional commercial fields. */
export const sparsePublishedCampaign: AdminCampaign = {
  ...activeCampaign,
  id: 205,
  title: 'Sparse published commercial terms campaign',
  current_version: {
    id: 905,
    version_number: 1,
    status: 'published',
    product_name: 'Sparse product',
    product_description: null,
    pricing_method: null,
    price_amount: null,
    price_currency: 'NGN',
    service_area: null,
    commission_type: 'percentage',
    commission_rate: '5.00',
    commission_amount: null,
    commission_trigger: null,
    commission_trigger_description: null,
    commission_payment_deadline_days: null,
    minimum_qualifying_amount: null,
    qualifying_conditions: null,
    refund_cancellation_rules: null,
    approved_claims: null,
    prohibited_claims: null,
    brand_use_rules: null,
    geographic_customer_restrictions: null,
    approved_copy: null,
    marketing_links: [],
    payment_destination_name: 'Sparse Dest',
    payment_provider: null,
    terms: null,
    published_at: '2026-08-01T10:00:00+00:00',
  },
}

/** Campaign with no current version bound. */
export const draftWithoutVersionCampaign: AdminCampaign = {
  id: 206,
  title: 'Draft without current version',
  status: 'draft',
  category: { id: 3, name: 'Technology', slug: 'demo-technology' },
  current_version: null,
  listing_starts_at: null,
  listing_expires_at: null,
  submitted_at: null,
  approved_at: null,
  activated_at: null,
  deactivated_at: null,
  expired_at: null,
  closed_at: null,
  suspended_at: null,
  review_reason: null,
  created_at: '2026-09-01T09:00:00+00:00',
  updated_at: '2026-09-01T09:00:00+00:00',
  user: techUser,
}

export const closedCampaign: AdminCampaign = {
  id: 204,
  title: 'Closed pilot campaign',
  status: 'closed',
  category: { id: 3, name: 'Technology', slug: 'demo-technology' },
  current_version: { id: 904, version_number: 1, status: 'closed' },
  listing_starts_at: '2026-01-01T00:00:00+00:00',
  listing_expires_at: '2026-03-01T00:00:00+00:00',
  submitted_at: '2025-12-01T11:00:00+00:00',
  approved_at: '2025-12-02T11:00:00+00:00',
  activated_at: '2026-01-01T00:00:00+00:00',
  deactivated_at: null,
  expired_at: null,
  closed_at: '2026-02-15T11:00:00+00:00',
  suspended_at: null,
  review_reason: 'Closed after pilot completion.',
  created_at: '2025-11-20T11:00:00+00:00',
  updated_at: '2026-02-15T11:00:00+00:00',
  user: techUser,
}

export const campaignSubmittedItem: CampaignAttentionItem = {
  id: submittedCampaign.id,
  title: submittedCampaign.title,
  status: submittedCampaign.status,
  submitted_at: submittedCampaign.submitted_at,
  created_at: submittedCampaign.created_at,
  updated_at: submittedCampaign.updated_at,
  category: submittedCampaign.category
    ? {
        id: submittedCampaign.category.id,
        name: submittedCampaign.category.name,
        slug: submittedCampaign.category.slug,
      }
    : null,
  user: submittedCampaign.user ?? null,
}

export const demoResource: CampaignMarketingResource = {
  id: 701,
  type: 'document',
  title: 'Partner one-pager',
  description: 'Demo marketing one-pager metadata.',
  mime_type: 'application/pdf',
  original_filename: 'partner-one-pager.pdf',
  size_bytes: 4096,
  sort_order: 1,
  created_at: '2026-09-01T12:00:00+00:00',
  updated_at: '2026-09-01T12:00:00+00:00',
}

export const demoFeatured: CampaignFeaturedPurchase = {
  id: 801,
  campaign_id: activeCampaign.id,
  package_name: 'Featured 14-day',
  duration_days: 14,
  amount_minor: 2500000,
  currency: 'NGN',
  activated_at: '2026-08-10T00:00:00+00:00',
  expires_at: '2026-08-24T00:00:00+00:00',
  is_active: true,
  payment: {
    id: 901,
    reference: 'MH-PAY-FEAT-001',
    purpose: 'campaign_featured',
    provider: 'paystack',
    status: 'paid',
    amount_minor: 2500000,
    currency: 'NGN',
    duration_days: 14,
    paid_at: '2026-08-09T18:00:00+00:00',
  },
}

export const demoExtension: CampaignExtension = {
  id: 851,
  campaign_id: closedCampaign.id,
  duration_days: 30,
  amount_minor: 1500000,
  currency: 'NGN',
  previous_status: 'expired',
  resulting_status: 'active',
  previous_listing_expires_at: '2026-02-01T00:00:00+00:00',
  resulting_listing_expires_at: '2026-03-03T00:00:00+00:00',
  applied_at: '2026-02-01T12:00:00+00:00',
  payment: {
    id: 902,
    reference: 'MH-PAY-EXT-001',
    purpose: 'campaign_extension',
    provider: 'paystack',
    status: 'paid',
    amount_minor: 1500000,
    currency: 'NGN',
    duration_days: 30,
    paid_at: '2026-02-01T11:55:00+00:00',
  },
}

export type CampaignFixtureState = {
  campaigns: AdminCampaign[]
  resources: Record<number, CampaignMarketingResource[]>
  featured: Record<number, CampaignFeaturedPurchase[]>
  extensions: Record<number, CampaignExtension[]>
  failList: boolean
  forbidList: boolean
  conflictNextAction: boolean
  validationNextAction: boolean
  failDownload: boolean
}

function defaultCampaigns(): AdminCampaign[] {
  return [
    structuredClone(submittedCampaign),
    structuredClone(approvedCampaign),
    structuredClone(activeCampaign),
    structuredClone(closedCampaign),
    structuredClone(sparsePublishedCampaign),
    structuredClone(draftWithoutVersionCampaign),
  ]
}

export const campaignFixtures: CampaignFixtureState = {
  campaigns: defaultCampaigns(),
  resources: {
    [submittedCampaign.id]: [structuredClone(demoResource)],
    [activeCampaign.id]: [],
    [approvedCampaign.id]: [],
    [closedCampaign.id]: [],
    [sparsePublishedCampaign.id]: [],
    [draftWithoutVersionCampaign.id]: [],
  },
  featured: {
    [activeCampaign.id]: [structuredClone(demoFeatured)],
    [submittedCampaign.id]: [],
    [approvedCampaign.id]: [],
    [closedCampaign.id]: [],
    [sparsePublishedCampaign.id]: [],
    [draftWithoutVersionCampaign.id]: [],
  },
  extensions: {
    [closedCampaign.id]: [structuredClone(demoExtension)],
    [submittedCampaign.id]: [],
    [approvedCampaign.id]: [],
    [activeCampaign.id]: [],
    [sparsePublishedCampaign.id]: [],
    [draftWithoutVersionCampaign.id]: [],
  },
  failList: false,
  forbidList: false,
  conflictNextAction: false,
  validationNextAction: false,
  failDownload: false,
}

export function resetCampaignFixtures(): void {
  campaignFixtures.campaigns = defaultCampaigns()
  campaignFixtures.resources = {
    [submittedCampaign.id]: [structuredClone(demoResource)],
    [activeCampaign.id]: [],
    [approvedCampaign.id]: [],
    [closedCampaign.id]: [],
    [sparsePublishedCampaign.id]: [],
    [draftWithoutVersionCampaign.id]: [],
  }
  campaignFixtures.featured = {
    [activeCampaign.id]: [structuredClone(demoFeatured)],
    [submittedCampaign.id]: [],
    [approvedCampaign.id]: [],
    [closedCampaign.id]: [],
    [sparsePublishedCampaign.id]: [],
    [draftWithoutVersionCampaign.id]: [],
  }
  campaignFixtures.extensions = {
    [closedCampaign.id]: [structuredClone(demoExtension)],
    [submittedCampaign.id]: [],
    [approvedCampaign.id]: [],
    [activeCampaign.id]: [],
    [sparsePublishedCampaign.id]: [],
    [draftWithoutVersionCampaign.id]: [],
  }
  campaignFixtures.failList = false
  campaignFixtures.forbidList = false
  campaignFixtures.conflictNextAction = false
  campaignFixtures.validationNextAction = false
  campaignFixtures.failDownload = false
}

function findCampaign(id: number): AdminCampaign | undefined {
  return campaignFixtures.campaigns.find((item) => item.id === id)
}

function applyStatus(campaign: AdminCampaign, status: CampaignStatus, reason?: string | null) {
  campaign.status = status
  campaign.updated_at = new Date().toISOString()
  if (reason !== undefined) {
    campaign.review_reason = reason
  }
  if (status === 'approved') {
    campaign.approved_at = campaign.updated_at
  }
  if (status === 'active') {
    campaign.activated_at = campaign.updated_at
  }
  if (status === 'suspended') {
    campaign.suspended_at = campaign.updated_at
  }
  if (status === 'closed') {
    campaign.closed_at = campaign.updated_at
  }
  return campaign
}

function parseBody(request: Request): Promise<Record<string, unknown>> {
  return request.json().catch(() => ({}))
}

export const campaignHandlers = [
  http.get('/api/v1/admin/campaigns', ({ request }) => {
    if (campaignFixtures.forbidList) {
      return error(403, 'forbidden', 'Forbidden.')
    }
    if (campaignFixtures.failList) {
      return error(500, 'server_error', 'Campaign queue unavailable.')
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const page = Number(url.searchParams.get('page') ?? '1') || 1

    let items = [...campaignFixtures.campaigns]
    if (status) {
      items = items.filter((item) => item.status === status)
    }

    return HttpResponse.json(paginated(items, page, 15))
  }),

  http.get('/api/v1/admin/campaigns/:id', ({ params }) => {
    const campaign = findCampaign(Number(params.id))
    if (!campaign) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    return ok(campaign)
  }),

  http.post('/api/v1/admin/campaigns/:id/approve', ({ params }) => {
    const campaign = findCampaign(Number(params.id))
    if (!campaign) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    if (campaignFixtures.conflictNextAction) {
      campaignFixtures.conflictNextAction = false
      return error(409, 'conflict', 'Campaign status changed. Refresh and try again.')
    }
    if (campaign.status !== 'submitted') {
      return error(409, 'conflict', 'Only submitted campaigns can be approved.')
    }
    return ok(applyStatus(campaign, 'approved'))
  }),

  http.post('/api/v1/admin/campaigns/:id/reject', async ({ params, request }) => {
    const campaign = findCampaign(Number(params.id))
    if (!campaign) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    if (campaignFixtures.conflictNextAction) {
      campaignFixtures.conflictNextAction = false
      return error(409, 'conflict', 'Campaign status changed. Refresh and try again.')
    }
    if (campaignFixtures.validationNextAction) {
      campaignFixtures.validationNextAction = false
      return error(422, 'validation_error', 'The given data was invalid.', {
        reason: ['Reason is required.'],
      })
    }
    const body = await parseBody(request)
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (!reason) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        reason: ['Reason is required.'],
      })
    }
    if (campaign.status !== 'submitted') {
      return error(409, 'conflict', 'Only submitted campaigns can be rejected.')
    }
    return ok(applyStatus(campaign, 'draft', reason))
  }),

  http.post('/api/v1/admin/campaigns/:id/request-modification', async ({ params, request }) => {
    const campaign = findCampaign(Number(params.id))
    if (!campaign) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    const body = await parseBody(request)
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (!reason) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        reason: ['Reason is required.'],
      })
    }
    if (campaign.status !== 'submitted') {
      return error(409, 'conflict', 'Only submitted campaigns can request modification.')
    }
    return ok(applyStatus(campaign, 'draft', reason))
  }),

  http.post('/api/v1/admin/campaigns/:id/activate', ({ params }) => {
    const campaign = findCampaign(Number(params.id))
    if (!campaign) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    if (campaign.status !== 'approved') {
      return error(409, 'conflict', 'Only approved campaigns can be activated.')
    }
    return ok(applyStatus(campaign, 'active'))
  }),

  http.post('/api/v1/admin/campaigns/:id/suspend', async ({ params, request }) => {
    const campaign = findCampaign(Number(params.id))
    if (!campaign) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    const body = await parseBody(request)
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
    if (!reason) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        reason: ['Reason is required.'],
      })
    }
    if (campaign.status !== 'active' && campaign.status !== 'expiring') {
      return error(409, 'conflict', 'Only active or expiring campaigns can be suspended.')
    }
    return ok(applyStatus(campaign, 'suspended', reason))
  }),

  http.post('/api/v1/admin/campaigns/:id/close', async ({ params, request }) => {
    const campaign = findCampaign(Number(params.id))
    if (!campaign) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    const body = await parseBody(request)
    const reason = typeof body.reason === 'string' ? body.reason.trim() : null
    const closable = ['submitted', 'approved', 'active', 'expiring', 'suspended']
    if (!closable.includes(campaign.status)) {
      return error(409, 'conflict', 'Campaign cannot be closed from its current status.')
    }
    return ok(applyStatus(campaign, 'closed', reason))
  }),

  http.get('/api/v1/admin/campaigns/:id/resources', ({ params }) => {
    const id = Number(params.id)
    if (!findCampaign(id)) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    return ok(campaignFixtures.resources[id] ?? [])
  }),

  http.get('/api/v1/admin/campaigns/:id/resources/:resourceId/download', ({ params }) => {
    if (campaignFixtures.failDownload) {
      return error(404, 'not_found', 'Marketing resource file is missing from storage.')
    }
    const id = Number(params.id)
    const resourceId = Number(params.resourceId)
    const resource = (campaignFixtures.resources[id] ?? []).find((item) => item.id === resourceId)
    if (!resource) {
      return error(404, 'not_found', 'Marketing resource not found.')
    }
    return new HttpResponse(
      new Blob(['demo-resource'], { type: resource.mime_type ?? 'text/plain' }),
      {
        status: 200,
        headers: {
          'Content-Type': resource.mime_type ?? 'text/plain',
          'Content-Disposition': `attachment; filename="${resource.original_filename ?? 'resource.bin'}"`,
        },
      },
    )
  }),

  http.get('/api/v1/admin/campaigns/:id/cover/download', ({ params }) => {
    if (campaignFixtures.failDownload) {
      return error(404, 'not_found', 'Cover file is missing from storage.')
    }
    const id = Number(params.id)
    const campaign = findCampaign(id)
    if (!campaign?.cover_image?.available) {
      return error(404, 'not_found', 'Cover not found.')
    }
    return new HttpResponse(new Blob(['demo-cover'], { type: 'image/jpeg' }), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="${campaign.cover_image.original_filename ?? 'cover.jpg'}"`,
      },
    })
  }),

  http.get('/api/v1/admin/campaigns/:id/cover', ({ params }) => {
    const id = Number(params.id)
    const campaign = findCampaign(id)
    if (!campaign) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    if (!campaign.cover_image?.available) {
      return error(404, 'not_found', 'Cover not found.')
    }
    return ok({
      ...campaign.cover_image,
      url: `http://localhost/api/v1/admin/campaigns/${id}/cover/download`,
    })
  }),

  http.get('/api/v1/admin/campaigns/:id/featured', ({ params }) => {
    const id = Number(params.id)
    if (!findCampaign(id)) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    return ok(campaignFixtures.featured[id] ?? [])
  }),

  http.get('/api/v1/admin/campaigns/:id/extensions', ({ params }) => {
    const id = Number(params.id)
    if (!findCampaign(id)) {
      return error(404, 'not_found', 'Campaign not found.')
    }
    return ok(campaignFixtures.extensions[id] ?? [])
  }),
]
