import { Navigate, useRoutes } from 'react-router-dom'
import { AppShell } from '@/app/layout/AppShell'
import { AuthGate } from '@/features/auth/AuthGate'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForbiddenRoutePage } from '@/features/auth/ForbiddenRoutePage'
import { NotFoundPage } from '@/app/router/NotFoundPage'
import { attentionRoutes } from '@/features/attention/routes'
import { verificationRoutes } from '@/features/verification/routes'
import { campaignsRoutes } from '@/features/campaigns/routes'
import { disputesRoutes } from '@/features/disputes/routes'
import { usersRoutes } from '@/features/users/routes'
import { moderationRoutes } from '@/features/moderation/routes'
import { configurationRoutes } from '@/features/configuration/routes'
import { accountRoutes } from '@/features/account/routes'

export function AppRouter() {
  return useRoutes([
    { path: '/login', element: <LoginPage /> },
    { path: '/forbidden', element: <ForbiddenRoutePage /> },
    {
      element: <AuthGate />,
      children: [
        {
          element: <AppShell />,
          children: [
            { index: true, element: <Navigate to="/attention" replace /> },
            ...attentionRoutes,
            ...verificationRoutes,
            ...campaignsRoutes,
            ...disputesRoutes,
            ...usersRoutes,
            ...moderationRoutes,
            ...configurationRoutes,
            ...accountRoutes,
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ])
}
