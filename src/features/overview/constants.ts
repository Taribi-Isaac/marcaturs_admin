export const OVERVIEW_QUERY_KEYS = {
  all: ['overview'] as const,
  detail: () => [...OVERVIEW_QUERY_KEYS.all, 'detail'] as const,
} as const

/**
 * Refresh policy: operational snapshot, not live telemetry.
 * - staleTime 30s avoids hammering the aggregate endpoint
 * - refetchOnWindowFocus keeps Admin returning to a reasonably current view
 * - no short-interval polling / WebSocket aggregation
 */
export const OVERVIEW_QUERY_OPTIONS = {
  staleTime: 30_000,
  refetchOnWindowFocus: true,
  retry: false,
} as const

export const CAMPAIGN_STATUS_ORDER = [
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

export const LIVE_CAMPAIGN_STATUSES = new Set(['active', 'expiring'])

export const OVERVIEW_DESTINATIONS = {
  attention: '/attention',
  verification: '/verification',
  verificationPending: '/verification?status=pending',
  campaignsSubmitted: '/campaigns?status=submitted',
  campaignsActive: '/campaigns?status=active',
  deals: '/deals',
  dealsPaymentPending: '/deals?status=payment_pending',
  dealsCommissionOverdue: '/deals?commission_overdue=1',
  disputes: '/disputes?view=actionable',
  users: '/users',
  usersBusiness: '/users?role=BUSINESS',
  usersAmbassador: '/users?role=AMBASSADOR',
  usersRestricted: '/users?status=restricted',
  usersSuspended: '/users?status=suspended',
  usersBanned: '/users?status=banned',
  moderation: '/moderation/reported-conversations',
} as const
