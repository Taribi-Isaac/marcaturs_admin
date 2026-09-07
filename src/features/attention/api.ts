import { apiRequestResult } from '@/shared/api'
import type { PaginationMeta } from '@/shared/api/envelope'
import {
  ATTENTION_VERIFICATION_STATUSES,
  ATTENTION_DISPUTE_STATUSES,
} from '@/features/attention/constants'
import type {
  AttentionQueueCount,
  CampaignAttentionItem,
  DisputeAttentionItem,
  ReportedConversationAttentionItem,
  VerificationSubmissionAttentionItem,
} from '@/features/attention/types'

export type AttentionListResult<T> = {
  items: T[]
  count: AttentionQueueCount
}

function paginationOf(
  meta: { pagination?: PaginationMeta } | undefined,
): PaginationMeta | undefined {
  return meta?.pagination
}

export async function fetchVerificationAttentionQueue(
  signal?: AbortSignal,
): Promise<AttentionListResult<VerificationSubmissionAttentionItem>> {
  const results = await Promise.all(
    ATTENTION_VERIFICATION_STATUSES.map((status) =>
      apiRequestResult<VerificationSubmissionAttentionItem[]>(
        `/admin/verification/submissions?status=${encodeURIComponent(status)}`,
        { method: 'GET', signal },
      ),
    ),
  )

  const items = results
    .flatMap((result) => result.data)
    .sort((a, b) => compareIsoDesc(a.submitted_at, b.submitted_at))

  const totals = results.map((result) => paginationOf(result.meta))
  const allKnown = totals.every((page) => typeof page?.total === 'number')
  const truncated = totals.some((page) => (page?.last_page ?? 1) > 1)

  if (allKnown && !truncated) {
    const value = totals.reduce((sum, page) => sum + (page?.total ?? 0), 0)
    return { items, count: { kind: 'total', value } }
  }

  return {
    items,
    count: { kind: 'showing', value: items.length, truncated: truncated || !allKnown },
  }
}

export async function fetchCampaignAttentionQueue(
  signal?: AbortSignal,
): Promise<AttentionListResult<CampaignAttentionItem>> {
  const result = await apiRequestResult<CampaignAttentionItem[]>(
    '/admin/campaigns?status=submitted',
    { method: 'GET', signal },
  )

  const items = [...result.data].sort((a, b) =>
    compareIsoDesc(a.submitted_at ?? a.updated_at, b.submitted_at ?? b.updated_at),
  )
  const page = paginationOf(result.meta)

  if (page && page.last_page <= 1) {
    return { items, count: { kind: 'total', value: page.total } }
  }

  return {
    items,
    count: {
      kind: 'showing',
      value: items.length,
      truncated: (page?.last_page ?? 1) > 1,
    },
  }
}

export async function fetchDisputeAttentionQueue(
  signal?: AbortSignal,
): Promise<AttentionListResult<DisputeAttentionItem>> {
  const result = await apiRequestResult<DisputeAttentionItem[]>('/admin/disputes', {
    method: 'GET',
    signal,
  })

  const open = new Set<string>(ATTENTION_DISPUTE_STATUSES)
  const items = result.data
    .filter((item) => open.has(item.status))
    .sort((a, b) => compareIsoDesc(a.updated_at ?? a.created_at, b.updated_at ?? b.created_at))

  const page = paginationOf(result.meta)
  const truncated = (page?.last_page ?? 1) > 1

  // Disputes list has no status filter — totals from pagination include closed cases.
  return {
    items,
    count: {
      kind: 'showing',
      value: items.length,
      truncated,
    },
  }
}

export async function fetchReportedConversationAttentionQueue(
  signal?: AbortSignal,
): Promise<AttentionListResult<ReportedConversationAttentionItem>> {
  const result = await apiRequestResult<ReportedConversationAttentionItem[]>(
    '/admin/conversations?per_page=50',
    { method: 'GET', signal },
  )

  const items = [...result.data].sort((a, b) =>
    compareIsoDesc(a.reported_at ?? a.updated_at, b.reported_at ?? b.updated_at),
  )
  const page = paginationOf(result.meta)

  if (page && page.last_page <= 1) {
    return { items, count: { kind: 'total', value: page.total } }
  }

  return {
    items,
    count: {
      kind: 'showing',
      value: items.length,
      truncated: (page?.last_page ?? 1) > 1,
    },
  }
}

function compareIsoDesc(a: string | null | undefined, b: string | null | undefined): number {
  const left = a ? Date.parse(a) : 0
  const right = b ? Date.parse(b) : 0
  return right - left
}
