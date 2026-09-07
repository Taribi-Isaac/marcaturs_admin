import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { AuthBootstrapState } from '@/features/auth/AuthBootstrapState'

/**
 * Protects Admin application routes. Backend authorization remains authoritative.
 */
export function AuthGate() {
  const { status, bootstrapError, refresh, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return <AuthBootstrapState />
  }

  if (status === 'error') {
    return (
      <AuthBootstrapState
        tone="error"
        title="Unable to verify session"
        description={bootstrapError ?? 'The authentication service could not be reached.'}
        onRetry={() => {
          void refresh()
        }}
      />
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (status === 'authenticated_non_admin' || status === 'forbidden') {
    return <Navigate to="/forbidden" replace />
  }

  if (status === 'authenticated_admin') {
    return <Outlet />
  }

  return <AuthBootstrapState />
}
