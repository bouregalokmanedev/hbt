# System Architecture

```
browser ──► Vite SPA (frontend/) ──► Laravel API (backend/, :8000)
  │                │                          ├── Sanctum auth (:8000)
  │                │                          ├── Spatie roles/policies
  │                │                          └── Stripe/PayPal webhooks
  └── Next.js simulator (hb-tronics-simulator/, :3000, standalone)
```

## Backend layout (`backend/app`)

- `Http/Controllers/Api/V1` — student + instructor + admin controllers.
- `Domains/*` — vertical slices: `Payments` (checkout, subscriptions, webhooks),
  `Simulator` (sessions, results, manifest), `AI` (mentor), `Students`,
  `Instructor`, `Admin`, `DiagnosticScenarios`, `Messaging`, `Quizzes`,
  `Assessments`, `Media`, `Taxonomy`, `RiskManagement`, `Support`.
- Policies: `Courses/CoursePolicy`, `Taxonomy/CategoryPolicy`, `Media/MediaPolicy`.
  Enrollment-gated reads: quiz drafts, media streams, assessments.

## Frontend layout (`frontend/src`)

- `routes/` — `public | auth | dashboard (Student) | instructor | admin` +
  `NotFound`. Canonical router: `app/router.tsx` (`routes/index.tsx` mirrors it
  for legacy `app/App.tsx`).
- `features/*` — one folder per domain, each with `api/ + pages/ + components/`.
- `lib/api/client.ts` — single `fetch` client (Bearer + `Accept-Language`).

## Simulator contract

- Engine result shape: `{ tool, scenarioId, score, steps:[{label, ok}], verdict,
  outcome: pass|fault }`. One write path → `POST /v1/simulator/sessions` →
  `POST /v1/simulator/sessions/{id}/complete` → `/reports`.
- Engine input: `GET /v1/simulator/manifest/{scenario}` (version-pinned,
  falls back to `diagnostic_scenarios` graph when no data pack).
- The Next.js workspace is standalone; the SPA embeds scanner/multimeter labs
  and deep-links the rest. Decision record: keep standalone (no shared imports).

## i18n

- SPA: `react-i18next`, en/ar. Simulator: `next-intl`, en/ar/fr. Class-B tokens
  (B20, 1ZR-FE) are never translated; keep parity when adding keys.
