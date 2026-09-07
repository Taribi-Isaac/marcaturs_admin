import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { fetchVerificationSubmissions } from '@/features/verification/api'
import { VERIFICATION_QUERY_KEYS } from '@/features/verification/constants'
import { VerificationFilters } from '@/features/verification/components/VerificationFilters'
import { VerificationSubmissionTable } from '@/features/verification/components/VerificationSubmissionTable'
import type { VerificationSubmissionStatus } from '@/shared/types/domain'
import { ErrorState, ForbiddenState, PageHeader } from '@/shared/ui'

export function VerificationPage() {
  const [searchParams] = useSearchParams()
  const status = (searchParams.get('status') ?? '') as '' | VerificationSubmissionStatus
  const page = Number(searchParams.get('page') ?? '1') || 1

  const query = useQuery({
    queryKey: VERIFICATION_QUERY_KEYS.submissions({ status: status || undefined, page }),
    queryFn: ({ signal }) =>
      fetchVerificationSubmissions(
        {
          status: status || undefined,
          page,
        },
        signal,
      ),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const forbidden = query.error instanceof ApiClientError && query.error.status === 403

  return (
    <div className="verification-page">
      <PageHeader
        title="Verification"
        description="Review participant verification submissions against configurable requirements."
        breadcrumbs={[{ label: 'Verification', to: '/verification' }, { label: 'Submissions' }]}
      />

      <VerificationFilters />

      {forbidden ? (
        <ForbiddenState />
      ) : query.error ? (
        <ErrorState
          title="Unable to load verification submissions"
          description={
            query.error instanceof ApiClientError
              ? query.error.message
              : 'The verification queue could not be loaded.'
          }
          onRetry={() => {
            void query.refetch()
          }}
        />
      ) : (
        <VerificationSubmissionTable
          rows={query.data?.items ?? []}
          isLoading={query.isLoading}
          pagination={query.data?.pagination}
        />
      )}
    </div>
  )
}
