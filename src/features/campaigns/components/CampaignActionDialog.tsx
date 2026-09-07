import { useEffect, useId, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, TextAreaField } from '@/shared/ui'

export type CampaignActionKind =
  'approve' | 'reject' | 'request_modification' | 'activate' | 'suspend' | 'close'

const reasonRequiredSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required.').max(2000),
})

const reasonOptionalSchema = z.object({
  reason: z.string().max(2000).optional().or(z.literal('')),
})

type FormValues = { reason?: string }

export type CampaignActionDialogProps = {
  open: boolean
  kind: CampaignActionKind | null
  isSubmitting: boolean
  formError: string | null
  fieldErrors?: Record<string, string>
  onCancel: () => void
  onSubmit: (values: { reason?: string | null }) => Promise<void> | void
}

const copy: Record<
  CampaignActionKind,
  {
    title: string
    description: string
    confirmLabel: string
    tone: 'default' | 'danger'
    reasonMode: 'none' | 'required' | 'optional'
  }
> = {
  approve: {
    title: 'Approve campaign',
    description: 'Move this submitted campaign to approved.',
    confirmLabel: 'Approve',
    tone: 'default',
    reasonMode: 'none',
  },
  reject: {
    title: 'Reject campaign',
    description: 'Return this submitted campaign to draft with a review reason.',
    confirmLabel: 'Reject',
    tone: 'danger',
    reasonMode: 'required',
  },
  request_modification: {
    title: 'Request modification',
    description: 'Return this submitted campaign to draft and ask the business to revise it.',
    confirmLabel: 'Request modification',
    tone: 'default',
    reasonMode: 'required',
  },
  activate: {
    title: 'Activate campaign',
    description: 'Activate this approved campaign and start its listing window.',
    confirmLabel: 'Activate',
    tone: 'default',
    reasonMode: 'none',
  },
  suspend: {
    title: 'Suspend campaign',
    description: 'Suspend this active or expiring campaign. A reason is required.',
    confirmLabel: 'Suspend',
    tone: 'danger',
    reasonMode: 'required',
  },
  close: {
    title: 'Close campaign',
    description: 'Close this campaign. An optional reason may be recorded.',
    confirmLabel: 'Close',
    tone: 'danger',
    reasonMode: 'optional',
  },
}

export function CampaignActionDialog({
  open,
  kind,
  isSubmitting,
  formError,
  fieldErrors,
  onCancel,
  onSubmit,
}: CampaignActionDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)
  const reasonMode = kind ? copy[kind].reasonMode : 'none'

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(
      reasonMode === 'required'
        ? reasonRequiredSchema
        : reasonMode === 'optional'
          ? reasonOptionalSchema
          : reasonOptionalSchema,
    ),
    defaultValues: { reason: '' },
  })

  useEffect(() => {
    if (!open) {
      return
    }
    reset({ reason: '' })
    cancelRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, reset, onCancel, isSubmitting])

  useEffect(() => {
    if (!fieldErrors?.reason) {
      return
    }
    setError('reason', { message: fieldErrors.reason })
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
      />
      <div
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
          className="campaign-dialog-form"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit({
              reason: values.reason?.trim() ? values.reason.trim() : null,
            })
          })}
        >
          {reasonMode !== 'none' ? (
            <TextAreaField
              id="campaign-action-reason"
              label={reasonMode === 'required' ? 'Reason' : 'Reason (optional)'}
              rows={3}
              error={errors.reason?.message}
              {...register('reason')}
            />
          ) : null}

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
