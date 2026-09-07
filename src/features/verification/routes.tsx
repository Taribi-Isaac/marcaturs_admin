import type { RouteObject } from 'react-router-dom'
import { VerificationPage } from './VerificationPage'
import { VerificationRequirementsPage } from './VerificationRequirementsPage'

export const verificationRoutes: RouteObject[] = [
  { path: 'verification', element: <VerificationPage /> },
  { path: 'verification/requirements', element: <VerificationRequirementsPage /> },
]
