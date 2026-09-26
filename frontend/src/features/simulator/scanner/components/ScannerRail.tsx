import {
    Activity,
    Car,
    FileText,
    FileWarning,
    GitBranch,
    GraduationCap,
    History,
    Home,
    Lock,
    Radar,
    Server,
    Settings,
    TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export type RailId =
    | "home"
    | "vehicle"
    | "network"
    | "systems"
    | "dtc"
    | "live"
    | "graph"
    | "tree"
    | "train"
    | "adas"
    | "hist"
    | "rept"
    | "set";

export const RAIL_ALWAYS_OPEN: RailId[] = ["home", "vehicle", "network"];

const RAIL_ITEMS: { id: RailId; icon: typeof Home }[] = [
    { id: "home", icon: Home },
    { id: "vehicle", icon: Car },
    { id: "network", icon: Server },
    { id: "systems", icon: FileText },
    { id: "dtc", icon: FileWarning },
    { id: "live", icon: Activity },
    { id: "graph", icon: TrendingUp },
    { id: "tree", icon: GitBranch },
    { id: "adas", icon: Radar },
    { id: "train", icon: GraduationCap },
    { id: "hist", icon: History },
    { id: "rept", icon: FileText },
    { id: "set", icon: Settings },
];

export function ScannerRail({
    active,
    onNavigate,
    unlocked = true,
    reportLocked = false,
}: {
    active: RailId;
    onNavigate: (id: RailId) => void;
    unlocked?: boolean;
    /** The final report stays locked until every session step is done. */
    reportLocked?: boolean;
}) {
    const { t } = useTranslation();
    return (
        <nav aria-label="Scanner" className="flex w-[68px] shrink-0 flex-col items-center gap-1 self-stretch overflow-y-auto bg-[#14181C] px-2 pb-3 pt-3">
            <div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[9px] border border-[#F47822]/40 bg-[#F47822]/[.08] font-mono text-[8px] font-black tracking-[0.08em] text-[#F47822]">
                SCAN
            </div>
            <div className="mt-2 flex w-full flex-col items-center gap-1">
                {RAIL_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id === active;
                    const locked =
                        (!unlocked && !RAIL_ALWAYS_OPEN.includes(item.id)) ||
                        (item.id === "rept" && reportLocked);
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                if (locked) return;
                                onNavigate(item.id);
                            }}
                            title={
                                locked
                                    ? item.id === "rept" && reportLocked
                                        ? t("simulator.scannerLab.reportLocked.railHint")
                                        : t("simulator.scannerLab.rail.lockedHint")
                                    : t(`simulator.scannerLab.rail.${item.id}`)
                            }
                            aria-disabled={locked}
                            className={`group relative flex h-[46px] w-[52px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg transition ${
                                locked
                                    ? "cursor-not-allowed text-[#5A6068] opacity-60"
                                    : isActive
                                      ? "bg-[#F47822]/10 text-[#F47822]"
                                      : "text-[#8B9198] hover:bg-white/[0.07] hover:text-white"
                            }`}
                        >
                            <span className="relative">
                                <Icon className="h-[21px] w-[21px]" strokeWidth={1.6} />
                                {locked && (
                                    <Lock className="absolute -right-1.5 -top-1 h-3 w-3 text-[#F47822]" />
                                )}
                            </span>
                            <span className="text-[7.5px] font-semibold uppercase tracking-[0.06em]">
                                {t(`simulator.scannerLab.rail.${item.id}`)}
                            </span>
                            {isActive && !locked && (
                                <span className="absolute start-[-11px] top-[11px] h-6 w-[3px] rounded-e bg-[#F47822]" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
