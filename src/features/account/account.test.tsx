import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import { server } from '@/test/setup'

function renderAccount() {
  session.user = adminUser
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/account']}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Account change password', () => {
  it('renders the security form and keeps account identity and sign out', async () => {
    renderAccount()

    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Security' })).toBeInTheDocument()
    expect(screen.getByLabelText('Current password')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('New password')).toHaveAttribute('type', 'password')
    expect(screen.getByLabelText('Confirm new password')).toHaveAttribute('type', 'password')
    expect(screen.getAllByText(/At least 8 characters/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(adminUser.email).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Sign out' }).length).toBeGreaterThan(0)
  })

  it('validates confirmation before calling the API', async () => {
    let calls = 0
    server.use(
      http.post('/api/v1/auth/change-password', () => {
        calls += 1
        return HttpResponse.json({ success: true, data: { message: 'unused' } })
      }),
    )
    const user = userEvent.setup()
    renderAccount()

    await screen.findByRole('heading', { name: 'Security' })
    await user.type(screen.getByLabelText('Current password'), 'current-pass')
    await user.type(screen.getByLabelText('New password'), 'short')
    await user.type(screen.getByLabelText('Confirm new password'), 'other-password')
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    expect(calls).toBe(0)
  })

  it('rejects a new password that matches the current password before calling the API', async () => {
    let calls = 0
    server.use(
      http.post('/api/v1/auth/change-password', () => {
        calls += 1
        return HttpResponse.json({ success: true, data: { message: 'unused' } })
      }),
    )
    const user = userEvent.setup()
    renderAccount()

    await screen.findByRole('heading', { name: 'Security' })
    await user.type(screen.getByLabelText('Current password'), 'same-password')
    await user.type(screen.getByLabelText('New password'), 'same-password')
    await user.type(screen.getByLabelText('Confirm new password'), 'same-password')
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(
      await screen.findByText('The new password must be different from the current password.'),
    ).toBeInTheDocument()
    expect(calls).toBe(0)
  })

  it('submits the backend field names once and ignores a second click while saving', async () => {
    const bodies: unknown[] = []
    let release: (() => void) | undefined
    server.use(
      http.post('/api/v1/auth/change-password', async ({ request }) => {
        bodies.push(await request.json())
        await new Promise<void>((resolve) => {
          release = resolve
        })
        return HttpResponse.json({
          success: true,
          data: { message: 'Your password has been changed.' },
        })
      }),
    )
    const user = userEvent.setup()
    renderAccount()

    await screen.findByRole('heading', { name: 'Security' })
    await user.type(screen.getByLabelText('Current password'), 'current-password')
    await user.type(screen.getByLabelText('New password'), 'new-password-456')
    await user.type(screen.getByLabelText('Confirm new password'), 'new-password-456')
    await user.click(screen.getByRole('button', { name: 'Change password' }))
    const pending = await screen.findByRole('button', { name: 'Changing password…' })
    expect(pending).toBeDisabled()
    await user.click(pending)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      current_password: 'current-password',
      password: 'new-password-456',
      password_confirmation: 'new-password-456',
    })

    release?.()
    expect(await screen.findByRole('status')).toHaveTextContent('Your password has been changed.')
    expect(screen.getByLabelText('Current password')).toHaveValue('')
    expect(screen.getByLabelText('New password')).toHaveValue('')
    expect(screen.getByLabelText('Confirm new password')).toHaveValue('')
    expect(screen.getAllByRole('button', { name: 'Sign out' }).length).toBeGreaterThan(0)
  })

  it('shows an incorrect current password error', async () => {
    server.use(
      http.post('/api/v1/auth/change-password', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'validation_error',
              message: 'The given data was invalid.',
              details: { current_password: ['The password is incorrect.'] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderAccount()

    await screen.findByRole('heading', { name: 'Security' })
    await user.type(screen.getByLabelText('Current password'), 'wrong-password')
    await user.type(screen.getByLabelText('New password'), 'new-password-456')
    await user.type(screen.getByLabelText('Confirm new password'), 'new-password-456')
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByText('The given data was invalid.')).toBeInTheDocument()
    expect(screen.getByText('The password is incorrect.')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows backend validation errors for a short password', async () => {
    server.use(
      http.post('/api/v1/auth/change-password', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'validation_error',
              message: 'The given data was invalid.',
              details: { password: ['The password field must be at least 8 characters.'] },
            },
          },
          { status: 400 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderAccount()

    await screen.findByRole('heading', { name: 'Security' })
    await user.type(screen.getByLabelText('Current password'), 'current-password')
    await user.type(screen.getByLabelText('New password'), 'long-enough')
    await user.type(screen.getByLabelText('Confirm new password'), 'long-enough')
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(
      await screen.findByText('The password field must be at least 8 characters.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('returns an expired session to sign in', async () => {
    server.use(
      http.post('/api/v1/auth/change-password', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'unauthenticated', message: 'Authentication is required.' },
          },
          { status: 401 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderAccount()

    await screen.findByRole('heading', { name: 'Security' })
    await user.type(screen.getByLabelText('Current password'), 'current-password')
    await user.type(screen.getByLabelText('New password'), 'new-password-456')
    await user.type(screen.getByLabelText('Confirm new password'), 'new-password-456')
    await user.click(screen.getByRole('button', { name: 'Change password' }))

    expect(await screen.findByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument()
  })
})
