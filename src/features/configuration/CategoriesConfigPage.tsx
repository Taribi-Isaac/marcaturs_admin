import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function CategoriesConfigPage() {
  return (
    <>
      <PageHeader
        title="Categories"
        description="Manage marketplace category taxonomy, listing status, and active state."
        breadcrumbs={[
          { label: 'Configuration', to: '/configuration/categories' },
          { label: 'Categories' },
        ]}
      />
      <ModulePlaceholder
        moduleName="Categories"
        summary="Category administration is deferred."
        nextTaskHint="Will use /admin/categories."
      />
    </>
  )
}
