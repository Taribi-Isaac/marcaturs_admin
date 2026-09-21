import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { firstPermittedPath, hasPermission } from '@/features/auth/permissions'

export function RequirePermission({
  permission,
  children,
}: {
  permission?: string
  children: ReactNode
}) {
  const { user } = useAuth()

  if (!hasPermission(user, permission)) {
    return <Navigate to={firstPermittedPath(user)} replace />
  }

  return children
}
