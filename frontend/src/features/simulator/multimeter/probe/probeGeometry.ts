import type { TFunction } from "i18next";

import type { ProbeTarget } from "../data/multimeter.data";
import type { JackId, Lead, MeterProcedureState } from "../engine/meter.engine";

export interface Point {
    x: number;
    y: number;
}

export interface ProbeWire {
    lead: Lead;
    from: Point;
    to: Point;
}

function anchorPoint(root: ParentNode | null, selector: string): Point | null {
    const el = root ? root.querySelector(selector) : null;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Human label for a probe target pin (same mapping as the pin aria-labels). */
export function probeTargetLabel(t: TFunction, target: ProbeTarget): string {
    if (target === "gnd") return t("simulator.dmmLab.bench.earthLabel");
    const pin = target.slice(1);
    if (target.startsWith("e")) return t("simulator.dmmLab.bench.ecuPin", { pin });
    return t("simulator.dmmLab.bench.componentPin", { pin });
}

/** Viewport point of a DMM front jack (banana plug seat), null when absent. */
export function jackViewportPoint(jack: JackId | null, root: ParentNode = document): Point | null {
    if (!jack) return null;
    return anchorPoint(root, `[data-jack-target="${jack}"]`);
}

/**
 * Committed probe wires in viewport coordinates: measured from the jack each
 * lead is seated in, down to the centre of the pin it touches — the overlay
 * draws them across the panel gap (screenshot design).
 */
export function measureProbeWires(
    root: ParentNode | null,
    state: Pick<MeterProcedureState, "red" | "black" | "redJack" | "blackJack">,
): ProbeWire[] {
    if (!root) return [];
    const wires: ProbeWire[] = [];
    for (const lead of ["red", "black"] as const) {
        const target = lead === "red" ? state.red : state.black;
        const jack = lead === "red" ? state.redJack : state.blackJack;
        if (!target || !jack) continue;
        const from = anchorPoint(root, `[data-jack-target="${jack}"]`);
        const to = anchorPoint(root, `[data-probe-target="${target}"]`);
        if (from && to) wires.push({ lead, from, to });
    }
    return wires;
}

/** Sagging cable between two viewport points (shared by committed + drag cables). */
export function cablePath(from: Point, to: Point, sag = 70): string {
    const mx = (from.x + to.x) / 2;
    return `M ${from.x} ${from.y} C ${mx} ${from.y + sag}, ${mx} ${to.y + sag}, ${to.x} ${to.y}`;
}
