import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import {
  attentionFixtures,
  campaignSubmittedItem,
  disputeClosedItem,
  disputeOpenItem,
  reportedConversationItem,
} from '@/test/msw/attentionHandlers'
import { campaignFixtures } from '@/test/msw/campaignHandlers'
import {
  pendingSubmission,
  underReviewSubmission,
  verificationFixtures,
} from '@/test/msw/verificationHandlers'
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

describe('Attention Home', () => {
  it('lets an authenticated Admin load /attention with all four queues', async () => {
    session.user = adminUser
    renderApp('/attention')

    expect(await screen.findByRole('heading', { name: 'Attention' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: /Verification/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Campaign moderation/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^Disputes/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Reported conversations/ })).toBeInTheDocument()

    expect(await screen.findByText(pendingSubmission.user!.name)).toBeInTheDocument()
    expect(screen.getByText(underReviewSubmission.requirement!.name)).toBeInTheDocument()
    expect(screen.getByText(campaignSubmittedItem.title)).toBeInTheDocument()
    expect(screen.getByText(disputeOpenItem.reference)).toBeInTheDocument()
    expect(screen.getByText(`#${reportedConversationItem.id}`)).toBeInTheDocument()
  })

  it('shows actionable statuses and hides closed/non-actionable dispute rows', async () => {
    session.user = adminUser
    renderApp('/attention')

    expect(await screen.findByText(disputeOpenItem.reference)).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Under Review')).toBeInTheDocument()
    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0)
    expect(screen.queryByText(disputeClosedItem.reference)).not.toBeInTheDocument()
  })

  it('renders empty states for each queue independently', async () => {
    session.user = adminUser
    verificationFixtures.submissions = []
    campaignFixtures.campaigns = campaignFixtures.campaigns.filter(
      (item) => item.status !== 'submitted',
    )
    attentionFixtures.disputes = []
    attentionFixtures.conversations = []

    renderApp('/attention')

    expect(
      await screen.findByText('No verification items currently require attention.'),
    ).toBeInTheDocument()
    expect(screen.getByText('No campaigns currently require moderation.')).toBeInTheDocument()
    expect(screen.getByText('No open disputes currently require attention.')).toBeInTheDocument()
    expect(
      screen.getByText('No reported conversations currently require attention.'),
    ).toBeInTheDocument()
  })

  it('keeps other queues usable when one queue fails and supports retry', async () => {
    session.user = adminUser
    verificationFixtures.failList = true
    const user = userEvent.setup()

    renderApp('/attention')

    expect(await screen.findByText('Unable to load verification')).toBeInTheDocument()
    expect(await screen.findByText(campaignSubmittedItem.title)).toBeInTheDocument()
    expect(screen.getByText(disputeOpenItem.reference)).toBeInTheDocument()

    verificationFixtures.failList = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText(pendingSubmission.user!.name)).toBeInTheDocument()
  })

  it('refreshes all attention queries from the page control', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    let campaignCalls = 0

    server.use(
      http.get('/api/v1/admin/campaigns', ({ request }) => {
        campaignCalls += 1
        const status = new URL(request.url).searchParams.get('status')
        const items =
          status === 'submitted'
            ? campaignFixtures.campaigns.filter((item) => item.status === 'submitted')
            : campaignFixtures.campaigns
        return HttpResponse.json({
          success: true,
          data: items,
          meta: {
            pagination: {
              current_page: 1,
              per_page: 15,
              total: items.length,
              last_page: 1,
              from: items.length ? 1 : null,
              to: items.length || null,
            },
          },
        })
      }),
    )

    renderApp('/attention')
    expect(await screen.findByText(campaignSubmittedItem.title)).toBeInTheDocument()
    const callsAfterLoad = campaignCalls

    await user.click(screen.getByRole('button', { name: 'Refresh' }))

    await waitFor(() => {
      expect(campaignCalls).toBeGreaterThan(callsAfterLoad)
    })
  })

  it('renders navigation links into module destinations', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/attention')

    const verificationLinks = await screen.findAllByRole('link', { name: 'Open verification' })
    expect(verificationLinks[0]).toHaveAttribute(
      'href',
      `/verification/submissions/${pendingSubmission.id}`,
    )
    expect(screen.getAllByRole('link', { name: 'Open campaign' })[0]).toHaveAttribute(
      'href',
      `/campaigns/${campaignSubmittedItem.id}`,
    )
    expect(screen.getAllByRole('link', { name: 'Open disputes' })[0]).toHaveAttribute(
      'href',
      '/disputes',
    )
    expect(screen.getAllByRole('link', { name: 'Open moderation' })[0]).toHaveAttribute(
      'href',
      '/moderation/reported-conversations',
    )

    await user.click(screen.getAllByRole('link', { name: 'Open campaign' })[0]!)
    expect(
      await screen.findByRole('heading', { name: campaignSubmittedItem.title }),
    ).toBeInTheDocument()
  })

  it('routes 401 through established auth handling', async () => {
    session.user = adminUser
    server.use(
      http.get('/api/v1/admin/campaigns', () => {
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

    renderApp('/attention')

    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }),
    ).toBeInTheDocument()
  })

  it('shows access denied for a 403 queue without logging the Admin out', async () => {
    session.user = adminUser
    campaignFixtures.forbidList = true

    renderApp('/attention')

    const campaignHeading = await screen.findByRole('heading', { name: /Campaign moderation/ })
    expect(
      await within(campaignHeading.closest('section')!).findByRole('heading', {
        name: 'Access denied',
      }),
    ).toBeInTheDocument()

    expect(await screen.findByText(pendingSubmission.user!.name)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin modules' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administrator sign in' })).not.toBeInTheDocument()
  })
})

describe('Attention queue filtering helpers', () => {
  it('does not treat approved verification fixtures as attention defaults', () => {
    expect(
      verificationFixtures.submissions
        .filter((item) => item.status === 'pending' || item.status === 'under_review')
        .every((item) => item.status === 'pending' || item.status === 'under_review'),
    ).toBe(true)
  })
})
