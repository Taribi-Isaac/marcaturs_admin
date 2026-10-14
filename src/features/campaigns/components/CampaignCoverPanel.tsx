import { useEffect, useState } from 'react'
import { triggerBrowserDownload } from '@/shared/api'
import { downloadCampaignCover } from '@/features/campaigns/api'
import type { AdminCampaign } from '@/features/campaigns/types'
import { Button } from '@/shared/ui'

type Preview = { key: string; src: string | null }

export function CampaignCoverPanel({ campaign }: { campaign: AdminCampaign }) {
  const cover = campaign.cover_image
  const available = Boolean(cover?.available && cover.url)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null)

  // Admin cover streams are origin-bound: a plain <img> request carries no Origin header and is
  // rejected, so the thumbnail is fetched through the authenticated API client instead.
  const previewKey = available
    ? [campaign.id, cover?.mime_type, cover?.size_bytes, cover?.original_filename].join('|')
    : null

  useEffect(() => {
    if (!previewKey) return

    const controller = new AbortController()
    let objectUrl: string | null = null

    downloadCampaignCover(campaign.id, controller.signal)
      .then(({ blob }) => {
        if (controller.signal.aborted) return
        if (!blob.type.toLowerCase().startsWith('image/')) {
          setPreview({ key: previewKey, src: null })
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setPreview({ key: previewKey, src: objectUrl })
      })
      .catch(() => {
        if (!controller.signal.aborted) setPreview({ key: previewKey, src: null })
      })

    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [campaign.id, previewKey])

  const current = preview && preview.key === previewKey ? preview : null
  const thumbnail = current?.src && current.src !== brokenSrc ? current.src : null

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

      {available ? (
        <div className="campaign-cover-admin">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={`Cover for ${campaign.title}`}
              className="campaign-cover-admin__img"
              onError={() => setBrokenSrc(thumbnail)}
            />
          ) : (
            <p className="campaign-muted">
              {current ? 'Cover preview unavailable.' : 'Loading cover preview…'}
            </p>
          )}
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
