import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ApiClientError,
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  onUnauthorized,
} from '@/shared/api'
import type { AuthStatus, AuthUser, LoginPayload } from '@/shared/types/auth'
import { AUTH_ME_QUERY_KEY } from '@/features/auth/constants'
import { AuthContext, type AuthContextValue } from '@/features/auth/authContext'

type Gate =
  | { mode: 'default' }
  | { mode: 'signed_out' }
  | { mode: 'non_admin' }
  | { mode: 'forbidden'; message: string }

function statusFromQuery(
  isFetched: boolean,
  data: AuthUser | undefined,
  error: unknown,
  gate: Gate,
): AuthStatus {
  if (gate.mode === 'non_admin') {
    return 'authenticated_non_admin'
  }
  if (gate.mode === 'forbidden') {
    return 'forbidden'
  }
  if (gate.mode === 'signed_out') {
    return 'unauthenticated'
  }

  if (!isFetched) {
    return 'unknown'
  }

  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      return 'unauthenticated'
    }
    if (error.status === 403) {
      return 'forbidden'
    }
    return 'error'
  }

  if (error) {
    return 'error'
  }

  if (data) {
    return data.role === 'ADMIN' ? 'authenticated_admin' : 'authenticated_non_admin'
  }

  return 'unauthenticated'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [gate, setGate] = useState<Gate>({ mode: 'default' })

  const meQuery = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: gate.mode === 'default',
  })

  useEffect(() => {
    return onUnauthorized(() => {
      setGate({ mode: 'signed_out' })
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY })
      queryClient.clear()
    })
  }, [queryClient])

  const login = useCallback(
    async (payload: LoginPayload) => {
      setGate({ mode: 'default' })
      await loginRequest(payload)

      // Session authority is always /auth/me — never trust the login payload alone.
      const me = await fetchCurrentUser()

      if (me.role !== 'ADMIN') {
        try {
          await logoutRequest()
        } catch {
          // Ignore logout failures after non-admin login.
        }
        queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY })
        queryClient.clear()
        setGate({ mode: 'non_admin' })
        return
      }

      queryClient.setQueryData(AUTH_ME_QUERY_KEY, me)
      setGate({ mode: 'default' })
    },
    [queryClient],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } catch {
      // Expired sessions still clear locally.
    } finally {
      queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY })
      queryClient.clear()
      setGate({ mode: 'signed_out' })
    }
  }, [queryClient])

  const refresh = useCallback(async () => {
    setGate({ mode: 'default' })
    await queryClient.fetchQuery({
      queryKey: AUTH_ME_QUERY_KEY,
      queryFn: ({ signal }) => fetchCurrentUser(signal),
    })
  }, [queryClient])

  const status = statusFromQuery(meQuery.isFetched, meQuery.data, meQuery.error, gate)
  const user = status === 'authenticated_admin' ? (meQuery.data ?? null) : null

  const bootstrapError =
    gate.mode === 'forbidden'
      ? gate.message
      : meQuery.error instanceof ApiClientError
        ? meQuery.error.message
        : meQuery.error
          ? 'Unable to verify authentication.'
          : null

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      bootstrapError,
      isBootstrapping: status === 'unknown',
      login,
      logout,
      refresh,
    }),
    [status, user, bootstrapError, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
