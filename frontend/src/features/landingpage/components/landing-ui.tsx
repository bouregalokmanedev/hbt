import { useCallback, type ReactNode, type Ref } from "react";
import { Link } from "react-router-dom";

import { useFitToViewport } from "../hooks/useFitToViewport";

/*
|--------------------------------------------------------------------------
| Shared landing primitives
|--------------------------------------------------------------------------
| Single source of truth for section rhythm + type scale so every landing
| section shares the same padding, container, and heading styles.
| Sections are viewport-locked (md+) with scroll-snap: the fit hook scales
| content down — never up — so a section always fits one screen.
*/

export function LandingSection({
  id,
  children,
  className = "",
  sectionRef,
  fill = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  sectionRef?: Ref<HTMLElement>;
  /** true = locked to one viewport (fit-scaled if needed); false = sized to content (no dead space). */
  fill?: boolean;
}) {
  const { sectionRef: fitRef, contentRef, scale } = useFitToViewport();

  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      fitRef.current = node;
      if (typeof sectionRef === "function") sectionRef(node);
      else if (sectionRef) (sectionRef as { current: HTMLElement | null }).current = node;
    },
    [sectionRef, fitRef],
  );

  const base = "relative isolate overflow-hidden md:snap-start";
  const layout = fill
    ? "py-12 sm:py-14 md:flex md:h-[calc(100svh-5rem)] md:flex-col md:items-center md:justify-center md:py-0"
    : "py-16 sm:py-20";

  return (
    <section id={id} ref={setRefs} className={`${base} ${layout} ${className}`}>
      <div
        ref={contentRef}
        className="w-full"
        style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: "center center" } : undefined}
      >
        {children}
      </div>
    </section>
  );
}

export function LandingContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
  tone = "orange",
}: {
  children: ReactNode;
  tone?: "orange" | "light" | "muted";
}) {
  return (
    <p
      className={`text-[11px] font-bold uppercase tracking-[0.22em] ${
        tone === "orange"
          ? "text-[#F47822]"
          : tone === "light"
            ? "text-[#F9A16C]"
            : "text-[#3A3A3A]/45"
      }`}
    >
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  tone = "dark",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  tone?: "dark" | "white";
  size?: "md" | "display";
  className?: string;
}) {
  return (
    <h2
      className={`mt-3 font-bold tracking-tight ${
        size === "display"
          ? "text-4xl leading-[0.95] sm:text-5xl lg:text-[3.5rem]"
          : "text-2xl leading-[1.1] sm:text-3xl lg:text-[34px]"
      } ${
        tone === "white" ? "text-white" : "text-[#3A3A3A]"
      } ${className}`}
    >
      {children}
    </h2>
  );
}

export function SectionLead({
  children,
  tone = "dark",
  className = "",
}: {
  children: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <p
      className={`mt-3 max-w-2xl text-sm leading-6 sm:text-base sm:leading-7 ${
        tone === "light" ? "text-white/60" : "text-[#3A3A3A]/60"
      } ${className}`}
    >
      {children}
    </p>
  );
}

export function PrimaryCta({
  to,
  children,
  className = "",
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(244,120,34,.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#de6414] ${className}`}
    >
      {children}
    </Link>
  );
}

export function GhostCta({
  to,
  children,
  tone = "dark",
  className = "",
}: {
  to: string;
  children: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-6 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${
        tone === "light"
          ? "border-white/20 bg-white/[.06] text-white hover:border-white/35 hover:bg-white/[.14]"
          : "border-[#3A3A3A]/12 bg-white text-[#3A3A3A] hover:border-[#F47822]/35 hover:text-[#F47822]"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
