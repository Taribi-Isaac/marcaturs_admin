import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { apiRequest, ApiClientError, mapHttpStatusToCode } from '@/shared/api'
import { server } from '@/test/setup'

describe('API client', () => {
  it('parses a success envelope', async () => {
    server.use(
      http.get('/api/v1/health-check', () =>
        HttpResponse.json({ success: true, data: { ok: true } }),
      ),
    )

    await expect(apiRequest<{ ok: boolean }>('/health-check')).resolves.toEqual({ ok: true })
  })

  it('maps 401 error envelopes', async () => {
    server.use(
      http.get('/api/v1/secure', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'unauthenticated', message: 'Unauthenticated.' },
          },
          { status: 401 },
        ),
      ),
    )

    await expect(apiRequest('/secure', { notifyOnUnauthorized: false })).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 401,
      code: 'unauthenticated',
    })
  })

  it('maps 403, 404, 409, 429 and 5xx codes', async () => {
    const cases: Array<{ status: number; code: string; path: string }> = [
      { status: 403, code: 'forbidden', path: '/forbid' },
      { status: 404, code: 'not_found', path: '/missing' },
      { status: 409, code: 'conflict', path: '/conflict' },
      { status: 429, code: 'rate_limited', path: '/limited' },
      { status: 500, code: 'server_error', path: '/boom' },
    ]

    for (const item of cases) {
      server.use(
        http.get(`/api/v1${item.path}`, () =>
          HttpResponse.json(
            {
              success: false,
              error: { code: item.code, message: item.code },
            },
            { status: item.status },
          ),
        ),
      )

      await expect(apiRequest(item.path, { notifyOnUnauthorized: false })).rejects.toMatchObject({
        status: item.status,
        code: item.code,
      })
    }
  })

  it('maps 400 validation and 422 business validation distinctly', async () => {
    server.use(
      http.post('/api/v1/validate', () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'validation_error',
              message: 'The given data was invalid.',
              details: { email: ['Required'] },
            },
          },
          { status: 400 },
        ),
      ),
      http.post('/api/v1/business-rule', () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'business_validation', message: 'State conflict rule.' },
          },
          { status: 422 },
        ),
      ),
    )

    await expect(
      apiRequest('/validate', { method: 'POST', body: {}, skipCsrf: true }),
    ).rejects.toMatchObject({ status: 400, code: 'validation_error' })

    await expect(
      apiRequest('/business-rule', { method: 'POST', body: {}, skipCsrf: true }),
    ).rejects.toMatchObject({ status: 422, code: 'business_validation' })
  })

  it('maps network failure', async () => {
    server.use(http.get('/api/v1/down', () => HttpResponse.error()))

    await expect(apiRequest('/down')).rejects.toBeInstanceOf(ApiClientError)
    await expect(apiRequest('/down')).rejects.toMatchObject({ code: 'network_error', status: 0 })
  })

  it('exposes HTTP status helpers', () => {
    expect(mapHttpStatusToCode(400)).toBe('validation_error')
    expect(mapHttpStatusToCode(422)).toBe('business_validation')
    expect(mapHttpStatusToCode(503)).toBe('service_unavailable')
  })
})
