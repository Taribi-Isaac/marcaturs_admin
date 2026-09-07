import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function VerificationRequirementsPage() {
  return (
    <>
      <PageHeader
        title="Verification requirements"
        description="Configure dynamic verification requirements for Business and Ambassador participants."
        breadcrumbs={[{ label: 'Verification', to: '/verification' }, { label: 'Requirements' }]}
      />
      <ModulePlaceholder
        moduleName="Verification requirements"
        summary="Requirement configuration CRUD is deferred."
        nextTaskHint="Will use /admin/verification/requirements once the Verification module ships."
      />
    </>
  )
}
