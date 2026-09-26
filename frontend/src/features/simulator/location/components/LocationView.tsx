import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { LOC_VIEWS, type LocView } from "@/features/simulator/location/data/location.data";
import type { AtlasMode } from "@/features/simulator/location/engine/atlas.engine";
import { useLocationAtlas } from "../hooks/useLocationAtlas";
import { AtlasCanvas } from "./AtlasCanvas";
import { DetailPanel } from "./DetailPanel";
import { LocationSidebar } from "./LocationSidebar";
import { QuizPanel } from "./QuizPanel";
import { SystemPanel } from "./SystemPanel";
import { TrainingPanel } from "./TrainingPanel";

const MODES: AtlasMode[] = ["browse", "train", "quiz"];

/**
 * Location tool shell — the authentic 3-column component-location atlas on
 * the framework-free LocationAtlasEngine: sidebar (search / categories / systems /
 * favourites), the image-hotspot atlas (6 views + toolbar), and the mode-specific
 * right panel (Detail / Training / Quiz). No domain logic in React.
 */
export function LocationView({
  vehicleId = null,
  sessionId = null,
  focus = null,
}: {
  vehicleId?: string | null;
  sessionId?: string | null;
  focus?: string | null;
} = {}) {
  const { t } = useTranslation();
  const { engine, state } = useLocationAtlas(vehicleId, sessionId, focus);

  const tr = (key: string, fallback: string, opts?: Record<string, unknown>) =>
    t(key, { defaultValue: fallback, ...opts } as unknown as Record<string, unknown>) as string;

  // Content namespace resolver: in simulator we use `content` keys via same t with defaultValue
  const tc = (key: string, opts?: Record<string, unknown>) =>
    t(`content.${key}`, { defaultValue: "", ...opts } as unknown as Record<string, unknown>) as string;

  if (!engine || !state) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-[20px] border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
        <div className="flex items-center gap-3 text-sm font-bold text-[#3A3A3A]/50 dark:text-white/50">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#F47822]/25 border-t-[#F47822]" />
          {tr("simulator.dmmLab.loading", "Loading…")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[520px] flex-col overflow-hidden rounded-[20px] border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
      {/* header */}
      <div className="flex items-center gap-4 border-b border-[#3A3A3A]/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#1b1b20]">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#F47822]">
            {tr("location.title", "Location")}
          </div>
          <div className="truncate text-sm text-[#3A3A3A]/60 dark:text-white/60">{tr("location.subtitle", "Component location · engine bay, fuse box, ECUs & ground points")}</div>
        </div>
        <div className="ms-auto inline-flex rounded-xl bg-[#3A3A3A]/5 p-1 dark:bg-white/5">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => engine.setMode(m)}
              aria-current={state.mode === m ? "page" : undefined}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#F47822]/20",
                state.mode === m ? "bg-white text-[#F47822] shadow dark:bg-[#1b1b20]" : "text-[#3A3A3A]/50 dark:text-white/50",
              )}
            >
              {tr(`location.mode.${m}`, m)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 bg-[#F8F7F6] dark:bg-[#101013]">
        <LocationSidebar engine={engine} state={state} t={t as unknown as (k: string, o?: Record<string, unknown>) => string} />

        {/* center: view tabs + toolbar + atlas */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#3A3A3A]/10 bg-white px-4 py-2 dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="inline-flex rounded-xl bg-[#3A3A3A]/5 p-1 dark:bg-white/5">
              {LOC_VIEWS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => engine.setView(v.id as LocView)}
                  aria-current={state.view === v.id ? "page" : undefined}
                  className={clsx(
                    "rounded-lg px-2.5 py-1.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#F47822]/20",
                    state.view === v.id ? "bg-white text-[#3A3A3A] shadow dark:bg-[#1b1b20] dark:text-white" : "text-[#3A3A3A]/50 dark:text-white/50",
                  )}
                >
                  {tr(`location.view.${v.id}`, v.id)}
                </button>
              ))}
            </div>
            <label className="ms-2 flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
              <input
                type="checkbox"
                checked={state.outlines}
                onChange={() => engine.toggleOutlines()}
                className="accent-[#F47822]"
              />
              {tr("location.toolbar.outlines", "Hotspot outlines")}
            </label>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
              <input
                type="checkbox"
                checked={state.dimOthers}
                onChange={() => engine.toggleDimOthers()}
                className="accent-[#F47822]"
              />
              {tr("location.toolbar.dim", "Dim others")}
            </label>
            <div className="ms-auto inline-flex items-center gap-1 rounded-xl border border-[#3A3A3A]/10 bg-white px-1 dark:border-white/10 dark:bg-[#1b1b20]">
              <button
                type="button"
                onClick={() => engine.setZoom(state.zoom - 0.15)}
                aria-label={tr("location.toolbar.zoomOut", "Zoom out")}
                className="px-1.5 py-1 font-mono text-sm font-bold text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:text-white"
              >
                −
              </button>
              <span dir="ltr" className="min-w-12 text-center font-mono text-xs font-bold text-[#3A3A3A] dark:text-white">
                {Math.round(state.zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => engine.setZoom(state.zoom + 0.15)}
                aria-label={tr("location.toolbar.zoomIn", "Zoom in")}
                className="px-1.5 py-1 font-mono text-sm font-bold text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#F47822]/20 dark:text-white"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => engine.setZoom(1)}
                className="px-2 py-1 text-xs font-black text-[#F47822] focus:outline-none focus:ring-2 focus:ring-[#F47822]/20"
              >
                {tr("location.toolbar.fit", "FIT")}
              </button>
            </div>
          </div>

          <AtlasCanvas engine={engine} state={state} t={t as unknown as (k: string, o?: Record<string, unknown>) => string} />
        </div>

        {/* right panel by mode — Systems trace view swaps Detail → System breakdown */}
        {state.mode === "browse" ? (
          state.view === "system" ? (
            <SystemPanel engine={engine} state={state} t={t as unknown as (k: string, o?: Record<string, unknown>) => string} />
          ) : (
            <DetailPanel
              engine={engine}
              state={state}
              t={t as unknown as (k: string, o?: Record<string, unknown>) => string}
              tc={tc as unknown as (k: string, o?: Record<string, unknown>) => string}
            />
          )
        ) : null}
        {state.mode === "train" ? (
          <TrainingPanel
            engine={engine}
            state={state}
            t={t as unknown as (k: string, o?: Record<string, unknown>) => string}
            tc={tc as unknown as (k: string, o?: Record<string, unknown>) => string}
          />
        ) : null}
        {state.mode === "quiz" ? (
          <QuizPanel
            engine={engine}
            state={state}
            t={t as unknown as (k: string, o?: Record<string, unknown>) => string}
            tc={tc as unknown as (k: string, o?: Record<string, unknown>) => string}
          />
        ) : null}
      </div>
    </div>
  );
}
