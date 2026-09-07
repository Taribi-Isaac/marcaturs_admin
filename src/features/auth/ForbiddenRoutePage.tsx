import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { Button, ForbiddenState } from '@/shared/ui'

export function ForbiddenRoutePage() {
  const { status, logout, bootstrapError } = useAuth()
  const navigate = useNavigate()

  const description =
    status === 'authenticated_non_admin'
      ? 'This console is limited to MarcatursHub administrators. Your account signed in successfully but does not have Admin access.'
      : bootstrapError ||
        'You do not have permission to use the Admin operations console with this account.'

  return (
    <div className="auth-screen">
      <div className="auth-screen__panel">
        <div className="auth-screen__brand">
          <div className="auth-screen__brand-mark">MarcatursHub</div>
          <div className="auth-screen__brand-sub">Operations</div>
        </div>
        <ForbiddenState description={description} />
        <div className="auth-screen__actions">
          <Button
            variant="secondary"
            onClick={() => {
              void logout().then(() => {
                navigate('/login', { replace: true })
              })
            }}
          >
            Return to sign in
          </Button>
        </div>
      </div>
    </div>
  )
}
