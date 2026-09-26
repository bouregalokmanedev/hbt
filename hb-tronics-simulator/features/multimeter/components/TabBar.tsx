"use client";

import { cn } from "@/lib/cn";

export type RefTab = "wiring" | "ecu" | "location" | "parts" | "manuals" | "info";
const TABS: { key: RefTab; live: boolean }[] = [
  { key: "wiring", live: true },
  { key: "ecu", live: true },
  { key: "location", live: false },
  { key: "parts", live: false },
  { key: "manuals", live: false },
  { key: "info", live: false },
];

/**
 * The authentic six-tab bar. Wiring + ECU are live; Location, Related parts, Repair
 * Manuals and Component information are PRESENT but DISABLED (gray) — exactly as the
 * original. Disabled tabs are non-interactive and carry no fabricated content.
 */
export function TabBar({ active, onSelect, t }: { active: RefTab; onSelect: (t: RefTab) => void; t: any }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line">
      {TABS.map(({ key, live }) =>
        live ? (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-current={active === key ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-2 t-cta",
              active === key ? "border-mod-multimeter font-semibold text-ink" : "border-transparent text-mod-multimeter hover:text-ink",
            )}
          >
            {t(`tabs.${key}`)}
          </button>
        ) : (
          <span
            key={key}
            aria-disabled="true"
            title={t("tabDisabled")}
            className="shrink-0 cursor-not-allowed whitespace-nowrap border-b-2 border-transparent px-4 py-2 t-cta text-neutralx-fg2"
          >
            {t(`tabs.${key}`)}
          </span>
        ),
      )}
    </div>
  );
}
