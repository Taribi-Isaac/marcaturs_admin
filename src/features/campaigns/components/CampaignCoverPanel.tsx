import { useState } from 'react'
import { triggerBrowserDownload } from '@/shared/api'
import { downloadCampaignCover } from '@/features/campaigns/api'
import type { AdminCampaign } from '@/features/campaigns/types'
import { Button } from '@/shared/ui'

function coverSrc(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url, window.location.origin)
    const marker = '/api/v1/'
    const idx = parsed.pathname.indexOf(marker)
    if (idx >= 0) {
      return `${parsed.pathname.slice(idx)}${parsed.search}`
    }
  } catch {
    // keep
  }
  return url
}

export function CampaignCoverPanel({ campaign }: { campaign: AdminCampaign }) {
  const cover = campaign.cover_image
  const available = Boolean(cover?.available && cover.url)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const src = available ? coverSrc(cover?.url) : null

  async function handleDownload() {
    setDownloadError(null)
    setDownloading(true)
    try {
      const result = await downloadCampaignCover(campaign.id)
      triggerBrowserDownload(
        result.blob,
        result.filename || cover?.original_filename || `campaign-${campaign.id}-cover`,
      )
    } catch {
      setDownloadError('Unable to download cover.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="campaign-panel" aria-labelledby="campaign-cover-heading">
      <h2 id="campaign-cover-heading">Campaign Cover</h2>
      <p className="campaign-muted">
        Read-only presentation image. Admin cannot upload, replace, or delete covers.
      </p>

      {available && src ? (
        <div className="campaign-cover-admin">
          <img
            src={src}
            alt={`Cover for ${campaign.title}`}
            className="campaign-cover-admin__img"
          />
          <dl className="campaign-dl">
            {cover?.original_filename ? (
              <div>
                <dt>Filename</dt>
                <dd>{cover.original_filename}</dd>
              </div>
            ) : null}
            {cover?.mime_type ? (
              <div>
                <dt>Type</dt>
                <dd>{cover.mime_type}</dd>
              </div>
            ) : null}
            {cover?.size_bytes != null ? (
              <div>
                <dt>Size</dt>
                <dd>{cover.size_bytes} bytes</dd>
              </div>
            ) : null}
          </dl>
          <Button
            variant="secondary"
            disabled={downloading}
            onClick={() => {
              void handleDownload()
            }}
          >
            {downloading ? 'Downloading…' : 'Download cover'}
          </Button>
          {downloadError ? <p className="campaign-muted">{downloadError}</p> : null}
        </div>
      ) : (
        <p className="campaign-muted">No Campaign Cover uploaded for this campaign.</p>
      )}
    </section>
  )
}
