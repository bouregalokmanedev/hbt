# Production readiness runbook

This document covers the minimum operating standard for the Laravel API in
`backend/`. It is deliberately concrete: every section maps to a setting that
must be present before the platform handles real payments.

## 1. Required infrastructure

| Component | Requirement |
| --- | --- |
| PHP | 8.3+ with `pdo_mysql`/`pdo_pgsql`, `redis`, `intl`, `gd`, `zip` |
| Database | MySQL 8+ or PostgreSQL 14+ (SQLite is local/test only) |
| Cache / sessions / queues | Redis (preferred) or database for a single node |
| Web server | Nginx/Apache in front of PHP-FPM |
| TLS | Terminated at the load balancer; forward `X-Forwarded-*` |
| Email | Real SMTP provider, never `log` |
| Media | S3-compatible bucket, never the application disk |
| Backups | Nightly database dumps stored off-host + tested restores |

## 2. Environment

Copy `backend/.env.production.example` to `backend/.env` and fill every
secret. Then:

```bash
php artisan key:generate --force
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Production invariants:

- `APP_ENV=production`, `APP_DEBUG=false`
- `DB_CONNECTION=mysql` or `pgsql`
- `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `SESSION_DRIVER=redis`
- `LOG_STACK=daily`, `LOG_LEVEL=warning`, `LOG_DAILY_DAYS=30`
- `SESSION_SECURE_COOKIE=true`
- `TRUSTED_PROXIES` lists only proxies you control; never `*`
- `TRUSTED_HOSTS` lists the public host names
- `CORS_ALLOWED_ORIGINS` lists the exact frontend origins

The application queues every notification/mail job with `after_commit=true`,
so a queued job cannot observe uncommitted payment state.

## 3. Process supervision

Run at least one queue worker and the scheduler under systemd/supervisor:

```ini
# /etc/supervisor/conf.d/hbt-worker.conf
[program:hbt-worker]
command=php /srv/hbt/backend/artisan queue:work redis --sleep=1 --tries=3 --timeout=90 --max-jobs=1000
directory=/srv/hbt/backend
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=2
user=www-data
```

```cron
* * * * * cd /srv/hbt/backend && php artisan schedule:run >> /dev/null 2>&1
```

Deploy sequence: put the app in maintenance mode (`php artisan down
--retry=60`), run migrations, rebuild caches, restart workers, then
`php artisan up`. Never run `migrate:fresh` in production.

## 4. Health probes and monitoring

- `GET /up` — framework liveness only.
- `GET /health` and `GET /api/v1/health` — readiness checks for database,
  cache, queue, and writable storage. Returns `503` when degraded.
- Every API response includes `X-Request-ID`; the same id is attached to
  application log context. Surface it in error reports.

Point the load balancer at `/health`, and alert on:

- non-2xx health responses for more than 2 minutes
- queue depth growing for more than 15 minutes
- failed jobs (`failed_jobs`) increasing
- 5xx rate, checkout 4xx rate, and webhook `failed` events
- disk usage above 80%

## 5. Payments

Internal amounts are major units (2500 = 2,500 DZD). Conversion to provider
minor units happens only inside the Stripe gateway. Currency is derived from
the courses being purchased, never from the client.

- **Stripe** — requires `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET`. Checkout
  fails closed in production if either is missing. Stripe does not support
  DZD; DZD checkouts use the manual provider.
- **Manual** — creates a `pending` payment only. An administrator must confirm
  it from the admin console. There is no automatic success.
- **PayPal** — disabled and unimplemented. `PAYPAL_ENABLED` must stay `false`
  until a real integration is shipped. The gateway throws instead of returning
  fake successes.
- **Refunds** — admin refunds call the provider first, then record a local
  transaction. Partial refunds are repeatable up to the captured amount.
  Pass `idempotency_key` when retrying an admin refund request.
- **Webhooks** — events are claimed atomically. A duplicate/concurrent
  delivery gets `409` while the first worker is processing, then `200`
  `Already processed` once complete. Failed events can be replayed from the
  admin console.

Stripe webhook endpoint: `POST /api/v1/webhooks/stripe`.
PayPal webhook endpoint: `POST /api/v1/webhooks/paypal` (leave unused while
PayPal is disabled).

## 6. Bot and abuse protection

Public registration, login, forgot-password, and contact endpoints are
rate-limited and pass through `ProtectAgainstBots`:

- **Honeypot** — every form includes an off-screen `website` field. It must be
  empty; filled requests are rejected with a generic validation error.
- **Turnstile (recommended)** — create a widget in the Cloudflare dashboard
  and set `TURNSTILE_ENABLED=true`, `TURNSTILE_SITE_KEY`, and
  `TURNSTILE_SECRET_KEY`. The frontend reads the site key from
  `GET /api/v1/config/bot-protection`; the secret never leaves the server.
  Turnstile is enforced only when both keys are present, so a half-configured
  deployment cannot lock users out.
- **Login throttling** — five failed attempts per email+IP in five minutes,
  in addition to the route limiter. OTP verification and resend endpoints are
  throttled separately.

If the Turnstile verification API is unavailable, requests fail closed with a
validation error rather than silently skipping the challenge.

## 7. Frontend security

The SPA authenticates with Sanctum bearer tokens. Tokens are kept in
`localStorage` when “remember me” is checked and in `sessionStorage`
otherwise. That is a deliberate trade-off for a static SPA and a separate API:
any successful XSS can read the token, so XSS prevention is the primary
control.

Controls already in the build:

- **CSP** — production builds inject a `Content-Security-Policy` meta tag from
  `frontend/vite.config.ts`. Scripts are limited to the app itself, Stripe.js,
  and Turnstile; `object-src` is `none`; connections are limited to the API,
  Stripe, and Turnstile. Revisit the policy whenever a third-party script is
  added. The dev server is intentionally exempt because Vite injects inline
  HMR scripts.
- **HTML sanitization** — lesson bodies are sanitized by the API and again by
  DOMPurify before `dangerouslySetInnerHTML`. The only other use is the
  locally generated avatar SVG, whose options come from fixed constants.
- **Short-lived tokens** — Sanctum enforces `SANCTUM_EXPIRATION` (default
  `1440` minutes). A stolen token stops working within 24 hours even if it is
  never revoked.
- **Central 401 handling** — an expired/revoked token clears storage and the
  Zustand state, then redirects to `/login` exactly once.
- **No token in URLs** — bearer tokens are sent only in the `Authorization`
  header. Signed media URLs are separate, scoped, and time-limited.

Because a meta-tag CSP cannot carry `frame-ancestors`, the edge server must
also send:

```nginx
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header X-Frame-Options "DENY" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Serve the SPA only over HTTPS. If the deployment ever puts the SPA and API on
one origin, migrate to Sanctum's httpOnly session-cookie mode; that removes
tokens from JavaScript entirely and is stronger than the current bearer-token
model.

## 8. SEO and share cards

Public pages call `usePageMeta` (`frontend/src/lib/page-meta.ts`) to update the
document title, description, canonical URL, Open Graph/Twitter tags, and
robots directive after render. Course pages use the course title, summary, and
thumbnail; certificate verification and 404 pages are `noindex`. Search
engines that execute JavaScript see the correct tags.

Social scrapers (Facebook, LinkedIn, Slack, X) generally do **not** execute
JavaScript, so they only see the static tags in `frontend/index.html`. Per-course
and per-article share cards therefore require one of:

- a prerender service (Prerender.io, Rendertron) in front of the SPA,
- an edge worker that returns the course/article `<head>` for crawler user
  agents, or
- server-side rendering/preloading of the public routes.

Until one of those exists, treat course links as search-engine metadata only,
not rich social previews.

`frontend/public/robots.txt` and `frontend/public/sitemap.xml` cover the static
public routes. Generate a dynamic sitemap from published courses when one is
added; keep authenticated areas disallowed.

## 9. Backups and restore

`backend/scripts/backup-database.sh` supports MySQL, PostgreSQL, and SQLite,
gzip verification, retention, optional GPG encryption, and optional S3
upload.

```bash
cd /srv/hbt/backend
ENV_FILE=/srv/hbt/backend/.env ./scripts/backup-database.sh
```

Cron:

```cron
15 2 * * * cd /srv/hbt/backend && ENV_FILE=/srv/hbt/backend/.env ./scripts/backup-database.sh >> /var/log/hbt-backup.log 2>&1
```

Restore (MySQL example):

```bash
gunzip -c /var/backups/hbt/db-20261025T021500Z.sql.gz | mysql -h "$DB_HOST" -u "$DB_USERNAME" -p "$DB_DATABASE"
```

Restore (PostgreSQL example):

```bash
gunzip -c /var/backups/hbt/db-20261025T021500Z.sql.gz | psql -h "$DB_HOST" -U "$DB_USERNAME" -d "$DB_DATABASE"
```

Test a restore into a staging database every month. A backup that has never
been restored is not a backup.

## 10. Quality gates

CI (`.github/workflows/ci.yml`) enforces five gates:

- **Backend static analysis** — `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress`
  runs Larastan at level 0. `parseModelCastsMethod` is enabled in
  `backend/phpstan.neon.dist`; without it, enum casts look like plain strings and
  branches such as `Course::unpublish()` are mis-modelled as always-throwing.
  Level 0 is the enforceable floor today. Levels 1–5 are dominated by Eloquent
  generic property noise (hundreds of `Model::$attribute` findings), so raise the
  level incrementally once those are typed, never by adding a baseline that hides
  new findings.
- **Backend coverage** — CI installs `pcov` and runs the suite with
  `vendor/bin/pest --coverage --min=65`. The measured baseline with `pcov` is
  69.2% of `app/`. Raise the floor as coverage improves; do not lower it to turn
  a red build green. Locally, install `pcov` (`pecl install pcov`) and set
  `pcov.directory=app` before running the same command.
- **Frontend coverage** — `npm run test:coverage` enforces thresholds of 55%
  statements, 45% branches, 48% functions, and 60% lines. These are just below
  the measured baseline (58.35 / 48.78 / 51.76 / 62.46). Raise them as coverage
  improves; do not lower them to turn a red build green.
- **Accessibility** — `frontend/src/test/accessibility.test.tsx` scans the login,
  registration, and contact pages with axe-core. Color-contrast is skipped because
  jsdom has no layout engine; run a browser-based contrast pass before a major
  visual redesign.
- **Browser E2E** — `npm run test:e2e` serves the production build and checks the
  landing page, client-side login validation, and the 404 page with Playwright
  (`frontend/e2e/public-smoke.spec.ts`). Authenticated journeys need a disposable
  backend and are not wired yet.

## 11. Simulator deployment

`hb-tronics-simulator/` is a Next.js reconstruction used as a design and
behaviour reference. Its login is cosmetic (it accepts any credentials), it has
no server persistence, and it is not wired to LMS accounts. **Do not deploy it as
a public product or behind the LMS domain.**

The production simulator is the LMS-integrated implementation under
`frontend/src/features/simulator`, reached through the authenticated `/simulator`
routes. It uses the learner's Sanctum session and records attempts through the
backend, so progress, XP, and instructor reporting are real.

If the standalone app is ever promoted to production, it must first:

1. sit behind LMS single sign-on (or an OAuth/OIDC exchange) and remove the fake
   login screen,
2. replace in-memory progress with the LMS attempt/result APIs,
3. be added to CI, dependency scanning, and the release checklist.

Until then, keep it out of deploy artifacts and treat it as documentation.

## 12. Release checklist

- [ ] `php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress` passes
- [ ] `php -d memory_limit=1G vendor/bin/pest --coverage --min=65` passes
- [ ] `npm run lint`, `npm run test:coverage`, `npm run test:e2e`, and `npm run build` pass in `frontend/`
- [ ] New migrations reviewed for locking/backfill risk
- [ ] `php artisan migrate --force` on staging, then production
- [ ] `php artisan config:cache route:cache view:cache`
- [ ] Queue workers restarted
- [ ] `/health` returns `200`
- [ ] Built `index.html` contains the Content-Security-Policy meta tag
- [ ] The edge server adds `frame-ancestors 'none'`, `X-Frame-Options`, and HSTS
- [ ] Stripe webhook secret and endpoint verified in the Stripe dashboard
- [ ] Turnstile keys configured or deliberately disabled
- [ ] Registration, login, forgot-password, and contact forms reject the honeypot
- [ ] One low-value live checkout and one refund completed manually
- [ ] Backup from the previous night verified
- [ ] Rollback commit/tag recorded
