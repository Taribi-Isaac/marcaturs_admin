import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function ExtensionPackagesConfigPage() {
  return (
    <>
      <PageHeader
        title="Extension packages"
        description="Configure paid campaign listing extension products (platform payments to MarcatursHub)."
        breadcrumbs={[{ label: 'Configuration' }, { label: 'Extension packages' }]}
      />
      <ModulePlaceholder
        moduleName="Extension packages"
        summary="Package configuration is deferred."
        nextTaskHint="Will use /admin/campaign-extension-packages."
      />
    </>
  )
}
