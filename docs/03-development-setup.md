# Development Setup

## Backend

```bash
backend/
cp .env.example .env        # set DB, MAIL, STRIPE_*, PAYPAL_*
composer install
php artisan key:generate
php artisan migrate --seed  # see 04-database-design.md runbook
php artisan serve            # http://127.0.0.1:8000
```

## Frontend

```bash
frontend/
npm install
cp .env.example .env        # VITE_API_URL=http://127.0.0.1:8000/api
npm run dev                 # + `npx tsc --noEmit` before pushing
```

Production env: `VITE_API_URL=https://api.hbtronics.dz/api`,
`VITE_STORAGE_URL=https://api.hbtronics.dz/storage`.

## Simulator (standalone)

```bash
hb-tronics-simulator/
pnpm install
pnpm dev                    # :3000 → /en/login
pnpm test                   # vitest · pnpm test:e2e → playwright
```

## Env matrix

| Var | Frontend | Simulator | Backend |
|---|---|---|---|
| API base | `VITE_API_URL` | `NEXT_PUBLIC_API_URL` | `APP_URL` |
| Storage | `VITE_STORAGE_URL` | — | `FILESYSTEM_DISK` |
| Stripe key | `VITE_STRIPE_PUBLISHABLE_KEY` (fallback) | — | `STRIPE_*` / `services.stripe` |
| Public plans | `GET /v1/plans` (no auth) | — | `SubscriptionController@plans` |
| Webhooks | — | — | `POST /v1/webhooks/{stripe,paypal}` |

Stripe publishable key resolves: backend `GET /v1/config/stripe-key` first,
`.env` fallback, else checkout runs in stub mode (admin/webhook confirms).
