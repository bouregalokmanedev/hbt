import { useState } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { useSchematicWorkspace } from "../hooks/useSchematicWorkspace";
import { TopBar, SubBar } from "./Bars";
import { Sidebar } from "./Sidebar";
import { Canvas } from "./Canvas";
import { Inspector } from "./Inspector";
import { Overlays } from "./Overlays";

/**
 * Schematic workspace shell — TopBar + SubBar + (Sidebar | Canvas | Inspector) + Overlays.
 * All domain state is engine-driven; layout a/b/c only moves the inspector.
 */
export function SchematicView({
    vehicleId = null,
    sessionId = null,
    focus = null,
}: {
    vehicleId?: string | null;
    sessionId?: string | null;
    focus?: string | null;
} = {}) {
    const { t: tRoot } = useTranslation();
    const t = (key: string, opts?: Record<string, unknown>) => tRoot(`schematic.${key}`, { defaultValue: key, ...opts } as unknown as Record<string, unknown>) as string;
    const tc = (key: string, opts?: Record<string, unknown>) => tRoot(`content.${key}`, { defaultValue: "", ...opts } as unknown as Record<string, unknown>) as string;

    const { engine, state } = useSchematicWorkspace(vehicleId, sessionId, focus);
    const [layout, setLayout] = useState<"a" | "b" | "c">("a");

    if (!engine || !state) {
        return (
            <div className="grid min-h-[480px] place-items-center rounded-[20px] border border-[#3A3A3A]/10 bg-white p-8 dark:border-white/10 dark:bg-[#1b1b20]">
                <div className="flex flex-col items-center gap-3">
                    <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#B85708]/20 border-t-[#B85708]" />
                    <span className="text-sm font-bold text-[#3A3A3A]/60 dark:text-white/60">{tRoot("simulator.dmmLab.loading", { defaultValue: "Loading schematic…" }) as string}</span>
                </div>
            </div>
        );
    }

    const inspector = <Inspector engine={engine} state={state} t={t as any} tc={tc as any} />;

    return (
        <div className="flex min-h-[620px] flex-col overflow-hidden rounded-[20px] border border-[#3A3A3A]/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#1b1b20]">
            <TopBar engine={engine} state={state} t={t as any} />
            <SubBar engine={engine} state={state} t={t as any} tc={tc as any} layout={layout} setLayout={setLayout} />

            <div className="relative flex min-h-[520px] flex-1 bg-[#F8F7F6] dark:bg-[#101013]">
                {/* Sidebar */}
                <div className="hidden lg:flex">
                    <Sidebar engine={engine} state={state} t={t as any} tc={tc as any} />
                </div>
                {state.drawer ? (
                    <>
                        <div onClick={() => engine.toggleDrawer()} className="absolute inset-0 z-40 bg-[#0f1115]/50 backdrop-blur-sm lg:hidden" />
                        <div className="absolute inset-y-0 start-0 z-50 w-[300px] shadow-[0_16px_40px_rgba(0,0,0,0.2)] lg:hidden">
                            <Sidebar engine={engine} state={state} t={t as any} tc={tc as any} />
                        </div>
                    </>
                ) : null}

                {/* Canvas */}
                <div className="flex min-w-0 flex-1 flex-col">
                    <Canvas engine={engine} state={state} t={t as any} tc={tc as any} />
                    {/* Inline inspector for layout c (bottom sheet) — only on desktop where it replaces the side inspector */}
                    {layout === "c" ? (
                        <div className="hidden max-h-[320px] overflow-hidden border-t border-[#3A3A3A]/10 bg-white dark:border-white/10 dark:bg-[#1b1b20] md:block">
                            <div className="h-full overflow-auto">{inspector}</div>
                        </div>
                    ) : null}
                </div>

                {/* Inspector */}
                {layout === "a" ? <div className="hidden shrink-0 md:flex">{inspector}</div> : null}
                {layout === "b" ? (
                    <div className="absolute bottom-4 end-4 top-4 z-20 hidden w-[360px] overflow-hidden rounded-2xl border border-[#3A3A3A]/10 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.16)] dark:border-white/10 dark:bg-[#1b1b20] md:flex md:flex-col">
                        <div className="flex-1 overflow-auto">{inspector}</div>
                    </div>
                ) : null}

                <Overlays engine={engine} state={state} t={t as any} tc={tc as any} />
            </div>
        </div>
    );
}
