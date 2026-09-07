import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Moderate campaign lifecycle states and inspect related commercial terms."
        breadcrumbs={[{ label: 'Campaigns' }]}
      />
      <ModulePlaceholder
        moduleName="Campaigns"
        summary="Campaign moderation and detail views are not implemented in this foundation task."
        nextTaskHint="Later MH-FE campaign work will consume /admin/campaigns."
        relatedStatuses={[
          { domain: 'campaign', status: 'submitted' },
          { domain: 'campaign', status: 'approved' },
          { domain: 'campaign', status: 'active' },
          { domain: 'campaign', status: 'expiring' },
          { domain: 'campaign', status: 'suspended' },
        ]}
      />
    </>
  )
}
