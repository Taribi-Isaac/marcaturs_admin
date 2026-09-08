import type {
  AccountStatus,
  CampaignStatus,
  CommissionStatus,
  DealStatus,
  DisputeStatus,
} from '@/shared/types/domain'

export type DealPartySummary = {
  id: number
  name: string
  email: string
  status: AccountStatus | string
  role?: string
}

export type DealCampaignSummary = {
  id: number
  title: string
  status: CampaignStatus | string
  category?: {
    id: number
    name: string
    slug?: string
  } | null
}

export type DealCampaignVersionSummary = {
  id: number
  version_number: number
  status?: string
  product_name?: string | null
  product_description?: string | null
  pricing_method?: string | null
  price_amount?: string | number | null
  price_currency?: string | null
  service_area?: string | null
  commission_type?: string | null
  commission_rate?: string | number | null
  commission_amount?: string | number | null
  commission_trigger?: string | null
  commission_trigger_description?: string | null
  commission_payment_deadline_days?: number | null
  minimum_qualifying_amount?: string | number | null
  qualifying_conditions?: string | null
  refund_cancellation_rules?: string | null
  approved_claims?: string | null
  prohibited_claims?: string | null
  brand_use_rules?: string | null
  geographic_customer_restrictions?: string | null
  approved_copy?: string | null
  marketing_links?: string[] | null
  payment_destination_name?: string | null
  payment_provider?: string | null
  terms?: string | null
  published_at?: string | null
}

export type DealCommissionThin = {
  status: CommissionStatus | string
  due_at: string | null
  is_overdue: boolean
}

export type DealCommissionDetail = DealCommissionThin & {
  id: number
  amount: string | number | null
  currency: string | null
  commission_type: string | null
  commission_rate: string | number | null
  became_due_at: string | null
  paid_at: string | null
  received_at: string | null
  payment_reference: string | null
  payment_note: string | null
}

export type DealSnapshot = {
  product_name: string | null
  pricing_method: string | null
  price_amount: string | number | null
  price_currency: string | null
  commission_type: string | null
  commission_rate: string | number | null
  commission_amount: string | number | null
  commission_trigger: string | null
  commission_trigger_description: string | null
  commission_payment_deadline_days: number | null
  minimum_qualifying_amount: string | number | null
  qualifying_conditions: string | null
  expected_transaction_amount: string | number | null
  confirmed_payment_amount: string | number | null
  confirmed_at: string | null
}

export type DealPaymentEvidence = {
  id: number
  deal_id: number
  kind: string
  status: string
  reference_number: string | null
  amount: string | number | null
  currency: string | null
  paid_on: string | null
  note: string | null
  has_file: boolean
  original_filename: string | null
  mime_type: string | null
  size_bytes: number | null
  submitted_by: { id: number; role: string } | null
  submitted_at: string | null
  created_at: string | null
}

export type DealDisputeSummary = {
  id: number
  reference: string
  status: DisputeStatus | string
  category: { id: number; code: string; name: string } | null
}

export type DealEvent = {
  id: number
  type: string
  actor: { id: number; role: string } | null
  previous_status: DealStatus | string | null
  new_status: DealStatus | string
  metadata: Record<string, unknown> | null
  created_at: string | null
}

export type AdminDealListItem = {
  id: number
  status: DealStatus | string
  created_at: string | null
  updated_at: string | null
  business: DealPartySummary | null
  ambassador: DealPartySummary | null
  campaign: DealCampaignSummary | null
  campaign_version: Pick<DealCampaignVersionSummary, 'id' | 'version_number'> | null
  product_name: string | null
  commission_type: string | null
  commission_amount: string | number | null
  confirmed_payment_amount: string | number | null
  confirmed_at: string | null
  has_evidence: boolean
  evidence_count: number
  latest_evidence_status: string | null
  commission: DealCommissionThin | null
  open_dispute_count: number
}

export type AdminDealDetail = AdminDealListItem & {
  cancelled_at: string | null
  campaign: DealCampaignSummary | null
  campaign_version: DealCampaignVersionSummary | null
  snapshot: DealSnapshot
  payment_evidence: DealPaymentEvidence[]
  commission: DealCommissionDetail | null
  disputes: DealDisputeSummary[]
  events: DealEvent[]
}

export type DealListParams = {
  status?: DealStatus
  q?: string
  open_dispute?: boolean
  commission_overdue?: boolean
  commission_status?: CommissionStatus
  page?: number
  per_page?: number
}
