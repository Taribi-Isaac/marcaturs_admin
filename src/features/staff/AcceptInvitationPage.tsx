import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiClientError } from '@/shared/api'
import { acceptStaffInvitation } from '@/features/staff/api'
import { formatFieldErrors } from '@/features/staff/format'
import { Button, Notice, TextField } from '@/shared/ui'

const acceptSchema = z
  .object({
    token: z.string().trim().min(32, 'Invitation token is required.').max(128),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    password_confirmation: z.string().min(1, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Passwords do not match.',
    path: ['password_confirmation'],
  })

type FormValues = z.infer<typeof acceptSchema>

export function AcceptInvitationPage() {
  const formId = useId()
  const [searchParams] = useSearchParams()
  const tokenFromQuery = searchParams.get('token')?.trim() ?? ''
  const [formError, setFormError] = useState<string | null>(null)
  const [acceptedEmail, setAcceptedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      token: tokenFromQuery,
      password: '',
      password_confirmation: '',
    },
  })

  useEffect(() => {
    if (tokenFromQuery) {
      setValue('token', tokenFromQuery)
    }
  }, [tokenFromQuery, setValue])

  async function onSubmit(values: FormValues) {
    setFormError(null)
    try {
      const user = await acceptStaffInvitation({
        token: values.token.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
      })
      setAcceptedEmail(user.email)
    } catch (error) {
      if (error instanceof ApiClientError) {
        const details = formatFieldErrors(error.details)
        for (const [field, message] of Object.entries(details)) {
          if (field === 'token' || field === 'password' || field === 'password_confirmation') {
            setError(field, { message })
          }
        }
        setFormError(error.message || 'Unable to accept invitation.')
        return
      }
      setFormError('Unable to accept invitation.')
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
          <h1 className="auth-screen__title">Accept staff invitation</h1>
          <p className="auth-screen__lede">Set a password to activate your Admin staff account.</p>
        </header>

        {acceptedEmail ? (
          <Notice tone="success" title="Invitation accepted">
            Your staff account for <strong>{acceptedEmail}</strong> is ready.{' '}
            <Link to="/login">Sign in</Link> to open the operations console.
          </Notice>
        ) : (
          <>
            {formError ? (
              <Notice tone="danger" title="Invitation unavailable">
                <span role="alert">{formError}</span>
              </Notice>
            ) : null}

            <form className="auth-screen__form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                id={`${formId}-token`}
                label="Invitation token"
                autoComplete="off"
                disabled={isSubmitting || Boolean(tokenFromQuery)}
                error={errors.token?.message}
                {...register('token')}
              />
              <TextField
                id={`${formId}-password`}
                label="Password"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={errors.password?.message}
                {...register('password')}
              />
              <TextField
                id={`${formId}-password-confirmation`}
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={errors.password_confirmation?.message}
                {...register('password_confirmation')}
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="auth-screen__submit"
              >
                {isSubmitting ? 'Accepting…' : 'Accept invitation'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
