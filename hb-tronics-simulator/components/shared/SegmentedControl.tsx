"use client";

import { cn } from "@/lib/cn";

export interface SegOption<T extends string> {
  value: T;
  label: string;
  locked?: boolean;
}

interface Props<T extends string> {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  onLocked?: (v: T) => void;
  ariaLabel?: string;
}

/**
 * Settings segmented control (03, 09 §8.4). Selected pill white + shadow-seg;
 * locked option muted + toast. Option order follows reading direction.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, onLocked, ariaLabel }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 rounded-lg bg-fill p-1"
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={selected}
            type="button"
            onClick={() => (opt.locked ? onLocked?.(opt.value) : onChange(opt.value))}
            className={cn(
              "focus-ring rounded-md px-3 py-1.5 t-cta transition-colors",
              selected ? "bg-paper text-ink shadow-seg" : "text-[#5A6672] hover:text-ink",
              opt.locked && "text-neutralx-fg4",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
