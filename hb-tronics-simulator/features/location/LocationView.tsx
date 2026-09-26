"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { LOC_VIEWS, type LocView } from "@/data/location/atlas";
import { useLocationAtlas } from "./hooks/useLocationAtlas";
import { LocationSidebar } from "./components/LocationSidebar";
import { AtlasCanvas } from "./components/AtlasCanvas";
import { DetailPanel } from "./components/DetailPanel";
import { SystemPanel } from "./components/SystemPanel";
import { TrainingPanel } from "./components/TrainingPanel";
import { QuizPanel } from "./components/QuizPanel";
import type { AtlasMode } from "@sim/location";

const MODES: AtlasMode[] = ["browse", "train", "quiz"];

/**
 * Location tool shell (P5.2) — the authentic 3-column component-location atlas on
 * the framework-free LocationAtlasEngine: sidebar (search / categories / systems /
 * favourites), the image-hotspot atlas (6 views + toolbar), and the mode-specific
 * right panel (Detail / Training / Quiz). No domain logic in React.
 */
export function LocationView() {
  const t = useTranslations("location");
  const tc = useTranslations("content");
  const { engine, state } = useLocationAtlas();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper2">
      {/* header */}
      <div className="flex items-center gap-4 border-b border-line bg-paper px-4 py-2">
        <div className="min-w-0">
          <div className="t-eyebrow tracking-[0.12em] text-mod-location">{t("title")}</div>
          <div className="truncate t-body-sm text-neutralx-fg3">{t("subtitle")}</div>
        </div>
        <div className="ms-auto inline-flex rounded-lg bg-fill p-1">
          {MODES.map((m) => (
            <button key={m} type="button" onClick={() => engine.setMode(m)} aria-current={state.mode === m ? "page" : undefined}
              className={cn("focus-ring rounded-md px-3 py-1.5 t-cta", state.mode === m ? "bg-paper text-mod-location shadow-seg" : "text-neutralx-fg3")}>
              {t(`mode.${m}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <LocationSidebar engine={engine} state={state} t={t} />

        {/* center: view tabs + toolbar + atlas */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper px-4 py-2">
            <div className="inline-flex rounded-lg bg-fill p-0.5">
              {LOC_VIEWS.map((v) => (
                <button key={v.id} type="button" onClick={() => engine.setView(v.id as LocView)} aria-current={state.view === v.id ? "page" : undefined}
                  className={cn("focus-ring rounded-md px-2.5 py-1.5 t-cta", state.view === v.id ? "bg-paper text-ink shadow-seg" : "text-neutralx-fg3")}>
                  {t(`view.${v.id}`)}
                </button>
              ))}
            </div>
            <label className="ms-2 flex items-center gap-1.5 t-body-sm text-neutralx-fg3">
              <input type="checkbox" checked={state.outlines} onChange={() => engine.toggleOutlines()} className="accent-mod-location" />
              {t("toolbar.outlines")}
            </label>
            <label className="flex items-center gap-1.5 t-body-sm text-neutralx-fg3">
              <input type="checkbox" checked={state.dimOthers} onChange={() => engine.toggleDimOthers()} className="accent-mod-location" />
              {t("toolbar.dim")}
            </label>
            <div className="ms-auto inline-flex items-center gap-1 rounded-md border border-line2 px-1">
              <button type="button" onClick={() => engine.setZoom(state.zoom - 0.15)} aria-label={t("toolbar.zoomOut")} className="focus-ring px-1.5 t-code text-ink">−</button>
              <span dir="ltr" className="min-w-12 text-center t-code text-ink">{Math.round(state.zoom * 100)}%</span>
              <button type="button" onClick={() => engine.setZoom(state.zoom + 0.15)} aria-label={t("toolbar.zoomIn")} className="focus-ring px-1.5 t-code text-ink">+</button>
              <button type="button" onClick={() => engine.setZoom(1)} className="focus-ring px-2 t-cta text-mod-location">{t("toolbar.fit")}</button>
            </div>
          </div>

          <AtlasCanvas engine={engine} state={state} t={t} />
        </div>

        {/* right panel by mode — Systems trace view swaps Detail → System breakdown */}
        {state.mode === "browse" ? (
          state.view === "system" ? <SystemPanel engine={engine} state={state} t={t} /> : <DetailPanel engine={engine} state={state} t={t} tc={tc} />
        ) : null}
        {state.mode === "train" ? <TrainingPanel engine={engine} state={state} t={t} tc={tc} /> : null}
        {state.mode === "quiz" ? <QuizPanel engine={engine} state={state} t={t} tc={tc} /> : null}
      </div>
    </div>
  );
}
