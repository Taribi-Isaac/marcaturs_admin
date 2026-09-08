import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { authHandlers, resetSession } from './msw/handlers'
import { attentionHandlers, resetAttentionFixtures } from './msw/attentionHandlers'
import { campaignHandlers, resetCampaignFixtures } from './msw/campaignHandlers'
import { configurationHandlers, resetConfigurationFixtures } from './msw/configurationHandlers'
import { disputeHandlers, resetDisputeFixtures } from './msw/disputeHandlers'
import { moderationHandlers, resetModerationFixtures } from './msw/moderationHandlers'
import { verificationHandlers, resetVerificationFixtures } from './msw/verificationHandlers'
import '@testing-library/jest-dom/vitest'

export const server = setupServer(
  ...authHandlers,
  ...campaignHandlers,
  ...disputeHandlers,
  ...configurationHandlers,
  ...moderationHandlers,
  ...attentionHandlers,
  ...verificationHandlers,
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  resetSession()
  resetCampaignFixtures()
  resetDisputeFixtures()
  resetConfigurationFixtures()
  resetModerationFixtures()
  resetAttentionFixtures()
  resetVerificationFixtures()
})

afterAll(() => {
  server.close()
})
