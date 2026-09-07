import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import {
  closedDispute,
  decisionPendingDispute,
  demoAttachment,
  disputeFixtures,
  evidenceRequestedDispute,
  resolvedDispute,
  submittedDispute,
  underReviewDispute,
} from '@/test/msw/disputeHandlers'
import { server } from '@/test/setup'

function renderApp(initialPath = '/disputes') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Dispute queue', () => {
  it('loads disputes and defaults to actionable view', async () => {
    session.user = adminUser
    renderApp('/disputes')

    expect(await screen.findByRole('heading', { name: 'Disputes' })).toBeInTheDocument()
    expect(await screen.findByText(submittedDispute.reference)).toBeInTheDocument()
    expect(screen.getByText(underReviewDispute.reference)).toBeInTheDocument()
    expect(screen.queryByText(closedDispute.reference)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Queue view')).toHaveValue('actionable')
    expect(screen.getAllByText('Needs Admin action').length).toBeGreaterThan(0)
  })

  it('distinguishes historical resolved/closed on page-local view', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/disputes')

    expect(await screen.findByText(submittedDispute.reference)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Queue view'), 'historical')

    await waitFor(() => {
      expect(screen.getByText(resolvedDispute.reference)).toBeInTheDocument()
      expect(screen.getByText(closedDispute.reference)).toBeInTheDocument()
      expect(screen.queryByText(submittedDispute.reference)).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('Resolved / closed').length).toBeGreaterThan(0)
  })

  it('paginates when more than one page exists', async () => {
    session.user = adminUser
    disputeFixtures.disputes = Array.from({ length: 21 }, (_, index) => ({
      ...submittedDispute,
      id: 2000 + index,
      reference: `MH-D-PAGE${index + 1}`,
      status: 'submitted' as const,
    }))
    const user = userEvent.setup()
    renderApp('/disputes?view=all')

    expect(await screen.findByText('MH-D-PAGE1')).toBeInTheDocument()
    expect(screen.queryByText('MH-D-PAGE21')).not.toBeInTheDocument()
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('MH-D-PAGE21')).toBeInTheDocument()
  })

  it('shows empty state for actionable view when page has none', async () => {
    session.user = adminUser
    disputeFixtures.disputes = [structuredClone(closedDispute)]
    renderApp('/disputes')

    expect(await screen.findByText('No disputes match this page view.')).toBeInTheDocument()
  })

  it('shows error state with retry', async () => {
    session.user = adminUser
    disputeFixtures.failList = true
    const user = userEvent.setup()
    renderApp('/disputes')

    expect(await screen.findByText('Unable to load disputes')).toBeInTheDocument()
    disputeFixtures.failList = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(submittedDispute.reference)).toBeInTheDocument()
  })

  it('shows access denied for 403 without logging out', async () => {
    session.user = adminUser
    disputeFixtures.forbidList = true
    renderApp('/disputes')

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin modules' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administrator sign in' })).not.toBeInTheDocument()
  })

  it('navigates to dispute detail', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/disputes')

    const link = (await screen.findAllByRole('link', { name: 'Open dispute' })).find(
      (item) => item.getAttribute('href') === `/disputes/${submittedDispute.id}`,
    )
    expect(link).toBeTruthy()
    await user.click(link!)
    expect(
      await screen.findByRole('heading', { name: submittedDispute.reference }),
    ).toBeInTheDocument()
  })
})

describe('Dispute detail workspace', () => {
  it('loads overview, deal context, evidence, and timeline', async () => {
    session.user = adminUser
    renderApp('/disputes/310')

    expect(await screen.findByRole('heading', { name: 'MH-D-DEMO0010' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Deal context' })).toBeInTheDocument()
    expect(screen.getByText('Solar reseller program')).toBeInTheDocument()
    expect(await screen.findByText(demoAttachment.original_filename!)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Case timeline' })).toBeInTheDocument()
    expect(screen.getByText(/Dispute Created/i)).toBeInTheDocument()
  })

  it('handles missing evidence honestly', async () => {
    session.user = adminUser
    renderApp(`/disputes/${submittedDispute.id}`)

    expect(
      await screen.findByText('No evidence attachments are on this dispute yet.'),
    ).toBeInTheDocument()
  })

  it('starts review from submitted', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/disputes/${submittedDispute.id}`)

    await user.click(await screen.findByRole('button', { name: 'Start review' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Start review' }),
    )

    expect(await screen.findByText('Review started.')).toBeInTheDocument()
    expect(screen.getAllByText('Under Review').length).toBeGreaterThan(0)
  })

  it('requests evidence with required reason', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/disputes/${underReviewDispute.id}`)

    await user.click(await screen.findByRole('button', { name: 'Request evidence' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Request evidence' }),
    )
    expect(await screen.findByText(/at least 3 characters/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Reason'), 'Please upload bank proof.')
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Request evidence' }),
    )
    expect(await screen.findByText('Evidence requested.')).toBeInTheDocument()
    expect(screen.getAllByText('Evidence Requested').length).toBeGreaterThan(0)
  })

  it('resumes review from evidence_requested', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/disputes/${evidenceRequestedDispute.id}`)

    await user.click(await screen.findByRole('button', { name: 'Resume review' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Resume review' }),
    )
    expect(await screen.findByText('Review resumed.')).toBeInTheDocument()
  })

  it('marks decision pending and resolves with notes', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/disputes/${underReviewDispute.id}`)

    await user.click(await screen.findByRole('button', { name: 'Mark decision pending' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Mark decision pending' }),
    )
    expect(await screen.findByText('Marked decision pending.')).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Resolve' }))
    await user.type(screen.getByLabelText('Decision notes'), 'Findings support ambassador claim.')
    await user.type(
      screen.getByLabelText('Administrative action notes'),
      'Record warning only; no financial mutation.',
    )
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Resolve' }))

    expect(
      await screen.findByText('Dispute resolved. No financial mutation was performed.'),
    ).toBeInTheDocument()
  })

  it('closes a resolved dispute', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/disputes/${resolvedDispute.id}`)

    await user.click(await screen.findByRole('button', { name: 'Close' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }))
    expect(await screen.findByText('Dispute closed.')).toBeInTheDocument()
    expect(screen.getAllByText('Closed').length).toBeGreaterThan(0)
  })

  it('surfaces backend validation errors', async () => {
    session.user = adminUser
    disputeFixtures.validationNextAction = true
    const user = userEvent.setup()
    renderApp(`/disputes/${underReviewDispute.id}`)

    await user.click(await screen.findByRole('button', { name: 'Request evidence' }))
    await user.type(screen.getByLabelText('Reason'), 'Enough characters')
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Request evidence' }),
    )
    expect(await screen.findByText('The reason field is required.')).toBeInTheDocument()
  })

  it('handles transition conflict without optimistic status change', async () => {
    session.user = adminUser
    disputeFixtures.conflictNextAction = true
    const user = userEvent.setup()
    renderApp(`/disputes/${submittedDispute.id}`)

    await user.click(await screen.findByRole('button', { name: 'Start review' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Start review' }),
    )

    expect(await screen.findByText(/cannot transition/i)).toBeInTheDocument()
    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0)
  })

  it('refreshes attention after successful mutation', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/disputes/${decisionPendingDispute.id}`)

    await user.click(await screen.findByRole('button', { name: 'Resolve' }))
    await user.type(screen.getByLabelText('Decision notes'), 'Findings support ambassador claim.')
    await user.type(
      screen.getByLabelText('Administrative action notes'),
      'Record warning only; no financial mutation.',
    )
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Resolve' }))
    expect(
      await screen.findByText('Dispute resolved. No financial mutation was performed.'),
    ).toBeInTheDocument()

    cleanup()
    renderApp('/attention')
    await waitFor(() => {
      expect(screen.queryByText(decisionPendingDispute.reference)).not.toBeInTheDocument()
    })
  })

  it('routes 401 through established auth handling', async () => {
    session.user = adminUser
    server.use(
      http.get('/api/v1/admin/disputes/:id', () => {
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

    renderApp(`/disputes/${submittedDispute.id}`)
    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }),
    ).toBeInTheDocument()
  })

  it('hides impossible actions for closed disputes', async () => {
    session.user = adminUser
    renderApp(`/disputes/${closedDispute.id}`)

    expect(
      await screen.findByText(/No Admin investigation actions are available for status/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Resolve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start review' })).not.toBeInTheDocument()
  })
})

describe('Decision pending resolve path', () => {
  it('requires decision and action notes', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/disputes/${decisionPendingDispute.id}`)

    await user.click(await screen.findByRole('button', { name: 'Resolve' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Resolve' }))
    expect(
      await screen.findByText(/Decision notes must be at least 3 characters/i),
    ).toBeInTheDocument()
  })
})
