"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { HERO_PANELS, FUNCTION_MODULES, RECENT_SESSIONS, META_CARDS } from "../data/workstation";
import type { ScannerScreen } from "./types";

/**
 * SC-01 Diagnostic Workstation + SC-02 function grid (doc 17/19).
 * Faithful reconstruction of the original Scanner landing. Structure is data-driven
 * (data/workstation.ts); learner-facing prose is Class-C (content.scanner.ws.*).
 */
export function Workstation({ go }: { go: (s: ScannerScreen) => void }) {
  const tc = useTranslations("content");
  const w = (k: string) => tc(`scanner.ws.${k}`);

  const heroTone: Record<string, string> = {
    dark: "bg-[#14181C] text-[#E8EAED]",
    brand: "bg-brand text-brand-on",
    light: "bg-paper text-ink border border-line",
  };
  const heroBadgeTone: Record<string, string> = {
    dark: "border border-white/15 text-[#8A9099]",
    brand: "bg-[#1A1206]/15 text-[#1A1206]",
    light: "border border-line2 text-neutralx-fg3",
  };

  return (
    <div className="mx-auto max-w-[1240px]">
      {/* Header + meta cards */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="t-eyebrow tracking-[0.14em] text-neutralx-fg3">{w("header.kicker")}</div>
          <h1 className="mt-1 t-title text-ink" style={{ fontSize: 28 }}>{w("header.heading")}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {META_CARDS.map((m) => (
            <div key={m.id} className="rounded-lg border border-line bg-paper px-3 py-2">
              <div className="t-eyebrow text-neutralx-fg3">{w(`meta.${m.id}`)}</div>
              <div dir="ltr" className="mt-0.5 t-code text-ink">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero panels */}
      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {HERO_PANELS.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => h.route && go(h.route)}
            className={cn(
              "focus-ring flex flex-col rounded-lg px-[18px] pb-4 pt-[18px] text-start shadow-card transition-shadow hover:shadow-panel",
              heroTone[h.tone],
              !h.route && "cursor-default",
            )}
          >
            <div className="flex items-center justify-between">
              <WsIcon name={h.icon} size={26} />
              <span className={cn("rounded-md px-2 py-0.5 t-eyebrow", heroBadgeTone[h.tone])}>{w(`hero.${h.badgeId}`)}</span>
            </div>
            <div className="mt-4 t-body font-semibold">{w(`hero.${h.id}.title`)}</div>
            <div className={cn("mt-1.5 t-body-sm", h.tone === "brand" ? "text-[#1A1206]/80" : "text-neutralx-fg3")}>
              {w(`hero.${h.id}.desc`)}
            </div>
          </button>
        ))}
      </div>

      {/* Function grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {FUNCTION_MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={m.locked}
            onClick={() => m.route && go(m.route)}
            className={cn(
              "focus-ring flex flex-col rounded-xl border border-line bg-paper p-4 text-start shadow-card transition-shadow",
              m.locked ? "opacity-60" : "hover:shadow-panel",
            )}
          >
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-mod-scannerBg text-mod-scanner">
                <WsIcon name={m.icon} size={18} />
              </span>
              {m.badge ? (
                <span dir="ltr" className={cn("rounded-md px-1.5 py-0.5 t-code", m.id === "software" ? "bg-fault-bg text-fault" : "bg-fill text-neutralx-fg3")}>
                  {m.badge}
                </span>
              ) : null}
            </div>
            <div className="mt-3 t-body-sm font-semibold text-ink">{w(`mod.${m.id}.title`)}</div>
            <div className="mt-0.5 t-eyebrow text-neutralx-fg2">{w(`mod.${m.id}.subtitle`)}</div>
          </button>
        ))}
      </div>

      {/* Recent sessions */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div className="t-eyebrow text-neutralx-fg3">{w("recent.title")}</div>
          <button type="button" onClick={() => go("history")} className="t-body-sm text-brand hover:underline">
            {w("recent.viewAll")}
          </button>
        </div>
        <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {RECENT_SESSIONS.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border-s-2 border-line bg-paper p-3" style={{ borderInlineStartColor: "#F47822" }}>
              <div className="min-w-0">
                <div className="t-body-sm font-semibold text-ink">{s.vehicle}</div>
                <div dir="ltr" className="t-code text-neutralx-fg3">{s.meta}</div>
              </div>
              <div className="text-end">
                <div dir="ltr" className="t-body font-semibold text-fault">{s.dtc}</div>
                <div className="t-eyebrow text-neutralx-fg3">{w("recent.dtc")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="mt-5 flex flex-col items-stretch gap-3 rounded-xl border border-line bg-paper p-3 sm:flex-row sm:items-center sm:justify-between">
        <div dir="ltr" className="t-code text-neutralx-fg3">{w("status.connected")}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go("systems")} className="focus-ring rounded-md border border-line2 px-3 py-2 t-cta text-ink hover:border-brand">
            {w("status.coverage")}
          </button>
          <button type="button" onClick={() => go("dashboard")} className="focus-ring rounded-md bg-brand px-4 py-2 t-cta text-brand-on">
            {w("status.start")} →
          </button>
        </div>
      </div>
    </div>
  );
}

/** Compact local line-icon set for the workstation (glyphs the shared Icon set lacks). */
function WsIcon({ name, size = 24 }: { name: string; size?: number }) {
  const P: Record<string, React.ReactNode> = {
    cloud: <path d="M6 16a3.5 3.5 0 0 1 .5-7 5 5 0 0 1 9.6 1.2A3 3 0 0 1 16 16H6Z" />,
    car: <><path d="M3 12l1.5-4.5A2 2 0 0 1 6.4 6h7.2a2 2 0 0 1 1.9 1.5L17 12v5H3v-5Z" /><path d="M3 12h14M6.5 15h.01M13.5 15h.01" /></>,
    reset: <><path d="M4 10a6 6 0 1 1 1 4" /><path d="M4 5v5h5" /></>,
    target: <><circle cx="10" cy="10" r="6.5" /><circle cx="10" cy="10" r="2.5" /></>,
    key: <><circle cx="7" cy="10" r="3" /><path d="M10 10h7l-1.5 2M14 10v3" /></>,
    gauge: <><path d="M4 15a6 6 0 1 1 12 0" /><path d="M10 15l3-3" /></>,
    history: <><path d="M4 10a6 6 0 1 1 2 4.5" /><path d="M4 6v4h4M10 7v3l2 2" /></>,
    upload: <><path d="M10 14V5M6.5 8.5 10 5l3.5 3.5" /><path d="M4 15h12" /></>,
    grid: <><rect x="4" y="4" width="5" height="5" rx="1" /><rect x="11" y="4" width="5" height="5" rx="1" /><rect x="4" y="11" width="5" height="5" rx="1" /><rect x="11" y="11" width="5" height="5" rx="1" /></>,
    cap: <><path d="M10 5l7 3-7 3-7-3 7-3Z" /><path d="M5 9v4c0 1 2.2 2 5 2s5-1 5-2V9" /></>,
    book: <><path d="M5 5h8a2 2 0 0 1 2 2v9H7a2 2 0 0 1-2-2V5Z" /><path d="M5 5v9" /></>,
    modules: <><rect x="4" y="4" width="5" height="5" rx="1" /><rect x="11" y="4" width="5" height="5" rx="1" /><rect x="7.5" y="11" width="5" height="5" rx="1" /></>,
    lock: <><rect x="5" y="9" width="10" height="7" rx="1.5" /><path d="M7.5 9V7a2.5 2.5 0 0 1 5 0v2" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {P[name] ?? <circle cx="10" cy="10" r="6" />}
    </svg>
  );
}
