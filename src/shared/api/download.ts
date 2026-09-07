import { appConfig } from '@/app/config/env'
import { ApiClientError, mapHttpStatusToCode } from '@/shared/api/errors'
import { ensureCsrfCookie, readXsrfToken } from '@/shared/api/csrf'
import { notifyUnauthorized } from '@/shared/api/sessionEvents'
import type { ApiErrorCode } from '@/shared/api/envelope'

export type DownloadResult = {
  blob: Blob
  filename: string | null
}

/**
 * Authenticated binary download for Sanctum session streams (e.g. verification evidence).
 * Does not parse the JSON API envelope.
 */
export async function apiDownload(
  path: string,
  options: { signal?: AbortSignal; notifyOnUnauthorized?: boolean } = {},
): Promise<DownloadResult> {
  const notifyOnUnauthorized = options.notifyOnUnauthorized ?? true

  await ensureCsrfCookie()

  const url = joinUrl(appConfig.apiBaseUrl, path)
  const headers: Record<string, string> = {
    Accept: '*/*',
    'X-Requested-With': 'XMLHttpRequest',
  }

  const xsrf = readXsrfToken()
  if (xsrf) {
    headers['X-XSRF-TOKEN'] = xsrf
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: options.signal,
    })
  } catch {
    throw new ApiClientError({
      code: 'network_error',
      message: 'Unable to reach the MarcatursHub API.',
      status: 0,
    })
  }

  if (!response.ok) {
    if (response.status === 401 && notifyOnUnauthorized) {
      notifyUnauthorized()
    }

    const payload = await parseJsonSafe(response)
    if (
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      payload.success === false
    ) {
      const errorPayload = payload as unknown as {
        error: { code?: string; message?: string; details?: unknown }
      }
      throw new ApiClientError({
        code: normalizeErrorCode(errorPayload.error.code ?? '', response.status),
        message: errorPayload.error.message || 'Download failed.',
        status: response.status,
        details: errorPayload.error.details,
      })
    }

    throw new ApiClientError({
      code: mapHttpStatusToCode(response.status),
      message: 'Download failed.',
      status: response.status,
    })
  }

  const blob = await response.blob()
  const filename = filenameFromContentDisposition(response.headers.get('Content-Disposition'))

  return { blob, filename }
}

export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) {
    return null
  }

  const utfMatch = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim())
    } catch {
      return utfMatch[1].trim()
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(header)
  return plainMatch?.[1]?.trim() ?? null
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
