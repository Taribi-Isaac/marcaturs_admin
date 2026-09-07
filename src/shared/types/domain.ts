/**
 * Backend domain statuses used by Admin UI.
 * Keep values aligned with Laravel enums — do not invent product statuses here.
 */

export const campaignStatuses = [
  'draft',
  'submitted',
  'approved',
  'active',
  'expiring',
  'expired',
  'deactivated',
  'suspended',
  'closed',
] as const

export type CampaignStatus = (typeof campaignStatuses)[number]

export const dealStatuses = ['payment_pending', 'sealed', 'completed', 'cancelled'] as const
export type DealStatus = (typeof dealStatuses)[number]

export const commissionStatuses = ['due', 'paid', 'received'] as const
export type CommissionStatus = (typeof commissionStatuses)[number]

export const disputeStatuses = [
  'submitted',
  'under_review',
  'evidence_requested',
  'decision_pending',
  'resolved',
  'closed',
] as const

export type DisputeStatus = (typeof disputeStatuses)[number]

export const verificationSubmissionStatuses = [
  'pending',
  'under_review',
  'approved',
  'rejected',
  'more_information_required',
] as const

export type VerificationSubmissionStatus = (typeof verificationSubmissionStatuses)[number]

export const accountStatuses = ['active', 'restricted', 'suspended', 'banned'] as const
export type AccountStatus = (typeof accountStatuses)[number]

export type DomainStatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'
