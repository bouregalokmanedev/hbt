import { cn } from "@/lib/cn";

interface Props {
  value: number; // 0-100
  className?: string;
  color?: string;
  height?: number;
  label?: string;
}

/** Progress bar (03). Fill animates width; meter follows reading direction. */
export function ProgressBar({ value, className, color = "#F47822", height = 6, label = "Progress" }: Props) {
  return (
    <div
      className={cn("w-full overflow-hidden rounded-pill bg-fill", className)}
      style={{ height }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-pill transition-[width] duration-300 ease-smooth"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}
