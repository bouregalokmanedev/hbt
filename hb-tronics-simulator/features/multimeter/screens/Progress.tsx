"use client";

import type { MeterProcedureState } from "@sim/multimeter";
import { MM_PROCEDURES } from "@/data/multimeter/procedures";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { cn } from "@/lib/cn";

/**
 * Progress top-tab — per-component completion (steps done / status / score), the
 * cleared count and overall progress. Reads the engine's `done` map.
 */
export function Progress({ state, onOpen, t }: { state: MeterProcedureState; onOpen: (ref: string) => void; t: any }) {
  const total = MM_PROCEDURES.length;
  const cleared = Object.keys(state.done).length;
  return (
    <div className="overflow-auto p-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="t-section text-ink">{t("progress.overall")}</h2>
          <span dir="ltr" className="t-mono text-sm text-ink">{cleared}/{total}</span>
        </div>
        <ProgressBar value={(cleared / total) * 100} color="#1F6AE1" className="mt-2" />
        <div className="mt-4 space-y-2">
          {MM_PROCEDURES.map((c) => {
            const d = state.done[c.ref];
            return (
              <button key={c.ref} type="button" onClick={() => onOpen(c.ref)} className="focus-ring flex w-full items-center gap-3 rounded-lg border border-line bg-paper px-4 py-3 text-start hover:border-mod-multimeter">
                <span dir="ltr" className="t-code rounded-xs bg-mod-multimeterBg px-1.5 py-0.5 text-mod-multimeter">{c.ref}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate t-body-sm font-medium text-ink">{c.name}</span>
                  <span className="block t-eyebrow text-neutralx-fg3">{c.group} · <span dir="ltr">{d ? d.steps : 0}/{c.steps.length}</span> {t("progress.steps")}</span>
                </span>
                {d ? (
                  <span className={cn("rounded-md px-2 py-0.5 t-code", d.status === "clear" ? "bg-ok-bg text-ok" : "bg-mod-multimeterBg text-mod-multimeter")} dir="ltr">
                    {t(`progress.${d.status === "clear" ? "clear" : "found"}`)} · {d.score}
                  </span>
                ) : (
                  <span className="t-eyebrow text-neutralx-fg3">—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
