import { apiRequest, apiRequestResult } from '@/shared/api'
import {
  MODERATION_DEFAULT_PER_PAGE,
  MODERATION_MESSAGES_PER_PAGE,
} from '@/features/moderation/constants'
import type {
  ConversationMessage,
  ConversationMessagesParams,
  PaginationInfo,
  ReportedConversation,
  ReportedConversationListParams,
} from '@/features/moderation/types'

export type ReportedConversationListResult = {
  items: ReportedConversation[]
  pagination?: PaginationInfo
}

export type ConversationMessagesResult = {
  items: ConversationMessage[]
  pagination?: PaginationInfo
}

export async function fetchReportedConversations(
  params: ReportedConversationListParams = {},
  signal?: AbortSignal,
): Promise<ReportedConversationListResult> {
  const search = new URLSearchParams()
  const page = params.page && params.page > 1 ? params.page : undefined
  const perPage = params.per_page ?? MODERATION_DEFAULT_PER_PAGE
  if (page) {
    search.set('page', String(page))
  }
  if (perPage !== MODERATION_DEFAULT_PER_PAGE) {
    search.set('per_page', String(perPage))
  }

  const query = search.toString()
  const path = query ? `/admin/conversations?${query}` : '/admin/conversations'
  const result = await apiRequestResult<ReportedConversation[]>(path, { method: 'GET', signal })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}

export async function fetchReportedConversation(
  id: number | string,
  signal?: AbortSignal,
): Promise<ReportedConversation> {
  return apiRequest<ReportedConversation>(`/admin/conversations/${id}`, {
    method: 'GET',
    signal,
  })
}

export async function fetchReportedConversationMessages(
  id: number | string,
  params: ConversationMessagesParams = {},
  signal?: AbortSignal,
): Promise<ConversationMessagesResult> {
  const search = new URLSearchParams()
  const page = params.page && params.page > 1 ? params.page : undefined
  const perPage = params.per_page ?? MODERATION_MESSAGES_PER_PAGE
  if (page) {
    search.set('page', String(page))
  }
  search.set('per_page', String(perPage))

  const path = `/admin/conversations/${id}/messages?${search.toString()}`
  const result = await apiRequestResult<ConversationMessage[]>(path, { method: 'GET', signal })

  return {
    items: result.data,
    pagination: result.meta?.pagination,
  }
}
