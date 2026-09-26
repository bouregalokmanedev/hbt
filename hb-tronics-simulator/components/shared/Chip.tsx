"use client";

import { cn } from "@/lib/cn";

interface Props {
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}

/**
 * Generic filter/segment chip used across tools (09 §8.11).
 * Selected: bg #14181C / white. Unselected: white / #5F6570 border #D5D9DD.
 */
export function Chip({ selected, disabled, onClick, children, title, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "focus-ring inline-flex h-[30px] items-center gap-1.5 rounded-sm px-3 t-cta transition-colors",
        selected
          ? "bg-shell-surface text-white"
          : "border border-[#D5D9DD] bg-paper text-shell-muted hover:border-brand",
        disabled && "cursor-not-allowed opacity-50 hover:border-[#D5D9DD]",
        className,
      )}
    >
      {children}
    </button>
  );
}
