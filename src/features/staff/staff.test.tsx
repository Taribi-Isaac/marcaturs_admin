import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import {
  operationsStaff,
  staffFixtures,
  suspendedStaff,
  verificationStaff,
} from '@/test/msw/staffHandlers'
import type { AuthUser } from '@/shared/types/auth'

function renderApp(initialPath = '/staff') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

const verificationOnlyUser: AuthUser = {
  ...adminUser,
  id: 32,
  name: 'Verifier One',
  email: 'verifier.one@demo.marcaturshub.test',
  staff_role: 'VERIFICATION',
  permissions: ['overview.view', 'verification.view', 'verification.review'],
}

describe('Admin Staff list', () => {
  it('redirects unauthenticated visitors to login', async () => {
    session.user = null
    renderApp('/staff')
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the staff list for Super Admin', async () => {
    session.user = adminUser
    renderApp('/staff')

    expect(await screen.findByRole('heading', { name: 'Staff' })).toBeInTheDocument()
    expect(await screen.findByText(operationsStaff.email)).toBeInTheDocument()
    expect(screen.getByText(verificationStaff.email)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Staff' })).toBeInTheDocument()
  })

  it('filters by staff role', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/staff')

    await screen.findByText(operationsStaff.email)
    await user.selectOptions(screen.getByLabelText('Staff role'), 'VERIFICATION')

    expect(await screen.findByText(verificationStaff.email)).toBeInTheDocument()
    expect(screen.queryByText(operationsStaff.email)).not.toBeInTheDocument()
  })

  it('filters by account status', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/staff')

    await screen.findByText(operationsStaff.email)
    await user.selectOptions(screen.getByLabelText('Account status'), 'suspended')

    expect(await screen.findByText(suspendedStaff.email)).toBeInTheDocument()
    expect(screen.queryByText(operationsStaff.email)).not.toBeInTheDocument()
  })

  it('shows error and retry for list failures', async () => {
    session.user = adminUser
    staffFixtures.failList = true
    const user = userEvent.setup()
    renderApp('/staff')

    expect(await screen.findByText('Unable to load staff')).toBeInTheDocument()
    staffFixtures.failList = false
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText(operationsStaff.email)).toBeInTheDocument()
  })

  it('hides Staff nav and redirects when permission is missing', async () => {
    session.user = verificationOnlyUser
    renderApp('/staff')

    expect(await screen.findByRole('heading', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Staff' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Verification' })).toBeInTheDocument()
  })
})

describe('Admin Staff detail', () => {
  it('renders identity, role, events, and actions', async () => {
    session.user = adminUser
    renderApp(`/staff/${operationsStaff.id}`)

    expect(await screen.findByRole('heading', { name: operationsStaff.name })).toBeInTheDocument()
    expect(screen.getAllByText('Operations').length).toBeGreaterThan(0)
    expect(screen.getByText(/Invitation accepted/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Disable' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update role' })).toBeInTheDocument()
  })

  it('shows not-found for missing staff', async () => {
    session.user = adminUser
    staffFixtures.missingDetail = true
    renderApp('/staff/999999')

    expect(await screen.findByText('Staff member not found')).toBeInTheDocument()
  })

  it('disables staff with reason', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/staff/${operationsStaff.id}`)

    await user.click(await screen.findByRole('button', { name: 'Disable' }))
    await user.type(screen.getByLabelText('Reason'), 'Access no longer required.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Disable' }))

    expect(await screen.findByText('Staff account disabled.')).toBeInTheDocument()
  })

  it('restores suspended staff', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/staff/${suspendedStaff.id}`)

    await user.click(await screen.findByRole('button', { name: 'Restore' }))
    await user.type(screen.getByLabelText('Reason'), 'Access reinstated after review.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Restore' }))

    expect(await screen.findByText('Staff account restored.')).toBeInTheDocument()
  })

  it('confirms Super Admin promotion', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/staff/${operationsStaff.id}`)

    await screen.findByRole('heading', { name: operationsStaff.name })
    await user.selectOptions(screen.getByLabelText('Change staff role'), 'SUPER_ADMIN')
    await user.click(screen.getByRole('button', { name: 'Update role' }))

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText(/Promote to Super Admin/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Promote' }))

    expect(await screen.findByText(/Staff role updated to Super Admin/i)).toBeInTheDocument()
  })

  it('invites staff and shows debug token', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/staff')

    await user.click(await screen.findByRole('button', { name: 'Invite staff' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Name'), 'New Verifier')
    await user.type(within(dialog).getByLabelText('Email'), 'new.verifier@example.com')
    await user.selectOptions(within(dialog).getByLabelText('Staff role'), 'VERIFICATION')
    await user.click(within(dialog).getByRole('button', { name: 'Send invitation' }))

    expect(await screen.findByText(/debug token/i)).toBeInTheDocument()
  })
})

describe('Accept staff invitation', () => {
  it('accepts invitation from public route', async () => {
    session.user = null
    staffFixtures.invitations.push({
      id: 901,
      name: 'Invitee',
      email: 'invitee@example.com',
      staff_role: 'MODERATION',
      expires_at: '2026-09-15T10:00:00+00:00',
      accepted_at: null,
      revoked_at: null,
      created_at: '2026-09-12T10:00:00+00:00',
      invited_by_user_id: 1,
      debug_token: 'debug-invite-token-accept-abcdefghijklmnopqrstuvwxyz12',
    })
    const user = userEvent.setup()
    renderApp(
      '/staff/accept-invitation?token=debug-invite-token-accept-abcdefghijklmnopqrstuvwxyz12',
    )

    expect(
      await screen.findByRole('heading', { name: /Accept staff invitation/i }),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('Password'), 'Password123!')
    await user.type(screen.getByLabelText('Confirm password'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Accept invitation' }))

    expect(await screen.findByText(/Invitation accepted/i)).toBeInTheDocument()
    expect(screen.getByText(/invitee@example.com/)).toBeInTheDocument()
  })
})

describe('Account staff fields', () => {
  it('shows staff role and permissions on Account', async () => {
    session.user = adminUser
    renderApp('/account')

    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByText('SUPER_ADMIN')).toBeInTheDocument()
    expect(screen.getByText('staff.view')).toBeInTheDocument()
    expect(screen.getByText('overview.view')).toBeInTheDocument()
  })
})
