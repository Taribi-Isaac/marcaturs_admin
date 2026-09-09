import type { CampaignStatus } from '@/shared/types/domain'

export type CampaignParty = {
  id: number
  name: string
  email: string
  role: string
}

export type CampaignCategory = {
  id: number
  name: string
  slug?: string
  description?: string | null
  listing_status?: string
  sort_order?: number
}

export type CampaignCurrentVersionSummary = {
  id: number
  version_number: number
  status: string
  /** Present only when current version is published (MH-BE-036). */
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

export type AdminCampaign = {
  id: number
  title: string
  status: CampaignStatus
  category?: CampaignCategory | null
  current_version?: CampaignCurrentVersionSummary | null
  listing_starts_at: string | null
  listing_expires_at: string | null
  submitted_at: string | null
  approved_at: string | null
  activated_at: string | null
  deactivated_at: string | null
  expired_at: string | null
  closed_at: string | null
  suspended_at: string | null
  review_reason: string | null
  created_at: string | null
  updated_at: string | null
  user?: CampaignParty | null
}

export type CampaignMarketingResource = {
  id: number
  type: string
  title: string
  description: string | null
  mime_type: string | null
  original_filename: string | null
  size_bytes: number | null
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

export type PlatformPaymentSummary = {
  id: number
  reference: string
  purpose: string
  provider: string
  status: string
  amount_minor: number
  currency: string
  duration_days: number | null
  paid_at: string | null
}

export type CampaignFeaturedPurchase = {
  id: number
  campaign_id: number
  package_name: string
  duration_days: number
  amount_minor: number
  currency: string
  activated_at: string | null
  expires_at: string | null
  is_active: boolean
  payment?: PlatformPaymentSummary | null
}

export type CampaignExtension = {
  id: number
  campaign_id: number
  duration_days: number
  amount_minor: number
  currency: string
  previous_status: string | null
  resulting_status: string | null
  previous_listing_expires_at: string | null
  resulting_listing_expires_at: string | null
  applied_at: string | null
  payment?: PlatformPaymentSummary | null
}

export type CampaignListParams = {
  status?: CampaignStatus | ''
  page?: number
}

export type CampaignReviewPayload = {
  reason: string
}

export type CampaignClosePayload = {
  reason?: string | null
}
