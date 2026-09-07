import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import {
  closeDispute,
  markDisputeDecisionPending,
  requestDisputeEvidence,
  resolveDispute,
  resumeDisputeReview,
  startDisputeReview,
} from '@/features/disputes/api'
import {
  DISPUTE_QUERY_KEYS,
  canClose,
  canMarkDecisionPending,
  canRequestEvidence,
  canResolve,
  canResumeReview,
  canStartReview,
  hasAnyDisputeAction,
} from '@/features/disputes/constants'
import { formatFieldErrors } from '@/features/disputes/format'
import {
  DisputeActionDialog,
  type DisputeActionKind,
} from '@/features/disputes/components/DisputeActionDialog'
import { ATTENTION_QUERY_KEYS } from '@/features/attention/constants'
import { Button, Notice } from '@/shared/ui'

export function DisputeActions({ disputeId, status }: { disputeId: number; status: string }) {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<DisputeActionKind | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: DISPUTE_QUERY_KEYS.detail(disputeId) }),
      queryClient.invalidateQueries({ queryKey: DISPUTE_QUERY_KEYS.all }),
      queryClient.invalidateQueries({ queryKey: ATTENTION_QUERY_KEYS.disputes }),
    ])
  }

  const mutation = useMutation({
    mutationFn: async (input: {
      kind: DisputeActionKind
      note?: string | null
      reason?: string
      decision_notes?: string
      action_notes?: string
    }) => {
      switch (input.kind) {
        case 'start_review':
          return startDisputeReview(disputeId, { note: input.note })
        case 'request_evidence':
          return requestDisputeEvidence(disputeId, { reason: input.reason ?? '' })
        case 'resume_review':
          return resumeDisputeReview(disputeId, { note: input.note })
        case 'mark_decision_pending':
          return markDisputeDecisionPending(disputeId, { note: input.note })
        case 'resolve':
          return resolveDispute(disputeId, {
            decision_notes: input.decision_notes ?? '',
            action_notes: input.action_notes ?? '',
          })
        case 'close':
          return closeDispute(disputeId, { note: input.note })
      }
    },
    onSuccess: async (_data, variables) => {
      setKind(null)
      setFormError(null)
      setFieldErrors({})
      const labels: Record<DisputeActionKind, string> = {
        start_review: 'Review started.',
        request_evidence: 'Evidence requested.',
        resume_review: 'Review resumed.',
        mark_decision_pending: 'Marked decision pending.',
        resolve: 'Dispute resolved. No financial mutation was performed.',
        close: 'Dispute closed.',
      }
      setSuccessMessage(labels[variables.kind])
      await invalidate()
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        setFormError(error.message)
        setFieldErrors(formatFieldErrors(error.details))
        return
      }
      setFormError('Unable to complete the dispute action.')
    },
  })

  if (!hasAnyDisputeAction(status) && !successMessage && !formError) {
    return (
      <section className="dispute-panel">
        <h2>Investigation actions</h2>
        <p className="dispute-muted">
          No Admin investigation actions are available for status <code>{status}</code>.
        </p>
      </section>
    )
  }

  function open(next: DisputeActionKind) {
    setFormError(null)
    setFieldErrors({})
    setKind(next)
  }

  return (
    <section className="dispute-panel">
      <h2>Investigation actions</h2>
      <p className="dispute-muted">
        These actions update the dispute case only. They do not cancel Deals, reverse commissions,
        issue refunds, or change settlement state.
      </p>

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

      {hasAnyDisputeAction(status) ? (
        <div className="dispute-actions">
          {canStartReview(status) ? (
            <Button variant="primary" onClick={() => open('start_review')}>
              Start review
            </Button>
          ) : null}
          {canRequestEvidence(status) ? (
            <Button variant="secondary" onClick={() => open('request_evidence')}>
              Request evidence
            </Button>
          ) : null}
          {canResumeReview(status) ? (
            <Button variant="secondary" onClick={() => open('resume_review')}>
              Resume review
            </Button>
          ) : null}
          {canMarkDecisionPending(status) ? (
            <Button variant="secondary" onClick={() => open('mark_decision_pending')}>
              Mark decision pending
            </Button>
          ) : null}
          {canResolve(status) ? (
            <Button variant="primary" onClick={() => open('resolve')}>
              Resolve
            </Button>
          ) : null}
          {canClose(status) ? (
            <Button variant="danger" onClick={() => open('close')}>
              Close
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="dispute-muted">
          No further Admin investigation actions are available for status <code>{status}</code>.
        </p>
      )}

      <DisputeActionDialog
        open={kind != null}
        kind={kind}
        isSubmitting={mutation.isPending}
        formError={formError}
        fieldErrors={fieldErrors}
        onCancel={() => {
          if (!mutation.isPending) {
            setKind(null)
            setFormError(null)
            setFieldErrors({})
          }
        }}
        onSubmit={async (values) => {
          if (!kind) {
            return
          }
          setFormError(null)
          try {
            await mutation.mutateAsync({
              kind,
              note: values.note?.trim() ? values.note.trim() : null,
              reason: values.reason,
              decision_notes: values.decision_notes,
              action_notes: values.action_notes,
            })
          } catch {
            // Surfaced via onError.
          }
        }}
      />
    </section>
  )
}
