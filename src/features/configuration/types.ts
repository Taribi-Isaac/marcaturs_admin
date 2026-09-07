export type CategoryListingStatus = 'allowed' | 'restricted' | 'prohibited'

export type AdminCategory = {
  id: number
  name: string
  slug: string
  description: string | null
  listing_status: CategoryListingStatus
  is_active: boolean
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

export type CategoryWritePayload = {
  name: string
  slug?: string | null
  description?: string | null
  listing_status?: CategoryListingStatus
  is_active?: boolean
  sort_order?: number
}

export type PlatformPackage = {
  id: number
  name: string
  duration_days: number
  amount_minor: number
  currency: string
  is_active?: boolean
  sort_order?: number
  created_at: string | null
  updated_at: string | null
}

export type PackageWritePayload = {
  name: string
  duration_days: number
  amount_minor: number
  currency?: string
  is_active?: boolean
  sort_order?: number
}

export type DisputeCategory = {
  id: number
  code: string
  name: string
  description: string | null
  is_active: boolean
  sort_order: number
}

export type DisputeCategoryCreatePayload = {
  name: string
  code?: string | null
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

export type DisputeCategoryUpdatePayload = {
  name?: string
  description?: string | null
  is_active?: boolean
  sort_order?: number
}

export type PackageDomain = 'extension' | 'featured'
