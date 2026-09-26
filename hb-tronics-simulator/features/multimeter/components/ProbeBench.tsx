"use client";

import type { MeterProcedureEngine, MeterProcedureState, Lead } from "@sim/multimeter";
import { cn } from "@/lib/cn";

/**
 * PROBES — drag onto a pin. Two draggable lead tokens (red/black); dragging onto a
 * wiring target calls engine.placeProbe(target, lead). The token also marks the
 * "active" lead (engine.state.lead) so a plain click on a pin seats it (click-mode /
 * a11y path). Detach/clear reposition. No measurement math here.
 */
export function ProbeBench({ engine, state, t }: { engine: MeterProcedureEngine; state: MeterProcedureState; t: any }) {
  const leadRow = (lead: Lead) => {
    const seated = lead === "red" ? state.red : state.black;
    const active = state.lead === lead;
    const label = lead === "red" ? t("probes.red") : t("probes.black");
    return (
      <div
        key={lead}
        draggable
        onDragStart={(e) => e.dataTransfer.setData("text/plain", lead)}
        className={cn(
          "flex cursor-grab items-center gap-2 rounded-lg border px-3 py-2 active:cursor-grabbing",
          active ? "border-mod-multimeter bg-mod-multimeterBg" : "border-line2 bg-paper",
        )}
        data-probe={lead}
        aria-label={label}
      >
        <span className={cn("h-2.5 w-2.5 rounded-pill", lead === "red" ? "bg-fault-red" : "bg-ink")} />
        <span className="t-body-sm text-ink">{label}</span>
        <span dir="ltr" className="ms-auto flex items-center gap-1.5 t-code text-neutralx-fg3">
          {seated ?? t("proc.notPlaced")}
          {seated ? (
            <button type="button" onClick={() => engine.detachProbe(lead)} className="focus-ring text-neutralx-fg3 hover:text-fault" aria-label={`detach ${lead}`}>✕</button>
          ) : null}
        </span>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-line bg-paper p-3.5 shadow-card">
      <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("probes.title")}</div>
      <div className="mt-2 space-y-2">
        {leadRow("red")}
        {leadRow("black")}
      </div>
      <p className="mt-2.5 t-body-sm text-neutralx-fg3">{t("probes.instruction")}</p>
    </div>
  );
}
