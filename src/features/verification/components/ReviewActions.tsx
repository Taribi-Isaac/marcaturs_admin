import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import {
  approveVerificationSubmission,
  rejectVerificationSubmission,
  requestVerificationInformation,
  startVerificationReview,
} from '@/features/verification/api'
import {
  canReviewSubmission,
  canStartReview,
  VERIFICATION_QUERY_KEYS,
} from '@/features/verification/constants'
import { formatFieldErrors } from '@/features/verification/format'
import {
  ReviewActionDialog,
  type ReviewActionKind,
} from '@/features/verification/components/ReviewActionDialog'
import { ATTENTION_QUERY_KEYS } from '@/features/attention/constants'
import { Button, ConfirmDialog, Notice } from '@/shared/ui'

export type ReviewActionsProps = {
  submissionId: number
  status: string
}

export function ReviewActions({ submissionId, status }: ReviewActionsProps) {
  const queryClient = useQueryClient()
  const [startOpen, setStartOpen] = useState(false)
  const [dialogKind, setDialogKind] = useState<ReviewActionKind | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function invalidateSubmission() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: VERIFICATION_QUERY_KEYS.submission(submissionId) }),
      queryClient.invalidateQueries({ queryKey: VERIFICATION_QUERY_KEYS.events(submissionId) }),
      queryClient.invalidateQueries({ queryKey: VERIFICATION_QUERY_KEYS.all }),
      queryClient.invalidateQueries({ queryKey: ATTENTION_QUERY_KEYS.verification }),
    ])
  }

  const startMutation = useMutation({
    mutationFn: () => startVerificationReview(submissionId),
    onSuccess: async () => {
      setStartOpen(false)
      setSuccessMessage('Review started.')
      await invalidateSubmission()
    },
    onError: (error) => {
      setFormError(error instanceof ApiClientError ? error.message : 'Unable to start review.')
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async (input: {
      kind: ReviewActionKind
      reason?: string
      notes?: string | null
    }) => {
      if (input.kind === 'approve') {
        return approveVerificationSubmission(submissionId, { notes: input.notes })
      }
      if (input.kind === 'reject') {
        return rejectVerificationSubmission(submissionId, {
          reason: input.reason ?? '',
          notes: input.notes,
        })
      }
      return requestVerificationInformation(submissionId, {
        reason: input.reason ?? '',
        notes: input.notes,
      })
    },
    onSuccess: async (_data, variables) => {
      setDialogKind(null)
      setFormError(null)
      setFieldErrors({})
      setSuccessMessage(
        variables.kind === 'approve'
          ? 'Submission approved.'
          : variables.kind === 'reject'
            ? 'Submission rejected.'
            : 'Information requested.',
      )
      await invalidateSubmission()
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        setFormError(error.message)
        setFieldErrors(formatFieldErrors(error.details))
        return
      }
      setFormError('Unable to complete the review action.')
    },
  })

  const reviewable = canReviewSubmission(status)
  const startable = canStartReview(status)

  if (!reviewable && !startable && !successMessage && !formError) {
    return (
      <section className="verification-panel">
        <h2>Review actions</h2>
        <p className="verification-muted">
          No Admin review actions are available for status <code>{status}</code>.
        </p>
      </section>
    )
  }

  return (
    <section className="verification-panel">
      <h2>Review actions</h2>
      {successMessage ? (
        <Notice tone="success" title="Action completed">
          {successMessage}
        </Notice>
      ) : null}
      {formError && !dialogKind && !startOpen ? (
        <Notice tone="danger" title="Action failed">
          {formError}
        </Notice>
      ) : null}

      {startable || reviewable ? (
        <div className="verification-actions">
          {startable ? (
            <Button
              variant="secondary"
              onClick={() => {
                setFormError(null)
                setStartOpen(true)
              }}
            >
              Start review
            </Button>
          ) : null}
          {reviewable ? (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  setFormError(null)
                  setFieldErrors({})
                  setDialogKind('approve')
                }}
              >
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setFormError(null)
                  setFieldErrors({})
                  setDialogKind('reject')
                }}
              >
                Reject
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setFormError(null)
                  setFieldErrors({})
                  setDialogKind('request_information')
                }}
              >
                Request information
              </Button>
            </>
          ) : null}
        </div>
      ) : (
        <p className="verification-muted">
          No further Admin review actions are available for status <code>{status}</code>.
        </p>
      )}

      <ConfirmDialog
        open={startOpen}
        title="Start review"
        description="Move this pending submission into under_review?"
        confirmLabel={startMutation.isPending ? 'Starting…' : 'Confirm start'}
        onCancel={() => {
          if (!startMutation.isPending) {
            setStartOpen(false)
          }
        }}
        onConfirm={() => {
          startMutation.mutate()
        }}
      />

      <ReviewActionDialog
        open={dialogKind != null}
        kind={dialogKind}
        isSubmitting={reviewMutation.isPending}
        formError={formError}
        fieldErrors={fieldErrors}
        onCancel={() => {
          if (!reviewMutation.isPending) {
            setDialogKind(null)
            setFormError(null)
            setFieldErrors({})
          }
        }}
        onSubmit={async (values) => {
          if (!dialogKind) {
            return
          }
          setFormError(null)
          try {
            await reviewMutation.mutateAsync({ kind: dialogKind, ...values })
          } catch {
            // Pessimistic mutation: ApiClientError is surfaced via onError.
          }
        }}
      />
    </section>
  )
}
