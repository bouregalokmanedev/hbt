import { useCallback, useEffect, useRef, useState } from "react";

import type { Lead, MeterProcedureEngine } from "../engine/meter.engine";
import { sfx } from "../lib/sfx";

export interface ProbeDragState {
    lead: Lead;
    x: number;
    y: number;
}

/**
 * Real-time probe drag: pointer capture on the lead token, free cable follows
 * the cursor in viewport space, drop hit-tests `[data-probe-target]` under the
 * pointer (same semantic placeProbe as click-to-arm).
 */
export function useProbeDrag(engine: MeterProcedureEngine) {
    const [drag, setDrag] = useState<ProbeDragState | null>(null);
    const [armed, setArmed] = useState<Lead | null>(null);
    const dragging = useRef(false);

    const placeAt = useCallback(
        (lead: Lead, x: number, y: number): boolean => {
            const el = document.elementFromPoint(x, y);
            const targetEl = el instanceof Element ? el.closest("[data-probe-target]") : null;
            const target = targetEl?.getAttribute("data-probe-target");
            if (!target) return false;
            engine.placeProbe(target, lead);
            sfx.play("seat");
            return true;
        },
        [engine],
    );

    const onLeadPointerDown = useCallback(
        (lead: Lead, e: React.PointerEvent | React.MouseEvent) => {
            if (engine.getState().finished) return;
            e.preventDefault();
            e.stopPropagation();
            dragging.current = true;
            setArmed(lead);
            setDrag({ lead, x: e.clientX, y: e.clientY });
            sfx.play("arm");
            const win = window;
            const move = (ev: PointerEvent) => {
                if (!dragging.current) return;
                setDrag({ lead, x: ev.clientX, y: ev.clientY });
            };
            const up = (ev: PointerEvent) => {
                if (!dragging.current) return;
                dragging.current = false;
                const ok = placeAt(lead, ev.clientX, ev.clientY);
                setDrag(null);
                if (!ok) setArmed(lead);
                win.removeEventListener("pointermove", move);
                win.removeEventListener("pointerup", up);
                win.removeEventListener("pointercancel", up);
            };
            win.addEventListener("pointermove", move);
            win.addEventListener("pointerup", up);
            win.addEventListener("pointercancel", up);
        },
        [engine, placeAt],
    );

    const onPinClick = useCallback(
        (target: string) => {
            if (armed) {
                engine.placeProbe(target, armed);
                sfx.play("seat");
                setArmed(null);
                return;
            }
            engine.placeProbe(target);
            sfx.play("seat");
        },
        [armed, engine],
    );

    const arm = useCallback((lead: Lead | null) => {
        setArmed(lead);
        if (lead) sfx.play("arm");
    }, []);

    const clear = useCallback(() => {
        engine.clearProbes();
        setArmed(null);
        sfx.play("clear");
    }, [engine]);

    useEffect(() => {
        return () => {
            dragging.current = false;
        };
    }, []);

    return { drag, armed, onLeadPointerDown, onPinClick, arm, clear, setArmed };
}
