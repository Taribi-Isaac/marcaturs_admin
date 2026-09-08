import { useEffect, useId, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, TextAreaField } from '@/shared/ui'
import { useDialogAccessibility } from '@/shared/ui/useDialogAccessibility'

export type ReviewActionKind = 'approve' | 'reject' | 'request_information'

const approveSchema = z.object({
  notes: z.string().max(5000).optional().or(z.literal('')),
  reason: z.string().optional(),
})

const reviewSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required.').max(2000),
  notes: z.string().max(5000).optional().or(z.literal('')),
})

type FormValues = {
  reason?: string
  notes?: string
}

export type ReviewActionDialogProps = {
  open: boolean
  kind: ReviewActionKind | null
  isSubmitting: boolean
  formError: string | null
  fieldErrors?: Record<string, string>
  onCancel: () => void
  onSubmit: (values: { reason?: string; notes?: string | null }) => Promise<void> | void
}

const copy: Record<
  ReviewActionKind,
  { title: string; description: string; confirmLabel: string; tone: 'default' | 'danger' }
> = {
  approve: {
    title: 'Approve submission',
    description: 'Confirm approval of this verification submission.',
    confirmLabel: 'Approve',
    tone: 'default',
  },
  reject: {
    title: 'Reject submission',
    description: 'Provide a reason for rejecting this verification submission.',
    confirmLabel: 'Reject',
    tone: 'danger',
  },
  request_information: {
    title: 'Request information',
    description: 'Explain what additional information the participant must provide.',
    confirmLabel: 'Request information',
    tone: 'default',
  },
}

export function ReviewActionDialog({
  open,
  kind,
  isSubmitting,
  formError,
  fieldErrors,
  onCancel,
  onSubmit,
}: ReviewActionDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const requiresReason = kind === 'reject' || kind === 'request_information'

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(requiresReason ? reviewSchema : approveSchema),
    defaultValues: { reason: '', notes: '' },
  })

  useDialogAccessibility({
    open: open && kind != null,
    containerRef: dialogRef,
    initialFocusRef: cancelRef,
    onEscape: onCancel,
    escapeEnabled: !isSubmitting,
  })

  useEffect(() => {
    if (!open) {
      return
    }

    reset({ reason: '', notes: '' })
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, reset])

  useEffect(() => {
    if (!fieldErrors) {
      return
    }
    for (const [key, message] of Object.entries(fieldErrors)) {
      if (key === 'reason' || key === 'notes') {
        setError(key, { message })
      }
    }
  }, [fieldErrors, setError])

  if (!open || !kind) {
    return null
  }

  const meta = copy[kind]

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
        <p className="dialog__body" id={descriptionId}>
          {meta.description}
        </p>

        <form
          className="verification-dialog-form"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit({
              reason: values.reason?.trim() || undefined,
              notes: values.notes?.trim() ? values.notes.trim() : null,
            })
          })}
        >
          {requiresReason ? (
            <TextAreaField
              id="review-reason"
              label="Reason"
              rows={3}
              error={errors.reason?.message}
              {...register('reason')}
            />
          ) : null}
          <TextAreaField
            id="review-notes"
            label="Notes (optional)"
            rows={3}
            error={errors.notes?.message}
            {...register('notes')}
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
