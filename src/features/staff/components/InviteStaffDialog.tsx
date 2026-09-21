import { useEffect, useId, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { STAFF_ROLES } from '@/features/staff/constants'
import { formatStaffRole } from '@/features/staff/format'
import type { StaffRole } from '@/shared/types/auth'
import { Button, SelectField, TextField } from '@/shared/ui'
import { useDialogAccessibility } from '@/shared/ui/useDialogAccessibility'

const inviteSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(255, 'Name must be at most 255 characters.'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.')
    .max(255, 'Email must be at most 255 characters.'),
  staff_role: z.enum(['SUPER_ADMIN', 'OPERATIONS', 'VERIFICATION', 'MODERATION']),
})

type FormValues = z.infer<typeof inviteSchema>

export type InviteStaffDialogProps = {
  open: boolean
  isSubmitting: boolean
  formError: string | null
  fieldErrors?: Record<string, string>
  debugToken?: string | null
  onCancel: () => void
  onSubmit: (values: { name: string; email: string; staff_role: StaffRole }) => Promise<void> | void
}

export function InviteStaffDialog({
  open,
  isSubmitting,
  formError,
  fieldErrors,
  debugToken,
  onCancel,
  onSubmit,
}: InviteStaffDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const nameRef = useRef<HTMLInputElement | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      email: '',
      staff_role: 'VERIFICATION',
    },
  })

  const nameRegistration = register('name')

  useDialogAccessibility({
    open,
    containerRef: dialogRef,
    initialFocusRef: nameRef,
    onEscape: onCancel,
    escapeEnabled: !isSubmitting,
  })

  useEffect(() => {
    if (!open) {
      return
    }
    reset({ name: '', email: '', staff_role: 'VERIFICATION' })
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, reset])

  useEffect(() => {
    if (!fieldErrors) {
      return
    }
    for (const [field, message] of Object.entries(fieldErrors)) {
      if (field === 'name' || field === 'email' || field === 'staff_role') {
        setError(field, { message })
      }
    }
  }, [fieldErrors, setError])

  if (!open) {
    return null
  }

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
          Invite staff
        </h2>
        <div className="dialog__body users-dialog-body" id={descriptionId}>
          <p>
            Send an invitation for a new Admin staff account. The invitee sets a password via the
            accept-invitation link.
          </p>
        </div>

        {debugToken ? (
          <div className="dialog__body">
            <p role="status">
              Invitation created. Non-production debug token:{' '}
              <code className="mono">{debugToken}</code>
            </p>
            <p className="users-muted">
              Accept path: <code>/staff/accept-invitation?token=…</code>
            </p>
            <div className="dialog__actions">
              <Button ref={cancelRef} variant="primary" onClick={onCancel}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form
            className="users-dialog-form"
            onSubmit={handleSubmit(async (values) => {
              await onSubmit({
                name: values.name.trim(),
                email: values.email.trim(),
                staff_role: values.staff_role,
              })
            })}
          >
            <TextField
              id="invite-staff-name"
              label="Name"
              autoComplete="name"
              error={errors.name?.message}
              {...nameRegistration}
              ref={(element) => {
                nameRegistration.ref(element)
                nameRef.current = element
              }}
            />
            <TextField
              id="invite-staff-email"
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <SelectField
              id="invite-staff-role"
              label="Staff role"
              error={errors.staff_role?.message}
              {...register('staff_role')}
            >
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {formatStaffRole(role)}
                </option>
              ))}
            </SelectField>

            {formError ? (
              <p className="field__error" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="dialog__actions">
              <Button ref={cancelRef} variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send invitation'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
