import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import {
  banAdminUser,
  restoreAdminUser,
  restrictAdminUser,
  suspendAdminUser,
} from '@/features/users/api'
import {
  USER_QUERY_KEYS,
  canBan,
  canRestore,
  canRestrict,
  canSuspend,
  hasAnyUserStatusAction,
} from '@/features/users/constants'
import { formatFieldErrors, participantPrimaryLabel } from '@/features/users/format'
import type { AdminUserDetail, UserStatusAction } from '@/features/users/types'
import { UserActionDialog } from '@/features/users/components/UserActionDialog'
import { Button, Notice } from '@/shared/ui'

export function UserActions({ user }: { user: AdminUserDetail }) {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<UserStatusAction | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(user.id) }),
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all }),
    ])
  }

  const mutation = useMutation({
    mutationFn: async (input: { kind: UserStatusAction; reason: string }) => {
      switch (input.kind) {
        case 'restrict':
          return restrictAdminUser(user.id, { reason: input.reason })
        case 'suspend':
          return suspendAdminUser(user.id, { reason: input.reason })
        case 'restore':
          return restoreAdminUser(user.id, { reason: input.reason })
        case 'ban':
          return banAdminUser(user.id, { reason: input.reason })
      }
    },
    onSuccess: async (data, variables) => {
      setKind(null)
      setFormError(null)
      setFieldErrors({})
      const labels: Record<UserStatusAction, string> = {
        restrict: 'Account restricted.',
        suspend: 'Account suspended.',
        restore:
          data.status === 'restricted'
            ? 'Ban lifted. Account is now Restricted.'
            : 'Account restored to Active.',
        ban: 'Account banned.',
      }
      setSuccessMessage(labels[variables.kind])
      await invalidate()
    },
    onError: async (error) => {
      if (error instanceof ApiClientError) {
        if (error.status === 422) {
          setFormError(
            `${error.message} The account status may have changed in another session. Refreshing…`,
          )
          setFieldErrors(formatFieldErrors(error.details))
          await invalidate()
          return
        }
        setFormError(error.message)
        setFieldErrors(formatFieldErrors(error.details))
        return
      }
      setFormError('Unable to complete the account status action.')
    },
  })

  const closeDialog = useCallback(() => {
    if (!mutation.isPending) {
      setKind(null)
      setFormError(null)
      setFieldErrors({})
    }
  }, [mutation.isPending])

  if (!hasAnyUserStatusAction(user.status) && !successMessage && !formError) {
    return (
      <section className="users-panel">
        <h2>Account status actions</h2>
        <p className="users-muted">
          No Admin status actions are available for status <code>{user.status}</code>.
        </p>
      </section>
    )
  }

  function open(next: UserStatusAction) {
    setFormError(null)
    setFieldErrors({})
    setSuccessMessage(null)
    setKind(next)
  }

  const disabled = mutation.isPending

  return (
    <section className="users-panel">
      <h2>Account status actions</h2>
      {successMessage ? (
        <Notice tone="success" title="Action completed">
          {successMessage}
        </Notice>
      ) : null}
      {formError && !kind ? (
        <Notice tone="danger" title="Action failed">
          {formError}
        </Notice>
      ) : null}

      {hasAnyUserStatusAction(user.status) ? (
        <div className="users-actions">
          {canRestrict(user.status) ? (
            <Button variant="secondary" disabled={disabled} onClick={() => open('restrict')}>
              Restrict
            </Button>
          ) : null}
          {canSuspend(user.status) ? (
            <Button variant="danger" disabled={disabled} onClick={() => open('suspend')}>
              Suspend
            </Button>
          ) : null}
          {canBan(user.status) ? (
            <Button variant="danger" disabled={disabled} onClick={() => open('ban')}>
              Ban
            </Button>
          ) : null}
          {canRestore(user.status) ? (
            <Button variant="primary" disabled={disabled} onClick={() => open('restore')}>
              Restore
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="users-muted">
          No further Admin status actions are available for status <code>{user.status}</code>.
        </p>
      )}

      {user.status === 'banned' ? (
        <p className="users-muted">
          Restoring a banned account returns it to <strong>Restricted</strong>, not Active.
        </p>
      ) : null}

      <UserActionDialog
        open={kind != null}
        kind={kind}
        currentStatus={user.status}
        participantName={participantPrimaryLabel(user)}
        participantEmail={user.email}
        participantRole={user.role}
        isSubmitting={mutation.isPending}
        formError={formError}
        fieldErrors={fieldErrors}
        onCancel={closeDialog}
        onSubmit={async (values) => {
          if (!kind) {
            return
          }
          setFormError(null)
          try {
            await mutation.mutateAsync({ kind, reason: values.reason })
          } catch {
            // Pessimistic mutation: ApiClientError is surfaced via onError.
          }
        }}
      />
    </section>
  )
}
