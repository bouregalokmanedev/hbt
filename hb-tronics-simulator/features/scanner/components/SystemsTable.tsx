"use client";

import { useMemo, useState } from "react";
import { NODES, LAST_SCAN, type NodeStatus } from "@/data/scanner";
import { cn } from "@/lib/cn";
import type { ScannerScreen } from "../screens/types";

type Filter = "all" | "faults" | "warnings" | "attention" | "normal";

const STATUS: Record<NodeStatus, { key: string; dot: string; fg: string }> = {
  normal: { key: "normal", dot: "#12A150", fg: "text-ok" },
  warn: { key: "warning", dot: "#B4560F", fg: "text-warn" },
  fault: { key: "fault", dot: "#D92D20", fg: "text-fault" },
  offline: { key: "noResponse", dot: "#9AA0A6", fg: "text-neutralx-fg3" },
  none: { key: "noResponse", dot: "#9AA0A6", fg: "text-neutralx-fg3" },
};
const attention = (s: NodeStatus) => s === "fault" || s === "warn" || s === "offline" || s === "none";

/** Local Diagnostic — System List (SC, doc 17/19): 21-ECU scan table with
 * status filters, search, per-row actions and the scan action bar. */
export function SystemsTable({ t, go }: { t: any; go?: (s: ScannerScreen) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [dir, setDir] = useState<1 | -1>(1);

  const counts = useMemo(() => ({
    all: NODES.length,
    faults: NODES.filter((n) => n.status === "fault").length,
    warnings: NODES.filter((n) => n.status === "warn").length,
    attention: NODES.filter((n) => attention(n.status)).length,
    normal: NODES.filter((n) => n.status === "normal").length,
  }), []);

  const rows = useMemo(() => {
    let r = NODES.filter((n) => {
      if (filter === "faults") return n.status === "fault";
      if (filter === "warnings") return n.status === "warn";
      if (filter === "attention") return attention(n.status);
      if (filter === "normal") return n.status === "normal";
      return true;
    });
    if (q) { const s = q.toLowerCase(); r = r.filter((n) => n.id.toLowerCase().includes(s) || n.name.toLowerCase().includes(s)); }
    return [...r].sort((a, b) => (a.bus > b.bus ? dir : a.bus < b.bus ? -dir : 0));
  }, [filter, q, dir]);

  const FILTERS: { id: Filter; count?: number }[] = [
    { id: "all", count: counts.all }, { id: "faults", count: counts.faults }, { id: "warnings", count: counts.warnings },
    { id: "attention" }, { id: "normal" },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Filter chips + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => setFilter(f.id)}
              className={cn("focus-ring rounded-pill px-3 py-1.5 t-cta", filter === f.id ? "bg-[#14181C] text-white" : "border border-line2 text-ink hover:border-mod-scanner")}>
              {t(`systems.filter.${f.id}`)}{f.count != null ? ` ${f.count}` : ""}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="t-eyebrow text-neutralx-fg3">{t("systems.count", { n: rows.length, total: counts.all })}</span>
          <input dir="ltr" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("systems.search")} className="focus-ring h-8 w-52 rounded-lg border border-line2 bg-paper2 px-3 t-body-sm outline-none" />
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full min-w-[820px]">
          <thead className="sticky top-0 bg-paper">
            <tr className="border-b border-line">
              <Th>{t("systems.ecu")}</Th>
              <Th>{t("systems.system")}</Th>
              <th className="cursor-pointer p-3 text-start t-eyebrow text-neutralx-fg3" onClick={() => setDir((d) => (d === 1 ? -1 : 1))}>{t("systems.bus")} {dir === 1 ? "↑" : "↓"}</th>
              <Th>{t("systems.status")}</Th>
              <Th>{t("systems.dtc")}</Th>
              <Th>{t("systems.lastScan")}</Th>
              <th className="p-3 text-end t-eyebrow text-neutralx-fg3">{t("systems.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => {
              const st = STATUS[n.status];
              return (
                <tr key={n.id} className="border-b border-line3 last:border-0 hover:bg-fill/40">
                  <td dir="ltr" className="p-3 t-code text-ink">{n.id}</td>
                  <td className="p-3 t-body-sm text-ink">{n.name}</td>
                  <td dir="ltr" className="p-3 t-code text-neutralx-fg3">{n.bus}</td>
                  <td className="p-3">
                    <span className={cn("inline-flex items-center gap-1.5 t-body-sm", st.fg)}>
                      <span className="h-1.5 w-1.5 rounded-pill" style={{ background: st.dot }} aria-hidden />
                      {t(`systems.st.${st.key}`)}
                    </span>
                  </td>
                  <td dir="ltr" className={cn("p-3 t-mono text-xs", n.dtc > 0 ? "font-semibold text-fault" : "text-neutralx-fg3")}>{n.dtc}</td>
                  <td dir="ltr" className="p-3 t-code text-neutralx-fg3">{LAST_SCAN}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1.5">
                      <button type="button" onClick={() => go?.("network")} className="focus-ring rounded-md border border-line2 px-2.5 py-1 t-cta text-ink hover:border-mod-scanner">{t("systems.open")}</button>
                      <button type="button" onClick={() => go?.("dtcs")} className="focus-ring rounded-md border border-line2 px-2.5 py-1 t-cta text-ink hover:border-mod-scanner">{t("systems.dtcs")}</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action bar */}
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">‹ {t("systems.back")}</button>
        <span className="t-eyebrow text-neutralx-fg3">{t("systems.responded", { n: counts.all, total: counts.all })}</span>
        <div className="flex items-center gap-2">
          <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">{t("systems.scanAgain")}</button>
          <button type="button" onClick={() => go?.("report")} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">{t("systems.report")}</button>
          <button type="button" onClick={() => go?.("dtcs")} className="focus-ring rounded-md bg-brand px-4 py-1.5 t-cta text-brand-on">{t("systems.faultCodes")} →</button>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="p-3 text-start t-eyebrow text-neutralx-fg3">{children}</th>;
}
