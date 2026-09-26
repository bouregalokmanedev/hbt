"use client";

import type { SchematicWorkspaceEngine, WorkspaceState, WorkspaceMode, WorkspaceView } from "@sim/schematic";
import { SCH_SHEET, schByKey } from "@/data/schematic/workspace";
import { cn } from "@/lib/cn";

const MODES: WorkspaceMode[] = ["study", "trace", "training", "practice", "exam"];
const VIEWS: WorkspaceView[] = ["schematic", "circuit"];

/** Top bar — menu / brand / search / mode control / layers / print / export.
 * Print & Export are static in the source (no handler) — rendered inert. */
export function TopBar({ engine, state, t }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any }) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2.5 border-b border-line bg-paper px-3.5">
      <button type="button" onClick={() => engine.toggleDrawer()} aria-label={t("controls.menu")} className="focus-ring h-8 w-8 rounded-lg border border-line2 text-neutralx-fg2 lg:hidden">☰</button>
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-xs" style={{ background: "#F47822" }} />
        <span className="t-code text-[10px] tracking-[0.15em] text-neutralx-fg2">{t("brand")}</span>
      </div>
      <span className="h-4 w-px bg-line" />
      <button type="button" onClick={() => engine.openSearch()} className="focus-ring flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-paper2 px-2.5 text-start t-body-sm text-neutralx-fg4 md:max-w-xs">
        <span aria-hidden>⌕</span>
        <span className="hidden truncate sm:inline">{t("search.button")}</span>
        <span dir="ltr" className="ms-auto hidden rounded border border-line px-1 t-code text-[10px] sm:inline">⌘K</span>
      </button>
      <div className="flex-1" />
      <div className="inline-flex items-center rounded-[9px] border border-line bg-paper2 p-0.5">
        {MODES.map((m) => (
          <button key={m} type="button" onClick={() => engine.setMode(m)} aria-current={state.mode === m ? "page" : undefined}
            className={cn("focus-ring rounded-md px-2.5 py-1 t-cta", state.mode === m ? "bg-mod-schematic text-white" : "text-neutralx-fg3")}>
            {t(`mode.${m}`)}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => engine.toggleLayersPanel()} aria-pressed={state.showLayers}
        className={cn("focus-ring rounded-lg border px-2.5 py-1.5 t-cta", state.showLayers ? "border-mod-schematic bg-mod-schematicBg text-mod-schematic" : "border-line2 text-neutralx-fg2")}>
        ☰ {t("layers.title")}
      </button>
      <button type="button" disabled aria-disabled className="hidden rounded-lg border border-line2 px-2.5 py-1.5 t-cta text-neutralx-fg4 opacity-60 lg:inline">{t("controls.print")}</button>
      <button type="button" disabled aria-disabled className="hidden rounded-lg border border-line2 px-2.5 py-1.5 t-cta text-neutralx-fg4 opacity-60 lg:inline">{t("controls.export")}</button>
    </div>
  );
}

/** Sub bar — breadcrumb + sheet chip / view tabs / layout A-B-C / device / trace bar / zoom group. */
export function SubBar({ engine, state, t, tc, layout, setLayout }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any; layout: "a" | "b" | "c"; setLayout: (l: "a" | "b" | "c") => void }) {
  const isTrace = state.mode === "trace";
  const sheet = schByKey("R16")!;
  return (
    <div className="flex h-10 shrink-0 flex-wrap items-center gap-2.5 border-b border-line bg-paper px-3.5">
      <div className="hidden min-w-0 items-center gap-1.5 truncate t-body-sm text-neutralx-fg4 md:flex">
        <span>{t("systems.engine")}</span><span>/</span>
        <span dir="ltr" className="font-medium text-ink">R16 — {sheet.name}</span>
        <span className="rounded border border-mod-schematic/25 bg-mod-schematicBg px-1.5 py-0.5 t-code text-[10px] text-mod-schematic">{t("sheet")}</span>
      </div>
      <span className="hidden h-5 w-px bg-line md:block" />
      <div className="inline-flex items-center rounded-[7px] border border-line bg-paper2 p-0.5">
        {VIEWS.map((v) => (
          <button key={v} type="button" onClick={() => engine.setView(v)} aria-current={state.view === v ? "page" : undefined}
            className={cn("focus-ring rounded-md px-2.5 py-1 t-cta", state.view === v ? "bg-paper text-ink shadow-seg" : "text-neutralx-fg3")}>
            {t(`view.${v}`)}
          </button>
        ))}
      </div>
      <div className="hidden items-center gap-1.5 lg:flex">
        <span className="t-code text-[9.5px] tracking-[0.1em] text-neutralx-fg4">{t("layout.label")}</span>
        <div className="inline-flex items-center rounded-[7px] border border-line bg-paper2 p-0.5">
          {(["a", "b", "c"] as const).map((l) => (
            <button key={l} type="button" onClick={() => setLayout(l)} title={t(`layout.${l}`)} aria-current={layout === l ? "true" : undefined}
              className={cn("focus-ring rounded-md px-2 py-1 t-cta uppercase", layout === l ? "bg-paper text-ink shadow-seg" : "text-neutralx-fg3")}>{l}</button>
          ))}
        </div>
      </div>

      {isTrace ? (
        <div className="flex items-center gap-2">
          <span className="t-code text-[10px] tracking-[0.08em] text-mod-schematic">{t("trace.kicker")}</span>
          {engine.traces().map((tr) => (
            <button key={tr.id} type="button" onClick={() => engine.setTrace(tr.id)} aria-current={state.trace === tr.id ? "true" : undefined}
              className={cn("focus-ring rounded-md px-2 py-1 t-cta", state.trace === tr.id ? "bg-paper text-ink shadow-seg" : "text-neutralx-fg3")}>
              {tc(tr.labelId)}
            </button>
          ))}
          <button type="button" onClick={() => (state.tracePlaying ? engine.tracePause() : engine.tracePlay())} className="focus-ring rounded-full bg-mod-schematic px-2.5 py-1 t-cta text-white">
            {state.tracePlaying ? `⏸ ${t("trace.pause")}` : `▶ ${t("trace.play")}`}
          </button>
        </div>
      ) : null}

      <div className="ms-auto flex items-center gap-2">
        <span className="hidden t-code text-[11px] text-neutralx-fg4 md:inline">{t("layers.count", { n: engine.layersOnCount() })}</span>
      </div>
    </div>
  );
}
