import { useId, useState } from 'react'
import { ApiClientError, triggerBrowserDownload } from '@/shared/api'
import { downloadAdminDealPaymentEvidence } from '@/features/deals/api'
import {
  formatBytes,
  formatDealDate,
  formatDealMoney,
  formatDealTimestamp,
  formatPartyRole,
} from '@/features/deals/format'
import type { DealPaymentEvidence } from '@/features/deals/types'
import { formatStatusLabel } from '@/shared/lib/status'
import { Button, Notice, StatusBadge } from '@/shared/ui'

export function DealEvidencePanel({
  dealId,
  evidence,
}: {
  dealId: number
  evidence: DealPaymentEvidence[]
}) {
  const headingId = useId()
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  async function handleDownload(item: DealPaymentEvidence) {
    setDownloadError(null)
    setDownloadingId(item.id)
    try {
      if (!item.has_file) {
        setDownloadError('This evidence record has no stored file available for download.')
        return
      }
      const result = await downloadAdminDealPaymentEvidence(dealId, item.id)
      triggerBrowserDownload(
        result.blob,
        result.filename ?? item.original_filename ?? `deal-evidence-${item.id}`,
      )
    } catch (err) {
      setDownloadError(
        err instanceof ApiClientError
          ? err.message
          : 'Unable to download evidence. The file may be missing from storage.',
      )
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <section className="deals-panel deals-panel--wide" aria-labelledby={headingId}>
      <h2 id={headingId}>Payment evidence</h2>
      <p className="deals-muted">
        Metadata only. Authenticated Admin download streams the private file; storage paths are
        never shown.
      </p>

      {downloadError ? (
        <Notice tone="danger" title="Download failed">
          {downloadError}
        </Notice>
      ) : null}

      {evidence.length === 0 ? (
        <p className="deals-muted">No payment evidence has been submitted on this Deal.</p>
      ) : (
        <ul className="deals-evidence-list">
          {evidence.map((item) => (
            <li key={item.id} className="deals-evidence-list__item">
              <div className="deals-stack">
                <span className="deals-primary">
                  {formatStatusLabel(item.kind)}
                  {item.original_filename ? ` · ${item.original_filename}` : ''}
                </span>
                <span className="deals-muted">
                  Status: {formatStatusLabel(item.status)}
                  {item.reference_number ? ` · Ref ${item.reference_number}` : ''}
                </span>
                <span className="deals-muted">
                  {formatDealMoney(item.amount, item.currency)}
                  {item.paid_on ? ` · Paid ${formatDealDate(item.paid_on)}` : ''}
                  {item.mime_type ? ` · ${item.mime_type}` : ''}
                  {item.size_bytes != null ? ` · ${formatBytes(item.size_bytes)}` : ''}
                  {!item.has_file ? ' · No file' : ''}
                </span>
                <span className="deals-muted">
                  Submitted {formatDealTimestamp(item.submitted_at)}
                  {item.submitted_by
                    ? ` · ${formatPartyRole(item.submitted_by.role)} #${item.submitted_by.id}`
                    : ''}
                </span>
                {item.note ? <span className="deals-muted">Note: {item.note}</span> : null}
              </div>
              {item.has_file ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    void handleDownload(item)
                  }}
                  disabled={downloadingId === item.id}
                >
                  {downloadingId === item.id ? 'Downloading…' : 'Download'}
                </Button>
              ) : (
                <StatusBadge domain="deal" status="cancelled" label="No file" />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
