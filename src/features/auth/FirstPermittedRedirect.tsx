import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { firstPermittedPath } from '@/features/auth/permissions'

export function FirstPermittedRedirect() {
  const { user } = useAuth()
  return <Navigate to={firstPermittedPath(user)} replace />
}
