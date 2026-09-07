import { useId, useState } from 'react'
import { ApiClientError, triggerBrowserDownload } from '@/shared/api'
import { downloadDisputeAttachment } from '@/features/disputes/api'
import { formatBytes, formatDisputeTimestamp, formatPartyLabel } from '@/features/disputes/format'
import type { DisputeAttachment } from '@/features/disputes/types'
import { Button, Notice } from '@/shared/ui'

export function DisputeEvidencePanel({
  disputeId,
  attachments,
}: {
  disputeId: number
  attachments: DisputeAttachment[]
}) {
  const headingId = useId()
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  async function handleDownload(item: DisputeAttachment) {
    setDownloadError(null)
    setDownloadingId(item.id)
    try {
      if (!item.has_file) {
        setDownloadError('This attachment has no stored file available for download.')
        return
      }
      const result = await downloadDisputeAttachment(disputeId, item.id)
      triggerBrowserDownload(
        result.blob,
        result.filename ?? item.original_filename ?? `dispute-attachment-${item.id}`,
      )
    } catch (err) {
      setDownloadError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to download attachment. The file may be missing from storage.',
      )
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <section className="dispute-panel" aria-labelledby={headingId}>
      <h2 id={headingId}>Evidence</h2>
      <p className="dispute-muted">
        Authenticated downloads only. Private storage paths are never exposed.
      </p>

      {downloadError ? (
        <Notice tone="danger" title="Download failed">
          {downloadError}
        </Notice>
      ) : null}

      {attachments.length === 0 ? (
        <p className="dispute-muted">No evidence attachments are on this dispute yet.</p>
      ) : (
        <ul className="dispute-evidence-list">
          {attachments.map((item) => (
            <li key={item.id} className="dispute-evidence-list__item">
              <div className="dispute-stack">
                <span className="dispute-primary">
                  {item.original_filename ?? `Attachment #${item.id}`}
                </span>
                <span className="dispute-muted">
                  {item.mime_type ?? 'unknown type'} · {formatBytes(item.size_bytes)} ·{' '}
                  {formatDisputeTimestamp(item.created_at)}
                  {item.uploader ? ` · uploaded by ${formatPartyLabel(item.uploader)}` : ''}
                  {!item.has_file ? ' · file missing' : ''}
                </span>
                {item.note ? <span className="dispute-muted">{item.note}</span> : null}
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  void handleDownload(item)
                }}
                disabled={downloadingId === item.id || !item.has_file}
              >
                {downloadingId === item.id ? 'Downloading…' : 'Download'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
