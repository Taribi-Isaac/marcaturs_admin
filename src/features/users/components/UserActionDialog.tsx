import { useEffect, useId, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AccountStatus } from '@/shared/types/domain'
import type { UserStatusAction } from '@/features/users/types'
import { resultingStatus } from '@/features/users/constants'
import { formatAccountStatusLabel, formatParticipantRole } from '@/features/users/format'
import { Button, TextAreaField } from '@/shared/ui'
import { useDialogAccessibility } from '@/shared/ui/useDialogAccessibility'

const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Reason must be at least 3 characters.')
    .max(5000, 'Reason must be at most 5000 characters.'),
})

type FormValues = { reason: string }

export type UserActionDialogProps = {
  open: boolean
  kind: UserStatusAction | null
  currentStatus: AccountStatus | string
  participantName: string
  participantEmail: string
  participantRole: string
  isSubmitting: boolean
  formError: string | null
  fieldErrors?: Record<string, string>
  onCancel: () => void
  onSubmit: (values: { reason: string }) => Promise<void> | void
}

function consequenceCopy(kind: UserStatusAction, currentStatus: string): string[] {
  switch (kind) {
    case 'restrict':
      return [
        'The account becomes Restricted.',
        'Normal Business/Ambassador domain access is blocked.',
        'Restricted-account authentication semantics remain (limited account endpoints).',
        'If this is a Business account, its campaigns become non-discoverable in the public marketplace.',
        'Existing Deals and commissions are not cancelled or reversed by this action.',
      ]
    case 'suspend':
      return [
        'The account becomes Suspended.',
        'Normal participant access is blocked.',
        'Active Sanctum personal access tokens for this participant are revoked.',
        'If this is a Business account, its campaigns become non-discoverable in the public marketplace.',
        'Existing Deals and commissions are not cancelled or reversed by this action.',
      ]
    case 'ban':
      return [
        'The account becomes Banned.',
        'Normal participant access is blocked.',
        'Active Sanctum personal access tokens for this participant are revoked.',
        'If this is a Business account, its campaigns become non-discoverable in the public marketplace.',
        'Existing Deals and commissions are not cancelled or reversed by this action.',
      ]
    case 'restore':
      if (currentStatus === 'banned') {
        return [
          'Restoring a banned account places it in Restricted status. A separate restore action is required to return it to Active.',
          'This does not automatically cancel Deals, reverse commissions, or issue refunds.',
        ]
      }
      return [
        'Normal participant access is restored to Active.',
        'Business campaigns become eligible for marketplace discovery again when other listing rules are met.',
        'This does not automatically cancel Deals, reverse commissions, or issue refunds.',
      ]
  }
}

const actionMeta: Record<
  UserStatusAction,
  { title: string; confirmLabel: string; tone: 'default' | 'danger' }
> = {
  restrict: { title: 'Restrict account', confirmLabel: 'Restrict', tone: 'danger' },
  suspend: { title: 'Suspend account', confirmLabel: 'Suspend', tone: 'danger' },
  ban: { title: 'Ban account', confirmLabel: 'Ban', tone: 'danger' },
  restore: { title: 'Restore account', confirmLabel: 'Restore', tone: 'default' },
}

export function UserActionDialog({
  open,
  kind,
  currentStatus,
  participantName,
  participantEmail,
  participantRole,
  isSubmitting,
  formError,
  fieldErrors,
  onCancel,
  onSubmit,
}: UserActionDialogProps) {
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
  const nextStatus = resultingStatus(kind, currentStatus)
  const consequences = consequenceCopy(kind, currentStatus)

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
              {participantName} ({formatParticipantRole(participantRole)})
            </strong>
          </p>
          <p className="users-muted">{participantEmail}</p>
          <p>
            Current status: <strong>{formatAccountStatusLabel(currentStatus)}</strong>
            {nextStatus ? (
              <>
                {' '}
                → Resulting status: <strong>{formatAccountStatusLabel(nextStatus)}</strong>
              </>
            ) : null}
          </p>
          <ul className="users-consequence-list">
            {consequences.map((line, index) => (
              <li
                key={line}
                className={
                  kind === 'restore' && currentStatus === 'banned' && index === 0
                    ? 'users-dialog-emphasis'
                    : undefined
                }
              >
                {line}
              </li>
            ))}
          </ul>
        </div>

        <form
          className="users-dialog-form"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit({ reason: values.reason.trim() })
          })}
        >
          <TextAreaField
            id="user-action-reason"
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
