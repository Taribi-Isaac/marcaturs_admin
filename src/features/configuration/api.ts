import { apiRequest } from '@/shared/api'
import type {
  AdminCategory,
  CategoryWritePayload,
  DisputeCategory,
  DisputeCategoryCreatePayload,
  DisputeCategoryUpdatePayload,
  PackageWritePayload,
  PlatformPackage,
} from '@/features/configuration/types'

export async function fetchAdminCategories(signal?: AbortSignal): Promise<AdminCategory[]> {
  return apiRequest<AdminCategory[]>('/admin/categories', { method: 'GET', signal })
}

export async function createAdminCategory(payload: CategoryWritePayload): Promise<AdminCategory> {
  return apiRequest<AdminCategory>('/admin/categories', { method: 'POST', body: payload })
}

export async function updateAdminCategory(
  id: number | string,
  payload: CategoryWritePayload,
): Promise<AdminCategory> {
  return apiRequest<AdminCategory>(`/admin/categories/${id}`, { method: 'PATCH', body: payload })
}

export async function fetchExtensionPackages(signal?: AbortSignal): Promise<PlatformPackage[]> {
  return apiRequest<PlatformPackage[]>('/admin/campaign-extension-packages', {
    method: 'GET',
    signal,
  })
}

export async function createExtensionPackage(
  payload: PackageWritePayload,
): Promise<PlatformPackage> {
  return apiRequest<PlatformPackage>('/admin/campaign-extension-packages', {
    method: 'POST',
    body: payload,
  })
}

export async function updateExtensionPackage(
  id: number | string,
  payload: PackageWritePayload,
): Promise<PlatformPackage> {
  return apiRequest<PlatformPackage>(`/admin/campaign-extension-packages/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function fetchFeaturedPackages(signal?: AbortSignal): Promise<PlatformPackage[]> {
  return apiRequest<PlatformPackage[]>('/admin/campaign-featured-packages', {
    method: 'GET',
    signal,
  })
}

export async function createFeaturedPackage(
  payload: PackageWritePayload,
): Promise<PlatformPackage> {
  return apiRequest<PlatformPackage>('/admin/campaign-featured-packages', {
    method: 'POST',
    body: payload,
  })
}

export async function updateFeaturedPackage(
  id: number | string,
  payload: PackageWritePayload,
): Promise<PlatformPackage> {
  return apiRequest<PlatformPackage>(`/admin/campaign-featured-packages/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}

export async function fetchDisputeCategories(signal?: AbortSignal): Promise<DisputeCategory[]> {
  return apiRequest<DisputeCategory[]>('/admin/dispute-categories', { method: 'GET', signal })
}

export async function createDisputeCategory(
  payload: DisputeCategoryCreatePayload,
): Promise<DisputeCategory> {
  return apiRequest<DisputeCategory>('/admin/dispute-categories', {
    method: 'POST',
    body: payload,
  })
}

export async function updateDisputeCategory(
  id: number | string,
  payload: DisputeCategoryUpdatePayload,
): Promise<DisputeCategory> {
  return apiRequest<DisputeCategory>(`/admin/dispute-categories/${id}`, {
    method: 'PATCH',
    body: payload,
  })
}
