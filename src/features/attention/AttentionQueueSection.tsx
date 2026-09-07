import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ApiClientError } from '@/shared/api'
import type { AttentionQueueCount } from '@/features/attention/types'
import { Button, DataTable, ErrorState, ForbiddenState, type DataTableColumn } from '@/shared/ui'

export type AttentionQueueSectionProps<T> = {
  title: string
  count: AttentionQueueCount | null
  description?: string
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  isLoading: boolean
  isFetching: boolean
  error: unknown
  emptyTitle: string
  emptyDescription: string
  onRetry: () => void
  caption: string
  footerNote?: ReactNode
}

export function AttentionQueueSection<T>({
  title,
  count,
  description,
  columns,
  rows,
  getRowId,
  isLoading,
  isFetching,
  error,
  emptyTitle,
  emptyDescription,
  onRetry,
  caption,
  footerNote,
}: AttentionQueueSectionProps<T>) {
  const countLabel = formatCountLabel(count)
  const forbidden = error instanceof ApiClientError && error.status === 403

  return (
    <section className="attention-queue" aria-labelledby={sectionHeadingId(title)}>
      <header className="attention-queue__header">
        <div>
          <h2 id={sectionHeadingId(title)} className="attention-queue__title">
            {title}
            {countLabel ? <span className="attention-queue__count">{countLabel}</span> : null}
          </h2>
          {description ? <p className="attention-queue__description">{description}</p> : null}
        </div>
        {isFetching && !isLoading ? (
          <span className="attention-queue__refreshing" aria-live="polite">
            Updating…
          </span>
        ) : null}
      </header>

      {forbidden ? (
        <ForbiddenState description="You do not have permission to view this queue. Backend authorization remains authoritative." />
      ) : error ? (
        <ErrorState
          title={`Unable to load ${title.toLowerCase()}`}
          description={
            error instanceof ApiClientError
              ? error.message
              : 'The request could not be completed. Try again.'
          }
          onRetry={onRetry}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={getRowId}
          isLoading={isLoading}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          caption={caption}
        />
      )}

      {footerNote ? <p className="attention-queue__note">{footerNote}</p> : null}
    </section>
  )
}

export function AttentionOpenLink({ to, label }: { to: string; label: string }) {
  return (
    <Link className="attention-queue__action" to={to}>
      {label}
    </Link>
  )
}

export function AttentionRefreshButton({
  onClick,
  disabled,
  isRefreshing,
}: {
  onClick: () => void
  disabled?: boolean
  isRefreshing?: boolean
}) {
  return (
    <Button variant="secondary" onClick={onClick} disabled={disabled} aria-busy={isRefreshing}>
      {isRefreshing ? 'Refreshing…' : 'Refresh'}
    </Button>
  )
}

function formatCountLabel(count: AttentionQueueCount | null): string | null {
  if (!count) {
    return null
  }

  if (count.kind === 'total') {
    return `· ${count.value} requiring attention`
  }

  if (count.truncated) {
    return `· showing ${count.value}`
  }

  return `· ${count.value} open on this page`
}

function sectionHeadingId(title: string): string {
  return `attention-queue-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}
