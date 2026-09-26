"use client";

import type { MeterProcedureEngine, MeterProcedureState, Lead } from "@sim/multimeter";
import type { MeterProcedureComponent } from "@/data/multimeter/procedures";
import { cn } from "@/lib/cn";

/**
 * Authentic wiring diagram — component connector (left, red-dashed) → control unit
 * (right, green) with the engine-earth symbol. Every pin is a probe target: click
 * seats the active lead (engine.placeProbe) and it is also an HTML drop zone for
 * dragged probe tokens. Rendering only; the reading comes from the engine.
 */
export function WiringView({ comp, state, engine, t, zoom, pinsOn, extended = false }: { comp: MeterProcedureComponent; state: MeterProcedureState; engine: MeterProcedureEngine; t: any; zoom: number; pinsOn: boolean; extended?: boolean }) {
  const cp = comp.pins;
  const ep = comp.ecu.pins;
  const H = Math.max(300, Math.max(cp.length, ep.length) * 46 + 70);
  const compY = (i: number) => 60 + ((i + 1) * (H - 90)) / (cp.length + 1);
  const ecuY = (i: number) => 50 + ((i + 1) * (H - 80)) / (ep.length + 1);

  const seatOf = (target: string): Lead | null => (state.red === target ? "red" : state.black === target ? "black" : null);
  const onDrop = (target: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const lead = e.dataTransfer.getData("text/plain");
    if (lead === "red" || lead === "black") engine.placeProbe(target, lead);
  };
  const nodeColor = (seat: Lead | null) => (seat === "red" ? "#D92D20" : seat === "black" ? "#14181C" : "#1F6AE1");

  return (
    <div dir="ltr" className="ltr-island h-full overflow-auto rounded-lg border border-line bg-white p-2">
      <svg viewBox={`0 0 560 ${H}`} width={`${100 * zoom}%`} role="group" aria-label={`${comp.name} wiring`} className="min-w-full">
        {/* extended view: additional harness rail across the top (source overlay) */}
        {extended ? (
          <g>
            <line x1={40} y1={18} x2={540} y2={18} stroke="#39424E" strokeWidth={1.6} />
            <text x={40} y={12} fill="#1D4ED8" fontSize={10} fontWeight={600} className="t-code">30</text>
            <rect x={300} y={8} width={16} height={22} fill="none" stroke="#0E7C66" strokeWidth={1.4} />
          </g>
        ) : null}
        {/* component connector */}
        <rect x={70} y={40} width={140} height={H - 80} rx={4} fill="none" stroke="#D92D20" strokeWidth={1.4} strokeDasharray="4 3" />
        <text x={80} y={58} fontSize={11} fill="#D92D20" className="t-code">{comp.code}</text>
        {/* control unit */}
        <rect x={470} y={30} width={70} height={H - 60} rx={4} fill="none" stroke="#0E7C66" strokeWidth={1.6} />
        <text x={505} y={24} textAnchor="middle" fontSize={10} fill="#0E7C66" className="t-code">{comp.ecu.code}</text>

        {/* wires */}
        {cp.map((pin, i) => {
          const y = compY(i);
          const linked = comp.links[String(pin)];
          const ei = linked ? ep.indexOf(linked) : -1;
          if (linked && ei >= 0) {
            const ey = ecuY(ei);
            const mid = 250 + i * 16;
            return <path key={`w${i}`} d={`M210 ${y} H ${mid} V ${ey} H 470`} fill="none" stroke="#8A9099" strokeWidth={1.2} />;
          }
          if ((comp.supply as (string | number)[]).includes(pin)) {
            return <path key={`w${i}`} d={`M210 ${y} H 300 V 20`} fill="none" stroke="#B4560F" strokeWidth={1.2} />;
          }
          return <line key={`w${i}`} x1={210} y1={y} x2={250} y2={y} stroke="#C2C8D0" strokeWidth={1.2} strokeDasharray="2 3" />;
        })}

        {/* component pins (targets) */}
        {cp.map((pin, i) => {
          const y = compY(i);
          const target = `c${pin}`;
          const seat = seatOf(target);
          return (
            <g key={target} data-target={target} onClick={() => engine.placeProbe(target)} onDragOver={(e) => e.preventDefault()} onDrop={onDrop(target)} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={t("proc.componentPin", { n: pin })}>
              <circle cx={210} cy={y} r={11} fill="transparent" />
              <circle cx={210} cy={y} r={5.5} fill={nodeColor(seat)} stroke={seat ? "#fff" : "none"} strokeWidth={1.5} />
              {pinsOn ? <text x={198} y={y + 3.5} textAnchor="end" fontSize={10} fill="#131A26" className="t-code">{pin}</text> : null}
            </g>
          );
        })}

        {/* ECU pins (targets) */}
        {ep.map((p, i) => {
          const y = ecuY(i);
          const target = `e${p}`;
          const seat = seatOf(target);
          return (
            <g key={target} data-target={target} onClick={() => engine.placeProbe(target)} onDragOver={(e) => e.preventDefault()} onDrop={onDrop(target)} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={t("proc.ecuPin", { code: comp.ecu.code, n: p })}>
              <circle cx={470} cy={y} r={11} fill="transparent" />
              <circle cx={470} cy={y} r={5} fill={seat ? nodeColor(seat) : "#0E7C66"} stroke={seat ? "#fff" : "none"} strokeWidth={1.5} />
              <text x={482} y={y + 3.5} fontSize={9} fill="#0E7C66" className="t-code">{p}</text>
            </g>
          );
        })}

        {/* engine earth (target) */}
        {(() => {
          const y = H - 26;
          const seat = seatOf("gnd");
          return (
            <g data-target="gnd" onClick={() => engine.placeProbe("gnd")} onDragOver={(e) => e.preventDefault()} onDrop={onDrop("gnd")} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={t("proc.earth")}>
              <circle cx={110} cy={y} r={12} fill="transparent" />
              <circle cx={110} cy={y} r={5.5} fill={seat ? nodeColor(seat) : "#5F6570"} stroke={seat ? "#fff" : "none"} strokeWidth={1.5} />
              <path d={`M110 ${y - 12} v-8 M101 ${y - 20} h18 M104 ${y - 24} h12 M107 ${y - 28} h6`} stroke="#5F6570" strokeWidth={1.3} fill="none" />
              <text x={128} y={y + 3.5} fontSize={9} fill="#8A9099">{t("wiring.earth")}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
