import { useRoutes } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { AppShell } from '@/app/layout/AppShell'
import { AuthGate } from '@/features/auth/AuthGate'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForbiddenRoutePage } from '@/features/auth/ForbiddenRoutePage'
import { FirstPermittedRedirect } from '@/features/auth/FirstPermittedRedirect'
import { RequirePermission } from '@/features/auth/RequirePermission'
import { NotFoundPage } from '@/app/router/NotFoundPage'
import { overviewRoutes } from '@/features/overview/routes'
import { attentionRoutes } from '@/features/attention/routes'
import { verificationRoutes } from '@/features/verification/routes'
import { campaignsRoutes } from '@/features/campaigns/routes'
import { dealsRoutes } from '@/features/deals/routes'
import { disputesRoutes } from '@/features/disputes/routes'
import { usersRoutes } from '@/features/users/routes'
import { moderationRoutes } from '@/features/moderation/routes'
import {
  certificationLearnerRoutes,
  certificationProgrammeRoutes,
} from '@/features/certification/routes'
import { configurationRoutes } from '@/features/configuration/routes'
import { staffRoutes } from '@/features/staff/routes'
import { AcceptInvitationPage } from '@/features/staff/AcceptInvitationPage'
import { accountRoutes } from '@/features/account/routes'

function withPermission(permission: string, routes: RouteObject[]): RouteObject[] {
  return routes.map((route) => ({
    ...route,
    element: <RequirePermission permission={permission}>{route.element}</RequirePermission>,
  }))
}

export function AppRouter() {
  return useRoutes([
    { path: '/login', element: <LoginPage /> },
    { path: '/forbidden', element: <ForbiddenRoutePage /> },
    { path: '/staff/accept-invitation', element: <AcceptInvitationPage /> },
    {
      element: <AuthGate />,
      children: [
        {
          element: <AppShell />,
          children: [
            { index: true, element: <FirstPermittedRedirect /> },
            ...withPermission('overview.view', overviewRoutes),
            ...withPermission('overview.view', attentionRoutes),
            ...withPermission('verification.view', verificationRoutes),
            ...withPermission('campaigns.view', campaignsRoutes),
            ...withPermission('deals.view', dealsRoutes),
            ...withPermission('disputes.view', disputesRoutes),
            ...withPermission('users.view', usersRoutes),
            ...withPermission('conversations.moderate', moderationRoutes),
            ...withPermission('certification.view', certificationProgrammeRoutes),
            ...withPermission('certification.learners.view', certificationLearnerRoutes),
            ...withPermission('configuration.manage', configurationRoutes),
            ...withPermission('staff.view', staffRoutes),
            ...accountRoutes,
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ])
}
