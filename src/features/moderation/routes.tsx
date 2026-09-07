import type { RouteObject } from 'react-router-dom'
import { ReportedConversationsPage } from './ReportedConversationsPage'

export const moderationRoutes: RouteObject[] = [
  { path: 'moderation/reported-conversations', element: <ReportedConversationsPage /> },
]
