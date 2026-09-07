import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { fetchVerificationEvents, fetchVerificationSubmission } from '@/features/verification/api'
import { VERIFICATION_QUERY_KEYS } from '@/features/verification/constants'
import { formatVerificationTimestamp } from '@/features/verification/format'
import { EvidenceList } from '@/features/verification/components/EvidenceList'
import { ReviewActions } from '@/features/verification/components/ReviewActions'
import { ReviewTimeline } from '@/features/verification/components/ReviewTimeline'
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
  PageHeader,
  StatusBadge,
} from '@/shared/ui'

export function VerificationSubmissionPage() {
  const { id } = useParams()
  const submissionId = Number(id)

  const submissionQuery = useQuery({
    queryKey: VERIFICATION_QUERY_KEYS.submission(submissionId),
    queryFn: ({ signal }) => fetchVerificationSubmission(submissionId, signal),
    enabled: Number.isFinite(submissionId) && submissionId > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const eventsQuery = useQuery({
    queryKey: VERIFICATION_QUERY_KEYS.events(submissionId),
    queryFn: ({ signal }) => fetchVerificationEvents(submissionId, signal),
    enabled: Number.isFinite(submissionId) && submissionId > 0 && submissionQuery.isSuccess,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (!Number.isFinite(submissionId) || submissionId <= 0) {
    return (
      <NotFoundState
        title="Submission not found"
        description="The verification submission identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to="/verification">
            Back to queue
          </Link>
        }
      />
    )
  }

  if (submissionQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Verification submission"
          breadcrumbs={[{ label: 'Verification', to: '/verification' }, { label: 'Submission' }]}
        />
        <LoadingState label="Loading verification submission" rows={6} />
      </>
    )
  }

  if (submissionQuery.error instanceof ApiClientError && submissionQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (submissionQuery.error instanceof ApiClientError && submissionQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Submission not found"
        description="This verification submission does not exist or is no longer available."
        action={
          <Link className="ui-button ui-button--secondary" to="/verification">
            Back to queue
          </Link>
        }
      />
    )
  }

  if (submissionQuery.error || !submissionQuery.data) {
    return (
      <ErrorState
        title="Unable to load submission"
        description={
          submissionQuery.error instanceof ApiClientError
            ? submissionQuery.error.message
            : 'The submission could not be loaded.'
        }
        onRetry={() => {
          void submissionQuery.refetch()
        }}
      />
    )
  }

  const submission = submissionQuery.data

  return (
    <div className="verification-page">
      <PageHeader
        title={`Submission #${submission.id}`}
        description={submission.requirement?.name ?? 'Verification submission review'}
        breadcrumbs={[
          { label: 'Verification', to: '/verification' },
          { label: `Submission #${submission.id}` },
        ]}
        actions={
          <Link className="ui-button ui-button--secondary" to="/verification">
            Back to queue
          </Link>
        }
      />

      <div className="verification-detail-grid">
        <section className="verification-panel">
          <div className="verification-detail-heading">
            <h2>Participant</h2>
            <StatusBadge domain="verification_submission" status={submission.status} />
          </div>
          <dl className="verification-dl">
            <div>
              <dt>Name</dt>
              <dd>{submission.user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{submission.user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{submission.user?.role ?? '—'}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{submission.user_id}</dd>
            </div>
          </dl>
        </section>

        <section className="verification-panel">
          <h2>Requirement</h2>
          <dl className="verification-dl">
            <div>
              <dt>Name</dt>
              <dd>{submission.requirement?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{submission.requirement?.requirement_type ?? '—'}</dd>
            </div>
            <div>
              <dt>Participant type</dt>
              <dd>{submission.requirement?.participant_type ?? '—'}</dd>
            </div>
            <div>
              <dt>Required</dt>
              <dd>{submission.requirement?.is_required ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt>Active</dt>
              <dd>{submission.requirement?.is_active ? 'Yes' : 'No'}</dd>
            </div>
            {submission.requirement?.description ? (
              <div className="verification-dl__full">
                <dt>Description</dt>
                <dd>{submission.requirement.description}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="verification-panel verification-panel--wide">
          <h2>Submission</h2>
          <dl className="verification-dl">
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge domain="verification_submission" status={submission.status} />
              </dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>v{submission.current_version}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{formatVerificationTimestamp(submission.submitted_at)}</dd>
            </div>
            <div>
              <dt>Reviewed</dt>
              <dd>{formatVerificationTimestamp(submission.reviewed_at)}</dd>
            </div>
            <div className="verification-dl__full">
              <dt>Text value</dt>
              <dd>{submission.text_value ?? '—'}</dd>
            </div>
            {submission.review_reason ? (
              <div className="verification-dl__full">
                <dt>Review reason</dt>
                <dd>{submission.review_reason}</dd>
              </div>
            ) : null}
            {submission.reviewer_notes ? (
              <div className="verification-dl__full">
                <dt>Reviewer notes</dt>
                <dd>{submission.reviewer_notes}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      </div>

      <EvidenceList submissionId={submission.id} evidence={submission.evidence ?? []} />
      <ReviewActions submissionId={submission.id} status={submission.status} />
      <ReviewTimeline
        events={eventsQuery.data ?? []}
        isLoading={eventsQuery.isLoading}
        error={eventsQuery.error}
        onRetry={() => {
          void eventsQuery.refetch()
        }}
      />
    </div>
  )
}
