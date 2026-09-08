import type { RouteObject } from 'react-router-dom'
import { UsersPage } from '@/features/users/UsersPage'
import { UserDetailPage } from '@/features/users/UserDetailPage'

export const usersRoutes: RouteObject[] = [
  { path: 'users', element: <UsersPage /> },
  { path: 'users/:id', element: <UserDetailPage /> },
]
