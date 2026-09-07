import type { ReactNode } from 'react'
import { Button } from './Button'

export type EmptyStateProps = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="state-panel" role="status">
      <h2 className="state-panel__title">{title}</h2>
      <p className="state-panel__body">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}

export type LoadingStateProps = {
  label?: string
  rows?: number
}

export function LoadingState({ label = 'Loading', rows = 4 }: LoadingStateProps) {
  return (
    <div className="state-panel" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div style={{ width: '100%', display: 'grid', gap: '0.75rem' }}>
        {Array.from({ length: rows }, (_, index) => (
          <span
            key={index}
            className="skeleton"
            style={{ height: '0.9rem', width: index % 2 === 0 ? '100%' : '72%' }}
          />
        ))}
      </div>
    </div>
  )
}

export type ErrorStateProps = {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'The request could not be completed. Try again, or return later if the problem continues.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-panel" role="alert">
      <h2 className="state-panel__title">{title}</h2>
      <p className="state-panel__body">{description}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

export type ForbiddenStateProps = {
  description?: string
}

export function ForbiddenState({
  description = 'You do not have permission to view this area. Backend authorization remains authoritative.',
}: ForbiddenStateProps) {
  return (
    <div className="state-panel" role="alert">
      <h2 className="state-panel__title">Access denied</h2>
      <p className="state-panel__body">{description}</p>
    </div>
  )
}

export type NotFoundStateProps = {
  title?: string
  description?: string
  action?: ReactNode
}

export function NotFoundState({
  title = 'Not found',
  description = 'This page or record does not exist, or is no longer available.',
  action,
}: NotFoundStateProps) {
  return (
    <div className="state-panel" role="status">
      <h2 className="state-panel__title">{title}</h2>
      <p className="state-panel__body">{description}</p>
      {action}
    </div>
  )
}
