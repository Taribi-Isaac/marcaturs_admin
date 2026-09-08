import type { VerificationSubmissionAttentionItem } from '@/features/attention/types'
import { campaignSubmittedItem } from '@/test/msw/campaignHandlers'
import { disputeClosedItem, disputeOpenItem } from '@/test/msw/disputeHandlers'
import { reportedConversationItem } from '@/test/msw/moderationHandlers'

export { campaignSubmittedItem, disputeClosedItem, disputeOpenItem, reportedConversationItem }

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

export type AttentionFixtureState = {
  verificationPending: VerificationSubmissionAttentionItem[]
  verificationUnderReview: VerificationSubmissionAttentionItem[]
  failVerification?: boolean
}

export const attentionFixtures: AttentionFixtureState = {
  verificationPending: [verificationPendingItem],
  verificationUnderReview: [verificationUnderReviewItem],
}

export function resetAttentionFixtures(): void {
  attentionFixtures.verificationPending = [verificationPendingItem]
  attentionFixtures.verificationUnderReview = [verificationUnderReviewItem]
  attentionFixtures.failVerification = false
}

export const attentionHandlers: never[] = []
