import { useId, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { useAuth } from '@/features/auth/useAuth'
import { hasPermission } from '@/features/auth/permissions'
import {
  createCertificationVersion,
  fetchCertificationProgramme,
  updateCertificationProgramme,
} from '@/features/certification/api'
import {
  CERTIFICATION_FEE_CURRENCY_OPTIONS,
  CERTIFICATION_PROGRAMMES_PATH,
  CERTIFICATION_QUERY_KEYS,
  certificationVersionPath,
} from '@/features/certification/constants'
import {
  formatCertificationFee,
  formatCertificationTimestamp,
  formatPassMark,
} from '@/features/certification/format'
import type { CertificationProgrammeVersion } from '@/features/certification/types'
import { majorAmountToMinor } from '@/shared/lib/money'
import {
  Button,
  ConfirmDialog,
  DataTable,
  ErrorState,
  ForbiddenState,
  LoadingState,
  Notice,
  NotFoundState,
  PageHeader,
  SelectField,
  StatusBadge,
  TextAreaField,
  TextField,
  type DataTableColumn,
} from '@/shared/ui'

export function ProgrammeDetailPage() {
  const { programmeId: programmeIdParam } = useParams()
  const programmeId = Number(programmeIdParam)
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const formId = useId()
  const canManage = hasPermission(user, 'certification.manage')

  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [metaError, setMetaError] = useState<string | null>(null)

  const [versionFormOpen, setVersionFormOpen] = useState(false)
  const [feeMajor, setFeeMajor] = useState('')
  const [feeCurrency, setFeeCurrency] = useState<string>('NGN')
  const [passMark, setPassMark] = useState('')
  const [versionError, setVersionError] = useState<string | null>(null)

  const [statusTransition, setStatusTransition] = useState<'archived' | 'unpublished' | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.programme(programmeId),
    queryFn: ({ signal }) => fetchCertificationProgramme(programmeId, signal),
    enabled: Number.isFinite(programmeId) && programmeId > 0,
    staleTime: 10_000,
    retry: false,
  })

  const programme = detailQuery.data

  const metaMutation = useMutation({
    mutationFn: () =>
      updateCertificationProgramme(programmeId, {
        name: name.trim(),
        description: description.trim() || null,
        learning_objectives: objectives.trim() || null,
      }),
    onSuccess: async () => {
      setEditOpen(false)
      setMetaError(null)
      setSuccessMessage('Programme metadata updated.')
      await queryClient.invalidateQueries({ queryKey: CERTIFICATION_QUERY_KEYS.all })
    },
    onError: (error) => {
      setMetaError(
        error instanceof ApiClientError ? error.message : 'Unable to update the programme.',
      )
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: 'archived' | 'unpublished') =>
      updateCertificationProgramme(programmeId, { status }),
    onSuccess: async (updated) => {
      setStatusTransition(null)
      setSuccessMessage(`Programme status is now ${updated.status}.`)
      await queryClient.invalidateQueries({ queryKey: CERTIFICATION_QUERY_KEYS.all })
    },
    onError: (error) => {
      setStatusTransition(null)
      setMetaError(
        error instanceof ApiClientError ? error.message : 'Unable to change programme status.',
      )
    },
  })

  const versionMutation = useMutation({
    mutationFn: () => {
      const feeMinor = feeMajor.trim() ? majorAmountToMinor(feeMajor) : null
      return createCertificationVersion(programmeId, {
        fee_amount_minor: feeMinor,
        fee_currency: feeCurrency,
        pass_mark_percent: passMark.trim() || null,
      })
    },
    onSuccess: async (version) => {
      setVersionFormOpen(false)
      setFeeMajor('')
      setPassMark('')
      setVersionError(null)
      setSuccessMessage(`Draft version ${version.version_number} created.`)
      await queryClient.invalidateQueries({ queryKey: CERTIFICATION_QUERY_KEYS.all })
    },
    onError: (error) => {
      setVersionError(
        error instanceof ApiClientError ? error.message : 'Unable to create the version.',
      )
    },
  })

  const columns = useMemo<DataTableColumn<CertificationProgrammeVersion>[]>(
    () => [
      {
        id: 'version',
        header: 'Version',
        cell: (row) => (
          <div className="cert-stack">
            <span className="cert-primary">Version {row.version_number}</span>
            {programme?.current_published_version_id === row.id ? (
              <span className="cert-flag">Current published</span>
            ) : null}
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <StatusBadge domain="certification" status={String(row.status)} />,
      },
      {
        id: 'fee',
        header: 'Fee',
        cell: (row) => formatCertificationFee(row.fee_amount_minor, row.fee_currency),
      },
      {
        id: 'pass-mark',
        header: 'Pass mark',
        cell: (row) => formatPassMark(row.pass_mark_percent),
      },
      {
        id: 'lifecycle',
        header: 'Lifecycle',
        cell: (row) => (
          <div className="cert-stack">
            <span className="cert-muted">
              Published: {formatCertificationTimestamp(row.published_at)}
            </span>
            <span className="cert-muted">
              Unpublished: {formatCertificationTimestamp(row.unpublished_at)}
            </span>
          </div>
        ),
      },
      {
        id: 'action',
        header: 'Actions',
        align: 'right',
        cell: (row) => (
          <Link
            className="cert-action-link"
            to={certificationVersionPath(programmeId, row.version_number)}
          >
            Open version
          </Link>
        ),
      },
    ],
    [programme?.current_published_version_id, programmeId],
  )

  if (!Number.isFinite(programmeId) || programmeId <= 0) {
    return (
      <NotFoundState
        title="Programme not found"
        description="The programme identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to={CERTIFICATION_PROGRAMMES_PATH}>
            Back to programmes
          </Link>
        }
      />
    )
  }

  if (detailQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Certification programme"
          breadcrumbs={[
            { label: 'Certification' },
            { label: 'Programmes', to: CERTIFICATION_PROGRAMMES_PATH },
            { label: 'Detail' },
          ]}
        />
        <LoadingState label="Loading programme" rows={8} />
      </>
    )
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Programme not found"
        description="This certification programme does not exist or is no longer available."
        action={
          <Link className="ui-button ui-button--secondary" to={CERTIFICATION_PROGRAMMES_PATH}>
            Back to programmes
          </Link>
        }
      />
    )
  }

  if (detailQuery.error || !programme) {
    return (
      <ErrorState
        title="Unable to load programme"
        description={
          detailQuery.error instanceof ApiClientError
            ? detailQuery.error.message
            : 'The programme could not be loaded.'
        }
        onRetry={() => {
          void detailQuery.refetch()
        }}
      />
    )
  }

  const versions = programme.versions ?? []
  const canArchive = programme.status === 'unpublished'
  const canRestore = programme.status === 'archived'

  return (
    <div className="cert-page">
      <PageHeader
        title={programme.name}
        description="Programme metadata is editable at any status. Curriculum, fee, and pass mark live on versions."
        breadcrumbs={[
          { label: 'Certification' },
          { label: 'Programmes', to: CERTIFICATION_PROGRAMMES_PATH },
          { label: programme.name },
        ]}
        actions={
          <div className="cert-actions">
            <StatusBadge domain="certification" status={String(programme.status)} />
            <Link className="ui-button ui-button--secondary" to={CERTIFICATION_PROGRAMMES_PATH}>
              Back to programmes
            </Link>
          </div>
        }
      />

      {successMessage ? (
        <Notice tone="success" title="Saved">
          {successMessage}
        </Notice>
      ) : null}

      <Notice tone="warning" title="Published versions are immutable">
        Published and unpublished versions cannot be edited — not their fee, pass mark, curriculum,
        or assessment. To change delivered content, create a new draft version and publish it.
      </Notice>

      <section className="cert-panel">
        <div className="cert-panel__head">
          <h2>Programme metadata</h2>
          {canManage ? (
            <Button
              variant="secondary"
              onClick={() => {
                if (!editOpen) {
                  setName(programme.name)
                  setDescription(programme.description ?? '')
                  setObjectives(programme.learning_objectives ?? '')
                }
                setEditOpen((open) => !open)
                setMetaError(null)
                setSuccessMessage(null)
              }}
            >
              {editOpen ? 'Cancel edit' : 'Edit metadata'}
            </Button>
          ) : null}
        </div>

        {editOpen && canManage ? (
          <form
            className="cert-form"
            onSubmit={(event) => {
              event.preventDefault()
              setMetaError(null)
              if (!name.trim()) {
                setMetaError('Name is required.')
                return
              }
              metaMutation.mutate()
            }}
          >
            <TextField
              id={`${formId}-name`}
              label="Name"
              value={name}
              maxLength={255}
              onChange={(event) => setName(event.target.value)}
            />
            <TextAreaField
              id={`${formId}-description`}
              label="Description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <TextAreaField
              id={`${formId}-objectives`}
              label="Learning objectives"
              rows={3}
              value={objectives}
              onChange={(event) => setObjectives(event.target.value)}
            />
            {metaError ? (
              <p className="field__error" role="alert">
                {metaError}
              </p>
            ) : null}
            <div className="cert-form__actions">
              <Button type="submit" variant="primary" disabled={metaMutation.isPending}>
                {metaMutation.isPending ? 'Saving…' : 'Save metadata'}
              </Button>
            </div>
          </form>
        ) : (
          <dl className="cert-dl">
            <div>
              <dt>Programme ID</dt>
              <dd>#{programme.id}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge domain="certification" status={String(programme.status)} />
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatCertificationTimestamp(programme.created_at)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatCertificationTimestamp(programme.updated_at)}</dd>
            </div>
            <div className="cert-dl__full">
              <dt>Description</dt>
              <dd>{programme.description || '—'}</dd>
            </div>
            <div className="cert-dl__full">
              <dt>Learning objectives</dt>
              <dd>{programme.learning_objectives || '—'}</dd>
            </div>
          </dl>
        )}

        {canManage && (canArchive || canRestore) ? (
          <div className="cert-actions">
            {canArchive ? (
              <Button variant="danger" onClick={() => setStatusTransition('archived')}>
                Archive programme
              </Button>
            ) : null}
            {canRestore ? (
              <Button variant="secondary" onClick={() => setStatusTransition('unpublished')}>
                Restore to unpublished
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="cert-panel">
        <div className="cert-panel__head">
          <h2>Versions</h2>
          {canManage ? (
            <Button
              variant="primary"
              onClick={() => {
                setVersionFormOpen((open) => !open)
                setVersionError(null)
                setSuccessMessage(null)
              }}
            >
              {versionFormOpen ? 'Close' : 'Create version'}
            </Button>
          ) : null}
        </div>

        {versionFormOpen && canManage ? (
          <form
            className="cert-form"
            onSubmit={(event) => {
              event.preventDefault()
              setVersionError(null)
              if (feeMajor.trim() && majorAmountToMinor(feeMajor) == null) {
                setVersionError('Enter a valid fee with up to 2 decimal places.')
                return
              }
              versionMutation.mutate()
            }}
          >
            <p className="cert-muted">
              A version starts as a draft. Fee and pass mark are required before it can be
              published.
            </p>
            <div className="cert-form__grid">
              <TextField
                id={`${formId}-fee`}
                label="Fee (major units)"
                inputMode="decimal"
                value={feeMajor}
                onChange={(event) => setFeeMajor(event.target.value)}
                hint="Leave blank to configure the fee later."
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
            {versionError ? (
              <p className="field__error" role="alert">
                {versionError}
              </p>
            ) : null}
            <div className="cert-form__actions">
              <Button type="submit" variant="primary" disabled={versionMutation.isPending}>
                {versionMutation.isPending ? 'Creating…' : 'Create draft version'}
              </Button>
            </div>
          </form>
        ) : null}

        <DataTable
          columns={columns}
          rows={versions}
          getRowId={(row) => String(row.id)}
          emptyTitle="No versions yet."
          emptyDescription="Create a draft version to author curriculum, an assessment, the fee, and the pass mark."
          caption={`Versions of ${programme.name}`}
        />
      </section>

      <ConfirmDialog
        open={statusTransition != null}
        title={statusTransition === 'archived' ? 'Archive programme' : 'Restore programme'}
        description={
          statusTransition === 'archived'
            ? 'Archiving hides the programme from the Ambassador catalogue. Existing enrollments, awards, and certificates are unaffected.'
            : 'Restoring returns the programme to unpublished. Publishing a version is still required to make it purchasable.'
        }
        confirmLabel={statusTransition === 'archived' ? 'Archive' : 'Restore'}
        tone={statusTransition === 'archived' ? 'danger' : 'default'}
        onCancel={() => setStatusTransition(null)}
        onConfirm={() => {
          if (statusTransition) {
            statusMutation.mutate(statusTransition)
          }
        }}
      />
    </div>
  )
}
