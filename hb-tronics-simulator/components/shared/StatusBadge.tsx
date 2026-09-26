import { statusColor, type StatusKind } from "@sim/core";
import { cn } from "@/lib/cn";

interface Props {
  kind: StatusKind;
  glyph?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Status badge (03/09 §8.10) with colour + glyph redundancy (a11y, 09 §13).
 * Colour pair comes from the single statusColor() helper in sim-core.
 */
export function StatusBadge({ kind, glyph, children, className }: Props) {
  const c = statusColor(kind);
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-sm px-2 py-0.5 t-code", className)}
      style={{ color: c.fg, background: c.bg }}
    >
      {glyph ? <span aria-hidden>{glyph}</span> : null}
      {children}
    </span>
  );
}
