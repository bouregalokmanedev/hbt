import { useEffect, useRef, useState } from "react";
import type { ReactNode, Ref } from "react";
import { Link } from "react-router-dom";

/*
|--------------------------------------------------------------------------
| Shared landing primitives
|--------------------------------------------------------------------------
| Single source of truth for section rhythm + type scale so every landing
| section shares the same padding, container, and heading styles.
*/

export function LandingSection({
  id,
  children,
  className = "",
  sectionRef,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  sectionRef?: Ref<HTMLElement>;
}) {
  return (
    <section id={id} ref={sectionRef} className={`relative isolate overflow-hidden py-10 sm:py-14 lg:py-16 ${className}`}>
      {children}
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
      className={`mt-4 font-bold tracking-tight ${
        size === "display"
          ? "text-5xl leading-[0.95] sm:text-6xl lg:text-7xl"
          : "text-3xl leading-[1.1] sm:text-4xl lg:text-[44px]"
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
      className={`mt-4 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8 ${
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

/*
|--------------------------------------------------------------------------
| Reveal — unified landing motion primitive
|--------------------------------------------------------------------------
| Fades/slides a header block in the first time it enters the viewport.
| `direction` mirrors automatically in RTL via logical rtl: variants.
*/

export type RevealDirection = "up" | "left" | "right" | "none";

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  direction?: RevealDirection;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const hidden =
    direction === "up"
      ? "translate-y-8"
      : direction === "left"
        ? "-translate-x-8 rtl:translate-x-8"
        : direction === "right"
          ? "translate-x-8 rtl:-translate-x-8"
          : "";

  return (
    <div
      ref={ref}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible
          ? "translate-x-0 translate-y-0 opacity-100"
          : `${hidden} opacity-0`
      } ${className}`}
    >
      {children}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| LandingMarquee — CSS-only keyword strip (rendered once, after Hero)
|--------------------------------------------------------------------------
| Two identical halves translate -50% on a loop; no JS ticker involved.
| dir="ltr" keeps the loop math identical in RTL locales.
*/

const MARQUEE_KEYWORDS = [
  "DIAGNOSTICS",
  "CAN BUS",
  "UDS",
  "OSCILLOSCOPE",
  "EV SYSTEMS",
  "ECU",
  "FAULT CODES",
  "LIVE DATA",
  "SENSORS",
  "ACTUATORS",
];

export function LandingMarquee() {
  return (
    <div
      aria-hidden="true"
      dir="ltr"
      className="relative overflow-hidden border-y border-white/10 bg-[#141414] py-4"
    >
      <div className="animate-landing-marquee flex w-max">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center gap-8 pr-8">
            {MARQUEE_KEYWORDS.map((keyword) => (
              <span key={keyword} className="flex items-center gap-8">
                <span className="whitespace-nowrap text-xs font-black uppercase tracking-[0.25em] text-white/70">
                  {keyword}
                </span>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47822]" />
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#141414] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#141414] to-transparent" />
    </div>
  );
}
