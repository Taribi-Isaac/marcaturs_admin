import { Button } from '@/shared/ui'
import { formatModerationTimestamp, resolveSenderLabel } from '@/features/moderation/format'
import type {
  ConversationMessage,
  PaginationInfo,
  ReportedConversation,
} from '@/features/moderation/types'

export type MessageHistoryPanelProps = {
  conversation: ReportedConversation
  messages: ConversationMessage[]
  isLoading: boolean
  pagination?: PaginationInfo
  page: number
  onPageChange: (page: number) => void
  errorMessage?: string | null
  onRetry?: () => void
}

export function MessageHistoryPanel({
  conversation,
  messages,
  isLoading,
  pagination,
  page,
  onPageChange,
  errorMessage,
  onRetry,
}: MessageHistoryPanelProps) {
  return (
    <section className="moderation-panel" aria-labelledby="moderation-messages-title">
      <div className="moderation-panel__header">
        <h2 id="moderation-messages-title">Message history</h2>
        <p className="moderation-muted">
          Read-only inspection. Admin is not a participant and cannot send, edit, or delete
          messages.
        </p>
      </div>

      {errorMessage ? (
        <div className="moderation-inline-error" role="alert">
          <p>{errorMessage}</p>
          {onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : isLoading ? (
        <p className="moderation-muted">Loading messages…</p>
      ) : messages.length === 0 ? (
        <p className="moderation-muted">No messages are available for this conversation.</p>
      ) : (
        <ol className="moderation-message-list">
          {messages.map((message) => (
            <li key={message.id} className="moderation-message">
              <div className="moderation-message__meta">
                <span className="moderation-primary">
                  {resolveSenderLabel(
                    message.sender_id,
                    conversation.business,
                    conversation.ambassador,
                  )}
                </span>
                <span className="moderation-muted">
                  {formatModerationTimestamp(message.created_at)}
                  {message.read_at ? ' · Read' : ' · Unread'}
                  {message.type !== 'text' ? ` · ${message.type}` : ''}
                </span>
              </div>
              <p className="moderation-message__content">{message.content}</p>
            </li>
          ))}
        </ol>
      )}

      {pagination && pagination.last_page > 1 ? (
        <div className="moderation-pagination" role="navigation" aria-label="Message pages">
          <span className="moderation-muted">
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of {pagination.total}
          </span>
          <div className="moderation-pagination__controls">
            <Button variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              Previous
            </Button>
            <span className="moderation-muted">
              Page {page} of {pagination.last_page}
            </span>
            <Button
              variant="secondary"
              disabled={page >= pagination.last_page}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
