import type { RouteObject } from 'react-router-dom'
import { DisputesPage } from './DisputesPage'
import { DisputeDetailPage } from './DisputeDetailPage'

export const disputesRoutes: RouteObject[] = [
  { path: 'disputes', element: <DisputesPage /> },
  { path: 'disputes/:id', element: <DisputeDetailPage /> },
]
