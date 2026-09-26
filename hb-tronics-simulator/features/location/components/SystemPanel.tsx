"use client";

import type { LocationAtlasEngine, AtlasState } from "@sim/location";
import { locByKey } from "@/data/location/atlas";
import { cn } from "@/lib/cn";

/**
 * Right panel for the Systems trace view (Browse) — the authentic system breakdown:
 * every fuse whose circuit list names the selected system, plus the relays and
 * control units serving it. Rows jump to the component's position on the board.
 * Mirrors the source `sysPanel` (label / total / fuses / relays / ECUs / note).
 */
export function SystemPanel({ engine, state, t }: { engine: LocationAtlasEngine; state: AtlasState; t: any }) {
  const g = engine.system();
  if (!g) return null;

  const Rows = ({ label, keys }: { label: string; keys: string[] }) =>
    keys.length ? (
      <div className="border-b border-line p-4">
        <div className="pb-1.5 t-eyebrow tracking-[0.1em] text-neutralx-fg3">
          {label} · {keys.length}
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
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start", active ? "bg-mod-locationBg" : "hover:bg-fill")}
            >
              <span dir="ltr" className="t-code w-10 shrink-0 rounded-xs bg-fill px-1 py-0.5 text-center text-neutralx-fg3">{c.ref}</span>
              <span className="min-w-0 flex-1 truncate t-body-sm text-ink">{c.name}</span>
              {c.amp ? <span dir="ltr" className="t-code text-neutralx-fg4">{c.amp}</span> : null}
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-auto border-s border-line bg-paper">
      <div className="border-b border-line p-4">
        <div className="t-eyebrow tracking-[0.1em] text-neutralx-fg3">{t("system.kicker")}</div>
        <h2 className="mt-0.5 t-title text-ink" style={{ fontSize: 18 }}>{g.label}</h2>
        <div className="mt-0.5 t-body-sm text-neutralx-fg3">{t("system.total", { n: g.total })}</div>
        <button
          type="button"
          onClick={() => engine.practise(g.fuses[0])}
          className="focus-ring mt-3 w-full rounded-md bg-mod-location px-3 py-1.5 t-cta text-white"
        >
          {t("system.practise")}
        </button>
      </div>

      <Rows label={t("system.fuses")} keys={g.fuses} />
      <Rows label={t("system.relays")} keys={g.relays} />
      <Rows label={t("system.ecus")} keys={g.ecus} />

      <div className="p-4">
        <p className="t-body-sm text-neutralx-fg3">{t("system.note", { label: g.label })}</p>
      </div>
    </aside>
  );
}
