import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function AttentionPage() {
  return (
    <>
      <PageHeader
        title="Attention"
        description="Operational queues that require Admin action will live here. This surface prioritizes work, not vanity metrics."
        breadcrumbs={[{ label: 'Attention' }]}
      />
      <ModulePlaceholder
        moduleName="Attention"
        summary="Queue composition against verification, campaign, dispute, and reported-chat list endpoints is deferred."
        nextTaskHint="Implement in a later MH-FE Attention task after auth (MH-FE-003)."
        relatedStatuses={[
          { domain: 'campaign', status: 'submitted' },
          { domain: 'verification_submission', status: 'pending' },
          { domain: 'dispute', status: 'under_review' },
        ]}
      />
    </>
  )
}
