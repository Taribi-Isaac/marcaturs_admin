import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { fetchAdminStaffMember } from '@/features/staff/api'
import { STAFF_QUERY_KEYS } from '@/features/staff/constants'
import { StaffActions } from '@/features/staff/components/StaffActions'
import {
  formatStaffEventAction,
  formatStaffRole,
  formatStaffTimestamp,
} from '@/features/staff/format'
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
  PageHeader,
  StatusBadge,
} from '@/shared/ui'

export function StaffDetailPage() {
  const { id } = useParams()
  const staffId = Number(id)

  const detailQuery = useQuery({
    queryKey: STAFF_QUERY_KEYS.detail(staffId),
    queryFn: ({ signal }) => fetchAdminStaffMember(staffId, signal),
    enabled: Number.isFinite(staffId) && staffId > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (!Number.isFinite(staffId) || staffId <= 0) {
    return (
      <NotFoundState
        title="Staff member not found"
        description="The staff identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to="/staff">
            Back to Staff
          </Link>
        }
      />
    )
  }

  if (detailQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Staff member"
          breadcrumbs={[{ label: 'Staff', to: '/staff' }, { label: 'Detail' }]}
        />
        <LoadingState label="Loading staff member" rows={6} />
      </>
    )
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Staff member not found"
        description="This staff account does not exist or is no longer available."
        action={
          <Link className="ui-button ui-button--secondary" to="/staff">
            Back to Staff
          </Link>
        }
      />
    )
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <ErrorState
        title="Unable to load staff member"
        description={
          detailQuery.error instanceof ApiClientError
            ? detailQuery.error.message
            : 'The staff member could not be loaded.'
        }
        onRetry={() => {
          void detailQuery.refetch()
        }}
      />
    )
  }

  const staff = detailQuery.data

  return (
    <div className="users-page">
      <PageHeader
        title={staff.name}
        description={`${formatStaffRole(staff.staff_role)} · ${staff.email}`}
        breadcrumbs={[{ label: 'Staff', to: '/staff' }, { label: `Staff #${staff.id}` }]}
        actions={
          <div className="users-actions">
            <StatusBadge domain="account" status={staff.status} />
            <Link className="ui-button ui-button--secondary" to="/staff">
              Back to Staff
            </Link>
          </div>
        }
      />

      <div className="users-detail-grid">
        <section className="users-panel">
          <h2>Identity</h2>
          <dl className="users-dl">
            <div>
              <dt>Name</dt>
              <dd>{staff.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{staff.email}</dd>
            </div>
            <div>
              <dt>Staff role</dt>
              <dd>{formatStaffRole(staff.staff_role)}</dd>
            </div>
            <div>
              <dt>Account status</dt>
              <dd>
                <StatusBadge domain="account" status={staff.status} />
              </dd>
            </div>
            <div>
              <dt>Email verified</dt>
              <dd>
                {staff.email_verified_at
                  ? formatStaffTimestamp(staff.email_verified_at)
                  : 'Not verified'}
              </dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>{formatStaffTimestamp(staff.last_login_at)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatStaffTimestamp(staff.created_at)}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>
                {staff.created_by ? `${staff.created_by.name} (${staff.created_by.email})` : '—'}
              </dd>
            </div>
          </dl>
        </section>

        <StaffActions staff={staff} />

        <section className="users-panel">
          <h2>Role permissions</h2>
          {staff.permissions.length > 0 ? (
            <ul className="account-panel__permissions">
              {staff.permissions.map((permission) => (
                <li key={permission}>
                  <span className="mono">{permission}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="users-muted">No permissions listed for this staff role.</p>
          )}
        </section>

        <section className="users-panel users-panel--wide">
          <h2>Events</h2>
          {staff.events.length > 0 ? (
            <div className="users-submissions">
              <ul>
                {staff.events.map((event) => (
                  <li key={event.id}>
                    <strong>{formatStaffEventAction(event.action)}</strong>
                    <span className="users-muted">
                      {' '}
                      · {formatStaffTimestamp(event.created_at)}
                      {event.actor ? ` · by ${event.actor.name}` : ''}
                      {event.previous_staff_role || event.new_staff_role
                        ? ` · ${formatStaffRole(event.previous_staff_role)} → ${formatStaffRole(event.new_staff_role)}`
                        : ''}
                      {event.reason ? ` · ${event.reason}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="users-muted">No staff events recorded yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
