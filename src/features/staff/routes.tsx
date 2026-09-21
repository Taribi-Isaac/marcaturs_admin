import type { RouteObject } from 'react-router-dom'
import { StaffPage } from '@/features/staff/StaffPage'
import { StaffDetailPage } from '@/features/staff/StaffDetailPage'

export const staffRoutes: RouteObject[] = [
  { path: 'staff', element: <StaffPage /> },
  { path: 'staff/:id', element: <StaffDetailPage /> },
]
