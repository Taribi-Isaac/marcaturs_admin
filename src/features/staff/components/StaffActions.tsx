import { useCallback, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { changeAdminStaffRole, disableAdminStaff, restoreAdminStaff } from '@/features/staff/api'
import {
  STAFF_QUERY_KEYS,
  STAFF_ROLES,
  canDisableStaff,
  canRestoreStaff,
  hasAnyStaffStatusAction,
  isSuperAdminRoleTransition,
} from '@/features/staff/constants'
import { formatFieldErrors, formatStaffRole } from '@/features/staff/format'
import type { AdminStaffDetail, StaffStatusAction } from '@/features/staff/types'
import { StaffStatusDialog } from '@/features/staff/components/StaffStatusDialog'
import { useAuth } from '@/features/auth/useAuth'
import { hasPermission } from '@/features/auth/permissions'
import type { StaffRole } from '@/shared/types/auth'
import { Button, ConfirmDialog, Notice, SelectField } from '@/shared/ui'

export function StaffActions({ staff }: { staff: AdminStaffDetail }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canManage = hasPermission(user, 'staff.manage')
  const isSelf = user?.id === staff.id

  const [statusKind, setStatusKind] = useState<StaffStatusAction | null>(null)
  const [pendingRole, setPendingRole] = useState<StaffRole | null>(null)
  const serverRole = staff.staff_role ?? 'OPERATIONS'
  const [roleDraft, setRoleDraft] = useState<StaffRole>(serverRole)
  const [trackedRoleKey, setTrackedRoleKey] = useState(`${staff.id}:${serverRole}`)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const roleKey = `${staff.id}:${serverRole}`
  if (trackedRoleKey !== roleKey) {
    setTrackedRoleKey(roleKey)
    setRoleDraft(serverRole)
  }
  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.detail(staff.id) }),
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEYS.all }),
    ])
  }

  const roleMutation = useMutation({
    mutationFn: (nextRole: StaffRole) => changeAdminStaffRole(staff.id, { staff_role: nextRole }),
    onSuccess: async (_data, nextRole) => {
      setPendingRole(null)
      setFormError(null)
      setSuccessMessage(`Staff role updated to ${formatStaffRole(nextRole)}.`)
      await invalidate()
    },
    onError: async (error) => {
      setPendingRole(null)
      if (error instanceof ApiClientError) {
        setFormError(error.message)
        setFieldErrors(formatFieldErrors(error.details))
        if (error.status === 422 || error.status === 403) {
          await invalidate()
        }
        return
      }
      setFormError('Unable to change staff role.')
    },
  })

  const statusMutation = useMutation({
    mutationFn: async (input: { kind: StaffStatusAction; reason: string }) => {
      if (input.kind === 'disable') {
        return disableAdminStaff(staff.id, { reason: input.reason })
      }
      return restoreAdminStaff(staff.id, { reason: input.reason })
    },
    onSuccess: async (_data, variables) => {
      setStatusKind(null)
      setFormError(null)
      setFieldErrors({})
      setSuccessMessage(
        variables.kind === 'disable' ? 'Staff account disabled.' : 'Staff account restored.',
      )
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
      setFormError('Unable to complete the staff status action.')
    },
  })

  const closeStatusDialog = useCallback(() => {
    if (!statusMutation.isPending) {
      setStatusKind(null)
      setFormError(null)
      setFieldErrors({})
    }
  }, [statusMutation.isPending])

  if (!canManage) {
    return (
      <section className="users-panel">
        <h2>Staff actions</h2>
        <p className="users-muted">You can view this staff account but cannot manage it.</p>
      </section>
    )
  }

  const disabled = roleMutation.isPending || statusMutation.isPending
  const currentRole = staff.staff_role

  function requestRoleChange() {
    setFormError(null)
    setSuccessMessage(null)
    if (!roleDraft || roleDraft === currentRole) {
      return
    }
    if (isSuperAdminRoleTransition(currentRole, roleDraft)) {
      setPendingRole(roleDraft)
      return
    }
    void roleMutation.mutateAsync(roleDraft).catch(() => {
      // Surfaced via onError.
    })
  }

  return (
    <section className="users-panel">
      <h2>Staff actions</h2>
      {successMessage ? (
        <Notice tone="success" title="Action completed">
          {successMessage}
        </Notice>
      ) : null}
      {formError && !statusKind && !pendingRole ? (
        <Notice tone="danger" title="Action failed">
          {formError}
        </Notice>
      ) : null}

      {isSelf ? (
        <p className="users-muted">
          You cannot change your own staff role or disable your own account.
        </p>
      ) : (
        <>
          <div className="users-actions" style={{ flexWrap: 'wrap', alignItems: 'end' }}>
            <SelectField
              id="staff-change-role"
              label="Change staff role"
              value={roleDraft}
              disabled={disabled}
              onChange={(event) => setRoleDraft(event.target.value as StaffRole)}
            >
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {formatStaffRole(role)}
                </option>
              ))}
            </SelectField>
            <Button
              variant="secondary"
              disabled={disabled || roleDraft === currentRole}
              onClick={requestRoleChange}
            >
              Update role
            </Button>
          </div>

          {hasAnyStaffStatusAction(staff.status) ? (
            <div className="users-actions">
              {canDisableStaff(staff.status) ? (
                <Button
                  variant="danger"
                  disabled={disabled}
                  onClick={() => {
                    setFormError(null)
                    setFieldErrors({})
                    setSuccessMessage(null)
                    setStatusKind('disable')
                  }}
                >
                  Disable
                </Button>
              ) : null}
              {canRestoreStaff(staff.status) ? (
                <Button
                  variant="primary"
                  disabled={disabled}
                  onClick={() => {
                    setFormError(null)
                    setFieldErrors({})
                    setSuccessMessage(null)
                    setStatusKind('restore')
                  }}
                >
                  Restore
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="users-muted">
              No disable/restore actions are available for status <code>{staff.status}</code>.
            </p>
          )}
        </>
      )}

      <StaffStatusDialog
        open={statusKind != null}
        kind={statusKind}
        currentStatus={staff.status}
        staffName={staff.name}
        staffEmail={staff.email}
        staffRole={staff.staff_role}
        isSubmitting={statusMutation.isPending}
        formError={formError}
        fieldErrors={fieldErrors}
        onCancel={closeStatusDialog}
        onSubmit={async (values) => {
          if (!statusKind) {
            return
          }
          setFormError(null)
          try {
            await statusMutation.mutateAsync({ kind: statusKind, reason: values.reason })
          } catch {
            // Pessimistic mutation: ApiClientError is surfaced via onError.
          }
        }}
      />

      <ConfirmDialog
        open={pendingRole != null}
        title={pendingRole === 'SUPER_ADMIN' ? 'Promote to Super Admin?' : 'Demote Super Admin?'}
        description={
          pendingRole === 'SUPER_ADMIN'
            ? `Promote ${staff.name} to Super Admin. They will receive full staff management permissions.`
            : `Demote ${staff.name} from Super Admin to ${formatStaffRole(pendingRole)}. Ensure at least one other Super Admin remains.`
        }
        confirmLabel={pendingRole === 'SUPER_ADMIN' ? 'Promote' : 'Demote'}
        tone="danger"
        onCancel={() => setPendingRole(null)}
        onConfirm={() => {
          if (!pendingRole) {
            return
          }
          const next = pendingRole
          setPendingRole(null)
          void roleMutation.mutateAsync(next).catch(() => {
            // Surfaced via onError.
          })
        }}
      />
    </section>
  )
}
