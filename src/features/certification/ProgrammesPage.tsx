import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { useAuth } from '@/features/auth/useAuth'
import { hasPermission } from '@/features/auth/permissions'
import {
  createCertificationProgramme,
  fetchCertificationProgrammes,
} from '@/features/certification/api'
import {
  CERTIFICATION_QUERY_KEYS,
  certificationProgrammePath,
} from '@/features/certification/constants'
import {
  formatCertificationFee,
  formatCertificationTimestamp,
} from '@/features/certification/format'
import type { CertificationProgramme } from '@/features/certification/types'
import {
  Button,
  DataTable,
  ErrorState,
  ForbiddenState,
  Notice,
  PageHeader,
  StatusBadge,
  TextAreaField,
  TextField,
  type DataTableColumn,
} from '@/shared/ui'

export function ProgrammesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const formId = useId()
  const canManage = hasPermission(user, 'certification.manage')

  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.programmes(),
    queryFn: ({ signal }) => fetchCertificationProgrammes(signal),
    staleTime: 15_000,
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createCertificationProgramme({
        name: name.trim(),
        description: description.trim() || null,
        learning_objectives: objectives.trim() || null,
      }),
    onSuccess: async (programme) => {
      setFormOpen(false)
      setName('')
      setDescription('')
      setObjectives('')
      setFormError(null)
      setSuccessMessage(`Programme "${programme.name}" created as a draft.`)
      await queryClient.invalidateQueries({ queryKey: CERTIFICATION_QUERY_KEYS.programmes() })
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiClientError ? error.message : 'Unable to create the programme.',
      )
    },
  })

  const columns = useMemo<DataTableColumn<CertificationProgramme>[]>(
    () => [
      {
        id: 'programme',
        header: 'Programme',
        cell: (row) => (
          <div className="cert-stack">
            <span className="cert-primary">{row.name}</span>
            <span className="cert-muted">#{row.id}</span>
          </div>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: (row) => <StatusBadge domain="certification" status={String(row.status)} />,
      },
      {
        id: 'published-version',
        header: 'Published version',
        cell: (row) =>
          row.current_published_version ? (
            <div className="cert-stack">
              <span className="cert-primary">
                Version {row.current_published_version.version_number}
              </span>
              <span className="cert-muted">
                {formatCertificationFee(
                  row.current_published_version.fee_amount_minor,
                  row.current_published_version.fee_currency,
                )}
              </span>
            </div>
          ) : (
            <span className="cert-muted">No published version</span>
          ),
      },
      {
        id: 'versions',
        header: 'Versions',
        cell: (row) => (row.versions ? row.versions.length : '—'),
      },
      {
        id: 'created',
        header: 'Created',
        cell: (row) => (
          <span className="cert-muted">{formatCertificationTimestamp(row.created_at)}</span>
        ),
      },
      {
        id: 'action',
        header: 'Actions',
        align: 'right',
        cell: (row) => (
          <Link className="cert-action-link" to={certificationProgrammePath(row.id)}>
            Open
          </Link>
        ),
      },
    ],
    [],
  )

  const forbidden = listQuery.error instanceof ApiClientError && listQuery.error.status === 403

  return (
    <div className="cert-page">
      <PageHeader
        title="Certification programmes"
        description="Author optional Ambassador Professional Certification programmes. Content lives on programme versions; publishing a version is what makes it purchasable."
        breadcrumbs={[{ label: 'Certification' }, { label: 'Programmes' }]}
        actions={
          canManage ? (
            <Button
              variant="primary"
              onClick={() => {
                setFormOpen((open) => !open)
                setSuccessMessage(null)
                setFormError(null)
              }}
            >
              {formOpen ? 'Close' : 'Create programme'}
            </Button>
          ) : null
        }
      />

      <Notice tone="info" title="Optional recognition, not Verification">
        Certification is optional professional recognition. It is separate from account Verification
        and never changes ranking, Featured placement, or commission terms.
      </Notice>

      {successMessage ? (
        <Notice tone="success" title="Saved">
          {successMessage}
        </Notice>
      ) : null}

      {formOpen && canManage ? (
        <section className="cert-panel" aria-labelledby={`${formId}-title`}>
          <h2 id={`${formId}-title`}>Create programme</h2>
          <p className="cert-muted">
            New programmes start as a draft with no versions. Add a version to configure the fee and
            pass mark, then publish it.
          </p>
          <form
            className="cert-form"
            onSubmit={(event) => {
              event.preventDefault()
              setFormError(null)
              if (!name.trim()) {
                setFormError('Name is required.')
                return
              }
              createMutation.mutate()
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
            {formError ? (
              <p className="field__error" role="alert">
                {formError}
              </p>
            ) : null}
            <div className="cert-form__actions">
              <Button variant="ghost" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create programme'}
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {forbidden ? (
        <ForbiddenState />
      ) : listQuery.error ? (
        <ErrorState
          title="Unable to load certification programmes"
          description={
            listQuery.error instanceof ApiClientError
              ? listQuery.error.message
              : 'The programme list could not be loaded.'
          }
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={listQuery.data ?? []}
          getRowId={(row) => String(row.id)}
          isLoading={listQuery.isLoading}
          emptyTitle="No certification programmes yet."
          emptyDescription={
            canManage
              ? 'Create a programme to start authoring curriculum and an assessment.'
              : 'No programmes have been created. Certification authoring requires the manage permission.'
          }
          caption="Certification programmes"
        />
      )}
    </div>
  )
}
