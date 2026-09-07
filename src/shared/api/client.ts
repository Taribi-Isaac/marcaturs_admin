import { appConfig } from '@/app/config/env'
import type { ApiEnvelope, ApiErrorCode } from './envelope'
import { ApiClientError, mapHttpStatusToCode } from './errors'
import { ensureCsrfCookie, readXsrfToken } from './csrf'
import { notifyUnauthorized } from './sessionEvents'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
  credentials?: RequestCredentials
  /**
   * Skip CSRF bootstrap (rare). Default ensures cookie for mutating requests.
   */
  skipCsrf?: boolean
  /**
   * When false, a 401 will not broadcast global unauthorized handling.
   * Used by bootstrap `/auth/me` and login probes.
   */
  notifyOnUnauthorized?: boolean
}

/**
 * Thin HTTP transport for the Laravel `/api/v1` envelope.
 * Uses credentialed cookies for Sanctum SPA session auth.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const notifyOnUnauthorized = options.notifyOnUnauthorized ?? true

  if (!options.skipCsrf && isMutatingMethod(method)) {
    await ensureCsrfCookie()
  }

  const url = joinUrl(appConfig.apiBaseUrl, path)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  }

  const xsrf = readXsrfToken()
  if (xsrf) {
    headers['X-XSRF-TOKEN'] = xsrf
  }

  let body: BodyInit | undefined
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      signal: options.signal,
      credentials: options.credentials ?? 'include',
    })
  } catch {
    throw new ApiClientError({
      code: 'network_error',
      message: 'Unable to reach the MarcatursHub API.',
      status: 0,
    })
  }

  const payload = (await parseJsonSafe(response)) as ApiEnvelope<T> | null

  if (!response.ok) {
    if (response.status === 401 && notifyOnUnauthorized) {
      notifyUnauthorized()
    }

    if (payload && payload.success === false) {
      throw new ApiClientError({
        code: normalizeErrorCode(payload.error.code, response.status),
        message: payload.error.message || 'Request failed.',
        status: response.status,
        details: payload.error.details,
      })
    }

    throw new ApiClientError({
      code: mapHttpStatusToCode(response.status),
      message: 'Request failed.',
      status: response.status,
    })
  }

  if (!payload || payload.success !== true) {
    throw new ApiClientError({
      code: 'unknown_error',
      message: 'Unexpected API response shape.',
      status: response.status,
      details: payload,
    })
  }

  return payload.data
}

function isMutatingMethod(method: HttpMethod): boolean {
  return method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'
}

function normalizeErrorCode(code: string, status: number): ApiErrorCode {
  const known: ApiErrorCode[] = [
    'validation_error',
    'unauthenticated',
    'forbidden',
    'not_found',
    'conflict',
    'business_validation',
    'rate_limited',
    'server_error',
    'service_unavailable',
    'network_error',
    'unknown_error',
  ]

  if (known.includes(code as ApiErrorCode)) {
    return code as ApiErrorCode
  }

  return mapHttpStatusToCode(status)
}

function joinUrl(base: string, path: string): string {
  if (base.startsWith('http://') || base.startsWith('https://')) {
    const normalizedBase = base.replace(/\/+$/, '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${normalizedBase}${normalizedPath}`
  }

  const normalizedBase = base.startsWith('/')
    ? base.replace(/\/+$/, '')
    : `/${base.replace(/\/+$/, '')}`
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}
