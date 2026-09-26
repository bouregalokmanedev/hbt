"use client";

import type { LocationAtlasEngine, AtlasState } from "@sim/location";
import { LOC_VIEWS, locByKey, type LocComponent } from "@/data/location/atlas";
import { cn } from "@/lib/cn";

const SENSOR_KEYS = ["L3", "L1", "H3", "T1", "I2", "X1", "X7", "X8", "V1", "U2"];

/**
 * Atlas workspace — the vendored view diagram with an image-relative hotspot layer.
 * Hotspots are positioned as a percentage of the diagram's intrinsic W×H (the exact
 * source coordinates), so they stay aligned at every viewport and zoom. Clicking a
 * hotspot calls engine.select (browse) or answers (training/quiz). Outlines /
 * dim-others / zoom are engine state.
 */
export function AtlasCanvas({ engine, state, t }: { engine: LocationAtlasEngine; state: AtlasState; t: any }) {
  const view = state.view;
  const sel = engine.component(state.selected);
  const target = state.mode === "train" ? state.tTarget : state.mode === "quiz" ? state.qList[state.qIdx] : null;

  // the selected system group (Systems view) + its member keys, for member styling
  const group = engine.system();
  const members = group ? new Set([...group.fuses, ...group.relays, ...group.ecus]) : null;
  const sysView = view === "system";

  // sensor shown in the Sensors / Vehicle views (selected sensor, else recent, else L3)
  const sensorItem =
    sel && sel.kind === "sensor"
      ? sel
      : locByKey(state.recent.find((k) => SENSOR_KEYS.includes(k)) ?? "L3")!;

  // resolve the diagram image + coordinate space + visible hotspots for this view
  let img: string | null = null;
  let W = 1000, H = 636;
  let spots: LocComponent[] = [];
  let cap = t(`view.${view}`) as string;
  if (view === "sensors") {
    img = sensorItem.img; W = sensorItem.hot.W; H = sensorItem.hot.H; spots = [sensorItem];
    cap = `${sensorItem.ref} · ${sensorItem.name}`;
  } else if (view === "vehicle") {
    // authentic "4-view locator" — the per-sensor composite body views (1000×526)
    img = `/assets/simulator/views-${sensorItem.ref}.png`; W = 1000; H = 526;
    cap = `${t("view.vehicle")} · ${sensorItem.ref}`;
  } else {
    const v = LOC_VIEWS.find((x) => x.id === view)!;
    img = v.img; W = v.W; H = v.H;
    // Systems view shares the fuse-box board; every fuse-box item is a hotspot,
    // the selected system's members highlighted, the rest dimmed.
    spots = engine.components().filter((c) => c.view === view || (sysView && c.view === "fuse"));
    if (sysView && group) cap = `${t("view.system")} · ${group.label}`;
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      <div dir="ltr" className="mx-auto ltr-island" style={{ maxWidth: 900, transform: `scale(${state.zoom})`, transformOrigin: "top center" }}>
        <div className="relative overflow-hidden rounded-lg border border-line bg-white">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={cap} className="block h-auto w-full select-none" draggable={false} />
          ) : (
            <div className="flex aspect-[16/10] items-center justify-center text-neutralx-fg3">{cap}</div>
          )}
          {/* hotspot layer */}
          {spots.map((c) => {
            const isSel = c.key === state.selected;
            const isTarget = target === c.key && state.mode !== "browse";
            const revealTarget = isTarget && state.tReveal;
            const isMember = members ? members.has(c.key) : false;
            const dim = sysView
              ? !!members && !isMember
              : state.dimOthers && !!state.selected && !isSel && state.mode === "browse";
            const showBox = sysView ? true : state.outlines || isSel || state.mode === "browse";
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => engine.select(c.key)}
                aria-label={c.name}
                aria-current={isSel || (sysView && isMember) ? "true" : undefined}
                title={`${c.ref} · ${c.name}`}
                className={cn(
                  "absolute focus-ring rounded-sm",
                  showBox ? "border-2" : "border-2 border-transparent hover:border-mod-location/60",
                  isSel
                    ? "border-mod-location bg-mod-location/25"
                    : sysView && isMember
                      ? "border-mod-location bg-mod-location/20"
                      : revealTarget
                        ? "border-ok-mid bg-ok-mid/20"
                        : "border-mod-location/40",
                  dim && "opacity-20",
                )}
                style={{ left: `${(c.hot.x / W) * 100}%`, top: `${(c.hot.y / H) * 100}%`, width: `${(c.hot.w / W) * 100}%`, height: `${(c.hot.h / H) * 100}%` }}
              >
                {isSel ? (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-mod-location px-1.5 py-0.5 t-code text-white">{c.ref}</span>
                ) : null}
              </button>
            );
          })}
          {/* stage caption */}
          <div dir="ltr" className="pointer-events-none absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 to-transparent px-3 py-1.5">
            <span className="t-code text-[11px] uppercase tracking-wide text-white/90">{cap}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
