import { http, HttpResponse } from 'msw'
import type {
  ReportedConversationAttentionItem,
  VerificationSubmissionAttentionItem,
} from '@/features/attention/types'
import { campaignSubmittedItem } from '@/test/msw/campaignHandlers'
import { disputeClosedItem, disputeOpenItem } from '@/test/msw/disputeHandlers'

export { campaignSubmittedItem, disputeClosedItem, disputeOpenItem }

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
  conversations: ReportedConversationAttentionItem[]
  failVerification?: boolean
  failConversations?: boolean
}

export const attentionFixtures: AttentionFixtureState = {
  verificationPending: [verificationPendingItem],
  verificationUnderReview: [verificationUnderReviewItem],
  conversations: [reportedConversationItem],
}

export function resetAttentionFixtures(): void {
  attentionFixtures.verificationPending = [verificationPendingItem]
  attentionFixtures.verificationUnderReview = [verificationUnderReviewItem]
  attentionFixtures.conversations = [reportedConversationItem]
  attentionFixtures.failVerification = false
  attentionFixtures.failConversations = false
}

export const attentionHandlers = [
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
