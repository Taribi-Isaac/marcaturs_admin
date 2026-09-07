import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/shared/ui'
import { formatStatusLabel, resolveStatusTone } from '@/shared/lib/status'
import { mapHttpStatusToCode } from '@/shared/api'

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

describe('API error mapping helpers', () => {
  it('maps HTTP statuses to canonical API error codes', () => {
    expect(mapHttpStatusToCode(401)).toBe('unauthenticated')
    expect(mapHttpStatusToCode(403)).toBe('forbidden')
    expect(mapHttpStatusToCode(409)).toBe('conflict')
    expect(mapHttpStatusToCode(422)).toBe('business_validation')
  })
})
