import type { RouteObject } from 'react-router-dom'
import { DealsPage } from '@/features/deals/DealsPage'
import { DealDetailPage } from '@/features/deals/DealDetailPage'

export const dealsRoutes: RouteObject[] = [
  { path: 'deals', element: <DealsPage /> },
  { path: 'deals/:id', element: <DealDetailPage /> },
]
