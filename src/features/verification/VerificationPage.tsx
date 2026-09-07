import { PageHeader, ModulePlaceholder } from '@/shared/ui'

export function VerificationPage() {
  return (
    <>
      <PageHeader
        title="Verification"
        description="Review participant verification submissions against configurable requirements."
        breadcrumbs={[{ label: 'Verification', to: '/verification' }, { label: 'Submissions' }]}
      />
      <ModulePlaceholder
        moduleName="Verification submissions"
        summary="Admin verification queue and review actions are not wired yet."
        nextTaskHint="Scheduled after authentication in the Admin module sequence."
        relatedStatuses={[
          { domain: 'verification_submission', status: 'pending' },
          { domain: 'verification_submission', status: 'under_review' },
          { domain: 'verification_submission', status: 'approved' },
          { domain: 'verification_submission', status: 'rejected' },
          { domain: 'verification_submission', status: 'more_information_required' },
        ]}
      />
    </>
  )
}
