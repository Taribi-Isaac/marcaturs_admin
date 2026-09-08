import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ApiClientError } from '@/shared/api'
import {
  fetchReportedConversation,
  fetchReportedConversationMessages,
} from '@/features/moderation/api'
import { MODERATION_QUERY_KEYS } from '@/features/moderation/constants'
import {
  formatModerationTimestamp,
  formatPartyLabel,
  formatPartyRole,
} from '@/features/moderation/format'
import { MessageHistoryPanel } from '@/features/moderation/components/MessageHistoryPanel'
import {
  ErrorState,
  ForbiddenState,
  LoadingState,
  Notice,
  NotFoundState,
  PageHeader,
} from '@/shared/ui'

export function ReportedConversationDetailPage() {
  const { id } = useParams()
  const conversationId = Number(id)
  const [messagePage, setMessagePage] = useState(1)

  const detailQuery = useQuery({
    queryKey: MODERATION_QUERY_KEYS.detail(conversationId),
    queryFn: ({ signal }) => fetchReportedConversation(conversationId, signal),
    enabled: Number.isFinite(conversationId) && conversationId > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const messagesQuery = useQuery({
    queryKey: MODERATION_QUERY_KEYS.messages(conversationId, messagePage),
    queryFn: ({ signal }) =>
      fetchReportedConversationMessages(conversationId, { page: messagePage }, signal),
    enabled: Number.isFinite(conversationId) && conversationId > 0 && detailQuery.isSuccess,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  if (!Number.isFinite(conversationId) || conversationId <= 0) {
    return (
      <NotFoundState
        title="Conversation not found"
        description="The conversation identifier is invalid."
        action={
          <Link className="ui-button ui-button--secondary" to="/moderation/reported-conversations">
            Back to queue
          </Link>
        }
      />
    )
  }

  if (detailQuery.isLoading) {
    return (
      <>
        <PageHeader
          title="Reported conversation"
          breadcrumbs={[
            { label: 'Moderation' },
            { label: 'Reported conversations', to: '/moderation/reported-conversations' },
            { label: 'Detail' },
          ]}
        />
        <LoadingState label="Loading reported conversation" rows={6} />
      </>
    )
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 403) {
    return <ForbiddenState />
  }

  if (detailQuery.error instanceof ApiClientError && detailQuery.error.status === 404) {
    return (
      <NotFoundState
        title="Reported conversation not found"
        description="This conversation does not exist, is not reported, or is no longer available for Admin inspection."
        action={
          <Link className="ui-button ui-button--secondary" to="/moderation/reported-conversations">
            Back to queue
          </Link>
        }
      />
    )
  }

  if (detailQuery.error || !detailQuery.data) {
    return (
      <ErrorState
        title="Unable to load reported conversation"
        description={
          detailQuery.error instanceof ApiClientError
            ? detailQuery.error.message
            : 'The reported conversation could not be loaded.'
        }
        onRetry={() => {
          void detailQuery.refetch()
        }}
      />
    )
  }

  const conversation = detailQuery.data

  return (
    <div className="moderation-page">
      <PageHeader
        title={`Conversation #${conversation.id}`}
        description="Reported Business ↔ Ambassador conversation. Inspection only."
        breadcrumbs={[
          { label: 'Moderation' },
          { label: 'Reported conversations', to: '/moderation/reported-conversations' },
          { label: `#${conversation.id}` },
        ]}
        actions={
          <Link className="ui-button ui-button--secondary" to="/moderation/reported-conversations">
            Back to queue
          </Link>
        }
      />

      <Notice tone="info" title="Private conversation boundary">
        Chat remains independent of Campaigns and Deals. Admin cannot send messages, impersonate
        either party, or attach marketplace objects to this conversation.
      </Notice>

      <div className="moderation-detail-grid">
        <section className="moderation-panel">
          <h2>Report overview</h2>
          <dl className="moderation-dl">
            <div>
              <dt>Status</dt>
              <dd>
                <span className="status-badge status-badge--warning">
                  <span className="status-badge__dot" aria-hidden="true" />
                  <span>Reported</span>
                </span>
              </dd>
            </div>
            <div>
              <dt>Reported at</dt>
              <dd>{formatModerationTimestamp(conversation.reported_at)}</dd>
            </div>
            <div>
              <dt>Reporter</dt>
              <dd>
                {formatPartyLabel(conversation.reported_by)}
                {conversation.reported_by?.role
                  ? ` · ${formatPartyRole(conversation.reported_by.role)}`
                  : ''}
              </dd>
            </div>
            <div>
              <dt>Reason</dt>
              <dd className="moderation-reason">{conversation.report_reason ?? '—'}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatModerationTimestamp(conversation.created_at)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatModerationTimestamp(conversation.updated_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="moderation-panel">
          <h2>Participants</h2>
          <dl className="moderation-dl">
            <div>
              <dt>Business</dt>
              <dd>{formatPartyLabel(conversation.business)}</dd>
            </div>
            <div>
              <dt>Ambassador</dt>
              <dd>{formatPartyLabel(conversation.ambassador)}</dd>
            </div>
          </dl>
          <p className="moderation-muted">
            No participant actions are available. User suspension and account tools are outside this
            module.
          </p>
        </section>
      </div>

      <MessageHistoryPanel
        conversation={conversation}
        messages={messagesQuery.data?.items ?? []}
        isLoading={messagesQuery.isLoading}
        pagination={messagesQuery.data?.pagination}
        page={messagePage}
        onPageChange={setMessagePage}
        errorMessage={
          messagesQuery.error
            ? messagesQuery.error instanceof ApiClientError
              ? messagesQuery.error.message
              : 'Messages could not be loaded.'
            : null
        }
        onRetry={() => {
          void messagesQuery.refetch()
        }}
      />
    </div>
  )
}
