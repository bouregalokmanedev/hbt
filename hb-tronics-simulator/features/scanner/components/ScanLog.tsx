"use client";

import { NODES } from "@/data/scanner";
import type { ScannerScreenProps } from "./types";

/** Animated full-system scan log — 21 ECUs swept ~200 ms each (06 §1). LTR island. */
export function ScanLog({ t, engine, state }: ScannerScreenProps) {
  const faults = state.scanLog.filter((l) => l.status === "fault").length;
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => engine.startScan()}
          disabled={state.scanning}
          className="focus-ring rounded-md bg-mod-scanner px-4 py-2 t-cta text-white disabled:opacity-50"
        >
          {state.scanning ? t("scan.scanning") : t("scan.run")}
        </button>
        <span dir="ltr" className="t-mono text-xs text-neutralx-fg3">
          {state.scanIdx}/{NODES.length}
        </span>
        {state.scanDone ? <span className="t-body-sm text-ok">{t("scan.result", { faults, total: NODES.length })}</span> : null}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-pill bg-fill">
        <div className="h-full bg-mod-scanner transition-[width] duration-200" style={{ width: `${(state.scanIdx / NODES.length) * 100}%` }} />
      </div>
      <div className="ltr-island mt-3 max-h-[52vh] space-y-1 overflow-auto rounded-xl border border-line bg-[#0E1114] p-3" dir="ltr">
        {state.scanLog.map((l, i) => (
          <div key={i} className="flex items-center gap-3 t-mono text-xs">
            <span className="text-shell-dim">{String(i + 1).padStart(2, "0")}</span>
            <span className="w-16 text-shell-textHi">{l.ecu}</span>
            <span className="flex-1 text-shell-dim">{l.name}</span>
            <span style={{ color: l.status === "fault" ? "#E23D3D" : l.status === "warn" ? "#F59E0B" : l.status === "offline" || l.status === "none" ? "#8A9099" : "#17A768" }}>
              {l.status.toUpperCase()}{l.dtc > 0 ? ` · ${l.dtc} DTC` : ""}
            </span>
          </div>
        ))}
        {state.scanLog.length === 0 ? <p className="t-mono text-xs text-shell-dim">Press Run full scan to sweep all 21 ECUs.</p> : null}
      </div>
    </div>
  );
}
