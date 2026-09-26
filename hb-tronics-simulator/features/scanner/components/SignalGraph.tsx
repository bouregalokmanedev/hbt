"use client";

import { cn } from "@/lib/cn";
import type { ScannerScreenProps } from "./types";

const GRAPH_SIGNALS = ["RPM", "FRP", "FRPD", "LPP", "MAF", "LOAD"];
const COLORS = ["#F47822", "#1F6AE1", "#8B5CF6", "#D92D20", "#0E9F6E", "#B4560F"];

/** Multi-signal graph — up to 6 PIDs plotted over the live buffer (06 §1). LTR island. */
export function SignalGraph({ t, engine, state }: ScannerScreenProps) {
  const W = 760;
  const H = 260;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={() => engine.toggleLive()} className={cn("focus-ring rounded-md px-3 py-1.5 t-cta", state.livePlay ? "bg-fault-bg text-fault" : "bg-ok-bg text-ok")}>
          {state.livePlay ? t("graph.pause") : t("graph.play")}
        </button>
        <div className="flex flex-wrap gap-2">
          {GRAPH_SIGNALS.map((id, i) => (
            <span key={id} className="flex items-center gap-1.5 t-code text-ink">
              <span className="h-2.5 w-2.5 rounded-pill" style={{ background: COLORS[i] }} />
              {id}
            </span>
          ))}
        </div>
      </div>
      <div className="ltr-island overflow-x-auto rounded-xl border border-line bg-paper p-3" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Signal graph">
          {[0, 1, 2, 3, 4].map((i) => (
            <line key={i} x1={0} y1={(i / 4) * H} x2={W} y2={(i / 4) * H} stroke="#EFF1F5" strokeWidth={1} />
          ))}
          {GRAPH_SIGNALS.map((id, si) => {
            const s = state.live[id];
            if (!s) return null;
            const p = engine.pid(id);
            const pts = s.history
              .map((v: number, i: number) => {
                const x = (i / (s.history.length - 1)) * W;
                const y = H - ((v - p.min) / (p.max - p.min)) * (H - 8) - 4;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");
            return <polyline key={id} points={pts} fill="none" stroke={COLORS[si]} strokeWidth={1.6} />;
          })}
        </svg>
      </div>
    </div>
  );
}
