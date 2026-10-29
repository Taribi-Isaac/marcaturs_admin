import { describe, expect, it } from 'vitest'
import { resolveForgotPasswordUrl } from '@/app/config/env'

describe('resolveForgotPasswordUrl', () => {
  it('builds the participant forgot-password page from an absolute origin', () => {
    expect(resolveForgotPasswordUrl('http://localhost:5180')).toBe(
      'http://localhost:5180/forgot-password',
    )
    expect(resolveForgotPasswordUrl('https://app.example.test/')).toBe(
      'https://app.example.test/forgot-password',
    )
  })

  it('rejects missing, relative, and non-origin values', () => {
    expect(resolveForgotPasswordUrl(undefined)).toBeNull()
    expect(resolveForgotPasswordUrl('')).toBeNull()
    expect(resolveForgotPasswordUrl('/forgot-password')).toBeNull()
    expect(resolveForgotPasswordUrl('javascript:alert(1)')).toBeNull()
    expect(resolveForgotPasswordUrl('https://user:secret@app.example.test')).toBeNull()
    expect(resolveForgotPasswordUrl('https://app.example.test/reset-password')).toBeNull()
    expect(resolveForgotPasswordUrl('https://app.example.test/?next=/admin')).toBeNull()
  })
})