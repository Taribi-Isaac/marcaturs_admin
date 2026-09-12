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

### Staging builds (ENG-040A)

Copy `.env.staging.example` → `.env.staging` (untracked) and build with staging API origins. Do not commit secrets. See `../backend/docs/deployment/staging.md`.

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
- Post-login default destination: `/overview`

## Overview (MH-FE-016)

Operational command centre for Admin. Route: `/overview` (also Admin index `/`).

**Authoritative data source:** `GET /api/v1/admin/overview` (MH-BE-043) only.

Do **not** reconstruct aggregates by counting paginated `/admin/users`, `/admin/campaigns`, `/admin/deals`, or `/admin/disputes` lists.

### Sections

1. Platform snapshot (`generated_at`, `timezone`)
2. Priority attention (`attention.*`) with drill-downs
3. Participants (`users.*`) — BUSINESS / AMBASSADOR only
4. Campaigns (`campaigns.by_status`, `featured_flagged`, `awaiting_admin_review`)
5. Deals + Ambassador commission obligations (`deals.*`, `commissions.*`)
6. Disputes + Verification (`disputes.*`, `verification.*`)
7. Platform Payment Volume (`platform_payments.*`) — successful `status=paid` Business → MarcatursHub volume for campaign extension / featured only
8. Quick actions to existing desks

### Metric semantics

- **Platform Payment Volume** ≠ ambassador commissions ≠ “company revenue”
- Commission boundary string from API: Business → Ambassador obligation, not platform revenue
- Open disputes ≠ Deal disputed
- Deal ≠ Lead
- No charts / invented percentages / infrastructure “system health”

### Refresh policy

TanStack Query: `staleTime` 30s, `refetchOnWindowFocus` true, no short-interval polling or WebSocket aggregation. Manual Refresh invalidates the overview query.

### Drill-downs

| Signal                        | Destination                          |
| ----------------------------- | ------------------------------------ |
| Verification awaiting review  | `/verification?status=pending`       |
| Campaigns awaiting review     | `/campaigns?status=submitted`        |
| Open disputes                 | `/disputes?view=actionable`          |
| Overdue commissions           | `/deals?commission_overdue=1`        |
| Payment-pending Deals         | `/deals?status=payment_pending`      |
| Reported conversations        | `/moderation/reported-conversations` |
| Participant sanctions / roles | `/users?status=` / `?role=`          |
| Full Attention queues         | `/attention`                         |

## Attention (MH-FE-004)

`/attention` composes four Admin list APIs into operational queues:

- Verification (`pending`, `under_review`)
- Campaign moderation (`submitted`)
- Disputes (open statuses, client-filtered)
- Reported conversations (read-only; Attention opens moderation detail)

## Verification (MH-FE-005)

- `/verification` submissions queue with status filter + pagination
- `/verification/submissions/:id` review detail, evidence download, review actions, history
- `/verification/requirements` create/update requirements

## Campaigns (MH-FE-006)

- `/campaigns` moderation queue (defaults to `submitted`)
- `/campaigns/:id` investigation workspace with moderation actions, resources, Featured and Extension inspection
- **Campaign Cover (MH-FE-017):** read-only preview + authenticated download via Admin cover endpoints. No Admin upload/replace/delete. Cover remains separate from marketing resources and commercial terms.

## Disputes (MH-FE-007)

- `/disputes` investigation queue (page-local actionable/historical views; backend has no status filter)
- `/disputes/:id` case workspace with Deal context, evidence download, timeline, and investigation actions

## Configuration (MH-FE-008)

Administrative configuration domains only (not a general settings dashboard):

- `/configuration/categories` — marketplace category listing status and activation
- `/configuration/extension-packages` — platform Campaign Extension packages
- `/configuration/featured-packages` — platform Featured Campaign packages
- `/configuration/dispute-categories` — dispute opening taxonomy

Uses Admin APIs only (`GET`/`POST`/`PATCH`). No delete endpoints exist. Extension and Featured packages are platform monetization configuration, not customer/commission settlement.

## Moderation (MH-FE-009)

- `/moderation/reported-conversations` — reported Business↔Ambassador conversation queue
- `/moderation/reported-conversations/:id` — read-only inspection with message history

Admin APIs: `GET /admin/conversations`, `GET /admin/conversations/:id`, `GET /admin/conversations/:id/messages`. No dismiss/resolve/send/delete actions exist.

Other domain modules remain placeholders.

## Related

- Backend API: `../backend`
- Seed data: `php artisan marcaturs:seed-demo`
- Architecture audit: MH-FE-001
