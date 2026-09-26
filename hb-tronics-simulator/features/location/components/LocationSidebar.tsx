"use client";

import type { LocationAtlasEngine, AtlasState } from "@sim/location";
import { LOC_COMPONENTS, LOC_CATEGORIES, LOC_SYSTEM_GROUPS, locByKey } from "@/data/location/atlas";
import { cn } from "@/lib/cn";

const CAT_DOT: Record<string, string> = { all: "#F47822", Sensors: "#1F6AE1", Actuators: "#0E9F6E", ECUs: "#131A26", Relays: "#F59E0B", Fuses: "#D92D20", "Ground points": "#8B5A2B", systems: "#F47822" };

/**
 * Left sidebar — search, the 8 category filters (+ counts), the vehicle-system
 * registry (+ counts), the filtered component list, and favourites. Selection /
 * filtering / search / favourites all flow through the engine.
 */
export function LocationSidebar({ engine, state, t }: { engine: LocationAtlasEngine; state: AtlasState; t: any }) {
  const filtered = engine.filtered();
  const favComps = state.favs.map((k) => locByKey(k)).filter(Boolean);

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-auto border-e border-line bg-paper">
      <div className="border-b border-line p-3">
        <input
          type="search"
          value={state.search}
          onChange={(e) => engine.setSearch(e.target.value)}
          placeholder={t("sidebar.search")}
          aria-label={t("sidebar.search")}
          className="focus-ring w-full rounded-lg border border-line2 bg-paper2 px-3 py-2 t-body-sm"
        />
        <div className="mt-1.5 t-eyebrow text-neutralx-fg3">{t("sidebar.inDataSet", { n: LOC_COMPONENTS.length })}</div>
      </div>

      {/* categories */}
      <div className="border-b border-line py-2">
        <div className="px-4 pb-1 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("sidebar.categories")}</div>
        {LOC_CATEGORIES.map((c) => (
          <button key={c.id} type="button" onClick={() => engine.setCategory(c.id)} aria-current={state.cat === c.id && !state.sys ? "true" : undefined}
            className={cn("flex w-full items-center gap-2 px-4 py-1.5 text-start", state.cat === c.id && !state.sys ? "bg-mod-locationBg" : "hover:bg-fill")}>
            <span className="h-2 w-2 shrink-0 rounded-pill" style={{ background: CAT_DOT[c.id] || "#9AA0A6" }} />
            <span className={cn("flex-1 t-body-sm", state.cat === c.id && !state.sys ? "font-medium text-mod-location" : "text-ink")}>{t(`cat.${c.id}`)}</span>
            <span dir="ltr" className="t-code text-neutralx-fg4">{c.count}</span>
          </button>
        ))}
      </div>

      {/* component list (filtered) */}
      <div className="min-h-0 flex-1 overflow-auto border-b border-line py-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-3 t-body-sm text-neutralx-fg3">{t("empty")}</div>
        ) : (
          filtered.slice(0, 200).map((c) => (
            <button key={c.key} type="button" onClick={() => engine.select(c.key)} aria-current={state.selected === c.key ? "true" : undefined}
              className={cn("flex w-full items-center gap-2 px-4 py-1.5 text-start", state.selected === c.key ? "bg-mod-locationBg" : "hover:bg-fill")}>
              <span dir="ltr" className="t-code w-9 shrink-0 rounded-xs bg-fill px-1 py-0.5 text-center text-neutralx-fg3">{c.ref}</span>
              <span className="min-w-0 flex-1 truncate t-body-sm text-ink">{c.name}</span>
            </button>
          ))
        )}
      </div>

      {/* vehicle systems */}
      <details className="border-b border-line">
        <summary className="cursor-pointer px-4 py-2 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("sidebar.systems")} · {t("sidebar.nSystems", { n: LOC_SYSTEM_GROUPS.length })}</summary>
        <div className="max-h-48 overflow-auto pb-2">
          {LOC_SYSTEM_GROUPS.map((g) => (
            <button key={g.key} type="button" onClick={() => engine.setSystem(g.key)} aria-current={state.sys === g.key ? "true" : undefined}
              className={cn("flex w-full items-center gap-2 px-4 py-1 text-start", state.sys === g.key ? "bg-mod-locationBg" : "hover:bg-fill")}>
              <span dir="ltr" className="min-w-0 flex-1 truncate t-body-sm text-ink">{g.label}</span>
              <span dir="ltr" className="t-code text-neutralx-fg4">{g.total}</span>
            </button>
          ))}
        </div>
      </details>

      {/* favourites */}
      {favComps.length ? (
        <div className="p-3">
          <div className="pb-1 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("sidebar.favourites")}</div>
          {favComps.map((c) => (
            <button key={c!.key} type="button" onClick={() => engine.select(c!.key)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start hover:bg-fill">
              <span dir="ltr" className="t-code rounded-xs bg-mod-locationBg px-1 py-0.5 text-mod-location">{c!.ref}</span>
              <span className="min-w-0 flex-1 truncate t-body-sm text-ink">{c!.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
