import type { CategoryListingStatus, PackageDomain } from '@/features/configuration/types'

export const CONFIG_QUERY_KEYS = {
  all: ['configuration'] as const,
  categories: ['configuration', 'categories'] as const,
  extensionPackages: ['configuration', 'extension-packages'] as const,
  featuredPackages: ['configuration', 'featured-packages'] as const,
  disputeCategories: ['configuration', 'dispute-categories'] as const,
  packages: (domain: PackageDomain) =>
    domain === 'extension'
      ? (['configuration', 'extension-packages'] as const)
      : (['configuration', 'featured-packages'] as const),
}

export const CATEGORY_LISTING_STATUSES: Array<{
  value: CategoryListingStatus
  label: string
  meaning: string
}> = [
  {
    value: 'allowed',
    label: 'Allowed',
    meaning: 'Assignable and discoverable in the marketplace.',
  },
  {
    value: 'restricted',
    label: 'Restricted',
    meaning: 'Assignable, but may require additional verification.',
  },
  {
    value: 'prohibited',
    label: 'Prohibited',
    meaning: 'Not assignable or discoverable.',
  },
]

export const CONFIG_NAV = [
  { to: '/configuration/categories', label: 'Categories' },
  { to: '/configuration/extension-packages', label: 'Extension packages' },
  { to: '/configuration/featured-packages', label: 'Featured packages' },
  { to: '/configuration/dispute-categories', label: 'Dispute categories' },
] as const

export const PACKAGE_CURRENCY_OPTIONS = ['NGN'] as const
