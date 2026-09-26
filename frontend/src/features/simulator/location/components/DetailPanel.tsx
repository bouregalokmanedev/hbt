import clsx from "clsx";

import type { AtlasState, LocationAtlasEngine } from "@/features/simulator/location/engine/atlas.engine";
import { LOC_VEHICLE } from "@/features/simulator/location/data/location.data";

const SLOC_KEYS = new Set(["L3", "L1", "H3", "T1", "I2", "X1", "X7", "X8", "V1", "U2"]);

/** Right detail panel (Browse) — component identity + OEM/reference/category/system/ zone/location/vehicle/notes, favourite star, Vehicle views + Practise this. */
export function DetailPanel({
  engine,
  state,
  t,
  tc,
}: {
  engine: LocationAtlasEngine;
  state: AtlasState;
  t?: (key: string, opts?: Record<string, unknown>) => string;
  tc?: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const tr = (key: string, fallback: string, opts?: Record<string, unknown>) =>
    t ? (t(key, { defaultValue: fallback, ...opts } as Record<string, unknown>) as string) : fallback;
  const trc = (key: string, fallback: string, opts?: Record<string, unknown>) =>
    tc ? (tc(key, { defaultValue: fallback, ...opts } as Record<string, unknown>) as string) : fallback;

  const c = engine.component(state.selected);
  if (!c) return null;
  const fav = state.favs.includes(c.key);
  const hasProse = SLOC_KEYS.has(c.key);
  const location = hasProse ? trc(`location.${c.key}.location`, c.place ?? c.zone) : (c.place ?? c.zone);
  const notes = hasProse ? trc(`location.${c.key}.mount`, "") : undefined;

  const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex gap-3 py-1.5">
      <dt className="w-28 shrink-0 text-xs font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{label}</dt>
      <dd dir={mono ? "ltr" : undefined} className={clsx("min-w-0 flex-1 text-sm text-[#3A3A3A] dark:text-white", mono && "font-mono text-xs")}>
        {value}
      </dd>
    </div>
  );

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto border-s border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
      <div className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
              {tr(`location.cat.${c.cat}`, c.cat)}
            </div>
            <h2 className="mt-0.5 flex items-center gap-2 text-lg font-black text-[#3A3A3A] dark:text-white">
              <span dir="ltr" className="rounded bg-[#F47822]/10 px-1.5 py-0.5 font-mono text-xs font-bold text-[#F47822]">
                {c.ref}
              </span>
              {c.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => engine.toggleFavourite(c.key)}
            aria-pressed={fav}
            aria-label={tr("location.sidebar.favourites", "Favourites")}
            className={clsx("rounded-lg px-1.5 py-1 text-lg focus:outline-none focus:ring-2 focus:ring-[#F47822]/20", fav ? "text-amber-400" : "text-[#3A3A3A]/30 dark:text-white/30")}
          >
            {fav ? "★" : "☆"}
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => engine.setView("vehicle")}
            className="flex-1 rounded-xl border border-[#3A3A3A]/10 bg-white px-3 py-1.5 text-xs font-black text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
          >
            {tr("location.detail.vehicleViews", "Vehicle views")}
          </button>
          <button
            type="button"
            onClick={() => engine.practise(c.key)}
            className="flex-1 rounded-xl bg-[#F47822] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#E96D18] focus:outline-none focus:ring-2 focus:ring-[#F47822]/30"
          >
            {tr("location.detail.practise", "Practise this")}
          </button>
        </div>
      </div>

      <dl className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <Row label={tr("location.detail.component", "Component")} value={c.name} />
        {c.oem ? <Row label={tr("location.detail.oem", "OEM ref")} value={c.oem} mono /> : null}
        <Row label={tr("location.detail.reference", "Reference")} value={c.ref} mono />
        <Row label={tr("location.detail.category", "Category")} value={tr(`location.cat.${c.cat}`, c.cat)} />
        <Row label={tr("location.detail.system", "Vehicle system")} value={c.sys} />
        {c.amp ? <Row label={tr("location.detail.amp", "Rating")} value={c.amp} mono /> : null}
        <Row label={tr("location.detail.zone", "Zone")} value={c.zone} />
        <Row label={tr("location.detail.location", "Location")} value={location} />
        <Row label={tr("location.detail.vehicle", "Vehicle")} value={LOC_VEHICLE} mono />
      </dl>

      {notes ? (
        <div className="p-4">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
            {tr("location.detail.notes", "Notes")}
          </div>
          <p className="mt-1.5 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">{notes}</p>
        </div>
      ) : null}
    </aside>
  );
}
