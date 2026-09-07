import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function FeaturedPackagesConfigPage() {
  return (
    <>
      <PageHeader
        title="Featured packages"
        description="Configure Featured Premium Visibility products. Featured is independent of campaign extension time."
        breadcrumbs={[{ label: 'Configuration' }, { label: 'Featured packages' }]}
      />
      <ModulePlaceholder
        moduleName="Featured packages"
        summary="Featured package configuration is deferred."
        nextTaskHint="Will use /admin/campaign-featured-packages."
      />
    </>
  )
}
