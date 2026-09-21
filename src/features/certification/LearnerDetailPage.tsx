import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { hasPermission } from '@/features/auth/permissions'
import { useAuth } from '@/features/auth/useAuth'
import {
  fetchCertificationAttempt,
  fetchCertificationAttempts,
  fetchCertificationEnrollment,
  fetchCertificationEnrollmentAwards,
  fetchCertificationEnrollmentCertificates,
} from '@/features/certification/api'
import {
  CERTIFICATION_LEARNERS_PATH,
  CERTIFICATION_QUERY_KEYS,
  certificationCertificatePath,
  certificationVersionPath,
} from '@/features/certification/constants'
import {
  formatCertificationFee,
  formatCertificationTimestamp,
  formatPassMark,
  formatScore,
} from '@/features/certification/format'
import { formatAmountMinor } from '@/shared/lib/money'
import { formatStatusLabel } from '@/shared/lib/status'
import { userDetailPath } from '@/features/users/constants'
import {
  Button,
  ErrorState,
  ForbiddenState,
  LoadingState,
  Notice,
  NotFoundState,
  PageHeader,
  StatusBadge,
} from '@/shared/ui'

export function LearnerDetailPage() {
  const { enrollmentId: enrollmentIdParam } = useParams()
  const enrollmentId = Number(enrollmentIdParam)
  const { user } = useAuth()
  const canViewProgrammes = hasPermission(user, 'certification.view')
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null)

  const idValid = Number.isFinite(enrollmentId) && enrollmentId > 0

  const enrollmentQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.enrollment(enrollmentId),
    queryFn: ({ signal }) => fetchCertificationEnrollment(enrollmentId, signal),
    enabled: idValid,
    staleTime: 10_000,
    retry: false,
  })

  const enrollment = enrollmentQuery.data

  const attemptsQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.attempts(enrollmentId),
    queryFn: ({ signal }) => fetchCertificationAttempts(enrollmentId, signal),
    enabled: idValid && Boolean(enrollment),
    staleTime: 10_000,
    retry: false,
  })

  const attemptQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.attempt(enrollmentId, selectedAttemptId ?? 0),
    queryFn: ({ signal }) => fetchCertificationAttempt(enrollmentId, selectedAttemptId!, signal),
    enabled: idValid && selectedAttemptId != null,
    staleTime: 10_000,
    retry: false,
  })

  const awardsQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.awards(enrollmentId),
    queryFn: ({ signal }) => fetchCertificationEnrollmentAwards(enrollmentId, signal),
    enabled: idValid && Boolean(enrollment),
    staleTime: 10_000,
    retry: false,
  })

  const certificatesQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.certificates(enrollmentId),
    queryFn: ({ signal }) => fetchCertificationEnrollmentCertificates(enrollmentId, signal),
    enabled: idValid && Boolean(enrollment),
    staleTime: 10_000,
    retry: false,
  })

  if (!idValid) {
    return (
      <NotFoundState
        title="Enrollment not found"
        description="The enrollment identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to={CERTIFICATION_LEARNERS_PATH}>
            Back to learners
          </Link>
        }
      />
    )
  }

  if (enrollmentQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Certification learner"
          breadcrumbs={[
            { label: 'Certification' },
            { label: 'Learners', to: CERTIFICATION_LEARNERS_PATH },
            { label: 'Detail' },
          ]}
        />
        <LoadingState label="Loading enrollment" rows={8} />
      </>
    )
  }

  if (enrollmentQuery.error instanceof ApiClientError && enrollmentQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (enrollmentQuery.error instanceof ApiClientError && enrollmentQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Enrollment not found"
        description="This enrollment does not exist or is no longer available."
        action={
          <Link className="ui-button ui-button--secondary" to={CERTIFICATION_LEARNERS_PATH}>
            Back to learners
          </Link>
        }
      />
    )
  }

  if (enrollmentQuery.error || !enrollment) {
    return (
      <ErrorState
        title="Unable to load enrollment"
        description={
          enrollmentQuery.error instanceof ApiClientError
            ? enrollmentQuery.error.message
            : 'The enrollment could not be loaded.'
        }
        onRetry={() => {
          void enrollmentQuery.refetch()
        }}
      />
    )
  }

  const attempts = attemptsQuery.data ?? []
  const awards = awardsQuery.data ?? []
  const certificates = certificatesQuery.data ?? []
  const payment = enrollment.payment
  const attemptDetail = attemptQuery.data

  return (
    <div className="cert-page">
      <PageHeader
        title={`Enrollment #${enrollment.id}`}
        description="Read-only learner record. Attempts, awards, and certificates are produced by the server."
        breadcrumbs={[
          { label: 'Certification' },
          { label: 'Learners', to: CERTIFICATION_LEARNERS_PATH },
          { label: `Enrollment #${enrollment.id}` },
        ]}
        actions={
          <div className="cert-actions">
            <StatusBadge domain="certification" status={String(enrollment.status)} />
            <Link className="ui-button ui-button--secondary" to={CERTIFICATION_LEARNERS_PATH}>
              Back to learners
            </Link>
          </div>
        }
      />

      <div className="cert-detail-grid">
        <section className="cert-panel">
          <h2>Enrollment</h2>
          <dl className="cert-dl">
            <div>
              <dt>Learner</dt>
              <dd>{enrollment.user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd className="cert-break">{enrollment.user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge domain="certification" status={String(enrollment.status)} />
              </dd>
            </div>
            <div>
              <dt>Enrolled</dt>
              <dd>{formatCertificationTimestamp(enrollment.enrolled_at)}</dd>
            </div>
            <div>
              <dt>Programme</dt>
              <dd>{enrollment.programme?.name ?? `#${enrollment.programme_id}`}</dd>
            </div>
            <div>
              <dt>Bound version</dt>
              <dd>
                {enrollment.programme_version ? (
                  canViewProgrammes ? (
                    <Link
                      className="cert-action-link"
                      to={certificationVersionPath(
                        enrollment.programme_id,
                        enrollment.programme_version.version_number,
                      )}
                    >
                      Version {enrollment.programme_version.version_number}
                    </Link>
                  ) : (
                    `Version ${enrollment.programme_version.version_number}`
                  )
                ) : (
                  `Version id #${enrollment.programme_version_id}`
                )}
              </dd>
            </div>
            {enrollment.user ? (
              <div className="cert-dl__full">
                <dt>Account</dt>
                <dd>
                  <Link className="cert-action-link" to={userDetailPath(enrollment.user.id)}>
                    Open user #{enrollment.user.id}
                  </Link>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="cert-panel">
          <h2>Payment snapshot</h2>
          <p className="cert-muted">
            Platform certification fee only. This is not a customer payment and not an Ambassador
            commission.
          </p>
          <dl className="cert-dl">
            <div>
              <dt>Enrollment fee</dt>
              <dd>
                {formatCertificationFee(enrollment.fee_amount_minor, enrollment.fee_currency)}
              </dd>
            </div>
            <div>
              <dt>Payment status</dt>
              <dd>
                {payment ? (
                  <StatusBadge domain="certification" status={String(payment.status)} />
                ) : (
                  <span className="cert-muted">No payment record</span>
                )}
              </dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd className="cert-break">{payment?.reference ?? '—'}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{payment?.provider ? formatStatusLabel(payment.provider) : '—'}</dd>
            </div>
            <div>
              <dt>Amount charged</dt>
              <dd>
                {payment?.amount_minor != null
                  ? formatAmountMinor(payment.amount_minor, payment.currency ?? 'NGN')
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Paid at</dt>
              <dd>{formatCertificationTimestamp(payment?.paid_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="cert-panel cert-panel--wide">
          <h2>Assessment attempts</h2>
          {attemptsQuery.isLoading ? (
            <p className="cert-muted">Loading attempts…</p>
          ) : attempts.length === 0 ? (
            <p className="cert-muted">This learner has not started the final assessment.</p>
          ) : (
            <ul className="cert-list">
              {attempts.map((attempt) => (
                <li key={attempt.id} className="cert-list__item">
                  <div className="cert-stack">
                    <span className="cert-primary">Attempt {attempt.attempt_number}</span>
                    <StatusBadge domain="certification" status={String(attempt.status)} />
                    <span className="cert-muted">
                      Score:{' '}
                      {formatScore(
                        attempt.score_percent,
                        attempt.correct_count,
                        attempt.total_questions,
                      )}{' '}
                      · Pass mark: {formatPassMark(attempt.pass_mark_percent)}
                    </span>
                    <span className="cert-muted">
                      Submitted: {formatCertificationTimestamp(attempt.submitted_at)}
                    </span>
                    {attempt.passed != null ? (
                      <span
                        className={attempt.passed ? 'cert-flag cert-flag--correct' : 'cert-flag'}
                      >
                        {attempt.passed ? 'Passed' : 'Not passed'}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    onClick={() =>
                      setSelectedAttemptId((current) =>
                        current === attempt.id ? null : attempt.id,
                      )
                    }
                  >
                    {selectedAttemptId === attempt.id ? 'Hide answers' : 'View answers'}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {selectedAttemptId != null ? (
            attemptQuery.isLoading ? (
              <p className="cert-muted">Loading attempt detail…</p>
            ) : attemptQuery.error ? (
              <Notice tone="danger" title="Unable to load attempt">
                {attemptQuery.error instanceof ApiClientError
                  ? attemptQuery.error.message
                  : 'The attempt detail could not be loaded.'}
              </Notice>
            ) : attemptDetail ? (
              <div className="cert-subpanel">
                <h3>Attempt {attemptDetail.attempt_number} answers</h3>
                <p className="cert-muted">
                  Marking is the server&apos;s record of this attempt and cannot be changed here.
                </p>
                {(attemptDetail.answers ?? []).length === 0 ? (
                  <p className="cert-muted">No answers were recorded on this attempt.</p>
                ) : (
                  <ul className="cert-options">
                    {(attemptDetail.answers ?? []).map((answer) => (
                      <li key={answer.question_id}>
                        <span>
                          Question #{answer.question_id} · Selected option{' '}
                          {answer.selected_option_id ?? '—'}
                        </span>
                        {answer.is_correct != null ? (
                          <span
                            className={
                              answer.is_correct ? 'cert-flag cert-flag--correct' : 'cert-flag'
                            }
                          >
                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null
          ) : null}
        </section>

        <section className="cert-panel">
          <h2>Awards</h2>
          <p className="cert-muted">
            An Award is the achievement record created when the server accepts a passing attempt. It
            cannot be granted manually.
          </p>
          {awardsQuery.isLoading ? (
            <p className="cert-muted">Loading awards…</p>
          ) : awards.length === 0 ? (
            <p className="cert-muted">No Award has been earned on this enrollment.</p>
          ) : (
            <ul className="cert-list">
              {awards.map((award) => (
                <li key={award.id} className="cert-list__item">
                  <div className="cert-stack">
                    <span className="cert-primary">Award #{award.id}</span>
                    <StatusBadge domain="certification" status={String(award.status)} />
                    <span className="cert-muted">
                      Awarded: {formatCertificationTimestamp(award.awarded_at)}
                    </span>
                    {award.assessment_attempt ? (
                      <span className="cert-muted">
                        From attempt {award.assessment_attempt.attempt_number} ·{' '}
                        {award.assessment_attempt.score_percent ?? '—'}%
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cert-panel">
          <h2>Certificates</h2>
          <p className="cert-muted">
            A Certificate is the issued document derived from an Award. The PDF artifact is
            generated asynchronously, so an issued certificate may exist before its PDF is
            downloadable.
          </p>
          {certificatesQuery.isLoading ? (
            <p className="cert-muted">Loading certificates…</p>
          ) : certificates.length === 0 ? (
            <p className="cert-muted">No Certificate has been issued on this enrollment.</p>
          ) : (
            <ul className="cert-list">
              {certificates.map((certificate) => (
                <li key={certificate.id} className="cert-list__item">
                  <div className="cert-stack">
                    <span className="cert-primary">{certificate.certificate_number}</span>
                    <StatusBadge domain="certification" status={String(certificate.status)} />
                    <span className="cert-muted">
                      PDF: {formatStatusLabel(String(certificate.artifact_status))}
                    </span>
                    {certificate.artifact_status === 'pending_generation' ? (
                      <span className="cert-muted">
                        The certificate PDF is still generating and is not downloadable yet.
                      </span>
                    ) : null}
                  </div>
                  <Link
                    className="cert-action-link"
                    to={certificationCertificatePath(certificate.id)}
                  >
                    Open certificate
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="cert-panel cert-panel--wide">
          <h2>Lesson progress</h2>
          <p className="cert-muted">
            Not available. The backend exposes no Admin lesson-progress API, so per-lesson
            completion cannot be inspected or overridden from this console. Progress inspection is
            deferred.
          </p>
        </section>
      </div>
    </div>
  )
}
