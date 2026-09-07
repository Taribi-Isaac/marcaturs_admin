import { http, HttpResponse } from 'msw'
import type {
  CampaignAttentionItem,
  DisputeAttentionItem,
  ReportedConversationAttentionItem,
  VerificationSubmissionAttentionItem,
} from '@/features/attention/types'

function paginated<T>(items: T[], total = items.length, perPage = 15) {
  return {
    success: true as const,
    data: items,
    meta: {
      pagination: {
        current_page: 1,
        per_page: perPage,
        total,
        last_page: Math.max(1, Math.ceil(total / perPage)),
        from: items.length ? 1 : null,
        to: items.length || null,
      },
    },
  }
}

export const verificationPendingItem: VerificationSubmissionAttentionItem = {
  id: 101,
  user_id: 11,
  status: 'pending',
  submitted_at: '2026-09-07T09:00:00+00:00',
  reviewed_at: null,
  user: {
    id: 11,
    name: 'Ada Solar Ventures Ltd',
    email: 'business.solar@demo.marcaturshub.test',
    role: 'BUSINESS',
  },
  requirement: {
    id: 1,
    name: 'Business registration certificate',
  },
}

export const verificationUnderReviewItem: VerificationSubmissionAttentionItem = {
  id: 102,
  user_id: 12,
  status: 'under_review',
  submitted_at: '2026-09-06T14:00:00+00:00',
  reviewed_at: null,
  user: {
    id: 12,
    name: 'Chidi Okonkwo',
    email: 'ambassador.chidi@demo.marcaturshub.test',
    role: 'AMBASSADOR',
  },
  requirement: {
    id: 2,
    name: 'Government-issued ID',
  },
}

export const verificationApprovedItem: VerificationSubmissionAttentionItem = {
  id: 199,
  user_id: 11,
  status: 'approved',
  submitted_at: '2026-08-01T10:00:00+00:00',
  reviewed_at: '2026-08-02T10:00:00+00:00',
  user: {
    id: 11,
    name: 'Ada Solar Ventures Ltd',
    email: 'business.solar@demo.marcaturshub.test',
    role: 'BUSINESS',
  },
  requirement: {
    id: 1,
    name: 'Business registration certificate',
  },
}

export const campaignSubmittedItem: CampaignAttentionItem = {
  id: 201,
  title: 'Enterprise Solar Partner Outreach for West Africa Distribution',
  status: 'submitted',
  submitted_at: '2026-09-06T11:00:00+00:00',
  created_at: '2026-09-01T11:00:00+00:00',
  updated_at: '2026-09-06T11:00:00+00:00',
  category: { id: 3, name: 'Technology', slug: 'demo-technology' },
  user: {
    id: 13,
    name: 'TechNova Systems Limited with an Unusually Long Legal Name',
    email: 'business.tech@demo.marcaturshub.test',
    role: 'BUSINESS',
  },
}

export const campaignActiveItem: CampaignAttentionItem = {
  id: 202,
  title: 'Active campaign should not appear',
  status: 'active',
  submitted_at: '2026-08-01T11:00:00+00:00',
  created_at: '2026-08-01T11:00:00+00:00',
  updated_at: '2026-08-10T11:00:00+00:00',
  category: { id: 1, name: 'Energy', slug: 'demo-energy' },
  user: {
    id: 11,
    name: 'Ada Solar Ventures Ltd',
    email: 'business.solar@demo.marcaturshub.test',
    role: 'BUSINESS',
  },
}

export const disputeOpenItem: DisputeAttentionItem = {
  id: 301,
  reference: 'MH-D-DEMO0001',
  status: 'submitted',
  deal_id: 41,
  commission_id: 51,
  description: 'Commission amount disputed after deal completion review.',
  created_at: '2026-09-05T08:00:00+00:00',
  updated_at: '2026-09-05T08:00:00+00:00',
  category: { id: 7, name: 'Commission amount disputed', code: 'commission_amount_disputed' },
  reporter: { id: 21, role: 'AMBASSADOR' },
  accused: { id: 11, role: 'BUSINESS' },
  deal: {
    id: 41,
    business: { id: 11, name: 'Ada Solar Ventures Ltd', role: 'BUSINESS' },
    ambassador: { id: 21, name: 'Ada Nwosu', role: 'AMBASSADOR' },
    campaign: { id: 9, title: 'Solar reseller program', status: 'active' },
  },
}

export const disputeClosedItem: DisputeAttentionItem = {
  id: 399,
  reference: 'MH-D-DEMO0099',
  status: 'closed',
  deal_id: 42,
  commission_id: 52,
  description: 'Closed dispute should not require attention.',
  created_at: '2026-08-01T08:00:00+00:00',
  updated_at: '2026-08-20T08:00:00+00:00',
  category: { id: 7, name: 'Commission amount disputed', code: 'commission_amount_disputed' },
  reporter: { id: 21, role: 'AMBASSADOR' },
  accused: { id: 11, role: 'BUSINESS' },
}

export const reportedConversationItem: ReportedConversationAttentionItem = {
  id: 401,
  reported: true,
  reported_at: '2026-09-04T16:30:00+00:00',
  report_reason:
    'Participant reported unprofessional conduct and repeated off-platform payment requests during negotiation.',
  created_at: '2026-09-01T10:00:00+00:00',
  updated_at: '2026-09-04T16:30:00+00:00',
  business: { id: 11, name: 'Ada Solar Ventures Ltd', role: 'BUSINESS' },
  ambassador: { id: 21, name: 'Ada Nwosu', role: 'AMBASSADOR' },
  reported_by: { id: 11, role: 'BUSINESS' },
}

export type AttentionFixtureState = {
  verificationPending: VerificationSubmissionAttentionItem[]
  verificationUnderReview: VerificationSubmissionAttentionItem[]
  campaignsSubmitted: CampaignAttentionItem[]
  disputes: DisputeAttentionItem[]
  conversations: ReportedConversationAttentionItem[]
  failVerification?: boolean
  failCampaigns?: boolean
  failDisputes?: boolean
  failConversations?: boolean
  forbidCampaigns?: boolean
}

export const attentionFixtures: AttentionFixtureState = {
  verificationPending: [verificationPendingItem],
  verificationUnderReview: [verificationUnderReviewItem],
  campaignsSubmitted: [campaignSubmittedItem],
  disputes: [disputeOpenItem, disputeClosedItem],
  conversations: [reportedConversationItem],
}

export function resetAttentionFixtures(): void {
  attentionFixtures.verificationPending = [verificationPendingItem]
  attentionFixtures.verificationUnderReview = [verificationUnderReviewItem]
  attentionFixtures.campaignsSubmitted = [campaignSubmittedItem]
  attentionFixtures.disputes = [disputeOpenItem, disputeClosedItem]
  attentionFixtures.conversations = [reportedConversationItem]
  attentionFixtures.failVerification = false
  attentionFixtures.failCampaigns = false
  attentionFixtures.failDisputes = false
  attentionFixtures.failConversations = false
  attentionFixtures.forbidCampaigns = false
}

export const attentionHandlers = [
  http.get('/api/v1/admin/verification/submissions', ({ request }) => {
    if (attentionFixtures.failVerification) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'server_error', message: 'Verification queue unavailable.' },
        },
        { status: 500 },
      )
    }

    const status = new URL(request.url).searchParams.get('status')
    if (status === 'pending') {
      return HttpResponse.json(paginated(attentionFixtures.verificationPending))
    }
    if (status === 'under_review') {
      return HttpResponse.json(paginated(attentionFixtures.verificationUnderReview))
    }

    return HttpResponse.json(
      paginated([
        ...attentionFixtures.verificationPending,
        ...attentionFixtures.verificationUnderReview,
        verificationApprovedItem,
      ]),
    )
  }),

  http.get('/api/v1/admin/campaigns', ({ request }) => {
    if (attentionFixtures.forbidCampaigns) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'forbidden', message: 'Forbidden.' },
        },
        { status: 403 },
      )
    }

    if (attentionFixtures.failCampaigns) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'server_error', message: 'Campaign queue unavailable.' },
        },
        { status: 500 },
      )
    }

    const status = new URL(request.url).searchParams.get('status')
    if (status === 'submitted') {
      return HttpResponse.json(paginated(attentionFixtures.campaignsSubmitted))
    }

    return HttpResponse.json(
      paginated([...attentionFixtures.campaignsSubmitted, campaignActiveItem]),
    )
  }),

  http.get('/api/v1/admin/disputes', () => {
    if (attentionFixtures.failDisputes) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'server_error', message: 'Dispute queue unavailable.' },
        },
        { status: 500 },
      )
    }

    return HttpResponse.json(
      paginated(attentionFixtures.disputes, attentionFixtures.disputes.length, 20),
    )
  }),

  http.get('/api/v1/admin/conversations', () => {
    if (attentionFixtures.failConversations) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'server_error', message: 'Conversation queue unavailable.' },
        },
        { status: 500 },
      )
    }

    return HttpResponse.json(
      paginated(attentionFixtures.conversations, attentionFixtures.conversations.length, 50),
    )
  }),
]
