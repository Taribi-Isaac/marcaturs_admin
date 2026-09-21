import { PageHeader, Notice, Button, StatusBadge, Divider } from '@/shared/ui'
import { useAuth } from '@/features/auth/useAuth'
import { formatStatusLabel } from '@/shared/lib/status'

export function AccountPage() {
  const { user, logout } = useAuth()

  return (
    <>
      <PageHeader
        title="Account"
        description="Signed-in administrator identity for this operations session."
        breadcrumbs={[{ label: 'Account' }]}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              void logout()
            }}
          >
            Sign out
          </Button>
        }
      />

      {user ? (
        <div className="account-panel">
          <dl className="account-panel__list">
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
              <dd>
                <span className="mono">{user.role}</span>
              </dd>
            </div>
            {user.staff_role != null ? (
              <div>
                <dt>Staff role</dt>
                <dd>
                  <span className="mono">{user.staff_role}</span>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Account status</dt>
              <dd>
                <StatusBadge
                  domain="account"
                  status={user.status}
                  label={formatStatusLabel(user.status)}
                />
              </dd>
            </div>
            <div>
              <dt>Email verified</dt>
              <dd>
                {user.email_verified_at ? formatDate(user.email_verified_at) : 'Not verified'}
              </dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>{user.last_login_at ? formatDate(user.last_login_at) : '—'}</dd>
            </div>
            {user.permissions && user.permissions.length > 0 ? (
              <div>
                <dt>Permissions</dt>
                <dd>
                  <ul className="account-panel__permissions">
                    {user.permissions.map((permission) => (
                      <li key={permission}>
                        <span className="mono">{permission}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </dl>
          <Divider />
          <Notice tone="info" title="Session">
            Authentication uses the Laravel Sanctum session established against the MarcatursHub
            API. Password reset and email verification screens are not part of this Admin console
            yet.
          </Notice>
        </div>
      ) : (
        <Notice tone="warning" title="No session user">
          The authenticated user payload is unavailable. Sign out and sign in again.
        </Notice>
      )}
    </>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
