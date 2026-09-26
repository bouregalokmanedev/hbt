# design/

UX source of truth lives in code + the simulator workspace specs
(`hb-tronics-simulator/07_DESIGN_SYSTEM.md`, `09_UI_UX_SPECIFICATION.md`).

## SPA tokens (`frontend/src`)

- Brand: `hbt-orange #F47822` · `hbt-dark #3A3A3A` · backgrounds `#F7F7F7/#F3F3F3`.
- Radii: cards `rounded-3xl`, controls `rounded-xl`. Shadows: soft, low-opacity.
- Typography: system stack; Arabic via Cairo fonts (`main.tsx`).
- RTL: simulator workspace enforces `ltr-islands`; mirror that when adding
  Arabic-first layouts in the SPA.

## Rules for new pages

1. Every button navigates somewhere real or calls a wired API — no `href="#"`,
   no mock `setTimeout` submits, no “coming soon” cards without a target route.
2. Public pages (`/pricing`, `/contact`, legal) must render from backend data
   with static fallback, never static-only when an endpoint exists.
3. Add empty/loading/error states (see `SimulatorReportsPage`, `LegalPage`).
