import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { authHandlers, resetSession } from './msw/handlers'
import { attentionHandlers, resetAttentionFixtures } from './msw/attentionHandlers'
import { overviewHandlers, resetOverviewFixtures } from './msw/overviewHandlers'
import { campaignHandlers, resetCampaignFixtures } from './msw/campaignHandlers'
import { configurationHandlers, resetConfigurationFixtures } from './msw/configurationHandlers'
import { disputeHandlers, resetDisputeFixtures } from './msw/disputeHandlers'
import { moderationHandlers, resetModerationFixtures } from './msw/moderationHandlers'
import { userHandlers, resetUserFixtures } from './msw/userHandlers'
import { dealHandlers, resetDealFixtures } from './msw/dealHandlers'
import { verificationHandlers, resetVerificationFixtures } from './msw/verificationHandlers'
import '@testing-library/jest-dom/vitest'

export const server = setupServer(
  ...authHandlers,
  ...overviewHandlers,
  ...campaignHandlers,
  ...dealHandlers,
  ...disputeHandlers,
  ...configurationHandlers,
  ...moderationHandlers,
  ...attentionHandlers,
  ...verificationHandlers,
  ...userHandlers,
)

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  resetSession()
  resetCampaignFixtures()
  resetDealFixtures()
  resetDisputeFixtures()
  resetConfigurationFixtures()
  resetModerationFixtures()
  resetAttentionFixtures()
  resetOverviewFixtures()
  resetVerificationFixtures()
  resetUserFixtures()
})

afterAll(() => {
  server.close()
})
