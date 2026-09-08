import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, businessUser, session } from '@/test/msw/handlers'
import {
  activeAmbassadorUser,
  activeBusinessUser,
  bannedAmbassadorUser,
  restrictedAmbassadorUser,
  suspendedBusinessUser,
  userFixtures,
} from '@/test/msw/userHandlers'

function renderApp(initialPath = '/users') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Admin Users list', () => {
  it('redirects unauthenticated visitors to login', async () => {
    session.user = null
    renderApp('/users')
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the default participant list for Admin', async () => {
    session.user = adminUser
    renderApp('/users')

    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument()
    expect(await screen.findByText(activeBusinessUser.email)).toBeInTheDocument()
    expect(screen.getByText(activeAmbassadorUser.email)).toBeInTheDocument()
    expect(screen.queryByText('password')).not.toBeInTheDocument()
    expect(screen.queryByText('remember_token')).not.toBeInTheDocument()
  })

  it('filters by Business role', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/users')

    await screen.findByText(activeBusinessUser.email)
    await user.selectOptions(screen.getByLabelText('Role'), 'BUSINESS')

    expect(await screen.findByText(activeBusinessUser.email)).toBeInTheDocument()
    expect(screen.queryByText(activeAmbassadorUser.email)).not.toBeInTheDocument()
  })

  it('filters by Ambassador role', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/users')

    await screen.findByText(activeAmbassadorUser.email)
    await user.selectOptions(screen.getByLabelText('Role'), 'AMBASSADOR')

    expect(await screen.findByText(activeAmbassadorUser.email)).toBeInTheDocument()
    expect(screen.queryByText(activeBusinessUser.email)).not.toBeInTheDocument()
  })

  it('filters by account status', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/users')

    await screen.findByText(activeBusinessUser.email)
    await user.selectOptions(screen.getByLabelText('Account status'), 'banned')

    expect(await screen.findByText(bannedAmbassadorUser.email)).toBeInTheDocument()
    expect(screen.queryByText(activeBusinessUser.email)).not.toBeInTheDocument()
  })

  it('searches by trading name', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/users')

    await screen.findByText(activeBusinessUser.email)
    await user.type(screen.getByLabelText('Search'), 'Ada Solar')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByText(activeBusinessUser.email)).toBeInTheDocument()
    expect(screen.queryByText(activeAmbassadorUser.email)).not.toBeInTheDocument()
  })

  it('paginates server results', async () => {
    session.user = adminUser
    userFixtures.users = Array.from({ length: 20 }, (_, index) => ({
      ...activeBusinessUser,
      id: 200 + index,
      email: `biz.${index}@example.com`,
      name: `Biz ${index}`,
      profile_summary: {
        legal_name: `Biz ${index} Ltd`,
        trading_name: `Biz ${index}`,
      },
    }))
    const user = userEvent.setup()
    renderApp('/users')

    expect(await screen.findByText('Showing 1–15 of 20')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Showing 16–20 of 20')).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
  })

  it('shows empty state and allows reset', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/users?q=zzzz-no-match')

    expect(await screen.findByText('No participants match these filters.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(await screen.findByText(activeBusinessUser.email)).toBeInTheDocument()
  })

  it('shows error and retry for list failures', async () => {
    session.user = adminUser
    userFixtures.failList = true
    const user = userEvent.setup()
    renderApp('/users')

    expect(await screen.findByText('Unable to load participants')).toBeInTheDocument()
    userFixtures.failList = false
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText(activeBusinessUser.email)).toBeInTheDocument()
  })

  it('renders role and status badges', async () => {
    session.user = adminUser
    renderApp('/users')

    expect(await screen.findByText('Business')).toBeInTheDocument()
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    expect(screen.getByText('Restricted')).toBeInTheDocument()
  })
})

describe('Admin Users detail', () => {
  it('renders Business detail with profile and counts', async () => {
    session.user = adminUser
    renderApp(`/users/${activeBusinessUser.id}`)

    expect(await screen.findByRole('heading', { name: 'Ada Solar' })).toBeInTheDocument()
    expect(screen.getByText('Ada Solar Ventures Ltd')).toBeInTheDocument()
    expect(screen.getByText('Solar distribution partner.')).toBeInTheDocument()
    expect(screen.getByText('Open Verification queue')).toBeInTheDocument()
    expect(screen.getByText('Submission #501')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.queryByText('password')).not.toBeInTheDocument()
    expect(screen.queryByText('payment_account_identifier')).not.toBeInTheDocument()
  })

  it('renders Ambassador detail', async () => {
    session.user = adminUser
    renderApp(`/users/${activeAmbassadorUser.id}`)

    expect(await screen.findByRole('heading', { name: 'Ada Growth' })).toBeInTheDocument()
    expect(screen.getByText('Campus growth marketer.')).toBeInTheDocument()
    expect(screen.getByText('TikTok, WhatsApp')).toBeInTheDocument()
  })

  it('shows not-found for missing users', async () => {
    session.user = adminUser
    userFixtures.missingDetail = true
    renderApp('/users/999999')

    expect(await screen.findByText('Participant not found')).toBeInTheDocument()
  })

  it('shows detail error with retry', async () => {
    session.user = adminUser
    userFixtures.failDetail = true
    const user = userEvent.setup()
    renderApp(`/users/${activeBusinessUser.id}`)

    expect(await screen.findByText('Unable to load participant')).toBeInTheDocument()
    userFixtures.failDetail = false
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('heading', { name: 'Ada Solar' })).toBeInTheDocument()
  })
})

describe('Admin Users status actions', () => {
  it('shows Active actions only', async () => {
    session.user = adminUser
    renderApp(`/users/${activeBusinessUser.id}`)

    expect(await screen.findByRole('button', { name: 'Restrict' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Suspend' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ban' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restore' })).not.toBeInTheDocument()
  })

  it('shows Restricted actions', async () => {
    session.user = adminUser
    renderApp(`/users/${restrictedAmbassadorUser.id}`)

    expect(await screen.findByRole('button', { name: 'Restore' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Suspend' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ban' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restrict' })).not.toBeInTheDocument()
  })

  it('shows Suspended actions without Restrict', async () => {
    session.user = adminUser
    renderApp(`/users/${suspendedBusinessUser.id}`)

    expect(await screen.findByRole('button', { name: 'Restore' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ban' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restrict' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Suspend' })).not.toBeInTheDocument()
  })

  it('shows only Restore for Banned and explains restricted outcome', async () => {
    session.user = adminUser
    renderApp(`/users/${bannedAmbassadorUser.id}`)

    expect(await screen.findByRole('button', { name: 'Restore' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Restrict' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Suspend' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ban' })).not.toBeInTheDocument()
    expect(screen.getByText(/returns it to/i)).toBeInTheDocument()
  })

  it('requires reason and supports cancel in confirmation dialog', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/users/${activeBusinessUser.id}`)

    const trigger = await screen.findByRole('button', { name: 'Restrict' })
    await user.click(trigger)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Ada Solar/)).toBeInTheDocument()
    expect(within(dialog).getByText(/Resulting status/i)).toBeInTheDocument()
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.click(within(dialog).getByRole('button', { name: 'Restrict' }))
    expect(await within(dialog).findByText(/at least 3 characters/i)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('traps focus and closes on Escape', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/users/${activeBusinessUser.id}`)

    const trigger = await screen.findByRole('button', { name: 'Suspend' })
    await user.click(trigger)
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByLabelText('Reason')).toHaveFocus()

    await user.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('restricts successfully', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/users/${activeBusinessUser.id}`)

    await user.click(await screen.findByRole('button', { name: 'Restrict' }))
    await user.type(screen.getByLabelText('Reason'), 'Incomplete verification follow-up.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Restrict' }))

    expect(await screen.findByText('Account restricted.')).toBeInTheDocument()
    expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0)
  })

  it('suspends successfully', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/users/${activeAmbassadorUser.id}`)

    await user.click(await screen.findByRole('button', { name: 'Suspend' }))
    await user.type(screen.getByLabelText('Reason'), 'Temporary suspension pending review.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Suspend' }))

    expect(await screen.findByText('Account suspended.')).toBeInTheDocument()
  })

  it('bans successfully', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/users/${activeBusinessUser.id}`)

    await user.click(await screen.findByRole('button', { name: 'Ban' }))
    await user.type(screen.getByLabelText('Reason'), 'Serious policy violation.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ban' }))

    expect(await screen.findByText('Account banned.')).toBeInTheDocument()
  })

  it('restores banned account to Restricted', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/users/${bannedAmbassadorUser.id}`)

    await user.click(await screen.findByRole('button', { name: 'Restore' }))
    expect(
      await screen.findByText(/Restoring a banned account places it in Restricted status/i),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Reason'), 'Ban lifted after appeal.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Restore' }))

    expect(await screen.findByText('Ban lifted. Account is now Restricted.')).toBeInTheDocument()
    expect(screen.getAllByText('Restricted').length).toBeGreaterThan(0)
  })

  it('handles stale 422 by keeping dialog open messaging and refetching', async () => {
    session.user = adminUser
    userFixtures.staleTransitionAction = true
    const user = userEvent.setup()
    renderApp(`/users/${activeBusinessUser.id}`)

    await user.click(await screen.findByRole('button', { name: 'Restrict' }))
    await user.type(screen.getByLabelText('Reason'), 'Stale attempt reason.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Restrict' }))

    expect(await screen.findByText(/may have changed in another session/i)).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('surfaces 403, 404, 429, and 500 mutation failures', async () => {
    session.user = adminUser
    const user = userEvent.setup()

    userFixtures.forbiddenAction = true
    renderApp(`/users/${activeBusinessUser.id}`)
    await user.click(await screen.findByRole('button', { name: 'Restrict' }))
    await user.type(screen.getByLabelText('Reason'), 'Forbidden attempt reason.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Restrict' }))
    expect(await screen.findByText(/not authorized/i)).toBeInTheDocument()

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    userFixtures.forbiddenAction = false
    userFixtures.notFoundAction = true
    await user.click(screen.getByRole('button', { name: 'Suspend' }))
    await user.type(screen.getByLabelText('Reason'), 'Missing target reason.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Suspend' }))
    expect(await screen.findByText(/not found/i)).toBeInTheDocument()

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    userFixtures.notFoundAction = false
    userFixtures.rateLimitedAction = true
    await user.click(screen.getByRole('button', { name: 'Ban' }))
    await user.type(screen.getByLabelText('Reason'), 'Rate limited reason text.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Ban' }))
    expect(await screen.findByText(/too many requests/i)).toBeInTheDocument()

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    userFixtures.rateLimitedAction = false
    userFixtures.serverErrorAction = true
    await user.click(screen.getByRole('button', { name: 'Restrict' }))
    await user.type(screen.getByLabelText('Reason'), 'Server failure reason.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Restrict' }))
    expect(await screen.findByText(/unexpected server failure/i)).toBeInTheDocument()
  })

  it('blocks non-admin access through AuthGate', async () => {
    session.user = businessUser
    renderApp('/users')
    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
  })
})
