/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_BACKEND_ORIGIN?: string
  /** Public participant origin. Must match backend FRONTEND_URL. Not a secret. */
  readonly VITE_FRONTEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
