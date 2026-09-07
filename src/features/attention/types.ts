import type {
  CampaignStatus,
  DisputeStatus,
  VerificationSubmissionStatus,
} from '@/shared/types/domain'

export type AttentionParty = {
  id: number
  name?: string
  email?: string
  role: string
}

export type AttentionCategory = {
  id: number
  name: string
  slug?: string
  code?: string
}

export type VerificationRequirementSummary = {
  id: number
  name: string
  description?: string | null
  participant_type?: string
  requirement_type?: string
}

export type VerificationSubmissionAttentionItem = {
  id: number
  user_id: number
  status: VerificationSubmissionStatus
  submitted_at: string | null
  reviewed_at: string | null
  user?: AttentionParty | null
  requirement?: VerificationRequirementSummary | null
}

export type CampaignAttentionItem = {
  id: number
  title: string
  status: CampaignStatus
  submitted_at: string | null
  created_at: string | null
  updated_at: string | null
  category?: AttentionCategory | null
  user?: AttentionParty | null
}

export type DisputeAttentionItem = {
  id: number
  reference: string
  status: DisputeStatus
  deal_id: number
  commission_id: number | null
  description: string
  created_at: string | null
  updated_at: string | null
  category?: AttentionCategory | null
  reporter?: AttentionParty | null
  accused?: AttentionParty | null
  deal?: {
    id: number
    business?: AttentionParty | null
    ambassador?: AttentionParty | null
    campaign?: { id: number; title: string | null; status: string | null } | null
  } | null
}

export type ReportedConversationAttentionItem = {
  id: number
  reported: boolean
  reported_at: string | null
  report_reason: string | null
  created_at: string | null
  updated_at: string | null
  business?: AttentionParty | null
  ambassador?: AttentionParty | null
  reported_by?: AttentionParty | null
}

export type AttentionQueueCount =
  { kind: 'total'; value: number } | { kind: 'showing'; value: number; truncated: boolean }
