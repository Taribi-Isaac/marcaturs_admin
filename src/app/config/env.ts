/**
 * Participant recovery page. `VITE_FRONTEND_URL` must be the same public origin
 * as the backend `FRONTEND_URL` used in reset emails. An empty or invalid value
 * yields no link rather than a guessed host.
 */
export function resolveForgotPasswordUrl(raw: string | undefined): string | null {
  const value = raw?.trim()
  if (!value) {
    return null
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null
  }

  if (url.username || url.password || url.search || url.hash) {
    return null
  }

  if (url.pathname !== '/' && url.pathname !== '') {
    return null
  }

  return `${url.origin}/forgot-password`
}

export const appConfig = {
  appName: 'MarcatursHub Admin',
  /**
   * Prefer a same-origin `/api/v1` base in development so Sanctum cookies
   * flow through the Vite proxy without backend CORS changes.
   */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  /**
   * Absolute origin used only by the Vite proxy (never sent to the browser as secrets).
   */
  backendOrigin: import.meta.env.VITE_BACKEND_ORIGIN ?? 'http://localhost:8000',
  forgotPasswordUrl: resolveForgotPasswordUrl(import.meta.env.VITE_FRONTEND_URL),
} as const

/** Origin used for non-API Sanctum routes such as `/sanctum/csrf-cookie`. */
export function resolveSanctumOrigin(): string {
  if (appConfig.apiBaseUrl.startsWith('http://') || appConfig.apiBaseUrl.startsWith('https://')) {
    return new URL(appConfig.apiBaseUrl).origin
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return ''
}
