import clsx from "clsx";

import type { AtlasState, LocationAtlasEngine } from "@/features/simulator/location/engine/atlas.engine";
import { locByKey } from "@/features/simulator/location/data/location.data";

/**
 * Right panel for the Systems trace view (Browse) — the authentic system breakdown:
 * every fuse whose circuit list names the selected system, plus the relays and
 * control units serving it. Rows jump to the component's position on the board.
 */
export function SystemPanel({
  engine,
  state,
  t,
}: {
  engine: LocationAtlasEngine;
  state: AtlasState;
  t?: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const tr = (key: string, fallback: string, opts?: Record<string, unknown>) =>
    t ? (t(key, { defaultValue: fallback, ...opts } as Record<string, unknown>) as string) : fallback;

  const g = engine.system();
  if (!g) return null;

  const Rows = ({ label, keys }: { label: string; keys: string[] }) =>
    keys.length ? (
      <div className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="flex items-center gap-2 pb-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
          {label}
          <span className="rounded-full bg-[#3A3A3A]/[0.06] px-1.5 py-0.5 font-mono text-[10px] dark:bg-white/10">{keys.length}</span>
        </div>
        {keys.map((k) => {
          const c = locByKey(k)!;
          const active = state.selected === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => engine.select(k)}
              aria-current={active ? "true" : undefined}
              className={clsx(
                "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-start transition focus:outline-none focus:ring-2 focus:ring-[#F47822]/20",
                active ? "bg-[#F47822]/[0.07] ring-1 ring-[#F47822]/25" : "hover:bg-[#3A3A3A]/[0.04] dark:hover:bg-white/5",
              )}
            >
              <span
                dir="ltr"
                className={clsx(
                  "w-10 shrink-0 rounded-md px-1 py-0.5 text-center font-mono text-xs font-bold",
                  active ? "bg-[#F47822] text-white" : "bg-[#3A3A3A]/5 text-[#3A3A3A]/60 dark:bg-white/10 dark:text-white/60",
                )}
              >
                {c.ref}
              </span>
              <span className={clsx("min-w-0 flex-1 truncate text-sm", active ? "font-bold text-[#F47822]" : "text-[#3A3A3A] dark:text-white")}>{c.name}</span>
              {c.amp ? <span dir="ltr" className="font-mono text-xs text-[#3A3A3A]/40 dark:text-white/40">{c.amp}</span> : null}
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto border-s border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
      <div className="border-b border-[#3A3A3A]/10 p-4 dark:border-white/10">
        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F47822]">
          {tr("location.system.kicker", "System trace")}
        </div>
        <h2 className="mt-0.5 text-lg font-black text-[#3A3A3A] dark:text-white">{g.label}</h2>
        <div className="mt-0.5 text-sm text-[#3A3A3A]/60 dark:text-white/60">{tr("location.system.total", "{n} components", { n: g.total })}</div>
        <button
          type="button"
          onClick={() => engine.practise(g.fuses[0])}
          className="mt-3 w-full rounded-xl bg-[#F47822] px-3 py-2 text-sm font-black text-white shadow-[0_6px_14px_rgba(244,120,34,0.25)] transition hover:-translate-y-px hover:bg-[#E96D18] focus:outline-none focus:ring-2 focus:ring-[#F47822]/30"
        >
          {tr("location.system.practise", "Practise this system")}
        </button>
      </div>

      <Rows label={tr("location.system.fuses", "Fuses")} keys={g.fuses} />
      <Rows label={tr("location.system.relays", "Relays")} keys={g.relays} />
      <Rows label={tr("location.system.ecus", "Control units")} keys={g.ecus} />

      <div className="p-4">
        <p className="text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">
          {tr("location.system.note", 'Every fuse whose circuit list names "{label}", plus the relays and control units serving it. Select a row to jump to its position on the board.', {
            label: g.label,
          })}
        </p>
      </div>
    </aside>
  );
}
