import { Navigate, useRoutes } from 'react-router-dom'
import { AppShell } from '@/app/layout/AppShell'
import { AuthGate } from '@/app/providers/AuthGate'
import { NotFoundPage } from '@/app/router/NotFoundPage'
import { attentionRoutes } from '@/features/attention/routes'
import { verificationRoutes } from '@/features/verification/routes'
import { campaignsRoutes } from '@/features/campaigns/routes'
import { disputesRoutes } from '@/features/disputes/routes'
import { moderationRoutes } from '@/features/moderation/routes'
import { configurationRoutes } from '@/features/configuration/routes'
import { accountRoutes } from '@/features/account/routes'

export function AppRouter() {
  const element = useRoutes([
    {
      element: (
        <AuthGate>
          <AppShell />
        </AuthGate>
      ),
      children: [
        { index: true, element: <Navigate to="/attention" replace /> },
        ...attentionRoutes,
        ...verificationRoutes,
        ...campaignsRoutes,
        ...disputesRoutes,
        ...moderationRoutes,
        ...configurationRoutes,
        ...accountRoutes,
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ])

  return element
}
