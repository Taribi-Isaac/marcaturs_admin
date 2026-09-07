import type { CommissionStatus, DealStatus, DisputeStatus } from '@/shared/types/domain'

export type DisputeParty = {
  id: number
  name?: string
  email?: string
  role: string
}

export type DisputeCategory = {
  id: number
  code: string
  name: string
}

export type DisputeAttachment = {
  id: number
  uploader?: DisputeParty | null
  original_filename: string | null
  mime_type: string | null
  size_bytes: number | null
  note: string | null
  has_file: boolean
  created_at: string | null
}

export type DisputeEvent = {
  id: number
  type: string
  previous_status: DisputeStatus | string | null
  new_status: DisputeStatus | string
  actor?: DisputeParty | null
  metadata: Record<string, unknown> | null
  created_at: string | null
}

export type DisputeDealContext = {
  id: number
  status: DealStatus | string
  business?: DisputeParty | null
  ambassador?: DisputeParty | null
  campaign?: {
    id: number | null
    title: string | null
    status: string | null
  } | null
  campaign_version?: {
    id: number | null
    version_number: number | null
  } | null
  product_name?: string | null
  commission_type?: string | null
  commission_rate?: string | number | null
  commission_amount?: string | number | null
  confirmed_at?: string | null
  cancelled_at?: string | null
  has_open_dispute?: boolean
  open_dispute_count?: number
  commission?: {
    id: number
    status: CommissionStatus | string
    amount: string | number | null
    currency: string | null
    due_at: string | null
    paid_at: string | null
    received_at: string | null
    is_overdue: boolean
  } | null
  created_at?: string | null
  updated_at?: string | null
}

export type DisputeCommissionSummary = {
  id: number
  status: CommissionStatus | string
  amount?: string | number | null
  currency?: string | null
  due_at?: string | null
  paid_at?: string | null
  received_at?: string | null
  is_overdue?: boolean
}

export type AdminDispute = {
  id: number
  reference: string
  status: DisputeStatus
  deal_id: number
  commission_id: number | null
  category?: DisputeCategory | null
  reporter?: DisputeParty | null
  accused?: DisputeParty | null
  description: string
  decision_notes: string | null
  action_notes: string | null
  resolved_at: string | null
  closed_at: string | null
  attachments?: DisputeAttachment[]
  events?: DisputeEvent[]
  deal?: DisputeDealContext | null
  commission?: DisputeCommissionSummary | null
  created_at: string | null
  updated_at: string | null
}

export type DisputeListParams = {
  page?: number
}

export type DisputeNotePayload = {
  note?: string | null
}

export type DisputeRequestEvidencePayload = {
  reason: string
}

export type DisputeResolvePayload = {
  decision_notes: string
  action_notes: string
}

export type DisputeQueueView = 'actionable' | 'historical' | 'all'
