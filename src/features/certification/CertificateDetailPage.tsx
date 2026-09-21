import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError, triggerBrowserDownload } from '@/shared/api'
import { hasPermission } from '@/features/auth/permissions'
import { useAuth } from '@/features/auth/useAuth'
import {
  downloadCertificationCertificate,
  fetchCertificationAward,
  fetchCertificationCertificate,
  retryCertificationCertificateArtifact,
} from '@/features/certification/api'
import {
  CERTIFICATION_LEARNERS_PATH,
  CERTIFICATION_QUERY_KEYS,
  certificationLearnerPath,
} from '@/features/certification/constants'
import { formatCertificationTimestamp } from '@/features/certification/format'
import { formatStatusLabel } from '@/shared/lib/status'
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

export function CertificateDetailPage() {
  const { certificateId: certificateIdParam } = useParams()
  const certificateId = Number(certificateIdParam)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canManage = hasPermission(user, 'certification.manage')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const idValid = Number.isFinite(certificateId) && certificateId > 0

  const certificateQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.certificate(certificateId),
    queryFn: ({ signal }) => fetchCertificationCertificate(certificateId, signal),
    enabled: idValid,
    staleTime: 10_000,
    retry: false,
  })

  const certificate = certificateQuery.data

  // The embedded award summary omits programme and attempt context, so load the
  // Award resource to make the Award / Certificate distinction explicit.
  const awardQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.award(certificate?.award_id ?? 0),
    queryFn: ({ signal }) => fetchCertificationAward(certificate!.award_id, signal),
    enabled: Boolean(certificate?.award_id),
    staleTime: 10_000,
    retry: false,
  })

  const retryMutation = useMutation({
    mutationFn: () => retryCertificationCertificateArtifact(certificateId),
    onSuccess: async (updated) => {
      setActionError(null)
      setActionMessage(
        `Artifact regeneration requested. PDF status is now ${formatStatusLabel(String(updated.artifact_status))}.`,
      )
      await queryClient.invalidateQueries({
        queryKey: CERTIFICATION_QUERY_KEYS.certificate(certificateId),
      })
    },
    onError: (error) => {
      setActionError(
        error instanceof ApiClientError
          ? error.message
          : 'The artifact retry request could not be completed.',
      )
    },
  })

  async function download() {
    try {
      const result = await downloadCertificationCertificate(certificateId)
      triggerBrowserDownload(
        result.blob,
        result.filename ?? `${certificate?.certificate_number ?? 'certificate'}.pdf`,
      )
      setActionError(null)
    } catch (error) {
      setActionError(
        error instanceof ApiClientError
          ? error.message
          : 'The certificate PDF could not be downloaded.',
      )
    }
  }

  if (!idValid) {
    return (
      <NotFoundState
        title="Certificate not found"
        description="The certificate identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to={CERTIFICATION_LEARNERS_PATH}>
            Back to learners
          </Link>
        }
      />
    )
  }

  if (certificateQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Certificate"
          breadcrumbs={[
            { label: 'Certification' },
            { label: 'Learners', to: CERTIFICATION_LEARNERS_PATH },
            { label: 'Certificate' },
          ]}
        />
        <LoadingState label="Loading certificate" rows={6} />
      </>
    )
  }

  if (certificateQuery.error instanceof ApiClientError && certificateQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (certificateQuery.error instanceof ApiClientError && certificateQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Certificate not found"
        description="This certificate does not exist or is no longer available."
        action={
          <Link className="ui-button ui-button--secondary" to={CERTIFICATION_LEARNERS_PATH}>
            Back to learners
          </Link>
        }
      />
    )
  }

  if (certificateQuery.error || !certificate) {
    return (
      <ErrorState
        title="Unable to load certificate"
        description={
          certificateQuery.error instanceof ApiClientError
            ? certificateQuery.error.message
            : 'The certificate could not be loaded.'
        }
        onRetry={() => {
          void certificateQuery.refetch()
        }}
      />
    )
  }

  const award = awardQuery.data
  const enrollmentId = award?.enrollment_id ?? certificate.award?.enrollment_id ?? null
  const artifactStatus = String(certificate.artifact_status)
  const canRetry = canManage && artifactStatus === 'failed_retryable'

  return (
    <div className="cert-page">
      <PageHeader
        title={certificate.certificate_number}
        description="Award, Certificate, and PDF artifact are three distinct records. A missing PDF never means the certification itself is missing."
        breadcrumbs={[
          { label: 'Certification' },
          { label: 'Learners', to: CERTIFICATION_LEARNERS_PATH },
          { label: certificate.certificate_number },
        ]}
        actions={
          <div className="cert-actions">
            <StatusBadge domain="certification" status={String(certificate.status)} />
            {enrollmentId ? (
              <Link
                className="ui-button ui-button--secondary"
                to={certificationLearnerPath(enrollmentId)}
              >
                Open enrollment
              </Link>
            ) : null}
          </div>
        }
      />

      {actionMessage ? (
        <Notice tone="success" title="Requested">
          {actionMessage}
        </Notice>
      ) : null}

      {actionError ? (
        <Notice tone="danger" title="Action failed">
          {actionError}
        </Notice>
      ) : null}

      <div className="cert-detail-grid">
        <section className="cert-panel">
          <h2>Award (achievement)</h2>
          <p className="cert-muted">
            The Award records that the learner passed. It is created by the server from a passing
            attempt and cannot be granted or revoked here.
          </p>
          {awardQuery.isLoading ? (
            <p className="cert-muted">Loading award…</p>
          ) : award ? (
            <dl className="cert-dl">
              <div>
                <dt>Award ID</dt>
                <dd>#{award.id}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge domain="certification" status={String(award.status)} />
                </dd>
              </div>
              <div>
                <dt>Awarded</dt>
                <dd>{formatCertificationTimestamp(award.awarded_at)}</dd>
              </div>
              <div>
                <dt>Programme</dt>
                <dd>{award.programme?.name ?? `#${award.programme_id}`}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>
                  {award.programme_version
                    ? `Version ${award.programme_version.version_number}`
                    : `Version id #${award.programme_version_id}`}
                </dd>
              </div>
              <div>
                <dt>Source attempt</dt>
                <dd>
                  {award.assessment_attempt
                    ? `Attempt ${award.assessment_attempt.attempt_number} · ${
                        award.assessment_attempt.score_percent ?? '—'
                      }%`
                    : '—'}
                </dd>
              </div>
              <div className="cert-dl__full">
                <dt>Learner</dt>
                <dd className="cert-break">
                  {award.user ? `${award.user.name} · ${award.user.email}` : '—'}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="cert-muted">
              The linked Award could not be loaded. Certificate #{certificate.award_id} references
              award id #{certificate.award_id}.
            </p>
          )}
        </section>

        <section className="cert-panel">
          <h2>Certificate (issued document)</h2>
          <p className="cert-muted">
            The Certificate is the issued document derived from the Award. There is no revocation
            endpoint, so certificates cannot be withdrawn from this console.
          </p>
          <dl className="cert-dl">
            <div>
              <dt>Certificate number</dt>
              <dd className="cert-break">{certificate.certificate_number}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge domain="certification" status={String(certificate.status)} />
              </dd>
            </div>
            <div>
              <dt>Issued</dt>
              <dd>{formatCertificationTimestamp(certificate.issued_at)}</dd>
            </div>
            <div>
              <dt>Recipient name</dt>
              <dd>{certificate.recipient_name ?? '—'}</dd>
            </div>
            <div>
              <dt>Programme name</dt>
              <dd>{certificate.programme_name ?? '—'}</dd>
            </div>
            <div>
              <dt>Programme version</dt>
              <dd>
                {certificate.programme_version_number != null
                  ? `Version ${certificate.programme_version_number}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>Issuer</dt>
              <dd>{certificate.issuer_name ?? '—'}</dd>
            </div>
            <div>
              <dt>Underlying award</dt>
              <dd>#{certificate.award_id}</dd>
            </div>
          </dl>
        </section>

        <section className="cert-panel cert-panel--wide">
          <h2>PDF artifact</h2>
          <p className="cert-muted">
            The PDF is generated asynchronously and streamed through an authorized endpoint. No
            storage disk, path, or signed URL is exposed to this console.
          </p>
          <dl className="cert-dl">
            <div>
              <dt>Artifact status</dt>
              <dd>
                <StatusBadge domain="certification" status={artifactStatus} />
              </dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{formatCertificationTimestamp(certificate.artifact_generated_at)}</dd>
            </div>
            <div>
              <dt>Downloadable</dt>
              <dd>{certificate.artifact_available ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt>Last failure</dt>
              <dd>{formatCertificationTimestamp(certificate.artifact_failed_at)}</dd>
            </div>
            <div className="cert-dl__full">
              <dt>Failure code</dt>
              <dd>{certificate.artifact_error_code ?? '—'}</dd>
            </div>
          </dl>

          {artifactStatus === 'pending_generation' ? (
            <Notice tone="info" title="PDF still generating">
              This certificate is issued and valid. Its PDF is queued for generation and is not
              downloadable yet — refresh later rather than treating the certification as missing.
            </Notice>
          ) : null}

          {artifactStatus === 'failed_retryable' ? (
            <Notice tone="warning" title="PDF generation failed">
              Generation failed in a retryable way. The Award and Certificate remain valid; only the
              PDF rendering needs to be retried.
            </Notice>
          ) : null}

          <div className="cert-actions">
            {certificate.artifact_available ? (
              <Button
                variant="primary"
                onClick={() => {
                  void download()
                }}
              >
                Download PDF
              </Button>
            ) : null}
            {canRetry ? (
              <Button
                variant="secondary"
                disabled={retryMutation.isPending}
                onClick={() => retryMutation.mutate()}
              >
                {retryMutation.isPending ? 'Retrying…' : 'Retry PDF generation'}
              </Button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  )
}
