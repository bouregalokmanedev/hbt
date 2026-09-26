import type { ProbeDragState } from "../hooks/useProbeDrag";

const COLORS: Record<"red" | "black", string> = { red: "#D92D20", black: "#14181C" };

/**
 * Viewport-fixed overlay cable drawn while a lead is being dragged.
 * Origin follows the lead token's last bounding box (or viewport corner).
 */
export function ProbeCableOverlay({
    drag,
    origin,
}: {
    drag: ProbeDragState | null;
    origin: { x: number; y: number } | null;
}) {
    if (!drag) return null;
    const from = origin ?? { x: drag.x - 120, y: drag.y + 40 };
    const color = COLORS[drag.lead];
    const mx = (from.x + drag.x) / 2;
    const sag = 48;
    const d = `M ${from.x} ${from.y} C ${mx} ${from.y + sag}, ${mx} ${drag.y + sag}, ${drag.x} ${drag.y}`;
    return (
        <svg className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden>
            <path d={d} fill="none" stroke="#000" strokeOpacity={0.2} strokeWidth={7} strokeLinecap="round" />
            <path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#fff" strokeOpacity={0.25} strokeWidth={1.2} strokeLinecap="round" />
            <circle cx={drag.x} cy={drag.y} r={9} fill={color} stroke="#fff" strokeWidth={2} />
            <circle cx={drag.x} cy={drag.y} r={3} fill="#E8EBEE" />
        </svg>
    );
}
