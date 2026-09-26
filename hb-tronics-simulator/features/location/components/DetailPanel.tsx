"use client";

import type { LocationAtlasEngine, AtlasState } from "@sim/location";
import { LOC_VEHICLE } from "@/data/location/atlas";
import { cn } from "@/lib/cn";

const SLOC_KEYS = new Set(["L3", "L1", "H3", "T1", "I2", "X1", "X7", "X8", "V1", "U2"]);

/** Right detail panel (Browse) — component identity + OEM/reference/category/system/
 * zone/location/vehicle/notes, favourite star, Vehicle views + Practise this. */
export function DetailPanel({ engine, state, t, tc }: { engine: LocationAtlasEngine; state: AtlasState; t: any; tc: any }) {
  const c = engine.component(state.selected);
  if (!c) return null;
  const fav = state.favs.includes(c.key);
  const hasProse = SLOC_KEYS.has(c.key);
  const location = hasProse ? tc(`location.${c.key}.location`) : c.place ?? c.zone;
  const notes = hasProse ? tc(`location.${c.key}.mount`) : undefined;

  const Row = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
    <div className="flex gap-3 py-1.5">
      <dt className="w-28 shrink-0 t-body-sm text-neutralx-fg3">{label}</dt>
      <dd dir={mono ? "ltr" : undefined} className={cn("min-w-0 flex-1 text-ink", mono ? "t-code" : "t-body-sm")}>{value}</dd>
    </div>
  );

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto border-s border-line bg-paper">
      <div className="border-b border-line p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t(`cat.${c.cat}`)}</div>
            <h2 className="mt-0.5 flex items-center gap-2 t-title text-ink" style={{ fontSize: 18 }}>
              <span dir="ltr" className="rounded-xs bg-mod-locationBg px-1.5 py-0.5 t-code text-mod-location">{c.ref}</span>
              {c.name}
            </h2>
          </div>
          <button type="button" onClick={() => engine.toggleFavourite(c.key)} aria-pressed={fav} aria-label={t("sidebar.favourites")} className={cn("focus-ring text-lg", fav ? "text-warn-amber" : "text-neutralx-fg4")}>{fav ? "★" : "☆"}</button>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => engine.setView("vehicle")} className="focus-ring flex-1 rounded-md border border-line2 px-3 py-1.5 t-cta text-ink hover:border-mod-location">{t("detail.vehicleViews")}</button>
          <button type="button" onClick={() => engine.practise(c.key)} className="focus-ring flex-1 rounded-md bg-mod-location px-3 py-1.5 t-cta text-white">{t("detail.practise")}</button>
        </div>
      </div>

      <dl className="border-b border-line p-4">
        <Row label={t("detail.component")} value={c.name} />
        {c.oem ? <Row label={t("detail.oem")} value={c.oem} mono /> : null}
        <Row label={t("detail.reference")} value={c.ref} mono />
        <Row label={t("detail.category")} value={t(`cat.${c.cat}`)} />
        <Row label={t("detail.system")} value={c.sys} />
        {c.amp ? <Row label={t("detail.amp")} value={c.amp} mono /> : null}
        <Row label={t("detail.zone")} value={c.zone} />
        <Row label={t("detail.location")} value={location} />
        <Row label={t("detail.vehicle")} value={LOC_VEHICLE} mono />
      </dl>

      {notes ? (
        <div className="p-4">
          <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("detail.notes")}</div>
          <p className="mt-1.5 t-body-sm text-neutralx-fg3">{notes}</p>
        </div>
      ) : null}
    </aside>
  );
}
