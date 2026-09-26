"use client";

import { useState } from "react";
import { NODES, BUSES, type NodeStatus } from "@/data/scanner";
import { usePanZoom } from "@/components/shared/PanZoomSvg";
import { cn } from "@/lib/cn";

const STATUS_FILL: Record<NodeStatus, string> = {
  normal: "#EDF7F1",
  fault: "#FDECEA",
  warn: "#FFF3E8",
  none: "#F7F8FA",
  offline: "#F2F3F5",
};
const STATUS_STROKE: Record<NodeStatus, string> = {
  normal: "#12A150",
  fault: "#D92D20",
  warn: "#B4560F",
  none: "#C2C8D0",
  offline: "#8A9099",
};

/** ECU network map (09 §8.12). LTR technical island — fixed layout, never mirrors. */
export function EcuNetworkMap() {
  const [sel, setSel] = useState<string | null>("ECM");
  const [busFilter, setBusFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<NodeStatus | null>(null);
  // pan/zoom (09 §8.12 / 04 §2): drag to pan, zoom 0.6–1.8, fit — shared hook.
  const pan = usePanZoom({ min: 0.6, max: 1.8, initialZoom: 1 });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {[null, ...BUSES.map((b) => b.id)].map((b) => (
          <button
            key={b ?? "all"}
            type="button"
            onClick={() => setBusFilter(b)}
            className={cn(
              "focus-ring rounded-sm px-2.5 py-1 t-code",
              busFilter === b ? "bg-shell-surface text-white" : "border border-line2 bg-paper text-neutralx-fg3",
            )}
          >
            {b ?? "ALL"}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-line2" />
        {(["fault", "warn", "normal"] as NodeStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(statusFilter === s ? null : s)}
            className={cn(
              "focus-ring rounded-sm px-2.5 py-1 t-code capitalize",
              statusFilter === s ? "bg-shell-surface text-white" : "border border-line2 bg-paper text-neutralx-fg3",
            )}
          >
            {s}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-line2" />
        <button type="button" onClick={pan.zoomIn} className="focus-ring rounded-sm border border-line2 bg-paper px-2.5 py-1 t-code text-ink" title="Zoom in">+</button>
        <button type="button" onClick={pan.zoomOut} className="focus-ring rounded-sm border border-line2 bg-paper px-2.5 py-1 t-code text-ink" title="Zoom out">−</button>
        <button type="button" onClick={pan.fit} className="focus-ring rounded-sm border border-line2 bg-paper px-2.5 py-1 t-code text-ink">Fit</button>
        <span dir="ltr" className="t-code text-neutralx-fg3">{Math.round(pan.z * 100)}%</span>
      </div>
      {/* Non-visual alternative for the ECU-network canvas (10 §17). */}
      <table className="sr-only">
        <caption>ECU network — {NODES.length} modules across three buses</caption>
        <thead>
          <tr>
            <th>ECU</th>
            <th>System</th>
            <th>Bus</th>
            <th>Status</th>
            <th>Fault codes</th>
          </tr>
        </thead>
        <tbody>
          {NODES.map((n) => (
            <tr key={n.id}>
              <td>{n.id}</td>
              <td>{n.name}</td>
              <td>{n.bus}</td>
              <td>{n.status}</td>
              <td>{n.dtc}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ltr-island overflow-hidden rounded-xl border border-line bg-paper p-2" {...pan.containerProps}>
        <svg viewBox="0 0 1000 400" width="100%" role="img" aria-label="ECU network map" aria-hidden>
          <g transform={pan.groupTransform}>
          {BUSES.map((bus) => (
            <g key={bus.id}>
              <line x1={20} y1={bus.y} x2={980} y2={bus.y} stroke="#D5DCE3" strokeWidth={2} />
              <text x={20} y={bus.y - 8} className="t-code" fill="#8A9099" fontSize={11}>
                {bus.id} · {bus.label}
              </text>
            </g>
          ))}
          {NODES.map((n) => {
            const dim = (busFilter != null && n.bus !== busFilter) || (statusFilter != null && n.status !== statusFilter);
            const bus = BUSES.find((b) => b.id === n.bus)!;
            const selected = sel === n.id;
            return (
              <g key={n.id} opacity={dim ? 0.2 : 1} onClick={() => setSel(n.id)} style={{ cursor: "pointer" }}>
                <line x1={n.x + 58} y1={n.y + 38} x2={n.x + 58} y2={bus.y} stroke="#C2C8D0" strokeWidth={1.5} />
                <rect
                  x={n.x}
                  y={n.y}
                  width={116}
                  height={38}
                  rx={6}
                  fill={STATUS_FILL[n.status]}
                  stroke={selected ? "#1F6AE1" : STATUS_STROKE[n.status]}
                  strokeWidth={selected ? 3 : 1.4}
                />
                <text x={n.x + 8} y={n.y + 16} fontSize={11} fontWeight={600} fill="#131A26" className="t-code">
                  {n.id}
                </text>
                <text x={n.x + 8} y={n.y + 30} fontSize={9} fill="#5F6570">
                  {n.name}
                </text>
                {n.dtc > 0 ? (
                  <>
                    <circle cx={n.x + 108} cy={n.y + 8} r={7} fill="#D92D20" />
                    <text x={n.x + 108} y={n.y + 11} fontSize={9} fill="#fff" textAnchor="middle">
                      {n.dtc}
                    </text>
                  </>
                ) : null}
              </g>
            );
          })}
          </g>
        </svg>
      </div>
      {sel ? (
        <div className="mt-3 rounded-lg border border-line bg-paper p-4">
          {(() => {
            const n = NODES.find((x) => x.id === sel)!;
            return (
              <div className="flex items-center justify-between">
                <div>
                  <div dir="ltr" className="t-code text-ink">
                    {n.id} · {n.name}
                  </div>
                  <div className="t-eyebrow text-neutralx-fg3">
                    {n.bus} · {n.protocol}
                  </div>
                </div>
                <span
                  className="rounded-md px-2 py-0.5 t-code"
                  style={{ color: STATUS_STROKE[n.status], background: STATUS_FILL[n.status] }}
                >
                  {n.status.toUpperCase()} · {n.dtc} DTC
                </span>
              </div>
            );
          })()}
        </div>
      ) : null}
    </div>
  );
}
