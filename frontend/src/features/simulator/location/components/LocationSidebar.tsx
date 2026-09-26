import clsx from "clsx";

import type { AtlasState, LocationAtlasEngine } from "@/features/simulator/location/engine/atlas.engine";
import { LOC_COMPONENTS, LOC_CATEGORIES, LOC_SYSTEM_GROUPS, locByKey } from "@/features/simulator/location/data/location.data";

const CAT_DOT: Record<string, string> = {
  all: "#F47822",
  Sensors: "#1F6AE1",
  Actuators: "#0E9F6E",
  ECUs: "#131A26",
  Relays: "#F59E0B",
  Fuses: "#D92D20",
  "Ground points": "#8B5A2B",
  systems: "#F47822",
};

/**
 * Left sidebar — search, the 8 category filters (+ counts), the vehicle-system
 * registry (+ counts), the filtered component list, and favourites. Selection /
 * filtering / search / favourites all flow through the engine.
 */
export function LocationSidebar({
  engine,
  state,
  t,
}: {
  engine: LocationAtlasEngine;
  state: AtlasState;
  t?: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const tr = (key: string, fallback: string, opts?: Record<string, unknown>) =>
    t ? (t(key, { defaultValue: fallback, ...opts } as Record<string, unknown>) as string) : fallback;

  const filtered = engine.filtered();
  const favComps = state.favs.map((k) => locByKey(k)).filter(Boolean);

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-auto border-e border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
      <div className="border-b border-[#3A3A3A]/10 p-3 dark:border-white/10">
        <input
          type="search"
          value={state.search}
          onChange={(e) => engine.setSearch(e.target.value)}
          placeholder={tr("location.sidebar.search", "Search components, refs, circuits")}
          aria-label={tr("location.sidebar.search", "Search components, refs, circuits")}
          className="w-full rounded-xl border border-[#3A3A3A]/10 bg-[#F8F7F6] px-3 py-2 text-sm placeholder:text-[#3A3A3A]/40 focus:border-[#F47822]/40 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40"
        />
        <div className="mt-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
          {tr("location.sidebar.inDataSet", "{n} components in data set", { n: LOC_COMPONENTS.length })}
        </div>
      </div>

      {/* categories */}
      <div className="border-b border-[#3A3A3A]/10 py-2 dark:border-white/10">
        <div className="px-4 pb-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
          {tr("location.sidebar.categories", "Categories")}
        </div>
        {LOC_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => engine.setCategory(c.id)}
            aria-current={state.cat === c.id && !state.sys ? "true" : undefined}
            className={clsx(
              "flex w-full items-center gap-2 px-4 py-1.5 text-start transition focus:outline-none focus:ring-2 focus:ring-[#F47822]/20",
              state.cat === c.id && !state.sys ? "bg-[#F47822]/10" : "hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5",
            )}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CAT_DOT[c.id] || "#9AA0A6" }} />
            <span
              className={clsx(
                "flex-1 text-sm",
                state.cat === c.id && !state.sys ? "font-bold text-[#F47822]" : "text-[#3A3A3A] dark:text-white",
              )}
            >
              {tr(`location.cat.${c.id}`, c.id)}
            </span>
            <span dir="ltr" className="font-mono text-xs text-[#3A3A3A]/40 dark:text-white/40">
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {/* component list (filtered) */}
      <div className="min-h-0 flex-1 overflow-auto border-b border-[#3A3A3A]/10 py-2 dark:border-white/10">
        {filtered.length === 0 ? (
          <div className="px-4 py-3 text-sm text-[#3A3A3A]/60 dark:text-white/60">{tr("location.empty", "No components match your filters.")}</div>
        ) : (
          filtered.slice(0, 200).map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => engine.select(c.key)}
              aria-current={state.selected === c.key ? "true" : undefined}
              className={clsx(
                "flex w-full items-center gap-2 px-4 py-1.5 text-start transition focus:outline-none focus:ring-2 focus:ring-[#F47822]/20",
                state.selected === c.key ? "bg-[#F47822]/10" : "hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5",
              )}
            >
              <span
                dir="ltr"
                className="w-9 shrink-0 rounded bg-[#3A3A3A]/5 px-1 py-0.5 text-center font-mono text-xs font-bold text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60"
              >
                {c.ref}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-[#3A3A3A] dark:text-white">{c.name}</span>
            </button>
          ))
        )}
      </div>

      {/* vehicle systems */}
      <details className="border-b border-[#3A3A3A]/10 dark:border-white/10">
        <summary className="cursor-pointer px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
          {tr("location.sidebar.systems", "Vehicle systems")} · {tr("location.sidebar.nSystems", "{n} systems", { n: LOC_SYSTEM_GROUPS.length })}
        </summary>
        <div className="max-h-48 overflow-auto pb-2">
          {LOC_SYSTEM_GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => engine.setSystem(g.key)}
              aria-current={state.sys === g.key ? "true" : undefined}
              className={clsx(
                "flex w-full items-center gap-2 px-4 py-1 text-start transition focus:outline-none focus:ring-2 focus:ring-[#F47822]/20",
                state.sys === g.key ? "bg-[#F47822]/10" : "hover:bg-[#3A3A3A]/5 dark:hover:bg-white/5",
              )}
            >
              <span dir="ltr" className="min-w-0 flex-1 truncate text-sm text-[#3A3A3A] dark:text-white">
                {g.label}
              </span>
              <span dir="ltr" className="font-mono text-xs text-[#3A3A3A]/40 dark:text-white/40">
                {g.total}
              </span>
            </button>
          ))}
        </div>
      </details>

      {/* favourites */}
      {favComps.length ? (
        <div className="p-3">
          <div className="pb-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
            {tr("location.sidebar.favourites", "Favourites")}
          </div>
          {favComps.map((c) => (
            <button
              key={c!.key}
              type="button"
              onClick={() => engine.select(c!.key)}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-start transition hover:bg-[#3A3A3A]/5 focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:hover:bg-white/5"
            >
              <span dir="ltr" className="rounded bg-[#F47822]/10 px-1 py-0.5 font-mono text-xs font-bold text-[#F47822]">
                {c!.ref}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-[#3A3A3A] dark:text-white">{c!.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
