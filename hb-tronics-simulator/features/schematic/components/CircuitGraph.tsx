"use client";

import { useMemo } from "react";
import type { SchematicWorkspaceEngine, WorkspaceState } from "@sim/schematic";
import { SCH_WIRES, SCH_COLOURS, type SchType } from "@/data/schematic/workspace";

const COLS: { g: string; label: string; types: SchType[] }[] = [
  { g: "power", label: "POWER", types: ["fuse"] },
  { g: "relay", label: "RELAYS", types: ["relay"] },
  { g: "ecu", label: "ECU", types: ["ecu"] },
  { g: "sensor", label: "SENSORS", types: ["sensor", "switch"] },
  { g: "actuator", label: "ACTUATORS", types: ["actuator", "module", "network", "connector"] },
  { g: "ground", label: "GROUNDS", types: ["ground"] },
];

/**
 * Circuit view — the source's synthesised column graph over the SAME netlist: 6
 * columns (POWER/RELAYS/ECU/SENSORS/ACTUATORS/GROUNDS), E1 as the tall central hub,
 * one Bézier edge per pin-table row (E1 ↔ target) coloured by wire colour. Node click
 * selects via the engine. Not an arbitrary graph layout — the authentic 1760×1560 board.
 */
export function CircuitGraph({ engine, state, tx, ty, z }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; tx: number; ty: number; z: number }) {
  const layout = useMemo(() => {
    const pos: Record<string, { x: number; y: number; w: number; h: number }> = {};
    const nodes: { key: string; code: string; name: string; x: number; y: number; h: number }[] = [];
    const cols: { label: string; x: number }[] = [];
    const comps = engine.components();
    COLS.forEach((col, ci) => {
      const x = 60 + ci * 280;
      cols.push({ label: col.label, x });
      const members = col.g === "ecu" ? comps.filter((c) => c.key === "E1") : comps.filter((c) => col.types.includes(c.type) && c.key !== "E1");
      members.forEach((c, ri) => {
        const h = col.g === "ecu" ? 116 : 50;
        const y = col.g === "ecu" ? 720 : 64 + ri * 56;
        pos[c.key] = { x, y, w: 240, h };
        nodes.push({ key: c.key, code: c.code, name: c.name.length > 28 ? c.name.slice(0, 27) + "…" : c.name, x, y, h });
      });
    });
    const edges: { d: string; stroke: string; on: boolean }[] = [];
    const a = pos["E1"];
    if (a) {
      for (const w of SCH_WIRES) {
        const b = pos[w.target];
        if (!b || w.target === "E1") continue;
        const left = b.x < a.x;
        const x1 = left ? b.x + 240 : a.x + 240;
        const y1 = left ? b.y + b.h / 2 : a.y + a.h / 2;
        const x2 = left ? a.x : b.x;
        const y2 = left ? a.y + a.h / 2 : b.y + b.h / 2;
        const on = state.sel === w.target || state.sel === "E1";
        edges.push({ d: `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`, stroke: state.layers.colours ? SCH_COLOURS[w.ecuColour] ?? "#98A2B3" : "#C9D0DA", on });
      }
    }
    return { pos, nodes, cols, edges };
  }, [engine, state.sel, state.layers.colours]);

  return (
    <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${tx}px,${ty}px) scale(${z})` }}>
      <div className="relative rounded-2xl border border-line bg-paper" style={{ width: 1760, height: 1560 }}>
        <svg viewBox="0 0 1760 1560" className="absolute inset-0" style={{ width: 1760, height: 1560 }}>
          {layout.edges.map((e, i) => (
            <path key={i} d={e.d} fill="none" stroke={e.stroke} strokeWidth={e.on ? 2.2 : 1} opacity={state.sel ? (e.on ? 0.9 : 0.08) : 0.3} />
          ))}
        </svg>
        {layout.cols.map((c) => (
          <div key={c.label} className="absolute t-code text-[12px] tracking-widest text-neutralx-fg4" style={{ left: c.x, top: 26 }}>{c.label}</div>
        ))}
        {layout.nodes.map((n) => {
          const isSel = state.sel === n.key;
          const isEcu = n.key === "E1";
          return (
            <button
              key={n.key}
              type="button"
              onClick={() => engine.select(n.key)}
              aria-label={`${n.code} ${n.name}`}
              aria-current={isSel ? "true" : undefined}
              className="absolute flex flex-col justify-center gap-0.5 rounded-[10px] border bg-paper text-start shadow-seg focus-ring"
              style={{ left: n.x, top: n.y, width: 240, height: n.h, padding: isEcu ? "0 16px" : "0 12px", borderWidth: isSel ? 2 : 1, borderColor: isSel ? "#B85708" : "var(--tw-line, #E2E6EC)" }}
            >
              <span dir="ltr" className="t-code" style={{ fontSize: isEcu ? 20 : 13, color: isSel ? "#B85708" : "#6B7789" }}>{n.code}</span>
              <span className="truncate t-body-sm text-neutralx-fg2">{n.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
