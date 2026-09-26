"use client";

import { cn } from "@/lib/cn";

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}

/**
 * Toggle switch (09 §8.5). Track ON #F47822 / OFF #CBD2DB; knob travel 18px.
 * Direction-aware: knob uses logical translate that flips in RTL (14 §12).
 */
export function ToggleSwitch({ checked, onChange, ariaLabel }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        "focus-ring relative inline-flex h-[22px] w-[40px] shrink-0 items-center rounded-pill transition-colors duration-150",
        checked ? "bg-brand" : "bg-[#CBD2DB]",
      )}
    >
      <span
        className={cn(
          "absolute inline-block h-[16px] w-[16px] rounded-pill bg-white shadow-raise1 transition-transform duration-150",
          "start-[3px]",
          checked ? "translate-x-[18px] rtl:-translate-x-[18px]" : "translate-x-0",
        )}
      />
    </button>
  );
}
