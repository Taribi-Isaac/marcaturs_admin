import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CampaignAttentionQueue } from '@/features/attention/CampaignAttentionQueue'
import { DisputeAttentionQueue } from '@/features/attention/DisputeAttentionQueue'
import { ReportedConversationAttentionQueue } from '@/features/attention/ReportedConversationAttentionQueue'
import { VerificationAttentionQueue } from '@/features/attention/VerificationAttentionQueue'
import { AttentionRefreshButton } from '@/features/attention/AttentionQueueSection'
import { ATTENTION_QUERY_KEYS } from '@/features/attention/constants'
import { PageHeader } from '@/shared/ui'

export function AttentionPage() {
  const queryClient = useQueryClient()
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ATTENTION_QUERY_KEYS.all })
      await queryClient.refetchQueries({ queryKey: ATTENTION_QUERY_KEYS.all })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="attention-page">
      <PageHeader
        title="Attention"
        description="Review items that currently require administrative action."
        breadcrumbs={[{ label: 'Attention' }]}
        actions={
          <AttentionRefreshButton
            onClick={() => {
              void handleRefresh()
            }}
            disabled={isRefreshing}
            isRefreshing={isRefreshing}
          />
        }
      />

      <div className="attention-page__queues">
        <VerificationAttentionQueue />
        <CampaignAttentionQueue />
        <DisputeAttentionQueue />
        <ReportedConversationAttentionQueue />
      </div>
    </div>
  )
}
