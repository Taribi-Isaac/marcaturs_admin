import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, businessUser, session } from '@/test/msw/handlers'
import { server } from '@/test/setup'

type RecordedCall = {
  url: string
  method: string
  headers: Record<string, string>
  credentials: RequestCredentials | undefined
}

function recordFetches(): RecordedCall[] {
  const calls: RecordedCall[] = []
  const passthrough = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers: { ...((init?.headers as Record<string, string> | undefined) ?? {}) },
      credentials: init?.credentials,
    })
    return passthrough(input, init)
  })
  return calls
}

function isCall(call: RecordedCall, method: string, path: string): boolean {
  return call.method === method && new URL(call.url, window.location.origin).pathname === path
}

function hasAuthorizationHeader(call: RecordedCall): boolean {
  return Object.keys(call.headers).some((name) => name.toLowerCase() === 'authorization')
}

function browserStorageSnapshot(): string {
  return JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })
}

/** Storage keys written by the app, excluding MSW's own mocked-cookie store. */
function appStorageKeys(): string[] {
  return [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter(
    (key) => !key.startsWith('__msw'),
  )
}

function renderApp(initialPath: string) {
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

afterEach(() => {
  vi.restoreAllMocks()
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
  localStorage.clear()
  sessionStorage.clear()
})

describe('Admin session authentication contract', () => {
  it('signs in through the CSRF-protected cookie session without a bearer token', async () => {
    server.use(
      http.get(
        '/sanctum/csrf-cookie',
        () =>
          new HttpResponse(null, {
            status: 204,
            headers: { 'Set-Cookie': 'XSRF-TOKEN=admin-xsrf%3D; Path=/' },
          }),
      ),
    )
    const calls = recordFetches()
    renderApp('/attention')

    await signInAs(adminUser.email)

    expect(await screen.findByRole('heading', { name: 'Attention' })).toBeInTheDocument()

    const csrfIndex = calls.findIndex((call) => isCall(call, 'GET', '/sanctum/csrf-cookie'))
    const loginIndex = calls.findIndex((call) => isCall(call, 'POST', '/api/v1/auth/login'))
    expect(csrfIndex).toBeGreaterThanOrEqual(0)
    expect(loginIndex).toBeGreaterThan(csrfIndex)
    expect(calls[loginIndex]!.headers['X-XSRF-TOKEN']).toBe('admin-xsrf=')
    expect(calls.slice(loginIndex + 1).some((call) => isCall(call, 'GET', '/api/v1/auth/me'))).toBe(
      true,
    )

    expect(calls.every((call) => call.credentials === 'include')).toBe(true)
    expect(calls.some(hasAuthorizationHeader)).toBe(false)
    expect(appStorageKeys()).toEqual([])
  })

  it('ignores a token if one is ever returned to the browser', async () => {
    const calls = recordFetches()
    server.use(
      http.post('/api/v1/auth/login', () => {
        session.user = adminUser
        return HttpResponse.json({
          success: true,
          data: { user: adminUser, token: 'legacy-pat-value', token_type: 'Bearer' },
        })
      }),
    )
    renderApp('/attention')

    await signInAs(adminUser.email)

    expect(await screen.findByRole('heading', { name: 'Attention' })).toBeInTheDocument()
    expect(calls.some(hasAuthorizationHeader)).toBe(false)
    expect(JSON.stringify(calls)).not.toContain('legacy-pat-value')
    expect(browserStorageSnapshot()).not.toContain('legacy-pat-value')
  })

  it('trusts /auth/me over the login payload and signs non-Admin sessions out', async () => {
    const calls = recordFetches()
    server.use(
      http.post('/api/v1/auth/login', () => {
        session.user = businessUser
        return HttpResponse.json({ success: true, data: { user: adminUser } })
      }),
    )
    renderApp('/attention')

    await signInAs(adminUser.email)

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Admin modules' })).not.toBeInTheDocument()
    expect(calls.some((call) => isCall(call, 'POST', '/api/v1/auth/logout'))).toBe(true)
    expect(session.user).toBeNull()
  })

  it('restores an existing session from the cookie without re-submitting credentials', async () => {
    session.user = adminUser
    const calls = recordFetches()
    renderApp('/account')

    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(calls.some((call) => isCall(call, 'GET', '/api/v1/auth/me'))).toBe(true)
    expect(calls.some((call) => isCall(call, 'POST', '/api/v1/auth/login'))).toBe(false)
    expect(calls.some(hasAuthorizationHeader)).toBe(false)
  })

  it('returns an expired session to sign in and accepts a fresh sign in', async () => {
    session.user = adminUser
    let expired = true
    server.use(
      http.get('/api/v1/admin/overview', () => {
        if (!expired) {
          return undefined
        }
        expired = false
        session.user = null
        return HttpResponse.json(
          { success: false, error: { code: 'unauthenticated', message: 'Unauthenticated.' } },
          { status: 401 },
        )
      }),
    )
    renderApp('/overview')

    await signInAs(adminUser.email)

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin modules' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administrator sign in' })).not.toBeInTheDocument()
  })

  it('keeps the session when an Admin request is refused with 403', async () => {
    session.user = adminUser
    const calls = recordFetches()
    server.use(
      http.get('/api/v1/admin/overview', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'forbidden', message: 'You are not authorized to perform this action.' },
          },
          { status: 403 },
        ),
      ),
    )
    renderApp('/overview')

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administrator sign in' })).not.toBeInTheDocument()
    expect(calls.some((call) => isCall(call, 'POST', '/api/v1/auth/logout'))).toBe(false)
    expect(session.user).toEqual(adminUser)
  })

  it('does not sign in when the CSRF token is rejected with 419', async () => {
    const calls = recordFetches()
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'server_error', message: 'An unexpected error occurred.' },
          },
          { status: 419 },
        ),
      ),
    )
    renderApp('/login')

    await signInAs(adminUser.email)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('An unexpected error occurred.'),
    )
    expect(screen.getByRole('heading', { name: 'Administrator sign in' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Admin modules' })).not.toBeInTheDocument()
    const loginIndex = calls.findIndex((call) => isCall(call, 'POST', '/api/v1/auth/login'))
    expect(calls.slice(loginIndex + 1).some((call) => isCall(call, 'GET', '/api/v1/auth/me'))).toBe(
      false,
    )
  })
})
