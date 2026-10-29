import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { ApiClientError, changePasswordRequest } from '@/shared/api'
import { Button, Notice, TextField } from '@/shared/ui'

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password.'),
    password: z.string().min(8, 'Use at least 8 characters.'),
    password_confirmation: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Passwords do not match.',
    path: ['password_confirmation'],
  })
  .refine((values) => values.password !== values.current_password, {
    message: 'The new password must be different from the current password.',
    path: ['password'],
  })

type FormValues = z.infer<typeof changePasswordSchema>

const emptyValues: FormValues = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

function fieldErrors(details: unknown): Record<string, string> {
  if (!details || typeof details !== 'object') {
    return {}
  }

  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      result[key] = value[0]
    } else if (typeof value === 'string') {
      result[key] = value
    }
  }
  return result
}

export function ChangePasswordForm() {
  const formId = useId()
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: emptyValues,
  })

  async function onSubmit(values: FormValues) {
    setFormError(null)
    setSuccessMessage(null)
    try {
      const result = await changePasswordRequest({
        current_password: values.current_password,
        password: values.password,
        password_confirmation: values.password_confirmation,
      })
      reset(emptyValues)
      setSuccessMessage(result.message)
    } catch (error) {
      if (error instanceof ApiClientError) {
        const details = fieldErrors(error.details)
        for (const field of ['current_password', 'password', 'password_confirmation'] as const) {
          const message = details[field]
          if (message) {
            setError(field, { message })
          }
        }
        setFormError(error.message || 'Unable to change the password.')
        return
      }
      setFormError('Unable to change the password.')
    }
  }

  return (
    <section className="account-security" aria-labelledby={`${formId}-title`}>
      <div>
        <h2 id={`${formId}-title`} className="account-security__title">
          Security
        </h2>
        <p className="account-security__lede">
          Change the password for this administrator account. Use at least 8 characters, and choose
          a password that is different from the current one.
        </p>
      </div>

      {successMessage ? (
        <Notice tone="success" title="Password changed">
          <span role="status">{successMessage}</span>
        </Notice>
      ) : null}
      {formError ? (
        <Notice tone="danger" title="Password not changed">
          <span role="alert">{formError}</span>
        </Notice>
      ) : null}

      <form className="account-security__form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          id={`${formId}-current-password`}
          label="Current password"
          type="password"
          autoComplete="current-password"
          disabled={isSubmitting}
          error={errors.current_password?.message}
          {...register('current_password')}
        />
        <TextField
          id={`${formId}-password`}
          label="New password"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          hint="At least 8 characters, and different from the current password."
          error={errors.password?.message}
          {...register('password')}
        />
        <TextField
          id={`${formId}-password-confirmation`}
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />
        <div className="account-security__actions">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Changing password…' : 'Change password'}
          </Button>
        </div>
      </form>
    </section>
  )
}
