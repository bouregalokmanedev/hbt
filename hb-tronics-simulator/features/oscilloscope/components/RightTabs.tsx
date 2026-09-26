"use client";

import { useState } from "react";
import type { ScopeEngine, ScopeEngineState, RTab } from "@sim/oscilloscope";
import { cn } from "@/lib/cn";
import { LiveState } from "./LiveState";

const TABS: RTab[] = ["component", "pinout", "probes", "ref", "ai", "score"];
const PROBE_KEYS = ["A", "B", "CLAMP", "GND"] as const;

/** Right-side info panel with the 6 authentic tabs: Info · Pinout · Probes · Ref ·
 * AI · Score. Info/AI prose + fault verdict are Class-C; pins/specs are canonical. */
export function RightTabs({ engine, state, t, tc }: { engine: ScopeEngine; state: ScopeEngineState; t: any; tc: any }) {
  const [tab, setTab] = useState<RTab>("component");
  const comp = engine.comp();
  const wrong = engine.wrongProbe();
  const [diag, setDiag] = useState("none");

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-auto border-s border-line bg-paper">
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-line px-2 py-2">
        {TABS.map((r) => (
          <button key={r} type="button" onClick={() => setTab(r)} aria-current={tab === r ? "page" : undefined} className={cn("focus-ring shrink-0 rounded-md px-2 py-1 t-code", tab === r ? "bg-mod-oscilloscopeBg text-mod-oscilloscope" : "text-neutralx-fg3 hover:text-ink")}>
            {t(`rtab.${r}`)}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "component" ? (
          <>
            <div className="t-section text-ink">{comp.name}</div>
            <div dir="ltr" className="t-code text-neutralx-fg3">{comp.code}</div>
            <div className="mt-3 t-eyebrow text-neutralx-fg3">{t("info.function")}</div>
            <p className="mt-1 t-body-sm text-ink">{tc(`oscilloscope.ex.${comp.id}.function`)}</p>
            <LiveState engine={engine} state={state} t={t} tc={tc} />
            <div className="mt-3 t-eyebrow text-neutralx-fg3">{t("info.construction")}</div>
            <ul className="mt-1 space-y-1">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex gap-2 t-body-sm text-neutralx-fg3"><span className="text-mod-oscilloscope">•</span>{tc(`oscilloscope.ex.${comp.id}.bullets.${i}`)}</li>
              ))}
            </ul>
          </>
        ) : null}

        {tab === "pinout" ? (
          <ul className="space-y-1.5">
            {comp.pins.map((p) => (
              <li key={p.n} className="flex items-start gap-2 t-body-sm">
                <span dir="ltr" className="t-code rounded-xs bg-fill px-1.5 py-0.5 text-ink">{p.n}</span>
                <span className="text-neutralx-fg3">{p.name}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {tab === "probes" ? (
          <div className="space-y-2">
            {PROBE_KEYS.filter((key) => key !== "B" || comp.chB).filter((key) => key !== "CLAMP" || comp.correct.CLAMP).map((key) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <span className="t-code text-neutralx-fg3">{key}</span>
                <select dir="ltr" value={state.probes[key] ?? ""} onChange={(e) => engine.placeProbe(key, e.target.value || null)} className="focus-ring rounded-md border border-line2 bg-paper2 px-2 py-1 t-mono text-xs">
                  <option value="">—</option>
                  {comp.pins.map((p) => <option key={p.n} value={p.n}>{p.n}</option>)}
                  {key === "GND" ? <option value="BAT−">BAT−</option> : null}
                </select>
              </div>
            ))}
            <div className={cn("mt-2 rounded-md px-2 py-1 t-code", engine.stepChecks().probeOk ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn")}>
              {engine.stepChecks().probeOk ? t("probes.correct") : t("probes.incomplete")}
            </div>
            <ul className="mt-3 space-y-1.5 border-t border-line3 pt-3">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex gap-2 t-body-sm text-neutralx-fg3"><span className="text-mod-oscilloscope">›</span>{tc(`oscilloscope.ex.${comp.id}.probeNotes.${i}`)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {tab === "ref" ? (
          <dl className="space-y-1.5">
            {comp.specs.map((sp) => (
              <div key={sp.k} className="flex items-center justify-between gap-2">
                <dt className="t-body-sm text-neutralx-fg3">{sp.k}</dt>
                <dd dir="ltr" className="t-mono text-xs text-ink">{sp.v}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {tab === "ai" ? (
          <div>
            {wrong === "supply" || wrong === "ground" || wrong === "none" ? (
              <p className="rounded-lg bg-warn-bg2 p-3 t-body-sm text-warn">{tc(`oscilloscope.ai.${wrong}`)}</p>
            ) : state.fault === "none" ? (
              <p className="rounded-lg bg-ok-bg2 p-3 t-body-sm text-ok">{tc("oscilloscope.ai.spec")}</p>
            ) : (
              <p className="rounded-lg bg-mod-oscilloscopeBg p-3 t-body-sm text-ink">{tc(`oscilloscope.fault.${state.fault}.desc`)}</p>
            )}
          </div>
        ) : null}

        {tab === "score" ? (
          <div>
            <div className="t-eyebrow text-neutralx-fg3">{t("score.pick")}</div>
            <select value={diag} onChange={(e) => setDiag(e.target.value)} className="focus-ring mt-2 w-full rounded-md border border-line2 bg-paper2 px-2 py-1.5 t-body-sm">
              {comp.faults.map((f) => <option key={f} value={f}>{tc(`oscilloscope.fault.${f}.label`)}</option>)}
            </select>
            <button type="button" onClick={() => engine.submitDiagnosis(diag)} className="focus-ring mt-2 w-full rounded-md bg-mod-oscilloscope px-3 py-1.5 t-cta text-white">{t("score.submit")}</button>
            <div dir="ltr" className="mt-3 rounded-md bg-fill p-3 text-center t-mono text-lg text-ink">{engine.score()} / 100</div>
            {state.finished ? (
              <p className={cn("mt-2 rounded-lg p-2.5 t-body-sm", engine.stepChecks().diagOk ? "bg-ok-bg2 text-ok" : "bg-fault-bg2 text-fault")}>
                {tc(`oscilloscope.verdict.${engine.stepChecks().diagOk ? "correct" : "wrong"}`)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
