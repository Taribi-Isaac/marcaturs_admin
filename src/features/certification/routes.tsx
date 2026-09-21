import type { RouteObject } from 'react-router-dom'
import { ProgrammesPage } from '@/features/certification/ProgrammesPage'
import { ProgrammeDetailPage } from '@/features/certification/ProgrammeDetailPage'
import { VersionDetailPage } from '@/features/certification/VersionDetailPage'
import { LearnersPage } from '@/features/certification/LearnersPage'
import { LearnerDetailPage } from '@/features/certification/LearnerDetailPage'
import { CertificateDetailPage } from '@/features/certification/CertificateDetailPage'

/**
 * Authoring surfaces gated by `certification.view`. Mutations inside these pages
 * are additionally gated by `certification.manage` in the UI; the backend stays
 * authoritative.
 */
export const certificationProgrammeRoutes: RouteObject[] = [
  { path: 'certification/programmes', element: <ProgrammesPage /> },
  { path: 'certification/programmes/:programmeId', element: <ProgrammeDetailPage /> },
  {
    path: 'certification/programmes/:programmeId/versions/:versionNumber',
    element: <VersionDetailPage />,
  },
]

/** Learner records gated by `certification.learners.view`. */
export const certificationLearnerRoutes: RouteObject[] = [
  { path: 'certification/learners', element: <LearnersPage /> },
  { path: 'certification/learners/:enrollmentId', element: <LearnerDetailPage /> },
  { path: 'certification/certificates/:certificateId', element: <CertificateDetailPage /> },
]
