export type ConversationParty = {
  id: number
  name?: string
  role: string
}

export type ReportedConversation = {
  id: number
  reported: boolean
  reported_at: string | null
  report_reason: string | null
  created_at: string | null
  updated_at: string | null
  business?: ConversationParty | null
  ambassador?: ConversationParty | null
  reported_by?: ConversationParty | null
}

export type ConversationMessage = {
  id: number
  conversation_id: number
  sender_id: number
  type: string
  content: string
  read_at: string | null
  created_at: string | null
}

export type ReportedConversationListParams = {
  page?: number
  per_page?: number
}

export type ConversationMessagesParams = {
  page?: number
  per_page?: number
}

export type PaginationInfo = {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number | null
  to: number | null
}
