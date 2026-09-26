"use client";

import { cn } from "@/lib/cn";
import { ROTARY_MODES, type MeterMode } from "@/data/multimeter/procedures";

/**
 * Authentic rotary dial — 7 physical positions (OFF at the bottom, six functions
 * across the top arc). The knob pointer rotates to the selected mode; clicking a
 * position drives engine.setMode. No measurement logic here. Never a dropdown.
 */

// Pointer angle per position (deg, 0 = up, clockwise). OFF sits at the bottom.
const MODE_ANGLE: Record<MeterMode, number> = {
  OFF: 180,
  VDC: -129,
  VAC: -77,
  OHM: -26,
  MA: 26,
  A: 77,
  HZ: 129,
};
const LABEL: Record<MeterMode, string> = { OFF: "OFF", VDC: "V⎓", VAC: "V~", OHM: "Ω", MA: "mA", A: "A", HZ: "Hz" };

export function RotaryDial({ mode, onSelect }: { mode: MeterMode; onSelect: (m: MeterMode) => void }) {
  const R = 66; // label radius
  return (
    <div className="relative mx-auto my-1.5 h-[150px] w-[150px]" role="radiogroup" aria-label="Rotary function">
      {/* dial face */}
      <div
        className="absolute inset-0 rounded-full border-2 border-[#123F26]"
        style={{ background: "radial-gradient(circle at 34% 28%,#4EC97C,#1E7A45 62%,#145731)", boxShadow: "inset 0 2px 6px rgba(255,255,255,.28),0 4px 12px -4px rgba(0,0,0,.5)" }}
      />
      {/* knob + pointer */}
      <div
        className="absolute left-1/2 top-1/2 h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-300"
        style={{ transform: `translate(-50%,-50%) rotate(${MODE_ANGLE[mode]}deg)`, background: "radial-gradient(circle at 40% 34%,#FAFCFE,#D2DAE1 70%)", boxShadow: "0 3px 8px -2px rgba(0,0,0,.5)" }}
        aria-hidden
      >
        <div className="absolute left-1/2 top-[7px] h-9 w-[7px] -translate-x-1/2 rounded" style={{ background: "linear-gradient(#F4F7F9,#C3CCD4)" }} />
      </div>
      {/* positions */}
      {ROTARY_MODES.map((m) => {
        const a = (MODE_ANGLE[m] - 90) * (Math.PI / 180); // -90 → SVG/CSS 0=right
        const x = 75 + R * Math.cos(a);
        const y = 75 + R * Math.sin(a);
        const on = m === mode;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={m}
            onClick={() => onSelect(m)}
            className={cn(
              "focus-ring absolute -translate-x-1/2 -translate-y-1/2 rounded px-1 text-[10px] font-bold leading-none",
              on ? "text-white" : "text-[#0B3A22]/80 hover:text-white",
            )}
            style={{ left: x, top: y }}
          >
            {LABEL[m]}
          </button>
        );
      })}
    </div>
  );
}
