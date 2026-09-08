import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import { activeCampaign } from '@/test/msw/campaignHandlers'
import { submittedDispute } from '@/test/msw/disputeHandlers'

function renderApp(initialPath: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Shell navigation active state', () => {
  it('keeps Campaigns active on campaign detail routes', async () => {
    session.user = adminUser
    renderApp(`/campaigns/${activeCampaign.id}`)

    expect(await screen.findByRole('heading', { name: activeCampaign.title })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Admin modules' })
    expect(within(nav).getByRole('link', { name: 'Campaigns' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('keeps Disputes active on dispute detail routes', async () => {
    session.user = adminUser
    renderApp(`/disputes/${submittedDispute.id}`)

    expect(
      await screen.findByRole('heading', { name: submittedDispute.reference }),
    ).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Admin modules' })
    expect(within(nav).getByRole('link', { name: 'Disputes' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
