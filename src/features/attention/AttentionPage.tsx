import { useEffect, useState } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { CampaignAttentionQueue } from '@/features/attention/CampaignAttentionQueue'
import { DisputeAttentionQueue } from '@/features/attention/DisputeAttentionQueue'
import { ReportedConversationAttentionQueue } from '@/features/attention/ReportedConversationAttentionQueue'
import { VerificationAttentionQueue } from '@/features/attention/VerificationAttentionQueue'
import { AttentionRefreshButton } from '@/features/attention/AttentionQueueSection'
import { ATTENTION_QUERY_KEYS } from '@/features/attention/constants'
import { PageHeader } from '@/shared/ui'

export function AttentionPage() {
  const queryClient = useQueryClient()
  const [manualRefresh, setManualRefresh] = useState(false)
  const fetchingCount = useIsFetching({ queryKey: ATTENTION_QUERY_KEYS.all })
  const isRefreshing = manualRefresh && fetchingCount > 0

  useEffect(() => {
    if (manualRefresh && fetchingCount === 0) {
      setManualRefresh(false)
    }
  }, [manualRefresh, fetchingCount])

  function handleRefresh() {
    setManualRefresh(true)
    void queryClient.invalidateQueries({ queryKey: ATTENTION_QUERY_KEYS.all })
  }

  return (
    <div className="attention-page">
      <PageHeader
        title="Attention"
        description="Review items that currently require administrative action."
        breadcrumbs={[{ label: 'Attention' }]}
        actions={
          <AttentionRefreshButton
            onClick={handleRefresh}
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
