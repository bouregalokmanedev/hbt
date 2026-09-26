"use client";

import { DTCS } from "@/data/scanner";
import { StatusBadge } from "@/components/shared/StatusBadge";

/** Scanner session home — MIL/battery/protocol/bus-load tiles + attention list (02 §B). */
export function Dashboard({ t, volts }: { t: any; volts: number }) {
  const faults = DTCS.filter((d) => d.status === "Current");
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: t("dashboard.mil"), v: "ON", c: "#D92D20" },
          { l: t("dashboard.battery"), v: `${volts.toFixed(1)} V`, c: "#12A150" },
          { l: t("dashboard.protocol"), v: "ISO 15765-4", c: "#131A26" },
          { l: t("dashboard.busLoad"), v: "34 %", c: "#131A26" },
        ].map((m) => (
          <div key={m.l} className="rounded-lg border border-line bg-paper p-3.5">
            <div className="t-eyebrow text-neutralx-fg3">{m.l}</div>
            <div dir="ltr" className="t-mono mt-1.5 text-lg font-semibold" style={{ color: m.c }}>
              {m.v}
            </div>
          </div>
        ))}
      </div>
      <h3 className="mt-5 t-section text-ink">{t("dashboard.attention")}</h3>
      <div className="mt-2 space-y-2">
        {faults.map((d) => (
          <div key={d.code} className="flex items-center gap-3 rounded-lg border border-line bg-paper px-4 py-3">
            <span dir="ltr" className="t-code rounded-xs bg-fault-bg px-1.5 py-0.5 text-fault">{d.code}</span>
            <span className="flex-1 t-body-sm text-ink">{d.desc}</span>
            <StatusBadge kind="fault" glyph="!">{d.ecu}</StatusBadge>
          </div>
        ))}
      </div>
    </div>
  );
}
