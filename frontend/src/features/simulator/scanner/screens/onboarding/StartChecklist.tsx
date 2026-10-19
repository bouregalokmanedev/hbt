import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ListChecks, RotateCcw } from "lucide-react";
import {
    SCANNER_STEPS,
    resetScannerSteps,
    useScannerSteps,
    type ScannerStep,
} from "../../lib/scannerProgress";

/* Floating "Getting started" checklist. Collapsed it's a single pill;
   expanding shows each step with a live check as the student performs it
   (steps are marked by the screens themselves via markScannerStep). */

type Props = {
    onReplayTour: () => void;
};

export function StartChecklist({ onReplayTour }: Props) {
    const { t } = useTranslation();
    const th = "simulator.scannerLab.checklist";
    const done = useScannerSteps();
    const [open, setOpen] = useState(false);

    const completed = SCANNER_STEPS.filter((s) => done.has(s)).length;
    const allDone = completed === SCANNER_STEPS.length;

    return (
        <div className="pointer-events-auto absolute bottom-[1.2cqw] end-[1.2cqw] z-30 flex flex-col items-end gap-[0.8cqw]">
            <AnimatePresence>
                {open ? (
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        transition={{ duration: 0.16 }}
                        role="dialog"
                        aria-label={t(`${th}.title`)}
                        className="w-[26cqw] min-w-[220px] overflow-hidden rounded-[1.2cqw] border border-[#c9ced6] bg-white shadow-[0_1.2cqw_3cqw_rgba(20,40,80,.22)]"
                    >
                        <div className="flex items-center justify-between border-b border-[#e3e7ee] px-[1.4cqw] py-[1cqw]">
                            <span className="font-bold text-[#33383f]" style={{ fontSize: "1.35cqw" }}>
                                {t(`${th}.title`)}
                            </span>
                            <button
                                type="button"
                                aria-label={t(`${th}.collapse`)}
                                onClick={() => setOpen(false)}
                                className="rounded p-[0.3cqw] text-[#7d8590] transition hover:bg-[#eef1f5] hover:text-[#33383f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                            >
                                <ChevronDown
                                    aria-hidden="true"
                                    style={{ width: "1.6cqw", height: "1.6cqw" }}
                                />
                            </button>
                        </div>
                        <ul className="py-[0.5cqw]">
                            {SCANNER_STEPS.map((step) => (
                                <ChecklistRow key={step} step={step} done={done.has(step)} />
                            ))}
                        </ul>
                        <div className="flex items-center justify-between gap-[0.8cqw] border-t border-[#e3e7ee] px-[1.4cqw] py-[1cqw]">
                            <button
                                type="button"
                                onClick={() => {
                                    resetScannerSteps();
                                    onReplayTour();
                                    setOpen(false);
                                }}
                                className="flex items-center gap-[0.5cqw] rounded-[0.6cqw] border border-[#c9ced6] px-[1cqw] py-[0.6cqw] font-semibold text-[#4a5563] transition hover:bg-[#f2f5f9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                                style={{ fontSize: "1.15cqw" }}
                            >
                                <RotateCcw
                                    aria-hidden="true"
                                    style={{ width: "1.2cqw", height: "1.2cqw" }}
                                />
                                {t(`${th}.restart`)}
                            </button>
                            <span className="font-bold text-[#2f7de1]" style={{ fontSize: "1.2cqw" }}>
                                {completed}/{SCANNER_STEPS.length}
                            </span>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-label={
                    allDone
                        ? t(`${th}.allDone`)
                        : `${t(`${th}.title`)} — ${completed}/${SCANNER_STEPS.length}`
                }
                className="flex items-center gap-[0.7cqw] rounded-full px-[1.4cqw] py-[0.8cqw] font-bold text-white shadow-[0_0.5cqw_1.4cqw_rgba(20,40,80,.28)] transition hover:brightness-[1.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                style={{
                    fontSize: "1.25cqw",
                    background: allDone
                        ? "linear-gradient(180deg, #34b26c 0%, #1d8f4e 100%)"
                        : "linear-gradient(180deg, #f4a236 0%, #d97d0e 100%)",
                }}
            >
                <ListChecks
                    aria-hidden="true"
                    style={{ width: "1.6cqw", height: "1.6cqw" }}
                />
                {allDone ? t(`${th}.allDone`) : t(`${th}.pill`, { completed, total: SCANNER_STEPS.length })}
                {!open ? (
                    <ChevronDown
                        aria-hidden="true"
                        className="-rotate-90 rtl:rotate-90"
                        style={{ width: "1.3cqw", height: "1.3cqw" }}
                    />
                ) : null}
            </button>
        </div>
    );
}

function ChecklistRow({ step, done }: { step: ScannerStep; done: boolean }) {
    const { t } = useTranslation();
    const th = "simulator.scannerLab.checklist";
    return (
        <li
            className="flex items-center gap-[1cqw] px-[1.4cqw] py-[0.7cqw]"
            aria-label={`${t(`${th}.items.${step}`)} — ${done ? t(`${th}.done`) : t(`${th}.todo`)}`}
        >
            <span
                className="grid shrink-0 place-items-center rounded-full"
                style={{
                    width: "1.8cqw",
                    height: "1.8cqw",
                    minWidth: "14px",
                    minHeight: "14px",
                    background: done
                        ? "linear-gradient(180deg, #34b26c, #1d8f4e)"
                        : "#eef1f5",
                    border: done ? "none" : "1.5px solid #c9ced6",
                }}
            >
                {done ? (
                    <Check
                        aria-hidden="true"
                        className="text-white"
                        style={{ width: "1.1cqw", height: "1.1cqw", minWidth: "9px", minHeight: "9px" }}
                    />
                ) : null}
            </span>
            <span
                className={done ? "text-[#7d8590] line-through" : "font-semibold text-[#33383f]"}
                style={{ fontSize: "1.2cqw" }}
            >
                {t(`${th}.items.${step}`)}
            </span>
        </li>
    );
}
