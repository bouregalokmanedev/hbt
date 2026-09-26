import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Gauge, Activity, MapPin, GitBranch, ScanSearch, X, Info, Lock } from "lucide-react";

import { ScannerLabFull } from "../components/labs/ScannerLabFull";
import { MultimeterLabFull } from "../components/labs/MultimeterLabFull";
import { OscilloscopeLabFull } from "../oscilloscope/components/OscilloscopeLabFull";
import { LocationLabFull } from "../components/labs/LocationLabFull";
import { SchematicLabFull } from "../components/labs/SchematicLabFull";
import { simulatorApi, SIMULATOR_LIMIT_EVENT } from "../api/simulator.api";
import { api } from "@/lib/api/client";
import { track } from "@/lib/track";

/** Monthly quota returned by GET /v1/simulator/usage. */
interface SimulatorUsage {
    used: number;
    limit: number | null;
    remaining: number | null;
    unlimited: boolean;
}

const LABS: Record<string, { name: string; desc: string; bench: string }> = {
    scanner: { name: "Scanner Workstation", desc: "14-screen diagnostic bench — vehicle → network → DTC + tree → live 420ms → graph → ADAS → training → report. Coverage gate blocks uncovered tool/vehicle.", bench: "CAN-B/C/FD · UDS · 21 ECUs" },
    multimeter: { name: "Multimeter Bench", desc: "11 components · 54 steps · 7 modes (OFF/VDC/OHM/mA/CONT). Rotary + drag probes → measurement → validation → scoring.", bench: "Fluke-class · guided procedure" },
    oscilloscope: { name: "Oscilloscope Lab", desc: "7 exercises INJ/COIL/CAM/APP/MAP/KNK/O2 · fault model → waveform fn(ch,p) → trigger → ΔV/Δt cursors → persistence.", bench: "DSO 1052 · 100MHz" },
    location: { name: "Location Atlas", desc: "115 components · 58 presented groups · 6 views · Browse/Training/Quiz · % hotspots · search/filter/favourites.", bench: "Atlas · % positioning" },
    schematic: { name: "Schematic Workspace", desc: "E1-hub 57/133/111 · 3 traces inj6/ign7/can5 · Study/Trace/Training/Practice/Exam · pin table · layers.", bench: "R16 · 4016×1479 · netlist" },
};

export function SimulatorLabPage() {
    const { t } = useTranslation();
    const { tool } = useParams<{ tool: string }>();
    const staticLab = tool ? LABS[tool] : undefined;
    const labName = tool ? t(`simulator.lab.labs.${tool}.name`, { defaultValue: "" }) : "";
    const labDesc = tool ? t(`simulator.lab.labs.${tool}.desc`, { defaultValue: "" }) : "";
    const lab = staticLab ? { ...staticLab, name: labName || staticLab.name, desc: labDesc || staticLab.desc } : undefined;

    // Persist a backend session so bench work is no longer local-only.
    // Labs themselves stay engine-driven; this only records start for reports/history.
    // The session id is handed to the lab so engine results complete the same session.
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [limitHit, setLimitHit] = useState(false);

    // Free-tier quota: once exhausted the lab itself is locked until the
    // learner subscribes or the month rolls over.
    const [usage, setUsage] = useState<SimulatorUsage | null>(null);
    const [usageLoaded, setUsageLoaded] = useState(false);
    useEffect(() => {
        let cancelled = false;
        api<SimulatorUsage>("/v1/simulator/usage")
            .then((data) => {
                if (!cancelled) setUsage(data);
            })
            .catch(() => {
                // Endpoint unavailable: fall through and let the backend guard decide.
                if (!cancelled) setUsage(null);
            })
            .finally(() => {
                if (!cancelled) setUsageLoaded(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);
    const quotaBlocked = Boolean(usage && !usage.unlimited && usage.remaining === 0);

    useEffect(() => {
        const onLimit = () => setLimitHit(true);
        window.addEventListener(SIMULATOR_LIMIT_EVENT, onLimit);
        return () => window.removeEventListener(SIMULATOR_LIMIT_EVENT, onLimit);
    }, []);
    useEffect(() => {
        // Wait for the quota lookup so a spent month never opens a session.
        if (!tool || !lab || tool === "scanner" || !usageLoaded || quotaBlocked) return;
        setSessionId(null);
        void simulatorApi
            .start({ vehicle_key: "corolla-1zr-fe", tool })
            .then((session) => setSessionId(session.id))
            .catch(() => undefined);
    }, [tool, lab, usageLoaded, quotaBlocked]);
    const introKey = `hbt:lab-intro-dismissed:${tool ?? "unknown"}`;
    const [introOpen, setIntroOpen] = useState<boolean>(() => {
        try {
            return window.localStorage.getItem(introKey) !== "1";
        } catch {
            return true;
        }
    });
    if (!lab) return <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-8"><div className="rounded-2xl bg-white dark:bg-[#1b1b20] p-8 text-center">{t("simulator.lab.unknown")}</div><Link to="/simulator" className="mt-4 inline-block text-sm font-bold text-[#F47822]">← {t("simulator.lab.backLabs")}</Link></main>;
    const dismissIntro = () => {
        try {
            window.localStorage.setItem(introKey, "1");
        } catch {
            // Ignore storage failures.
        }
        setIntroOpen(false);
    };
    const reopenIntro = () => {
        try {
            window.localStorage.removeItem(introKey);
        } catch {
            // Ignore storage failures.
        }
        setIntroOpen(true);
    };
    useEffect(() => {
        try {
            setIntroOpen(window.localStorage.getItem(introKey) !== "1");
        } catch {
            setIntroOpen(true);
        }
    }, [introKey]);

    if (quotaBlocked) {
        return (
            <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013] p-6">
                <div
                    data-testid="simulator-limit-block"
                    className="mx-auto max-w-xl rounded-2xl border border-[#F47822]/30 bg-white p-6 text-center shadow-sm dark:border-[#F47822]/30 dark:bg-[#1b1b20]"
                >
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10 text-[#F47822]">
                        <Lock className="h-5 w-5" />
                    </span>
                    <h1 className="mt-4 text-xl font-black tracking-tight text-[#1A1A1A] dark:text-white">
                        {t("simulator.hub.usage.exhaustedTitle")}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">
                        {t("simulator.hub.usage.labNotice")}
                    </p>
                    <p className="mt-1.5 text-xs text-[#3A3A3A]/45 dark:text-white/45">
                        {t("simulator.hub.usage.resets")}
                    </p>
                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                        <Link
                            to="/pricing"
                            onClick={() =>
                                track("plan_cta_clicked", {
                                    plan: "professional",
                                    source: "simulator_limit",
                                })
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F47822] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#E96D18]"
                        >
                            {t("simulator.hub.usage.upgrade")}
                            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </Link>
                        <Link
                            to="/simulator"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-white px-5 py-2.5 text-sm font-bold text-[#3A3A3A] transition hover:bg-[#F8F7F6] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                        >
                            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                            {t("simulator.lab.backLabs")}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const Icon = tool === "scanner" ? ScanSearch : tool === "multimeter" ? Gauge : tool === "oscilloscope" ? Activity : tool === "location" ? MapPin : GitBranch;

    return (
        <main className="min-h-full bg-[#F8F7F6] dark:bg-[#101013]">
            <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8">
                <Link
                    to="/simulator"
                    className="group inline-flex w-fit items-center gap-2 rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-sm font-bold text-[#3A3A3A]/60 shadow-sm transition-all hover:-translate-x-0.5 hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822] rtl:hover:translate-x-0.5 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60 dark:hover:border-[#F47822]/40 dark:hover:text-[#F47822]"
                >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#3A3A3A]/[.05] transition-colors group-hover:bg-[#F47822]/10 dark:bg-white/[0.06]">
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
                    </span>
                    {t("simulator.lab.backLabs")}
                </Link>

                {limitHit && (
                    <div
                        data-testid="simulator-limit-notice"
                        className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#F47822]/30 bg-[#FFF7ED] p-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#F47822]/30 dark:bg-[#F47822]/10"
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-black text-[#B85708] dark:text-[#F47822]">
                                {t("simulator.hub.usage.exhaustedTitle")}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/60 dark:text-white/60">
                                {t("simulator.hub.usage.labNotice")}
                            </p>
                        </div>
                        <Link
                            to="/pricing"
                            onClick={() =>
                                track("plan_cta_clicked", {
                                    plan: "professional",
                                    source: "simulator_limit",
                                })
                            }
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#E96D18]"
                        >
                            {t("simulator.hub.usage.upgrade")}
                            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </Link>
                    </div>
                )}

                {introOpen ? (
                <div className="relative mt-4 rounded-[24px] border border-[#3A3A3A]/10 dark:border-white/10 bg-white dark:bg-[#1b1b20] p-6 shadow-sm">
                    <button
                        type="button"
                        onClick={dismissIntro}
                        aria-label={t("simulator.lab.intro.dismiss")}
                        title={t("simulator.lab.intro.dismiss")}
                        className="absolute end-4 top-4 grid h-8 w-8 place-items-center rounded-xl text-[#3A3A3A]/40 transition hover:bg-[#3A3A3A]/[.05] hover:text-[#3A3A3A] dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#3A3A3A] text-white"><Icon className="h-5 w-5" /></span>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-[#3A3A3A] dark:text-[#ececef]">{lab.name}</h1>
                            <p className="text-xs font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{lab.bench}</p>
                        </div>
                        <span className="ml-auto hidden sm:inline-flex rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">{t("simulator.lab.engine")}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#3A3A3A]/60 dark:text-white/60">{lab.desc}</p>
                    <div className="mt-4 rounded-2xl bg-[#0f1115] p-4 text-white">
                        <p className="text-xs font-bold uppercase tracking-wide text-white/40">{t("simulator.lab.liveBench")}</p>
                        <p className="mt-1 text-sm text-white/60">{t("simulator.lab.liveDesc")}</p>
                        <p className="mt-2 text-sm text-white/60">{t("simulator.lab.tryLine")} <Link to="/reports" className="underline text-white">{t("simulator.lab.reports")}</Link>.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{t("simulator.lab.vehicle")}</span>
                            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{t("simulator.lab.tool")} {tool}</span>
                            <span className="rounded-full bg-[#F47822] px-3 py-1.5 text-xs font-bold">{t("simulator.lab.try")}</span>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-[#3A3A3A]/40 dark:text-white/40">{t("simulator.lab.parityPrefix")} {t("simulator.lab.parity")}</p>
                </div>
                ) : (
                <div className="mt-4 flex justify-end">
                    <button
                        type="button"
                        onClick={reopenIntro}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#3A3A3A]/10 bg-white px-3.5 py-2 text-xs font-bold text-[#3A3A3A]/60 transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60"
                    >
                        <Info className="h-3.5 w-3.5" />
                        {t("simulator.lab.intro.about")}
                    </button>
                </div>
                )}

                {tool === "scanner" && (
                    <div className="mt-6">
                        <ScannerLabFull sessionId={null} />
                    </div>
                )}

                {tool === "multimeter" && (
                    <div className="mt-6">
                        <MultimeterLabFull sessionId={sessionId} />
                    </div>
                )}

                {tool === "oscilloscope" && (
                    <div className="mt-6">
                        <OscilloscopeLabFull sessionId={sessionId} />
                    </div>
                )}

                {tool === "location" && (
                    <div className="mt-6">
                        <LocationLabFull sessionId={sessionId} />
                    </div>
                )}

                {tool === "schematic" && (
                    <div className="mt-6">
                        <SchematicLabFull sessionId={sessionId} />
                    </div>
                )}
            </div>
        </main>
    );
}
