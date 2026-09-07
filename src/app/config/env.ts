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
