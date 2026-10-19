import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Bot, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import {
    BLUE_GRADIENT,
    BUTTON_BORDER,
    CrumbBar,
    GREY_GRADIENT,
    ModalShell,
    TopBar,
} from "./chrome";
import { EcuMenuScreen } from "./EcuMenuScreen";
import { ReportScreen } from "./ReportScreen";
import { MentorPopup } from "../MentorPopup";
import { flatScanEcus, rollScanFaults, type ScanFaults } from "./scan";
import { loadEcuSystems, type EcuNode } from "./systemsData";
import { markScannerStep } from "../../lib/scannerProgress";
import { playConfirm, playTick, playWarn } from "../../lib/scanSounds";
import { scanRevealMs } from "../../lib/scannerSettings";
import type { DiagnosisBrand, DiagnosisVariant, DetectionMode } from "./data";

/* Automatic Scan: ECUs are revealed one by one like a real scan. Fault
   outcome is randomized per scan (see scan.ts); when the scan finishes
   faulty systems are sorted to the top. Fault rows expand inline; the
   bottom bar offers DTC Report / Pause / DTC List / Clear All DTCs.
   Diagnostic opens the ECU function menu. */

type Props = {
    brand: DiagnosisBrand;
    variant: DiagnosisVariant;
    mode: DetectionMode;
    vciConnected: boolean;
    scanResult: ScanFaults;
    onScanResult: (faults: ScanFaults) => void;
    onBack: () => void;
};

export function AutoScanScreen({
    brand,
    variant,
    mode,
    vciConnected,
    scanResult,
    onScanResult,
    onBack,
}: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";
    const systems = useMemo(() => loadEcuSystems(variant.id), [variant.id]);
    const plan = useMemo(() => flatScanEcus(systems), [systems]);

    const [faults] = useState<ScanFaults>(() => rollScanFaults(plan));
    const [revealed, setRevealed] = useState(0);
    const [paused, setPaused] = useState(false);
    const [clearedIds, setClearedIds] = useState<ReadonlySet<string>>(() => new Set());
    const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
    const [dtcListOpen, setDtcListOpen] = useState(false);
    const [reportOpen, setReportOpen] = useState(false);
    const [clearOpen, setClearOpen] = useState(false);
    const [diagEcu, setDiagEcu] = useState<EcuNode | null>(null);
    const [mentorPrompt, setMentorPrompt] = useState<string | null>(null);

    const done = revealed >= plan.length;

    // Reveal the next ECU on the scan-speed interval until it completes.
    // An unplugged connector pauses the reveal — a scan cannot continue
    // without the link, and the result stays hidden behind the gate.
    useEffect(() => {
        if (paused || done || !vciConnected) return;
        const id = setTimeout(() => {
            setRevealed((r) => {
                const next = r + 1;
                playTick();
                return next;
            });
        }, scanRevealMs());
        return () => clearTimeout(id);
    }, [revealed, paused, done, vciConnected]);

    // Publish the current result (faults minus cleared ECUs) for the flow.
    useEffect(() => {
        if (!done) return;
        markScannerStep("scan");
        const next: ScanFaults = {};
        for (const ecu of plan) {
            const ecuFaults = faults[ecu.id];
            if (ecuFaults?.length && !clearedIds.has(ecu.id)) next[ecu.id] = ecuFaults;
        }
        const faultCount = Object.keys(next).length;
        if (faultCount > 0) playWarn();
        else playConfirm();
        onScanResult(next);
    }, [done, faults, clearedIds, plan, onScanResult]);

    const faultsFor = (ecu: EcuNode) =>
        clearedIds.has(ecu.id) ? [] : (faults[ecu.id] ?? []);

    // When the scan finishes, faulty systems sort to the top (stable).
    const visiblePlan = useMemo(() => {
        const visible = plan.slice(0, revealed);
        if (!done) return visible;
        return [
            ...visible.filter((ecu) => faultsFor(ecu).length > 0),
            ...visible.filter((ecu) => faultsFor(ecu).length === 0),
        ];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [plan, revealed, done, clearedIds, faults]);

    const crumb = `${brand.name} ${brand.version} > ${
        brand.obd2
            ? t(`${cs}.mainMenu`)
            : mode === "auto"
              ? t(`${cs}.automaticDetection`)
              : t(`${cs}.manualDetection`)
    }`;

    const toggleExpand = (ecuId: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(ecuId)) next.delete(ecuId);
            else next.add(ecuId);
            return next;
        });
    };

    const clearEcu = (ecuId: string) => {
        setClearedIds((prev) => new Set(prev).add(ecuId));
    };

    const dtcEntries = plan.flatMap((ecu) =>
        faultsFor(ecu).map((dtc) => ({
            key: `${ecu.id}-${dtc.id}`,
            ecuName: ecu.name,
            code: dtc.code,
            desc: dtc.desc,
            severity: dtc.severity,
        })),
    );

    if (reportOpen) {
        return (
            <ReportScreen
                brand={brand}
                variant={variant}
                mode={mode}
                scanResult={Object.fromEntries(
                    plan
                        .filter((ecu) => faultsFor(ecu).length > 0)
                        .map((ecu) => [ecu.id, faultsFor(ecu)]),
                )}
                vciConnected={vciConnected}
                onExit={() => setReportOpen(false)}
            />
        );
    }

    if (diagEcu) {
        return (
            <EcuMenuScreen
                ecu={diagEcu}
                crumbText={`${crumb} > ${diagEcu.name}`}
                faults={faultsFor(diagEcu)}
                vciConnected={vciConnected}
                onBack={() => setDiagEcu(null)}
                onClearFaults={() => clearEcu(diagEcu.id)}
            />
        );
    }

    // DTC List — single screen of every code found (reference layout).
    if (dtcListOpen) {
        return (
            <div className="absolute inset-0 flex flex-col">
                <TopBar
                    onBack={() => setDtcListOpen(false)}
                    title={t(`${cs}.autoScan`)}
                    vciConnected={vciConnected}
                />
                <CrumbBar text={crumb} />
                <div
                    className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ background: "#e9ebef" }}
                >
                    {/* column headers */}
                    <div
                        className="grid items-center border-b border-[#c3c8cf]"
                        style={{
                            gridTemplateColumns: "17cqw 10cqw 1fr 11cqw",
                            background: "#dfe3ea",
                        }}
                    >
                        <span className="px-[1.4cqw] py-[1cqw] font-bold text-[#4a4f57]" style={{ fontSize: "1.35cqw" }}>
                            System
                        </span>
                        <span className="px-[1.4cqw] py-[1cqw] font-bold text-[#4a4f57]" style={{ fontSize: "1.35cqw" }}>
                            Code
                        </span>
                        <span className="px-[1.4cqw] py-[1cqw] font-bold text-[#4a4f57]" style={{ fontSize: "1.35cqw" }}>
                            Description
                        </span>
                        <span className="px-[1.4cqw] py-[1cqw] text-end font-bold text-[#4a4f57]" style={{ fontSize: "1.35cqw" }}>
                            Severity
                        </span>
                    </div>
                    {dtcEntries.length === 0 ? (
                        <p
                            className="grid h-full place-items-center text-[#7d8590]"
                            style={{ fontSize: "1.6cqw" }}
                        >
                            {t(`${cs}.scanNoFaults`)}
                        </p>
                    ) : (
                        dtcEntries.map((entry, index) => (
                            <div
                                key={entry.key}
                                className="grid items-center border-b border-[#d5d9df]"
                                style={{
                                    gridTemplateColumns: "17cqw 10cqw 1fr 11cqw",
                                    background: index % 2 === 0 ? "#ffffff" : "#eef1f5",
                                }}
                            >
                                <span
                                    className="px-[1.4cqw] py-[1.5cqw] font-semibold text-[#33383f]"
                                    style={{ fontSize: "1.45cqw" }}
                                >
                                    {entry.ecuName}
                                </span>
                                <span
                                    className="px-[1.4cqw] py-[1.5cqw] font-semibold text-[#33383f]"
                                    style={{ fontSize: "1.45cqw" }}
                                >
                                    {entry.code}
                                </span>
                                <span
                                    className="px-[1.4cqw] py-[1.5cqw] text-[#4a4f57]"
                                    style={{ fontSize: "1.45cqw" }}
                                >
                                    {entry.desc}
                                </span>
                                <span className="px-[1.4cqw] py-[1.5cqw] text-end">
                                    {entry.severity ? (
                                        <span
                                            className="rounded-full border border-[#e5c07b] bg-[#fdf3e3] px-[1cqw] py-[0.25cqw] font-semibold text-[#b06a00]"
                                            style={{ fontSize: "1.15cqw" }}
                                        >
                                            {entry.severity}
                                        </span>
                                    ) : null}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar
                onBack={onBack}
                title={t(`${cs}.autoScan`)}
                vciConnected={vciConnected}
                left={
                    <button
                        type="button"
                        data-testid="ask-mentor"
                        onClick={() =>
                            setMentorPrompt(
                                `I'm viewing the Automatic Scan screen for ${brand.name === variant.model ? brand.name : `${brand.name} ${variant.model}`} in the scanner lab. How do I interpret the results and what should I check first?`,
                            )
                        }
                        className="flex items-center gap-[0.7cqw] rounded-full px-[1.6cqw] py-[0.7cqw] font-bold text-white transition hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                        style={{
                            fontSize: "1.3cqw",
                            background:
                                "linear-gradient(180deg, #2a7be0 0%, #1663cc 60%, #0e4fb4 100%)",
                            border: "1px solid #2461bd",
                        }}
                    >
                        <Bot aria-hidden="true" style={{ width: "1.7cqw", height: "1.7cqw" }} />
                        {t(`${cs}.scanAskMentor`)}
                    </button>
                }
            />
            <CrumbBar text={crumb} />

            <div
                className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ background: "#e9ebef" }}
            >
                {visiblePlan.map((ecu, displayIndex) => {
                    const ecuFaults = faultsFor(ecu);
                    const hasFault = ecuFaults.length > 0;
                    const isExpanded = expanded.has(ecu.id);
                    return (
                        <div key={ecu.id}>
                            <div
                                className="grid items-center border-b border-[#d5d9df]"
                                style={{
                                    gridTemplateColumns: "3.6cqw 1fr auto 13cqw",
                                    background: displayIndex % 2 === 0 ? "#ffffff" : "#eef1f5",
                                }}
                            >
                                <span className="grid place-items-center">
                                    {hasFault ? (
                                        <AlertCircle
                                            className="text-[#e8720c]"
                                            aria-hidden="true"
                                            style={{ width: "2cqw", height: "2cqw" }}
                                        />
                                    ) : (
                                        <CheckCircle
                                            className="text-[#1fa34a]"
                                            aria-hidden="true"
                                            style={{ width: "2cqw", height: "2cqw" }}
                                        />
                                    )}
                                </span>
                                <span
                                    className="py-[1.5cqw] ps-[0.6cqw] font-semibold"
                                    style={{
                                        fontSize: "1.7cqw",
                                        color: hasFault ? "#e8720c" : "#2a7be4",
                                    }}
                                >
                                    {displayIndex + 1}. {ecu.name}
                                </span>
                                {hasFault ? (
                                    <button
                                        type="button"
                                        aria-expanded={isExpanded}
                                        onClick={() => toggleExpand(ecu.id)}
                                        className="flex items-center gap-[0.7cqw] px-[1.6cqw] py-[1.5cqw] font-semibold text-[#e8720c] transition hover:brightness-[1.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                                        style={{ fontSize: "1.6cqw" }}
                                    >
                                        {t(`${cs}.scanFault`, { count: ecuFaults.length })}
                                        {isExpanded ? (
                                            <ChevronUp aria-hidden="true" style={{ width: "1.8cqw", height: "1.8cqw" }} />
                                        ) : (
                                            <ChevronDown aria-hidden="true" style={{ width: "1.8cqw", height: "1.8cqw" }} />
                                        )}
                                    </button>
                                ) : (
                                    <span
                                        className="px-[1.6cqw] py-[1.5cqw] font-semibold text-[#4a4f57]"
                                        style={{ fontSize: "1.55cqw" }}
                                    >
                                        {t(`${cs}.scanPass`)}
                                    </span>
                                )}
                                <span className="grid place-items-center pe-[1.2cqw]">
                                    <button
                                        type="button"
                                        onClick={() => setDiagEcu(ecu)}
                                        className="rounded-[0.4cqw] px-[1.4cqw] py-[0.8cqw] font-bold text-white transition hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                                        style={{
                                            background: BLUE_GRADIENT,
                                            border: "1px solid #2461bd",
                                            fontSize: "1.4cqw",
                                            boxShadow: "0 0.2cqw 0.5cqw rgba(42, 111, 212, 0.35)",
                                        }}
                                    >
                                        {t(`${cs}.scanDiagnostic`)}
                                    </button>
                                </span>
                            </div>

                            {isExpanded
                                ? ecuFaults.map((dtc, dtcIndex) => (
                                      <div key={dtc.id}>
                                          <div
                                              className="grid items-center border-b border-[#f0d9b5]"
                                              style={{
                                                  gridTemplateColumns: "3.6cqw 10cqw 1fr",
                                                  background: "#fff8ef",
                                              }}
                                          >
                                              <span
                                                  className="grid place-items-center text-[#e8930c]"
                                                  style={{ fontSize: "1.25cqw" }}
                                              >
                                                  {dtcIndex + 1}
                                              </span>
                                              <span
                                                  className="py-[1.1cqw] ps-[0.6cqw] font-semibold text-[#e8930c]"
                                                  style={{ fontSize: "1.35cqw" }}
                                              >
                                                  {dtc.code}
                                              </span>
                                              <span
                                                  className="py-[1.1cqw] pe-[1.2cqw] ps-[0.6cqw] text-[#c96a06]"
                                                  style={{ fontSize: "1.35cqw" }}
                                              >
                                                  {dtc.desc}
                                              </span>
                                          </div>
                                          {dtc.note ? (
                                              <div
                                                  className="border-b border-[#f0d9b5] ps-[3.6cqw]"
                                                  style={{ background: "#fffdf6" }}
                                              >
                                                  <p
                                                      className="pe-[1.2cqw] py-[0.9cqw] ps-[0.6cqw] text-[#6b5a3a] italic"
                                                      style={{ fontSize: "1.25cqw", lineHeight: 1.55 }}
                                                  >
                                                      <span
                                                          className="me-[0.6cqw] font-bold not-italic text-[#b06a00]"
                                                          style={{ fontSize: "1.1cqw" }}
                                                      >
                                                          {t(`${cs}.scanNoteLabel`)}
                                                      </span>
                                                      {dtc.note}
                                                  </p>
                                              </div>
                                          ) : null}
                                          <div
                                              className="border-b border-[#f0d9b5] ps-[3.6cqw]"
                                              style={{ background: "#fffdf6" }}
                                          >
                                              <button
                                                  type="button"
                                                  data-testid="ask-mentor-dtc"
                                                  onClick={() =>
                                                      setMentorPrompt(
                                                          `Explain fault code ${dtc.code} (${dtc.desc}) on ${ecu.name}. What are the likely causes and how do I diagnose it?`,
                                                      )
                                                  }
                                                  className="inline-flex items-center gap-[0.5cqw] px-[0.6cqw] py-[0.7cqw] font-semibold text-[#2a7be4] underline-offset-2 transition hover:underline"
                                                  style={{ fontSize: "1.2cqw" }}
                                              >
                                                  {t(`${cs}.scanAskMentor`)}
                                              </button>
                                          </div>
                                      </div>
                                  ))
                                : null}
                        </div>
                    );
                })}
            </div>

            {/* bottom action bar */}
            <div
                className="flex shrink-0 items-center justify-center gap-[1.6cqw] border-t border-[#c3c8cf] px-[2cqw] py-[1.4cqw]"
                style={{ background: "linear-gradient(180deg, #f7f8fa 0%, #e8ebef 100%)" }}
            >
                <ScanBarButton label={t(`${cs}.scanDtcReport`)} onClick={() => setReportOpen(true)} />
                <ScanBarButton
                    label={paused ? t(`${cs}.scanResume`) : t(`${cs}.scanPause`)}
                    variant={done || !vciConnected ? "grey" : "blue"}
                    disabled={done || !vciConnected}
                    onClick={() => setPaused((p) => !p)}
                />
                <ScanBarButton
                    label={t(`${cs}.scanDtcList`)}
                    variant={dtcEntries.length > 0 ? "blue" : "grey"}
                    disabled={dtcEntries.length === 0}
                    onClick={() => setDtcListOpen(true)}
                />
                <ScanBarButton
                    label={t(`${cs}.scanClearAll`)}
                    variant={dtcEntries.length > 0 ? "blue" : "grey"}
                    disabled={dtcEntries.length === 0}
                    onClick={() => setClearOpen(true)}
                />
            </div>

            {/* Clear All DTCs confirmation */}
            {clearOpen ? (
                <ModalShell
                    title={t(`${cs}.scanClearTitle`)}
                    cancelLabel={t(`${cs}.cancel`)}
                    okLabel={t(`${cs}.ok`)}
                    onCancel={() => setClearOpen(false)}
                    onConfirm={() => {
                        setClearOpen(false);
                        setClearedIds(new Set(plan.map((ecu) => ecu.id)));
                        setExpanded(new Set());
                        markScannerStep("dtcCleared");
                        playConfirm();
                    }}
                >
                    <p
                        className="px-[3cqw] py-[2.6cqw] text-center text-[#4a4f57]"
                        style={{ fontSize: "1.55cqw" }}
                    >
                        {t(`${cs}.scanClearBody`)}
                    </p>
                </ModalShell>
            ) : null}

            <MentorPopup
                open={mentorPrompt !== null}
                initialPrompt={mentorPrompt ?? ""}
                onClose={() => setMentorPrompt(null)}
            />
        </div>
    );
}

function ScanBarButton({
    label,
    variant = "blue",
    disabled = false,
    onClick,
}: {
    label: string;
    variant?: "blue" | "grey";
    disabled?: boolean;
    onClick: () => void;
}) {
    const grey = variant === "grey";
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`rounded-[0.4cqw] px-[2cqw] py-[1.1cqw] font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                disabled ? "cursor-not-allowed opacity-55" : "hover:brightness-[1.06]"
            }`}
            style={{
                background: grey ? GREY_GRADIENT : BLUE_GRADIENT,
                border: `1px solid ${grey ? BUTTON_BORDER : "#2461bd"}`,
                fontSize: "1.5cqw",
                boxShadow: grey ? "none" : "0 0.2cqw 0.5cqw rgba(42, 111, 212, 0.35)",
            }}
        >
            {label}
        </button>
    );
}
