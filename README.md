# MarcatursHub Admin Control

Phase-1 Admin operations console (`adminControl/`).

## Stack

- React 19 + TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form + Zod (installed for later forms)
- Vitest + Testing Library
- Playwright (foundation only)
- ESLint + Prettier

## Development

```bash
cp .env.example .env.development
npm install
npm run dev
```

App runs at `http://127.0.0.1:5174`.

API base URL:

```text
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Scripts

| Script              | Purpose                                |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Dev server                             |
| `npm run build`     | Production build                       |
| `npm run typecheck` | TypeScript project references check    |
| `npm run lint`      | ESLint                                 |
| `npm run format`    | Prettier write                         |
| `npm test`          | Vitest                                 |
| `npm run test:e2e`  | Playwright (placeholder suite skipped) |

## Scope (MH-FE-002)

This foundation provides:

- design tokens
- application shell + Phase-1 navigation
- route placeholders
- shared UI primitives
- API client foundation

It does **not** implement authentication or Admin business modules.

## Related

- Backend API: `../backend`
- Seed data: `php artisan marcaturs:seed-demo`
- Architecture audit: MH-FE-001
