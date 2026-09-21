import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, businessUser, session } from '@/test/msw/handlers'
import {
  overviewFixture,
  overviewZeroFixture,
  setOverviewFixture,
} from '@/test/msw/overviewHandlers'
import { server } from '@/test/setup'

function renderApp(initialPath = '/overview') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Admin Overview (MH-FE-016)', () => {
  it('lets an authenticated Admin load overview metrics from GET /admin/overview', async () => {
    session.user = adminUser
    renderApp('/overview')

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Priority attention' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Overdue commissions' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Participants' })).toBeInTheDocument()
    expect(screen.getByLabelText('Businesses registered: 12')).toBeInTheDocument()
    expect(screen.getByLabelText('Ambassadors registered: 20')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Campaigns' })).toBeInTheDocument()
    expect(screen.getByLabelText('Submitted: 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Active: 5')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Deals' })).toBeInTheDocument()
    expect(screen.getByLabelText('Payment pending: 4')).toBeInTheDocument()
    expect(screen.getByLabelText('Payment confirmed: 30')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Ambassador commission obligations' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Overdue: 2')).toBeInTheDocument()
    expect(screen.getByText(/2 commissions overdue/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Disputes' })).toBeInTheDocument()
    expect(screen.getByLabelText('Open disputes: 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Verification' })).toBeInTheDocument()
    expect(screen.getByLabelText('Awaiting review: 4')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Platform Payment Volume' })).toBeInTheDocument()
    expect(screen.getByText(/350000\.00 NGN/)).toBeInTheDocument()
    expect(screen.getAllByText('Campaign Extensions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Featured Campaigns').length).toBeGreaterThan(0)
    expect(
      screen.getByText(
        /Business to MarcatursHub for campaign extension and campaign featured only/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Business to Ambassador obligation not platform revenue/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Total company revenue/i)).not.toBeInTheDocument()
    expect(
      screen.getAllByText(/Business to Ambassador obligation not platform revenue/i).length,
    ).toBeGreaterThan(0)
  })

  it('redirects Admin root and post-login default toward Overview', async () => {
    session.user = adminUser
    renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/overview')
  })

  it('shows quiet zero states without urgent styling copy for empty attention', async () => {
    session.user = adminUser
    setOverviewFixture(overviewZeroFixture)
    renderApp('/overview')

    expect(
      await screen.findByRole('heading', { name: 'No overdue commissions' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No open disputes' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'No campaigns awaiting review' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'No verification awaiting review' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Review commissions/i })).not.toBeInTheDocument()
  })

  it('does not render false zeros while loading', async () => {
    session.user = adminUser
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })

    server.use(
      http.get('/api/v1/admin/overview', async () => {
        await gate
        return HttpResponse.json({ success: true, data: overviewFixture })
      }),
    )

    renderApp('/overview')

    expect(await screen.findByText('Loading operational overview')).toBeInTheDocument()
    expect(screen.queryByLabelText('Businesses registered: 0')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Open disputes: 0')).not.toBeInTheDocument()

    release()
    expect(await screen.findByLabelText('Businesses registered: 12')).toBeInTheDocument()
  })

  it('links attention and core metrics to existing Admin desks', async () => {
    session.user = adminUser
    renderApp('/overview')

    expect(await screen.findByRole('heading', { name: 'Priority attention' })).toBeInTheDocument()

    const attention = screen.getByRole('heading', { name: 'Priority attention' }).closest('section')
    expect(attention).not.toBeNull()
    expect(
      within(attention as HTMLElement).getByRole('link', { name: /Review commissions/i }),
    ).toHaveAttribute('href', '/deals?commission_overdue=1')
    expect(
      within(attention as HTMLElement).getByRole('link', { name: /Open disputes/i }),
    ).toHaveAttribute('href', '/disputes?view=actionable')
    expect(
      within(attention as HTMLElement).getByRole('link', { name: /Review campaigns/i }),
    ).toHaveAttribute('href', '/campaigns?status=submitted')
    expect(
      within(attention as HTMLElement).getByRole('link', { name: /Review verification/i }),
    ).toHaveAttribute('href', '/verification?status=pending')
    expect(screen.getByLabelText('Suspended: 1')).toHaveAttribute('href', '/users?status=suspended')
  })

  it('shows access denied for 403 without inventing zeros', async () => {
    session.user = adminUser
    server.use(
      http.get('/api/v1/admin/overview', () =>
        HttpResponse.json(
          { success: false, error: { code: 'forbidden', message: 'Forbidden.' } },
          { status: 403 },
        ),
      ),
    )
    renderApp('/overview')

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Businesses registered: 0')).not.toBeInTheDocument()
  })

  it('shows error with retry for 500', async () => {
    session.user = adminUser
    let fail = true
    server.use(
      http.get('/api/v1/admin/overview', () => {
        if (fail) {
          return HttpResponse.json(
            { success: false, error: { code: 'server_error', message: 'Boom.' } },
            { status: 500 },
          )
        }
        return HttpResponse.json({ success: true, data: overviewFixture })
      }),
    )
    const user = userEvent.setup()
    renderApp('/overview')

    expect(
      await screen.findByRole('heading', { name: 'Unable to load overview' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByLabelText('Businesses registered: 12')).toBeInTheDocument()
  })

  it('shows rate-limit messaging for 429', async () => {
    session.user = adminUser
    server.use(
      http.get('/api/v1/admin/overview', () =>
        HttpResponse.json(
          { success: false, error: { code: 'rate_limited', message: 'Slow down.' } },
          { status: 429 },
        ),
      ),
    )
    renderApp('/overview')

    expect(
      await screen.findByRole('heading', { name: 'Unable to load overview' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Too many requests/i)).toBeInTheDocument()
  })

  it('shows network failure messaging', async () => {
    session.user = adminUser
    server.use(http.get('/api/v1/admin/overview', () => HttpResponse.error()))
    renderApp('/overview')

    expect(
      await screen.findByRole('heading', { name: 'Unable to load overview' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Unable to reach the MarcatursHub API/i)).toBeInTheDocument()
  })

  it('handles 401 by clearing the session toward login', async () => {
    session.user = adminUser
    server.use(
      http.get('/api/v1/admin/overview', () => {
        session.user = null
        return HttpResponse.json(
          { success: false, error: { code: 'unauthenticated', message: 'Unauthenticated.' } },
          { status: 401 },
        )
      }),
    )
    renderApp('/overview')

    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('blocks Business accounts from overview', async () => {
    session.user = businessUser
    renderApp('/overview')

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Overview' })).not.toBeInTheDocument()
  })

  it('keeps Platform Payment Volume copy distinct from commission obligations', async () => {
    session.user = adminUser
    renderApp('/overview')

    expect(
      await screen.findByRole('heading', { name: 'Platform Payment Volume' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Ambassador commission obligations' }),
    ).toBeInTheDocument()

    const payments = screen
      .getByRole('heading', { name: 'Platform Payment Volume' })
      .closest('section')
    const commissions = screen
      .getByRole('heading', { name: 'Ambassador commission obligations' })
      .closest('section')

    expect(payments).not.toBeNull()
    expect(commissions).not.toBeNull()
    expect(
      within(payments as HTMLElement).getByText(/successful platform payment volume/i),
    ).toBeInTheDocument()
    expect(
      within(commissions as HTMLElement).getByText(
        /Business to Ambassador obligation not platform revenue/i,
      ),
    ).toBeInTheDocument()
    expect(within(payments as HTMLElement).queryByText(/Overdue/i)).not.toBeInTheDocument()
  })

  it('refreshes overview on demand', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/overview')

    expect(await screen.findByLabelText('Businesses registered: 12')).toBeInTheDocument()
    setOverviewFixture({
      ...overviewFixture,
      users: { ...overviewFixture.users, business_registered: 99 },
    })
    await user.click(screen.getByRole('button', { name: 'Refresh' }))
    await waitFor(() => {
      expect(screen.getByLabelText('Businesses registered: 99')).toBeInTheDocument()
    })
  })
})
