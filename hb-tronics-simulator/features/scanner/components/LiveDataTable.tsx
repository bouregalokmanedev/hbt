"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { PARAMS } from "@/data/scanner";
import { Sparkline } from "@/components/shared/Sparkline";
import { useAppStoreApi } from "@/providers/StoreProvider";
import type { ScannerScreenProps } from "./types";

type Filter = "all" | "selected" | "pinned" | "outOfSpec";
const DEFAULT_SELECTED = ["RPM", "ECT", "VBAT", "TPS", "FRP"];

const STATUS = {
  normal: { key: "inSpec", color: "#12A150" },
  warn: { key: "belowTarget", color: "#B4560F" },
  fault: { key: "outOfSpec", color: "#D92D20" },
} as const;

/**
 * Local Diagnostic — Live Data (SC, doc 17/19): 18-PID streaming card grid with
 * per-parameter value/spec/status/sparkline/max-min, filters, select + pin, and
 * the record/export/plot action bar. Streaming is engine-driven (no logic here).
 */
export function LiveDataTable({ t, engine, state }: ScannerScreenProps) {
  const api = useAppStoreApi();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_SELECTED));
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  const st = (id: string): keyof typeof STATUS => {
    const s = state.live[id]?.status;
    return s === "fault" || s === "warn" ? s : "normal";
  };
  const outOfSpecCount = PARAMS.filter((p) => st(p.id) !== "normal").length;

  const rows = PARAMS.filter((p) => {
    if (filter === "selected" && !selected.has(p.id)) return false;
    if (filter === "pinned" && !pinned.has(p.id)) return false;
    if (filter === "outOfSpec" && st(p.id) === "normal") return false;
    if (q) { const s = q.toLowerCase(); return p.id.toLowerCase().includes(s) || p.name.toLowerCase().includes(s); }
    return true;
  });

  const toggle = (set: Set<string>, id: string, setter: (s: Set<string>) => void) => {
    const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); setter(n);
  };
  const minmax = (id: string, dec: number) => {
    const h = state.live[id]?.history ?? [];
    if (!h.length) return { max: "—", min: "—" };
    return { max: Math.max(...h).toFixed(dec), min: Math.min(...h).toFixed(dec) };
  };

  const FILTERS: { id: Filter; n?: number }[] = [
    { id: "all", n: PARAMS.length }, { id: "selected", n: selected.size }, { id: "pinned", n: pinned.size }, { id: "outOfSpec", n: outOfSpecCount },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Filters + stream controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)}
              className={cn("focus-ring rounded-pill px-3 py-1.5 t-cta", filter === f.id ? "bg-[#14181C] text-white" : "border border-line2 text-ink hover:border-mod-scanner")}>
              {t(`live.filter.${f.id}`)}{f.n != null ? ` ${f.n}` : ""}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 t-eyebrow text-neutralx-fg3">
            <span className="h-1.5 w-1.5 rounded-pill bg-neutralx-fg2" aria-hidden /> {t("live.notRecording")}
          </span>
          <button type="button" onClick={() => engine.toggleLive()} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink hover:border-mod-scanner">
            {state.livePlay ? t("live.pauseStream") : t("live.resumeStream")}
          </button>
          <input dir="ltr" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("live.search")} className="focus-ring h-8 w-48 rounded-lg border border-line2 bg-paper2 px-3 t-body-sm outline-none" />
        </div>
      </div>

      {/* Parameter card grid */}
      <div className="mt-3 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-auto md:grid-cols-2 xl:grid-cols-3">
        {rows.map((p) => {
          const status = STATUS[st(p.id)];
          const mm = minmax(p.id, p.decimals);
          const sel = selected.has(p.id);
          return (
            <div key={p.id} className="rounded-xl border border-line bg-paper p-4">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={sel} onChange={() => toggle(selected, p.id, setSelected)} className="mt-1 accent-mod-scanner" aria-label={p.name} />
                <div className="min-w-0 flex-1">
                  <div className="t-body-sm font-semibold text-ink">{p.name}</div>
                  <div dir="ltr" className="t-eyebrow text-neutralx-fg2">{p.id} · {t("live.spec")} {p.spec}</div>
                </div>
                <button type="button" onClick={() => toggle(pinned, p.id, setPinned)} className={cn("focus-ring", pinned.has(p.id) ? "text-warn" : "text-neutralx-fg2 hover:text-warn")} aria-label="pin">★</button>
              </div>
              <div className="mt-2 flex items-end gap-3">
                <div className="shrink-0">
                  <div dir="ltr" className="t-display leading-none" style={{ color: status.color, fontSize: 26 }}>
                    {engine.formatted(p.id)} <span className="t-body text-neutralx-fg3">{p.unit}</span>
                  </div>
                  <div className="mt-1 t-eyebrow" style={{ color: status.color }}>{t(`live.${status.key}`)}</div>
                </div>
                <div className="min-w-0 flex-1"><Sparkline values={state.live[p.id]?.history ?? []} color={status.color} /></div>
                <div className="shrink-0 text-end">
                  <div dir="ltr" className="t-code text-neutralx-fg3">{t("live.max")} {mm.max}</div>
                  <div dir="ltr" className="t-code text-neutralx-fg3">{t("live.min")} {mm.min}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action bar */}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">‹ {t("live.back")}</button>
        <span className="t-eyebrow text-neutralx-fg3">{t("live.selectedCount", { k: selected.size, n: PARAMS.length })}</span>
        <div className="flex items-center gap-2">
          <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">{t("live.record")}</button>
          <button type="button" onClick={() => api.getState().say(t("live.exportCsv"))} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">{t("live.exportCsv")}</button>
          <button type="button" onClick={() => api.getState().say(t("live.plotSignals", { k: selected.size }))} className="focus-ring rounded-md bg-brand px-4 py-1.5 t-cta text-brand-on">{t("live.plotSignals", { k: selected.size })} →</button>
        </div>
      </div>
    </div>
  );
}
