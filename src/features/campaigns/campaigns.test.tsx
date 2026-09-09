import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import {
  activeCampaign,
  approvedCampaign,
  campaignFixtures,
  closedCampaign,
  demoExtension,
  demoFeatured,
  demoResource,
  draftWithoutVersionCampaign,
  sparsePublishedCampaign,
  submittedCampaign,
} from '@/test/msw/campaignHandlers'
import { server } from '@/test/setup'

function renderApp(initialPath = '/campaigns') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Campaign moderation queue', () => {
  it('defaults to submitted campaigns', async () => {
    session.user = adminUser
    renderApp('/campaigns')

    expect(await screen.findByRole('heading', { name: 'Campaigns' })).toBeInTheDocument()
    expect(await screen.findByText(submittedCampaign.title)).toBeInTheDocument()
    expect(screen.queryByText(activeCampaign.title)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toHaveValue('submitted')
  })

  it('filters by status via server query param', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/campaigns')

    expect(await screen.findByText(submittedCampaign.title)).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Status'), 'active')

    await waitFor(() => {
      expect(screen.getByText(activeCampaign.title)).toBeInTheDocument()
      expect(screen.queryByText(submittedCampaign.title)).not.toBeInTheDocument()
    })
  })

  it('paginates when more than one page exists', async () => {
    session.user = adminUser
    campaignFixtures.campaigns = Array.from({ length: 16 }, (_, index) => ({
      ...submittedCampaign,
      id: 1000 + index,
      title: `Submitted campaign ${index + 1}`,
    }))
    const user = userEvent.setup()
    renderApp('/campaigns')

    expect(await screen.findByText('Submitted campaign 1')).toBeInTheDocument()
    expect(screen.queryByText('Submitted campaign 16')).not.toBeInTheDocument()
    expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Submitted campaign 16')).toBeInTheDocument()
  })

  it('shows empty state', async () => {
    session.user = adminUser
    campaignFixtures.campaigns = []
    renderApp('/campaigns')

    expect(await screen.findByText('No campaigns match the current filters.')).toBeInTheDocument()
  })

  it('shows error state with retry', async () => {
    session.user = adminUser
    campaignFixtures.failList = true
    const user = userEvent.setup()
    renderApp('/campaigns')

    expect(await screen.findByText('Unable to load campaigns')).toBeInTheDocument()
    campaignFixtures.failList = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(submittedCampaign.title)).toBeInTheDocument()
  })

  it('navigates to campaign detail', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/campaigns')

    expect(await screen.findByText(submittedCampaign.title)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Open campaign' }))
    expect(
      await screen.findByRole('heading', { name: submittedCampaign.title }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Current Campaign Version' })).toBeInTheDocument()
  })
})

describe('Campaign commercial terms (MH-FE-015)', () => {
  it('renders published commercial terms on active campaign detail', async () => {
    session.user = adminUser
    renderApp(`/campaigns/${activeCampaign.id}`)

    expect(await screen.findByRole('heading', { name: activeCampaign.title })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Current Campaign Version' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Product / Pricing' })).toBeInTheDocument()
    expect(screen.getByText('Solar street light installation kit')).toBeInTheDocument()
    expect(
      screen.getByText('Campus solar kit for municipal and school installs.'),
    ).toBeInTheDocument()
    expect(screen.getByText('250000.00 NGN')).toBeInTheDocument()
    expect(screen.getByText('Lagos and Ogun')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Commission' })).toBeInTheDocument()
    expect(screen.getByText('10.00%')).toBeInTheDocument()
    expect(screen.getByText('Payment Confirmation')).toBeInTheDocument()
    expect(screen.getByText('7 days')).toBeInTheDocument()
    expect(screen.getByText('Full kit sale completed')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Policies / Restrictions' })).toBeInTheDocument()
    expect(screen.getByText('No refund after installation begins')).toBeInTheDocument()
    expect(screen.getByText('Reliable solar lighting for campuses')).toBeInTheDocument()
    expect(screen.getByText('Guaranteed investment returns')).toBeInTheDocument()
    expect(screen.getByText('Use approved logo assets only')).toBeInTheDocument()
    expect(screen.getByText('Nigeria only')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Marketing / Terms' })).toBeInTheDocument()
    expect(screen.getByText('Light your campus safely with Ada Solar.')).toBeInTheDocument()
    expect(screen.getByText('https://adasolar.test/kit')).toBeInTheDocument()
    expect(screen.getByText('Standard partner terms apply.')).toBeInTheDocument()

    expect(screen.getByRole('heading', { name: 'Payment destination' })).toBeInTheDocument()
    expect(screen.getByText('Ada Solar Ops')).toBeInTheDocument()
    expect(screen.getByText('bank_transfer')).toBeInTheDocument()

    expect(
      screen.queryByText('Commercial terms not available on Admin show'),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/not a Deal Snapshot/i)).toBeInTheDocument()
  })

  it('does not render sensitive payment fields even if present on the payload', async () => {
    session.user = adminUser
    const poisoned = structuredClone(activeCampaign)
    Object.assign(poisoned.current_version!, {
      payment_account_identifier: 'SECRET-ACCT-999',
      payment_instructions: 'SECRET-INSTRUCTIONS',
      payment_contact: 'SECRET-CONTACT',
    })
    server.use(
      http.get(`/api/v1/admin/campaigns/${activeCampaign.id}`, () =>
        HttpResponse.json({ success: true as const, data: poisoned }),
      ),
    )

    renderApp(`/campaigns/${activeCampaign.id}`)

    expect(await screen.findByText('Ada Solar Ops')).toBeInTheDocument()
    expect(screen.queryByText('SECRET-ACCT-999')).not.toBeInTheDocument()
    expect(screen.queryByText('SECRET-INSTRUCTIONS')).not.toBeInTheDocument()
    expect(screen.queryByText('SECRET-CONTACT')).not.toBeInTheDocument()
    expect(screen.queryByText('payment_account_identifier')).not.toBeInTheDocument()
    expect(screen.queryByText('payment_instructions')).not.toBeInTheDocument()
    expect(screen.queryByText('payment_contact')).not.toBeInTheDocument()
  })

  it('shows accurate empty state when current version is not published', async () => {
    session.user = adminUser
    renderApp(`/campaigns/${submittedCampaign.id}`)

    expect(
      await screen.findByRole('heading', { name: 'Current Campaign Version' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Published commercial terms are not available for this version/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Product / Pricing' })).not.toBeInTheDocument()
    expect(
      screen.queryByText('Commercial terms not available on Admin show'),
    ).not.toBeInTheDocument()
  })

  it('shows accurate empty state when no current version is bound', async () => {
    session.user = adminUser
    renderApp(`/campaigns/${draftWithoutVersionCampaign.id}`)

    expect(
      await screen.findByRole('heading', { name: draftWithoutVersionCampaign.title }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/No current Campaign Version is attached to this campaign/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Product / Pricing' })).not.toBeInTheDocument()
  })

  it('renders sparse optional commercial fields without breaking', async () => {
    session.user = adminUser
    renderApp(`/campaigns/${sparsePublishedCampaign.id}`)

    expect(
      await screen.findByRole('heading', { name: sparsePublishedCampaign.title }),
    ).toBeInTheDocument()
    expect(screen.getByText('Sparse product')).toBeInTheDocument()
    expect(screen.getByText('5.00%')).toBeInTheDocument()
    expect(screen.getByText('Sparse Dest')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Product / Pricing' })).toBeInTheDocument()
  })
})

describe('Campaign detail workspace', () => {
  it('renders campaign details, resources, featured, and extension inspection', async () => {
    session.user = adminUser
    renderApp(`/campaigns/${activeCampaign.id}`)

    expect(await screen.findByRole('heading', { name: activeCampaign.title })).toBeInTheDocument()
    expect(screen.getByText(activeCampaign.user!.name)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Marketing resources' })).toBeInTheDocument()
    expect(
      await screen.findByText('No marketing resources are attached to this campaign.'),
    ).toBeInTheDocument()
    expect(await screen.findByText(demoFeatured.package_name)).toBeInTheDocument()
    expect(screen.getByText(demoFeatured.payment!.reference)).toBeInTheDocument()
    expect(screen.getByText('25000.00 NGN')).toBeInTheDocument()
  })

  it('renders extension history and submitted resources honestly', async () => {
    session.user = adminUser
    renderApp(`/campaigns/${closedCampaign.id}`)

    expect(await screen.findByRole('heading', { name: closedCampaign.title })).toBeInTheDocument()
    expect(await screen.findByText(demoExtension.payment!.reference)).toBeInTheDocument()
    expect(screen.getByText(/expired → active/i)).toBeInTheDocument()
  })

  it('shows marketing resource metadata for submitted campaigns', async () => {
    session.user = adminUser
    renderApp(`/campaigns/${submittedCampaign.id}`)

    expect(await screen.findByText(demoResource.title)).toBeInTheDocument()
    expect(screen.getByText(/partner-one-pager\.pdf/i)).toBeInTheDocument()
  })

  it('maps status badges and hides impossible actions for closed campaigns', async () => {
    session.user = adminUser
    renderApp(`/campaigns/${closedCampaign.id}`)

    expect((await screen.findAllByText('Closed')).length).toBeGreaterThan(0)
    expect(
      screen.getByText(/No Admin moderation actions are available for status/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Activate' })).not.toBeInTheDocument()
  })

  it('approves a submitted campaign and removes it from the submitted attention queue', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/campaigns/${submittedCampaign.id}`)

    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Approve' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve' }))

    expect(await screen.findByText('Campaign approved.')).toBeInTheDocument()
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0)

    cleanup()
    renderApp('/attention')
    expect(await screen.findByRole('heading', { name: /Campaign moderation/ })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText(submittedCampaign.title)).not.toBeInTheDocument()
    })
  })

  it('requires a reason for reject', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/campaigns/${submittedCampaign.id}`)

    await user.click(await screen.findByRole('button', { name: 'Reject' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByText('Reason is required.')).toBeInTheDocument()
    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0)
  })

  it('rejects with reason', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/campaigns/${submittedCampaign.id}`)

    await user.click(await screen.findByRole('button', { name: 'Reject' }))
    await user.type(screen.getByLabelText('Reason'), 'Claims need clarification.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByText('Campaign rejected and returned to draft.')).toBeInTheDocument()
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0)
  })

  it('handles 409 conflict without optimistic status change', async () => {
    session.user = adminUser
    campaignFixtures.conflictNextAction = true
    const user = userEvent.setup()
    renderApp(`/campaigns/${submittedCampaign.id}`)

    await user.click(await screen.findByRole('button', { name: 'Approve' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Approve' }))

    expect(
      await screen.findByText('Campaign status changed. Refresh and try again.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Submitted').length).toBeGreaterThan(0)
  })

  it('surfaces backend validation errors', async () => {
    session.user = adminUser
    campaignFixtures.validationNextAction = true
    const user = userEvent.setup()
    renderApp(`/campaigns/${submittedCampaign.id}`)

    await user.click(await screen.findByRole('button', { name: 'Reject' }))
    await user.type(screen.getByLabelText('Reason'), 'placeholder')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reject' }))

    expect(await screen.findByText('Reason is required.')).toBeInTheDocument()
  })

  it('activates an approved campaign', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/campaigns/${approvedCampaign.id}`)

    await user.click(await screen.findByRole('button', { name: 'Activate' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Activate' }))

    expect(await screen.findByText('Campaign activated.')).toBeInTheDocument()
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
  })

  it('suspends an active campaign with reason', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp(`/campaigns/${activeCampaign.id}`)

    await user.click(await screen.findByRole('button', { name: 'Suspend' }))
    await user.type(screen.getByLabelText('Reason'), 'Policy review required.')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Suspend' }))

    expect(await screen.findByText('Campaign suspended.')).toBeInTheDocument()
    expect(screen.getAllByText('Suspended').length).toBeGreaterThan(0)
  })
})
