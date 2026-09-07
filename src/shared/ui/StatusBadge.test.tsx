import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppRouter } from '@/app/router/AppRouter'
import { StatusBadge } from '@/shared/ui'
import { formatStatusLabel, resolveStatusTone } from '@/shared/lib/status'
import { mapHttpStatusToCode } from '@/shared/api'

function renderApp(initialPath = '/attention') {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRouter />
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('App shell and routing', () => {
  it('renders the Attention placeholder inside the Admin shell', () => {
    renderApp('/attention')

    expect(screen.getByRole('heading', { name: 'Attention' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin modules' })).toBeInTheDocument()
    expect(screen.getByText(/is not implemented yet/i)).toBeInTheDocument()
  })

  it('renders Verification requirements placeholder route', () => {
    renderApp('/verification/requirements')

    expect(screen.getByRole('heading', { name: 'Verification requirements' })).toBeInTheDocument()
  })

  it('renders not-found for unknown routes', () => {
    renderApp('/does-not-exist')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})

describe('StatusBadge / status helpers', () => {
  it('maps backend campaign statuses without inventing labels', () => {
    expect(resolveStatusTone('campaign', 'submitted')).toBe('info')
    expect(resolveStatusTone('deal', 'payment_pending')).toBe('warning')
    expect(formatStatusLabel('more_information_required')).toBe('More Information Required')
  })

  it('renders a status badge for a real dispute status', () => {
    render(<StatusBadge domain="dispute" status="under_review" />)
    expect(screen.getByText('Under Review')).toBeInTheDocument()
  })
})

describe('API error mapping', () => {
  it('maps HTTP statuses to canonical API error codes', () => {
    expect(mapHttpStatusToCode(401)).toBe('unauthenticated')
    expect(mapHttpStatusToCode(403)).toBe('forbidden')
    expect(mapHttpStatusToCode(409)).toBe('conflict')
    expect(mapHttpStatusToCode(422)).toBe('business_validation')
  })
})
