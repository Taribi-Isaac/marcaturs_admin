# MarcatursHub Admin Control

Phase-1 Admin operations console (`adminControl/`).

## Stack

- React 19 + TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form + Zod
- Vitest + Testing Library + MSW
- Playwright (foundation only)
- ESLint + Prettier

## Development

```bash
cp .env.example .env.development
npm install
npm run dev
```

App: `http://localhost:5174` (use the `localhost` host — not `127.0.0.1` — so `SESSION_DOMAIN=localhost` cookies apply).

### API / Sanctum

Local development uses a **Vite proxy** so Sanctum cookies stay same-origin:

```text
VITE_API_BASE_URL=/api/v1
VITE_BACKEND_ORIGIN=http://localhost:8000
```

Vite proxies `/api` and `/sanctum` to the Laravel origin and rewrites `Origin`/`Referer` to `http://localhost:3000` (already listed in backend `SANCTUM_STATEFUL_DOMAINS`) so SPA session middleware applies without changing backend env. The SPA calls `GET /sanctum/csrf-cookie` before mutating requests and sends `X-XSRF-TOKEN`.

Start the backend separately (`php artisan serve`) and seed demo data:

```bash
cd ../backend
php artisan marcaturs:seed-demo
```

Use seeded Admin emails from `backend/docs/development-seed.md`. Do not commit credentials.

## Scripts

| Script              | Purpose                  |
| ------------------- | ------------------------ |
| `npm run dev`       | Dev server               |
| `npm run build`     | Production build         |
| `npm run typecheck` | TypeScript check         |
| `npm run lint`      | ESLint                   |
| `npm run format`    | Prettier write           |
| `npm test`          | Vitest                   |
| `npm run test:e2e`  | Playwright (placeholder) |

## Auth (MH-FE-003)

- Login / logout / `/auth/me` against Laravel
- Admin role gate (`role === ADMIN`)
- Non-Admin users receive Access denied
- Session restore on refresh via cookie + `/auth/me`

## Attention (MH-FE-004)

`/attention` composes four Admin list APIs into operational queues:

- Verification (`pending`, `under_review`)
- Campaign moderation (`submitted`)
- Disputes (open statuses, client-filtered)
- Reported conversations (read-only list)

## Verification (MH-FE-005)

- `/verification` submissions queue with status filter + pagination
- `/verification/submissions/:id` review detail, evidence download, review actions, history
- `/verification/requirements` create/update requirements

Other domain modules remain placeholders.

## Related

- Backend API: `../backend`
- Seed data: `php artisan marcaturs:seed-demo`
- Architecture audit: MH-FE-001
