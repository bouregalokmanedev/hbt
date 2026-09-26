"use client";

import { useAppStore } from "@/providers/StoreProvider";
import { vehicleById } from "@/data/shared/vehicles";
import { DTCS, NODES } from "@/data/scanner";

/** Vehicle overview — profile facts + communication panel + run-scan CTA (02 §B). */
export function Overview({ t, onScan }: { t: any; onScan: () => void }) {
  const vehicleId = useAppStore((s) => s.vehicleId);
  const v = vehicleById(vehicleId)!;
  const faults = DTCS.filter((d) => d.status === "Current").length;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-line bg-paper p-5 lg:col-span-2">
        <div className="t-eyebrow text-neutralx-fg3">{t("overview.profile")}</div>
        <div className="mt-1 t-title text-ink" style={{ fontSize: 20 }}>{v.name}</div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { k: "VIN", val: v.vin },
            { k: "Engine", val: v.engine },
            { k: "Transmission", val: v.transmission },
            { k: "Odometer", val: `${v.odometerKm.toLocaleString("en-US")} km` },
          ].map((f) => (
            <div key={f.k}>
              <div className="t-eyebrow text-neutralx-fg3">{f.k}</div>
              <div dir="ltr" className="t-mono mt-1 text-sm text-ink">{f.val}</div>
            </div>
          ))}
        </div>
        <button type="button" onClick={onScan} className="focus-ring mt-5 rounded-lg bg-mod-scanner px-4 py-2 t-cta text-white">
          {t("overview.runScan")}
        </button>
      </div>
      <div className="rounded-xl border border-line bg-paper p-5">
        <div className="t-eyebrow text-neutralx-fg3">{t("overview.comms")}</div>
        <dl className="mt-2 space-y-2">
          {[
            { k: "Protocol", val: "ISO 15765-4" },
            { k: "Gateway", val: "DoIP + CAN-FD" },
            { k: "VCI", val: "HB-LINK 3 (BT 5.2)" },
            { k: "ECUs online", val: `${NODES.filter((n) => n.status !== "offline" && n.status !== "none").length}/${NODES.length}` },
            { k: "Systems with faults", val: String(faults) },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between">
              <dt className="t-body-sm text-neutralx-fg3">{r.k}</dt>
              <dd dir="ltr" className="t-mono text-xs text-ink">{r.val}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
