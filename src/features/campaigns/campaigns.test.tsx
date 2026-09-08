import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  submittedCampaign,
} from '@/test/msw/campaignHandlers'

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

    await user.click(await screen.findByRole('link', { name: 'Open campaign' }))
    expect(
      await screen.findByRole('heading', { name: submittedCampaign.title }),
    ).toBeInTheDocument()
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
