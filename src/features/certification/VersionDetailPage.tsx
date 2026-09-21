import { useId, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { useAuth } from '@/features/auth/useAuth'
import { hasPermission } from '@/features/auth/permissions'
import {
  fetchCertificationAssessment,
  fetchCertificationModules,
  fetchCertificationProgramme,
  fetchCertificationVersion,
  publishCertificationVersion,
  unpublishCertificationVersion,
  updateCertificationVersion,
} from '@/features/certification/api'
import {
  CERTIFICATION_FEE_CURRENCY_OPTIONS,
  CERTIFICATION_LEARNERS_PATH,
  CERTIFICATION_PROGRAMMES_PATH,
  CERTIFICATION_QUERY_KEYS,
  certificationProgrammePath,
} from '@/features/certification/constants'
import {
  formatCertificationFee,
  formatCertificationTimestamp,
  formatPassMark,
  isVersionMutable,
  versionImmutabilityNote,
} from '@/features/certification/format'
import { AssessmentPanel } from '@/features/certification/components/AssessmentPanel'
import { CurriculumPanel } from '@/features/certification/components/CurriculumPanel'
import { majorAmountToMinor, minorAmountToMajorInput } from '@/shared/lib/money'
import {
  Button,
  ConfirmDialog,
  ErrorState,
  ForbiddenState,
  LoadingState,
  Notice,
  NotFoundState,
  PageHeader,
  SelectField,
  StatusBadge,
  TextField,
} from '@/shared/ui'

export function VersionDetailPage() {
  const { programmeId: programmeIdParam, versionNumber: versionNumberParam } = useParams()
  const programmeId = Number(programmeIdParam)
  const versionNumber = Number(versionNumberParam)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const formId = useId()
  const canManage = hasPermission(user, 'certification.manage')

  const [commercialOpen, setCommercialOpen] = useState(false)
  const [feeMajor, setFeeMajor] = useState('')
  const [feeCurrency, setFeeCurrency] = useState('NGN')
  const [passMark, setPassMark] = useState('')
  const [lifecycleAction, setLifecycleAction] = useState<'publish' | 'unpublish' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const idsValid = Number.isFinite(programmeId) && programmeId > 0 && Number.isFinite(versionNumber)

  const programmeQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.programme(programmeId),
    queryFn: ({ signal }) => fetchCertificationProgramme(programmeId, signal),
    enabled: idsValid,
    staleTime: 10_000,
    retry: false,
  })

  const versionQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.version(programmeId, versionNumber),
    queryFn: ({ signal }) => fetchCertificationVersion(programmeId, versionNumber, signal),
    enabled: idsValid,
    staleTime: 10_000,
    retry: false,
  })

  const version = versionQuery.data
  const draft = isVersionMutable(version)

  const modulesQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.modules(programmeId, versionNumber),
    queryFn: ({ signal }) => fetchCertificationModules(programmeId, versionNumber, signal),
    enabled: idsValid && Boolean(version),
    staleTime: 10_000,
    retry: false,
  })

  const assessmentQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.assessment(programmeId, versionNumber),
    queryFn: ({ signal }) => fetchCertificationAssessment(programmeId, versionNumber, signal),
    enabled: idsValid && Boolean(version),
    staleTime: 10_000,
    retry: false,
  })

  const commercialMutation = useMutation({
    mutationFn: () =>
      updateCertificationVersion(programmeId, versionNumber, {
        fee_amount_minor: feeMajor.trim() ? majorAmountToMinor(feeMajor) : null,
        fee_currency: feeCurrency,
        pass_mark_percent: passMark.trim() || null,
      }),
    onSuccess: async () => {
      setCommercialOpen(false)
      setErrorMessage(null)
      setMessage('Version fee and pass mark updated.')
      await queryClient.invalidateQueries({ queryKey: CERTIFICATION_QUERY_KEYS.all })
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiClientError ? error.message : 'Unable to update the version.',
      )
    },
  })

  const lifecycleMutation = useMutation({
    mutationFn: (action: 'publish' | 'unpublish') =>
      action === 'publish'
        ? publishCertificationVersion(programmeId, versionNumber)
        : unpublishCertificationVersion(programmeId, versionNumber),
    onSuccess: async (updated) => {
      setLifecycleAction(null)
      setErrorMessage(null)
      setMessage(`Version ${updated.version_number} is now ${updated.status}.`)
      await queryClient.invalidateQueries({ queryKey: CERTIFICATION_QUERY_KEYS.all })
    },
    onError: (error) => {
      setLifecycleAction(null)
      setErrorMessage(
        error instanceof ApiClientError
          ? error.message
          : 'Unable to change the version lifecycle state.',
      )
    },
  })

  if (!idsValid) {
    return (
      <NotFoundState
        title="Version not found"
        description="The programme or version identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to={CERTIFICATION_PROGRAMMES_PATH}>
            Back to programmes
          </Link>
        }
      />
    )
  }

  if (versionQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Programme version"
          breadcrumbs={[
            { label: 'Certification' },
            { label: 'Programmes', to: CERTIFICATION_PROGRAMMES_PATH },
            { label: 'Version' },
          ]}
        />
        <LoadingState label="Loading version" rows={8} />
      </>
    )
  }

  if (versionQuery.error instanceof ApiClientError && versionQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (versionQuery.error instanceof ApiClientError && versionQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Version not found"
        description="This programme version does not exist."
        action={
          <Link
            className="ui-button ui-button--secondary"
            to={certificationProgrammePath(programmeId)}
          >
            Back to programme
          </Link>
        }
      />
    )
  }

  if (versionQuery.error || !version) {
    return (
      <ErrorState
        title="Unable to load version"
        description={
          versionQuery.error instanceof ApiClientError
            ? versionQuery.error.message
            : 'The programme version could not be loaded.'
        }
        onRetry={() => {
          void versionQuery.refetch()
        }}
      />
    )
  }

  const programme = programmeQuery.data
  const programmeName = programme?.name ?? `Programme #${programmeId}`
  const immutabilityNote = versionImmutabilityNote(String(version.status))
  const isCurrentPublished = programme?.current_published_version_id === version.id
  const canPublish = canManage && draft
  const canUnpublish = canManage && version.status === 'published' && isCurrentPublished

  return (
    <div className="cert-page">
      <PageHeader
        title={`${programmeName} · Version ${version.version_number}`}
        description="Curriculum, assessment, fee, and pass mark are authored here while the version is a draft."
        breadcrumbs={[
          { label: 'Certification' },
          { label: 'Programmes', to: CERTIFICATION_PROGRAMMES_PATH },
          { label: programmeName, to: certificationProgrammePath(programmeId) },
          { label: `Version ${version.version_number}` },
        ]}
        actions={
          <div className="cert-actions">
            <StatusBadge domain="certification" status={String(version.status)} />
            <Link
              className="ui-button ui-button--secondary"
              to={certificationProgrammePath(programmeId)}
            >
              Back to programme
            </Link>
          </div>
        }
      />

      {message ? (
        <Notice tone="success" title="Saved">
          {message}
        </Notice>
      ) : null}

      {errorMessage ? (
        <Notice tone="danger" title="Change rejected">
          {errorMessage}
        </Notice>
      ) : null}

      {immutabilityNote ? (
        <Notice tone="warning" title="Read-only version">
          {immutabilityNote}
        </Notice>
      ) : null}

      <section className="cert-panel">
        <div className="cert-panel__head">
          <h2>Version commercials</h2>
          {canManage && draft && !commercialOpen ? (
            <Button
              variant="secondary"
              onClick={() => {
                setFeeMajor(
                  version.fee_amount_minor != null
                    ? minorAmountToMajorInput(version.fee_amount_minor)
                    : '',
                )
                setFeeCurrency(version.fee_currency ?? 'NGN')
                setPassMark(version.pass_mark_percent ?? '')
                setCommercialOpen(true)
              }}
            >
              Edit fee and pass mark
            </Button>
          ) : null}
        </div>

        {commercialOpen && canManage && draft ? (
          <form
            className="cert-form"
            onSubmit={(event) => {
              event.preventDefault()
              setErrorMessage(null)
              if (feeMajor.trim() && majorAmountToMinor(feeMajor) == null) {
                setErrorMessage('Enter a valid fee with up to 2 decimal places.')
                return
              }
              commercialMutation.mutate()
            }}
          >
            <div className="cert-form__grid">
              <TextField
                id={`${formId}-fee`}
                label="Fee (major units)"
                inputMode="decimal"
                value={feeMajor}
                onChange={(event) => setFeeMajor(event.target.value)}
              />
              <SelectField
                id={`${formId}-currency`}
                label="Fee currency"
                value={feeCurrency}
                onChange={(event) => setFeeCurrency(event.target.value)}
              >
                {CERTIFICATION_FEE_CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </SelectField>
              <TextField
                id={`${formId}-pass-mark`}
                label="Pass mark (%)"
                inputMode="decimal"
                value={passMark}
                onChange={(event) => setPassMark(event.target.value)}
              />
            </div>
            <div className="cert-form__actions">
              <Button variant="ghost" onClick={() => setCommercialOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={commercialMutation.isPending}>
                {commercialMutation.isPending ? 'Saving…' : 'Save commercials'}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="cert-dl">
            <div>
              <dt>Version</dt>
              <dd>
                {version.version_number} (id #{version.id})
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge domain="certification" status={String(version.status)} />
                {isCurrentPublished ? <span className="cert-flag">Current published</span> : null}
              </dd>
            </div>
            <div>
              <dt>Fee</dt>
              <dd>{formatCertificationFee(version.fee_amount_minor, version.fee_currency)}</dd>
            </div>
            <div>
              <dt>Pass mark</dt>
              <dd>{formatPassMark(version.pass_mark_percent)}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{formatCertificationTimestamp(version.published_at)}</dd>
            </div>
            <div>
              <dt>Unpublished</dt>
              <dd>{formatCertificationTimestamp(version.unpublished_at)}</dd>
            </div>
          </dl>
        )}

        {canPublish || canUnpublish ? (
          <div className="cert-actions">
            {canPublish ? (
              <Button variant="primary" onClick={() => setLifecycleAction('publish')}>
                Publish version
              </Button>
            ) : null}
            {canUnpublish ? (
              <Button variant="danger" onClick={() => setLifecycleAction('unpublish')}>
                Unpublish version
              </Button>
            ) : null}
          </div>
        ) : null}

        {version.status === 'unpublished' ? (
          <p className="cert-muted">
            Unpublished versions cannot be re-published. Create a new draft version to return this
            programme to the catalogue.
          </p>
        ) : null}
      </section>

      <CurriculumPanel
        programmeId={programmeId}
        versionNumber={versionNumber}
        modules={modulesQuery.data ?? []}
        isLoading={modulesQuery.isLoading}
        editable={canManage && draft}
      />

      <AssessmentPanel
        programmeId={programmeId}
        versionNumber={versionNumber}
        assessment={assessmentQuery.data ?? null}
        isLoading={assessmentQuery.isLoading}
        editable={canManage && draft}
        versionPassMark={version?.pass_mark_percent ?? null}
      />

      <section className="cert-panel">
        <h2>Learner progress</h2>
        <p className="cert-muted">
          Lesson-by-lesson progress is not inspectable from this console: the backend exposes no
          Admin lesson-progress API. Attempts, awards, and certificates for learners bound to this
          version are available on the{' '}
          <Link className="cert-action-link" to={CERTIFICATION_LEARNERS_PATH}>
            certification learners
          </Link>{' '}
          desk.
        </p>
      </section>

      <ConfirmDialog
        open={lifecycleAction != null}
        title={lifecycleAction === 'publish' ? 'Publish version' : 'Unpublish version'}
        description={
          lifecycleAction === 'publish'
            ? 'Publishing makes this version purchasable and permanently freezes its curriculum, assessment, fee, and pass mark. The server rejects publishing without a fee and pass mark.'
            : 'Unpublishing removes the programme from the Ambassador catalogue. Existing enrollments, awards, and certificates are unaffected, and this version can never be re-published.'
        }
        confirmLabel={lifecycleAction === 'publish' ? 'Publish' : 'Unpublish'}
        tone={lifecycleAction === 'publish' ? 'default' : 'danger'}
        onCancel={() => setLifecycleAction(null)}
        onConfirm={() => {
          if (lifecycleAction) {
            lifecycleMutation.mutate(lifecycleAction)
          }
        }}
      />
    </div>
  )
}
