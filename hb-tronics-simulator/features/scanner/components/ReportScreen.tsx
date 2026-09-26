"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { useAppStoreApi } from "@/providers/StoreProvider";
import { DTCS } from "@/data/scanner";
import { REPORT_META, REPORT_MEASUREMENTS } from "../data/report";

/**
 * Diagnostic Report (SC, doc 17/19): an A4-style report document — header,
 * vehicle/VIN/odometer, customer complaint, fault-code table, recorded
 * measurements, and the share/print/export action bar. Canonical data (DTCs,
 * measurements, VIN, dates) is Class-B; the complaint + measurement labels are
 * Class-C (content.scanner.report.*).
 */
export function ReportScreen({ t }: { t: any }) {
  const api = useAppStoreApi();
  const tc = useTranslations("content");
  const rc = (k: string) => tc(`scanner.report.${k}`);
  const codeColor = (sev: string) => (sev === "high" ? "#D92D20" : "#B4560F");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-3xl overflow-auto rounded-xl border border-line bg-paper p-6 shadow-card sm:p-8">
        {/* Document header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand t-code font-bold text-brand-on">HB</span>
              <span className="t-eyebrow tracking-[0.14em] text-ink">HB TRONICS</span>
            </div>
            <h2 className="mt-2 t-title text-ink" style={{ fontSize: 22 }}>{t("report.title")}</h2>
          </div>
          <div dir="ltr" className="text-end t-code text-neutralx-fg3">
            <div>{t("report.session")} {REPORT_META.session}</div>
            <div>{REPORT_META.date} · {REPORT_META.time}</div>
            <div>{t("report.technician")} {REPORT_META.technician} · {REPORT_META.level}</div>
          </div>
        </div>

        <hr className="my-4 border-line" />

        {/* Vehicle row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={t("report.vehicle")} value={REPORT_META.vehicle} />
          <Field label={t("report.vin")} value={REPORT_META.vin} mono />
          <Field label={t("report.odometer")} value={`${REPORT_META.odometerKm.toLocaleString("en-US")} km`} mono />
        </div>

        <hr className="my-4 border-line" />

        {/* Customer complaint */}
        <section>
          <div className="t-eyebrow text-neutralx-fg3">{t("report.customerComplaint")}</div>
          <p className="mt-2 t-body-sm text-ink">{rc("customerComplaint")}</p>
        </section>

        <hr className="my-4 border-line" />

        {/* Fault codes found */}
        <section>
          <div className="t-eyebrow text-neutralx-fg3">{t("report.faultCodesFound")} · {DTCS.length}</div>
          <ul className="mt-2 divide-y divide-line3">
            {DTCS.map((d) => (
              <li key={d.code} className="flex items-center gap-4 py-2.5">
                <span dir="ltr" className="w-14 shrink-0 t-code" style={{ color: codeColor(d.severity) }}>{d.code}</span>
                <span className="min-w-0 flex-1 t-body-sm text-ink">{d.desc}</span>
                <span dir="ltr" className="shrink-0 t-code text-neutralx-fg3">{d.ecu} · {t(`report.dtcStatus.${d.status}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        <hr className="my-4 border-line" />

        {/* Measurements recorded */}
        <section>
          <div className="t-eyebrow text-neutralx-fg3">{t("report.measurementsRecorded")}</div>
          <ul className="mt-2 divide-y divide-line3">
            {REPORT_MEASUREMENTS.map((m) => (
              <li key={m.id} className="flex items-center gap-4 py-2.5">
                <span className="min-w-0 flex-1 t-body-sm text-ink">{rc(`measurement.${m.id}`)}</span>
                <span dir="ltr" className="shrink-0 t-code text-neutralx-fg3">{t("report.spec")} {m.spec}</span>
                <span dir="ltr" className={cn("w-16 shrink-0 text-end t-mono text-sm", m.ok ? "text-ok" : "text-fault")}>{m.value}</span>
                <span className={cn("w-24 shrink-0 text-end t-eyebrow", m.ok ? "text-ok" : "text-fault")}>{m.ok ? t("report.inSpec") : t("report.outOfSpec")}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Action bar */}
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <button type="button" className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink">‹ {t("report.back")}</button>
        <span className="t-eyebrow text-neutralx-fg3">{t("report.draft")}</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => api.getState().say(t("report.share"))} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink hover:border-mod-scanner">{t("report.share")}</button>
          <button type="button" onClick={() => api.getState().say(t("report.print"))} className="focus-ring rounded-md border border-line2 px-3 py-1.5 t-cta text-ink hover:border-mod-scanner">{t("report.print")}</button>
          <button type="button" onClick={() => api.getState().say(t("report.exportPdf"))} className="focus-ring rounded-md bg-brand px-4 py-1.5 t-cta text-brand-on">{t("report.exportPdf")}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="t-eyebrow text-neutralx-fg3">{label}</div>
      <div dir={mono ? "ltr" : undefined} className={cn("mt-1 text-ink", mono ? "t-code" : "t-body-sm")}>{value}</div>
    </div>
  );
}
