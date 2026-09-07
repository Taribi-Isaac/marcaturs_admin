import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { authHandlers, resetSession } from './msw/handlers'
import { attentionHandlers, resetAttentionFixtures } from './msw/attentionHandlers'
import { verificationHandlers, resetVerificationFixtures } from './msw/verificationHandlers'
import '@testing-library/jest-dom/vitest'

export const server = setupServer(...authHandlers, ...attentionHandlers, ...verificationHandlers)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  resetSession()
  resetAttentionFixtures()
  resetVerificationFixtures()
})

afterAll(() => {
  server.close()
})
