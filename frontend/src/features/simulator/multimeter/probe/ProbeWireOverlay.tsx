import { useEffect, useState } from "react";
import type { RefObject } from "react";

import type { Lead, MeterProcedureEngine } from "../engine/meter.engine";
import { cablePath, measureProbeWires, type ProbeWire } from "./probeGeometry";

const COLORS: Record<Lead, string> = { red: "#D92D20", black: "#14181C" };

/**
 * Viewport-fixed overlay drawing the committed probe cables: measured from
 * each seated DMM front jack across the panel gap down to the pin, with the
 * banana-plug tip on both ends. Re-measures continuously (rAF) so the wires
 * follow scroll, zoom and layout; re-measures on engine emissions too.
 */
export function ProbeWireOverlay({
    engine,
    scopeRef,
    hideLead = null,
}: {
    engine: MeterProcedureEngine;
    scopeRef: RefObject<HTMLElement | null>;
    hideLead?: Lead | null;
}) {
    const [wires, setWires] = useState<ProbeWire[]>([]);

    useEffect(() => {
        let raf = 0;
        let key = "";
        const measure = () => {
            const next = measureProbeWires(scopeRef.current, engine.getState());
            const k = next
                .map(
                    (w) =>
                        `${w.lead}:${Math.round(w.from.x)},${Math.round(w.from.y)}>${Math.round(w.to.x)},${Math.round(w.to.y)}`,
                )
                .join("|");
            if (k !== key) {
                key = k;
                setWires(next);
            }
        };
        const tick = () => {
            measure();
            raf = window.requestAnimationFrame(tick);
        };
        measure();
        const unsubscribe = engine.subscribe(measure);
        raf = window.requestAnimationFrame(tick);
        return () => {
            window.cancelAnimationFrame(raf);
            unsubscribe();
        };
    }, [engine, scopeRef]);

    const visible = wires.filter((w) => w.lead !== hideLead);
    if (visible.length === 0) return null;

    return (
        <svg data-testid="probe-wires" className="pointer-events-none fixed inset-0 z-40 h-full w-full" aria-hidden>
            {visible.map(({ lead, from, to }) => {
                const color = COLORS[lead];
                const d = cablePath(from, to);
                return (
                    <g key={lead}>
                        <path d={d} fill="none" stroke="#000" strokeOpacity={0.15} strokeWidth={7} strokeLinecap="round" />
                        <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
                        <path d={d} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.3} strokeLinecap="round" />
                        <circle cx={from.x} cy={from.y} r={6} fill={color} stroke="#fff" strokeWidth={1.5} />
                        <circle cx={to.x} cy={to.y} r={9} fill={color} stroke="#fff" strokeWidth={2} />
                        <circle cx={to.x} cy={to.y} r={3} fill="#E8EBEE" />
                    </g>
                );
            })}
        </svg>
    );
}
