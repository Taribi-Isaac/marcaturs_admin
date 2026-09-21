export type NavItem = {
  id: string
  label: string
  to: string
  end?: boolean
  /** When set, the item is shown only if `user.permissions` includes this value. */
  permission?: string
}

export type NavSection = {
  id: string
  label?: string
  items: NavItem[]
}

/**
 * Primary Admin navigation. Overview is the post-auth command centre (MH-FE-016).
 * Permission keys follow MH-DECISION-001 / MH-FE-020.
 */
export const primaryNavigation: NavSection[] = [
  {
    id: 'ops',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        to: '/overview',
        end: true,
        permission: 'overview.view',
      },
      {
        id: 'attention',
        label: 'Attention',
        to: '/attention',
        end: true,
        permission: 'overview.view',
      },
      {
        id: 'verification',
        label: 'Verification',
        to: '/verification',
        permission: 'verification.view',
      },
      { id: 'campaigns', label: 'Campaigns', to: '/campaigns', permission: 'campaigns.view' },
      { id: 'deals', label: 'Deals', to: '/deals', permission: 'deals.view' },
      { id: 'disputes', label: 'Disputes', to: '/disputes', permission: 'disputes.view' },
      { id: 'users', label: 'Users', to: '/users', permission: 'users.view' },
      {
        id: 'moderation',
        label: 'Moderation',
        to: '/moderation/reported-conversations',
        permission: 'conversations.moderate',
      },
      {
        id: 'certification',
        label: 'Certification',
        to: '/certification/programmes',
        permission: 'certification.view',
      },
      {
        id: 'certification-learners',
        label: 'Cert. learners',
        to: '/certification/learners',
        permission: 'certification.learners.view',
      },
      { id: 'staff', label: 'Staff', to: '/staff', permission: 'staff.view' },
    ],
  },
  {
    id: 'config',
    label: 'Configuration',
    items: [
      {
        id: 'categories',
        label: 'Categories',
        to: '/configuration/categories',
        permission: 'configuration.manage',
      },
      {
        id: 'extension-packages',
        label: 'Extension packages',
        to: '/configuration/extension-packages',
        permission: 'configuration.manage',
      },
      {
        id: 'featured-packages',
        label: 'Featured packages',
        to: '/configuration/featured-packages',
        permission: 'configuration.manage',
      },
      {
        id: 'dispute-categories',
        label: 'Dispute categories',
        to: '/configuration/dispute-categories',
        permission: 'configuration.manage',
      },
    ],
  },
  {
    id: 'account',
    items: [{ id: 'account', label: 'Account', to: '/account', end: true }],
  },
]
