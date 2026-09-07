import { useId, useState } from 'react'
import { ApiClientError, triggerBrowserDownload } from '@/shared/api'
import { downloadCampaignResource } from '@/features/campaigns/api'
import { formatBytes, formatCampaignTimestamp } from '@/features/campaigns/format'
import type { CampaignMarketingResource } from '@/features/campaigns/types'
import { Button, ErrorState, LoadingState, Notice } from '@/shared/ui'

export function CampaignResourcesPanel({
  campaignId,
  resources,
  isLoading,
  error,
  onRetry,
}: {
  campaignId: number
  resources: CampaignMarketingResource[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
}) {
  const headingId = useId()
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  async function handleDownload(item: CampaignMarketingResource) {
    setDownloadError(null)
    setDownloadingId(item.id)
    try {
      const result = await downloadCampaignResource(campaignId, item.id)
      triggerBrowserDownload(
        result.blob,
        result.filename ?? item.original_filename ?? `resource-${item.id}`,
      )
    } catch (err) {
      setDownloadError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to download marketing resource. The file may be missing from storage.',
      )
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <section className="campaign-panel" aria-labelledby={headingId}>
      <h2 id={headingId}>Marketing resources</h2>
      <p className="campaign-muted">
        Authenticated downloads only. Demo seed metadata may reference files that are not present on
        disk.
      </p>

      {isLoading ? <LoadingState label="Loading marketing resources" rows={3} /> : null}
      {!isLoading && error ? (
        <ErrorState
          title="Unable to load marketing resources"
          description={
            error instanceof ApiClientError ? error.message : 'Resources could not be loaded.'
          }
          onRetry={onRetry}
        />
      ) : null}
      {!isLoading && !error && resources.length === 0 ? (
        <p className="campaign-muted">No marketing resources are attached to this campaign.</p>
      ) : null}

      {downloadError ? (
        <Notice tone="danger" title="Download failed">
          {downloadError}
        </Notice>
      ) : null}

      {!isLoading && !error && resources.length > 0 ? (
        <ul className="campaign-resource-list">
          {resources.map((item) => (
            <li key={item.id} className="campaign-resource-list__item">
              <div className="campaign-stack">
                <span className="campaign-primary">{item.title}</span>
                <span className="campaign-muted">
                  {item.type}
                  {item.original_filename ? ` · ${item.original_filename}` : ''}
                  {item.mime_type ? ` · ${item.mime_type}` : ''} · {formatBytes(item.size_bytes)} ·{' '}
                  {formatCampaignTimestamp(item.created_at)}
                </span>
                {item.description ? (
                  <span className="campaign-muted">{item.description}</span>
                ) : null}
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  void handleDownload(item)
                }}
                disabled={downloadingId === item.id}
              >
                {downloadingId === item.id ? 'Downloading…' : 'Download'}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
