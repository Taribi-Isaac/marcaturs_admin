import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ApiClientError } from '@/shared/api'
import { fetchAdminUsers } from '@/features/users/api'
import {
  DEFAULT_USERS_PER_PAGE,
  MAX_USERS_PER_PAGE,
  USER_QUERY_KEYS,
} from '@/features/users/constants'
import { UserFilters } from '@/features/users/components/UserFilters'
import { UserTable } from '@/features/users/components/UserTable'
import type { ParticipantRole } from '@/features/users/types'
import type { AccountStatus } from '@/shared/types/domain'
import { ErrorState, ForbiddenState, PageHeader } from '@/shared/ui'

export function UsersPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const roleParam = searchParams.get('role') ?? 'all'
  const role =
    roleParam === 'BUSINESS' || roleParam === 'AMBASSADOR'
      ? (roleParam as ParticipantRole)
      : undefined

  const statusParam = searchParams.get('status') ?? 'all'
  const status =
    statusParam === 'active' ||
    statusParam === 'restricted' ||
    statusParam === 'suspended' ||
    statusParam === 'banned'
      ? (statusParam as AccountStatus)
      : undefined

  const q = searchParams.get('q')?.trim() || undefined
  const page = Number(searchParams.get('page') ?? '1') || 1
  const perPageRaw =
    Number(searchParams.get('per_page') ?? DEFAULT_USERS_PER_PAGE) || DEFAULT_USERS_PER_PAGE
  const perPage = Math.min(Math.max(1, perPageRaw), MAX_USERS_PER_PAGE)

  const query = useQuery({
    queryKey: USER_QUERY_KEYS.list({
      role: role ?? 'all',
      status: status ?? 'all',
      q: q ?? '',
      page,
      per_page: perPage,
    }),
    queryFn: ({ signal }) =>
      fetchAdminUsers(
        {
          role,
          status,
          q,
          page,
          per_page: perPage,
        },
        signal,
      ),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all })
      await query.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const forbidden = query.error instanceof ApiClientError && query.error.status === 403

  return (
    <div className="users-page">
      <PageHeader
        title="Users"
        description="Operational desk for Business and Ambassador participant accounts."
        breadcrumbs={[{ label: 'Users' }]}
      />

      <UserFilters
        onRefresh={() => {
          void handleRefresh()
        }}
        isRefreshing={isRefreshing || query.isFetching}
      />

      {forbidden ? (
        <ForbiddenState />
      ) : query.error ? (
        <ErrorState
          title="Unable to load participants"
          description={
            query.error instanceof ApiClientError
              ? query.error.message
              : 'The participant list could not be loaded.'
          }
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : (
        <UserTable
          rows={query.data?.items ?? []}
          isLoading={query.isLoading}
          pagination={query.data?.pagination}
          onResetFilters={() => setSearchParams({})}
        />
      )}
    </div>
  )
}
