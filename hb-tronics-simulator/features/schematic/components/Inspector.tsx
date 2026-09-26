"use client";

import type { SchematicWorkspaceEngine, WorkspaceState } from "@sim/schematic";
import { SCH_WIRES, SCH_VEHICLE, schByKey, distinctEcuPins, relatedTo, type SchWire } from "@/data/schematic/workspace";
import { swatchBg } from "../lib";
import { cn } from "@/lib/cn";

/** Right inspector — the source's mode/selection-driven panels: task panel
 * (training/practice/exam), selection header + stats + selected-wire + pin table +
 * shared-ground + related + OEM-NA, or the no-selection sheet summary + connector cards. */
export function Inspector({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
  const taskMode = state.mode === "training" || state.mode === "practice" || state.mode === "exam";
  const sel = engine.component(state.sel);

  return (
    <aside className="flex w-[340px] shrink-0 flex-col overflow-hidden border-s border-line bg-paper">
      {taskMode ? <TaskPanel engine={engine} state={state} t={t} tc={tc} /> : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {sel ? <SelectionPanel engine={engine} state={state} t={t} tc={tc} /> : <NoSelection engine={engine} t={t} tc={tc} />}
      </div>
    </aside>
  );
}

function bar(pct: number) {
  return <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line"><div className="h-full rounded-pill bg-mod-schematic" style={{ width: `${pct}%` }} /></div>;
}

function TaskPanel({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
  const exam = state.mode === "exam", practice = state.mode === "practice";
  const pct = engine.accuracyPct();
  const q = practice ? engine.practiceQuestion() : null;
  const kicker = state.mode === "training" ? t("task.trainingKicker") : practice ? t("task.practiceKicker") : t("task.examKicker");
  const counter = state.mode === "training" ? t("task.counter", { n: (state.taskIdx % 8) + 1, total: 8 }) : exam ? t("task.counter", { n: state.examIdx + 1, total: 6 }) : "auto";

  const prompt = state.mode === "training"
    ? tc(`schematic.task.${state.taskIdx % 8}.prompt`)
    : practice
      ? tc("schematic.practice.prompt", { name: schByKey(q!.targetKey)!.name, pin: q!.targetPin })
      : state.examSubmitted
        ? t("task.examSubmitted", { pct: `${Math.round((100 * engine.examCorrect()) / 6)}%` })
        : tc(`schematic.exam.${state.examIdx}.prompt`);

  const fb = state.feedback;
  const fbText = fb == null ? null
    : state.mode === "training"
      ? fb.ok ? `${tc("schematic.feedback.correct")} ${tc(`schematic.task.${state.taskIdx % 8}.explain`)}` : tc("schematic.feedback.wrong", { code: engine.component(state.sel)?.code ?? "", name: engine.component(state.sel)?.name ?? "" })
      : practice
        ? fb.ok ? tc("schematic.feedback.practiceCorrect", { pin: q!.answer, name: schByKey(q!.targetKey)!.name, tpin: q!.targetPin }) : tc("schematic.feedback.practiceWrong", { code: schByKey(q!.targetKey)!.code })
        : tc("schematic.feedback.examRecorded");

  return (
    <div className="shrink-0 border-b border-line p-4" style={{ background: exam ? "rgba(226,61,61,.06)" : "#FDECEA" }}>
      <div className="mb-2 flex items-center justify-between">
        <span className="t-eyebrow tracking-[0.1em] text-mod-schematic">{kicker}</span>
        <span dir="ltr" className="t-code text-neutralx-fg4">{counter}</span>
      </div>
      <div className="mb-2.5 t-section text-ink">{prompt}</div>
      {fbText ? <div className={cn("mb-2.5 rounded-lg p-2.5 t-body-sm", fb!.ok ? "bg-ok-bg text-ok" : "bg-fault-bg text-fault")}>{fbText}</div> : null}

      {practice ? (
        <div className="flex flex-col gap-1.5">
          {q!.options.map((o) => (
            <button key={o} type="button" onClick={() => engine.answerPractice(o)} dir="ltr" className="focus-ring rounded-lg border border-line2 px-3 py-2 text-start t-code text-ink hover:border-mod-schematic">
              {t("task.option", { pin: o })}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        {bar(pct)}
        <span dir="ltr" className="t-code text-neutralx-fg3">{pct}%</span>
        <span className="t-body-sm text-neutralx-fg4">{t("sidebar.attempts", { n: state.attempts })}</span>
      </div>
      <div className="mt-2.5 flex gap-2">
        <button type="button" onClick={() => (exam ? (state.examSubmitted ? engine.restartExam() : state.examIdx >= 5 ? engine.submitExam() : engine.nextExam()) : engine.nextTask())}
          className="focus-ring flex-1 rounded-lg bg-mod-schematic px-3 py-2 t-cta text-white">
          {exam ? (state.examSubmitted ? t("task.restart") : state.examIdx >= 5 ? t("task.submit") : t("task.nextQuestion")) : t("task.next")}
        </button>
        <button type="button" onClick={() => engine.reveal()} className="focus-ring rounded-lg border border-line2 px-3 py-2 t-cta text-neutralx-fg2">{t("task.showAnswer")}</button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div><div className="t-eyebrow tracking-[0.1em] text-neutralx-fg4">{label}</div><div className="t-title text-ink" style={{ fontSize: 15 }}>{value}</div></div>;
}

function SelectionPanel({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
  const c = engine.component(state.sel)!;
  const rows = engine.selectedWires();
  const pins = new Set(rows.map(({ wire }) => wire.ecuPin));
  const selWireRow: SchWire | null = state.selWire != null ? SCH_WIRES[state.selWire] : null;
  const isGround = c.type === "ground";
  const relatedKeys = relatedTo(state.sel!);

  return (
    <div>
      {/* header */}
      <div className="border-b border-line p-4">
        <div className="mb-2 flex items-center gap-2">
          <span dir="ltr" className="t-code text-[15px] font-bold text-mod-schematic">{c.code}</span>
          <span className="rounded-sm border border-line2 bg-paper2 px-1.5 py-0.5 t-code text-[9.5px] tracking-[0.1em] text-neutralx-fg3">{typeLabel(c.type)}</span>
          <div className="flex-1" />
          <button type="button" onClick={() => engine.clearSelection()} aria-label={t("inspector.clear")} className="focus-ring h-6 w-6 rounded-md border border-line2 text-neutralx-fg4">✕</button>
        </div>
        <h2 className="t-section text-ink" style={{ fontSize: 17 }}>{c.name}</h2>
        <div className="mt-3 flex gap-4">
          <Stat label={t("inspector.connections")} value={String(rows.length)} />
          <Stat label={t("inspector.ecuPins")} value={String(pins.size)} />
          <Stat label={t("inspector.sheet")} value="R16" />
        </div>
      </div>

      {/* selected wire */}
      {selWireRow ? (
        <div className="border-b border-line p-4" style={{ background: "#FDECEA" }}>
          <div className="mb-2.5 t-eyebrow tracking-[0.1em] text-mod-schematic">{t("inspector.selectedWire")}</div>
          <div className="mb-2.5 flex items-center gap-2.5">
            <span className="h-5 w-5 rounded-sm border border-line2" style={{ background: swatchBg(selWireRow.ecuColour) }} />
            <span dir="ltr" className="t-section text-ink">{selWireRow.ecuColour}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <WireEnd pin={selWireRow.ecuPin} name={t("inspector.from")} />
            <WireEnd pin={t("inspector.pin", { n: selWireRow.targetPin })} name={`${schByKey(selWireRow.target)!.code} ${schByKey(selWireRow.target)!.name}`} />
          </div>
          {selWireRow.mismatch ? <div className="mt-2.5 rounded-lg border border-warn-amber/35 bg-warn-amber/15 p-2 t-body-sm text-ink">{t("inspector.mismatchNote", { a: selWireRow.ecuColour, b: selWireRow.targetColour })}</div> : null}
          <p className="mt-2.5 t-body-sm text-neutralx-fg4">{tc("schematic.na.wire")}</p>
        </div>
      ) : null}

      {/* pin table */}
      <div className="px-4 pb-1 pt-3.5">
        <div className="flex items-baseline justify-between">
          <span className="t-eyebrow tracking-[0.1em] text-neutralx-fg4">{state.sel === "E1" ? t("inspector.allRows") : t("inspector.pinRows")}</span>
          <span dir="ltr" className="t-code text-neutralx-fg4">{t("inspector.rows", { n: rows.length })}</span>
        </div>
      </div>
      <div className="flex flex-col gap-px px-2.5 pb-3.5">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line2 p-3.5 text-center t-body-sm text-neutralx-fg4">{tc("schematic.na.pins")}</div>
        ) : rows.slice(0, 200).map(({ wire, idx }) => {
          const on = state.selWire === idx;
          const target = schByKey(wire.target)!;
          return (
            <button key={idx} type="button" onClick={() => engine.selectWire(idx)} aria-current={on ? "true" : undefined}
              className={cn("flex items-center gap-2.5 rounded-lg px-2 py-2 text-start", on ? "border border-mod-schematic bg-mod-schematicBg" : "border border-transparent hover:bg-fill")}>
              <span className="h-3 w-3 shrink-0 rounded-sm border border-line2" style={{ background: swatchBg(wire.ecuColour) }} />
              <span dir="ltr" className="w-10 shrink-0 t-code text-ink">{wire.ecuPin}</span>
              <span className="min-w-0 flex-1 truncate t-body-sm text-neutralx-fg2">{state.sel === "E1" ? `${target.code} ${target.name}` : `${wire.ecuColour} → ${target.name}`}</span>
              <span dir="ltr" className="t-code text-neutralx-fg4">{wire.targetPin}</span>
              {wire.mismatch ? <span className="h-1.5 w-1.5 shrink-0 rounded-pill bg-warn-amber" title={t("inspector.mismatchNote", { a: wire.ecuColour, b: wire.targetColour })} /> : null}
            </button>
          );
        })}
      </div>

      {/* shared ground */}
      {isGround ? (
        <div className="border-t border-line p-4">
          <div className="mb-2.5 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("inspector.sharedGround")}</div>
          <div className="flex flex-wrap gap-1.5">
            {rows.map(({ wire }, i) => <span key={i} dir="ltr" className="rounded-sm border border-ok-mid/35 bg-ok-mid/15 px-1.5 py-1 t-code text-ok">{wire.ecuPin}</span>)}
          </div>
        </div>
      ) : null}

      {/* related */}
      <div className="border-t border-line p-4">
        <div className="mb-2.5 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("inspector.related")}</div>
        <div className="flex flex-wrap gap-1.5">
          {relatedKeys.slice(0, 14).map((k) => (
            <button key={k} type="button" onClick={() => engine.select(k)} className="flex items-center gap-1.5 rounded-pill border border-line2 px-2.5 py-1 text-start t-body-sm text-neutralx-fg2 hover:border-mod-schematic">
              <span dir="ltr" className="t-code text-neutralx-fg4">{schByKey(k)!.code}</span>{shortName(schByKey(k)!.name)}
            </button>
          ))}
        </div>
      </div>

      {/* OEM (all NA) */}
      <div className="flex flex-col gap-2.5 border-t border-line p-4 pb-6">
        <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("inspector.oem")}</div>
        {(["image", "housing", "location", "rating", "repair", "notes"] as const).map((f) => (
          <div key={f} className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <span className="t-body-sm text-neutralx-fg2">{t(`oem.${f}`)}</span>
            <span className="text-end t-body-sm text-neutralx-fg4">{tc("schematic.na.field")}</span>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3">
          <span className="t-body-sm text-neutralx-fg2">{t("inspector.sheet")}</span>
          <span dir="ltr" className="t-code text-neutralx-fg3">{SCH_VEHICLE}</span>
        </div>
      </div>
    </div>
  );
}

function WireEnd({ pin, name }: { pin: string; name: string }) {
  return (
    <div className="flex items-center gap-2 t-body-sm text-neutralx-fg2">
      <span dir="ltr" className="rounded-sm border border-line2 bg-paper px-1.5 py-0.5 t-code text-ink">{pin}</span>
      <span>{name}</span>
    </div>
  );
}

function NoSelection({ engine, t, tc }: { engine: SchematicWorkspaceEngine; t: any; tc: any }) {
  const A = distinctEcuPins("A").length, B = distinctEcuPins("B").length;
  const summary = [
    { label: t("summary.components"), value: String(engine.components().length) },
    { label: t("summary.rows"), value: String(engine.wires().length) },
    { label: t("summary.connectors"), value: t("summary.connectorsValue") },
    { label: t("summary.pins"), value: String(A + B) },
    { label: t("summary.grounds"), value: t("summary.groundsValue") },
    { label: t("summary.can"), value: "2" },
  ];
  return (
    <div className="p-4">
      <div className="mb-3 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("inspector.information")}</div>
      <div className="mb-4 rounded-[10px] border border-dashed border-line2 px-4 py-5 text-center">
        <div className="mb-1 t-section text-ink">{tc("schematic.empty.title")}</div>
        <p className="t-body-sm text-neutralx-fg4">{tc("schematic.empty.body")}</p>
      </div>
      <div className="mb-2.5 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("inspector.sheetSummary")}</div>
      <div className="mb-4 flex flex-col gap-px">
        {summary.map((s) => (
          <div key={s.label} className="flex items-baseline justify-between rounded-md bg-paper2 px-2.5 py-2">
            <span className="t-body-sm text-neutralx-fg2">{s.label}</span>
            <span dir="ltr" className="t-code text-ink">{s.value}</span>
          </div>
        ))}
      </div>
      <div className="mb-2.5 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{t("inspector.connectors")}</div>
      <div className="flex gap-2">
        {(["A", "B"] as const).map((code) => (
          <button key={code} type="button" onClick={() => engine.openConnector(code)} className="flex-1 rounded-[10px] border border-line2 p-3 text-start hover:border-mod-schematic">
            <div dir="ltr" className="t-code text-[15px] font-bold text-mod-schematic">{code}</div>
            <div className="t-body-sm text-neutralx-fg2">{t("connector.pinsInTable", { code, n: code === "A" ? 34 : 77 })}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// small pure helpers (presentation)
function typeLabel(type: string) {
  return ({ ecu: "ECU", relay: "RELAY", fuse: "FUSE", ground: "GROUND", network: "CAN", connector: "CONNECTOR", module: "MODULE", sensor: "SENSOR", actuator: "ACTUATOR", switch: "SWITCH" } as Record<string, string>)[type] ?? type;
}
function shortName(n: string) {
  return n.length > 22 ? n.slice(0, 21) + "…" : n;
}
