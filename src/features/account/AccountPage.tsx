import { PageHeader, ModulePlaceholder, Notice, Button } from '@/shared/ui'

export function AccountPage() {
  return (
    <>
      <PageHeader
        title="Account"
        description="Admin identity, session controls, and personal notification inbox will live here."
        breadcrumbs={[{ label: 'Account' }]}
      />
      <div className="module-placeholder">
        <Notice tone="warning" title="Authentication not connected">
          Login, logout, and `/auth/me` session handling are reserved for MH-FE-003. The logout
          control below is a non-functional boundary placeholder.
        </Notice>
        <div>
          <Button variant="secondary" disabled>
            Sign out (coming next)
          </Button>
        </div>
        <ModulePlaceholder
          moduleName="Account"
          summary="No session data is loaded in this foundation build."
          nextTaskHint="MH-FE-003 will implement Sanctum authentication and route protection."
          relatedStatuses={[
            { domain: 'account', status: 'active' },
            { domain: 'account', status: 'restricted' },
            { domain: 'account', status: 'suspended' },
            { domain: 'account', status: 'banned' },
          ]}
        />
      </div>
    </>
  )
}
