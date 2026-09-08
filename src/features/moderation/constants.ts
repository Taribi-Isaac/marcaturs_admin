export const MODERATION_QUERY_KEYS = {
  all: ['moderation'] as const,
  conversations: ['moderation', 'conversations'] as const,
  list: (params: { page: number }) => ['moderation', 'conversations', 'list', params] as const,
  detail: (id: number | string) => ['moderation', 'conversations', 'detail', String(id)] as const,
  messages: (id: number | string, page: number) =>
    ['moderation', 'conversations', 'messages', String(id), page] as const,
}

export const MODERATION_DEFAULT_PER_PAGE = 15
export const MODERATION_MESSAGES_PER_PAGE = 50

export function reportedConversationDetailPath(id: number | string): string {
  return `/moderation/reported-conversations/${id}`
}
