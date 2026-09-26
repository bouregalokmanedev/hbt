"use client";

import type { MeterProcedureState } from "@sim/multimeter";
import { MM_PROCEDURES, MM_GROUPS, MM_STEP_TOTAL } from "@/data/multimeter/procedures";
import { cn } from "@/lib/cn";

/**
 * Electronic-components sidebar — 11 components in their 4 authentic groups, each
 * with reference id, name and per-component step progress. Active component is
 * highlighted; cleared/found components show a completion dot.
 */
export function ComponentSidebar({ state, activeRef, onSelect, t }: { state: MeterProcedureState; activeRef: string; onSelect: (ref: string) => void; t: any }) {
  const clearedCount = Object.keys(state.done).length;
  return (
    <aside className="flex w-64 shrink-0 flex-col overflow-auto border-e border-line bg-paper">
      <div className="border-b border-line px-4 py-3">
        <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("sidebar.title")}</div>
        <div className="mt-1 t-body-sm text-neutralx-fg3">
          {t("sidebar.cleared", { done: clearedCount, total: MM_PROCEDURES.length })} · {t("sidebar.steps", { n: MM_STEP_TOTAL })}
        </div>
      </div>
      <div className="py-2">
        {MM_GROUPS.map((group) => (
          <div key={group} className="mb-1">
            <div className="px-4 pb-1 pt-2 t-eyebrow tracking-[0.1em] text-neutralx-fg4">{group}</div>
            {MM_PROCEDURES.filter((c) => c.group === group).map((c) => {
              const on = c.ref === activeRef;
              const d = state.done[c.ref];
              const steps = d ? d.steps : 0;
              return (
                <button
                  key={c.ref}
                  type="button"
                  onClick={() => onSelect(c.ref)}
                  aria-current={on ? "true" : undefined}
                  className={cn("flex w-full items-center gap-2.5 border-s-2 px-4 py-2 text-start", on ? "border-mod-multimeter bg-mod-multimeterBg" : "border-transparent hover:bg-fill")}
                >
                  <span dir="ltr" className={cn("t-code", on ? "text-mod-multimeter" : "text-neutralx-fg3")}>{c.ref}</span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate t-body-sm", on ? "font-medium text-ink" : "text-ink")}>{c.name}</span>
                    <span dir="ltr" className="t-code text-neutralx-fg4">{steps}/{c.steps.length}</span>
                  </span>
                  {d ? <span className={cn("h-2 w-2 shrink-0 rounded-pill", d.status === "clear" ? "bg-ok-mid" : "bg-mod-multimeter")} /> : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
