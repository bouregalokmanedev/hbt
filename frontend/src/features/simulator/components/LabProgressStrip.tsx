import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { simulatorApi } from "@/features/simulator/api/simulator.api";
import type { ToolId } from "@/features/simulator/scanner/data/scanner.data";

/**
 * Session progress bar + session counter shared by the four non-scanner
 * benches (the scanner keeps its own step-based strip). Progress comes from
 * the lab's engine; the count is how many sessions this tool has recorded.
 */
export function LabProgressStrip({ tool, progress }: { tool: ToolId; progress: number }) {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        simulatorApi
            .results()
            .then((results) => {
                if (!cancelled) setSessions(results.filter((r) => r.tool === tool).length);
            })
            .catch(() => {
                if (!cancelled) setSessions(null);
            });
        return () => {
            cancelled = true;
        };
    }, [tool]);

    const pct = Math.max(0, Math.min(100, Math.round(progress)));

    return (
        <div
            data-testid={`lab-progress-${tool}`}
            className="border-b border-[#3A3A3A]/8 bg-[#FCFCFC] px-4 py-2.5 dark:border-white/8 dark:bg-white/[0.02]"
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#3A3A3A]/45 dark:text-white/45">
                    {t("simulator.lab.progress.title")}
                </span>
                <span
                    dir="ltr"
                    className="rounded-full bg-[#3A3A3A]/[.06] px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/55 dark:bg-white/[0.06] dark:text-white/55"
                >
                    {sessions === null
                        ? t("simulator.lab.progress.sessionsLoading")
                        : t("simulator.lab.progress.sessions", { n: sessions })}
                </span>
                <span className="text-[11px] font-semibold text-[#3A3A3A]/55 dark:text-white/55">
                    {t(`simulator.lab.progress.caption.${tool}`)}
                </span>
                <span className="ms-auto flex items-center gap-2">
                    <span className="font-mono text-[11px] font-black text-[#3A3A3A] dark:text-white">{pct}%</span>
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#3A3A3A]/10 dark:bg-white/10">
                        <span
                            className="block h-full rounded-full bg-[#F47822] transition-all duration-500"
                            style={{ width: `${pct}%` }}
                        />
                    </span>
                </span>
            </div>
        </div>
    );
}
