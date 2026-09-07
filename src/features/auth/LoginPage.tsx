import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/useAuth'
import { ApiClientError } from '@/shared/api'
import { AuthBootstrapState } from '@/features/auth/AuthBootstrapState'
import { Button, Notice, TextField } from '@/shared/ui'

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LocationState = {
  from?: string
}

function resolvePostLoginPath(from: string | undefined): string {
  if (!from || from === '/login' || from === '/forbidden') {
    return '/attention'
  }
  return from
}

export function LoginPage() {
  const { status, login, isBootstrapping } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const formId = useId()
  const [formError, setFormError] = useState<string | null>(null)
  const from = (location.state as LocationState | null)?.from

  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  useEffect(() => {
    if (formError) {
      setFocus('email')
    }
  }, [formError, setFocus])

  useEffect(() => {
    if (status === 'authenticated_admin') {
      navigate(resolvePostLoginPath(from), { replace: true })
    }
  }, [status, from, navigate])

  if (isBootstrapping || status === 'unknown') {
    return <AuthBootstrapState />
  }

  if (status === 'authenticated_admin') {
    return <AuthBootstrapState />
  }

  if (status === 'authenticated_non_admin' || status === 'forbidden') {
    return <Navigate to="/forbidden" replace />
  }

  async function onSubmit(values: LoginFormValues) {
    setFormError(null)

    try {
      await login(values)
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (
          error.code === 'validation_error' &&
          error.details &&
          typeof error.details === 'object'
        ) {
          const details = error.details as Record<string, string[] | string>
          for (const [field, messages] of Object.entries(details)) {
            if (field === 'email' || field === 'password') {
              const message = Array.isArray(messages) ? messages[0] : messages
              if (message) {
                setError(field, { message })
              }
            }
          }
          setFormError(error.message || 'Check the highlighted fields.')
          return
        }

        if (error.status === 401) {
          setFormError('Invalid credentials.')
          return
        }

        if (error.status === 403) {
          setFormError(error.message || 'This account is not permitted to access the platform.')
          return
        }

        if (error.status === 429) {
          setFormError('Too many sign-in attempts. Wait a moment and try again.')
          return
        }

        if (error.code === 'network_error') {
          setFormError(
            'Unable to reach the authentication service. Check your connection and try again.',
          )
          return
        }

        setFormError(error.message || 'Sign in failed. Try again.')
        return
      }

      setFormError('Sign in failed. Try again.')
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen__panel">
        <div className="auth-screen__brand">
          <div className="auth-screen__brand-mark">MarcatursHub</div>
          <div className="auth-screen__brand-sub">Operations</div>
        </div>

        <header className="auth-screen__header">
          <h1 className="auth-screen__title">Administrator sign in</h1>
          <p className="auth-screen__lede">
            Sign in with an Admin account to access the operations console.
          </p>
        </header>

        {formError ? (
          <Notice tone="danger" title="Sign in unavailable">
            <span role="alert">{formError}</span>
          </Notice>
        ) : null}

        <form className="auth-screen__form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            id={`${formId}-email`}
            label="Email"
            type="email"
            autoComplete="username"
            inputMode="email"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            id={`${formId}-password`}
            label="Password"
            type="password"
            autoComplete="current-password"
            disabled={isSubmitting}
            error={errors.password?.message}
            {...register('password')}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="auth-screen__submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  )
}
