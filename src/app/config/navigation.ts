export type NavItem = {
  id: string
  label: string
  to: string
  end?: boolean
}

export type NavSection = {
  id: string
  label?: string
  items: NavItem[]
}

/**
 * Phase-1 Admin navigation only (MH-FE-001). Future domains stay out until APIs exist.
 */
export const primaryNavigation: NavSection[] = [
  {
    id: 'ops',
    items: [
      { id: 'attention', label: 'Attention', to: '/attention', end: true },
      { id: 'verification', label: 'Verification', to: '/verification' },
      { id: 'campaigns', label: 'Campaigns', to: '/campaigns' },
      { id: 'disputes', label: 'Disputes', to: '/disputes' },
      { id: 'users', label: 'Users', to: '/users' },
      { id: 'moderation', label: 'Moderation', to: '/moderation/reported-conversations' },
    ],
  },
  {
    id: 'config',
    label: 'Configuration',
    items: [
      { id: 'categories', label: 'Categories', to: '/configuration/categories' },
      {
        id: 'extension-packages',
        label: 'Extension packages',
        to: '/configuration/extension-packages',
      },
      {
        id: 'featured-packages',
        label: 'Featured packages',
        to: '/configuration/featured-packages',
      },
      {
        id: 'dispute-categories',
        label: 'Dispute categories',
        to: '/configuration/dispute-categories',
      },
    ],
  },
  {
    id: 'account',
    items: [{ id: 'account', label: 'Account', to: '/account', end: true }],
  },
]
