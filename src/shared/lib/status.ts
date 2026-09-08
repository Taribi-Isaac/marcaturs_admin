import type {
  AccountStatus,
  CampaignStatus,
  CommissionStatus,
  DealStatus,
  DisputeStatus,
  DomainStatusTone,
  VerificationSubmissionStatus,
} from '@/shared/types/domain'

const campaignTone: Record<CampaignStatus, DomainStatusTone> = {
  draft: 'neutral',
  submitted: 'info',
  approved: 'info',
  active: 'success',
  expiring: 'warning',
  expired: 'neutral',
  deactivated: 'neutral',
  suspended: 'danger',
  closed: 'neutral',
}

const dealTone: Record<DealStatus, DomainStatusTone> = {
  payment_pending: 'warning',
  sealed: 'info',
  completed: 'success',
  cancelled: 'neutral',
}

const commissionTone: Record<CommissionStatus, DomainStatusTone> = {
  due: 'warning',
  paid: 'info',
  received: 'success',
}

const disputeTone: Record<DisputeStatus, DomainStatusTone> = {
  submitted: 'info',
  under_review: 'warning',
  evidence_requested: 'warning',
  decision_pending: 'warning',
  resolved: 'success',
  closed: 'neutral',
}

const verificationTone: Record<VerificationSubmissionStatus, DomainStatusTone> = {
  pending: 'info',
  under_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  more_information_required: 'warning',
}

const accountTone: Record<AccountStatus, DomainStatusTone> = {
  active: 'success',
  restricted: 'warning',
  suspended: 'danger',
  banned: 'danger',
}

const verificationOverallTone: Record<string, DomainStatusTone> = {
  not_started: 'neutral',
  pending: 'info',
  under_review: 'warning',
  verified: 'success',
  rejected: 'danger',
  more_information_required: 'warning',
}

export type StatusDomain =
  | 'campaign'
  | 'deal'
  | 'commission'
  | 'dispute'
  | 'verification_submission'
  | 'verification_overall'
  | 'account'

export function resolveStatusTone(domain: StatusDomain, status: string): DomainStatusTone {
  switch (domain) {
    case 'campaign':
      return isKey(campaignTone, status) ? campaignTone[status] : 'neutral'
    case 'deal':
      return isKey(dealTone, status) ? dealTone[status] : 'neutral'
    case 'commission':
      return isKey(commissionTone, status) ? commissionTone[status] : 'neutral'
    case 'dispute':
      return isKey(disputeTone, status) ? disputeTone[status] : 'neutral'
    case 'verification_submission':
      return isKey(verificationTone, status) ? verificationTone[status] : 'neutral'
    case 'verification_overall': {
      const key = status.toLowerCase()
      return Object.prototype.hasOwnProperty.call(verificationOverallTone, key)
        ? verificationOverallTone[key]!
        : 'neutral'
    }
    case 'account':
      return isKey(accountTone, status) ? accountTone[status] : 'neutral'
    default:
      return 'neutral'
  }
}

export function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isKey<T extends Record<string, unknown>>(map: T, key: string): key is keyof T & string {
  return Object.prototype.hasOwnProperty.call(map, key)
}
