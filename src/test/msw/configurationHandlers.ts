import { http, HttpResponse } from 'msw'
import type {
  AdminCategory,
  DisputeCategory,
  PlatformPackage,
} from '@/features/configuration/types'

function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true as const, data }, { status })
}

function error(status: number, code: string, message: string, details?: unknown) {
  return HttpResponse.json(
    {
      success: false as const,
      error: { code, message, ...(details ? { details } : {}) },
    },
    { status },
  )
}

function parseBody(request: Request): Promise<Record<string, unknown>> {
  return request.json().catch(() => ({}))
}

export const demoCategory: AdminCategory = {
  id: 1,
  name: 'Demo Technology',
  slug: 'demo-technology',
  description: 'Technology category for demo.',
  listing_status: 'allowed',
  is_active: true,
  sort_order: 1,
  created_at: '2026-09-01T12:00:00+00:00',
  updated_at: '2026-09-01T12:00:00+00:00',
}

export const restrictedCategory: AdminCategory = {
  id: 2,
  name: 'Demo Restricted Finance',
  slug: 'demo-restricted-finance',
  description: 'Restricted category.',
  listing_status: 'restricted',
  is_active: true,
  sort_order: 2,
  created_at: '2026-09-01T12:00:00+00:00',
  updated_at: '2026-09-01T12:00:00+00:00',
}

export const demoExtensionPackage: PlatformPackage = {
  id: 11,
  name: 'Demo Extension 30 days',
  duration_days: 30,
  amount_minor: 1500000,
  currency: 'NGN',
  is_active: true,
  sort_order: 1,
  created_at: '2026-09-01T12:00:00+00:00',
  updated_at: '2026-09-01T12:00:00+00:00',
}

export const demoFeaturedPackage: PlatformPackage = {
  id: 21,
  name: 'Demo Featured 7 days',
  duration_days: 7,
  amount_minor: 2500000,
  currency: 'NGN',
  is_active: true,
  sort_order: 1,
  created_at: '2026-09-01T12:00:00+00:00',
  updated_at: '2026-09-01T12:00:00+00:00',
}

export const demoDisputeCategory: DisputeCategory = {
  id: 7,
  code: 'commission_amount_disputed',
  name: 'Commission amount disputed',
  description: 'Amount disagreement.',
  is_active: true,
  sort_order: 1,
}

export type ConfigurationFixtureState = {
  categories: AdminCategory[]
  extensionPackages: PlatformPackage[]
  featuredPackages: PlatformPackage[]
  disputeCategories: DisputeCategory[]
  failCategories: boolean
  failExtension: boolean
  failFeatured: boolean
  failDisputeCategories: boolean
  forbidCategories: boolean
  validationNext: boolean
  conflictNext: boolean
}

function defaults(): ConfigurationFixtureState {
  return {
    categories: [structuredClone(demoCategory), structuredClone(restrictedCategory)],
    extensionPackages: [structuredClone(demoExtensionPackage)],
    featuredPackages: [structuredClone(demoFeaturedPackage)],
    disputeCategories: [structuredClone(demoDisputeCategory)],
    failCategories: false,
    failExtension: false,
    failFeatured: false,
    failDisputeCategories: false,
    forbidCategories: false,
    validationNext: false,
    conflictNext: false,
  }
}

export const configurationFixtures: ConfigurationFixtureState = defaults()

export function resetConfigurationFixtures(): void {
  Object.assign(configurationFixtures, defaults())
}

let nextId = 1000

export const configurationHandlers = [
  http.get('/api/v1/admin/categories', () => {
    if (configurationFixtures.forbidCategories) {
      return error(403, 'forbidden', 'Forbidden.')
    }
    if (configurationFixtures.failCategories) {
      return error(500, 'server_error', 'Categories unavailable.')
    }
    return ok(configurationFixtures.categories)
  }),

  http.post('/api/v1/admin/categories', async ({ request }) => {
    if (configurationFixtures.validationNext) {
      configurationFixtures.validationNext = false
      return error(422, 'validation_error', 'The given data was invalid.', {
        name: ['The name has already been taken.'],
      })
    }
    const body = await parseBody(request)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        name: ['The name field is required.'],
      })
    }
    const created: AdminCategory = {
      id: nextId++,
      name,
      slug:
        typeof body.slug === 'string' && body.slug
          ? body.slug
          : name.toLowerCase().replace(/\s+/g, '-'),
      description: typeof body.description === 'string' ? body.description : null,
      listing_status:
        body.listing_status === 'restricted' || body.listing_status === 'prohibited'
          ? body.listing_status
          : 'allowed',
      is_active: body.is_active !== false,
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    configurationFixtures.categories.push(created)
    return ok(created, 201)
  }),

  http.patch('/api/v1/admin/categories/:id', async ({ params, request }) => {
    const category = configurationFixtures.categories.find((item) => item.id === Number(params.id))
    if (!category) {
      return error(404, 'not_found', 'Category not found.')
    }
    if (configurationFixtures.conflictNext) {
      configurationFixtures.conflictNext = false
      return error(409, 'conflict', 'Category state changed. Refresh and try again.')
    }
    const body = await parseBody(request)
    if (typeof body.name === 'string') {
      category.name = body.name.trim()
    }
    if ('slug' in body) {
      category.slug = typeof body.slug === 'string' && body.slug ? body.slug : category.slug
    }
    if ('description' in body) {
      category.description = typeof body.description === 'string' ? body.description : null
    }
    if (
      body.listing_status === 'allowed' ||
      body.listing_status === 'restricted' ||
      body.listing_status === 'prohibited'
    ) {
      category.listing_status = body.listing_status
    }
    if (typeof body.is_active === 'boolean') {
      category.is_active = body.is_active
    }
    if (typeof body.sort_order === 'number') {
      category.sort_order = body.sort_order
    }
    category.updated_at = new Date().toISOString()
    return ok(category)
  }),

  http.get('/api/v1/admin/campaign-extension-packages', () => {
    if (configurationFixtures.failExtension) {
      return error(500, 'server_error', 'Extension packages unavailable.')
    }
    return ok(configurationFixtures.extensionPackages)
  }),

  http.post('/api/v1/admin/campaign-extension-packages', async ({ request }) => {
    const body = await parseBody(request)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const duration = typeof body.duration_days === 'number' ? body.duration_days : 0
    const amount = typeof body.amount_minor === 'number' ? body.amount_minor : 0
    if (!name || duration < 1 || amount < 1) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        name: !name ? ['The name field is required.'] : undefined,
        duration_days: duration < 1 ? ['Duration must be at least 1.'] : undefined,
        amount_minor: amount < 1 ? ['Amount must be at least 1.'] : undefined,
      })
    }
    const created: PlatformPackage = {
      id: nextId++,
      name,
      duration_days: duration,
      amount_minor: amount,
      currency: typeof body.currency === 'string' ? body.currency : 'NGN',
      is_active: body.is_active !== false,
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    configurationFixtures.extensionPackages.push(created)
    return ok(created, 201)
  }),

  http.patch('/api/v1/admin/campaign-extension-packages/:id', async ({ params, request }) => {
    const pkg = configurationFixtures.extensionPackages.find(
      (item) => item.id === Number(params.id),
    )
    if (!pkg) {
      return error(404, 'not_found', 'Package not found.')
    }
    const body = await parseBody(request)
    if (typeof body.name === 'string') {
      pkg.name = body.name.trim()
    }
    if (typeof body.duration_days === 'number') {
      pkg.duration_days = body.duration_days
    }
    if (typeof body.amount_minor === 'number') {
      pkg.amount_minor = body.amount_minor
    }
    if (typeof body.is_active === 'boolean') {
      pkg.is_active = body.is_active
    }
    if (typeof body.sort_order === 'number') {
      pkg.sort_order = body.sort_order
    }
    pkg.updated_at = new Date().toISOString()
    return ok(pkg)
  }),

  http.get('/api/v1/admin/campaign-featured-packages', () => {
    if (configurationFixtures.failFeatured) {
      return error(500, 'server_error', 'Featured packages unavailable.')
    }
    return ok(configurationFixtures.featuredPackages)
  }),

  http.post('/api/v1/admin/campaign-featured-packages', async ({ request }) => {
    const body = await parseBody(request)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const duration = typeof body.duration_days === 'number' ? body.duration_days : 0
    const amount = typeof body.amount_minor === 'number' ? body.amount_minor : 0
    if (!name || duration < 1 || amount < 1) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        name: !name ? ['The name field is required.'] : undefined,
      })
    }
    const created: PlatformPackage = {
      id: nextId++,
      name,
      duration_days: duration,
      amount_minor: amount,
      currency: 'NGN',
      is_active: body.is_active !== false,
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    configurationFixtures.featuredPackages.push(created)
    return ok(created, 201)
  }),

  http.patch('/api/v1/admin/campaign-featured-packages/:id', async ({ params, request }) => {
    const pkg = configurationFixtures.featuredPackages.find((item) => item.id === Number(params.id))
    if (!pkg) {
      return error(404, 'not_found', 'Package not found.')
    }
    const body = await parseBody(request)
    if (typeof body.name === 'string') {
      pkg.name = body.name.trim()
    }
    if (typeof body.is_active === 'boolean') {
      pkg.is_active = body.is_active
    }
    if (typeof body.amount_minor === 'number') {
      pkg.amount_minor = body.amount_minor
    }
    if (typeof body.duration_days === 'number') {
      pkg.duration_days = body.duration_days
    }
    pkg.updated_at = new Date().toISOString()
    return ok(pkg)
  }),

  http.get('/api/v1/admin/dispute-categories', () => {
    if (configurationFixtures.failDisputeCategories) {
      return error(500, 'server_error', 'Dispute categories unavailable.')
    }
    return ok(configurationFixtures.disputeCategories)
  }),

  http.post('/api/v1/admin/dispute-categories', async ({ request }) => {
    const body = await parseBody(request)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        name: ['The name field is required.'],
      })
    }
    const created: DisputeCategory = {
      id: nextId++,
      name,
      code:
        typeof body.code === 'string' && body.code
          ? body.code
          : name.toLowerCase().replace(/\s+/g, '_'),
      description: typeof body.description === 'string' ? body.description : null,
      is_active: body.is_active !== false,
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
    }
    configurationFixtures.disputeCategories.push(created)
    return ok(created, 201)
  }),

  http.patch('/api/v1/admin/dispute-categories/:id', async ({ params, request }) => {
    const category = configurationFixtures.disputeCategories.find(
      (item) => item.id === Number(params.id),
    )
    if (!category) {
      return error(404, 'not_found', 'Dispute category not found.')
    }
    const body = await parseBody(request)
    if ('code' in body) {
      return error(422, 'validation_error', 'The given data was invalid.', {
        code: ['The code field is prohibited.'],
      })
    }
    if (typeof body.name === 'string') {
      category.name = body.name.trim()
    }
    if ('description' in body) {
      category.description = typeof body.description === 'string' ? body.description : null
    }
    if (typeof body.is_active === 'boolean') {
      category.is_active = body.is_active
    }
    if (typeof body.sort_order === 'number') {
      category.sort_order = body.sort_order
    }
    return ok(category)
  }),
]
