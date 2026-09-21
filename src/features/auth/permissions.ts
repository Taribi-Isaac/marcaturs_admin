import type { AuthUser } from '@/shared/types/auth'

export const SUPER_ADMIN_PERMISSIONS = [
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
  'staff.view',
  'staff.manage',
  'certification.view',
  'certification.manage',
  'certification.learners.view',
] as const

export function hasPermission(
  user: AuthUser | null | undefined,
  permission: string | undefined,
): boolean {
  if (!permission) {
    return true
  }
  return Boolean(user?.permissions?.includes(permission))
}

/**
 * Maps Admin console path prefixes to the view/manage permission that gates the nav item.
 */
export function permissionForPath(pathname: string): string | undefined {
  const path = pathname.split('?')[0] ?? pathname

  if (path === '/account' || path.startsWith('/account/')) {
    return undefined
  }
  if (path === '/overview' || path.startsWith('/overview/')) {
    return 'overview.view'
  }
  if (path === '/attention' || path.startsWith('/attention/')) {
    return 'overview.view'
  }
  if (path === '/verification' || path.startsWith('/verification/')) {
    return 'verification.view'
  }
  if (path === '/campaigns' || path.startsWith('/campaigns/')) {
    return 'campaigns.view'
  }
  if (path === '/deals' || path.startsWith('/deals/')) {
    return 'deals.view'
  }
  if (path === '/disputes' || path.startsWith('/disputes/')) {
    return 'disputes.view'
  }
  if (path === '/users' || path.startsWith('/users/')) {
    return 'users.view'
  }
  if (path === '/moderation' || path.startsWith('/moderation/')) {
    return 'conversations.moderate'
  }
  if (path === '/configuration' || path.startsWith('/configuration/')) {
    return 'configuration.manage'
  }
  if (path === '/staff' || path.startsWith('/staff/')) {
    return 'staff.view'
  }
  // Learner-facing certification surfaces are gated separately from programme authoring.
  if (
    path.startsWith('/certification/learners') ||
    path.startsWith('/certification/certificates')
  ) {
    return 'certification.learners.view'
  }
  if (path === '/certification' || path.startsWith('/certification/')) {
    return 'certification.view'
  }

  return undefined
}

export function canAccessPath(pathname: string, user: AuthUser | null | undefined): boolean {
  return hasPermission(user, permissionForPath(pathname))
}

/**
 * First permitted post-auth destination (MH-FE-020 / MH-DECISION-001).
 */
export function firstPermittedPath(user: AuthUser | null | undefined): string {
  if (hasPermission(user, 'overview.view')) {
    return '/overview'
  }
  if (hasPermission(user, 'verification.view')) {
    return '/verification'
  }
  return '/account'
}

export function resolvePostLoginPath(
  from: string | undefined,
  user: AuthUser | null | undefined,
): string {
  if (from && from !== '/login' && from !== '/forbidden') {
    const pathOnly = from.split('?')[0] ?? from
    if (canAccessPath(pathOnly, user)) {
      return from
    }
  }
  return firstPermittedPath(user)
}
