import { http, HttpResponse } from 'msw'
import type { ConversationMessage, ReportedConversation } from '@/features/moderation/types'

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true as const, data }, { status })
}

function paginated<T>(data: T[], total: number, perPage: number, page = 1) {
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const current = Math.min(Math.max(page, 1), lastPage)
  const from = total === 0 ? null : (current - 1) * perPage + 1
  const to = total === 0 ? null : Math.min(current * perPage, total)
  return HttpResponse.json({
    success: true as const,
    data,
    meta: {
      pagination: {
        current_page: current,
        per_page: perPage,
        total,
        last_page: lastPage,
        from,
        to,
      },
    },
  })
}

function error(status: number, code: string, message: string) {
  return HttpResponse.json(
    {
      success: false as const,
      error: { code, message },
    },
    { status },
  )
}

export const reportedConversationItem: ReportedConversation = {
  id: 401,
  reported: true,
  reported_at: '2026-09-04T16:30:00+00:00',
  report_reason:
    'Participant reported unprofessional conduct and repeated off-platform payment requests during negotiation.',
  created_at: '2026-09-01T10:00:00+00:00',
  updated_at: '2026-09-04T16:30:00+00:00',
  business: { id: 11, name: 'Ada Solar Ventures Ltd', role: 'BUSINESS' },
  ambassador: { id: 21, name: 'Ada Nwosu', role: 'AMBASSADOR' },
  reported_by: { id: 11, role: 'BUSINESS' },
}

export const reportedConversationMessages: ConversationMessage[] = [
  {
    id: 9001,
    conversation_id: 401,
    sender_id: 11,
    type: 'text',
    content: 'Can we continue the discussion about campaign terms?',
    read_at: '2026-09-01T10:05:00+00:00',
    created_at: '2026-09-01T10:00:00+00:00',
  },
  {
    id: 9002,
    conversation_id: 401,
    sender_id: 21,
    type: 'text',
    content: 'Please move payment off the platform.',
    read_at: null,
    created_at: '2026-09-01T10:02:00+00:00',
  },
]

export type ModerationFixtureState = {
  conversations: ReportedConversation[]
  messagesByConversation: Record<number, ConversationMessage[]>
  failList: boolean
  forbidList: boolean
  forbidDetail: boolean
}

function defaults(): ModerationFixtureState {
  return {
    conversations: [structuredClone(reportedConversationItem)],
    messagesByConversation: {
      [reportedConversationItem.id]: structuredClone(reportedConversationMessages),
    },
    failList: false,
    forbidList: false,
    forbidDetail: false,
  }
}

export const moderationFixtures: ModerationFixtureState = defaults()

export function resetModerationFixtures(): void {
  Object.assign(moderationFixtures, defaults())
}

export const moderationHandlers = [
  http.get('/api/v1/admin/conversations', ({ request }) => {
    if (moderationFixtures.forbidList) {
      return error(403, 'forbidden', 'Forbidden.')
    }
    if (moderationFixtures.failList) {
      return error(500, 'server_error', 'Conversation queue unavailable.')
    }

    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1') || 1
    const perPage = Number(url.searchParams.get('per_page') ?? '15') || 15
    const start = (page - 1) * perPage
    const slice = moderationFixtures.conversations.slice(start, start + perPage)
    return paginated(slice, moderationFixtures.conversations.length, perPage, page)
  }),

  http.get('/api/v1/admin/conversations/:id', ({ params }) => {
    if (moderationFixtures.forbidDetail) {
      return error(403, 'forbidden', 'Forbidden.')
    }
    const conversation = moderationFixtures.conversations.find(
      (item) => item.id === Number(params.id),
    )
    if (!conversation || !conversation.reported) {
      return error(404, 'not_found', 'Reported conversation not found.')
    }
    return ok(conversation)
  }),

  http.get('/api/v1/admin/conversations/:id/messages', ({ params, request }) => {
    const conversation = moderationFixtures.conversations.find(
      (item) => item.id === Number(params.id),
    )
    if (!conversation || !conversation.reported) {
      return error(404, 'not_found', 'Reported conversation not found.')
    }

    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1') || 1
    const perPage = Number(url.searchParams.get('per_page') ?? '50') || 50
    const all = moderationFixtures.messagesByConversation[conversation.id] ?? []
    const start = (page - 1) * perPage
    const slice = all.slice(start, start + perPage)
    return paginated(slice, all.length, perPage, page)
  }),
]
