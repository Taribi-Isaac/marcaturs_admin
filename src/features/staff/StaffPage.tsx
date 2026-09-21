import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ApiClientError } from '@/shared/api'
import { fetchAdminStaff, inviteAdminStaff } from '@/features/staff/api'
import {
  DEFAULT_STAFF_PER_PAGE,
  MAX_STAFF_PER_PAGE,
  STAFF_QUERY_KEYS,
  STAFF_ROLES,
} from '@/features/staff/constants'
import { formatFieldErrors } from '@/features/staff/format'
import { StaffFilters } from '@/features/staff/components/StaffFilters'
import { StaffTable } from '@/features/staff/components/StaffTable'
import { InviteStaffDialog } from '@/features/staff/components/InviteStaffDialog'
import { useAuth } from '@/features/auth/useAuth'
import { hasPermission } from '@/features/auth/permissions'
import type { StaffRole } from '@/shared/types/auth'
import type { AccountStatus } from '@/shared/types/domain'
import { Button, ErrorState, ForbiddenState, PageHeader } from '@/shared/ui'

export function StaffPage() {
  const { user } = useAuth()
  const canManage = hasPermission(user, 'staff.manage')
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteFieldErrors, setInviteFieldErrors] = useState<Record<string, string>>({})
  const [debugToken, setDebugToken] = useState<string | null>(null)

  const roleParam = searchParams.get('staff_role') ?? 'all'
  const staffRole = STAFF_ROLES.includes(roleParam as StaffRole)
    ? (roleParam as StaffRole)
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
    Number(searchParams.get('per_page') ?? DEFAULT_STAFF_PER_PAGE) || DEFAULT_STAFF_PER_PAGE
  const perPage = Math.min(Math.max(1, perPageRaw), MAX_STAFF_PER_PAGE)

  const query = useQuery({
    queryKey: STAFF_QUERY_KEYS.list({
      staff_role: staffRole ?? 'all',
      status: status ?? 'all',
      q: q ?? '',
      page,
      per_page: perPage,
    }),
    queryFn: ({ signal }) =>
      fetchAdminStaff(
        {
          staff_role: staffRole,
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

  const inviteMutation = useMutation({
    mutationFn: inviteAdminStaff,
    onSuccess: async (invitation) => {
      setInviteError(null)
      setInviteFieldErrors({})
      setDebugToken(invitation.debug_token ?? null)
      await queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.all })
      if (!invitation.debug_token) {
        setInviteOpen(false)
      }
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        setInviteError(error.message)
        setInviteFieldErrors(formatFieldErrors(error.details))
        return
      }
      setInviteError('Unable to send staff invitation.')
    },
  })

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.all })
      await query.refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const forbidden = query.error instanceof ApiClientError && query.error.status === 403

  return (
    <div className="users-page">
      <PageHeader
        title="Staff"
        description="Manage Admin staff accounts, roles, and invitations."
        breadcrumbs={[{ label: 'Staff' }]}
        actions={
          canManage ? (
            <Button
              variant="primary"
              onClick={() => {
                setInviteError(null)
                setInviteFieldErrors({})
                setDebugToken(null)
                setInviteOpen(true)
              }}
            >
              Invite staff
            </Button>
          ) : null
        }
      />

      <StaffFilters
        onRefresh={() => {
          void handleRefresh()
        }}
        isRefreshing={isRefreshing || query.isFetching}
      />

      {forbidden ? (
        <ForbiddenState />
      ) : query.error ? (
        <ErrorState
          title="Unable to load staff"
          description={
            query.error instanceof ApiClientError
              ? query.error.message
              : 'The staff list could not be loaded.'
          }
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : (
        <StaffTable
          rows={query.data?.items ?? []}
          isLoading={query.isLoading}
          pagination={query.data?.pagination}
          onResetFilters={() => setSearchParams({})}
        />
      )}

      <InviteStaffDialog
        open={inviteOpen}
        isSubmitting={inviteMutation.isPending}
        formError={inviteError}
        fieldErrors={inviteFieldErrors}
        debugToken={debugToken}
        onCancel={() => {
          if (!inviteMutation.isPending) {
            setInviteOpen(false)
            setInviteError(null)
            setInviteFieldErrors({})
            setDebugToken(null)
          }
        }}
        onSubmit={async (values) => {
          setInviteError(null)
          try {
            await inviteMutation.mutateAsync(values)
          } catch {
            // Surfaced via onError.
          }
        }}
      />
    </div>
  )
}
