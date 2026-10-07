
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Reveal } from "./landing-ui";import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircuitBoard,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

const benefits = [
  "Structured automotive learning paths",
  "Hands-on diagnostic practice",
  "Progress you can track",
];

const capabilities = [
  {
    number: "01",
    label: "Learn",
    detail: "Build your technical foundation",
    icon: GraduationCap,
  },
  {
    number: "02",
    label: "Practice",
    detail: "Apply knowledge to real scenarios",
    icon: Wrench,
  },
  {
    number: "03",
    label: "Progress",
    detail: "Move forward with confidence",
    icon: ShieldCheck,
  },
];

export default function CTASection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="cta-heading"
      className="relative overflow-hidden bg-[#F7F7F7] px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16"
    >
      {/* Background technical grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.42]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(24,24,24,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(24,24,24,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
        }}
      />

      {/* Ambient accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full bg-[#F47822]/[0.07] blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -left-32 h-[420px] w-[420px] rounded-full bg-black/[0.035] blur-[100px]"
      />

      <div className="relative z-10 mx-auto max-w-[1440px]">
        {/* Main CTA panel */}
        <div
          className={`
            relative overflow-hidden rounded-[28px] bg-[#181818]
            shadow-[0_30px_90px_rgba(24,24,24,0.16)]
            transition-all duration-1000
            sm:rounded-[36px]
            ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }
          `}
        >
          {/* Panel grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
              `,
              backgroundSize: "42px 42px",
            }}
          />

          {/* Orange glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-40 h-[480px] w-[480px] rounded-full bg-[#F47822]/20 blur-[110px]"
          />

          {/* Decorative circuit trace */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 hidden h-full w-[48%] opacity-[0.22] lg:block"
            viewBox="0 0 620 600"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            <path
              d="M620 90H470V165H390V245H290V325H190V410H80"
              stroke="#F47822"
              strokeWidth="1.5"
            />
            <path
              d="M620 155H520V225H430V300H350V390H240V470H150"
              stroke="white"
              strokeWidth="1"
            />
            <path
              d="M620 360H540V420H450V490H360V550H260"
              stroke="#F47822"
              strokeWidth="1.5"
            />
            <path
              d="M430 0V80H350V145H275V215H195"
              stroke="white"
              strokeWidth="1"
            />
            <circle cx="470" cy="165" r="4" fill="#F47822" />
            <circle cx="390" cy="245" r="4" fill="#F47822" />
            <circle cx="290" cy="325" r="4" fill="#F47822" />
            <circle cx="190" cy="410" r="4" fill="#F47822" />
            <circle cx="520" cy="225" r="3" fill="white" />
            <circle cx="430" cy="300" r="3" fill="white" />
            <circle cx="350" cy="390" r="3" fill="white" />
            <circle cx="450" cy="490" r="3" fill="#F47822" />
            <circle cx="360" cy="550" r="3" fill="#F47822" />
          </svg>

          <div className="relative grid gap-10 px-5 py-7 sm:px-8 sm:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10 lg:px-12 lg:py-12">
            {/* Left: message and actions */}
            <div className="relative z-10 max-w-3xl">
              <Reveal>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.045] px-3.5 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F47822] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F47822]" />
                </span>

                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  Your next step starts here
                </span>
              </div>

              <h2
                id="cta-heading"
                className="max-w-3xl text-[clamp(2.5rem,5.2vw,5.4rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-white"
              >
                Turn what you
                <br className="hidden sm:block" />{" "}
                <span className="text-[#F47822]">know into</span>
                <br className="hidden sm:block" /> what you can do.
              </h2>

              <p className="mt-7 max-w-xl text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
                Develop your automotive diagnostic skills through structured
                learning, practical scenarios and a platform built to help you
                understand how systems work—not just memorize answers.
              </p>
              </Reveal>

              {/* Benefits */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#F47822]/15 text-[#F47822]">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>

                    <span className="text-xs text-white/55">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/courses"
                  className="
                    group inline-flex min-h-12 items-center justify-center gap-3
                    rounded-xl bg-[#F47822] px-6 py-3.5
                    text-sm font-semibold text-white
                    shadow-[0_10px_30px_rgba(244,120,34,0.18)]
                    transition-all duration-300
                    hover:-translate-y-0.5 hover:bg-[#ff8738]
                    hover:shadow-[0_14px_35px_rgba(244,120,34,0.28)]
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-[#F47822] focus-visible:ring-offset-2
                    focus-visible:ring-offset-[#181818]
                  "
                >
                  Explore courses
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  to="/simulator"
                  className="
                    group inline-flex min-h-12 items-center justify-center gap-3
                    rounded-xl border border-white/20 bg-white/[0.04]
                    px-6 py-3.5 text-sm font-semibold text-white
                    transition-all duration-300
                    hover:-translate-y-0.5 hover:border-white/35
                    hover:bg-white/[0.09]
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-white focus-visible:ring-offset-2
                    focus-visible:ring-offset-[#181818]
                  "
                >
                  Try the simulator
                  <ArrowUpRight className="h-4 w-4 text-white/55 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#F47822]" />
                </Link>
              </div>

              <p className="mt-5 text-[10px] leading-5 text-white/30">
                Learn at your pace. Practice with purpose. Build real
                diagnostic confidence.
              </p>
            </div>

            {/* Right: learning process */}
            <div className="relative z-10">
              <div className="relative mx-auto max-w-[480px]">
                {/* Top label */}
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircuitBoard className="h-4 w-4 text-[#F47822]" />
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40">
                      The HBTronics approach
                    </span>
                  </div>

                  <span className="font-mono text-[9px] text-white/25">
                    01 — 03
                  </span>
                </div>

                {/* Process card */}
                <div className="rounded-2xl border border-white/10 bg-[#222222]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-7">
                  <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5">
                    <div>
                      <p className="text-xs font-semibold text-white">
                        From knowledge to capability
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F47822]/10 text-[#F47822]">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {capabilities.map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.number}
                          className="
                            group flex items-center gap-4 rounded-xl
                            border border-white/[0.07] bg-white/[0.025]
                            p-4 transition-all duration-300
                            hover:border-[#F47822]/30 hover:bg-[#F47822]/[0.055]
                          "
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#F47822] transition-colors group-hover:border-[#F47822]/30 group-hover:bg-[#F47822]/10">
                            <Icon className="h-5 w-5" strokeWidth={1.7} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[8px] text-[#F47822]/70">
                                {item.number}
                              </span>
                              <h3 className="text-sm font-semibold text-white">
                                {item.label}
                              </h3>
                            </div>

                            <p className="mt-1 text-[10px] leading-5 text-white/40 sm:text-xs">
                              {item.detail}
                            </p>
                          </div>

                          <ChevronRight className="h-4 w-4 shrink-0 text-white/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#F47822]" />
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Small accent */}
                <div className="absolute -bottom-3 -right-3 -z-10 h-24 w-24 rounded-2xl border border-[#F47822]/30" />
              </div>
            </div>
          </div>

          {/* Bottom identity strip */}
          <div className="relative flex flex-col gap-3 border-t border-white/10 px-7 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
            <p className="text-[10px] text-white/35">
              HBTronics — Automotive diagnostics, made practical.
            </p>

            <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
              <span>Learn</span>
              <span className="text-[#F47822]">/</span>
              <span>Practice</span>
              <span className="text-[#F47822]">/</span>
              <span>Progress</span>
            </div>
          </div>
        </div>

        {/* Small footer note */}
        <div
          className={`
            mt-7 flex flex-col gap-2 text-center transition-all delay-300
            duration-700 sm:flex-row sm:items-center sm:justify-center sm:gap-3
            ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-3 opacity-0"
            }
          `}
        >
          <span className="text-xs text-[#181818]/40">
            Ready to take the next step?
          </span>
          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-[#181818] transition-colors hover:text-[#F47822]"
          >
            Find your learning path
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}