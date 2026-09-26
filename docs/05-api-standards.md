# API Standards

Base: `{APP_URL}/api`. Versioned student/instructor/admin surface: `/api/v1`.
Legacy exception: `/api/sessions*` (no `v1` — kept for compatibility).

## Conventions

- Auth: `Bearer` Sanctum token; most student routes add `verified`.
  Roles via Spatie: `role:Instructor`, `role:Admin|Super Admin`.
- Envelope: `{ success, message, data }` (+ `meta` for paginated). The SPA
  client (`lib/api/client.ts`) unwraps `data` and throws `ApiError(message,
  status, errors)` otherwise. Public `GET /v1/plans` and webhooks included.
- Validation: `FormRequest` per write endpoint; `Difficulty`-style enums use
  `tryFrom` + 422 (never `Enum::from` on raw input → 500).
- Errors: 401 unauthenticated · 403 policy · 404 scoped to owner (no ID oracle
  on certificates/sessions) · 422 validation · 429 login throttle.
- Throttles: `POST /v1/contact` (10/min), `POST /v1/auth/email/resend` (6/min).

## Route inventory (highlights)

| Area | Routes |
|---|---|
| Public | `certificates/verify/{n}`, `auth/*`, `catalog/*`, `courses/{c}/curriculum\|reviews`, `lessons/{l}` (preview-guarded), `media/{m}/stream` (auth + enrollment), `contact`, `config/stripe-key`, `plans`, `webhooks/{stripe,paypal}` |
| Student | `enrollments*`, `certificates*`, `favorites*`, `messages/*`, `student/scenarios*`, `quizzes/{q}/attempts*`, `assessments(+{a}/attempts*)`, `checkout*`, `subscriptions*`, `payment-methods`, `simulator/sessions*\|results\|manifest/{scenario}`, `categories` (read; writes are Admin) |
| Support desk | `v1/support-desk/overview`, `tickets*` (list/show/reply/assign/resolve/close/escalate — same actions as admin support, scoped by `Support\|Admin\|Super Admin` role + ticket policy) |
| Instructor | `v1/instructor/*` — courses, curriculum, quizzes, assessments, students, announcements, diagnostics, revenue |
| Admin | `v1/admin/*` except roles — users, courses, enrollments, analytics, commerce, plans, payments, support, security, risks. Cannot touch Admin/Super Admin accounts (403) nor grant privileged roles. |
| Super Admin | everything Admin can, plus `v1/admin/roles*` (permission model), managing admin accounts, and the `governance` block on the dashboard (staff distribution, escalations, failed webhooks, privileged audit trail). |

## Webhook lifecycle

`checkout/subscription created (pending)` → provider event →
`POST /v1/webhooks/{stripe,paypal}` (signature-verified when secret set;
stub-accepted locally) → `markSucceeded/markFailed` → enrollment unlocks →
visible in admin commerce (orders, invoices, refunds, payouts) and replayable
(`POST /v1/admin/payments/webhooks/{event}/replay`).

## Gaps / next (see root README roadmap)

- Course prerequisites/drip UI (`competency_lesson`, `required_quiz_score`
  already enforced server-side via eligibility service).
- Full simulator engine parity for oscilloscope/location/schematic labs.
- Simulator data-pack seeder.
