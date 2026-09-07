import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import {
  activateCampaign,
  approveCampaign,
  closeCampaign,
  rejectCampaign,
  requestCampaignModification,
  suspendCampaign,
} from '@/features/campaigns/api'
import {
  CAMPAIGN_QUERY_KEYS,
  canActivate,
  canApprove,
  canClose,
  canReject,
  canRequestModification,
  canSuspend,
  hasAnyCampaignAction,
} from '@/features/campaigns/constants'
import { formatFieldErrors } from '@/features/campaigns/format'
import {
  CampaignActionDialog,
  type CampaignActionKind,
} from '@/features/campaigns/components/CampaignActionDialog'
import { ATTENTION_QUERY_KEYS } from '@/features/attention/constants'
import { Button, Notice } from '@/shared/ui'

export function CampaignActions({ campaignId, status }: { campaignId: number; status: string }) {
  const queryClient = useQueryClient()
  const [kind, setKind] = useState<CampaignActionKind | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function invalidate() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_QUERY_KEYS.detail(campaignId) }),
      queryClient.invalidateQueries({ queryKey: CAMPAIGN_QUERY_KEYS.all }),
      queryClient.invalidateQueries({ queryKey: ATTENTION_QUERY_KEYS.campaigns }),
    ])
  }

  const mutation = useMutation({
    mutationFn: async (input: { kind: CampaignActionKind; reason?: string | null }) => {
      switch (input.kind) {
        case 'approve':
          return approveCampaign(campaignId)
        case 'reject':
          return rejectCampaign(campaignId, { reason: input.reason ?? '' })
        case 'request_modification':
          return requestCampaignModification(campaignId, { reason: input.reason ?? '' })
        case 'activate':
          return activateCampaign(campaignId)
        case 'suspend':
          return suspendCampaign(campaignId, { reason: input.reason ?? '' })
        case 'close':
          return closeCampaign(campaignId, { reason: input.reason })
      }
    },
    onSuccess: async (_data, variables) => {
      setKind(null)
      setFormError(null)
      setFieldErrors({})
      const labels: Record<CampaignActionKind, string> = {
        approve: 'Campaign approved.',
        reject: 'Campaign rejected and returned to draft.',
        request_modification: 'Modification requested. Campaign returned to draft.',
        activate: 'Campaign activated.',
        suspend: 'Campaign suspended.',
        close: 'Campaign closed.',
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
      setFormError('Unable to complete the campaign action.')
    },
  })

  if (!hasAnyCampaignAction(status) && !successMessage && !formError) {
    return (
      <section className="campaign-panel">
        <h2>Moderation actions</h2>
        <p className="campaign-muted">
          No Admin moderation actions are available for status <code>{status}</code>.
        </p>
      </section>
    )
  }

  function open(next: CampaignActionKind) {
    setFormError(null)
    setFieldErrors({})
    setKind(next)
  }

  return (
    <section className="campaign-panel">
      <h2>Moderation actions</h2>
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

      {hasAnyCampaignAction(status) ? (
        <div className="campaign-actions">
          {canApprove(status) ? (
            <Button variant="primary" onClick={() => open('approve')}>
              Approve
            </Button>
          ) : null}
          {canReject(status) ? (
            <Button variant="danger" onClick={() => open('reject')}>
              Reject
            </Button>
          ) : null}
          {canRequestModification(status) ? (
            <Button variant="secondary" onClick={() => open('request_modification')}>
              Request modification
            </Button>
          ) : null}
          {canActivate(status) ? (
            <Button variant="primary" onClick={() => open('activate')}>
              Activate
            </Button>
          ) : null}
          {canSuspend(status) ? (
            <Button variant="danger" onClick={() => open('suspend')}>
              Suspend
            </Button>
          ) : null}
          {canClose(status) ? (
            <Button variant="secondary" onClick={() => open('close')}>
              Close
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="campaign-muted">
          No further Admin moderation actions are available for status <code>{status}</code>.
        </p>
      )}

      <CampaignActionDialog
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
            await mutation.mutateAsync({ kind, reason: values.reason })
          } catch {
            // Pessimistic mutation: ApiClientError is surfaced via onError.
          }
        }}
      />
    </section>
  )
}
