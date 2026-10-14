import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { CampaignCoverPanel } from '@/features/campaigns/components/CampaignCoverPanel'
import type { AdminCampaign } from '@/features/campaigns/types'
import { activeCampaign } from '@/test/msw/campaignHandlers'
import { server } from '@/test/setup'

const COVER_PATH = '/api/v1/admin/campaigns/:id/cover/download'

function campaignWithCover(id: number, title = `Campaign ${id}`): AdminCampaign {
  return {
    ...activeCampaign,
    id,
    title,
    cover_image: {
      available: true,
      url: `https://api.marcaturshub.com.ng/api/v1/admin/campaigns/${id}/cover/download`,
      mime_type: 'image/jpeg',
      size_bytes: 1024,
      original_filename: `cover-${id}.jpg`,
    },
  }
}

function coverResponse(type = 'image/jpeg', status = 200) {
  return new HttpResponse('cover-bytes', { status, headers: { 'Content-Type': type } })
}

let objectUrlCount = 0
let createObjectURL: MockInstance<typeof URL.createObjectURL>
let revokeObjectURL: MockInstance<typeof URL.revokeObjectURL>

beforeEach(() => {
  objectUrlCount = 0
  createObjectURL = vi
    .spyOn(URL, 'createObjectURL')
    .mockImplementation(() => `blob:cover-${++objectUrlCount}`)
  revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Admin CampaignCoverPanel thumbnail', () => {
  it('loads the thumbnail through the authenticated cover download', async () => {
    const requested: string[] = []
    server.use(
      http.get(COVER_PATH, ({ request }) => {
        requested.push(new URL(request.url).pathname)
        return coverResponse()
      }),
    )

    const { unmount } = render(<CampaignCoverPanel campaign={campaignWithCover(7, 'Solar')} />)

    expect(screen.getByText('Loading cover preview…')).toBeInTheDocument()
    const img = await screen.findByRole('img', { name: 'Cover for Solar' })
    expect(img).toHaveAttribute('src', 'blob:cover-1')
    expect(requested).toEqual(['/api/v1/admin/campaigns/7/cover/download'])

    unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:cover-1')
  })

  it('shows the unavailable state when the response is not an image', async () => {
    server.use(http.get(COVER_PATH, () => coverResponse('text/html')))

    render(<CampaignCoverPanel campaign={campaignWithCover(7)} />)

    expect(await screen.findByText('Cover preview unavailable.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('shows the unavailable state and keeps the download action when the request is rejected', async () => {
    server.use(
      http.get(COVER_PATH, () =>
        HttpResponse.json(
          { success: false, error: { code: 'forbidden', message: 'Forbidden.' } },
          { status: 403 },
        ),
      ),
    )

    render(<CampaignCoverPanel campaign={campaignWithCover(7)} />)

    expect(await screen.findByText('Cover preview unavailable.')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByRole('button', { name: 'Download cover' })).toBeEnabled()
  })

  it('falls back when the loaded image cannot be decoded', async () => {
    server.use(http.get(COVER_PATH, () => coverResponse()))

    render(<CampaignCoverPanel campaign={campaignWithCover(7, 'Solar')} />)

    fireEvent.error(await screen.findByRole('img', { name: 'Cover for Solar' }))
    expect(screen.getByText('Cover preview unavailable.')).toBeInTheDocument()
  })

  it('ignores a slow thumbnail response for a campaign that is no longer shown', async () => {
    const pending = new Map<string, () => void>()
    server.use(
      http.get(
        COVER_PATH,
        ({ params }) =>
          new Promise<Response>((resolve) => {
            pending.set(String(params.id), () => resolve(coverResponse()))
          }),
      ),
    )

    const { rerender } = render(<CampaignCoverPanel campaign={campaignWithCover(1, 'First')} />)
    await waitFor(() => expect(pending.has('1')).toBe(true))
    rerender(<CampaignCoverPanel campaign={campaignWithCover(2, 'Second')} />)
    await waitFor(() => expect(pending.has('2')).toBe(true))

    pending.get('2')!()
    expect(await screen.findByRole('img', { name: 'Cover for Second' })).toHaveAttribute(
      'src',
      'blob:cover-1',
    )
    pending.get('1')!()
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(screen.getByRole('img', { name: 'Cover for Second' })).toHaveAttribute(
      'src',
      'blob:cover-1',
    )
    expect(createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('does not request a thumbnail when the campaign has no cover', () => {
    const requested = vi.fn()
    server.use(
      http.get(COVER_PATH, () => {
        requested()
        return coverResponse()
      }),
    )

    render(
      <CampaignCoverPanel
        campaign={{ ...activeCampaign, cover_image: { available: false, url: null } }}
      />,
    )

    expect(screen.getByText('No Campaign Cover uploaded for this campaign.')).toBeInTheDocument()
    expect(requested).not.toHaveBeenCalled()
  })

  it('keeps the Download cover action working', async () => {
    const user = userEvent.setup()
    server.use(
      http.get(
        COVER_PATH,
        () =>
          new HttpResponse('cover-bytes', {
            headers: {
              'Content-Type': 'image/jpeg',
              'Content-Disposition': 'attachment; filename="cover-7.jpg"',
            },
          }),
      ),
    )
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    render(<CampaignCoverPanel campaign={campaignWithCover(7, 'Solar')} />)
    await screen.findByRole('img', { name: 'Cover for Solar' })

    await user.click(screen.getByRole('button', { name: 'Download cover' }))

    await waitFor(() => expect(click).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('Unable to download cover.')).toBeNull()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:cover-2')
  })
})
