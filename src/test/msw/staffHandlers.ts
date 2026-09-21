import { http, HttpResponse } from 'msw'
import type { AccountStatus } from '@/shared/types/domain'
import type { StaffRole } from '@/shared/types/auth'
import type {
  AdminStaffDetail,
  AdminStaffInvitation,
  AdminStaffListItem,
} from '@/features/staff/types'
import { SUPER_ADMIN_PERMISSIONS } from '@/features/auth/permissions'
import { session } from '@/test/msw/handlers'

function permissionsForRole(role: StaffRole | null): string[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return [...SUPER_ADMIN_PERMISSIONS]
    case 'OPERATIONS':
      return [
        'overview.view',
        'users.view',
        'users.manage',
        'campaigns.view',
        'campaigns.manage',
        'verification.view',
        'verification.review',
        'verification.configure',
        'deals.view',
        'disputes.view',
        'disputes.manage',
        'configuration.manage',
        'conversations.moderate',
      ]
    case 'VERIFICATION':
      return ['overview.view', 'verification.view', 'verification.review']
    case 'MODERATION':
      return [
        'overview.view',
        'campaigns.view',
        'campaigns.manage',
        'disputes.view',
        'conversations.moderate',
      ]
    default:
      return []
  }
}

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

function asListItem(detail: AdminStaffDetail): AdminStaffListItem {
  return {
    id: detail.id,
    name: detail.name,
    email: detail.email,
    role: detail.role,
    staff_role: detail.staff_role,
    status: detail.status,
    email_verified_at: detail.email_verified_at,
    last_login_at: detail.last_login_at,
    created_at: detail.created_at,
    permissions: detail.permissions,
  }
}

export const superAdminStaff: AdminStaffDetail = {
  id: 1,
  name: 'Primary Demo Admin',
  email: 'admin.primary@demo.marcaturshub.test',
  role: 'ADMIN',
  staff_role: 'SUPER_ADMIN',
  status: 'active',
  email_verified_at: '2026-09-01T10:00:00+00:00',
  last_login_at: '2026-09-07T12:00:00+00:00',
  created_at: '2026-09-01T09:00:00+00:00',
  permissions: permissionsForRole('SUPER_ADMIN'),
  created_by: null,
  events: [
    {
      id: 1,
      action: 'invitation_accepted',
      previous_staff_role: null,
      new_staff_role: 'SUPER_ADMIN',
      previous_status: null,
      new_status: 'active',
      reason: null,
      actor: null,
      created_at: '2026-09-01T09:00:00+00:00',
    },
  ],
}

export const operationsStaff: AdminStaffDetail = {
  id: 31,
  name: 'Ops Desk',
  email: 'ops.desk@demo.marcaturshub.test',
  role: 'ADMIN',
  staff_role: 'OPERATIONS',
  status: 'active',
  email_verified_at: '2026-08-10T10:00:00+00:00',
  last_login_at: '2026-09-06T09:00:00+00:00',
  created_at: '2026-08-10T10:00:00+00:00',
  permissions: permissionsForRole('OPERATIONS'),
  created_by: {
    id: 1,
    name: 'Primary Demo Admin',
    email: 'admin.primary@demo.marcaturshub.test',
  },
  events: [
    {
      id: 11,
      action: 'invitation_accepted',
      previous_staff_role: null,
      new_staff_role: 'OPERATIONS',
      previous_status: null,
      new_status: 'active',
      reason: null,
      actor: {
        id: 1,
        name: 'Primary Demo Admin',
        email: 'admin.primary@demo.marcaturshub.test',
      },
      created_at: '2026-08-10T10:05:00+00:00',
    },
  ],
}

export const verificationStaff: AdminStaffDetail = {
  id: 32,
  name: 'Verifier One',
  email: 'verifier.one@demo.marcaturshub.test',
  role: 'ADMIN',
  staff_role: 'VERIFICATION',
  status: 'active',
  email_verified_at: '2026-08-11T10:00:00+00:00',
  last_login_at: '2026-09-05T09:00:00+00:00',
  created_at: '2026-08-11T10:00:00+00:00',
  permissions: permissionsForRole('VERIFICATION'),
  created_by: {
    id: 1,
    name: 'Primary Demo Admin',
    email: 'admin.primary@demo.marcaturshub.test',
  },
  events: [],
}

export const suspendedStaff: AdminStaffDetail = {
  id: 33,
  name: 'Suspended Mod',
  email: 'suspended.mod@demo.marcaturshub.test',
  role: 'ADMIN',
  staff_role: 'MODERATION',
  status: 'suspended',
  email_verified_at: '2026-08-12T10:00:00+00:00',
  last_login_at: '2026-08-20T09:00:00+00:00',
  created_at: '2026-08-12T10:00:00+00:00',
  permissions: permissionsForRole('MODERATION'),
  created_by: {
    id: 1,
    name: 'Primary Demo Admin',
    email: 'admin.primary@demo.marcaturshub.test',
  },
  events: [
    {
      id: 21,
      action: 'disabled',
      previous_staff_role: 'MODERATION',
      new_staff_role: 'MODERATION',
      previous_status: 'active',
      new_status: 'suspended',
      reason: 'Access no longer required',
      actor: {
        id: 1,
        name: 'Primary Demo Admin',
        email: 'admin.primary@demo.marcaturshub.test',
      },
      created_at: '2026-08-21T10:00:00+00:00',
    },
  ],
}

function cloneStaff(detail: AdminStaffDetail): AdminStaffDetail {
  return {
    ...detail,
    permissions: [...detail.permissions],
    events: detail.events.map((event) => ({
      ...event,
      actor: event.actor ? { ...event.actor } : null,
    })),
    created_by: detail.created_by ? { ...detail.created_by } : null,
  }
}

const initialStaff: AdminStaffDetail[] = [
  cloneStaff(superAdminStaff),
  cloneStaff(operationsStaff),
  cloneStaff(verificationStaff),
  cloneStaff(suspendedStaff),
]

type StaffFixtures = {
  staff: AdminStaffDetail[]
  invitations: AdminStaffInvitation[]
  failList: boolean
  failDetail: boolean
  missingDetail: boolean
  forbiddenAction: boolean
  staleTransitionAction: boolean
  acceptFail: boolean
}

export const staffFixtures: StaffFixtures = {
  staff: initialStaff.map(cloneStaff),
  invitations: [],
  failList: false,
  failDetail: false,
  missingDetail: false,
  forbiddenAction: false,
  staleTransitionAction: false,
  acceptFail: false,
}

export function resetStaffFixtures(): void {
  staffFixtures.staff = initialStaff.map(cloneStaff)
  staffFixtures.invitations = []
  staffFixtures.failList = false
  staffFixtures.failDetail = false
  staffFixtures.missingDetail = false
  staffFixtures.forbiddenAction = false
  staffFixtures.staleTransitionAction = false
  staffFixtures.acceptFail = false
}

function requireStaffView() {
  if (!session.user?.permissions?.includes('staff.view')) {
    return error(403, 'forbidden', 'Not authorized to view staff.')
  }
  return null
}

function requireStaffManage() {
  if (!session.user?.permissions?.includes('staff.manage')) {
    return error(403, 'forbidden', 'Not authorized to manage staff.')
  }
  return null
}

export const staffHandlers = [
  http.get('/api/v1/admin/staff', ({ request }) => {
    const denied = requireStaffView()
    if (denied) {
      return denied
    }
    if (staffFixtures.failList) {
      return error(500, 'server_error', 'Unexpected server failure.')
    }

    const url = new URL(request.url)
    const staffRole = url.searchParams.get('staff_role') as StaffRole | null
    const status = url.searchParams.get('status') as AccountStatus | null
    const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
    const page = Number(url.searchParams.get('page') ?? '1') || 1
    const perPage = Number(url.searchParams.get('per_page') ?? '15') || 15

    let rows = staffFixtures.staff.map(asListItem)
    if (staffRole) {
      rows = rows.filter((row) => row.staff_role === staffRole)
    }
    if (status) {
      rows = rows.filter((row) => row.status === status)
    }
    if (q) {
      rows = rows.filter(
        (row) => row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q),
      )
    }

    return HttpResponse.json(paginated(rows, page, perPage))
  }),

  http.get('/api/v1/admin/staff/:id', ({ params }) => {
    const denied = requireStaffView()
    if (denied) {
      return denied
    }
    if (staffFixtures.failDetail) {
      return error(500, 'server_error', 'Unexpected server failure.')
    }
    if (staffFixtures.missingDetail) {
      return error(404, 'not_found', 'Staff member not found.')
    }

    const id = Number(params.id)
    const staff = staffFixtures.staff.find((row) => row.id === id)
    if (!staff) {
      return error(404, 'not_found', 'Staff member not found.')
    }
    return ok(staff)
  }),

  http.post('/api/v1/admin/staff/invitations', async ({ request }) => {
    const denied = requireStaffManage()
    if (denied) {
      return denied
    }

    const body = (await request.json()) as {
      name?: string
      email?: string
      staff_role?: StaffRole
    }

    if (!body.name || !body.email || !body.staff_role) {
      return error(400, 'validation_error', 'The given data was invalid.', {
        name: body.name ? undefined : ['The name field is required.'],
        email: body.email ? undefined : ['The email field is required.'],
        staff_role: body.staff_role ? undefined : ['The staff role field is required.'],
      })
    }

    if (staffFixtures.staff.some((row) => row.email === body.email)) {
      return error(400, 'validation_error', 'The given data was invalid.', {
        email: ['The email has already been taken.'],
      })
    }

    const invitation: AdminStaffInvitation = {
      id: 900 + staffFixtures.invitations.length,
      name: body.name,
      email: body.email,
      staff_role: body.staff_role,
      expires_at: '2026-09-15T10:00:00+00:00',
      accepted_at: null,
      revoked_at: null,
      created_at: '2026-09-12T10:00:00+00:00',
      invited_by_user_id: session.user?.id ?? null,
      debug_token: `debug-invite-token-${900 + staffFixtures.invitations.length}-abcdefghijklmnopqrstuvwxyz`,
    }
    staffFixtures.invitations.push(invitation)
    return ok(invitation, 201)
  }),

  http.patch('/api/v1/admin/staff/:id', async ({ params, request }) => {
    const denied = requireStaffManage()
    if (denied) {
      return denied
    }
    if (staffFixtures.forbiddenAction) {
      return error(403, 'forbidden', 'Not authorized to change staff role.')
    }

    const id = Number(params.id)
    const staff = staffFixtures.staff.find((row) => row.id === id)
    if (!staff) {
      return error(404, 'not_found', 'Staff member not found.')
    }
    if (session.user?.id === id) {
      return error(403, 'forbidden', 'You cannot change your own staff role.')
    }

    const body = (await request.json()) as { staff_role?: StaffRole }
    if (!body.staff_role) {
      return error(400, 'validation_error', 'The given data was invalid.', {
        staff_role: ['The staff role field is required.'],
      })
    }

    const previousRole = staff.staff_role
    staff.staff_role = body.staff_role
    staff.permissions = permissionsForRole(body.staff_role)
    staff.events = [
      {
        id: staff.events.length + 100,
        action: 'role_changed',
        previous_staff_role: previousRole,
        new_staff_role: body.staff_role,
        previous_status: staff.status,
        new_status: staff.status,
        reason: null,
        actor: session.user
          ? { id: session.user.id, name: session.user.name, email: session.user.email }
          : null,
        created_at: '2026-09-12T11:00:00+00:00',
      },
      ...staff.events,
    ]

    return ok(asListItem(staff))
  }),

  http.post('/api/v1/admin/staff/:id/disable', async ({ params, request }) => {
    const denied = requireStaffManage()
    if (denied) {
      return denied
    }
    if (staffFixtures.forbiddenAction) {
      return error(403, 'forbidden', 'Not authorized to disable staff.')
    }
    if (staffFixtures.staleTransitionAction) {
      return error(422, 'business_validation', 'This staff account is already disabled.')
    }

    const id = Number(params.id)
    const staff = staffFixtures.staff.find((row) => row.id === id)
    if (!staff) {
      return error(404, 'not_found', 'Staff member not found.')
    }
    if (session.user?.id === id) {
      return error(403, 'forbidden', 'You cannot disable your own staff account.')
    }

    const body = (await request.json()) as { reason?: string }
    if (!body.reason || body.reason.trim().length < 3) {
      return error(400, 'validation_error', 'The given data was invalid.', {
        reason: ['Reason must be at least 3 characters.'],
      })
    }

    if (staff.status === 'suspended') {
      return error(422, 'business_validation', 'This staff account is already disabled.')
    }
    if (staff.status === 'banned') {
      return error(
        422,
        'business_validation',
        'Banned staff accounts cannot be disabled through this action.',
      )
    }

    const previousStatus = staff.status
    staff.status = 'suspended'
    staff.events = [
      {
        id: staff.events.length + 200,
        action: 'disabled',
        previous_staff_role: staff.staff_role,
        new_staff_role: staff.staff_role,
        previous_status: previousStatus,
        new_status: 'suspended',
        reason: body.reason,
        actor: session.user
          ? { id: session.user.id, name: session.user.name, email: session.user.email }
          : null,
        created_at: '2026-09-12T11:05:00+00:00',
      },
      ...staff.events,
    ]

    return ok(asListItem(staff))
  }),

  http.post('/api/v1/admin/staff/:id/restore', async ({ params, request }) => {
    const denied = requireStaffManage()
    if (denied) {
      return denied
    }

    const id = Number(params.id)
    const staff = staffFixtures.staff.find((row) => row.id === id)
    if (!staff) {
      return error(404, 'not_found', 'Staff member not found.')
    }

    const body = (await request.json()) as { reason?: string }
    if (!body.reason || body.reason.trim().length < 3) {
      return error(400, 'validation_error', 'The given data was invalid.', {
        reason: ['Reason must be at least 3 characters.'],
      })
    }

    if (staff.status !== 'suspended') {
      return error(
        422,
        'business_validation',
        'Only suspended staff accounts can be restored through this action.',
      )
    }

    staff.status = 'active'
    staff.events = [
      {
        id: staff.events.length + 300,
        action: 'restored',
        previous_staff_role: staff.staff_role,
        new_staff_role: staff.staff_role,
        previous_status: 'suspended',
        new_status: 'active',
        reason: body.reason,
        actor: session.user
          ? { id: session.user.id, name: session.user.name, email: session.user.email }
          : null,
        created_at: '2026-09-12T11:10:00+00:00',
      },
      ...staff.events,
    ]

    return ok(asListItem(staff))
  }),

  http.post('/api/v1/auth/staff-invitations/accept', async ({ request }) => {
    if (staffFixtures.acceptFail) {
      return error(422, 'business_validation', 'This invitation is no longer valid.')
    }

    const body = (await request.json()) as {
      token?: string
      password?: string
      password_confirmation?: string
    }

    if (!body.token || !body.password || !body.password_confirmation) {
      return error(400, 'validation_error', 'The given data was invalid.', {
        token: body.token ? undefined : ['The token field is required.'],
        password: body.password ? undefined : ['The password field is required.'],
        password_confirmation: body.password_confirmation
          ? undefined
          : ['The password confirmation field is required.'],
      })
    }

    if (body.password !== body.password_confirmation) {
      return error(400, 'validation_error', 'The given data was invalid.', {
        password: ['The password confirmation does not match.'],
      })
    }

    const invitation = staffFixtures.invitations.find((row) => row.debug_token === body.token)
    if (!invitation || invitation.revoked_at || invitation.accepted_at) {
      return error(422, 'business_validation', 'This invitation is no longer valid.')
    }

    invitation.accepted_at = '2026-09-12T12:00:00+00:00'
    const newStaff: AdminStaffDetail = {
      id: 500 + staffFixtures.staff.length,
      name: invitation.name,
      email: invitation.email,
      role: 'ADMIN',
      staff_role: invitation.staff_role,
      status: 'active',
      email_verified_at: '2026-09-12T12:00:00+00:00',
      last_login_at: null,
      created_at: '2026-09-12T12:00:00+00:00',
      permissions: permissionsForRole(invitation.staff_role),
      created_by: invitation.invited_by_user_id
        ? {
            id: invitation.invited_by_user_id,
            name: 'Primary Demo Admin',
            email: 'admin.primary@demo.marcaturshub.test',
          }
        : null,
      events: [],
    }
    staffFixtures.staff.push(newStaff)

    return ok(
      {
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        status: newStaff.status,
        email_verified_at: newStaff.email_verified_at,
        last_login_at: newStaff.last_login_at,
        created_at: newStaff.created_at,
        staff_role: newStaff.staff_role,
        permissions: newStaff.permissions,
      },
      201,
    )
  }),
]
