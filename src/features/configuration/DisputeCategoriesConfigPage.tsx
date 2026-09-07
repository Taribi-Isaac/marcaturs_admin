import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function DisputeCategoriesConfigPage() {
  return (
    <>
      <PageHeader
        title="Dispute categories"
        description="Maintain dispute category taxonomy used when parties open cases."
        breadcrumbs={[{ label: 'Configuration' }, { label: 'Dispute categories' }]}
      />
      <ModulePlaceholder
        moduleName="Dispute categories"
        summary="Dispute category administration is deferred."
        nextTaskHint="Will use /admin/dispute-categories."
      />
    </>
  )
}
