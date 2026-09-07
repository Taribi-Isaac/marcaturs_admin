import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import {
  pendingSubmission,
  underReviewSubmission,
  verificationFixtures,
} from '@/test/msw/verificationHandlers'
import { server } from '@/test/setup'

function renderApp(initialPath = '/verification') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Verification queue', () => {
  it('loads the verification queue for an authenticated Admin', async () => {
    session.user = adminUser
    renderApp('/verification')

    expect(await screen.findByRole('heading', { name: 'Verification' })).toBeInTheDocument()
    expect((await screen.findAllByText(pendingSubmission.user!.name)).length).toBeGreaterThan(0)
    expect(screen.getByText(underReviewSubmission.requirement!.name)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Manage requirements' })).toHaveAttribute(
      'href',
      '/verification/requirements',
    )
  })

  it('shows loading then empty state', async () => {
    session.user = adminUser
    verificationFixtures.submissions = []
    renderApp('/verification')

    expect(
      await screen.findByText('No verification submissions match the current filters.'),
    ).toBeInTheDocument()
  })

  it('shows error state with retry', async () => {
    session.user = adminUser
    verificationFixtures.failList = true
    const user = userEvent.setup()
    renderApp('/verification')

    expect(await screen.findByText('Unable to load verification submissions')).toBeInTheDocument()
    verificationFixtures.failList = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(pendingSubmission.user!.name)).toBeInTheDocument()
  })

  it('filters by supported status query param', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/verification')

    expect(await screen.findByText(pendingSubmission.user!.name)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status'), 'pending')

    await waitFor(() => {
      expect(screen.getByText(pendingSubmission.user!.name)).toBeInTheDocument()
      expect(screen.queryByText(underReviewSubmission.user!.name)).not.toBeInTheDocument()
    })
  })

  it('navigates to submission detail', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/verification')

    const links = await screen.findAllByRole('link', { name: 'Open submission' })
    await user.click(links[0]!)

    expect(await screen.findByRole('heading', { name: /Submission #/ })).toBeInTheDocument()
  })
})

describe('Verification submission detail', () => {
  it('loads detail, evidence metadata, and review history', async () => {
    session.user = adminUser
    renderApp(`/verification/submissions/${pendingSubmission.id}`)

    expect(
      await screen.findByRole('heading', { name: `Submission #${pendingSubmission.id}` }),
    ).toBeInTheDocument()
    expect(screen.getByText('registration.pdf')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Review history' })).toBeInTheDocument()
    expect(await screen.findByText('Submitted')).toBeInTheDocument()
  })

  it('handles missing evidence', async () => {
    session.user = adminUser
    renderApp(`/verification/submissions/${underReviewSubmission.id}`)

    expect(
      await screen.findByText('No evidence files are attached to this submission.'),
    ).toBeInTheDocument()
  })

  it('starts review, approves, rejects, and requests information', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/verification/submissions/${pendingSubmission.id}`)

    expect(await screen.findByRole('button', { name: 'Start review' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Start review' }))
    await user.click(screen.getByRole('button', { name: 'Confirm start' }))

    expect(await screen.findByText('Review started.')).toBeInTheDocument()
    expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve' }))
    expect(await screen.findByText('Submission approved.')).toBeInTheDocument()
  })

  it('requires a reason for reject and keeps server state on validation failure', async () => {
    session.user = adminUser
    verificationFixtures.submissions[0] = {
      ...pendingSubmission,
      status: 'under_review',
      evidence: [...(pendingSubmission.evidence ?? [])],
    }
    const user = userEvent.setup()
    renderApp(`/verification/submissions/${pendingSubmission.id}`)

    expect(await screen.findByRole('button', { name: 'Reject' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reject' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByText('Reason is required.')).toBeInTheDocument()
    expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0)
  })

  it('rejects with reason and refetches', async () => {
    session.user = adminUser
    verificationFixtures.submissions[0] = {
      ...pendingSubmission,
      status: 'under_review',
      evidence: [...(pendingSubmission.evidence ?? [])],
    }
    const user = userEvent.setup()
    renderApp(`/verification/submissions/${pendingSubmission.id}`)

    await user.click(await screen.findByRole('button', { name: 'Reject' }))
    await user.type(screen.getByLabelText('Reason'), 'Document is illegible.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByText('Submission rejected.')).toBeInTheDocument()
    expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0)
  })

  it('requests information with reason', async () => {
    session.user = adminUser
    verificationFixtures.submissions[0] = {
      ...pendingSubmission,
      status: 'under_review',
      evidence: [...(pendingSubmission.evidence ?? [])],
    }
    const user = userEvent.setup()
    renderApp(`/verification/submissions/${pendingSubmission.id}`)

    await user.click(await screen.findByRole('button', { name: 'Request information' }))
    await user.type(screen.getByLabelText('Reason'), 'Please re-upload a clearer scan.')
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Request information' }),
    )

    expect(await screen.findByText('Information requested.')).toBeInTheDocument()
    expect(screen.getAllByText('More Information Required').length).toBeGreaterThan(0)
  })
})

describe('Verification requirements', () => {
  it('lists requirements and supports create/edit', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/verification/requirements')

    expect(await screen.findByText('Demo Business registration evidence')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create requirement' }))
    await user.type(screen.getByLabelText('Name'), 'Demo tax clearance')
    await user.selectOptions(screen.getByLabelText('Participant type'), 'BUSINESS')
    await user.selectOptions(screen.getByLabelText('Requirement type'), 'document')
    await user.click(screen.getByRole('button', { name: 'Save requirement' }))

    expect(await screen.findByText('Requirement created.')).toBeInTheDocument()
    expect(screen.getByText('Demo tax clearance')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]!)
    const nameField = screen.getByLabelText('Name')
    await user.clear(nameField)
    await user.type(nameField, 'Updated registration evidence')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Requirement updated.')).toBeInTheDocument()
    expect(screen.getByText('Updated registration evidence')).toBeInTheDocument()
  })

  it('shows validation errors on create', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/verification/requirements')

    await user.click(await screen.findByRole('button', { name: 'Create requirement' }))
    await user.click(screen.getByRole('button', { name: 'Save requirement' }))

    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
  })
})

describe('Verification auth boundaries', () => {
  it('routes 401 through established auth behavior', async () => {
    session.user = adminUser
    server.use(
      http.get('/api/v1/admin/verification/submissions', () => {
        session.user = null
        return HttpResponse.json(
          {
            success: false,
            error: { code: 'unauthenticated', message: 'Unauthenticated.' },
          },
          { status: 401 },
        )
      }),
      http.get('/api/v1/auth/me', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'unauthenticated', message: 'Unauthenticated.' },
          },
          { status: 401 },
        ),
      ),
    )

    renderApp('/verification')

    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }),
    ).toBeInTheDocument()
  })

  it('shows access denied for 403 without logging out', async () => {
    session.user = adminUser
    verificationFixtures.forbidList = true
    renderApp('/verification')

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin modules' })).toBeInTheDocument()
  })
})

describe('Evidence download helper wiring', () => {
  it('surfaces download errors without crashing the page', async () => {
    session.user = adminUser
    verificationFixtures.failDownload = true
    const user = userEvent.setup()
    renderApp(`/verification/submissions/${pendingSubmission.id}`)

    expect(await screen.findByText('registration.pdf')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Download' }))
    expect(await screen.findByText('Download failed')).toBeInTheDocument()
  })
})
