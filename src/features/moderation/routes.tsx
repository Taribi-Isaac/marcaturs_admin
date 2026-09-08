import type { RouteObject } from 'react-router-dom'
import { ReportedConversationDetailPage } from './ReportedConversationDetailPage'
import { ReportedConversationsPage } from './ReportedConversationsPage'

export const moderationRoutes: RouteObject[] = [
  { path: 'moderation/reported-conversations', element: <ReportedConversationsPage /> },
  {
    path: 'moderation/reported-conversations/:id',
    element: <ReportedConversationDetailPage />,
  },
]
