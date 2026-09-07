import { appConfig } from '@/app/config/env'
import type { ApiEnvelope } from './envelope'
import { ApiClientError, mapHttpStatusToCode } from './errors'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
  /**
   * When true, include credentials for Sanctum cookie auth (MH-FE-003).
   */
  credentials?: RequestCredentials
}

/**
 * Thin HTTP transport for the Laravel `/api/v1` envelope.
 * Domain clients and authentication wiring arrive in MH-FE-003+.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = joinUrl(appConfig.apiBaseUrl, path)
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  }

  let body: BodyInit | undefined
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
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
    if (payload && payload.success === false) {
      throw new ApiClientError({
        code:
          (payload.error.code as ReturnType<typeof mapHttpStatusToCode>) ||
          mapHttpStatusToCode(response.status),
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

function joinUrl(base: string, path: string): string {
  const normalizedBase = base.replace(/\/+$/, '')
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
