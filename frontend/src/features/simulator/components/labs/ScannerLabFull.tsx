import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Activity,
    ArrowLeft,
    Award,
    BookOpen,
    Car,
    CheckCircle2,
    ChevronRight,
    CircleDot,
    Cloud,
    Cpu,
    GraduationCap,
    History,
    KeyRound,
    Layers,
    LayoutGrid,
    Lock,
    Radar,
    RefreshCcw,
    Trophy,
    Upload,
    X,
    Zap,
} from "lucide-react";

import { getDiagnosticHistory } from "@/features/diagnostics/api/diagnostics.api";
import { notifySimulatorResults, rememberLocalResult, simulatorApi, type SimulatorResult } from "@/features/simulator/api/simulator.api";
import { readVehicleItem, removeVehicleItem, writeVehicleItem } from "@/features/simulator/lib/vehicleStorage";
import type { DiagnosticAttempt } from "@/features/diagnostics/types/diagnostic.types";
import { getVehicleProfile, vehicleById, type VehicleProfile } from "@/features/simulator/scanner/data/scanner.data";
import { DEFAULT_TRAINING_CORRECT, DEFAULT_TRAINING_OPTIONS, vehicleDisplayName, vehicleFacts, type TrainingSession } from "@/features/simulator/scanner/data/catalog";
import type { ScannerEngine } from "@/features/simulator/scanner/engine/scanner.engine";
import { NetworkMap } from "@/features/simulator/scanner/components/NetworkMap";
import { SystemsTable } from "@/features/simulator/scanner/components/SystemsTable";
import { DtcPanel } from "@/features/simulator/scanner/components/DtcPanel";
import { AdasScreen } from "@/features/simulator/scanner/components/AdasScreen";
import { LiveDataGrid } from "@/features/simulator/scanner/components/LiveDataGrid";
import { SignalGraph } from "@/features/simulator/scanner/components/SignalGraph";
import { useScannerEngine } from "@/features/simulator/scanner/hooks/useScannerEngine";
import { VehicleGate } from "@/features/simulator/scanner/components/VehicleGate";
import { ScannerRail, type RailId } from "@/features/simulator/scanner/components/ScannerRail";
import { ScannerToolbar } from "@/features/simulator/scanner/components/ScannerToolbar";
import { HistoryScreen } from "@/features/simulator/scanner/screens/HistoryScreen";
import { ReportScreen } from "@/features/simulator/scanner/screens/ReportScreen";
import { SettingsScreen } from "@/features/simulator/scanner/screens/SettingsScreen";





const ADAS_ITEMS = ["Front camera", "Front radar", "BSM left", "BSM right", "PDC", "Surround view"] as const;
const ADAS_CALIBRATED = 2;

const ROUTINES = [
    "Oil service reset",
    "EPB retract / apply",
    "SAS calibration",
    "DPF regeneration",
    "Injector coding",
    "Battery registration",
    "Throttle relearn",
    "TPMS sensor relearn",
    "Key learning",
    "ABS brake bleed",
    "Sunroof initialisation",
    "Transmission adaptation reset",
] as const;

const SCANNER_TABS = ["network", "systems", "dtc", "live", "graph", "tree", "training", "adas"] as const;
type ScannerTab = (typeof SCANNER_TABS)[number];
export type ScannerScreen = "workstation" | "select" | "workspace" | "routines" | "history" | "report" | "settings";

const VEHICLE_STORAGE_KEY = "hbt:scanner-vehicle";

function storedVehicleId(): string | null {
    try {
        const id = readVehicleItem(VEHICLE_STORAGE_KEY);
        if (!id) return null;
        // Static garage vehicles validate directly; backend catalogue keys
        // (`backend:<uuid>`) were validated at selection time.
        if (id.startsWith("backend:")) return id;
        return vehicleById(id) ? id : null;
    } catch {
        return null;
    }
}

export function ScannerLabFull({
    sessionId,
    demo = false,
}: {
    sessionId: string | null;
    demo?: boolean;
}) {
    const [vehicleId, setVehicleId] = useState<string | null>(() => {
        const stored = storedVehicleId();
        // Demo mode only ever allows the free Corolla pack.
        if (demo && stored && stored !== "corolla") {
            try {
                removeVehicleItem(VEHICLE_STORAGE_KEY);
            } catch {
                // Ignore storage failures.
            }
            return null;
        }
        if (demo && stored === "backend:corolla") return "corolla";
        if (demo && stored && stored.startsWith("backend:")) return null;
        return stored;
    });
    if (!vehicleId) {
        return (
            <VehicleGate
                demo={demo}
                onSelect={(id) => {
                    if (demo && id !== "corolla") return;
                    try {
                        writeVehicleItem(VEHICLE_STORAGE_KEY, id);
                    } catch {
                        // Storage unavailable — keep the choice in memory only.
                    }
                    setVehicleId(id);
                }}
            />
        );
    }
    const selectVehicle = (id: string) => {
        try {
            writeVehicleItem(VEHICLE_STORAGE_KEY, id);
        } catch {
            // Ignore storage failures.
        }
        setVehicleId(id);
    };
    return (
        <ScannerLab
            key={vehicleId}
            vehicleId={vehicleId}
            sessionId={sessionId}
            onSelectVehicle={selectVehicle}
            onSwitchVehicle={() => {
                try {
                    removeVehicleItem(VEHICLE_STORAGE_KEY);
                } catch {
                    // Ignore storage failures.
                }
                setVehicleId(null);
            }}
        />
    );
}

function ScannerLab({
    vehicleId,
    sessionId,
    onSwitchVehicle,
    onSelectVehicle,
}: {
    vehicleId: string;
    sessionId: string | null;
    onSwitchVehicle: () => void;
    onSelectVehicle: (id: string) => void;
}) {
    const { t, i18n } = useTranslation();
    // Engine + fault profile resolve together once the catalogue is warm, so
    // backend vehicles can never run on a silently wrong fallback profile.
    const { engine, state, labData, unavailable, lastResult } = useScannerEngine(vehicleId, sessionId);
    const [screen, setScreen] = useState<ScannerScreen>("workstation");
    const dateLocale = i18n.language === "ar" ? "ar" : undefined;
    const [tab, setTab] = useState<ScannerTab>("network");
    const [focusEcu, setFocusEcu] = useState<string | null>(null);
    const [plotted, setPlotted] = useState<string[]>(["RPM", "FRP", "FRPD", "LPP", "MAF", "LOAD"]);
    const [sessions, setSessions] = useState<DiagnosticAttempt[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId);
    const activeSessionRef = useRef<string | null>(sessionId);
    const [historyBump, setHistoryBump] = useState(0);
    const completingRef = useRef(false);
    const [completeNotice, setCompleteNotice] = useState<{
        score: number;
        outcome: string;
        hints: number;
        attempts: number;
        adasCalibrated: number;
        adasTotal: number;
        scenarioId: string;
    } | null>(null);
    useEffect(() => {
        void getDiagnosticHistory().then(setSessions).catch(() => setSessions([]));
    }, []);
    useEffect(() => {
        setActiveSessionId(sessionId);
        activeSessionRef.current = sessionId;
    }, [sessionId]);
    const [visitedDtc, setVisitedDtc] = useState(false);
    const [sessionCompleted, setSessionCompleted] = useState(false);
    const completedReportRef = useRef(false);

    useEffect(() => {
        if (screen === "workspace" && tab === "dtc") setVisitedDtc(true);
    }, [screen, tab]);

    /*
     * Session progress: the report (and the session completion) only unlock
     * once every step of the flow is done — scan → inspect the fault →
     * fault tree → training (all questions) → ADAS.
     */
    const adasStepDone =
        (state?.adasDone ?? []).length > 0 && (state?.adasDone ?? []).every(Boolean);
    const sessionSteps: { id: string; done: boolean; tab: ScannerTab }[] = [
        { id: "scan", done: Boolean(state?.scanDone), tab: "network" },
        { id: "inspect", done: Boolean(state?.scanDone) && visitedDtc, tab: "dtc" },
        { id: "tree", done: Boolean(state?.treeFinished), tab: "tree" },
        { id: "training", done: Boolean(state?.tFinished), tab: "training" },
        { id: "adas", done: adasStepDone, tab: "adas" },
    ];
    const stepsDoneCount = sessionSteps.filter((step) => step.done).length;
    const stepsTotal = sessionSteps.length;
    const progressPct = Math.round((stepsDoneCount / stepsTotal) * 100);
    const reportUnlocked = stepsDoneCount === stepsTotal;
    const ensureScanSession = async (): Promise<string | null> => {
        if (activeSessionRef.current) return activeSessionRef.current;
        try {
            const s = await simulatorApi.start({ vehicle_key: vehicleId, tool: "scanner", scenario_key: labData?.session?.id });
            activeSessionRef.current = s.id;
            setActiveSessionId(s.id);
            return s.id;
        } catch {
            return null;
        }
    };
    const buildSessionPayload = (
        result: {
            score: number;
            outcome: string;
            verdict?: string;
            attempts?: number;
            hintsUsed?: number;
            durationSeconds?: number;
            steps?: { label: string; ok: boolean }[];
            scenarioId?: string;
            at?: number;
        } | null,
        source: "engine" | "report",
    ) => {
        const st = engine?.getState() ?? null;
        const adasDone = st?.adasDone ?? labData?.profile.adasDone ?? [];
        const adasCalibrated = adasDone.filter(Boolean).length;
        const hints = result?.hintsUsed ?? st?.tHints ?? 0;
        const treeDone = st?.treeStates?.filter((s) => s.done).length ?? 0;
        const treeTotal = st?.treeStates?.length || 1;
        const attempts = Math.max(1, result?.attempts ?? treeDone ?? 1);
        const scenarioId = result?.scenarioId ?? "scanner-report";
        const score =
            result?.score ??
            (st?.treeFinished
                ? 100
                : st?.tFinished
                  ? 70
                  : Math.min(95, Math.round((treeDone / treeTotal) * 100)));
        return {
            // Backend requires an integer 0–100 — never send a float or NaN.
            score: Math.max(0, Math.min(100, Math.round(score))),
            outcome: result?.outcome ?? (score >= 70 ? "pass" : "fault"),
            verdict: result?.verdict ?? "content:scanner.report.opened",
            attempts,
            hints_used: hints,
            duration_seconds:
                typeof result?.durationSeconds === "number" && Number.isFinite(result.durationSeconds)
                    ? Math.max(0, Math.round(result.durationSeconds))
                    : undefined,
            scenario_key: scenarioId,
            steps: result?.steps,
            metadata: {
                scenarioId,
                at: result?.at || Date.now(),
                vehicleId,
                hintsUsed: hints,
                attempts,
                adasDone,
                adasCalibrated,
                adasTotal: adasDone.length || ADAS_ITEMS.length,
                source,
            },
        };
    };
    const showCompleteNotice = (payload: ReturnType<typeof buildSessionPayload>) => {
        setCompleteNotice({
            score: payload.score,
            outcome: payload.outcome,
            hints: payload.hints_used ?? 0,
            attempts: payload.attempts ?? 1,
            adasCalibrated: payload.metadata.adasCalibrated ?? 0,
            adasTotal: payload.metadata.adasTotal ?? ADAS_ITEMS.length,
            scenarioId: payload.metadata.scenarioId ?? "scanner",
        });
    };
    const completeSession = async (
        result: Parameters<typeof buildSessionPayload>[0],
        source: "engine" | "report",
    ): Promise<boolean> => {
        if (completingRef.current) return false;
        completingRef.current = true;
        try {
            // Show the popup immediately so completion is visible even if the API write fails
            // or the report auto-opens first (state updates race the network).
            const payload = buildSessionPayload(result, source);
            showCompleteNotice(payload);

            const id = activeSessionRef.current ?? (await ensureScanSession());
            let remote: SimulatorResult | null = null;
            if (id) {
                try {
                    remote = await simulatorApi.complete(id, payload);
                    // Only drop the session after a successful complete so retries reuse
                    // the same active row instead of leaking a new one each attempt.
                    activeSessionRef.current = null;
                    setActiveSessionId(null);
                } catch {
                    remote = null;
                }
            }

            if (remote) {
                // Server already persisted this result for the signed-in user —
                // do not mirror it into localStorage (that leaked across accounts).
                activeSessionRef.current = null;
                setActiveSessionId(null);
            } else {
                // Local mirror keeps History / Report / hub progress correct offline
                // or when the backend rejects the complete payload. Keep the session
                // id on failure so the next attempt retries the same active row
                // instead of creating a new one (avoids leaking active sessions).
                rememberLocalResult({
                    id: `local-${id ?? Date.now().toString(36)}-${payload.metadata.at ?? Date.now()}`,
                    session_id: id,
                    tool: "scanner",
                    score: payload.score,
                    outcome: payload.outcome,
                    verdict: payload.verdict,
                    attempts: payload.attempts,
                    hints_used: payload.hints_used,
                    duration_seconds: payload.duration_seconds ?? null,
                    steps: (payload.steps as { label: string; ok: boolean }[] | undefined) ?? null,
                    metadata: payload.metadata as SimulatorResult["metadata"],
                    created_at: new Date().toISOString(),
                });
            }
            return true;
        } catch {
            return false;
        } finally {
            completingRef.current = false;
            setHistoryBump((n) => n + 1);
            notifySimulatorResults();
        }
    };
    /*
     * Engine results (scan / tree / training) are no longer a session
     * completion on their own — the session is finalized only when the student
     * opens the final report with every step done (report-enter effect below).
     */
    const openWorkspace = (next: ScannerTab) => { setTab(next); setScreen("workspace"); };
    const runFullScan = () => {
        openWorkspace("network");
        void ensureScanSession();
        engine?.startScan();
    };
    const confirmVehicle = (id: string) => {
        onSelectVehicle(id);
        setScreen("workstation");
    };
    const adasDue = ADAS_ITEMS.length - ADAS_CALIBRATED;

    const railActive: RailId =
        screen === "workspace"
            ? tab === "network"
                ? "network"
                : tab === "systems"
                  ? "systems"
                  : tab === "dtc"
                    ? "dtc"
                    : tab === "live"
                      ? "live"
                      : tab === "graph"
                        ? "graph"
                        : tab === "tree"
                          ? "tree"
                          : tab === "training"
                            ? "train"
                            : "adas"
            : screen === "select"
              ? "vehicle"
              : screen === "history"
                ? "hist"
                : screen === "report"
                  ? "rept"
                  : screen === "settings"
                    ? "set"
                    : "home";

    const navigateRail = (id: RailId) => {
        if (id === "home") setScreen("workstation");
        else if (id === "vehicle") setScreen("select");
        else if (id === "network") openWorkspace("network");
        else if (id === "systems") openWorkspace("systems");
        else if (id === "dtc") openWorkspace("dtc");
        else if (id === "live") openWorkspace("live");
        else if (id === "graph") openWorkspace("graph");
        else if (id === "tree") openWorkspace("tree");
        else if (id === "train") openWorkspace("training");
        else if (id === "adas") openWorkspace("adas");
        else if (id === "hist") setScreen("history");
        else if (id === "rept") {
            if (!reportUnlocked) return;
            setScreen("report");
        } else if (id === "set") setScreen("settings");
    };

    // The final report opens itself as soon as the last step lands, but only
    // once — leaving the report and coming back never re-triggers it.
    const wasUnlockedRef = useRef(false);
    useEffect(() => {
        if (reportUnlocked && !wasUnlockedRef.current) {
            setScreen("report");
        }
        wasUnlockedRef.current = reportUnlocked;
    }, [reportUnlocked]);

    // Opening the unlocked final report completes the session — the one and
    // only completion path (a scan alone never completes a session any more).
    const reportEnteredRef = useRef(false);
    useEffect(() => {
        if (screen !== "report") {
            reportEnteredRef.current = false;
            return;
        }
        if (!reportUnlocked || reportEnteredRef.current || completedReportRef.current) return;
        reportEnteredRef.current = true;
        void (async () => {
            const st = engine?.getState() ?? null;
            const ok = await completeSession(st?.lastResult ?? null, "report");
            if (ok) {
                completedReportRef.current = true;
                setSessionCompleted(true);
            } else {
                // Allow a retry the next time the report is opened.
                reportEnteredRef.current = false;
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen, reportUnlocked, engine, vehicleId]);

    const sectionCrumb =
        screen === "workspace"
            ? tab === "training"
                ? t("simulator.scannerLab.dash.trainingSim")
                : tab === "adas"
                  ? t("simulator.scannerLab.dash.adas")
                  : tab === "tree"
                    ? t("simulator.scannerLab.dash.intelligent")
                    : tab === "network" || tab === "systems" || tab === "dtc" || tab === "live" || tab === "graph"
                      ? t(`simulator.scannerLab.rail.${tab}`)
                      : t("simulator.scannerLab.dash.local")
            : screen === "routines"
              ? t("simulator.scannerLab.dash.reset")
              : screen === "history"
                ? t("simulator.scannerLab.historyScreen.title")
                : screen === "report"
                  ? t("simulator.scannerLab.reportScreen.title")
                  : screen === "settings"
                    ? t("simulator.scannerLab.settingsScreen.title")
              : screen === "select"
                ? t("simulator.scannerLab.select.title")
                : t("simulator.scannerLab.dash.crumbDash");

    if (unavailable) {
        return (
            <div className="grid min-h-[320px] place-items-center rounded-[20px] border border-[#3A3A3A]/10 bg-white p-8 text-center dark:border-white/10 dark:bg-[#1b1b20]">
                <div>
                    <p className="text-sm font-black text-[#3A3A3A] dark:text-white">{t("simulator.scannerLab.vehicleGoneTitle")}</p>
                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">{t("simulator.scannerLab.vehicleGoneDesc")}</p>
                    <button
                        type="button"
                        onClick={onSwitchVehicle}
                        className="mt-4 rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-black text-white transition hover:bg-[#E96D18]"
                    >
                        {t("simulator.scannerLab.gate.changeVehicle")}
                    </button>
                </div>
            </div>
        );
    }
    if (!engine || !state || !labData) {
        return (
            <div className="grid min-h-[320px] place-items-center rounded-[20px] border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="flex items-center gap-3 text-sm font-bold text-[#3A3A3A]/50 dark:text-white/50">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#F47822]/25 border-t-[#F47822]" />
                    {t("simulator.scannerLab.loadingBench")}
                </div>
            </div>
        );
    }
    const engineState = state;
    const profile = labData.profile;
    const trainingSession = labData.session;
    const treeSteps = labData.tree;

    // All rail sections stay locked until the student starts a full scan —
    // only home / vehicle / network are always open (ScannerRail enforces the rest).
    const railUnlocked = Boolean(
        state.scanning || state.scanDone || state.treeFinished || state.tFinished || lastResult,
    );

    return (
        <div className="overflow-hidden rounded-[20px] border border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20]">
            {completeNotice && (
                <div className="flex items-start gap-3 border-b border-emerald-200/80 bg-emerald-50 px-4 py-3 shadow-[0_8px_24px_rgba(16,185,129,0.12)] dark:border-emerald-500/30 dark:bg-emerald-500/15">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                        <CheckCircle2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-black text-emerald-800 dark:text-emerald-300">
                            <Trophy className="h-4 w-4" />
                            {t("simulator.scannerLab.completePopup.title")}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-emerald-700/80 dark:text-emerald-300/80">
                            {t("simulator.scannerLab.completePopup.desc")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {[
                                { label: t("simulator.scannerLab.completePopup.score"), value: `${completeNotice.score}%` },
                                { label: t("simulator.scannerLab.completePopup.hints"), value: String(completeNotice.hints) },
                                { label: t("simulator.scannerLab.completePopup.attempts"), value: String(completeNotice.attempts) },
                                { label: t("simulator.scannerLab.completePopup.adas"), value: `${completeNotice.adasCalibrated}/${completeNotice.adasTotal}` },
                                {
                                    label: t("simulator.scannerLab.completePopup.outcome"),
                                    value:
                                        completeNotice.outcome === "pass"
                                            ? t("simulator.scannerLab.reportScreen.passed")
                                            : t("simulator.scannerLab.reportScreen.failed"),
                                },
                            ].map((chip) => (
                                <span
                                    key={chip.label}
                                    className="rounded-full bg-white/80 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-500/30"
                                >
                                    {chip.label}: {chip.value}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCompleteNotice(null)}
                        aria-label={t("simulator.scannerLab.completePopup.dismiss")}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-emerald-700/60 transition hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300/60 dark:hover:text-emerald-200"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
            <div className="flex items-stretch">
                <ScannerRail active={railActive} onNavigate={navigateRail} unlocked={railUnlocked} reportLocked={!reportUnlocked} />
                <div className="min-w-0 flex-1">
                    <ScannerToolbar
                        crumb={sectionCrumb}
                        volts={engineState.volts}
                        livePlay={engineState.livePlay}
                        trainingActive={screen === "workspace" && tab === "training"}
                        onProfessional={() => openWorkspace("network")}
                        onTraining={() => openWorkspace("training")}
                        vehicleEngine={vehicleDisplayName(vehicleId)}
                        onSwitchVehicle={onSwitchVehicle}
                        completed={sessionCompleted}
                        score={sessionCompleted ? lastResult?.score ?? null : null}
                    />
                    <SessionProgressStrip
                        t={t}
                        steps={sessionSteps}
                        progress={progressPct}
                        onJump={(id) => {
                            const step = sessionSteps.find((s) => s.id === id);
                            if (step) openWorkspace(step.tab);
                        }}
                    />
                    {screen === "workstation" ? (
                        <DashboardView
                            t={t}
                            dateLocale={dateLocale}
                            sessions={sessions}
                            adasDue={adasDue}
                            onOpenWorkspace={openWorkspace}
                            onOpenRoutines={() => setScreen("routines")}
                            onStartScan={runFullScan}
                        />
                    ) : screen === "select" ? (
                        <div className="p-5 sm:p-6">
                            <VehicleGate onSelect={confirmVehicle} />
                        </div>
                    ) : screen === "routines" ? (
                        <div className="p-5 sm:p-6">
                            <RoutinesView t={t} onBack={() => setScreen("workstation")} />
                        </div>
                    ) : screen === "history" ? (
                        <HistoryScreen refreshKey={(lastResult?.at ?? 0) + historyBump || null} />
                    ) : screen === "report" ? (
                        reportUnlocked ? (
                            <ReportScreen
                                refreshKey={(lastResult?.at ?? 0) + historyBump || null}
                                vehicleKey={vehicleId}
                                engineState={engineState}
                                lastResult={lastResult}
                                activeSessionId={activeSessionId}
                            />
                        ) : (
                            <ReportLockedView
                                t={t}
                                steps={sessionSteps}
                                onJump={(id) => {
                                    const step = sessionSteps.find((s) => s.id === id);
                                    if (step) openWorkspace(step.tab);
                                }}
                            />
                        )
                    ) : screen === "settings" ? (
                        <SettingsScreen engine={engine} />
                    ) : (
                        <div className="p-5 sm:p-6">
                            <WorkspaceView
                                t={t}
                                tab={tab}
                                setTab={setTab}
                                engine={engine}
                                profile={profile}
                                treeSteps={treeSteps}
                                focusEcu={focusEcu}
                                setFocusEcu={setFocusEcu}
                                plotted={plotted}
                                setPlotted={setPlotted}
                                vehicleTitle={vehicleFacts(vehicleId).title}
                                vehicleMeta={vehicleFacts(vehicleId).meta}
                                trainingSession={trainingSession}
                                onBack={() => setScreen("workstation")}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   SESSION PROGRESS + LOCKED REPORT
   ============================================================ */

type SessionStep = { id: string; done: boolean; tab: ScannerTab };

function SessionProgressStrip({
    t,
    steps,
    progress,
    onJump,
}: {
    t: (key: string, options?: Record<string, unknown>) => string;
    steps: SessionStep[];
    progress: number;
    onJump: (id: string) => void;
}) {
    return (
        <div className="border-b border-[#3A3A3A]/8 bg-[#FCFCFC] px-4 py-2.5 dark:border-white/8 dark:bg-white/[0.02]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/45 dark:text-white/45">
                    {t("simulator.scannerLab.progress.title")}
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                    {steps.map((step, idx) => (
                        <button
                            key={step.id}
                            type="button"
                            onClick={() => onJump(step.id)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wide transition ${
                                step.done
                                    ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                                    : "bg-[#3A3A3A]/[.06] text-[#3A3A3A]/50 hover:bg-[#F47822]/10 hover:text-[#F47822] dark:bg-white/[0.06] dark:text-white/50"
                            }`}
                        >
                            {step.done ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <span className="grid h-3 w-3 place-items-center rounded-full border border-current text-[8px]">
                                    {idx + 1}
                                </span>
                            )}
                            {t(`simulator.scannerLab.progress.step.${step.id}`)}
                        </button>
                    ))}
                </span>
                <span className="ms-auto flex items-center gap-2">
                    <span className="font-mono text-[11px] font-black text-[#3A3A3A] dark:text-white">{progress}%</span>
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                        <span
                            className="block h-full rounded-full bg-[#F47822] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </span>
                </span>
            </div>
            {progress < 100 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-[#3A3A3A]/50 dark:text-white/50">
                    <Lock className="h-3 w-3 text-[#F47822]" />
                    {t("simulator.scannerLab.progress.reportLocked")}
                </p>
            )}
        </div>
    );
}

function ReportLockedView({
    t,
    steps,
    onJump,
}: {
    t: (key: string, options?: Record<string, unknown>) => string;
    steps: SessionStep[];
    onJump: (id: string) => void;
}) {
    const missing = steps.filter((step) => !step.done);
    const next = missing[0];
    return (
        <div className="grid min-h-[320px] place-items-center p-6 text-center">
            <div className="max-w-md">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F47822]/10">
                    <Lock className="h-5 w-5 text-[#F47822]" />
                </span>
                <h3 className="mt-4 text-base font-black text-[#3A3A3A] dark:text-white">
                    {t("simulator.scannerLab.reportLocked.title")}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-[#3A3A3A]/55 dark:text-white/55">
                    {t("simulator.scannerLab.reportLocked.desc")}
                </p>
                <ul className="mt-4 space-y-1.5">
                    {missing.map((step) => (
                        <li
                            key={step.id}
                            className="flex items-center justify-center gap-2 rounded-xl border border-[#3A3A3A]/10 bg-[#F8F7F6] px-3 py-2 text-xs font-bold text-[#3A3A3A]/60 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/60"
                        >
                            <span className="grid h-4 w-4 place-items-center rounded-full border border-current text-[9px]">
                                {steps.findIndex((s) => s.id === step.id) + 1}
                            </span>
                            {t(`simulator.scannerLab.progress.step.${step.id}`)}
                        </li>
                    ))}
                </ul>
                {next && (
                    <button
                        type="button"
                        onClick={() => onJump(next.id)}
                        className="mt-5 rounded-xl bg-[#F47822] px-5 py-2.5 text-xs font-black text-white transition hover:bg-[#E96D18]"
                    >
                        {t("simulator.scannerLab.reportLocked.goNext")}
                    </button>
                )}
            </div>
        </div>
    );
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function DashboardView({
    t, dateLocale, sessions, adasDue, onOpenWorkspace, onOpenRoutines, onStartScan,
}: {
    t: (key: string, options?: Record<string, unknown>) => string;
    dateLocale?: string;
    sessions: DiagnosticAttempt[];
    adasDue: number;
    onOpenWorkspace: (tab: ScannerTab) => void;
    onOpenRoutines: () => void;
    onStartScan: () => void;
}) {
    const recent = sessions.slice(0, 3);
    return (
        <div className="space-y-7 px-5 pb-6 pt-5 sm:px-6">
            <section>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/40 dark:text-white/40">
                    {t("simulator.scannerLab.dash.wsEyebrow")}
                </p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                    <h2 className="text-2xl font-black tracking-tight text-[#3A3A3A] sm:text-3xl dark:text-white">
                        {t("simulator.scannerLab.dash.wsTitle")}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: t("simulator.scannerLab.dash.vci"), value: "HB-LINK 3 · BT", live: true },
                            { label: t("simulator.scannerLab.dash.os"), value: `HB-OS 4.2.1 · ${t("simulator.scannerLab.dash.updates", { n: 3 })}`, live: false },
                            { label: t("simulator.scannerLab.dash.coverage"), value: "142 brands · 2026.7", live: false },
                        ].map((chip) => (
                            <div key={chip.label} className="rounded-2xl border border-[#3A3A3A]/10 bg-white px-4 py-2.5 dark:border-white/10 dark:bg-[#1b1b20]">
                                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/40 dark:text-white/40">{chip.label}</p>
                                <p className="mt-1 flex items-center gap-1.5 font-mono text-[13px] font-bold text-[#3A3A3A] dark:text-white">
                                    {chip.live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
                                    {chip.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
                <button
                    type="button"
                    onClick={() => onOpenWorkspace("tree")}
                    className="group rounded-[20px] bg-[#0f1115] p-6 text-start text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition hover:-translate-y-0.5"
                >
                    <div className="flex items-start justify-between">
                        <Cloud className="h-7 w-7 text-[#F47822]" />
                        <span className="rounded-md border border-emerald-400/40 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                            {t("simulator.scannerLab.dash.cloudOnline")}
                        </span>
                    </div>
                    <h3 className="mt-8 text-xl font-black">{t("simulator.scannerLab.dash.intelligent")}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">{t("simulator.scannerLab.dash.intelligentDesc")}</p>
                </button>
                <button
                    type="button"
                    onClick={() => onOpenWorkspace("network")}
                    className="group rounded-[20px] bg-[#F47822] p-6 text-start text-white shadow-[0_12px_30px_rgba(244,120,34,0.35)] transition hover:-translate-y-0.5 hover:bg-[#E96D18]"
                >
                    <div className="flex items-start justify-between">
                        <Car className="h-7 w-7 text-[#0f1115]" />
                        <span className="rounded-md border border-[#0f1115]/40 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#0f1115]">
                            {t("simulator.scannerLab.dash.startHere")}
                        </span>
                    </div>
                    <h3 className="mt-8 text-xl font-black">{t("simulator.scannerLab.dash.local")}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/85">{t("simulator.scannerLab.dash.localDesc")}</p>
                </button>
                <button
                    type="button"
                    onClick={onOpenRoutines}
                    className="group rounded-[20px] border border-[#3A3A3A]/10 bg-white p-6 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-[#F47822]/30 dark:border-white/10 dark:bg-[#1b1b20]"
                >
                    <div className="flex items-start justify-between">
                        <RefreshCcw className="h-7 w-7 text-[#2563eb]" />
                        <span className="rounded-md border border-[#3A3A3A]/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                            {t("simulator.scannerLab.dash.routines", { n: ROUTINES.length })}
                        </span>
                    </div>
                    <h3 className="mt-8 text-xl font-black text-[#3A3A3A] dark:text-white">{t("simulator.scannerLab.dash.reset")}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#3A3A3A]/55 dark:text-white/55">{t("simulator.scannerLab.dash.resetDesc")}</p>
                </button>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:gap-5">
                <FunctionCard
                    icon={<Radar className="h-5 w-5 text-[#2563eb]" />}
                    title={t("simulator.scannerLab.dash.adas")}
                    desc={t("simulator.scannerLab.dash.adasDesc")}
                    badge={t("simulator.scannerLab.dash.due", { n: adasDue })}
                    badgeTone="amber"
                    onClick={() => onOpenWorkspace("adas")}
                />
                <FunctionCard
                    icon={<KeyRound className="h-5 w-5 text-[#2563eb]" />}
                    title={t("simulator.scannerLab.dash.immo")}
                    desc={t("simulator.scannerLab.dash.immoDesc")}
                />
                <FunctionCard
                    icon={<CircleDot className="h-5 w-5 text-[#2563eb]" />}
                    title={t("simulator.scannerLab.dash.tpms")}
                    desc={t("simulator.scannerLab.dash.tpmsDesc")}
                />
                <FunctionCard
                    icon={<History className="h-5 w-5 text-[#2563eb]" />}
                    title={t("simulator.scannerLab.dash.history")}
                    desc={t("simulator.scannerLab.dash.historySessions", { n: sessions.length })}
                    to="/diagnostics/history"
                />
                <FunctionCard
                    icon={<Upload className="h-5 w-5 text-[#2563eb]" />}
                    title={t("simulator.scannerLab.dash.update")}
                    desc={t("simulator.scannerLab.dash.updateDesc")}
                />
                <FunctionCard
                    icon={<LayoutGrid className="h-5 w-5 text-[#3A3A3A]/50 dark:text-white/50" />}
                    title={t("simulator.scannerLab.dash.coverageFn")}
                    desc={t("simulator.scannerLab.dash.coverageFnDesc")}
                />
                <FunctionCard
                    icon={<GraduationCap className="h-5 w-5 text-[#F47822]" />}
                    title={t("simulator.scannerLab.dash.trainingSim")}
                    desc={t("simulator.scannerLab.dash.trainingSimDesc")}
                    onClick={() => onOpenWorkspace("training")}
                />
                <FunctionCard
                    icon={<BookOpen className="h-5 w-5 text-[#3A3A3A]/50 dark:text-white/50" />}
                    title={t("simulator.scannerLab.dash.knowledge")}
                    desc={t("simulator.scannerLab.dash.knowledgeDesc")}
                />
                <FunctionCard
                    icon={<Layers className="h-5 w-5 text-[#3A3A3A]/50 dark:text-white/50" />}
                    title={t("simulator.scannerLab.dash.other")}
                    desc={t("simulator.scannerLab.dash.otherDesc")}
                />
                <FunctionCard
                    icon={<Lock className="h-5 w-5 text-[#3A3A3A]/30 dark:text-white/30" />}
                    title={t("simulator.scannerLab.dash.ecuProg")}
                    desc={t("simulator.scannerLab.dash.ecuProgDesc")}
                    locked
                />
            </section>

            <section>
                <div className="flex items-center gap-4">
                    <p className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#3A3A3A]/40 dark:text-white/40">
                        {t("simulator.scannerLab.dash.recent")}
                    </p>
                    <span className="h-px flex-1 bg-[#3A3A3A]/10 dark:bg-white/10" />
                    <Link to="/diagnostics/history" className="shrink-0 text-xs font-bold text-[#2563eb] hover:underline">
                        {t("simulator.scannerLab.dash.viewAll")}
                    </Link>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
                    <span className="flex items-center gap-2 font-mono text-[11px] font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        {t("simulator.scannerLab.statusbar.connected")}
                    </span>
                    <span className="ms-auto flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onOpenWorkspace("network")}
                            className="rounded-xl border border-[#3A3A3A]/10 px-4 py-2 text-xs font-black text-[#3A3A3A] transition hover:border-[#F47822]/40 hover:text-[#F47822] dark:border-white/10 dark:text-white"
                        >
                            {t("simulator.scannerLab.statusbar.coverage")}
                        </button>
                        <button
                            type="button"
                            onClick={onStartScan}
                            className="rounded-xl bg-[#F47822] px-4 py-2 text-xs font-black text-white shadow-[0_6px_16px_rgba(244,120,34,0.3)] transition hover:bg-[#E96D18]"
                        >
                            {t("simulator.scannerLab.statusbar.start")}
                        </button>
                    </span>
                </div>
                {recent.length === 0 ? (
                    <p className="mt-3 rounded-2xl border border-dashed border-[#3A3A3A]/15 bg-white p-6 text-center text-sm text-[#3A3A3A]/50 dark:border-white/15 dark:bg-[#1b1b20] dark:text-white/50">
                        {t("simulator.scannerLab.dash.noSessions")}
                    </p>
                ) : (
                    <div className="mt-3 grid gap-3 lg:grid-cols-3">
                        {recent.map((session) => {
                            const title = session.scenario?.title ?? session.scenario_id.slice(0, 8);
                            const when = session.submitted_at ?? session.started_at;
                            return (
                                <Link
                                    key={session.id}
                                    to={session.status === "in_progress" ? `/diagnostics/attempts/${session.id}` : `/diagnostics/attempts/${session.id}/result`}
                                    className="group flex items-center gap-3 rounded-2xl border border-[#3A3A3A]/10 bg-white p-4 transition hover:border-[#F47822]/30 hover:shadow-sm dark:border-white/10 dark:bg-[#1b1b20]"
                                >
                                    <span className="h-10 w-1 shrink-0 rounded-full bg-red-500" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-bold text-[#3A3A3A] dark:text-white">{title}</span>
                                        <span className="mt-0.5 block font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45">
                                            {when ? new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(when)) : "—"}
                                        </span>
                                    </span>
                                    {session.score !== null && session.score !== undefined && (
                                        <span className="shrink-0 text-center">
                                            <span dir="ltr" className="block font-mono text-lg font-black text-red-500">{session.score}</span>
                                            <span className="block font-mono text-[9px] font-bold uppercase tracking-wider text-[#3A3A3A]/40 dark:text-white/40">{t("simulator.scannerLab.dtc")}</span>
                                        </span>
                                    )}
                                    <ChevronRight className="h-4 w-4 shrink-0 text-[#3A3A3A]/25 transition group-hover:translate-x-0.5 group-hover:text-[#F47822] rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

function FunctionCard({
    icon, title, desc, badge, badgeTone, onClick, to, locked,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    badge?: string;
    badgeTone?: "amber" | "red";
    onClick?: () => void;
    to?: string;
    locked?: boolean;
}) {
    const inner = (
        <>
            <div className="flex items-start justify-between gap-2">
                {icon}
                {badge && (
                    <span className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${badgeTone === "red" ? "bg-red-500 text-white" : "bg-amber-500/15 text-amber-700 dark:text-amber-400"}`}>
                        {badge}
                    </span>
                )}
                {locked && (
                    <span className="shrink-0 rounded-md bg-[#3A3A3A]/[.06] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#3A3A3A]/40 dark:bg-white/[0.07] dark:text-white/40">
                        <Lock className="h-3 w-3" />
                    </span>
                )}
            </div>
            <h3 className={`mt-6 text-[15px] font-bold ${locked ? "text-[#3A3A3A]/40 dark:text-white/40" : "text-[#3A3A3A] dark:text-white"}`}>{title}</h3>
            <p className="mt-1 text-xs leading-5 text-[#3A3A3A]/50 dark:text-white/50">{desc}</p>
        </>
    );
    const cls = `rounded-[20px] border bg-white p-5 text-start transition dark:bg-[#1b1b20] ${
        locked
            ? "cursor-not-allowed border-dashed border-[#3A3A3A]/15 opacity-80 dark:border-white/15"
            : "border-[#3A3A3A]/10 hover:-translate-y-0.5 hover:border-[#F47822]/30 hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] dark:border-white/10"
    }`;
    if (to) {
        return <Link to={to} className={cls}>{inner}</Link>;
    }
    if (onClick && !locked) {
        return (
            <button type="button" onClick={onClick} className={cls}>
                {inner}
            </button>
        );
    }
    return <div className={cls}>{inner}</div>;
}

/* ============================================================
   ROUTINES CATALOGUE
   ============================================================ */

function RoutinesView({
    t, onBack,
}: {
    t: (key: string, options?: Record<string, unknown>) => string;
    onBack: () => void;
}) {
    return (
        <div className="space-y-4">
            <button
                type="button"
                onClick={onBack}
                className="group inline-flex w-fit items-center gap-2 rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-sm font-bold text-[#3A3A3A]/60 shadow-sm transition-all hover:-translate-x-0.5 hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822] rtl:hover:translate-x-0.5 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60 dark:hover:border-[#F47822]/40 dark:hover:text-[#F47822]"
            >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#3A3A3A]/[.05] transition-colors group-hover:bg-[#F47822]/10 dark:bg-white/[0.06]">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
                </span>
                {t("simulator.scannerLab.back")}
            </button>
            <div className="rounded-[20px] border border-[#3A3A3A]/10 bg-white p-6 dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-black text-[#3A3A3A] dark:text-white">{t("simulator.scannerLab.dash.reset")}</h3>
                        <p className="mt-1 text-sm text-[#3A3A3A]/55 dark:text-white/55">{t("simulator.scannerLab.dash.resetDesc")}</p>
                    </div>
                    <span className="rounded-md border border-[#3A3A3A]/15 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#3A3A3A]/50 dark:border-white/15 dark:text-white/50">
                        {t("simulator.scannerLab.dash.routines", { n: ROUTINES.length })}
                    </span>
                </div>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                    {ROUTINES.map((name, i) => (
                        <li key={name} className="flex items-center gap-3 rounded-xl border border-[#3A3A3A]/[.07] bg-[#F8F7F6] px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.03]">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#F47822]/10 font-mono text-[11px] font-black text-[#F47822]">{String(i + 1).padStart(2, "0")}</span>
                            <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#3A3A3A] dark:text-white">{name}</span>
                            <span className="shrink-0 rounded-md bg-[#3A3A3A]/[.06] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#3A3A3A]/40 dark:bg-white/[0.07] dark:text-white/40">
                                {t("simulator.scannerLab.dash.soon")}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

/* ============================================================
   WORKSPACE (existing bench — network / dtc / live / tree / training / adas)
   ============================================================ */

function WorkspaceView(props: {
    t: (key: string, options?: Record<string, unknown>) => string;
    tab: ScannerTab;
    setTab: (tab: ScannerTab) => void;
    engine: ScannerEngine;
    profile: VehicleProfile;
    treeSteps: import("@/features/simulator/scanner/data/scanner.data").TreeStep[];
    focusEcu: string | null;
    setFocusEcu: (id: string) => void;
    plotted: string[];
    setPlotted: (ids: string[]) => void;
    vehicleTitle: string;
    vehicleMeta: string;
    trainingSession: TrainingSession | null;
    onBack: () => void;
}) {
    const {
        t, tab, setTab, engine, profile, treeSteps, focusEcu, setFocusEcu,
        plotted, setPlotted,
        vehicleTitle, vehicleMeta,
        trainingSession,
        onBack,
    } = props;
    const engineState = engine.getState();
    const trainingOpts = trainingSession?.options ?? DEFAULT_TRAINING_OPTIONS;
    const trainingCorrect = trainingSession?.correctIndex ?? DEFAULT_TRAINING_CORRECT;
    const trainingTotal = trainingSession && trainingSession.steps.length > 0 ? trainingSession.steps.length : 6;
    const stepCfg = trainingSession?.steps?.[engineState.tStep];
    const stepOptions =
        (engine as { trainingOptionsFor?: (i: number) => [string, string, string, string] }).trainingOptionsFor?.(engineState.tStep) ??
        stepCfg?.options ??
        trainingOpts;
    const stepCorrect =
        (engine as { trainingCorrectFor?: (i: number) => number }).trainingCorrectFor?.(engineState.tStep) ??
        stepCfg?.correctIndex ??
        trainingCorrect;
    const stepQuestion =
        (engine as { trainingQuestionFor?: (i: number) => string | null }).trainingQuestionFor?.(engineState.tStep) ??
        stepCfg?.question ??
        null;
    const stepHasQa =
        (engine as { trainingStepHasQa?: (i: number) => boolean }).trainingStepHasQa?.(engineState.tStep) ??
        stepOptions.some((o) => o.trim() !== "");
    const answeredCount = Object.keys(engineState.tAnswers ?? {}).length;
    const allAnswered = answeredCount >= trainingTotal;
    const trainingDesc = trainingSession?.description ?? (
        <>
            Guided steps jump into DTCs/livedata/graph/tree — single-attempt diagnosis. Correct:{" "}
            <b className="text-[#3A3A3A] dark:text-white">restricted fuel filter starving the HP pump</b> · Hints cost 5 pts.
        </>
    );
    return (
        <div className="space-y-5">
            <button
                type="button"
                onClick={onBack}
                className="group inline-flex w-fit items-center gap-2 rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-sm font-bold text-[#3A3A3A]/60 shadow-sm transition-all hover:-translate-x-0.5 hover:border-[#F47822]/40 hover:bg-[#F47822]/5 hover:text-[#F47822] rtl:hover:translate-x-0.5 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white/60 dark:hover:border-[#F47822]/40 dark:hover:text-[#F47822]"
            >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#3A3A3A]/[.05] transition-colors group-hover:bg-[#F47822]/10 dark:bg-white/[0.06]">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
                </span>
                {t("simulator.scannerLab.back")}
            </button>
            <div className="rounded-2xl border border-[#3A3A3A]/8 bg-white p-5 flex flex-wrap items-center gap-4 dark:border-white/8 dark:bg-[#1b1b20]">
                <span className="rounded-full bg-[#0f1115] px-4 py-2 text-xs font-bold text-white">{vehicleTitle}</span>
                <span className="text-sm text-[#3A3A3A]/50 dark:text-white/50" dir="ltr">{vehicleMeta}</span>
                <span className="ml-auto flex items-center gap-3 text-sm font-bold">
                    <span className={`h-2.5 w-2.5 rounded-full ${engineState.livePlay ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-[#3A3A3A]/20"}`} /> <span dir="ltr" className="tabular-nums">VBAT {engineState.live.VBAT?.value.toFixed(2) ?? "—"}V</span>
                    <button onClick={() => engine.toggleLive()} className="rounded-full bg-[#F47822] px-3 py-1.5 text-white text-xs font-bold hover:bg-[#df6817]">{engineState.livePlay ? t("simulator.scannerLab.live") : t("simulator.scannerLab.paused")}</button>
                </span>
                <button onClick={() => engine.startScan()} disabled={engineState.scanning} className="rounded-full bg-[#3A3A3A] px-4 py-2 text-sm font-black text-white disabled:opacity-40 hover:bg-black">{engineState.scanning ? `${t("simulator.scannerLab.scanning")} ${engineState.scanIdx}/21` : t("simulator.scannerLab.fullScan")}</button>
            </div>
            {tab === "network" && (
                <div className="space-y-4">
                    <div className="rounded-2xl bg-[#14181C] p-5 text-white sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#F47822]">
                                    {engineState.scanning
                                        ? t("simulator.scannerLab.scan.scanning")
                                        : engineState.scanDone
                                          ? t("simulator.scannerLab.scan.result", {
                                                n: engineState.scanLog.filter((l) => l.dtc > 0).length,
                                            })
                                          : t("simulator.scannerLab.scan.run")}
                                </p>
                                <h3 className="mt-1 text-[22px] font-black tracking-tight">
                                    {t("simulator.scannerLab.networkTitle")}
                                </h3>
                                <p className="mt-1 font-mono text-xs text-white/50" dir="ltr">
                                    {engineState.scanIdx}/21 ECUs
                                </p>
                            </div>
                            <p dir="ltr" className="font-mono text-2xl font-black tabular-nums text-white">
                                {Math.round((engineState.scanIdx / 21) * 100)}%
                            </p>
                        </div>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-[#F47822] transition-[width] duration-200"
                                style={{ width: `${Math.round((engineState.scanIdx / 21) * 100)}%` }}
                            />
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => engine.startScan()}
                                disabled={engineState.scanning}
                                className="rounded-xl bg-[#F47822] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#E96D18] disabled:opacity-50"
                            >
                                {engineState.scanning
                                    ? `${t("simulator.scannerLab.scan.scanning")} ${engineState.scanIdx}/21`
                                    : t("simulator.scannerLab.scan.run")}
                            </button>
                            {engineState.scanDone && (
                                <span className="text-xs font-bold text-white/60">
                                    {t("simulator.scannerLab.scan.result", {
                                        n: engineState.scanLog.filter((l) => l.dtc > 0).length,
                                    })}
                                </span>
                            )}
                        </div>
                        <div className="mt-4 max-h-[200px] overflow-auto rounded-xl bg-[#0a0c0f] p-3 font-mono text-xs leading-6 text-white/70" dir="ltr">
                            {engineState.scanLog.length === 0 ? (
                                <span className="text-white/30">{t("simulator.scannerLab.scan.clear")}</span>
                            ) : (
                                engineState.scanLog.map((n, i) => (
                                    <div key={`${n.ecu}-${i}`} className="flex gap-3">
                                        <span className="w-6 text-right text-white/30">{String(i + 1).padStart(2, "0")}</span>
                                        <span className={n.status === "fault" ? "text-red-400" : n.status === "warn" ? "text-amber-400" : "text-white/60"}>
                                            {n.ecu} — {n.name}
                                        </span>
                                        <span className="ms-auto hidden text-white/30 sm:inline">{n.status} · {n.dtc} DTC</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <NetworkMap
                        nodes={profile.nodes}
                        focusEcu={focusEcu}
                        onOpenSystems={(id) => {
                            setFocusEcu(id);
                            setTab("systems");
                        }}
                    />
                </div>
            )}
            {tab === "systems" && (
                <SystemsTable
                    nodes={profile.nodes}
                    focusEcu={focusEcu}
                    onOpen={(id) => {
                        setFocusEcu(id);
                        setTab("network");
                    }}
                    onOpenDtcs={() => setTab("dtc")}
                />
            )}
            {tab === "dtc" && <DtcPanel dtcs={profile.dtcs} onOpenTree={() => setTab("tree")} />}
            {tab === "live" && (
                <LiveDataGrid
                    engine={engine}
                    onPlot={(ids) => {
                        setPlotted(ids);
                        setTab("graph");
                    }}
                />
            )}
            {tab === "graph" && <SignalGraph engine={engine} signals={plotted} onSignals={setPlotted} />}
            {tab === "tree" && (
                <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                    <p className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{t("simulator.scannerLab.treeTitle", { n: treeSteps.length })} {engineState.treeStep + 1}/{treeSteps.length}</p>
                    <p className="mt-2 text-[11px] leading-5 text-[#3A3A3A]/55 dark:text-white/55">{t("simulator.scannerLab.treeHelp")}</p>
                    {engineState.treeFeedback && (
                        <p
                            className={`mt-3 rounded-xl border px-4 py-2.5 text-xs font-bold ${
                                engineState.treeFeedback.ok
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                            }`}
                        >
                            {!engineState.treeFeedback.ok
                                ? t("simulator.scannerLab.treeRecheck")
                                : engineState.treeFeedback.kind === "confirmed"
                                  ? t("simulator.scannerLab.treeConfirmed")
                                  : t("simulator.scannerLab.treeCorrect")}
                        </p>
                    )}
                    {engineState.treeFinished && (
                        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                            {t("simulator.scannerLab.treeFinished")}
                        </p>
                    )}
                    <div className="mt-4 space-y-3">
                        {treeSteps.map((step, i) => {
                            const record = engineState.treeStates[i];
                            const done = record?.done ?? false;
                            const failed = done && record?.verdict === "fail";
                            const active = i === engineState.treeStep && !engineState.treeFinished;
                            return (
                                <div key={step.id} className={`rounded-xl border p-4 ${failed ? "border-red-300 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10" : active ? "border-[#F47822] bg-[#FFF7ED] shadow-sm dark:bg-[#F47822]/[0.07]" : done ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10" : "border-[#3A3A3A]/8 bg-[#FCFCFC] dark:border-white/8 dark:bg-white/[0.03]"}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${failed ? "bg-red-500 text-white" : done ? "bg-emerald-500 text-white" : active ? "bg-[#F47822] text-white" : "bg-white border border-[#3A3A3A]/10 text-[#3A3A3A]/30 dark:bg-white/10 dark:border-white/10 dark:text-white/40"}`}>{done ? "✓" : i + 1}</span>
                                        <span className="flex-1 text-sm font-bold leading-5 text-[#3A3A3A] dark:text-white">{step.label}</span>
                                        <span className="hidden sm:inline font-mono text-xs font-bold text-[#3A3A3A]/40 px-2 py-1 rounded-full bg-white border border-[#3A3A3A]/10 dark:bg-white/10 dark:border-white/10 dark:text-white/50" dir="ltr">{step.expected}</span>
                                    </div>
                                    {active && (
                                        <div className="mt-3 flex flex-wrap items-center gap-2 pl-10">
                                            {!engineState.treeMeasured ? (
                                                <button onClick={() => engine.treeMeasure()} className="rounded-full bg-[#3A3A3A] px-4 py-2 text-xs font-bold text-white hover:bg-black">{t("simulator.scannerLab.reveal")}</button>
                                            ) : (
                                                <>
                                                    <button onClick={() => engine.treeVerdict(true)} className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700">{t("simulator.scannerLab.judgePass")}</button>
                                                    <button onClick={() => engine.treeVerdict(false)} className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">{t("simulator.scannerLab.judgeFail")}</button>
                                                </>
                                            )}
                                            <span dir="ltr" className="rounded-full bg-white border border-[#3A3A3A]/10 px-3 py-1 font-mono text-xs font-bold text-[#3A3A3A] dark:bg-white/10 dark:border-white/10 dark:text-white">{engineState.treeMeasured ? step.measure : "—"}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm dark:bg-emerald-500/10 dark:border-emerald-500/20"><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /><span className="text-emerald-800 font-medium dark:text-emerald-300">{t("simulator.scannerLab.gradedNote")}</span></div>
                </div>
            )}
            {tab === "training" && (
                <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{trainingSession?.title ?? t("simulator.scannerLab.trainingTitle")}</p>
                        <p className="font-mono text-[11px] font-bold text-[#3A3A3A]/45 dark:text-white/45" dir="ltr">
                            {t("simulator.scannerLab.trainingResult.stepOf", { n: engineState.tStep + 1, total: trainingTotal })}
                        </p>
                    </div>
                    <div className="mt-4 flex gap-2">
                        {Array.from({ length: trainingTotal }).map((_, i) => (
                            <span
                                key={i}
                                className={`h-2 flex-1 rounded-full transition ${
                                    engineState.tDone[i]
                                        ? engineState.tAnswers[i] !== undefined && i === engineState.tStep
                                            ? engineState.tFeedback?.correct
                                                ? "bg-emerald-500"
                                                : "bg-red-500"
                                            : "bg-emerald-500"
                                        : i === engineState.tStep
                                          ? "bg-[#F47822]"
                                          : "bg-[#3A3A3A]/10 dark:bg-white/10"
                                }`}
                            />
                        ))}
                    </div>
                    <div className="mt-4 rounded-xl bg-[#FFF7ED] p-4 text-sm leading-6 text-[#3A3A3A]/70 border border-[#F47822]/10 dark:bg-[#F47822]/[0.07] dark:text-white/70">{trainingDesc}</div>
                    {engineState.tFinished ? (
                        <div className="mt-4 space-y-4">
                            <div
                                className={`rounded-xl border px-4 py-3 text-sm font-bold ${
                                    engineState.tScore && engineState.tScore.accuracy >= 70
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                                        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300"
                                }`}
                            >
                                {t("simulator.scannerLab.trainingResult.sessionComplete", {
                                    correct: engineState.tCorrectCount,
                                    total: trainingTotal,
                                })}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: t("simulator.scannerLab.trainingResult.accuracy"), value: engineState.tScore?.accuracy },
                                    { label: t("simulator.scannerLab.trainingResult.process"), value: engineState.tScore?.process },
                                    { label: t("simulator.scannerLab.trainingResult.time"), value: engineState.tScore?.time },
                                ].map((s) => (
                                    <div key={s.label} className="rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-3 text-center dark:border-white/10 dark:bg-white/[0.03]">
                                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#3A3A3A]/40 dark:text-white/40">{s.label}</p>
                                        <p dir="ltr" className="mt-1 font-mono text-lg font-black text-[#3A3A3A] dark:text-white">{s.value ?? "—"}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45" dir="ltr">
                                {t("simulator.scannerLab.trainingResult.hintsUsed", { n: engineState.tHints })}
                            </p>
                            <button
                                type="button"
                                onClick={() => setTab("dtc")}
                                className="rounded-full bg-[#F47822] px-5 py-2 text-xs font-black text-white hover:bg-[#E96D18]"
                            >
                                {t("simulator.scannerLab.trainingResult.viewReport")}
                            </button>
                        </div>
                    ) : (
                        <>
                            {stepQuestion && (
                                <p className="mt-4 text-sm font-bold leading-6 text-[#3A3A3A] dark:text-white">
                                    {stepQuestion}
                                </p>
                            )}
                            {engineState.tAnswer === null ? (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button onClick={() => engine.trainingPrev()} disabled={engineState.tStep === 0} className="rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-xs font-bold hover:bg-[#FCFCFC] disabled:opacity-40 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white dark:hover:bg-white/10">{t("simulator.scannerLab.prev")}</button>
                                    {!stepHasQa && (
                                        <button onClick={() => engine.trainingCompleteStep()} className="rounded-full bg-[#3A3A3A] px-4 py-2 text-xs font-bold text-white hover:bg-black">{t("simulator.scannerLab.trainingResult.markComplete")}</button>
                                    )}
                                    <button onClick={() => engine.trainingNext()} disabled={engineState.tStep >= trainingTotal - 1} className="rounded-full bg-[#3A3A3A] px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-40">{t("simulator.scannerLab.nextStep")}</button>
                                    <button onClick={() => engine.useTrainingHint()} className="rounded-full border border-dashed border-[#3A3A3A]/20 px-4 py-2 text-xs font-bold hover:bg-[#FCFCFC] dark:border-white/20 dark:text-white dark:hover:bg-white/10">{t("simulator.scannerLab.hint")} · {t("simulator.scannerLab.trainingResult.hintsUsed", { n: engineState.tHints })}</button>
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    <p className={`text-xs font-black uppercase tracking-wide ${engineState.tFeedback?.correct ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                        {engineState.tFeedback?.correct
                                            ? t("simulator.scannerLab.trainingResult.answerCorrect")
                                            : t("simulator.scannerLab.trainingResult.answerWrong")}
                                    </p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {stepOptions.map((opt, uiIdx) => (
                                            <button
                                                key={`${opt}-${uiIdx}`}
                                                disabled
                                                className={`rounded-xl border p-4 text-left text-sm font-bold transition ${
                                                    uiIdx === stepCorrect
                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                                                        : uiIdx === engineState.tAnswer
                                                          ? "border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                                                          : "border-[#3A3A3A]/10 bg-white opacity-50 dark:border-white/10 dark:bg-[#1b1b20]"
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => engine.trainingPrev()} disabled={engineState.tStep === 0} className="rounded-full border border-[#3A3A3A]/10 bg-white px-4 py-2 text-xs font-bold hover:bg-[#FCFCFC] disabled:opacity-40 dark:border-white/10 dark:bg-[#1b1b20] dark:text-white dark:hover:bg-white/10">{t("simulator.scannerLab.prev")}</button>
                                        <button
                                            onClick={() => engine.trainingNext()}
                                            disabled={engineState.tStep >= trainingTotal - 1}
                                            className="rounded-full bg-[#3A3A3A] px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-40"
                                        >
                                            {t("simulator.scannerLab.nextStep")}
                                        </button>
                                        {allAnswered && !engineState.tFinished && (
                                            <button
                                                onClick={() => engine.trainingCompleteStep()}
                                                className="rounded-full bg-[#F47822] px-4 py-2 text-xs font-black text-white hover:bg-[#E96D18]"
                                            >
                                                {t("simulator.scannerLab.trainingResult.submit")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                            {stepHasQa && engineState.tAnswer === null && (
                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {stepOptions.map((opt, uiIdx) => (
                                        <button
                                            key={`${opt}-${uiIdx}`}
                                            onClick={() => engine.submitTraining(uiIdx)}
                                            className="rounded-xl border border-[#3A3A3A]/10 bg-white p-4 text-left text-sm font-bold transition hover:border-[#F47822]/30 hover:bg-[#FFFBF7] dark:border-white/10 dark:bg-[#1b1b20] dark:text-white"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!stepHasQa && engineState.tAnswer !== null && (
                                <p className="mt-3 font-mono text-[11px] text-[#3A3A3A]/45 dark:text-white/45" dir="ltr">{t("simulator.scannerLab.trainingResult.hintsUsed", { n: engineState.tHints })}</p>
                            )}
                        </>
                    )}
                </div>
            )}
            {tab === "adas" && (
                <AdasScreen engine={engine} />
            )}
        </div>
    );
}
