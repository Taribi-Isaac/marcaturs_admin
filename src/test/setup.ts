import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { authHandlers, resetSession } from './msw/handlers'
import '@testing-library/jest-dom/vitest'

export const server = setupServer(...authHandlers)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  resetSession()
})

afterAll(() => {
  server.close()
})
