"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { SCOPE_EXERCISES } from "@/data/oscilloscope/scope";
import { useScope } from "./hooks/useScope";
import { WaveformCanvas } from "./components/WaveformCanvas";
import { ScopeControls } from "./components/ScopeControls";
import { MeasurementRow } from "./components/MeasurementRow";
import { ChannelControls } from "./components/ChannelControls";
import { ProcedureSidebar } from "./components/ProcedureSidebar";
import { RightTabs } from "./components/RightTabs";
import type { Screen } from "@sim/oscilloscope";

const SCREENS: Screen[] = ["library", "connect", "scope", "compare", "tablet"];
const PROBE_KEYS = ["A", "B", "CLAMP", "GND"] as const;

/**
 * Oscilloscope tool shell (P4.2) — the authentic guided-measurement workstation on
 * the framework-free ScopeEngine. Top header (SCORE + 5 view tabs) and the active
 * view: Library, Connect, Scope (canvas + controls + measurements + channels +
 * procedure + 6 right tabs), Compare, Tablet. No simulation logic in React.
 */
export function OscilloscopeView() {
  const t = useTranslations("oscilloscope");
  const tc = useTranslations("content");
  const { engine, state } = useScope();
  const comp = engine.comp();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper2">
      {/* header */}
      <div className="flex items-center gap-4 border-b border-line bg-paper px-4 py-2">
        <div className="min-w-0">
          <div className="t-eyebrow tracking-[0.12em] text-mod-oscilloscope">{t("title")}</div>
          <div className="truncate t-body-sm text-neutralx-fg3">{comp.name} · <span dir="ltr" className="t-code">{comp.code}</span></div>
        </div>
        <span dir="ltr" className="ms-auto t-code text-neutralx-fg3">{t("header.score")} <span className="t-mono text-ink">{engine.score()}/100</span></span>
        <div className="inline-flex rounded-lg bg-fill p-1">
          {SCREENS.map((s) => (
            <button key={s} type="button" onClick={() => engine.setScreen(s)} aria-current={state.screen === s ? "page" : undefined}
              className={cn("focus-ring rounded-md px-3 py-1.5 t-cta", state.screen === s ? "bg-paper text-mod-oscilloscope shadow-seg" : "text-neutralx-fg3")}>
              {t(`screen.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {state.screen === "scope" ? (
          <>
            <ProcedureSidebar engine={engine} state={state} t={t} tc={tc} />
            <div className="min-w-0 flex-1 space-y-3 overflow-auto p-4">
              <ScopeControls engine={engine} state={state} t={t} />
              <WaveformCanvas engine={engine} state={state} />
              <MeasurementRow engine={engine} state={state} t={t} />
              <ChannelControls engine={engine} state={state} t={t} />
            </div>
            <RightTabs engine={engine} state={state} t={t} tc={tc} />
          </>
        ) : null}

        {state.screen === "library" ? (
          <div className="grid flex-1 grid-cols-1 gap-3 overflow-auto p-5 sm:grid-cols-2 lg:grid-cols-3">
            {SCOPE_EXERCISES.map((c) => (
              <button key={c.id} type="button" onClick={() => { engine.selectComponent(c.id); engine.setScreen("scope"); }}
                className={cn("focus-ring rounded-xl border bg-paper p-4 text-start hover:shadow-card", c.id === state.compId ? "border-mod-oscilloscope" : "border-line")}>
                <span dir="ltr" className="t-code rounded-xs bg-mod-oscilloscopeBg px-1.5 py-0.5 text-mod-oscilloscope">{c.code}</span>
                <div className="mt-2 t-body-sm font-medium text-ink">{c.name}</div>
                <div className="t-eyebrow text-neutralx-fg3">{tc(`oscilloscope.ex.${c.id}.sub`)}</div>
              </button>
            ))}
          </div>
        ) : null}

        {state.screen === "connect" ? (
          <div className="min-w-0 flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-lg rounded-xl border border-line bg-paper p-5 shadow-card">
              <div className="t-section text-ink">{t("probes.title")}</div>
              <div className="mt-1 t-body-sm text-neutralx-fg3">{comp.name} · <span dir="ltr" className="t-code">{comp.connector}</span></div>
              <div className="mt-4 space-y-2">
                {PROBE_KEYS.filter((k) => k !== "B" || comp.chB).filter((k) => k !== "CLAMP" || comp.correct.CLAMP).map((key) => (
                  <div key={key} className="flex items-center justify-between gap-2 rounded-lg border border-line2 px-3 py-2">
                    <span className="t-code text-neutralx-fg3">{t("probes.channel")} {key}</span>
                    <select dir="ltr" value={state.probes[key] ?? ""} onChange={(e) => engine.placeProbe(key, e.target.value || null)} className="focus-ring rounded-md border border-line2 bg-paper2 px-2 py-1 t-mono text-xs">
                      <option value="">—</option>
                      {comp.pins.map((p) => <option key={p.n} value={p.n}>{p.n} · {p.name}</option>)}
                      {key === "GND" ? <option value="BAT−">BAT−</option> : null}
                    </select>
                  </div>
                ))}
              </div>
              <div className={cn("mt-3 rounded-md px-3 py-2 t-body-sm", engine.stepChecks().probeOk ? "bg-ok-bg2 text-ok" : "bg-warn-bg2 text-warn")}>
                {engine.stepChecks().probeOk ? t("probes.correct") : t("probes.incomplete")}
              </div>
              <button type="button" onClick={() => engine.setScreen("scope")} className="focus-ring mt-4 w-full rounded-md bg-mod-oscilloscope px-3 py-2 t-cta text-white">{t("screen.scope")} →</button>
            </div>
          </div>
        ) : null}

        {state.screen === "compare" ? (
          <div className="min-w-0 flex-1 overflow-auto p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-line bg-paper p-3 shadow-card">
                <div className="t-eyebrow text-neutralx-fg3">{t("compare.live")}</div>
                <div className="mt-2"><WaveformCanvas engine={engine} state={state} height={300} /></div>
              </div>
              <div className="rounded-xl border border-line bg-paper p-3 shadow-card">
                <div className="t-eyebrow text-neutralx-fg3">{t("compare.reference")}</div>
                <div className="mt-2"><WaveformCanvas engine={engine} state={{ ...state, fault: "none", refOn: true }} height={300} /></div>
              </div>
            </div>
          </div>
        ) : null}

        {state.screen === "tablet" ? (
          <div className="min-w-0 flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-2xl rounded-[28px] border-[10px] border-[#14181C] bg-[#14181C] p-4 shadow-panel">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="h-2 w-2 rounded-pill bg-white/40" />
                <span dir="ltr" className="t-code text-white/60">HB-T14 · {comp.code}</span>
                <button type="button" onClick={() => engine.toggleRun()} className={cn("rounded-md px-2 py-0.5 t-code text-white", state.running ? "bg-fault-red" : "bg-ok-mid")}>{state.running ? t("control.stop") : t("control.run")}</button>
              </div>
              <WaveformCanvas engine={engine} state={state} height={320} />
              <div className="mt-2"><MeasurementRow engine={engine} state={state} t={t} /></div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
