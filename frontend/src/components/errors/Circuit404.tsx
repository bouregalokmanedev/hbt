import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CarFront,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Home,
  LifeBuoy,
  RotateCcw,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { useTranslation } from "react-i18next";

import { Link } from "react-router-dom";

type Circuit404Props = {
  onBack?: () => void;
};

const recoveryLinks = [
  {
    labelKey: "notFoundPage.navDashboard",
    href: "/",
    icon: Home,
  },
  {
    labelKey: "notFoundPage.navSimulator",
    href: "/simulator",
    icon: CarFront,
  },
  {
    labelKey: "notFoundPage.navCourses",
    href: "/catalog",
    icon: BookOpen,
  },
  {
    labelKey: "notFoundPage.navCertificate",
    href: "/verify-certificate",
    icon: ShieldCheck,
  },
];

function CircuitLine({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 500 180"
      fill="none"
      className={`absolute pointer-events-none ${className}`}
      style={{
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    >
      <path
        d="M0 90H105C125 90 130 90 145 75L195 25C205 15 218 10 235 10H500"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth="2"
      />

      <path
        d="M0 90H105C125 90 130 90 145 75L195 25C205 15 218 10 235 10H500"
        stroke="#F47822"
        strokeWidth="2"
        strokeDasharray="5 15"
        strokeLinecap="round"
        className="animate-[electricFlow_2.2s_linear_infinite]"
      />

      <circle
        cx="0"
        cy="90"
        r="4"
        fill="#F47822"
      />

      <circle
        cx="500"
        cy="10"
        r="4"
        fill="#F47822"
      />
    </svg>
  );
}

function Pin({
  active = false,
  className = "",
}: {
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex h-4 w-4 items-center justify-center rounded-[3px] border ${
        active
          ? "border-[#F47822]/70 bg-[#F47822]/20"
          : "border-white/10 bg-white/[0.03]"
      } ${className}`}
    >
      {active && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47822]" />
      )}
    </div>
  );
}

function ECUBox() {
  const { t } = useTranslation();

  return (
    <div className="relative mx-auto w-full max-w-[390px]">
      {/* outer glow */}
      <div className="absolute inset-[-30px] rounded-[40px] bg-[#F47822]/5 blur-3xl" />

      {/* ECU */}
      <div className="relative rounded-[26px] border border-white/10 bg-[#171717] p-2 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
        {/* top metal strip */}
        <div className="flex h-12 items-center justify-between border-b border-white/8 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F47822] text-white">
              <Zap className="h-3.5 w-3.5" />
            </div>

            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/30">
                {t("notFoundPage.electronicControl")}
              </p>

              <p className="text-[11px] font-black text-white">
                {t("notFoundPage.ecuTitle")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47822]" />

            <span className="font-mono text-[8px] uppercase tracking-widest text-[#F47822]">
              {t("notFoundPage.diagnostic")}
            </span>
          </div>
        </div>

        {/* main ECU */}
        <div className="relative p-6">
          {/* circuit grid */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative">
            {/* ECU chip */}
            <div className="mx-auto flex aspect-[1.3/1] max-w-[240px] flex-col justify-between rounded-2xl border border-white/10 bg-[#202020] p-5 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">
                  MODULE
                </span>

                <span className="font-mono text-[8px] text-[#F47822]">
                  HBT-404
                </span>
              </div>

              <div className="text-center">
                <div className="text-[44px] font-black tracking-[-0.07em] text-white">
                  404
                </div>

                <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.25em] text-[#F47822]">
                  {t("notFoundPage.routeNotFound")}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-1/2 animate-[ecuScan_1.8s_ease-in-out_infinite] rounded-full bg-[#F47822]" />
                </div>

                <span className="font-mono text-[8px] text-white/20">
                  ECU-404
                </span>
              </div>
            </div>

            {/* pins */}
            <div className="absolute -left-1 top-[12%] flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Pin
                  key={`left-${i}`}
                  active={i === 2 || i === 4}
                />
              ))}
            </div>

            <div className="absolute -right-1 top-[12%] flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Pin
                  key={`right-${i}`}
                  active={i === 1 || i === 5}
                />
              ))}
            </div>

            <div className="absolute -bottom-1 left-[20%] flex gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Pin
                  key={`bottom-${i}`}
                  active={i === 3}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ECU bottom status */}
        <div className="grid grid-cols-3 border-t border-white/8">
          <div className="border-r border-white/8 p-4">
            <p className="font-mono text-[7px] uppercase tracking-widest text-white/25">
              {t("notFoundPage.signal")}
            </p>

            <p className="mt-1 font-mono text-[10px] font-bold text-red-400">
              {t("notFoundPage.lost")}
            </p>
          </div>

          <div className="border-r border-white/8 p-4">
            <p className="font-mono text-[7px] uppercase tracking-widest text-white/25">
              {t("notFoundPage.response")}
            </p>

            <p className="mt-1 font-mono text-[10px] font-bold text-[#F47822]">
              404
            </p>
          </div>

          <div className="p-4">
            <p className="font-mono text-[7px] uppercase tracking-widest text-white/25">
              {t("notFoundPage.recoveryStatus")}
            </p>

            <p className="mt-1 font-mono text-[10px] font-bold text-emerald-400">
              {t("notFoundPage.ready")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Circuit404({
  onBack,
}: Circuit404Props) {
  const { t } = useTranslation();
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    document.body.style.background = "#101010";

    return () => {
      document.body.style.background = "";
    };
  }, []);

  const recover = () => {
    setRecovering(true);

    window.setTimeout(() => {
      if (onBack) {
        onBack();
      } else {
        window.location.href = "/";
      }
    }, 700);
  };

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#101010] text-white">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-20%] h-[500px] w-[500px] rounded-full bg-[#F47822]/[0.07] blur-[120px]" />

        <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-white/[0.025] blur-[140px]" />

        {/* grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1600px] flex-col px-5 py-5 sm:px-8 lg:px-12">
        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-white/[0.07] pb-5">
          <Link
            to="/"
            className="group flex items-center gap-3"
          >
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#F47822]">
              <div className="absolute inset-0 bg-white/10 transition group-hover:scale-150" />

              <span className="relative text-[11px] font-black text-white">
                HBT
              </span>
            </div>

            <div>
              <p className="text-sm font-black tracking-tight text-white">
                HBTronics
              </p>

              <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/30">
                {t("notFoundPage.tagline")}
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">
              {t("notFoundPage.network")}
            </span>

            <span className="flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

              <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-emerald-400">
                {t("notFoundPage.online")}
              </span>
            </span>
          </div>
        </header>

        {/* CONTENT */}
        <section className="relative flex flex-1 items-center py-10 lg:py-12">
          <div className="grid w-full items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] xl:gap-24">
            {/* LEFT */}
            <div className="relative order-2 lg:order-1">
              <div className="mb-7 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F47822]/20 bg-[#F47822]/5">
                  <CircleAlert className="h-4 w-4 text-[#F47822]" />
                </div>

                <div>
                  <p className="font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-[#F47822]">
                    {t("notFoundPage.fault")}
                  </p>

                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-white/25">
                    {t("notFoundPage.routeController")}
                  </p>
                </div>
              </div>

              {/* Massive typography */}
              <div className="relative">
                <h1 className="text-[clamp(120px,18vw,250px)] font-black leading-[0.72] tracking-[-0.11em] text-white">
                  404
                </h1>

                <div className="mt-6 h-px w-full bg-white/[0.08]" />

                <div className="absolute -bottom-2 left-[10%] h-1 w-[25%] overflow-hidden rounded-full bg-white/5">
                  <div className="h-full w-1/2 animate-[signalSearch_2s_ease-in-out_infinite] rounded-full bg-[#F47822]" />
                </div>
              </div>

              <div className="mt-10 max-w-xl">
                <h2 className="text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">
                  {t("notFoundPage.headline")}
                  <span className="text-[#F47822]">{t("notFoundPage.headlineAccent")}</span>
                </h2>

                <p className="mt-5 text-sm leading-7 text-white/45 sm:text-base">
                  {t("notFoundPage.body")}
                </p>
              </div>

              {/* status */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />

                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">
                    {t("notFoundPage.routeUnavailable")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F47822]" />

                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">
                    {t("notFoundPage.signalSearching")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">
                    {t("notFoundPage.platformOnline")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={recover}
                  disabled={recovering}
                  className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-6 text-xs font-black text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff8630] hover:shadow-[0_15px_40px_rgba(244,120,34,0.25)] disabled:cursor-wait disabled:opacity-70"
                >
                  {recovering ? (
                    <>
                      <RotateCcw className="h-4 w-4 animate-spin" />
                      {t("notFoundPage.restoring")}
                    </>
                  ) : (
                    <>
                      <Home className="h-4 w-4" />
                      {t("notFoundPage.restore")}
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      window.location.href = "/";
                    }
                  }}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 text-xs font-bold text-white/70 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("notFoundPage.goBack")}
                </button>
              </div>
            </div>

            {/* RIGHT */}
            <div className="relative order-1 flex items-center justify-center lg:order-2">
              {/* Circuit lines behind ECU */}
              <CircuitLine className="-left-[30%] top-[12%] hidden h-[180px] w-[500px] lg:block" />

              <CircuitLine
                className="-right-[25%] bottom-[8%] hidden h-[180px] w-[500px] lg:block"
                flip
              />

              {/* ECU */}
              <div className="relative w-full">
                <ECUBox />

                {/* top floating label */}
                <div className="absolute -right-2 -top-6 hidden rounded-lg border border-white/10 bg-[#181818] px-3 py-2 shadow-xl sm:block">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F47822]" />

                    <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-white/35">
                      {t("notFoundPage.traceActive")}
                    </span>
                  </div>
                </div>

                {/* bottom floating diagnostic */}
                <div className="absolute -bottom-7 -left-2 hidden rounded-xl border border-white/10 bg-[#181818] px-4 py-3 shadow-2xl sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F47822]/10">
                      <Zap className="h-3.5 w-3.5 text-[#F47822]" />
                    </div>

                    <div>
                      <p className="font-mono text-[7px] uppercase tracking-widest text-white/25">
                        {t("notFoundPage.recoveryStatus")}
                      </p>

                      <p className="mt-0.5 text-[10px] font-bold text-white">
                        {t("notFoundPage.recoveryReady")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RECOVERY NAV */}
        <section className="border-t border-white/[0.07] py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <LifeBuoy className="h-4 w-4 text-white/25" />

              <div>
                <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-white/25">
                  {t("notFoundPage.recoveryRoutes")}
                </p>

                <p className="mt-0.5 text-[10px] text-white/35">
                  {t("notFoundPage.selectSystem")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {recoveryLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.labelKey}
                    to={item.href}
                    className="group flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 transition duration-300 hover:border-[#F47822]/30 hover:bg-[#F47822]/5"
                  >
                    <Icon className="h-3.5 w-3.5 text-white/35 transition group-hover:text-[#F47822]" />

                    <span className="text-[10px] font-bold text-white/45 transition group-hover:text-white">
                      {t(item.labelKey)}
                    </span>

                    <ChevronRight className="h-3 w-3 text-white/15 transition group-hover:translate-x-0.5 group-hover:text-[#F47822]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex items-center justify-between border-t border-white/[0.07] pt-4">
          <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/20">
            HBTRONICS • AUTOMOTIVE LEARNING PLATFORM
          </span>

          <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/15">
            DTC: HBT-404
          </span>
        </footer>
      </div>

      <style>{`
        @keyframes electricFlow {
          from {
            stroke-dashoffset: 0;
          }

          to {
            stroke-dashoffset: -80;
          }
        }

        @keyframes ecuScan {
          0% {
            transform: translateX(-100%);
          }

          50% {
            transform: translateX(200%);
          }

          100% {
            transform: translateX(-100%);
          }
        }

        @keyframes signalSearch {
          0% {
            transform: translateX(-120%);
          }

          50% {
            transform: translateX(220%);
          }

          100% {
            transform: translateX(-120%);
          }
        }
      `}</style>
    </main>
  );
}