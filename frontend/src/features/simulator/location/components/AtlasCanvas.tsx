import clsx from "clsx";

import type { AtlasState, LocationAtlasEngine } from "@/features/simulator/location/engine/atlas.engine";
import { LOC_VIEWS, locByKey, type LocComponent } from "@/features/simulator/location/data/location.data";

const SENSOR_KEYS = ["L3", "L1", "H3", "T1", "I2", "X1", "X7", "X8", "V1", "U2"];

/**
 * Atlas workspace — the vendored view diagram with an image-relative hotspot layer.
 * Hotspots are positioned as a percentage of the diagram's intrinsic W×H (the exact
 * source coordinates), so they stay aligned at every viewport and zoom. Clicking a
 * hotspot calls engine.select (browse) or answers (training/quiz). Outlines /
 * dim-others / zoom are engine state.
 */
export function AtlasCanvas({
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

  const view = state.view;
  const sel = engine.component(state.selected);
  const target = state.mode === "train" ? state.tTarget : state.mode === "quiz" ? state.qList[state.qIdx] : null;

  const group = engine.system();
  const members = group ? new Set([...group.fuses, ...group.relays, ...group.ecus]) : null;
  const sysView = view === "system";

  const sensorItem =
    sel && sel.kind === "sensor"
      ? sel
      : locByKey(state.recent.find((k) => SENSOR_KEYS.includes(k)) ?? "L3")!;

  let img: string | null = null;
  let W = 1000,
    H = 636;
  let spots: LocComponent[] = [];
  let cap = tr(`location.view.${view}`, view);
  if (view === "sensors") {
    img = sensorItem.img;
    W = sensorItem.hot.W;
    H = sensorItem.hot.H;
    spots = [sensorItem];
    cap = `${sensorItem.ref} · ${sensorItem.name}`;
  } else if (view === "vehicle") {
    img = `/assets/simulator/views-${sensorItem.ref}.png`;
    W = 1000;
    H = 526;
    cap = `${tr("location.view.vehicle", "Vehicle")} · ${sensorItem.ref}`;
  } else {
    const v = LOC_VIEWS.find((x) => x.id === view)!;
    img = v.img;
    W = v.W;
    H = v.H;
    spots = engine.components().filter((c) => c.view === view || (sysView && c.view === "fuse"));
    if (sysView && group) cap = `${tr("location.view.system", "Systems")} · ${group.label}`;
  }

  const favSet = new Set(state.favs);

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-[#F8F7F6] p-4 dark:bg-[#101013]">
      <div
        dir="ltr"
        className="mx-auto"
        style={{ maxWidth: 900, transform: `scale(${state.zoom})`, transformOrigin: "top center" }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-[#3A3A3A]/10 bg-white shadow-[0_14px_36px_rgba(58,58,58,0.12)] ring-1 ring-[#3A3A3A]/5 dark:border-white/10 dark:bg-[#1b1b20] dark:shadow-black/40 dark:ring-white/5">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={cap} className="block h-auto w-full select-none" draggable={false} />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center text-sm text-[#3A3A3A]/50 dark:text-white/50">{cap}</div>
          )}
          {/* hotspot layer */}
          {spots.map((c) => {
            const isSel = c.key === state.selected;
            const isTarget = target === c.key && state.mode !== "browse";
            const revealTarget = isTarget && state.tReveal;
            const isMember = members ? members.has(c.key) : false;
            const dim = sysView ? !!members && !isMember : state.dimOthers && !!state.selected && !isSel && state.mode === "browse";
            const showBox = sysView ? true : state.outlines || isSel || state.mode === "browse";
            const isFav = favSet.has(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => engine.select(c.key)}
                aria-label={c.name}
                aria-current={isSel || (sysView && isMember) ? "true" : undefined}
                title={`${c.ref} · ${c.name}`}
                className={clsx(
                  "absolute rounded-md transition focus:outline-none focus:ring-2 focus:ring-[#F47822]/40",
                  showBox ? "border-2" : "border-2 border-transparent hover:border-[#F47822]/70 hover:bg-[#F47822]/15",
                  isSel
                    ? "border-[#F47822] bg-[#F47822]/25"
                    : sysView && isMember
                      ? "border-[#F47822] bg-[#F47822]/20"
                      : revealTarget
                        ? "border-emerald-500 bg-emerald-500/20"
                        : "border-[#F47822]/40",
                  dim && "opacity-20",
                )}
                style={{
                  left: `${(c.hot.x / W) * 100}%`,
                  top: `${(c.hot.y / H) * 100}%`,
                  width: `${(c.hot.w / W) * 100}%`,
                  height: `${(c.hot.h / H) * 100}%`,
                }}
              >
                {isSel ? (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#F47822] px-1.5 py-0.5 font-mono text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(244,120,34,0.4)]">
                    {c.ref}
                  </span>
                ) : null}
                {isFav && !isSel ? (
                  <span className="absolute -top-2 -right-2 grid h-4 w-4 place-items-center rounded-full bg-amber-400 text-[10px] font-black text-white shadow">
                    ★
                  </span>
                ) : null}
              </button>
            );
          })}
          {/* stage caption */}
          <div
            dir="ltr"
            className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-3 pb-2 pt-6"
          >
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-white/95">{cap}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
