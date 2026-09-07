import { http, HttpResponse } from 'msw'
import type { AuthUser } from '@/shared/types/auth'

export const adminUser: AuthUser = {
  id: 1,
  name: 'Primary Demo Admin',
  email: 'admin.primary@demo.marcaturshub.test',
  role: 'ADMIN',
  status: 'active',
  email_verified_at: '2026-09-01T10:00:00+00:00',
  last_login_at: '2026-09-07T12:00:00+00:00',
  created_at: '2026-09-01T09:00:00+00:00',
}

export const businessUser: AuthUser = {
  id: 2,
  name: 'Ada Solar Ventures Ltd',
  email: 'business.solar@demo.marcaturshub.test',
  role: 'BUSINESS',
  status: 'active',
  email_verified_at: '2026-09-01T10:00:00+00:00',
  last_login_at: '2026-09-07T12:00:00+00:00',
  created_at: '2026-09-01T09:00:00+00:00',
}

type SessionState = {
  user: AuthUser | null
}

export const session: SessionState = {
  user: null,
}

export function resetSession(): void {
  session.user = null
}

export const authHandlers = [
  http.get('/sanctum/csrf-cookie', () => {
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'Set-Cookie': 'XSRF-TOKEN=test-xsrf-token; Path=/',
      },
    })
  }),

  http.get('/api/v1/auth/me', () => {
    if (!session.user) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'unauthenticated', message: 'Unauthenticated.' },
        },
        { status: 401 },
      )
    }

    return HttpResponse.json({
      success: true,
      data: session.user,
    })
  }),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }

    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'validation_error',
            message: 'The given data was invalid.',
            details: {
              email: body.email ? undefined : ['The email field is required.'],
              password: body.password ? undefined : ['The password field is required.'],
            },
          },
        },
        { status: 400 },
      )
    }

    if (body.email === 'rate@demo.marcaturshub.test') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'rate_limited', message: 'Too many attempts.' },
        },
        { status: 429 },
      )
    }

    if (body.email === 'suspended@demo.marcaturshub.test') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'forbidden',
            message: 'This account is not permitted to access the platform.',
          },
        },
        { status: 403 },
      )
    }

    if (body.email === adminUser.email && body.password === 'DemoPass123!') {
      session.user = adminUser
      return HttpResponse.json({
        success: true,
        data: {
          user: adminUser,
          token: 'test-token-admin',
          token_type: 'Bearer',
        },
      })
    }

    if (body.email === businessUser.email && body.password === 'DemoPass123!') {
      session.user = businessUser
      return HttpResponse.json({
        success: true,
        data: {
          user: businessUser,
          token: 'test-token-business',
          token_type: 'Bearer',
        },
      })
    }

    return HttpResponse.json(
      {
        success: false,
        error: { code: 'unauthenticated', message: 'Invalid credentials.' },
      },
      { status: 401 },
    )
  }),

  http.post('/api/v1/auth/logout', () => {
    if (!session.user) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'unauthenticated', message: 'Unauthenticated.' },
        },
        { status: 401 },
      )
    }

    session.user = null
    return HttpResponse.json({ success: true, data: null })
  }),
]
