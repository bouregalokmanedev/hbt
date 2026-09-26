import { icons } from "./paths";
import { isDirectional } from "@/lib/i18n/directional-icons";
import { cn } from "@/lib/cn";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
  title?: string;
}

/**
 * Single icon renderer for the inline SVG path sets (10 §9).
 * Directional glyphs flip in RTL via the allow-list (14 §8); everything else
 * — tool glyphs, status marks, technical symbols — never mirrors.
 */
export function Icon({ name, size = 24, className, strokeWidth = 1.6, title, ...rest }: IconProps) {
  const glyph = icons[name];
  if (!glyph) return null;
  const flip = isDirectional(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn(flip && "rtl:-scale-x-100", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {glyph.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
