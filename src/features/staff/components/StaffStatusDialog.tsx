import { useEffect, useId, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { StaffStatusAction } from '@/features/staff/types'
import { resultingStaffStatus } from '@/features/staff/constants'
import { formatAccountStatusLabel, formatStaffRole } from '@/features/staff/format'
import type { StaffRole } from '@/shared/types/auth'
import { Button, TextAreaField } from '@/shared/ui'
import { useDialogAccessibility } from '@/shared/ui/useDialogAccessibility'

const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Reason must be at least 3 characters.')
    .max(2000, 'Reason must be at most 2000 characters.'),
})

type FormValues = { reason: string }

export type StaffStatusDialogProps = {
  open: boolean
  kind: StaffStatusAction | null
  currentStatus: string
  staffName: string
  staffEmail: string
  staffRole: StaffRole | null
  isSubmitting: boolean
  formError: string | null
  fieldErrors?: Record<string, string>
  onCancel: () => void
  onSubmit: (values: { reason: string }) => Promise<void> | void
}

const actionMeta: Record<
  StaffStatusAction,
  { title: string; confirmLabel: string; tone: 'default' | 'danger' }
> = {
  disable: { title: 'Disable staff account', confirmLabel: 'Disable', tone: 'danger' },
  restore: { title: 'Restore staff account', confirmLabel: 'Restore', tone: 'default' },
}

export function StaffStatusDialog({
  open,
  kind,
  currentStatus,
  staffName,
  staffEmail,
  staffRole,
  isSubmitting,
  formError,
  fieldErrors,
  onCancel,
  onSubmit,
}: StaffStatusDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const reasonRef = useRef<HTMLTextAreaElement | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: '' },
  })

  const reasonRegistration = register('reason')

  useDialogAccessibility({
    open: open && kind != null,
    containerRef: dialogRef,
    initialFocusRef: reasonRef,
    onEscape: onCancel,
    escapeEnabled: !isSubmitting,
  })

  useEffect(() => {
    if (!open) {
      return
    }
    reset({ reason: '' })
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, kind, reset])

  useEffect(() => {
    if (!fieldErrors?.reason) {
      return
    }
    setError('reason', { message: fieldErrors.reason })
  }, [fieldErrors, setError])

  if (!open || !kind) {
    return null
  }

  const meta = actionMeta[kind]
  const nextStatus = resultingStaffStatus(kind, currentStatus)

  return (
    <div className="dialog-backdrop">
      <button
        type="button"
        className="dialog-backdrop__dismiss"
        aria-label="Dismiss dialog"
        onClick={onCancel}
        disabled={isSubmitting}
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        className="dialog dialog--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 className="dialog__title" id={titleId}>
          {meta.title}
        </h2>
        <div className="dialog__body users-dialog-body" id={descriptionId}>
          <p>
            Target:{' '}
            <strong>
              {staffName} ({formatStaffRole(staffRole)})
            </strong>
          </p>
          <p className="users-muted">{staffEmail}</p>
          <p>
            Current status: <strong>{formatAccountStatusLabel(currentStatus)}</strong>
            {nextStatus ? (
              <>
                {' '}
                → Resulting status: <strong>{formatAccountStatusLabel(nextStatus)}</strong>
              </>
            ) : null}
          </p>
          {kind === 'disable' ? (
            <ul className="users-consequence-list">
              <li>The staff account becomes Suspended and cannot sign in.</li>
              <li>Active Sanctum tokens for this staff account are revoked.</li>
            </ul>
          ) : (
            <ul className="users-consequence-list">
              <li>The staff account returns to Active and may sign in again.</li>
            </ul>
          )}
        </div>

        <form
          className="users-dialog-form"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit({ reason: values.reason.trim() })
          })}
        >
          <TextAreaField
            id="staff-status-reason"
            label="Reason"
            rows={4}
            error={errors.reason?.message}
            {...reasonRegistration}
            ref={(element) => {
              reasonRegistration.ref(element)
              reasonRef.current = element
            }}
          />

          {formError ? (
            <p className="field__error" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="dialog__actions">
            <Button ref={cancelRef} variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={meta.tone === 'danger' ? 'danger' : 'primary'}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : meta.confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
