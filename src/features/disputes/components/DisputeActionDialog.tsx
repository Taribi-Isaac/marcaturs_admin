import { useEffect, useId, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, TextAreaField } from '@/shared/ui'

export type DisputeActionKind =
  | 'start_review'
  | 'request_evidence'
  | 'resume_review'
  | 'mark_decision_pending'
  | 'resolve'
  | 'close'

type FormValues = {
  note?: string
  reason?: string
  decision_notes?: string
  action_notes?: string
}

export type DisputeActionDialogProps = {
  open: boolean
  kind: DisputeActionKind | null
  isSubmitting: boolean
  formError: string | null
  fieldErrors?: Record<string, string>
  onCancel: () => void
  onSubmit: (values: FormValues) => Promise<void> | void
}

const copy: Record<
  DisputeActionKind,
  {
    title: string
    description: string
    confirmLabel: string
    tone: 'default' | 'danger'
  }
> = {
  start_review: {
    title: 'Start review',
    description:
      'Move this submitted dispute into under_review. Optional classification note only.',
    confirmLabel: 'Start review',
    tone: 'default',
  },
  request_evidence: {
    title: 'Request evidence',
    description:
      'Ask parties for additional evidence. This is an investigation step — it does not change Deal or commission finances.',
    confirmLabel: 'Request evidence',
    tone: 'default',
  },
  resume_review: {
    title: 'Resume review',
    description: 'Return this evidence_requested dispute to under_review.',
    confirmLabel: 'Resume review',
    tone: 'default',
  },
  mark_decision_pending: {
    title: 'Mark decision pending',
    description: 'Move this under_review dispute to decision_pending.',
    confirmLabel: 'Mark decision pending',
    tone: 'default',
  },
  resolve: {
    title: 'Resolve dispute',
    description:
      'Record the investigation decision and administrative action notes. This does not refund, reverse commission, or mutate Deal financial state.',
    confirmLabel: 'Resolve',
    tone: 'danger',
  },
  close: {
    title: 'Close dispute',
    description: 'Close a resolved dispute case. Optional close note only.',
    confirmLabel: 'Close',
    tone: 'danger',
  },
}

function schemaFor(kind: DisputeActionKind | null) {
  if (kind === 'request_evidence') {
    return z.object({
      reason: z.string().trim().min(3, 'Reason must be at least 3 characters.').max(5000),
    })
  }
  if (kind === 'resolve') {
    return z.object({
      decision_notes: z
        .string()
        .trim()
        .min(3, 'Decision notes must be at least 3 characters.')
        .max(10000),
      action_notes: z
        .string()
        .trim()
        .min(3, 'Action notes must be at least 3 characters.')
        .max(10000),
    })
  }
  return z.object({
    note: z.string().max(5000).optional().or(z.literal('')),
  })
}

export function DisputeActionDialog({
  open,
  kind,
  isSubmitting,
  formError,
  fieldErrors,
  onCancel,
  onSubmit,
}: DisputeActionDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schemaFor(kind)),
    defaultValues: {
      note: '',
      reason: '',
      decision_notes: '',
      action_notes: '',
    },
  })

  useEffect(() => {
    if (!open) {
      return
    }
    reset({ note: '', reason: '', decision_notes: '', action_notes: '' })
    cancelRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, reset, onCancel, isSubmitting, kind])

  useEffect(() => {
    if (!fieldErrors) {
      return
    }
    for (const [key, message] of Object.entries(fieldErrors)) {
      setError(key as keyof FormValues, { message })
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
          className="dispute-dialog-form"
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values)
          })}
        >
          {kind === 'request_evidence' ? (
            <TextAreaField
              id="dispute-evidence-reason"
              label="Reason"
              rows={3}
              error={errors.reason?.message}
              {...register('reason')}
            />
          ) : null}

          {kind === 'resolve' ? (
            <>
              <TextAreaField
                id="dispute-decision-notes"
                label="Decision notes"
                rows={4}
                error={errors.decision_notes?.message}
                {...register('decision_notes')}
              />
              <TextAreaField
                id="dispute-action-notes"
                label="Administrative action notes"
                rows={4}
                error={errors.action_notes?.message}
                {...register('action_notes')}
              />
              <p className="dispute-muted">
                Action notes are an administrative record only. They do not create refunds,
                clawbacks, commission reversals, or wallet movements.
              </p>
            </>
          ) : null}

          {kind === 'start_review' ||
          kind === 'resume_review' ||
          kind === 'mark_decision_pending' ||
          kind === 'close' ? (
            <TextAreaField
              id="dispute-optional-note"
              label="Note (optional)"
              rows={3}
              error={errors.note?.message}
              {...register('note')}
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
