import { useState } from "react";
import clsx from "clsx";
import type { ProbeKey } from "../data/oscilloscope.data";
import type { ScopeEngine, ScopeEngineState, RTab } from "../engine/scope.engine";
import { LiveState } from "./LiveState";

const TABS: RTab[] = ["component", "pinout", "probes", "ref", "ai", "score"];
const PROBE_KEYS = ["A", "B", "CLAMP", "GND"] as const satisfies readonly ProbeKey[];

const TAB_LABELS: Record<RTab, string> = {
  component: "Info",
  pinout: "Pinout",
  probes: "Probes",
  ref: "Ref",
  ai: "AI",
  score: "Score",
};

/** Right-side info panel with the 6 authentic tabs: Info · Pinout · Probes · Ref ·
 * AI · Score. Info/AI prose + fault verdict are Class-C; pins/specs are canonical. */
export function RightTabs({
  engine,
  state,
  t,
}: {
  engine: ScopeEngine;
  state: ScopeEngineState;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [tab, setTab] = useState<RTab>("component");
  const comp = engine.comp();
  const wrong = engine.wrongProbe();
  const [diag, setDiag] = useState("none");

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-auto border-s border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-[#3A3A3A]/10 px-2 py-2 dark:border-white/10">
        {TABS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setTab(r)}
            aria-current={tab === r ? "page" : undefined}
            className={clsx(
              "shrink-0 rounded-md px-2 py-1 font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/20",
              tab === r ? "bg-[#0E9F6E]/10 text-[#0E9F6E]" : "text-[#3A3A3A]/40 hover:text-[#3A3A3A] dark:text-white/40 dark:hover:text-white",
            )}
          >
            {t(`oscilloscope.rtab.${r}`, { defaultValue: TAB_LABELS[r] }) as string}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "component" ? (
          <>
            <div className="text-sm font-black text-[#3A3A3A] dark:text-white">{comp.name}</div>
            <div dir="ltr" className="font-mono text-xs font-bold text-[#3A3A3A]/50 dark:text-white/50">
              {comp.code}
            </div>
            <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
              {t("oscilloscope.info.function", { defaultValue: "Function" }) as string}
            </div>
            <p className="mt-1 text-sm text-[#3A3A3A] dark:text-white">
              {t(`content.oscilloscope.ex.${comp.id}.function`, { defaultValue: comp.chA.label }) as string}
            </p>
            <LiveState engine={engine} state={state} t={t} />
            <div className="mt-3 text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
              {t("oscilloscope.info.construction", { defaultValue: "Construction" }) as string}
            </div>
            <ul className="mt-1 space-y-1">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className="flex gap-2 text-sm text-[#3A3A3A]/60 dark:text-white/60">
                  <span className="text-[#0E9F6E]">•</span>
                  {t(`content.oscilloscope.ex.${comp.id}.bullets.${i}`, { defaultValue: "" }) as string}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {tab === "pinout" ? (
          <ul className="space-y-1.5">
            {comp.pins.map((p) => (
              <li key={p.n} className="flex items-start gap-2 text-sm">
                <span dir="ltr" className="rounded bg-[#3A3A3A]/5 px-1.5 py-0.5 font-mono text-xs font-bold text-[#3A3A3A] dark:bg-white/10 dark:text-white">
                  {p.n}
                </span>
                <span className="text-[#3A3A3A]/60 dark:text-white/60">{p.name}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {tab === "probes" ? (
          <div className="space-y-2">
            {PROBE_KEYS.filter((key) => key !== "B" || comp.chB)
              .filter((key) => key !== "CLAMP" || comp.correct.CLAMP)
              .map((key) => (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#3A3A3A]/40 dark:text-white/40">{key}</span>
                  <select
                    dir="ltr"
                    value={state.probes[key] ?? ""}
                    onChange={(e) => engine.placeProbe(key, e.target.value || null)}
                    className="rounded-md border border-[#3A3A3A]/15 bg-[#F8F7F6] px-2 py-1 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  >
                    <option value="">—</option>
                    {comp.pins.map((p) => (
                      <option key={p.n} value={p.n}>
                        {p.n}
                      </option>
                    ))}
                    {key === "GND" ? <option value="BAT−">BAT−</option> : null}
                  </select>
                </div>
              ))}
            <div
              className={clsx(
                "mt-2 rounded-md px-2 py-1 font-mono text-xs font-bold",
                engine.stepChecks().probeOk
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
              )}
            >
              {engine.stepChecks().probeOk
                ? (t("oscilloscope.probes.correct", { defaultValue: "Probes correct" }) as string)
                : (t("oscilloscope.probes.incomplete", { defaultValue: "Probes incomplete" }) as string)}
            </div>
            <ul className="mt-3 space-y-1.5 border-t border-[#3A3A3A]/10 pt-3 dark:border-white/10">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex gap-2 text-sm text-[#3A3A3A]/60 dark:text-white/60">
                  <span className="text-[#0E9F6E]">›</span>
                  {t(`content.oscilloscope.ex.${comp.id}.probeNotes.${i}`, { defaultValue: "" }) as string}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {tab === "ref" ? (
          <dl className="space-y-1.5">
            {comp.specs.map((sp) => (
              <div key={sp.k} className="flex items-center justify-between gap-2">
                <dt className="text-sm text-[#3A3A3A]/60 dark:text-white/60">{sp.k}</dt>
                <dd dir="ltr" className="font-mono text-xs font-bold text-[#3A3A3A] dark:text-white">
                  {sp.v}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {tab === "ai" ? (
          <div>
            {wrong === "supply" || wrong === "ground" || wrong === "none" ? (
              <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                {t(`content.oscilloscope.ai.${wrong}`, { defaultValue: wrong === "none" ? "No probe connected — connect Ch A to the signal terminal." : wrong === "supply" ? "Wrong probe: supply terminal — check pinout." : "Wrong probe: ground terminal." }) as string}
              </p>
            ) : state.fault === "none" ? (
              <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                {t("content.oscilloscope.ai.spec", { defaultValue: "Signal within specification — healthy waveform." }) as string}
              </p>
            ) : (
              <p className="rounded-xl bg-[#0E9F6E]/10 p-3 text-sm text-[#3A3A3A] dark:text-white">
                {t(`content.oscilloscope.fault.${state.fault}.desc`, { defaultValue: state.fault }) as string}
              </p>
            )}
          </div>
        ) : null}

        {tab === "score" ? (
          <div>
            <div className="text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">
              {t("oscilloscope.score.pick", { defaultValue: "Pick diagnosis" }) as string}
            </div>
            <select
              value={diag}
              onChange={(e) => setDiag(e.target.value)}
              className="mt-2 w-full rounded-md border border-[#3A3A3A]/15 bg-[#F8F7F6] px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              {comp.faults.map((f) => (
                <option key={f} value={f}>
                  {t(`content.oscilloscope.fault.${f}.label`, { defaultValue: f }) as string}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => engine.submitDiagnosis(diag)}
              className="mt-2 w-full rounded-md bg-[#0E9F6E] px-3 py-1.5 text-xs font-black text-white focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/30"
            >
              {t("oscilloscope.score.submit", { defaultValue: "Submit diagnosis" }) as string}
            </button>
            <div dir="ltr" className="mt-3 rounded-xl bg-[#3A3A3A]/5 p-3 text-center font-mono text-lg font-black text-[#3A3A3A] dark:bg-white/5 dark:text-white">
              {engine.score()} / 100
            </div>
            {state.finished ? (
              <p
                className={clsx(
                  "mt-2 rounded-xl p-2.5 text-sm font-bold",
                  engine.stepChecks().diagOk
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-red-50 text-[#D92D20] dark:bg-red-500/10 dark:text-red-300",
                )}
              >
                {t(
                  `content.oscilloscope.verdict.${engine.stepChecks().diagOk ? "correct" : "wrong"}`,
                  { defaultValue: engine.stepChecks().diagOk ? "Correct — diagnosis matches fault." : "Incorrect — check measurements again." },
                ) as string}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
