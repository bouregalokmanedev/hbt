"use client";

import { cn } from "@/lib/cn";
import { RAIL_ITEMS, RAIL_GROUP, RAIL_ASSISTANT_D } from "../data/rail";
import type { ScannerScreen } from "../screens/types";

/**
 * Scanner 66px icon rail (SC, doc 17). Faithful reconstruction of the original tool
 * rail: dark 66px column, SCAN home tile on top, nine icon+caption tool items with an
 * orange active state + start-edge indicator bar, and the Diagnostic Assistant toggle
 * pinned to the bottom. Colours/metrics taken verbatim from the original DOM.
 */
export function ScannerRail({
  screen,
  go,
  t,
  aiOpen,
  onToggleAi,
}: {
  screen: ScannerScreen;
  go: (s: ScannerScreen) => void;
  t: (k: string) => string;
  aiOpen: boolean;
  onToggleAi: () => void;
}) {
  const activeGroup = RAIL_GROUP[screen];

  return (
    <nav
      aria-label={t("rail.label")}
      className="flex w-[66px] shrink-0 flex-col items-center gap-0.5 bg-[#14181C] pb-2.5 pt-3"
    >
      {/* SCAN home tile */}
      <button
        type="button"
        onClick={() => go("workstation")}
        title={t("rail.home")}
        className="mb-2.5 flex h-[38px] w-[38px] items-center justify-center rounded-[9px] border border-[#F47822]/40 bg-[#F47822]/[0.14] font-mono text-[8px] font-bold leading-none tracking-[0.08em] text-[#F47822]"
      >
        SCAN
      </button>

      {/* Tool items */}
      {RAIL_ITEMS.map((it) => {
        const on = activeGroup === it.group;
        return (
          <button
            key={it.group}
            type="button"
            onClick={() => go(it.screen)}
            title={t(`nav.${it.screen}`)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "focus-ring relative flex h-[46px] w-[52px] flex-col items-center justify-center gap-[3px] rounded-lg",
              on ? "bg-[#F47822]/10 text-[#F47822]" : "text-[#8B9198] hover:bg-white/[0.07] hover:text-[#E8EAED]",
            )}
          >
            {/* Active indicator bar (start edge, mirrors under RTL) */}
            {on ? <span className="absolute start-[-11px] top-[11px] h-6 w-[3px] rounded-e-[3px] bg-[#F47822]" /> : null}
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={it.d} />
            </svg>
            <span className="text-[7.5px] font-semibold uppercase leading-none tracking-[0.06em] opacity-[0.85]">{it.tag}</span>
          </button>
        );
      })}

      <div className="flex-1" />

      {/* Diagnostic Assistant toggle */}
      <button
        type="button"
        onClick={onToggleAi}
        title={t("assist.open")}
        aria-label={t("assist.open")}
        aria-pressed={aiOpen}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-[9px] border border-white/15 text-[#E8EAED] hover:border-[#F47822]",
          aiOpen ? "bg-[#F47822]/[0.16]" : "bg-transparent",
        )}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d={RAIL_ASSISTANT_D} />
          <circle cx="12" cy="12" r="4.2" />
        </svg>
      </button>
    </nav>
  );
}
