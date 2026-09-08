import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import { dealFixtures, sealedDealDetail } from '@/test/msw/dealHandlers'

function renderApp(initialPath = '/deals') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Admin Deals list', () => {
  beforeEach(() => {
    session.user = adminUser
  })

  it('redirects unauthenticated visitors to login', async () => {
    session.user = null
    renderApp('/deals')
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('renders the Deal list for Admin', async () => {
    renderApp('/deals')

    expect(await screen.findByRole('heading', { name: 'Deals' })).toBeInTheDocument()
    expect(await screen.findByText('#60')).toBeInTheDocument()
    expect(screen.getAllByText('Solar Street Kit').length).toBeGreaterThan(0)
    expect(screen.getAllByText(sealedDealDetail.business!.email).length).toBeGreaterThan(0)
    expect(screen.queryByText('password')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirm payment/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel deal/i })).not.toBeInTheDocument()
  })

  it('filters by Deal status', async () => {
    const user = userEvent.setup()
    renderApp('/deals')

    await screen.findByText('#60')
    await user.selectOptions(screen.getByLabelText('Status'), 'payment_pending')

    expect(await screen.findByText('#55')).toBeInTheDocument()
    expect(screen.queryByText('#60')).not.toBeInTheDocument()
  })

  it('searches by product and updates URL state', async () => {
    const user = userEvent.setup()
    renderApp('/deals')

    await screen.findByText('#60')
    await user.type(screen.getByLabelText('Search'), 'Pending product')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    expect(await screen.findByText('#55')).toBeInTheDocument()
    expect(screen.queryByText('#60')).not.toBeInTheDocument()
  })

  it('filters open disputes', async () => {
    const user = userEvent.setup()
    renderApp('/deals')

    await screen.findByText('#60')
    await user.selectOptions(screen.getByLabelText('Open dispute'), '1')

    expect(await screen.findByText('#60')).toBeInTheDocument()
    expect(screen.queryByText('#55')).not.toBeInTheDocument()
  })

  it('filters commission overdue', async () => {
    const user = userEvent.setup()
    renderApp('/deals')

    await screen.findByText('#60')
    await user.selectOptions(screen.getByLabelText('Commission overdue'), '1')

    expect(await screen.findByText('#60')).toBeInTheDocument()
    expect(screen.queryByText('#50')).not.toBeInTheDocument()
  })

  it('filters commission status', async () => {
    const user = userEvent.setup()
    renderApp('/deals')

    await screen.findByText('#60')
    await user.selectOptions(screen.getByLabelText('Commission status'), 'paid')

    expect(await screen.findByText('#50')).toBeInTheDocument()
    expect(screen.queryByText('#60')).not.toBeInTheDocument()
  })

  it('paginates server results', async () => {
    dealFixtures.deals = Array.from({ length: 20 }, (_, index) => ({
      ...dealFixtures.deals[0]!,
      id: 200 + index,
      product_name: `Deal product ${index}`,
      open_dispute_count: 0,
      commission: null,
    }))
    const user = userEvent.setup()
    renderApp('/deals')

    expect(await screen.findByText('Showing 1–15 of 20')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Showing 16–20 of 20')).toBeInTheDocument()
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
  })

  it('shows empty state and allows reset', async () => {
    const user = userEvent.setup()
    renderApp('/deals?q=zzzz-no-match')

    expect(await screen.findByText('No Deals match these filters.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(await screen.findByText('#60')).toBeInTheDocument()
  })

  it('shows loading then list content', async () => {
    renderApp('/deals')
    expect(await screen.findByRole('heading', { name: 'Deals' })).toBeInTheDocument()
    expect(await screen.findByText('#60')).toBeInTheDocument()
  })

  it('shows error and retry for list failures', async () => {
    dealFixtures.failList = true
    const user = userEvent.setup()
    renderApp('/deals')

    expect(await screen.findByText('Unable to load Deals')).toBeInTheDocument()
    dealFixtures.failList = false
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('#60')).toBeInTheDocument()
  })

  it('shows sanctioned party status on the list', async () => {
    renderApp('/deals')
    expect(await screen.findByText('#60')).toBeInTheDocument()
    expect(screen.getAllByText('Suspended').length).toBeGreaterThan(0)
  })
})

describe('Admin Deals detail', () => {
  beforeEach(() => {
    session.user = adminUser
  })

  it('renders investigation sections', async () => {
    renderApp('/deals/60')

    expect(await screen.findByRole('heading', { name: 'Deal #60' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Business' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ambassador' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Campaign' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Campaign Version at Deal creation' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Deal Snapshot' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Payment confirmation' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Payment evidence' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Ambassador commission' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Disputes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Deal timeline' })).toBeInTheDocument()

    expect(screen.getByText(sealedDealDetail.business!.email)).toBeInTheDocument()
    expect(screen.getAllByText('Suspended').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Solar Street Kit').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Full kit sale').length).toBeGreaterThan(0)
    expect(screen.getByText('DSP-90')).toBeInTheDocument()
    expect(screen.getByText('Deal Sealed')).toBeInTheDocument()
    expect(screen.getByText(/not MarcatursHub platform revenue/i)).toBeInTheDocument()
  })

  it('does not render sensitive or mutation controls', async () => {
    renderApp('/deals/60')

    expect(await screen.findByRole('heading', { name: 'Deal #60' })).toBeInTheDocument()
    expect(screen.queryByText('password')).not.toBeInTheDocument()
    expect(screen.queryByText('payment_account_identifier')).not.toBeInTheDocument()
    expect(screen.queryByText('payment_instructions')).not.toBeInTheDocument()
    expect(screen.queryByText('payment_contact')).not.toBeInTheDocument()
    expect(screen.queryByText('storage_path')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirm payment/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /mark paid/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel deal/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /refund/i })).not.toBeInTheDocument()
  })

  it('links parties, campaign, and disputes', async () => {
    renderApp('/deals/60')

    expect(await screen.findByRole('link', { name: /open participant #111/i })).toHaveAttribute(
      'href',
      '/users/111',
    )
    expect(screen.getByRole('link', { name: /open campaign #20/i })).toHaveAttribute(
      'href',
      '/campaigns/20',
    )
    expect(screen.getByRole('link', { name: /open dispute/i })).toHaveAttribute(
      'href',
      '/disputes/90',
    )
  })

  it('shows download for file evidence and handles missing file', async () => {
    renderApp('/deals/60')

    expect(await screen.findByText(/receipt\.pdf/i)).toBeInTheDocument()
    const evidence = screen.getByRole('heading', { name: 'Payment evidence' }).closest('section')
    expect(evidence).toBeTruthy()
    expect(within(evidence!).getByRole('button', { name: 'Download' })).toBeInTheDocument()
    expect(within(evidence!).getByText('No file')).toBeInTheDocument()
  })

  it('handles evidence download errors', async () => {
    dealFixtures.failDownload = 404
    const user = userEvent.setup()
    renderApp('/deals/60')

    const evidence = (await screen.findByRole('heading', { name: 'Payment evidence' })).closest(
      'section',
    )
    await user.click(within(evidence!).getByRole('button', { name: 'Download' }))
    expect(await screen.findByText(/download failed/i)).toBeInTheDocument()
  })

  it('downloads evidence successfully', async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    renderApp('/deals/60')

    const evidence = (await screen.findByRole('heading', { name: 'Payment evidence' })).closest(
      'section',
    )
    await user.click(within(evidence!).getByRole('button', { name: 'Download' }))
    expect(clickSpy).toHaveBeenCalled()
    clickSpy.mockRestore()
  })

  it('shows not-found for missing Deals', async () => {
    dealFixtures.missingDetail = true
    renderApp('/deals/999999')
    expect(await screen.findByText('Deal not found')).toBeInTheDocument()
  })

  it('shows detail error with retry', async () => {
    dealFixtures.failDetail = true
    const user = userEvent.setup()
    renderApp('/deals/60')

    expect(await screen.findByText('Unable to load Deal')).toBeInTheDocument()
    dealFixtures.failDetail = false
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByRole('heading', { name: 'Deal #60' })).toBeInTheDocument()
  })
})
