import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { adminUser, session } from '@/test/msw/handlers'
import {
  configurationFixtures,
  demoCategory,
  demoDisputeCategory,
  demoExtensionPackage,
  demoFeaturedPackage,
  restrictedCategory,
} from '@/test/msw/configurationHandlers'
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

describe('Configuration navigation', () => {
  it('exposes all configuration routes', async () => {
    session.user = adminUser
    renderApp('/configuration/categories')

    expect(await screen.findByRole('heading', { name: 'Categories' })).toBeInTheDocument()
    const domainNav = screen.getByRole('navigation', { name: 'Configuration domains' })
    expect(within(domainNav).getByRole('link', { name: 'Extension packages' })).toHaveAttribute(
      'href',
      '/configuration/extension-packages',
    )
    expect(within(domainNav).getByRole('link', { name: 'Featured packages' })).toHaveAttribute(
      'href',
      '/configuration/featured-packages',
    )
    expect(within(domainNav).getByRole('link', { name: 'Dispute categories' })).toHaveAttribute(
      'href',
      '/configuration/dispute-categories',
    )
  })
})

describe('Categories configuration', () => {
  it('lists categories with listing status meaning', async () => {
    session.user = adminUser
    renderApp('/configuration/categories')

    expect(await screen.findByText(demoCategory.name)).toBeInTheDocument()
    expect(screen.getByText(restrictedCategory.name)).toBeInTheDocument()
    expect(
      screen.getByText(/Assignable, but may require additional verification/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Restricted')).toBeInTheDocument()
    expect(screen.getByText('Allowed')).toBeInTheDocument()
  })

  it('shows empty state', async () => {
    session.user = adminUser
    configurationFixtures.categories = []
    renderApp('/configuration/categories')
    expect(await screen.findByText('No categories configured.')).toBeInTheDocument()
  })

  it('shows error with retry', async () => {
    session.user = adminUser
    configurationFixtures.failCategories = true
    const user = userEvent.setup()
    renderApp('/configuration/categories')

    expect(await screen.findByText('Unable to load categories')).toBeInTheDocument()
    configurationFixtures.failCategories = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(demoCategory.name)).toBeInTheDocument()
  })

  it('creates and updates a category', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/configuration/categories')

    await user.click(await screen.findByRole('button', { name: 'Create category' }))
    await user.type(screen.getByLabelText('Name'), 'Demo Logistics Config')
    await user.selectOptions(screen.getByLabelText('Listing status'), 'allowed')
    await user.click(screen.getByRole('button', { name: 'Save category' }))

    expect(await screen.findByText('Category created.')).toBeInTheDocument()
    expect(screen.getByText('Demo Logistics Config')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]!)
    const nameField = screen.getByLabelText('Name')
    await user.clear(nameField)
    await user.type(nameField, 'Demo Technology Updated')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Category updated.')).toBeInTheDocument()
  })

  it('surfaces backend validation errors', async () => {
    session.user = adminUser
    configurationFixtures.validationNext = true
    const user = userEvent.setup()
    renderApp('/configuration/categories')

    await user.click(await screen.findByRole('button', { name: 'Create category' }))
    await user.type(screen.getByLabelText('Name'), 'Duplicate')
    await user.click(screen.getByRole('button', { name: 'Save category' }))
    expect(await screen.findByText('The name has already been taken.')).toBeInTheDocument()
  })

  it('handles conflict on update', async () => {
    session.user = adminUser
    configurationFixtures.conflictNext = true
    const user = userEvent.setup()
    renderApp('/configuration/categories')

    await user.click((await screen.findAllByRole('button', { name: 'Edit' }))[0]!)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText(/Category state changed/i)).toBeInTheDocument()
  })

  it('shows access denied for 403 without logout', async () => {
    session.user = adminUser
    configurationFixtures.forbidCategories = true
    renderApp('/configuration/categories')

    expect(await screen.findByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin modules' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Administrator sign in' })).not.toBeInTheDocument()
  })
})

describe('Extension packages configuration', () => {
  it('lists extension packages and creates one', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/configuration/extension-packages')

    expect(await screen.findByText(demoExtensionPackage.name)).toBeInTheDocument()
    expect(screen.getByText('15000.00 NGN')).toBeInTheDocument()
    expect(
      within(screen.getByText(demoExtensionPackage.name).closest('tr') as HTMLElement).getByText(
        'Active',
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create extension package' }))
    await user.type(screen.getByLabelText('Name'), 'Demo Extension 60 days')
    await user.clear(screen.getByLabelText('Duration (days)'))
    await user.type(screen.getByLabelText('Duration (days)'), '60')
    await user.clear(screen.getByLabelText('Price (major units)'))
    await user.type(screen.getByLabelText('Price (major units)'), '20000.00')
    await user.click(screen.getByRole('button', { name: 'Create package' }))

    expect(await screen.findByText('Package created.')).toBeInTheDocument()
    expect(screen.getByText('Demo Extension 60 days')).toBeInTheDocument()
  })

  it('updates an extension package and validates required fields', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/configuration/extension-packages')

    await user.click(await screen.findByRole('button', { name: 'Edit' }))
    const name = screen.getByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'Demo Extension Updated')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Package updated.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create extension package' }))
    await user.clear(screen.getByLabelText('Name'))
    await user.click(screen.getByRole('button', { name: 'Create package' }))
    expect(await screen.findByText('Name is required.')).toBeInTheDocument()
  })
})

describe('Featured packages configuration', () => {
  it('lists featured packages and updates active presentation', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/configuration/featured-packages')

    expect(await screen.findByText(demoFeaturedPackage.name)).toBeInTheDocument()
    expect(screen.getByText('25000.00 NGN')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create featured package' }))
    await user.type(screen.getByLabelText('Name'), 'Demo Featured 14 days')
    await user.clear(screen.getByLabelText('Duration (days)'))
    await user.type(screen.getByLabelText('Duration (days)'), '14')
    await user.clear(screen.getByLabelText('Price (major units)'))
    await user.type(screen.getByLabelText('Price (major units)'), '40000')
    await user.click(screen.getByRole('button', { name: 'Create package' }))
    expect(await screen.findByText('Package created.')).toBeInTheDocument()
  })
})

describe('Dispute categories configuration', () => {
  it('lists, creates, and updates dispute categories', async () => {
    session.user = adminUser
    const user = userEvent.setup()
    renderApp('/configuration/dispute-categories')

    expect(await screen.findByText(demoDisputeCategory.name)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create dispute category' }))
    await user.type(screen.getByLabelText('Name'), 'Demo terms changed')
    await user.type(screen.getByLabelText('Code (optional)'), 'demo_terms_changed')
    await user.click(screen.getByRole('button', { name: 'Save dispute category' }))
    expect(await screen.findByText('Dispute category created.')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]!)
    expect(screen.getByText(/Code cannot be changed after create/i)).toBeInTheDocument()
    const name = screen.getByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'Commission amount disputed (updated)')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('Dispute category updated.')).toBeInTheDocument()
  })

  it('rejects prohibited code updates from the backend', async () => {
    session.user = adminUser
    server.use(
      http.patch('/api/v1/admin/dispute-categories/:id', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'validation_error',
              message: 'The given data was invalid.',
              details: { code: ['The code field is prohibited.'] },
            },
          },
          { status: 422 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderApp('/configuration/dispute-categories')
    await user.click((await screen.findAllByRole('button', { name: 'Edit' }))[0]!)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(await screen.findByText('The code field is prohibited.')).toBeInTheDocument()
  })
})

describe('Configuration auth handling', () => {
  it('routes 401 through established auth handling', async () => {
    session.user = adminUser
    server.use(
      http.get('/api/v1/admin/categories', () => {
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

    renderApp('/configuration/categories')
    expect(
      await screen.findByRole('heading', { name: 'Administrator sign in' }),
    ).toBeInTheDocument()
  })
})

describe('Existing modules remain reachable', () => {
  it('keeps attention, verification, campaigns, and disputes routes intact', async () => {
    session.user = adminUser
    renderApp('/attention')
    expect(await screen.findByRole('heading', { name: 'Attention' })).toBeInTheDocument()

    renderApp('/verification')
    expect(await screen.findByRole('heading', { name: 'Verification' })).toBeInTheDocument()

    renderApp('/campaigns')
    expect(await screen.findByRole('heading', { name: 'Campaigns' })).toBeInTheDocument()

    renderApp('/disputes')
    expect(await screen.findByRole('heading', { name: 'Disputes' })).toBeInTheDocument()
  })
})
