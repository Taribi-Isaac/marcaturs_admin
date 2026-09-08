import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import { fetchAdminUser } from '@/features/users/api'
import { USER_QUERY_KEYS } from '@/features/users/constants'
import { UserActions } from '@/features/users/components/UserActions'
import {
  commissionAttentionLabel,
  formatOverallVerification,
  formatParticipantRole,
  formatUserTimestamp,
  participantPrimaryLabel,
} from '@/features/users/format'
import type { AmbassadorProfileDetail, BusinessProfileDetail } from '@/features/users/types'
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  NotFoundState,
  PageHeader,
  StatusBadge,
} from '@/shared/ui'

function isBusinessProfile(
  profile: BusinessProfileDetail | AmbassadorProfileDetail | null,
  role: string,
): profile is BusinessProfileDetail {
  return role === 'BUSINESS' && profile != null && 'legal_name' in profile
}

function isAmbassadorProfile(
  profile: BusinessProfileDetail | AmbassadorProfileDetail | null,
  role: string,
): profile is AmbassadorProfileDetail {
  return role === 'AMBASSADOR' && profile != null && 'display_name' in profile
}

export function UserDetailPage() {
  const { id } = useParams()
  const userId = Number(id)

  const detailQuery = useQuery({
    queryKey: USER_QUERY_KEYS.detail(userId),
    queryFn: ({ signal }) => fetchAdminUser(userId, signal),
    enabled: Number.isFinite(userId) && userId > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (!Number.isFinite(userId) || userId <= 0) {
    return (
      <NotFoundState
        title="Participant not found"
        description="The participant identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to="/users">
            Back to Users
          </Link>
        }
      />
    )
  }

  if (detailQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Participant"
          breadcrumbs={[{ label: 'Users', to: '/users' }, { label: 'Detail' }]}
        />
        <LoadingState label="Loading participant" rows={6} />
      </>
    )
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Participant not found"
        description="This participant does not exist, is not in the Users domain, or is no longer available."
        action={
          <Link className="ui-button ui-button--secondary" to="/users">
            Back to Users
          </Link>
        }
      />
    )
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <ErrorState
        title="Unable to load participant"
        description={
          detailQuery.error instanceof ApiClientError
            ? detailQuery.error.message
            : 'The participant could not be loaded.'
        }
        onRetry={() => {
          void detailQuery.refetch()
        }}
      />
    )
  }

  const user = detailQuery.data
  const title = participantPrimaryLabel(user)
  const businessProfile = isBusinessProfile(user.profile, user.role) ? user.profile : null
  const ambassadorProfile = isAmbassadorProfile(user.profile, user.role) ? user.profile : null

  return (
    <div className="users-page">
      <PageHeader
        title={title}
        description={`${formatParticipantRole(user.role)} · ${user.email}`}
        breadcrumbs={[{ label: 'Users', to: '/users' }, { label: `User #${user.id}` }]}
        actions={
          <div className="users-actions">
            <StatusBadge domain="account" status={user.status} />
            <Link className="ui-button ui-button--secondary" to="/users">
              Back to Users
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
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{formatParticipantRole(user.role)}</dd>
            </div>
            <div>
              <dt>Account status</dt>
              <dd>
                <StatusBadge domain="account" status={user.status} />
              </dd>
            </div>
            <div>
              <dt>Email verified</dt>
              <dd>
                {user.email_verified_at
                  ? formatUserTimestamp(user.email_verified_at)
                  : 'Not verified'}
              </dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>{formatUserTimestamp(user.last_login_at)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatUserTimestamp(user.created_at)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatUserTimestamp(user.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <UserActions user={user} />

        <section className="users-panel">
          <h2>Profile</h2>
          {businessProfile ? (
            <dl className="users-dl">
              <div>
                <dt>Legal name</dt>
                <dd>{businessProfile.legal_name}</dd>
              </div>
              <div>
                <dt>Trading name</dt>
                <dd>{businessProfile.trading_name || '—'}</dd>
              </div>
              <div className="users-dl__full">
                <dt>Description</dt>
                <dd>{businessProfile.description || '—'}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{businessProfile.category || '—'}</dd>
              </div>
              <div>
                <dt>Operating location</dt>
                <dd>{businessProfile.operating_location || '—'}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{businessProfile.address || '—'}</dd>
              </div>
              <div>
                <dt>Contact email</dt>
                <dd>{businessProfile.contact_email || '—'}</dd>
              </div>
              <div>
                <dt>Contact phone</dt>
                <dd>{businessProfile.contact_phone || '—'}</dd>
              </div>
              <div>
                <dt>Website</dt>
                <dd>{businessProfile.website || '—'}</dd>
              </div>
            </dl>
          ) : ambassadorProfile ? (
            <dl className="users-dl">
              <div>
                <dt>Display name</dt>
                <dd>{ambassadorProfile.display_name}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{ambassadorProfile.location || '—'}</dd>
              </div>
              <div className="users-dl__full">
                <dt>Profile description</dt>
                <dd>{ambassadorProfile.profile_description || '—'}</dd>
              </div>
              <div className="users-dl__full">
                <dt>Skills</dt>
                <dd>
                  {ambassadorProfile.skills.length > 0 ? ambassadorProfile.skills.join(', ') : '—'}
                </dd>
              </div>
              <div className="users-dl__full">
                <dt>Marketing interests</dt>
                <dd>
                  {ambassadorProfile.marketing_interests.length > 0
                    ? ambassadorProfile.marketing_interests.join(', ')
                    : '—'}
                </dd>
              </div>
              <div className="users-dl__full">
                <dt>Experience</dt>
                <dd>{ambassadorProfile.experience || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="users-muted">No profile has been created for this participant yet.</p>
          )}
        </section>

        <section className="users-panel">
          <h2>Verification</h2>
          <dl className="users-dl">
            <div>
              <dt>Overall status</dt>
              <dd>
                <StatusBadge
                  domain="verification_overall"
                  status={user.verification_status}
                  label={formatOverallVerification(user.verification_status)}
                />
              </dd>
            </div>
          </dl>
          <div className="users-inline-links">
            <Link className="users-action-link" to="/verification">
              Open Verification queue
            </Link>
          </div>
          {user.verification_submissions.length > 0 ? (
            <div className="users-submissions">
              <h3>Recent submissions</h3>
              <ul>
                {user.verification_submissions.map((submission) => (
                  <li key={submission.id}>
                    <Link
                      className="users-action-link"
                      to={`/verification/submissions/${submission.id}`}
                    >
                      Submission #{submission.id}
                    </Link>
                    <span className="users-muted">
                      {' '}
                      · requirement {submission.requirement_id} · {submission.status} · v
                      {submission.current_version}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="users-muted">No verification submissions available.</p>
          )}
        </section>

        <section className="users-panel users-panel--wide">
          <h2>Commercial relationship summary</h2>
          <dl className="users-dl">
            <div>
              <dt>Campaigns</dt>
              <dd>
                {user.counts.campaigns}
                {user.role === 'BUSINESS' && user.counts.campaigns > 0 ? (
                  <>
                    {' '}
                    <Link className="users-action-link" to="/campaigns?status=all">
                      View campaigns
                    </Link>
                  </>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>Deals</dt>
              <dd>{user.counts.deals}</dd>
            </div>
            <div>
              <dt>Open disputes</dt>
              <dd>
                {user.counts.open_disputes}
                {user.counts.open_disputes > 0 ? (
                  <>
                    {' '}
                    <Link className="users-action-link" to="/disputes?view=actionable">
                      View disputes
                    </Link>
                  </>
                ) : null}
              </dd>
            </div>
            <div>
              <dt>Commission attention</dt>
              <dd>{commissionAttentionLabel(user.counts)}</dd>
            </div>
            <div>
              <dt>Commissions due</dt>
              <dd>{user.counts.commissions_due}</dd>
            </div>
            <div>
              <dt>Commissions overdue</dt>
              <dd>{user.counts.commissions_overdue}</dd>
            </div>
          </dl>
          <p className="users-muted">
            Deal and commission detail desks are not available in this Admin phase. Counts are
            operational summaries only.
          </p>
          <div className="users-inline-links">
            <Link className="users-action-link" to="/moderation/reported-conversations">
              Open reported conversations
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
