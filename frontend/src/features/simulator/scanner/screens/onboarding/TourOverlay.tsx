import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { markTourDone } from "../../lib/scannerProgress";

/* First-use tour: coachmarks that highlight real elements and advance when
   the student PERFORMS the action (plugs the OBD, taps Diagnosis) instead
   of clicking "Next". Rendered as a sibling of the device stage so it can
   spotlight both the tablet and the OBD link tool. */

export type TourStepId =
    | "tablet"
    | "obd"
    | "diagnosis"
    | "vehicle"
    | "done";

type TourStep = {
    id: TourStepId;
    /** data-tour attribute of the element to spotlight (null = free card). */
    target: string | null;
    title: string;
    body: string;
    /** Step advances when this becomes true (in addition to Next). */
    doneWhen?: () => boolean;
    /** Position of the coach card relative to the spotlight. */
    place: "right" | "left" | "top" | "bottom";
};

const CARD_WIDTH = 300; // px — fixed so measurements are predictable

type Props = {
    open: boolean;
    /** Live signals the tour waits on. */
    obdConnected: boolean;
    view:
        | "home"
        | "diagnosis"
        | "special"
        | "reports"
        | "settings"
        | "updates";
    onFinish: () => void;
    onSkip: () => void;
};

export function TourOverlay({ open, obdConnected, view, onFinish, onSkip }: Props) {
    const { t } = useTranslation();
    const th = "simulator.scannerLab.tour";
    const [stepIndex, setStepIndex] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const steps: TourStep[] = [
        {
            id: "tablet",
            target: "tablet",
            title: t(`${th}.steps.tablet.title`),
            body: t(`${th}.steps.tablet.body`),
            place: "right",
        },
        {
            id: "obd",
            target: "obd-tool",
            title: t(`${th}.steps.obd.title`),
            body: t(`${th}.steps.obd.body`),
            doneWhen: () => obdConnected,
            place: "left",
        },
        {
            id: "diagnosis",
            target: "tile-diagnosis",
            title: t(`${th}.steps.diagnosis.title`),
            body: t(`${th}.steps.diagnosis.body`),
            doneWhen: () => view === "diagnosis",
            place: "left",
        },
        {
            id: "vehicle",
            target: null,
            title: t(`${th}.steps.vehicle.title`),
            body: t(`${th}.steps.vehicle.body`),
            place: "bottom",
        },
    ];

    const step = steps[Math.min(stepIndex, steps.length - 1)];

    const goNext = useCallback(() => {
        setStepIndex((i) => {
            if (i >= steps.length - 1) {
                markTourDone();
                onFinish();
                return i;
            }
            return i + 1;
        });
    }, [steps.length, onFinish]);

    /* Auto-advance when the awaited action happens. */
    useEffect(() => {
        if (!open) return;
        if (step.doneWhen?.()) {
            const id = window.setTimeout(goNext, 350);
            return () => window.clearTimeout(id);
        }
    }, [open, step, goNext]);

    /* Measure the spotlight target (viewport coords). */
    useLayoutEffect(() => {
        if (!open) return;
        const measure = () => {
            if (!step.target) {
                setRect(null);
                return;
            }
            const el = document.querySelector(
                `[data-tour="${step.target}"]`,
            );
            setRect(el ? el.getBoundingClientRect() : null);
        };
        measure();
        window.addEventListener("resize", measure);
        const id = window.setInterval(measure, 400);
        return () => {
            window.removeEventListener("resize", measure);
            window.clearInterval(id);
        };
    }, [open, step.target, stepIndex]);

    if (!open) return null;

    /* Coach card position from the spotlight rect. */
    const cardPos = (() => {
        const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
        const vh = typeof window !== "undefined" ? window.innerHeight : 800;
        if (!rect) {
            return {
                left: Math.max(16, vw / 2 - CARD_WIDTH / 2),
                top: Math.max(16, vh / 2 - 110),
            };
        }
        const gap = 18;
        switch (step.place) {
            case "right":
                return {
                    left: Math.min(vw - CARD_WIDTH - 12, rect.right + gap),
                    top: clamp(rect.top, 12, vh - 160),
                };
            case "left":
                return {
                    left: Math.max(12, rect.left - CARD_WIDTH - gap),
                    top: clamp(rect.top, 12, vh - 160),
                };
            case "top":
                return {
                    left: clamp(
                        rect.left + rect.width / 2 - CARD_WIDTH / 2,
                        12,
                        vw - CARD_WIDTH - 12,
                    ),
                    top: Math.max(12, rect.top - 130),
                };
            default:
                return {
                    left: clamp(
                        rect.left + rect.width / 2 - CARD_WIDTH / 2,
                        12,
                        vw - CARD_WIDTH - 12,
                    ),
                    top: Math.min(vh - 150, rect.bottom + gap),
                };
        }
    })();

    const awaiting = Boolean(step.doneWhen && !step.doneWhen());

    return (
        /* The container never eats pointer events: the dim is tiled in four
           strips AROUND the spotlight, so the highlighted target (the OBD
           connector, the Diagnosis tile) stays clickable and the coachmark
           keeps displaying until the awaited action happens. */
        <div className="pointer-events-none fixed inset-0 z-[90]">
            {/* dim layer with a real click-through hole around the spotlight */}
            {rect ? (
                <>
                    <div
                        className="pointer-events-auto absolute inset-x-0 top-0 bg-black/55"
                        style={{ height: Math.max(0, rect.top) }}
                        onClick={onSkip}
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-auto absolute inset-x-0 bg-black/55"
                        style={{ top: Math.max(0, rect.bottom), bottom: 0 }}
                        onClick={onSkip}
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-auto absolute bg-black/55"
                        style={{
                            top: rect.top,
                            height: rect.height,
                            left: 0,
                            width: Math.max(0, rect.left),
                        }}
                        onClick={onSkip}
                        aria-hidden="true"
                    />
                    <div
                        className="pointer-events-auto absolute bg-black/55"
                        style={{
                            top: rect.top,
                            height: rect.height,
                            left: Math.max(0, rect.right),
                            right: 0,
                        }}
                        onClick={onSkip}
                        aria-hidden="true"
                    />
                </>
            ) : (
                <div
                    className="pointer-events-auto absolute inset-0 bg-black/55"
                    onClick={onSkip}
                    aria-hidden="true"
                />
            )}
            {rect ? (
                <div
                    className="pointer-events-none absolute rounded-[1.2cqw] transition-all duration-200"
                    style={{
                        left: rect.left - 6,
                        top: rect.top - 6,
                        width: rect.width + 12,
                        height: rect.height + 12,
                        border: "3px solid #f4a236",
                        background: "rgba(244,162,54,0.08)",
                    }}
                />
            ) : null}

            <AnimatePresence>
                <motion.div
                    key={step.id}
                    ref={cardRef}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    role="dialog"
                    aria-label={step.title}
                    aria-live="polite"
                    className="pointer-events-auto absolute rounded-2xl border border-white/10 bg-white p-5 shadow-2xl dark:bg-[#1b1b20]"
                    style={{
                        width: CARD_WIDTH,
                        left: cardPos.left,
                        top: cardPos.top,
                    }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wide text-[#F47822]">
                            {t(`${th}.progress`, {
                                current: stepIndex + 1,
                                total: steps.length,
                            })}
                        </span>
                        <button
                            type="button"
                            onClick={onSkip}
                            className="rounded-lg px-2 py-1 text-xs font-bold text-[#3A3A3A]/40 transition hover:bg-[#3A3A3A]/5 hover:text-[#3A3A3A] dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            {t(`${th}.skip`)}
                        </button>
                    </div>
                    <h3 className="mt-2 text-base font-black text-[#1A1A1A] dark:text-white">
                        {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#3A3A3A]/70 dark:text-white/60">
                        {step.body}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex gap-1.5" aria-hidden="true">
                            {steps.map((s, i) => (
                                <span
                                    key={s.id}
                                    className={`h-1.5 rounded-full transition-all ${
                                        i === stepIndex
                                            ? "w-5 bg-[#F47822]"
                                            : i < stepIndex
                                              ? "w-1.5 bg-[#F47822]/50"
                                              : "w-1.5 bg-[#3A3A3A]/15 dark:bg-white/15"
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={goNext}
                            disabled={awaiting}
                            className={`rounded-xl px-4 py-2 text-sm font-black text-white transition ${
                                awaiting
                                    ? "cursor-wait bg-[#3A3A3A]/30"
                                    : "bg-[#F47822] hover:bg-[#E96D18]"
                            }`}
                        >
                            {awaiting ? t(`${th}.waiting`) : stepIndex === steps.length - 1 ? t(`${th}.finish`) : t(`${th}.next`)}
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function clamp(v: number, min: number, max: number) {
    return Math.min(max, Math.max(min, v));
}
