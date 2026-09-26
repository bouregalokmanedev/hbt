# 15 — Final Architecture Review

**Purpose:** pre-implementation audit of the HB TRONICS Simulator architecture (files `01`–`14`) against the production capability list. No code is written. Findings are spec-level; because implementation has not begun, every correctable finding is resolved by updating the specifications (done in the "Corrections Applied" section).

**Method:** each of the 14 mandated check areas was tested against the required capabilities (complex simulator UI, independent engine, shared state, multiple scenarios, progress, scoring, learning modules, future auth/API/WebSocket, real-time state, AR-RTL/EN/FR, responsive, a11y, performance, error handling, offline, future SaaS).

**Guiding constraint honoured:** simplest architecture that can realistically scale — no microservices, no premature backend, no unnecessary tech. The base architecture (client-side app, framework-free engines, repository seam) is sound; the findings below close **future-facing** gaps and a few **content/lifecycle** gaps, mostly by adding *interfaces and data models*, not technology.

---

## Verdict at a glance

| # | Area | Result | Top severity |
|---|------|--------|--------------|
| 1 | Architectural coupling | Minor gap | Medium |
| 2 | State management | Gaps | High |
| 3 | Component scalability | Minor gap | Medium |
| 4 | Simulator engine coupling | Gap (real-time seam) | High |
| 5 | Data model | Gap (scenarios/modules) | High |
| 6 | Routing | OK / minor | Low |
| 7 | i18n | Gap (translatable engine prose) | High |
| 8 | RTL | OK | Low |
| 9 | Performance | Minor gap | Medium |
| 10 | Security | Gap (not previously covered) | Medium |
| 11 | Testing | Gap (breadth) | Medium |
| 12 | Accessibility | Gap (no baseline) | High |
| 13 | Scalability (SaaS) | Minor gap | Medium |
| 14 | Maintainability | Minor gap | Medium |

No **Critical** (implementation-blocking) issues. Five **High** findings require spec corrections before build — all applied below.

---

## Findings

### F1 — Engine lifecycle is coupled to the React component tree (Area 1, 4)
- **Problem:** `10`/`11` create/subscribe engines through feature hooks (`useScannerVm` + `useEngine`). If an engine instance is *owned* by a mounted component, it is destroyed on route change, resetting simulator state and making future **real-time / WebSocket-driven** or **cross-route persistent** simulator state impossible.
- **Why it matters:** production needs simulator state that survives navigation (e.g., a running scan, an in-progress scored session, a live remote feed). Component-owned engines can't provide that.
- **Severity:** High.
- **Recommended solution:** introduce an **engine registry / provider** decoupled from the component tree: engines are created once (per app session / per tool) in a `providers/EngineProvider`, held outside React, and consumed via `useEngine` (read-only subscription). Component unmount detaches the *view*, not the engine. Keep it simple — a plain module-level registry keyed by tool, hydrated by a provider; no DI framework.
- **Files/specs affected:** `10` §5/§6.3, `11` (`providers/`, `packages/*/registry`).

### F2 — Zustand singletons are SSR/SaaS-unsafe; scoring→record write-path is undefined (Area 2, 13)
- **Problem (a):** `stores/*` are module-level singletons. Under Next.js server rendering (and any future multi-user SaaS/SSR), module singletons **share state across requests/users** — a classic leak.
- **Problem (b):** scoring lives locally in engines (`06`/`10` §8) but the **learning record is global** (`recordStore`). The contract for *how a finished, scored session is committed to the record* is unspecified — multiple tools must write one record.
- **Why it matters:** (a) is a correctness/security bug the moment SSR or multi-user is added; (b) is the backbone of "user progress + scoring + learning modules" and is currently a hole.
- **Severity:** High.
- **Recommended solution:** (a) create stores via a **per-request/provider factory** (`createStore()` in a `StoreProvider`), not module singletons; client stays single-instance, server gets a fresh store per request. (b) define a typed **`SessionResult` event**: engines emit `onComplete(result)` (tool, scenarioId, score, steps, verdict); a `recordStore.commitResult()` reducer appends it; persistence is the future-API seam. Keep engines ignorant of the store (they emit; the bridge routes).
- **Files/specs affected:** `10` §6, `11` (`providers/StoreProvider`, `stores/recordStore`), `12` Phase 9.

### F3 — View-models can become god-objects (Area 3, 14)
- **Problem:** the source `renderVals()` returns ~380 flat keys. A 1:1 port to a single `useScannerVm` recreates that monolith.
- **Why it matters:** hard to test, memoize, and maintain; defeats the component decomposition in `03`.
- **Severity:** Medium.
- **Recommended solution:** split view-models **per screen/panel** (e.g., `useScannerNetworkVm`, `useScannerLiveDataVm`) selecting only their slice of engine state; compose at the route. Enforce with a soft size budget in review.
- **Files/specs affected:** `10` §4/§5, `11` (`features/*/hooks/*`), `12` Phase 8/9.

### F4 — No transport abstraction for real-time / WebSocket (Area 4, 9)
- **Problem:** engines are driven only by a local `Clock` (`10` §8.1). WebSocket/real-time simulator state has a **seam but no shape**.
- **Why it matters:** the capability list explicitly requires future WebSocket + real-time state. Retrofitting a transport into local-only engines later is invasive.
- **Severity:** High.
- **Recommended solution:** define an **`InputSource` interface** in `sim-core` (`subscribe(onTick|onMessage)`, `dispatch(intent)`), with a `LocalClockSource` today and a `RemoteChannelSource` (WebSocket) later — same engine, swappable driver. Add a `transport/` boundary in the data/API layer that owns the future WS client. Do **not** build the WS client now; only the interface.
- **Files/specs affected:** `10` §8/§15, `11` (`packages/sim-core/io.ts`, `data/transport/`).

### F5 — No content model for scenarios / learning modules (Area 5, 13, 14)
- **Problem:** the source hard-codes scenarios (Scanner "Scenario 12", fixed faults, fixed tree). `06`/`10` model *instances* but define **no `Scenario` / `Module` schema** for authoring *more* — yet the capability list requires "multiple simulator scenarios" and "learning modules".
- **Why it matters:** without a scenario/module data model, every new exercise is a code change; progress/scoring can't reference stable scenario ids; the learning record can't scale.
- **Severity:** High.
- **Recommended solution:** add a normalized **`Scenario`** entity (`id, tool, vehicleId, focusRef, seededFaults[], steps[], rubric, difficulty`) and a **`Module`** entity (`id, title, scenarioIds[], prerequisites[], certificationId?`). Existing source content becomes the **seed set** (Scenario 12 etc.). Engines take a `scenarioId` and load its definition via a repository — turning fixed logic into data-driven scenarios without changing engine code.
- **Files/specs affected:** `10` §7/§8, `11` (`data/scenarios/`, `data/modules/`, `data/schema/`), `12` Phase 7.

### F6 — Routing: state/URL split and locale static-gen unspecified (Area 6)
- **Problem:** `10` §3 leaves the URL-vs-local-state boundary partly implicit; `[locale]` × Scanner catch-all static generation not stated.
- **Why it matters:** inconsistent deep-linking; potential build/SSG ambiguity.
- **Severity:** Low.
- **Recommended solution:** codify the rule (navigable place = route; ephemeral selection = local/query), enumerate which tool sub-states are query params, and set `generateStaticParams` for locales. Already largely covered; make explicit.
- **Files/specs affected:** `10` §3 (clarify), `12` Phase 5.

### F7 — Translatable *engine/data prose* is misclassified as canonical (Area 7, 14)
- **Problem:** `14` §0 splits Class-A chrome (translatable) from Class-B canonical technical data. But much learner-facing **prose lives in the data/engine layer**: DTC "possible cause" descriptions, diagnostic-tree hints, step instructions, fail diagnoses, coach text, training feedback, the AI script, fault descriptions (`06`). These are **read for learning** and must be translatable — yet they are currently English literals inside data/engines, violating "no hardcoded English" and the translatability goal.
- **Why it matters:** without this, Arabic/French users get English instructional prose while the UI chrome is localized — inconsistent and a real i18n defect. It also re-couples content to language.
- **Severity:** High.
- **Recommended solution:** add a **third class — "Class C: localizable content"** — prose tied to a stable data id, stored as message keys addressed by id (e.g., `scanner.tree.{scenarioId}.step.{n}.hint`, `oscilloscope.fault.{code}.desc`). Data holds the **id + canonical values**; the message catalog holds the translatable prose. Class-B (codes, pins, units, measurements) still never translates. Engines emit ids + values; the UI resolves prose via keys.
- **Files/specs affected:** `14` §0/§3/§18 (add Class C), `10` §7 (data holds ids not prose), `12` Phase 6/7/14, `13` §O.

### F8 — RTL: no residual blocking issues (Area 8)
- **Problem:** none material. `14` §4–§13 covers logical props, mirrored icons, LTR technical islands, Arabic tracking, bidi isolation.
- **Severity:** Low. **No action** beyond confirming the F7 prose fix renders in RTL.

### F9 — Real-time render-storm risk; offline not addressed (Area 9, + Offline capability)
- **Problem (a):** the 420 ms tick is handled, but a future higher-frequency WebSocket feed could cause render storms (`10` §12 mentions memoization but not input batching).
- **Problem (b):** the **original app is offline** (self-contained bundle); the rebuild is online-by-default. "Offline capability where appropriate" is unaddressed.
- **Why it matters:** (a) UX/perf under real-time; (b) parity with the source's offline nature — and a natural fit since all content is static.
- **Severity:** Medium.
- **Recommended solution:** (a) batch/throttle inbound updates at the `InputSource`→engine boundary (coalesce to a frame) so render frequency is decoupled from message frequency. (b) add an **optional PWA layer** (app-shell + static assets + datasets cached via service worker). Because data is static, this needs **no sync/conflict logic** — keep it minimal. Defer offline write-back until a backend exists.
- **Files/specs affected:** `10` §12/§14 (add offline), `11` (`public/manifest.webmanifest`, `app/sw` or `next-pwa` config), `12` Phase 15.

### F10 — Security was never covered (Area 10)
- **Problem:** no prior doc addresses security. Not needed for the static demo, but the capability list adds **auth + backend API + WebSocket**, which introduce real surface.
- **Why it matters:** production SaaS must not bolt security on later.
- **Severity:** Medium (future-facing).
- **Recommended solution:** add a short **security baseline**: (1) no `dangerouslySetInnerHTML` — the source used `sc-html`/`sc-raw`; the rebuild renders via components, never raw HTML injection. (2) CSP + no inline scripts (Next defaults). (3) auth tokens via httpOnly cookies at the future `lib/session` seam; never in `localStorage`. (4) all future API calls go through the repository layer with input validation (Zod) at the boundary. (5) env/secrets server-only. No security tech added now — just documented constraints and seams.
- **Files/specs affected:** `10` (new §16 Security), `13` (add security gate), `12` Phase 16.

### F11 — Testing breadth is thin (Area 11)
- **Problem:** `11` covers engine unit tests + dataset validation. Missing: component/interaction tests, **RTL + a11y** rendering tests, navigation e2e, engine↔store contract tests, automated i18n key-coverage + pseudo-loc, visual regression.
- **Why it matters:** "production-grade" needs regression safety across UI, i18n, and a11y, not just engine math.
- **Severity:** Medium.
- **Recommended solution:** define a **test matrix**: (unit) engines + `sim-core`; (contract) engine→recordStore result commit; (component) React Testing Library incl. RTL render + basic a11y assertions (axe); (e2e) Playwright for the core navigation/bench flows; (i18n) CI key-coverage + `en-XA` pseudo-loc; (visual) optional snapshot of key screens. Reuse the existing `13` checklist as the manual acceptance layer.
- **Files/specs affected:** `11` (`tests/**` expansion), `12` Phase 13/14, `13` (already the acceptance gate).

### F12 — No accessibility baseline (Area 12)
- **Problem:** the source has essentially no a11y (`09` §13); prior docs treat a11y as an "enhancement." The capability list requires Accessibility as a first-class concern.
- **Why it matters:** production/SaaS and many procurement contexts require a baseline; retrofitting a11y into custom rail/tabs/canvas is expensive.
- **Severity:** High (as a requirement) — but **additive**, so it does not violate "no redesign."
- **Recommended solution:** mandate a **WCAG 2.1 AA-oriented baseline** that changes behaviour, not visuals: semantic landmarks (`nav`/`main`/`dialog`), keyboard operability for rail/tabs/segmented controls/sliders (native where possible, ARIA patterns otherwise), **focus management** on route/screen change and modal open/close, `aria-live="polite"` for toasts (not for the 420 ms stream — that would be noisy; provide an on-demand readout instead), `prefers-reduced-motion` support (already in `12` Phase 12), visible focus ring (the source's orange `0 0 0 3px` ring), and **text/data-table alternatives** for the SVG technical canvases (waveform/schematic/network) so non-visual users get the underlying values. Colour-contrast audit of the token set (`07`) with documented exceptions.
- **Files/specs affected:** `10` (new §17 Accessibility baseline), `09` §13 (note the baseline target), `12` Phase 6–8/13, `13` (add a11y gate).

### F13 — SaaS multi-tenant/user scoping absent from data seam (Area 13)
- **Problem:** `recordStore` and repositories are single-user/global; no `userId`/`tenantId` concept for future SaaS.
- **Why it matters:** the learning record, scoring, and coverage entitlements are per-user in SaaS; the seam must be able to carry identity without reshaping the UI.
- **Severity:** Medium.
- **Recommended solution:** make repository interfaces **identity-capable** (methods accept an optional `context: { userId?, tenantId? }`), supplied by the future `lib/session`. Today the `StaticRepository` ignores it. No multi-tenant infrastructure now — only the interface shape, so the UI/engines never change when identity arrives.
- **Files/specs affected:** `10` §7/§15, `11` (`data/repositories/types`).

### F14 — Maintainability: content-as-code, versioning, duplication (Area 14)
- **Problem:** (a) F7's prose-in-data and F5's missing scenario schema both hurt maintainability; (b) datasets/scenarios need **versioning** for coverage-pack evolution ("coverage 2026.7"); (c) ensure the single `statusColor()` and token layer truly eliminate the source's inline-literal duplication.
- **Why it matters:** long-term evolvability of content and design.
- **Severity:** Medium.
- **Recommended solution:** (a)/(b) resolved by F5+F7 plus a `version`/`coverage` field on datasets and Zod-validated schemas; (c) confirm lint bans inline hex/px in reusable components (`12` Phase 3/16). Document a content-authoring note (scenarios/modules/prose are data + keys, not code).
- **Files/specs affected:** `10` §7, `11` (`data/schema/*`), `12` Phase 16.

---

## Corrections Applied

Because no code exists, all High/Medium findings are resolved at the specification level. The following edits were made:

- **`10_TECHNICAL_ARCHITECTURE.md`** — added: engine registry/provider (F1); per-request store factory + `SessionResult`/`commitResult` contract (F2); `InputSource` transport seam for real-time/WebSocket (F4); `Scenario`/`Module` content model (F5); Class-C localizable content note in Data layer (F7); identity-capable repositories (F13); **new §16 Security baseline** (F10); **new §17 Accessibility baseline** (F12); offline/PWA note (F9); real-time input batching (F9).
- **`11_PROJECT_FILE_TREE.md`** — added: `providers/` (EngineProvider, StoreProvider), `packages/sim-core/io.ts`, `data/scenarios/`, `data/modules/`, `data/transport/`, PWA files (`public/manifest.webmanifest`, service worker), expanded `tests/**` (component/RTL/a11y/e2e/i18n), repository identity note.
- **`14_INTERNATIONALIZATION_SPECIFICATION.md`** — added **Class C (localizable content)** classification and keyed-by-id prose strategy; per-route namespace lazy-loading note (F7, perf).
- **`12`/`13`** — noted where phases/gates absorb the new security, a11y, scenario, and testing items (no structural rewrite needed; they reference the updated `10`/`11`/`14`).

None of these add new *runtime technologies* beyond an **optional PWA/service worker** (justified by the source's offline nature) — they add **interfaces, data models, and documented constraints**. No microservices, no premature backend, no DI framework.

---

## Residual risks accepted for now (documented, not blocking)
- **Tablet/mobile shell layout** remains undefined in the source (`09` §11); the rebuild keeps components fluid and defers a defined layout to a product decision. Not invented here.
- **WebSocket/real-time, auth, backend, multi-tenant** are **seams only** — deliberately not implemented (out of scope; no backend). Their interfaces exist so they can arrive without touching UI/engine layers.
- **Visual-regression tooling** is recommended but optional; the manual `13` checklist is the binding acceptance gate.

---

## Confidence statement
The base architecture (client app · framework-free engines · shared Zustand · repository/data seam · i18n) is sound and appropriately simple. With the corrections applied, it demonstrably supports: complex simulator UI, an independent engine driveable by local **or** remote sources, shared state, **data-driven scenarios & modules**, per-user progress/scoring via a defined result contract, future auth/API/WebSocket through typed seams, EN/FR (LTR) and Arabic (RTL) including localizable instructional prose, responsive behaviour faithful to source, an additive a11y baseline, performance under real-time load, error handling, optional offline, and a future SaaS shape — **without over-engineering**.

---

# ARCHITECTURE STATUS:
# READY FOR IMPLEMENTATION

*(Ready contingent on the Corrections Applied above, which have been written into `10`, `11`, and `14`. Re-run this review only if the scenario/module model, engine-provider/transport seam, or a11y/security baselines are altered during build.)*
