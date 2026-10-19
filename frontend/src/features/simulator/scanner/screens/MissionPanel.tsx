import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Circle, Flag, X } from "lucide-react";

import {
    useScannerMissions,
    type MissionObjective,
    type ScannerMission,
} from "@/features/instructor/data/scannerMissionsStore";
import { useScannerSteps } from "../lib/scannerProgress";

/* Floating mission panel for the scanner lab. Shows the published missions
   (optionally filtered to one vehicle) and ticks objectives as the student
   performs them — completion is driven by the same getting-started store
   the checklist uses. */

/** Map a mission objective onto a completed flag. */
export function isObjectiveDone(
    objective: MissionObjective,
    steps: ReadonlySet<string>,
): boolean {
    switch (objective.kind) {
        case "scan":
            return steps.has("scan");
        case "readDtc":
            return steps.has("dtcRead");
        case "clearDtc":
            return steps.has("dtcCleared");
        case "liveData":
            return steps.has("liveData");
        case "specialFunction":
            return steps.has("specialFunction");
        default:
            return false;
    }
}

export function missionComplete(
    mission: ScannerMission,
    steps: ReadonlySet<string>,
): boolean {
    return (
        mission.objectives.length > 0 &&
        mission.objectives.every((o) => isObjectiveDone(o, steps))
    );
}

type Props = {
    /** When set, only missions targeting this vehicle variant are shown. */
    variantId?: string | null;
};

export function MissionPanel({ variantId = null }: Props) {
    const { t } = useTranslation();
    const th = "simulator.scannerLab.missions";
    const steps = useScannerSteps();
    const allMissions = useScannerMissions();
    const [dismissed, setDismissed] = useState(false);
    const [expanded, setExpanded] = useState(true);

    const missions = useMemo(() => {
        const published = allMissions.filter((m) => m.published);
        return variantId
            ? published.filter((m) => m.vehicleVariantId === variantId)
            : published;
    }, [allMissions, variantId]);

    if (missions.length === 0 || dismissed) return null;

    const totalDone = missions.filter((m) => missionComplete(m, steps)).length;

    return (
        <div className="pointer-events-auto absolute bottom-[1.2cqw] start-[1.2cqw] z-30 flex flex-col items-start gap-[0.8cqw]">
            <AnimatePresence>
                {expanded ? (
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.97 }}
                        transition={{ duration: 0.16 }}
                        role="dialog"
                        aria-label={t(`${th}.panelTitle`)}
                        className="max-h-[46cqw] w-[30cqw] min-w-[240px] overflow-y-auto rounded-[1.2cqw] border border-[#c9ced6] bg-white shadow-[0_1.2cqw_3cqw_rgba(20,40,80,.22)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        <div className="sticky top-0 flex items-center justify-between border-b border-[#e3e7ee] bg-white px-[1.4cqw] py-[1cqw]">
                            <span className="font-bold text-[#33383f]" style={{ fontSize: "1.35cqw" }}>
                                {t(`${th}.panelTitle`)}
                            </span>
                            <button
                                type="button"
                                aria-label={t(`${th}.collapse`)}
                                onClick={() => setExpanded(false)}
                                className="rounded p-[0.3cqw] text-[#7d8590] transition hover:bg-[#eef1f5] hover:text-[#33383f]"
                            >
                                <X aria-hidden="true" style={{ width: "1.5cqw", height: "1.5cqw" }} />
                            </button>
                        </div>
                        <ul className="py-[0.4cqw]">
                            {missions.map((mission) => {
                                const done = missionComplete(mission, steps);
                                return (
                                    <li
                                        key={mission.id}
                                        className="border-b border-[#eef1f5] px-[1.4cqw] py-[1cqw] last:border-b-0"
                                    >
                                        <div className="flex items-start gap-[0.8cqw]">
                                            {done ? (
                                                <CheckCircle2
                                                    aria-hidden="true"
                                                    className="mt-[0.1cqw] shrink-0 text-[#1d8f4e]"
                                                    style={{ width: "1.6cqw", height: "1.6cqw" }}
                                                />
                                            ) : (
                                                <Circle
                                                    aria-hidden="true"
                                                    className="mt-[0.1cqw] shrink-0 text-[#c9ced6]"
                                                    style={{ width: "1.6cqw", height: "1.6cqw" }}
                                                />
                                            )}
                                            <div className="min-w-0">
                                                <p
                                                    className={`font-bold ${done ? "text-[#7d8590] line-through" : "text-[#33383f]"}`}
                                                    style={{ fontSize: "1.25cqw" }}
                                                >
                                                    {mission.title}
                                                </p>
                                                {mission.description ? (
                                                    <p className="mt-[0.2cqw] text-[#7d8590]" style={{ fontSize: "1.1cqw" }}>
                                                        {mission.description}
                                                    </p>
                                                ) : null}
                                                <ul className="mt-[0.5cqw] space-y-[0.25cqw]">
                                                    {mission.objectives.map((objective) => {
                                                        const objDone = isObjectiveDone(objective, steps);
                                                        return (
                                                            <li
                                                                key={objective.id}
                                                                className="flex items-center gap-[0.5cqw]"
                                                                aria-label={`${objective.label} — ${objDone ? t(`${th}.done`) : t(`${th}.todo`)}`}
                                                            >
                                                                {objDone ? (
                                                                    <CheckCircle2
                                                                        aria-hidden="true"
                                                                        className="shrink-0 text-[#1d8f4e]"
                                                                        style={{ width: "1.1cqw", height: "1.1cqw", minWidth: "8px", minHeight: "8px" }}
                                                                    />
                                                                ) : (
                                                                    <Circle
                                                                        aria-hidden="true"
                                                                        className="shrink-0 text-[#c9ced6]"
                                                                        style={{ width: "1.1cqw", height: "1.1cqw", minWidth: "8px", minHeight: "8px" }}
                                                                    />
                                                                )}
                                                                <span
                                                                    className={objDone ? "text-[#7d8590] line-through" : "text-[#4a5563]"}
                                                                    style={{ fontSize: "1.05cqw" }}
                                                                >
                                                                    {objective.label}
                                                                </span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className="border-t border-[#e3e7ee] px-[1.4cqw] py-[0.8cqw]">
                            <span className="font-bold text-[#2f7de1]" style={{ fontSize: "1.15cqw" }}>
                                {totalDone}/{missions.length}
                            </span>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => (expanded ? setDismissed(true) : setExpanded(true))}
                aria-expanded={expanded}
                aria-label={`${t(`${th}.pill`)} — ${totalDone}/${missions.length}`}
                className="flex items-center gap-[0.7cqw] rounded-full bg-[#0f1115] px-[1.4cqw] py-[0.8cqw] font-bold text-white shadow-[0_0.5cqw_1.4cqw_rgba(20,40,80,.28)] transition hover:brightness-[1.08]"
                style={{ fontSize: "1.2cqw" }}
            >
                <Flag aria-hidden="true" style={{ width: "1.4cqw", height: "1.4cqw" }} />
                {t(`${th}.pill`)} {totalDone}/{missions.length}
            </button>
        </div>
    );
}
