import { Button, ErrorState, LoadingState } from '@/shared/ui'

type AuthBootstrapStateProps = {
  tone?: 'loading' | 'error'
  title?: string
  description?: string
  onRetry?: () => void
}

export function AuthBootstrapState({
  tone = 'loading',
  title,
  description,
  onRetry,
}: AuthBootstrapStateProps) {
  return (
    <div className="auth-screen">
      <div className="auth-screen__panel">
        <div className="auth-screen__brand">
          <div className="auth-screen__brand-mark">MarcatursHub</div>
          <div className="auth-screen__brand-sub">Operations</div>
        </div>
        {tone === 'loading' ? (
          <LoadingState label="Checking administrator session" rows={3} />
        ) : (
          <>
            <ErrorState
              title={title ?? 'Unable to verify session'}
              description={description ?? 'Try again in a moment.'}
            />
            {onRetry ? (
              <div className="auth-screen__actions">
                <Button variant="secondary" onClick={onRetry}>
                  Retry
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
