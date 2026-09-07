import type { ReactNode } from 'react'

/**
 * Architectural placeholder for MH-FE-003 authentication.
 * Currently passes children through without enforcing session state.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  return <>{children}</>
}
