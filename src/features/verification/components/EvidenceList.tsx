import { useId, useState } from 'react'
import { ApiClientError, triggerBrowserDownload } from '@/shared/api'
import { downloadVerificationEvidence } from '@/features/verification/api'
import { formatBytes, formatVerificationTimestamp } from '@/features/verification/format'
import type { VerificationEvidence } from '@/features/verification/types'
import { Button, Notice } from '@/shared/ui'

export type EvidenceListProps = {
  submissionId: number
  evidence: VerificationEvidence[]
}

export function EvidenceList({ submissionId, evidence }: EvidenceListProps) {
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const headingId = useId()

  if (evidence.length === 0) {
    return (
      <section className="verification-panel" aria-labelledby={headingId}>
        <h2 id={headingId}>Evidence</h2>
        <p className="verification-muted">No evidence files are attached to this submission.</p>
      </section>
    )
  }

  async function handleDownload(item: VerificationEvidence) {
    setError(null)
    setDownloadingId(item.id)

    try {
      const result = await downloadVerificationEvidence(submissionId, item.id)
      triggerBrowserDownload(result.blob, result.filename ?? item.original_filename)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError('Unable to download evidence.')
      }
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <section className="verification-panel" aria-labelledby={headingId}>
      <h2 id={headingId}>Evidence</h2>
      {error ? (
        <Notice tone="danger" title="Download failed">
          {error}
        </Notice>
      ) : null}
      <ul className="verification-evidence-list">
        {evidence.map((item) => (
          <li key={item.id} className="verification-evidence-list__item">
            <div className="verification-stack">
              <span className="verification-stack__primary">{item.original_filename}</span>
              <span className="verification-stack__secondary">
                {item.mime_type} · {formatBytes(item.size_bytes)} ·{' '}
                {formatVerificationTimestamp(item.created_at)}
              </span>
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
    </section>
  )
}
