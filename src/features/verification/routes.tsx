import type { RouteObject } from 'react-router-dom'
import { VerificationPage } from './VerificationPage'
import { VerificationRequirementsPage } from './VerificationRequirementsPage'
import { VerificationSubmissionPage } from './VerificationSubmissionPage'

export const verificationRoutes: RouteObject[] = [
  { path: 'verification', element: <VerificationPage /> },
  { path: 'verification/submissions/:id', element: <VerificationSubmissionPage /> },
  { path: 'verification/requirements', element: <VerificationRequirementsPage /> },
]
