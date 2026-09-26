"use client";

import type { MeterProcedureComponent } from "@/data/multimeter/procedures";

/**
 * ECU pin and connector tab — the component connector pinout (pin → function) plus
 * the control-unit identity and its pin list. Canonical technical data (LTR).
 */
export function EcuPinView({ comp, t }: { comp: MeterProcedureComponent; t: any }) {
  return (
    <div className="h-full overflow-auto p-1">
      <div className="t-eyebrow text-neutralx-fg3">{t("ecu.connector")}</div>
      <table dir="ltr" className="ltr-island mt-2 w-full">
        <thead>
          <tr className="border-b border-line3 text-start">
            <th className="w-14 py-1 text-start t-eyebrow text-neutralx-fg3">{t("ecu.pin")}</th>
            <th className="py-1 text-start t-eyebrow text-neutralx-fg3">{t("ecu.fn")}</th>
          </tr>
        </thead>
        <tbody>
          {comp.pins.map((p) => (
            <tr key={String(p)} className="border-b border-line4">
              <td className="py-1.5 t-code text-ink">{p}</td>
              <td className="py-1.5 t-body-sm text-neutralx-fg3">{comp.pinFn[String(p)]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 rounded-lg border border-line2 bg-paper2 p-3">
        <div dir="ltr" className="t-code text-ink">{t("ecu.control", { code: comp.ecu.code, name: comp.ecu.name })}</div>
        <div dir="ltr" className="mt-1.5 flex flex-wrap gap-1">
          {comp.ecu.pins.map((p) => (
            <span key={p} className="rounded-xs bg-fill px-1.5 py-0.5 t-code text-neutralx-fg3">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
