"use client";

import type { SchematicWorkspaceEngine, WorkspaceState } from "@sim/schematic";
import { SCH_COMPONENTS, schByKey, wiresFor } from "@/data/schematic/workspace";
import { cn } from "@/lib/cn";

const SYSTEMS: { key: string; labelKey: string; count: number; dot: string; onClick: (e: SchematicWorkspaceEngine) => void }[] = [
  { key: "engine", labelKey: "systems.engine", count: SCH_COMPONENTS.length, dot: "#B85708", onClick: () => {} },
  { key: "ecu", labelKey: "systems.ecu", count: 2, dot: "#3B6FE0", onClick: (e) => e.openConnector("A") },
  { key: "can", labelKey: "systems.can", count: 2, dot: "#3B6FE0", onClick: (e) => e.select("CAN1") },
  { key: "power", labelKey: "systems.power", count: 11, dot: "#F59E0B", onClick: (e) => e.select("F_EFI1") },
];
const BOOKMARKS = [{ key: "E1", labelKey: "bookmarks.ecu" }, { key: "G_BA", labelKey: "bookmarks.ground" }, { key: "R16", labelKey: "bookmarks.relay" }];

/** Left sidebar — the 5 authentic sections (Vehicle systems / Components on sheet /
 * Recent / Training progress / Bookmarks). Filter, selection, recent and progress are
 * all engine-driven. */
export function Sidebar({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
  const comps = engine.filteredComponents();
  const pct = engine.accuracyPct();

  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-hidden border-e border-line bg-paper">
      <div className="border-b border-line p-3">
        <input
          type="search"
          value={state.filter}
          onChange={(e) => engine.setFilter(e.target.value)}
          placeholder={t("sidebar.filter")}
          aria-label={t("sidebar.filter")}
          className="focus-ring w-full rounded-lg border border-line2 bg-paper2 px-3 py-2 t-body-sm"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
        {/* Vehicle systems */}
        <section>
          <div className="px-1 pb-2 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("sidebar.systems")}</div>
          <div className="flex flex-col gap-0.5">
            {SYSTEMS.map((s, i) => (
              <button key={s.key} type="button" onClick={() => s.onClick(engine)} className={cn("flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-start hover:bg-fill", i === 0 && "bg-mod-schematicBg")}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-xs" style={{ background: s.dot }} />
                <span className={cn("flex-1 t-body-sm", i === 0 ? "font-medium text-mod-schematic" : "text-ink")}>{t(s.labelKey)}</span>
                <span dir="ltr" className="t-code text-neutralx-fg4">{s.count}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 rounded-lg border border-dashed border-line2 px-2.5 py-2 t-body-sm text-neutralx-fg4">{tc("schematic.na.systems")}</p>
        </section>

        {/* Components on sheet */}
        <section>
          <div className="flex items-baseline justify-between px-1 pb-2">
            <span className="t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("sidebar.components")}</span>
            <span dir="ltr" className="t-code text-neutralx-fg4">{comps.length}</span>
          </div>
          <div className="flex max-h-72 flex-col gap-px overflow-y-auto">
            {comps.map((c) => {
              const on = state.sel === c.key;
              return (
                <button key={c.key} type="button" onClick={() => engine.select(c.key)} onMouseEnter={() => engine.setHover(c.key)} onMouseLeave={() => engine.setHover(null)}
                  aria-current={on ? "true" : undefined}
                  className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-start", on ? "bg-mod-schematicBg" : "hover:bg-fill")}>
                  <span dir="ltr" className={cn("w-9 shrink-0 t-code", on ? "text-mod-schematic" : "text-neutralx-fg4")}>{c.code}</span>
                  <span className="min-w-0 flex-1 truncate t-body-sm text-neutralx-fg2">{c.name}</span>
                  <span dir="ltr" className="t-code text-neutralx-fg4">{wiresFor(c.key).length}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent */}
        <section>
          <div className="px-1 pb-2 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("sidebar.recent")}</div>
          <div className="flex flex-wrap gap-1.5 px-0.5">
            {state.recent.length ? state.recent.map((k) => (
              <button key={k} type="button" onClick={() => engine.select(k)} dir="ltr" className="focus-ring rounded-pill border border-line2 px-2.5 py-1 t-code text-neutralx-fg3 hover:border-mod-schematic">{schByKey(k)!.code}</button>
            )) : <span className="t-body-sm text-neutralx-fg4">{tc("schematic.na.recent")}</span>}
          </div>
        </section>

        {/* Training progress */}
        <section>
          <div className="px-1 pb-2 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("sidebar.progress")}</div>
          <div className="rounded-[10px] border border-line p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="t-title text-ink" style={{ fontSize: 22 }}>{pct}%</span>
              <span className="t-body-sm text-neutralx-fg4">{t("sidebar.attempts", { n: state.attempts })}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-pill bg-line">
              <div className="h-full rounded-pill bg-mod-schematic transition-[width]" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 t-body-sm text-neutralx-fg4">{t("sidebar.progressNote", { done: state.taskDone, total: 8 })}</p>
          </div>
        </section>

        {/* Bookmarks */}
        <section>
          <div className="px-1 pb-2 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("sidebar.bookmarks")}</div>
          <div className="flex flex-col gap-0.5">
            {BOOKMARKS.map((b) => (
              <button key={b.key} type="button" onClick={() => engine.select(b.key)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-start hover:bg-fill">
                <span className="text-mod-schematic">◆</span>
                <span className="min-w-0 flex-1 truncate t-body-sm text-neutralx-fg2">{t(b.labelKey)}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
