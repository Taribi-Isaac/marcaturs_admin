import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { useAuth } from '@/features/auth/useAuth'
import { hasPermission } from '@/features/auth/permissions'
import {
  fetchCertificationEnrollments,
  fetchCertificationProgrammes,
} from '@/features/certification/api'
import {
  CERTIFICATION_QUERY_KEYS,
  certificationLearnerPath,
} from '@/features/certification/constants'
import {
  formatCertificationFee,
  formatCertificationTimestamp,
} from '@/features/certification/format'
import type { CertificationEnrollment } from '@/features/certification/types'
import {
  Button,
  DataTable,
  ErrorState,
  FilterBar,
  ForbiddenState,
  Notice,
  PageHeader,
  SelectField,
  StatusBadge,
  TextField,
  type DataTableColumn,
} from '@/shared/ui'

export function LearnersPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const programmeIdParam = searchParams.get('programme_id')
  const programmeId =
    programmeIdParam && Number(programmeIdParam) > 0 ? Number(programmeIdParam) : undefined

  // Programme names come from the authoring API, which learner-only staff cannot read.
  const canReadProgrammes = hasPermission(user, 'certification.view')

  const programmesQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.programmes(),
    queryFn: ({ signal }) => fetchCertificationProgrammes(signal),
    enabled: canReadProgrammes,
    staleTime: 60_000,
    retry: false,
  })

  const listQuery = useQuery({
    queryKey: CERTIFICATION_QUERY_KEYS.enrollments(programmeId),
    queryFn: ({ signal }) => fetchCertificationEnrollments({ programme_id: programmeId }, signal),
    staleTime: 15_000,
    retry: false,
  })

  function setProgrammeFilter(value: string) {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set('programme_id', value)
    } else {
      params.delete('programme_id')
    }
    setSearchParams(params)
  }

  const columns = useMemo<DataTableColumn<CertificationEnrollment>[]>(
    () => [
      {
        id: 'enrollment',
        header: 'Enrollment',
        cell: (row) => (
          <div className="cert-stack">
            <span className="cert-primary">#{row.id}</span>
            <StatusBadge domain="certification" status={String(row.status)} />
          </div>
        ),
      },
      {
        id: 'learner',
        header: 'Learner',
        cell: (row) => (
          <div className="cert-stack">
            <span className="cert-primary">{row.user?.name ?? '—'}</span>
            <span className="cert-muted cert-break">{row.user?.email ?? '—'}</span>
          </div>
        ),
      },
      {
        id: 'programme',
        header: 'Programme',
        cell: (row) => (
          <div className="cert-stack">
            <span className="cert-primary">{row.programme?.name ?? `#${row.programme_id}`}</span>
            <span className="cert-muted">
              {row.programme_version
                ? `Version ${row.programme_version.version_number}`
                : `Version id #${row.programme_version_id}`}
            </span>
          </div>
        ),
      },
      {
        id: 'fee',
        header: 'Fee paid',
        cell: (row) => (
          <div className="cert-stack">
            <span>{formatCertificationFee(row.fee_amount_minor, row.fee_currency)}</span>
            {row.payment ? (
              <StatusBadge domain="certification" status={String(row.payment.status)} />
            ) : (
              <span className="cert-muted">No payment record</span>
            )}
          </div>
        ),
      },
      {
        id: 'enrolled',
        header: 'Enrolled',
        cell: (row) => (
          <span className="cert-muted">{formatCertificationTimestamp(row.enrolled_at)}</span>
        ),
      },
      {
        id: 'action',
        header: 'Actions',
        align: 'right',
        cell: (row) => (
          <Link className="cert-action-link" to={certificationLearnerPath(row.id)}>
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
        title="Certification learners"
        description="Read-only enrollment records with payment snapshot, assessment attempts, awards, and certificates."
        breadcrumbs={[{ label: 'Certification' }, { label: 'Learners' }]}
      />

      <Notice tone="info" title="Server-decided outcomes">
        Enrollments activate on confirmed payment, and passing is decided by scored attempts. This
        desk cannot enroll a learner, mark an attempt as passed, or issue an award.
      </Notice>

      <FilterBar aria-label="Certification learner filters">
        {canReadProgrammes ? (
          <SelectField
            id="cert-learners-programme"
            label="Programme"
            value={programmeId ? String(programmeId) : 'all'}
            onChange={(event) => setProgrammeFilter(event.target.value)}
          >
            <option value="all">All programmes</option>
            {(programmesQuery.data ?? []).map((programme) => (
              <option key={programme.id} value={String(programme.id)}>
                {programme.name}
              </option>
            ))}
          </SelectField>
        ) : (
          <TextField
            id="cert-learners-programme-id"
            label="Programme ID"
            type="number"
            min={1}
            value={programmeIdParam ?? ''}
            onChange={(event) => setProgrammeFilter(event.target.value)}
            hint="Programme names require the certification view permission."
          />
        )}
        <div className="cert-filters__actions">
          <Button
            onClick={() => {
              void listQuery.refetch()
            }}
            disabled={listQuery.isFetching}
          >
            {listQuery.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </FilterBar>

      {forbidden ? (
        <ForbiddenState />
      ) : listQuery.error ? (
        <ErrorState
          title="Unable to load enrollments"
          description={
            listQuery.error instanceof ApiClientError
              ? listQuery.error.message
              : 'The enrollment list could not be loaded.'
          }
          onRetry={() => {
            void listQuery.refetch()
          }}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={listQuery.data ?? []}
            getRowId={(row) => String(row.id)}
            isLoading={listQuery.isLoading}
            emptyTitle="No enrollments match this filter."
            emptyDescription="Learners appear here once an enrollment is activated by confirmed payment."
            caption="Certification enrollments"
          />
          {!listQuery.isLoading && (listQuery.data ?? []).length === 0 && programmeId ? (
            <div className="cert-actions">
              <Button variant="secondary" onClick={() => setProgrammeFilter('all')}>
                Reset filters
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
