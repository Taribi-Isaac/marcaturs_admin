import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function DisputesPage() {
  return (
    <>
      <PageHeader
        title="Disputes"
        description="Investigate marketplace disputes without mutating Deal or Commission financial state."
        breadcrumbs={[{ label: 'Disputes' }]}
      />
      <ModulePlaceholder
        moduleName="Disputes"
        summary="Dispute investigation workspace is deferred."
        nextTaskHint="Will use /admin/disputes and related investigation actions."
        relatedStatuses={[
          { domain: 'dispute', status: 'submitted' },
          { domain: 'dispute', status: 'under_review' },
          { domain: 'dispute', status: 'evidence_requested' },
          { domain: 'dispute', status: 'decision_pending' },
          { domain: 'dispute', status: 'resolved' },
          { domain: 'dispute', status: 'closed' },
        ]}
      />
    </>
  )
}
