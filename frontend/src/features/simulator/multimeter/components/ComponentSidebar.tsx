import { useTranslation } from "react-i18next";

import { MM_GROUPS, MM_PROCEDURES, MM_STEP_TOTAL } from "../data/multimeter.data";
import { ComponentArt } from "./ComponentArt";
import { sfx } from "../lib/sfx";

export function ComponentSidebar({
    done,
    activeRef,
    onSelect,
}: {
    done: Record<string, { steps: number; total: number; score: number; status: string }>;
    activeRef: string;
    onSelect: (ref: string) => void;
}) {
    const { t } = useTranslation();
    const cleared = Object.values(done).filter((d) => d.status === "clear").length;
    return (
        <aside className="w-64 shrink-0 overflow-y-auto border-e border-[#3A3A3A]/8 bg-white dark:border-white/8 dark:bg-[#1b1b20]">
            <div className="border-b border-[#3A3A3A]/8 px-4 py-3 dark:border-white/8">
                <p className="text-[11px] font-black uppercase tracking-wide text-[#3A3A3A] dark:text-white">
                    {t("simulator.dmmLab.bench.sidebarTitle")}
                </p>
                <p className="mt-1 text-[11px] text-[#3A3A3A]/50 dark:text-white/50">
                    {t("simulator.dmmLab.bench.clearedOf", { done: cleared, total: MM_PROCEDURES.length })} ·{" "}
                    {t("simulator.dmmLab.bench.totalSteps", { n: MM_STEP_TOTAL })}
                </p>
            </div>
            {MM_GROUPS.map((group) => (
                <div key={group} className="px-2 py-2">
                    <p className="px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#3A3A3A]/35 dark:text-white/35">
                        {group}
                    </p>
                    {MM_PROCEDURES.filter((c) => c.group === group).map((comp) => {
                        const record = done[comp.ref];
                        const active = comp.ref === activeRef;
                        return (
                            <button
                                key={comp.ref}
                                type="button"
                                onClick={() => {
                                    onSelect(comp.ref);
                                    sfx.play("select");
                                }}
                                className={`flex w-full items-center gap-2 rounded-xl border-s-2 px-3 py-2 text-left transition ${
                                    active
                                        ? "border-s-[#1F6AE1] bg-[#1F6AE1]/[.07] dark:bg-[#1F6AE1]/15"
                                        : "border-s-transparent hover:bg-[#3A3A3A]/[.03] dark:hover:bg-white/[0.04]"
                                }`}
                            >
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#1F6AE1]/10">
                                    <ComponentArt sym={comp.sym} className="h-7 w-9" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-1.5">
                                        <span className="shrink-0 font-mono text-[10px] font-black text-[#1F6AE1]" dir="ltr">
                                            {comp.ref}
                                        </span>
                                        <span className="truncate text-xs font-bold text-[#3A3A3A] dark:text-white">{comp.name}</span>
                                    </span>
                                    <span className="block font-mono text-[10px] text-[#3A3A3A]/45 dark:text-white/45" dir="ltr">
                                        {record ? `${record.steps}/${comp.steps.length}` : `0/${comp.steps.length}`}
                                    </span>
                                </span>
                                <span
                                    className={`h-2 w-2 shrink-0 rounded-full ${
                                        record ? (record.status === "clear" ? "bg-emerald-500" : "bg-[#1F6AE1]") : "bg-[#3A3A3A]/15 dark:bg-white/15"
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>
            ))}
        </aside>
    );
}
