import { apiRequest } from './client'
import type { AuthUser, LoginPayload, LoginResult } from '@/shared/types/auth'

export async function fetchCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', {
    method: 'GET',
    signal,
    notifyOnUnauthorized: false,
  })
}

export async function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  return apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    body: payload,
    notifyOnUnauthorized: false,
  })
}

export async function logoutRequest(): Promise<null> {
  return apiRequest<null>('/auth/logout', {
    method: 'POST',
    notifyOnUnauthorized: false,
  })
}
