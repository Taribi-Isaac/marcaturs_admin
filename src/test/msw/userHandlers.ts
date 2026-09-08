import { http, HttpResponse } from 'msw'
import type { AdminUserDetail, AdminUserListItem } from '@/features/users/types'
import type { AccountStatus } from '@/shared/types/domain'

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

function resultingStatus(
  action: 'restrict' | 'suspend' | 'restore' | 'ban',
  current: AccountStatus,
): AccountStatus | null {
  const map: Record<string, AccountStatus> = {
    'active:restrict': 'restricted',
    'active:suspend': 'suspended',
    'active:ban': 'banned',
    'restricted:restore': 'active',
    'restricted:suspend': 'suspended',
    'restricted:ban': 'banned',
    'suspended:restore': 'active',
    'suspended:ban': 'banned',
    'banned:restore': 'restricted',
  }
  return map[`${current}:${action}`] ?? null
}

const emptyCounts = {
  campaigns: 0,
  deals: 0,
  open_disputes: 0,
  commissions_due: 0,
  commissions_overdue: 0,
}

export const activeBusinessUser: AdminUserDetail = {
  id: 111,
  role: 'BUSINESS',
  name: 'Ada Solar Owner',
  email: 'business.solar@demo.marcaturshub.test',
  status: 'active',
  email_verified_at: '2026-08-01T10:00:00+00:00',
  created_at: '2026-07-01T10:00:00+00:00',
  updated_at: '2026-09-01T10:00:00+00:00',
  last_login_at: '2026-09-07T12:00:00+00:00',
  profile_summary: {
    legal_name: 'Ada Solar Ventures Ltd',
    trading_name: 'Ada Solar',
  },
  verification_status: 'VERIFIED',
  counts: {
    campaigns: 3,
    deals: 2,
    open_disputes: 1,
    commissions_due: 1,
    commissions_overdue: 1,
  },
  profile: {
    id: 11,
    legal_name: 'Ada Solar Ventures Ltd',
    trading_name: 'Ada Solar',
    description: 'Solar distribution partner.',
    category: 'Energy',
    address: '12 Marina, Lagos',
    operating_location: 'Lagos',
    contact_email: 'ops@adasolar.test',
    contact_phone: '+2348000000001',
    website: 'https://adasolar.test',
    social_links: {},
    created_at: '2026-07-01T10:00:00+00:00',
    updated_at: '2026-08-01T10:00:00+00:00',
  },
  verification_submissions: [
    {
      id: 501,
      requirement_id: 1,
      status: 'approved',
      current_version: 1,
      submitted_at: '2026-07-15T10:00:00+00:00',
      reviewed_at: '2026-07-16T10:00:00+00:00',
    },
  ],
}

export const activeAmbassadorUser: AdminUserDetail = {
  id: 116,
  role: 'AMBASSADOR',
  name: 'Ada Marketer',
  email: 'ambassador.ada@demo.marcaturshub.test',
  status: 'active',
  email_verified_at: '2026-08-02T10:00:00+00:00',
  created_at: '2026-07-02T10:00:00+00:00',
  updated_at: '2026-09-01T10:00:00+00:00',
  last_login_at: '2026-09-06T12:00:00+00:00',
  profile_summary: {
    display_name: 'Ada Growth',
  },
  verification_status: 'PENDING',
  counts: {
    campaigns: 0,
    deals: 4,
    open_disputes: 0,
    commissions_due: 2,
    commissions_overdue: 0,
  },
  profile: {
    id: 21,
    display_name: 'Ada Growth',
    profile_description: 'Campus growth marketer.',
    location: 'Abuja',
    skills: ['TikTok', 'WhatsApp'],
    marketing_interests: ['Solar', 'Fintech'],
    experience: '3 years field marketing',
    created_at: '2026-07-02T10:00:00+00:00',
    updated_at: '2026-08-02T10:00:00+00:00',
  },
  verification_submissions: [],
}

export const restrictedAmbassadorUser: AdminUserDetail = {
  ...activeAmbassadorUser,
  id: 119,
  name: 'Restricted Ambassador',
  email: 'ambassador.restricted@demo.marcaturshub.test',
  status: 'restricted',
  profile_summary: { display_name: 'Restricted Growth' },
  profile: {
    ...(activeAmbassadorUser.profile as AdminUserDetail['profile'] & object),
    id: 29,
    display_name: 'Restricted Growth',
  } as AdminUserDetail['profile'],
  counts: { ...emptyCounts, deals: 1 },
}

export const suspendedBusinessUser: AdminUserDetail = {
  ...activeBusinessUser,
  id: 114,
  name: 'Suspended Biz',
  email: 'business.suspended@demo.marcaturshub.test',
  status: 'suspended',
  profile_summary: {
    legal_name: 'Suspended Logistics Ltd',
    trading_name: 'Suspended Haul',
  },
  profile: {
    ...(activeBusinessUser.profile as object),
    id: 14,
    legal_name: 'Suspended Logistics Ltd',
    trading_name: 'Suspended Haul',
  } as AdminUserDetail['profile'],
  counts: { ...emptyCounts, campaigns: 1 },
}

export const bannedAmbassadorUser: AdminUserDetail = {
  ...activeAmbassadorUser,
  id: 120,
  name: 'Banned Ambassador',
  email: 'ambassador.banned@demo.marcaturshub.test',
  status: 'banned',
  profile_summary: { display_name: 'Banned Growth' },
  profile: {
    ...(activeAmbassadorUser.profile as object),
    id: 30,
    display_name: 'Banned Growth',
  } as AdminUserDetail['profile'],
  counts: emptyCounts,
}

function toListItem(user: AdminUserDetail): AdminUserListItem {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    status: user.status,
    email_verified_at: user.email_verified_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
    profile_summary: user.profile_summary,
    verification_status: user.verification_status,
    counts: user.counts,
  }
}

export const userFixtures = {
  failList: false,
  failDetail: false,
  missingDetail: false,
  forbiddenList: false,
  forbiddenAction: false,
  notFoundAction: false,
  rateLimitedAction: false,
  serverErrorAction: false,
  staleTransitionAction: false,
  validationNextAction: false,
  users: [
    activeBusinessUser,
    activeAmbassadorUser,
    restrictedAmbassadorUser,
    suspendedBusinessUser,
    bannedAmbassadorUser,
  ] as AdminUserDetail[],
}

export function resetUserFixtures() {
  userFixtures.failList = false
  userFixtures.failDetail = false
  userFixtures.missingDetail = false
  userFixtures.forbiddenList = false
  userFixtures.forbiddenAction = false
  userFixtures.notFoundAction = false
  userFixtures.rateLimitedAction = false
  userFixtures.serverErrorAction = false
  userFixtures.staleTransitionAction = false
  userFixtures.validationNextAction = false
  userFixtures.users = [
    structuredClone(activeBusinessUser),
    structuredClone(activeAmbassadorUser),
    structuredClone(restrictedAmbassadorUser),
    structuredClone(suspendedBusinessUser),
    structuredClone(bannedAmbassadorUser),
  ]
}

function findUser(id: number) {
  return userFixtures.users.find((user) => user.id === id)
}

function mutateStatus(
  id: number,
  action: 'restrict' | 'suspend' | 'restore' | 'ban',
  reason: string,
) {
  if (userFixtures.forbiddenAction) {
    return error(403, 'forbidden', 'You are not authorized to perform this action.')
  }
  if (userFixtures.notFoundAction) {
    return error(404, 'not_found', 'The requested resource was not found.')
  }
  if (userFixtures.rateLimitedAction) {
    return error(429, 'rate_limited', 'Too many requests.')
  }
  if (userFixtures.serverErrorAction) {
    return error(500, 'server_error', 'Unexpected server failure.')
  }
  if (userFixtures.validationNextAction) {
    return error(400, 'validation_error', 'The given data was invalid.', {
      reason: ['The reason field is required.'],
    })
  }
  if (userFixtures.staleTransitionAction) {
    return error(422, 'business_validation', 'This account status transition is not allowed.')
  }

  if (!reason || reason.trim().length < 3) {
    return error(400, 'validation_error', 'The given data was invalid.', {
      reason: ['The reason field is required.'],
    })
  }

  const user = findUser(id)
  if (!user) {
    return error(404, 'not_found', 'The requested resource was not found.')
  }

  const next = resultingStatus(action, user.status)
  if (!next) {
    return error(422, 'business_validation', 'This account status transition is not allowed.')
  }

  user.status = next
  user.updated_at = '2026-09-08T18:00:00+00:00'
  return ok(user)
}

export const userHandlers = [
  http.get('*/api/v1/admin/users', ({ request }) => {
    if (userFixtures.forbiddenList) {
      return error(403, 'forbidden', 'Forbidden')
    }
    if (userFixtures.failList) {
      return error(500, 'server_error', 'Unable to load users.')
    }

    const url = new URL(request.url)
    const role = url.searchParams.get('role')
    const status = url.searchParams.get('status')
    const q = url.searchParams.get('q')?.toLowerCase().trim() ?? ''
    const page = Number(url.searchParams.get('page') ?? '1') || 1
    const perPage = Math.min(
      Math.max(1, Number(url.searchParams.get('per_page') ?? '15') || 15),
      100,
    )

    let items = userFixtures.users.map(toListItem)
    if (role === 'BUSINESS' || role === 'AMBASSADOR') {
      items = items.filter((item) => item.role === role)
    }
    if (status) {
      items = items.filter((item) => item.status === status)
    }
    if (q) {
      items = items.filter((item) => {
        const haystack = [
          item.name,
          item.email,
          item.profile_summary && 'legal_name' in item.profile_summary
            ? item.profile_summary.legal_name
            : '',
          item.profile_summary && 'trading_name' in item.profile_summary
            ? item.profile_summary.trading_name
            : '',
          item.profile_summary && 'display_name' in item.profile_summary
            ? item.profile_summary.display_name
            : '',
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

  http.get('*/api/v1/admin/users/:id', ({ params }) => {
    if (userFixtures.failDetail) {
      return error(500, 'server_error', 'Unable to load user.')
    }
    if (userFixtures.missingDetail) {
      return error(404, 'not_found', 'The requested resource was not found.')
    }

    const id = Number(params.id)
    const user = findUser(id)
    if (!user) {
      return error(404, 'not_found', 'The requested resource was not found.')
    }
    return ok(user)
  }),

  http.post('*/api/v1/admin/users/:id/restrict', async ({ params, request }) => {
    const body = (await request.json()) as { reason?: string }
    return mutateStatus(Number(params.id), 'restrict', body.reason ?? '')
  }),

  http.post('*/api/v1/admin/users/:id/suspend', async ({ params, request }) => {
    const body = (await request.json()) as { reason?: string }
    return mutateStatus(Number(params.id), 'suspend', body.reason ?? '')
  }),

  http.post('*/api/v1/admin/users/:id/restore', async ({ params, request }) => {
    const body = (await request.json()) as { reason?: string }
    return mutateStatus(Number(params.id), 'restore', body.reason ?? '')
  }),

  http.post('*/api/v1/admin/users/:id/ban', async ({ params, request }) => {
    const body = (await request.json()) as { reason?: string }
    return mutateStatus(Number(params.id), 'ban', body.reason ?? '')
  }),
]
