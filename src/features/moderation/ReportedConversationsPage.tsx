import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function ReportedConversationsPage() {
  return (
    <>
      <PageHeader
        title="Reported conversations"
        description="Review Business ↔ Ambassador conversations that participants have reported. Admins do not join ordinary private chat."
        breadcrumbs={[{ label: 'Moderation' }, { label: 'Reported conversations' }]}
      />
      <ModulePlaceholder
        moduleName="Reported conversations"
        summary="Reported-chat review UI is deferred. Seed currently has no reported_at rows (MH-FE-001 G7)."
        nextTaskHint="Will use /admin/conversations once moderation work begins."
      />
    </>
  )
}
