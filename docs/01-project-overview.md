# HBT Learning Platform — Project Overview

Automotive LMS for technicians: structured courses, quizzes, final assessments,
diagnostic scenarios, bench simulators, AI mentor, certificates, subscriptions.

## Workspaces

| Path | Stack | Serves |
|---|---|---|
| `frontend/` | React 19 + Vite + TS + React Router + `react-i18next` (en/ar) | Student / instructor / admin SPA. `VITE_API_URL` → Laravel `/api` |
| `backend/` | Laravel 13 + PHP 8.3 + Sanctum + Spatie roles | REST API under `/api/v1` (+ legacy `/api/sessions`) |
| `hb-tronics-simulator/` | Next.js 15 + `next-intl` (en/ar/fr) + Zustand + Vitest | Standalone simulator workbench (5 labs). Untracked workspace |
| `database/` | — | Placeholder; canonical migrations live in `backend/database` |
| `design/` | — | Tokens + UX notes (see `design/README.md`) |

## Roles

Student (default) · Instructor (`role:Instructor`) · Support (`role:Support`,
ticket queue at `/support-desk`) · Admin / Super Admin
(`role:Admin|Super Admin`). Auth: Sanctum bearer `hbtronics_access_token`
(localStorage when “remember me”, sessionStorage otherwise) + email verification.
Privileged role priority on login: Admin → Support → Instructor → Student.
Support accounts are created by admins (Users → assign role).

## Key user journeys

1. Catalog → course detail → free enroll **or** Stripe checkout (`/checkout?course=`)
   → lessons → quizzes → final assessment → certificate (QR-verifiable, public).
2. Diagnostics: student scenarios → attempts → hints → result → history.
3. Simulator: hub → lab (auto-starts `POST /v1/simulator/sessions`) → complete →
   `/reports` history + `GET /v1/simulator/manifest/{scenario}` for engine data.
4. Commerce: plans (public) → subscriptions → Stripe/PayPal webhooks confirm →
   admin commerce (orders, invoices, refunds, payouts).
