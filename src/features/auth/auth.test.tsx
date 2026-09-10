import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, businessUser, session } from '@/test/msw/handlers'
import { server } from '@/test/setup'

function renderApp(initialPath = '/attention') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

async function signInAs(email: string, password = 'DemoPass123!') {
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Administrator sign in' })
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
}

describe('authentication flows', () => {
  it('starts unauthenticated and redirects protected routes to login', async () => {
    renderApp('/campaigns')

    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }),
    ).toBeInTheDocument()
  })

  it('signs in an Admin and opens the shell', async () => {
    renderApp('/attention')

    await signInAs(adminUser.email)

    expect(await screen.findByRole('heading', { name: 'Attention' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin modules' })).toBeInTheDocument()
    expect(screen.getAllByText(adminUser.email).length).toBeGreaterThan(0)
  })

  it('restores an Admin session from /auth/me', async () => {
    session.user = adminUser
    renderApp('/account')

    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getAllByText(adminUser.email).length).toBeGreaterThan(0)
    expect(screen.getAllByText(adminUser.name).length).toBeGreaterThan(0)
  })

  it('blocks Business accounts from the Admin shell', async () => {
    renderApp('/attention')

    await signInAs(businessUser.email)

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Admin modules' })).not.toBeInTheDocument()
  })

  it('shows invalid credential errors', async () => {
    renderApp('/login')

    await signInAs(adminUser.email, 'wrong-password')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials.')
  })

  it('shows suspended account messaging', async () => {
    renderApp('/login')

    await signInAs('suspended@demo.marcaturshub.test')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This account is not permitted to access the platform.',
    )
  })

  it('handles rate limiting on login', async () => {
    renderApp('/login')

    await signInAs('rate@demo.marcaturshub.test')

    expect(await screen.findByRole('alert')).toHaveTextContent('Too many sign-in attempts')
  })

  it('logs out and returns to login', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/account')

    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Sign out' })[0]!)

    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }),
    ).toBeInTheDocument()
  })

  it('treats logout of an already-expired session as success', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/account')

    await screen.findByRole('heading', { name: 'Account' })

    server.use(
      http.post('/api/v1/auth/logout', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'unauthenticated', message: 'Unauthenticated.' },
          },
          { status: 401 },
        ),
      ),
    )

    await user.click(screen.getAllByRole('button', { name: 'Sign out' })[0]!)

    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }),
    ).toBeInTheDocument()
  })

  it('shows a retryable bootstrap error on network failure', async () => {
    server.use(http.get('/api/v1/auth/me', () => HttpResponse.error()))

    renderApp('/attention')

    expect(
      await screen.findByRole('heading', { name: 'Unable to verify session' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  })

  it('preserves the intended route after Admin login', async () => {
    renderApp('/disputes')

    await signInAs(adminUser.email)

    expect(await screen.findByRole('heading', { name: 'Disputes' })).toBeInTheDocument()
  })

  it('redirects authenticated Admins away from /login', async () => {
    session.user = adminUser
    renderApp('/login')

    await waitFor(async () => {
      expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    })
  })
})
