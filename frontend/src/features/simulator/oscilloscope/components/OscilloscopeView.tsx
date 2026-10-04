import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { SCOPE_EXERCISES } from "../data/oscilloscope.data";
import { LabProgressStrip } from "@/features/simulator/components/LabProgressStrip";
import { useScope } from "../hooks/useScope";
import { WaveformCanvas } from "./WaveformCanvas";
import { ScopeControls } from "./ScopeControls";
import { MeasurementRow } from "./MeasurementRow";
import { ChannelControls } from "./ChannelControls";
import { ProcedureSidebar } from "./ProcedureSidebar";
import { RightTabs } from "./RightTabs";
import type { ProbeKey } from "../data/oscilloscope.data";
import type { Screen } from "../engine/scope.engine";

const SCREENS: Screen[] = ["library", "connect", "scope", "compare", "tablet"];
const PROBE_KEYS = ["A", "B", "CLAMP", "GND"] as const satisfies readonly ProbeKey[];

const SCREEN_LABELS: Record<Screen, string> = {
  library: "Library",
  connect: "Connect",
  scope: "Scope",
  compare: "Compare",
  tablet: "Tablet",
};

interface OscilloscopeViewProps {
  vehicleId?: string | null;
  sessionId?: string | null;
  focus?: string | null;
}

/**
 * Oscilloscope tool shell — the authentic guided-measurement workstation on
 * the framework-free ScopeEngine. Top header (SCORE + 5 view tabs) and the active
 * view: Library, Connect, Scope (canvas + controls + measurements + channels +
 * procedure + 6 right tabs), Compare, Tablet. No simulation logic in React.
 */
export function OscilloscopeView({ vehicleId = null, sessionId = null, focus = null }: OscilloscopeViewProps) {
  const { t } = useTranslation();
  const { engine, state } = useScope(vehicleId, sessionId, focus);

  if (!engine || !state) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-[20px] border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
        <div className="flex items-center gap-3 text-sm font-bold text-[#3A3A3A]/50 dark:text-white/50">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0E9F6E]/25 border-t-[#0E9F6E]" />
          {t("simulator.dmmLab.loading", { defaultValue: "Loading…" }) as string}
        </div>
      </div>
    );
  }

  const comp = engine.comp();
  const checks = engine.stepChecks();
  const passed = [checks.probeOk, checks.vOk, checks.tOk, checks.trigOk, checks.capOk, checks.measOk, checks.diagOk].filter(Boolean).length;
  const progressPct = Math.round((passed / 7) * 100);

  const tr = (key: string, fallback: string) => t(key, { defaultValue: fallback }) as string;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
      {/* header */}
      <div className="flex items-center gap-4 border-b border-[#3A3A3A]/10 bg-white px-4 py-2 dark:border-white/10 dark:bg-[#1b1b20]">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#0E9F6E]">
            {tr("oscilloscope.title", "Oscilloscope")}
          </div>
          <div className="truncate text-sm text-[#3A3A3A]/60 dark:text-white/60">
            {comp.name} · <span dir="ltr" className="font-mono text-xs font-bold">{comp.code}</span>
          </div>
        </div>
        <span dir="ltr" className="ms-auto font-mono text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
          {tr("oscilloscope.header.score", "Score")} <span className="font-mono text-sm font-black text-[#3A3A3A] dark:text-white">{engine.score()}/100</span>
        </span>
        <div className="inline-flex rounded-xl bg-[#3A3A3A]/5 p-1 dark:bg-white/5">
          {SCREENS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => engine.setScreen(s)}
              aria-current={state.screen === s ? "page" : undefined}
              className={clsx(
                "rounded-lg px-3 py-1.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/20",
                state.screen === s ? "bg-white text-[#0E9F6E] shadow dark:bg-[#1b1b20]" : "text-[#3A3A3A]/50 dark:text-white/50",
              )}
            >
              {tr(`oscilloscope.screen.${s}`, SCREEN_LABELS[s])}
            </button>
          ))}
        </div>
      </div>

      <LabProgressStrip tool="oscilloscope" progress={progressPct} />

      <div className="flex min-h-0 flex-1 bg-[#F8F7F6] dark:bg-[#101013]">
        {state.screen === "scope" ? (
          <>
            <ProcedureSidebar engine={engine} state={state} t={t as (k: string, o?: Record<string, unknown>) => string} />
            <div className="min-w-0 flex-1 space-y-3 overflow-auto p-4">
              <div className="rounded-xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
                <ScopeControls engine={engine} state={state} t={t as (k: string, o?: Record<string, unknown>) => string} />
              </div>
              <div className="overflow-hidden rounded-xl border border-[#3A3A3A]/10 bg-[#0C1116] p-2 dark:border-white/10">
                <WaveformCanvas engine={engine} state={state} />
              </div>
              <MeasurementRow engine={engine} state={state} t={t as (k: string, o?: Record<string, unknown>) => string} />
              <ChannelControls engine={engine} state={state} t={t as (k: string, o?: Record<string, unknown>) => string} />
            </div>
            <RightTabs engine={engine} state={state} t={t as (k: string, o?: Record<string, unknown>) => string} />
          </>
        ) : null}

        {state.screen === "library" ? (
          <div className="grid flex-1 grid-cols-1 gap-3 overflow-auto p-5 sm:grid-cols-2 lg:grid-cols-3">
            {SCOPE_EXERCISES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  engine.selectComponent(c.id);
                  engine.setScreen("scope");
                }}
                className={clsx(
                  "rounded-xl border bg-white p-4 text-start shadow-sm transition hover:shadow dark:bg-[#1b1b20] focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/20",
                  c.id === state.compId ? "border-[#0E9F6E]" : "border-[#3A3A3A]/10 dark:border-white/10",
                )}
              >
                <span dir="ltr" className="rounded bg-[#0E9F6E]/10 px-1.5 py-0.5 font-mono text-xs font-bold text-[#0E9F6E]">
                  {c.code}
                </span>
                <div className="mt-2 text-sm font-bold text-[#3A3A3A] dark:text-white">{c.name}</div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                  {tr(`content.oscilloscope.ex.${c.id}.sub`, c.name)}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {state.screen === "connect" ? (
          <div className="min-w-0 flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-lg rounded-xl border border-[#3A3A3A]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1b1b20]">
              <div className="text-sm font-black text-[#3A3A3A] dark:text-white">
                {tr("oscilloscope.probes.title", "Probes")}
              </div>
              <div className="mt-1 text-sm text-[#3A3A3A]/60 dark:text-white/60">
                {comp.name} · <span dir="ltr" className="font-mono text-xs font-bold">{comp.connector}</span>
              </div>
              <div className="mt-4 space-y-2">
                {PROBE_KEYS.filter((k) => k !== "B" || comp.chB)
                  .filter((k) => k !== "CLAMP" || comp.correct.CLAMP)
                  .map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#3A3A3A]/10 bg-[#F8F7F6] px-3 py-2 dark:border-white/10 dark:bg-white/5"
                    >
                      <span className="font-mono text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {tr("oscilloscope.probes.channel", "Channel")} {key}
                      </span>
                      <select
                        dir="ltr"
                        value={state.probes[key] ?? ""}
                        onChange={(e) => engine.placeProbe(key, e.target.value || null)}
                        className="rounded-md border border-[#3A3A3A]/15 bg-white px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/20 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                      >
                        <option value="">—</option>
                        {comp.pins.map((p) => (
                          <option key={p.n} value={p.n}>
                            {p.n} · {p.name}
                          </option>
                        ))}
                        {key === "GND" ? <option value="BAT−">BAT−</option> : null}
                      </select>
                    </div>
                  ))}
              </div>
              <div
                className={clsx(
                  "mt-3 rounded-xl px-3 py-2 text-sm font-bold",
                  engine.stepChecks().probeOk
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                )}
              >
                {engine.stepChecks().probeOk
                  ? tr("oscilloscope.probes.correct", "Probes correct")
                  : tr("oscilloscope.probes.incomplete", "Probes incomplete — connect signal and ground.")}
              </div>
              <button
                type="button"
                onClick={() => engine.setScreen("scope")}
                className="mt-4 w-full rounded-xl bg-[#0E9F6E] px-3 py-2 text-sm font-black text-white focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/30"
              >
                {tr("oscilloscope.screen.scope", "Scope")} →
              </button>
            </div>
          </div>
        ) : null}

        {state.screen === "compare" ? (
          <div className="min-w-0 flex-1 overflow-auto p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[#3A3A3A]/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="text-[11px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                  {tr("oscilloscope.compare.live", "Live")}
                </div>
                <div className="mt-2 overflow-hidden rounded-xl bg-[#0C1116] p-2">
                  <WaveformCanvas engine={engine} state={state} height={300} />
                </div>
              </div>
              <div className="rounded-xl border border-[#3A3A3A]/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="text-[11px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
                  {tr("oscilloscope.compare.reference", "Reference")}
                </div>
                <div className="mt-2 overflow-hidden rounded-xl bg-[#0C1116] p-2">
                  <WaveformCanvas engine={engine} state={{ ...state, fault: "none", refOn: true }} height={300} />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {state.screen === "tablet" ? (
          <div className="min-w-0 flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-2xl rounded-[28px] border-[10px] border-[#14181C] bg-[#14181C] p-4 shadow-xl">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="h-2 w-2 rounded-full bg-white/40" />
                <span dir="ltr" className="font-mono text-xs font-bold text-white/60">
                  HB-T14 · {comp.code}
                </span>
                <button
                  type="button"
                  onClick={() => engine.toggleRun()}
                  className={clsx("rounded-md px-2 py-0.5 font-mono text-xs font-bold text-white", state.running ? "bg-[#D92D20]" : "bg-[#0E9F6E]")}
                >
                  {state.running ? tr("oscilloscope.control.stop", "STOP") : tr("oscilloscope.control.run", "RUN")}
                </button>
              </div>
              <div className="overflow-hidden rounded-xl bg-[#0C1116]">
                <WaveformCanvas engine={engine} state={state} height={320} />
              </div>
              <div className="mt-2">
                <MeasurementRow engine={engine} state={state} t={t as (k: string, o?: Record<string, unknown>) => string} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
