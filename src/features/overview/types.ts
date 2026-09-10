export type AdminOverviewUsers = {
  business_registered: number
  ambassador_registered: number
  business_active: number
  ambassador_active: number
  restricted: number
  suspended: number
  banned: number
  business_verified: number
  ambassador_verified: number
}

export type AdminOverviewCampaigns = {
  by_status: Record<string, number>
  featured_flagged: number
  awaiting_admin_review: number
}

export type AdminOverviewDeals = {
  total: number
  payment_pending: number
  sealed: number
  completed: number
  cancelled: number
  payment_confirmed: number
}

export type AdminOverviewCommissions = {
  due: number
  overdue: number
  paid: number
  received: number
  boundary: string
}

export type AdminOverviewDisputes = {
  open: number
  by_status: Record<string, number>
}

export type AdminOverviewVerification = {
  submissions_awaiting_review: number
  submissions_more_information_required: number
  submissions_approved: number
  submissions_rejected: number
}

export type PlatformPaymentPurposeTotals = {
  successful_payment_count: number
  successful_amount_minor: number
}

export type PlatformPaymentCurrencyBucket = {
  currency: string
  successful_payment_count: number
  successful_amount_minor: number
  by_purpose: {
    campaign_extension: PlatformPaymentPurposeTotals
    campaign_featured: PlatformPaymentPurposeTotals
  }
}

export type PlatformPaymentWindow = {
  by_currency: PlatformPaymentCurrencyBucket[]
}

export type AdminOverviewPlatformPayments = {
  terminology: string
  boundary: string
  success_definition: string
  all_time: PlatformPaymentWindow
  today: PlatformPaymentWindow
  this_month: PlatformPaymentWindow
}

export type AdminOverviewAttention = {
  campaigns_awaiting_review: number
  verification_submissions_awaiting_review: number
  open_disputes: number
  commissions_overdue: number
  deals_payment_pending: number
  reported_conversations: number
}

export type AdminOverview = {
  generated_at: string
  timezone: string
  users: AdminOverviewUsers
  campaigns: AdminOverviewCampaigns
  deals: AdminOverviewDeals
  commissions: AdminOverviewCommissions
  disputes: AdminOverviewDisputes
  verification: AdminOverviewVerification
  platform_payments: AdminOverviewPlatformPayments
  attention: AdminOverviewAttention
}
