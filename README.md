# HBT Learning Platform

Automotive LMS: courses · quizzes · assessments · diagnostics · simulators ·
AI mentor · certificates · subscriptions.

Start here: `docs/01-project-overview.md` → `docs/03-development-setup.md`.

| Doc | Covers |
|---|---|
| `docs/01-project-overview.md` | workspaces, roles, user journeys |
| `docs/02-system-architecture.md` | backend/frontend/simulator layout, contracts |
| `docs/03-development-setup.md` | local setup + env matrix |
| `docs/04-database-design.md` | seeder runbook + ERD + table inventory |
| `docs/05-api-standards.md` | conventions, routes, webhook lifecycle |

## Roadmap (next lifecycle gaps)

1. **Simulator parity** — oscilloscope/location/schematic labs (scanner +
   multimeter live; engines + datasets in `hb-tronics-simulator/`).
2. **Prerequisites/drip UI** — server enforcement exists (eligibility service,
   `competency_lesson`); surface it on course pages.
3. **Simulator data-pack seeder** — manifests currently fall back to the
   `diagnostic_scenarios` graph.
4. **Standalone simulator auth** — Next.js workspace is separate; add SSO or
   shared-token link before deep integration.
# HBTv1
