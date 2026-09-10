import { http, HttpResponse } from 'msw'
import type { AdminOverview } from '@/features/overview/types'

export const overviewFixture: AdminOverview = {
  generated_at: '2026-09-10T16:00:00+00:00',
  timezone: 'Africa/Lagos',
  users: {
    business_registered: 12,
    ambassador_registered: 20,
    business_active: 10,
    ambassador_active: 18,
    restricted: 1,
    suspended: 1,
    banned: 0,
    business_verified: 8,
    ambassador_verified: 14,
  },
  campaigns: {
    by_status: {
      draft: 2,
      submitted: 3,
      approved: 1,
      active: 5,
      expiring: 1,
      expired: 2,
      deactivated: 0,
      suspended: 0,
      closed: 4,
    },
    featured_flagged: 2,
    awaiting_admin_review: 3,
  },
  deals: {
    total: 40,
    payment_pending: 4,
    sealed: 12,
    completed: 18,
    cancelled: 6,
    payment_confirmed: 30,
  },
  commissions: {
    due: 5,
    overdue: 2,
    paid: 10,
    received: 8,
    boundary: 'Business_to_Ambassador_obligation_not_platform_revenue',
  },
  disputes: {
    open: 3,
    by_status: {
      open: 2,
      under_review: 1,
      resolved: 4,
      closed: 1,
    },
  },
  verification: {
    submissions_awaiting_review: 4,
    submissions_more_information_required: 1,
    submissions_approved: 15,
    submissions_rejected: 2,
  },
  platform_payments: {
    terminology: 'successful_platform_payment_volume',
    boundary: 'Business_to_MarcatursHub_for_campaign_extension_and_campaign_featured_only',
    success_definition: 'platform_payments.status=paid',
    all_time: {
      by_currency: [
        {
          currency: 'NGN',
          successful_payment_count: 7,
          successful_amount_minor: 35000000,
          by_purpose: {
            campaign_extension: {
              successful_payment_count: 4,
              successful_amount_minor: 20000000,
            },
            campaign_featured: {
              successful_payment_count: 3,
              successful_amount_minor: 15000000,
            },
          },
        },
      ],
    },
    today: {
      by_currency: [
        {
          currency: 'NGN',
          successful_payment_count: 1,
          successful_amount_minor: 5000000,
          by_purpose: {
            campaign_extension: {
              successful_payment_count: 1,
              successful_amount_minor: 5000000,
            },
            campaign_featured: {
              successful_payment_count: 0,
              successful_amount_minor: 0,
            },
          },
        },
      ],
    },
    this_month: {
      by_currency: [
        {
          currency: 'NGN',
          successful_payment_count: 3,
          successful_amount_minor: 15000000,
          by_purpose: {
            campaign_extension: {
              successful_payment_count: 2,
              successful_amount_minor: 10000000,
            },
            campaign_featured: {
              successful_payment_count: 1,
              successful_amount_minor: 5000000,
            },
          },
        },
      ],
    },
  },
  attention: {
    campaigns_awaiting_review: 3,
    verification_submissions_awaiting_review: 4,
    open_disputes: 3,
    commissions_overdue: 2,
    deals_payment_pending: 4,
    reported_conversations: 1,
  },
}

export const overviewZeroFixture: AdminOverview = {
  ...overviewFixture,
  users: {
    business_registered: 0,
    ambassador_registered: 0,
    business_active: 0,
    ambassador_active: 0,
    restricted: 0,
    suspended: 0,
    banned: 0,
    business_verified: 0,
    ambassador_verified: 0,
  },
  campaigns: {
    by_status: {
      draft: 0,
      submitted: 0,
      approved: 0,
      active: 0,
      expiring: 0,
      expired: 0,
      deactivated: 0,
      suspended: 0,
      closed: 0,
    },
    featured_flagged: 0,
    awaiting_admin_review: 0,
  },
  deals: {
    total: 0,
    payment_pending: 0,
    sealed: 0,
    completed: 0,
    cancelled: 0,
    payment_confirmed: 0,
  },
  commissions: {
    due: 0,
    overdue: 0,
    paid: 0,
    received: 0,
    boundary: 'Business_to_Ambassador_obligation_not_platform_revenue',
  },
  disputes: {
    open: 0,
    by_status: {
      open: 0,
      under_review: 0,
      resolved: 0,
      closed: 0,
    },
  },
  verification: {
    submissions_awaiting_review: 0,
    submissions_more_information_required: 0,
    submissions_approved: 0,
    submissions_rejected: 0,
  },
  platform_payments: {
    ...overviewFixture.platform_payments,
    all_time: { by_currency: [] },
    today: { by_currency: [] },
    this_month: { by_currency: [] },
  },
  attention: {
    campaigns_awaiting_review: 0,
    verification_submissions_awaiting_review: 0,
    open_disputes: 0,
    commissions_overdue: 0,
    deals_payment_pending: 0,
    reported_conversations: 0,
  },
}

let currentOverview: AdminOverview = overviewFixture

export function resetOverviewFixtures() {
  currentOverview = overviewFixture
}

export function setOverviewFixture(next: AdminOverview) {
  currentOverview = next
}

export const overviewHandlers = [
  http.get('/api/v1/admin/overview', () => {
    return HttpResponse.json({
      success: true,
      data: currentOverview,
    })
  }),
]
