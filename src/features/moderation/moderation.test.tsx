import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import {
  moderationFixtures,
  reportedConversationItem,
  reportedConversationMessages,
} from '@/test/msw/moderationHandlers'
import { server } from '@/test/setup'

function renderApp(initialPath: string) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Reported conversations queue', () => {
  it('loads and lists reported conversations', async () => {
    session.user = adminUser
    renderApp('/moderation/reported-conversations')

    expect(
      await screen.findByRole('heading', { name: 'Reported conversations' }),
    ).toBeInTheDocument()
    expect(await screen.findByText(`#${reportedConversationItem.id}`)).toBeInTheDocument()
    expect(screen.getByText(/Ada Solar Ventures Ltd/)).toBeInTheDocument()
    expect(screen.getByText(/Ada Nwosu/)).toBeInTheDocument()
    expect(screen.getAllByText('Reported').length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Inspect' })).toHaveAttribute(
      'href',
      `/moderation/reported-conversations/${reportedConversationItem.id}`,
    )
    expect(
      screen.queryByRole('button', { name: /Dismiss|Resolve|Suspend|Delete/i }),
    ).not.toBeInTheDocument()
  })

  it('shows loading then empty state honestly', async () => {
    session.user = adminUser
    moderationFixtures.conversations = []
    renderApp('/moderation/reported-conversations')

    expect(
      await screen.findByText('No reported conversations currently require moderation.'),
    ).toBeInTheDocument()
  })

  it('shows error with retry and does not pretend the queue is empty', async () => {
    session.user = adminUser
    moderationFixtures.failList = true
    const user = userEvent.setup()
    renderApp('/moderation/reported-conversations')

    expect(await screen.findByText('Unable to load reported conversations')).toBeInTheDocument()
    expect(
      screen.queryByText('No reported conversations currently require moderation.'),
    ).not.toBeInTheDocument()

    moderationFixtures.failList = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(`#${reportedConversationItem.id}`)).toBeInTheDocument()
  })

  it('shows access denied for 403 without logout', async () => {
    session.user = adminUser
    moderationFixtures.forbidList = true
    renderApp('/moderation/reported-conversations')

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin modules' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administrator sign in' })).not.toBeInTheDocument()
  })
})

describe('Reported conversation detail', () => {
  it('inspects report metadata and read-only message history', async () => {
    session.user = adminUser
    renderApp(`/moderation/reported-conversations/${reportedConversationItem.id}`)

    expect(
      await screen.findByRole('heading', { name: `Conversation #${reportedConversationItem.id}` }),
    ).toBeInTheDocument()
    expect(screen.getByText(reportedConversationItem.report_reason!)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Message history' })).toBeInTheDocument()
    expect(await screen.findByText(reportedConversationMessages[0]!.content)).toBeInTheDocument()
    expect(screen.getByText(reportedConversationMessages[1]!.content)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Send|Reply|Dismiss|Resolve/i }),
    ).not.toBeInTheDocument()
  })

  it('shows not found for missing reported conversations', async () => {
    session.user = adminUser
    renderApp('/moderation/reported-conversations/99999')

    expect(
      await screen.findByRole('heading', { name: 'Reported conversation not found' }),
    ).toBeInTheDocument()
  })
})

describe('Attention navigation to moderation', () => {
  it('links Attention reported rows into the detail route', async () => {
    session.user = adminUser
    renderApp('/attention')

    expect(await screen.findByText(`#${reportedConversationItem.id}`)).toBeInTheDocument()
    const section = screen
      .getByRole('heading', { name: /Reported conversations/ })
      .closest('section')
    expect(section).toBeTruthy()
    expect(
      within(section as HTMLElement).getByRole('link', { name: 'Open moderation' }),
    ).toHaveAttribute('href', `/moderation/reported-conversations/${reportedConversationItem.id}`)
  })
})

describe('Auth handling', () => {
  it('routes 401 through established auth handling', async () => {
    session.user = adminUser
    server.use(
      http.get('/api/v1/admin/conversations', () => {
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

    renderApp('/moderation/reported-conversations')
    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }),
    ).toBeInTheDocument()
  })
})
