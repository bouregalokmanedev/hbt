import { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { jsPDF } from "jspdf";

import { SIMULATOR_RESULTS_EVENT, simulatorApi, type SimulatorResult } from "@/features/simulator/api/simulator.api";
import {
    resolveVehicleProfile,
    vehicleDisplayName,
    vehicleFacts,
} from "@/features/simulator/scanner/data/catalog";
import { ADAS_ITEMS } from "@/features/simulator/scanner/data/scanner.data";

const ADAS_LABELS = ["Front camera", "Front radar", "BSM left", "BSM right", "PDC", "Surround view"] as const;

/** Minimal live engine snapshot passed from the lab so the report never shows stale "—". */
export interface ReportLiveState {
    adasDone?: boolean[];
    adasRunning?: boolean;
    adasProg?: number;
    tHints?: number;
    treeFinished?: boolean;
    tFinished?: boolean;
    scanDone?: boolean;
    treeStates?: { done?: boolean }[];
    scanLog?: { dtc?: number }[];
    scanIdx?: number;
}

export interface ReportLiveResult {
    score?: number;
    outcome?: string;
    verdict?: string;
    attempts?: number;
    hintsUsed?: number;
    durationSeconds?: number;
    steps?: { label: string; ok: boolean }[];
    scenarioId?: string;
    at?: number;
}

export function ReportScreen({
    refreshKey,
    vehicleKey,
    engineState,
    lastResult,
    activeSessionId,
}: {
    refreshKey: number | null;
    vehicleKey?: string;
    engineState?: ReportLiveState | null;
    lastResult?: ReportLiveResult | null;
    activeSessionId?: string | null;
}) {
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === "ar" ? "ar" : undefined;
    const [latest, setLatest] = useState<SimulatorResult | null>(null);

    useEffect(() => {
        const load = () => {
            void simulatorApi
                .results()
                .then((all) => {
                    const mine = all.filter((r) => r.tool === "scanner");
                    setLatest(mine[0] ?? null);
                })
                .catch(() => {
                    setLatest(null);
                });
        };
        load();
        window.addEventListener(SIMULATOR_RESULTS_EVENT, load);
        return () => window.removeEventListener(SIMULATOR_RESULTS_EVENT, load);
    }, [refreshKey]);

    const profile = useMemo(() => (vehicleKey ? resolveVehicleProfile(vehicleKey) : null), [vehicleKey]);
    const facts = useMemo(() => (vehicleKey ? vehicleFacts(vehicleKey) : null), [vehicleKey]);
    const displayName = vehicleKey ? vehicleDisplayName(vehicleKey) : null;

    const faultDtcs = profile?.dtcs ?? [];
    const faultNodes = profile?.nodes.filter((n) => n.status !== "normal" && n.status !== "none") ?? [];
    const faultPids = profile?.pids.filter((p) => p.fault) ?? [];
    const ecuRows = profile?.nodes ?? [];

    // Live session data first (backend result → current engine → static profile),
    // so ADAS/score/hints never fall back to a stale profile after a scan starts.
    const sessionAdas = Array.isArray(latest?.metadata?.adasDone)
        ? latest.metadata.adasDone
        : Array.isArray(engineState?.adasDone)
          ? engineState!.adasDone
          : null;
    const adasFlags = sessionAdas ?? profile?.adasDone ?? [];
    const adasCalibrated =
        latest?.metadata?.adasCalibrated ?? adasFlags.filter(Boolean).length;
    const adasTotal = latest?.metadata?.adasTotal ?? (adasFlags.length || ADAS_ITEMS.length);
    const vin = facts?.meta?.split(" · ")[0] ?? "—";
    const steps =
        latest && Array.isArray(latest.steps)
            ? latest.steps
            : Array.isArray(lastResult?.steps)
              ? lastResult!.steps!
              : [];

    const liveScore =
        lastResult?.score ??
        (engineState?.treeFinished
            ? 100
            : engineState?.tFinished
              ? 70
              : null);
    const score = latest?.score ?? liveScore;
    const outcome = latest?.outcome ?? lastResult?.outcome ?? null;
    const sessionLabel =
        latest?.id ??
        (activeSessionId ? activeSessionId.slice(0, 8) : lastResult?.at ? `live-${lastResult.at.toString(36)}` : "—");

    const scenario =
        latest?.metadata?.scenarioId ??
        latest?.scenario_key ??
        lastResult?.scenarioId ??
        (vehicleKey?.startsWith("backend:") ? vehicleKey.slice(0, 16) : vehicleKey) ??
        "—";
    const hintsUsed =
        latest?.hints_used ?? latest?.metadata?.hintsUsed ?? lastResult?.hintsUsed ?? engineState?.tHints ?? 0;
    const attempts =
        latest?.attempts ??
        latest?.metadata?.attempts ??
        lastResult?.attempts ??
        Math.max(1, steps.length, engineState?.treeStates?.filter((s) => s.done).length ?? 0);
    const durationSec = latest?.duration_seconds ?? lastResult?.durationSeconds ?? null;
    const durationLabel =
        durationSec == null
            ? engineState?.scanDone
                ? "—"
                : "—"
            : durationSec >= 60
              ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
              : `${durationSec}s`;
    const verdict = latest?.verdict ?? lastResult?.verdict ?? null;
    const createdAt = latest?.created_at ?? (lastResult?.at ? new Date(lastResult.at).toISOString() : null);

    const exportJson = () => {
        const payload = {
            ...(latest ?? {}),
            score: score ?? latest?.score ?? null,
            outcome: outcome ?? null,
            hints_used: hintsUsed,
            attempts,
            duration_seconds: durationSec,
            verdict: verdict ?? null,
            vehicle: displayName ?? null,
            vehicleFacts: facts,
            faultProfile: profile
                ? {
                      dtcs: profile.dtcs,
                      nodes: profile.nodes.filter((n) => n.status !== "normal" && n.status !== "none"),
                      pids: profile.pids.filter((p) => p.fault),
                      ecus: profile.nodes,
                      adas: ADAS_ITEMS.map((item, i) => ({
                          item: ADAS_LABELS[i] ?? item.id,
                          calibrated: adasFlags[i] === true,
                      })),
                  }
                : null,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `diagnostic-report-${sessionLabel === "—" ? "vehicle" : sessionLabel}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportPdf = () => {
        const doc = new jsPDF({ unit: "mm", format: "a4" });
        let y = 16;
        const line = (text: string, size = 10, style: "normal" | "bold" = "normal", color: [number, number, number] = [30, 30, 30]) => {
            doc.setFont("helvetica", style);
            doc.setFontSize(size);
            doc.setTextColor(...color);
            doc.text(text, 16, y);
            y += size * 0.55;
        };
        const gap = (h = 4) => {
            y += h;
        };

        doc.setDrawColor(244, 120, 34);
        doc.setLineWidth(0.8);
        doc.line(16, y, 194, y);
        gap(6);
        line("HB TRONICS · DIAGNOSTIC REPORT", 9, "bold", [244, 120, 34]);
        line(displayName ?? scenario, 16, "bold");
        line(`Date: ${createdAt ? new Date(createdAt).toISOString().slice(0, 19).replace("T", " ") : new Date().toISOString().slice(0, 19).replace("T", " ")}`, 9);
        line(`Session: ${sessionLabel} · Score: ${score ?? "—"} · Outcome: ${outcome ?? "—"}`, 9);
        line(`Hints used: ${hintsUsed} · Attempts: ${attempts} · Duration: ${durationLabel}`, 9);
        line(`ADAS: ${adasCalibrated}/${adasTotal} calibrated · Scenario: ${scenario}`, 9);
        line(`VIN: ${vin} · Odometer: ${facts ? facts.meta.split(" · ")[1] ?? "—" : "—"}`, 9);
        gap(5);

        line("DIAGNOSTIC TROUBLE CODES", 12, "bold");
        gap(2);
        if (faultDtcs.length === 0) {
            line("No trouble codes stored.", 10);
        } else {
            line("Code          ECU       Status        Description", 9, "bold");
            for (const d of faultDtcs.slice(0, 20)) {
                line(`${d.code.padEnd(14)}${d.ecu.padEnd(10)}${d.status.padEnd(14)}${d.desc.slice(0, 90)}`, 8);
            }
        }
        gap(5);

        line("ECU NETWORK STATUS", 12, "bold");
        gap(2);
        line("ECU          Status      DTCs   Name", 9, "bold");
        for (const n of ecuRows.slice(0, 25)) {
            line(`${n.id.padEnd(13)}${n.status.padEnd(12)}${String(n.dtc).padEnd(8)}${n.name}`, 8);
        }
        gap(5);

        line("ADAS CALIBRATION STATUS", 12, "bold");
        gap(2);
        for (let i = 0; i < ADAS_ITEMS.length; i++) {
            const label = ADAS_LABELS[i] ?? ADAS_ITEMS[i].id;
            line(`${label.padEnd(24)}${adasFlags[i] ? "Calibrated" : "Awaiting"}`, 9);
        }
        gap(5);

        if (faultNodes.length || faultPids.length) {
            line("FAULT MEASUREMENTS", 12, "bold");
            gap(2);
            for (const n of faultNodes) line(`${n.id} — ${n.name} — ${n.status} · ${n.dtc} DTC`, 8);
            for (const p of faultPids) line(`${p.id} — ${p.name} — ${p.base} ${p.unit}`, 8);
            gap(5);
        }

        if (steps.length) {
            line("STEP BREAKDOWN", 12, "bold");
            gap(2);
            for (const s of steps.slice(0, 25)) {
                line(`${s.ok ? "[PASS]" : "[FAIL]"} ${s.label}`, 8);
            }
        }

        doc.save(`diagnostic-report-${sessionLabel === "—" ? "vehicle" : sessionLabel}.pdf`);
    };

    // Always render when we have a vehicle profile OR any live session signal
    // (engine running, lastResult, or an open session id) — never a bare empty state
    // after a scan has started.
    const hasLiveSession = Boolean(
        latest || lastResult || activeSessionId || engineState?.scanDone || engineState?.treeFinished || engineState?.tFinished,
    );
    if (!profile && !hasLiveSession) {
        return (
            <div className="p-4 sm:p-5">
                <h3 className="text-lg font-black text-[#3A3A3A] dark:text-white">
                    {t("simulator.scannerLab.reportScreen.title")}
                </h3>
                <p className="mt-4 rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-white p-6 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:bg-[#1b1b20] dark:text-white/50">
                    {t("simulator.scannerLab.reportScreen.empty")}
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-black text-[#3A3A3A] dark:text-white">
                        {t("simulator.scannerLab.reportScreen.title")}
                    </h3>
                    <p className="mt-1 text-sm text-[#3A3A3A]/55 dark:text-white/55">
                        {hasLiveSession
                            ? t("simulator.scannerLab.reportScreen.desc")
                            : t("simulator.scannerLab.reportScreen.profileNote")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={exportPdf}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#F47822] px-4 py-2 text-xs font-black text-white transition hover:bg-[#E96D18]"
                    >
                        <Download className="h-3.5 w-3.5" />
                        {t("simulator.scannerLab.reportScreen.pdf")}
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-black text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-white"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        {t("simulator.scannerLab.reportScreen.print")}
                    </button>
                    <button
                        type="button"
                        onClick={exportJson}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#3A3A3A] px-4 py-2 text-xs font-black text-white transition hover:bg-black"
                    >
                        <Download className="h-3.5 w-3.5" />
                        {t("simulator.scannerLab.reportScreen.export")}
                    </button>
                </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-[#3A3A3A]/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3A3A3A]/8 pb-4 dark:border-white/8">
                    <div>
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#F47822]">
                            HB TRONICS · {t("simulator.scannerLab.reportScreen.title")}
                        </p>
                        <p className="mt-1 truncate text-base font-black text-[#3A3A3A] dark:text-white">
                            {displayName ?? scenario}
                        </p>
                    </div>
                    <p dir="ltr" className="font-mono text-3xl font-black tabular-nums text-[#F47822]">
                        {score ?? "—"}
                    </p>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { label: t("simulator.scannerLab.reportScreen.session"), value: sessionLabel, mono: true },
                        {
                            label: t("simulator.scannerLab.reportScreen.date"),
                            value: createdAt
                                ? new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "short", year: "numeric" }).format(new Date(createdAt))
                                : "—",
                            mono: true,
                        },
                        {
                            label: t("simulator.scannerLab.reportScreen.vehicle"),
                            value: displayName ?? scenario.slice(0, 24),
                            mono: false,
                        },
                        {
                            label: t("simulator.scannerLab.reportScreen.score"),
                            value: !outcome
                                ? "—"
                                : outcome === "pass"
                                  ? t("simulator.scannerLab.reportScreen.passed")
                                  : t("simulator.scannerLab.reportScreen.failed"),
                            mono: false,
                        },
                        { label: t("simulator.scannerLab.reportScreen.vin"), value: vin, mono: true },
                        {
                            label: t("simulator.scannerLab.reportScreen.odometer"),
                            value: facts ? facts.meta.split(" · ")[1] ?? "—" : "—",
                            mono: true,
                        },
                        {
                            label: t("simulator.scannerLab.reportScreen.hints"),
                            value: String(hintsUsed),
                            mono: true,
                        },
                        {
                            label: t("simulator.scannerLab.reportScreen.attempts"),
                            value: String(attempts),
                            mono: true,
                        },
                        {
                            label: t("simulator.scannerLab.reportScreen.duration", { defaultValue: "Duration" }),
                            value: durationLabel,
                            mono: true,
                        },
                        {
                            label: t("simulator.scannerLab.reportScreen.adasProgress", { defaultValue: "ADAS" }),
                            value: `${adasCalibrated}/${adasTotal}`,
                            mono: true,
                        },
                        {
                            label: t("simulator.scannerLab.reportScreen.scenario", { defaultValue: "Scenario" }),
                            value: scenario,
                            mono: true,
                        },
                        {
                            label: t("simulator.scannerLab.reportScreen.verdict", { defaultValue: "Verdict" }),
                            value: verdict ? verdict.replace(/^content:/, "") : "—",
                            mono: true,
                        },
                    ].map((row) => (
                        <div key={row.label} className="rounded-xl bg-[#3A3A3A]/[.04] p-3 dark:bg-white/[0.05]">
                            <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#3A3A3A]/40 dark:text-white/40">
                                {row.label}
                            </dt>
                            <dd className={`mt-1 truncate text-sm font-black text-[#3A3A3A] dark:text-white ${row.mono ? "font-mono" : ""}`} dir={row.mono ? "ltr" : undefined}>
                                {row.value}
                            </dd>
                        </div>
                    ))}
                </dl>

                {steps.length > 0 && (
                    <div className="mt-5">
                        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
                            {t("simulator.scannerLab.reportScreen.breakdown")}
                        </p>
                        <ul className="mt-2 space-y-1.5">
                            {steps.map((entry, i) => (
                                <li key={`${entry.label}-${i}`} className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/8 bg-[#FCFCFC] px-3 py-2 text-sm dark:border-white/8 dark:bg-white/[0.03]">
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${entry.ok ? "bg-emerald-500" : "bg-red-500"}`} />
                                    <span className="min-w-0 flex-1 truncate font-semibold text-[#3A3A3A] dark:text-white">{entry.label}</span>
                                    <span className={`shrink-0 font-mono text-[10px] font-black uppercase ${entry.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                        {entry.ok ? t("simulator.scannerLab.reportScreen.passed") : t("simulator.scannerLab.reportScreen.failed")}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {profile && (
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
                                {t("simulator.scannerLab.reportScreen.dtcTitle")}
                            </p>
                            {faultDtcs.length === 0 ? (
                                <p className="mt-2 rounded-xl border border-dashed border-[#3A3A3A]/15 px-3 py-3 text-xs text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("simulator.scannerLab.reportScreen.noDtcs")}
                                </p>
                            ) : (
                                <div className="mt-2 overflow-x-auto rounded-xl border border-[#3A3A3A]/10 dark:border-white/10">
                                    <table className="min-w-[420px] w-full text-xs">
                                        <thead>
                                            <tr className="text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A3A3A]/45 dark:text-white/45">
                                                <th className="px-3 py-2">{t("simulator.scannerLab.reportScreen.dtcCode")}</th>
                                                <th className="px-3 py-2">{t("simulator.scannerLab.reportScreen.dtcDesc")}</th>
                                                <th className="px-3 py-2">{t("simulator.scannerLab.reportScreen.dtcEcu")}</th>
                                                <th className="px-3 py-2">{t("simulator.scannerLab.reportScreen.dtcStatus")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#3A3A3A]/[.06] dark:divide-white/[0.06]">
                                            {faultDtcs.map((d) => (
                                                <tr key={`${d.code}-${d.ecu}`}>
                                                    <td dir="ltr" className="px-3 py-2 font-mono font-black text-[#F47822]">{d.code}</td>
                                                    <td className="max-w-[220px] truncate px-3 py-2 font-semibold text-[#3A3A3A] dark:text-white">{d.desc}</td>
                                                    <td dir="ltr" className="px-3 py-2 font-mono text-[#3A3A3A]/60 dark:text-white/60">{d.ecu}</td>
                                                    <td className="px-3 py-2">
                                                        <span className="rounded-full bg-[#3A3A3A]/[.06] px-2 py-0.5 font-mono text-[10px] font-bold uppercase dark:bg-white/[0.07]">{d.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
                                {t("simulator.scannerLab.reportScreen.measurements")}
                            </p>
                            {faultNodes.length === 0 && faultPids.length === 0 ? (
                                <p className="mt-2 rounded-xl border border-dashed border-[#3A3A3A]/15 px-3 py-3 text-xs text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                                    {t("simulator.scannerLab.reportScreen.allHealthy")}
                                </p>
                            ) : (
                                <ul className="mt-2 space-y-1.5">
                                    {faultNodes.map((n) => (
                                        <li key={n.id} className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs dark:border-red-500/20 dark:bg-red-500/10">
                                            <span dir="ltr" className="font-mono font-black text-[#3A3A3A] dark:text-white">{n.id}</span>
                                            <span className="min-w-0 flex-1 truncate font-semibold text-red-700 dark:text-red-300">{n.name}</span>
                                            <span className="font-mono text-[10px] font-black uppercase text-red-600 dark:text-red-400">{n.status} · {n.dtc} DTC</span>
                                        </li>
                                    ))}
                                    {faultPids.map((p) => (
                                        <li key={p.id} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-500/20 dark:bg-amber-500/10">
                                            <span dir="ltr" className="font-mono font-black text-[#3A3A3A] dark:text-white">{p.id}</span>
                                            <span className="min-w-0 flex-1 truncate font-semibold text-amber-800 dark:text-amber-300">{p.name}</span>
                                            <span dir="ltr" className="font-mono text-[10px] font-black text-amber-700 dark:text-amber-400">{p.base} {p.unit}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {profile && (
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
                                {t("simulator.scannerLab.reportScreen.ecuTitle")}
                            </p>
                            <div className="mt-2 overflow-x-auto rounded-xl border border-[#3A3A3A]/10 dark:border-white/10">
                                <table className="min-w-[360px] w-full text-xs">
                                    <thead>
                                        <tr className="text-left font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#3A3A3A]/45 dark:text-white/45">
                                            <th className="px-3 py-2">{t("simulator.scannerLab.reportScreen.dtcEcu")}</th>
                                            <th className="px-3 py-2">{t("simulator.scannerLab.reportScreen.dtcStatus")}</th>
                                            <th className="px-3 py-2">{t("simulator.scannerLab.reportScreen.dtcTitle")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#3A3A3A]/[.06] dark:divide-white/[0.06]">
                                        {ecuRows.map((n) => (
                                            <tr key={n.id}>
                                                <td dir="ltr" className="px-3 py-2 font-mono font-black text-[#3A3A3A] dark:text-white">{n.id}</td>
                                                <td className="px-3 py-2">
                                                    <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${n.status === "fault" ? "bg-red-500/10 text-red-600" : n.status === "warn" ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/10 text-emerald-700"}`}>{n.status}</span>
                                                </td>
                                                <td dir="ltr" className="px-3 py-2 font-mono text-[#3A3A3A]/60 dark:text-white/60">{n.dtc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">
                                {t("simulator.scannerLab.reportScreen.adasTitle")} · {adasCalibrated}/{adasTotal}
                            </p>
                            <ul className="mt-2 grid grid-cols-2 gap-1.5">
                                {ADAS_ITEMS.map((item, i) => {
                                    const done = adasFlags[i] === true;
                                    return (
                                        <li key={item.id} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${done ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10" : "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"}`}>
                                            <span className="font-bold text-[#3A3A3A] dark:text-white">{ADAS_LABELS[i] ?? item.id}</span>
                                            <span className={`font-mono text-[10px] font-black uppercase ${done ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                                                {done ? t("simulator.scannerLab.reportScreen.adasDone") : t("simulator.scannerLab.reportScreen.adasPending")}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
