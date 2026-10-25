import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Move3d, Orbit, Rotate3d, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { useTranslation } from "react-i18next";

import { MODE_BY_ID, type DialModeId } from "./modes";
import { Scene, type InteractionMode } from "./Scene";

function supportsWebGL() {
    try {
        const canvas = document.createElement("canvas");
        return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
        return false;
    }
}

const MODE_BUTTONS: { id: InteractionMode; icon: typeof Orbit; labelKey: "orbit" | "move" | "rotate" }[] = [
    { id: "orbit", icon: Orbit, labelKey: "orbit" },
    { id: "move", icon: Move3d, labelKey: "move" },
    { id: "rotate", icon: Rotate3d, labelKey: "rotate" },
];

function FallbackMeter() {
    const { t } = useTranslation();
    return (
        <div className="flex h-full items-center justify-center px-6 py-10">
            <div className="flex max-w-sm flex-col items-center text-center">
                <div className="relative h-[300px] w-[170px] rotate-[-7deg] rounded-[30px] bg-gradient-to-br from-[#f47822] to-[#c95b12] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
                    <div className="absolute inset-3 rounded-[23px] bg-[#1d2023] px-3 py-4 shadow-inner">
                        <div className="rounded-lg bg-[#dce6d4] px-3 py-3">
                            <div className="flex items-center justify-between text-[7px] font-bold uppercase tracking-widest text-[#1d2a1f]/70">
                                <span>MANUAL</span>
                                <span>V DC</span>
                            </div>
                            <p className="mt-1 font-mono text-[27px] font-bold leading-none text-[#1d2a1f]">12.50</p>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-1.5">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <span key={i} className="h-4 rounded-[4px] bg-[#2b3035]" />
                            ))}
                        </div>
                        <div className="mx-auto mt-5 grid h-24 w-24 place-items-center rounded-full bg-[#15181a] shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]">
                            <span className="h-12 w-3 rounded-full bg-[#0a0c0d]" />
                        </div>
                        <div className="mt-5 flex justify-center gap-3">
                            {[0, 1, 2, 3].map((i) => (
                                <span key={i} className={`h-3 w-3 rounded-full ${i === 2 ? "bg-[#b3261f]" : "bg-[#111315]"}`} />
                            ))}
                        </div>
                    </div>
                </div>
                <p className="mt-8 text-sm font-bold text-white">{t("simulator.multimeterTool.fallbackTitle")}</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-white/45">{t("simulator.multimeterTool.fallbackDesc")}</p>
            </div>
        </div>
    );
}

export function MultimeterTool() {
    const { t } = useTranslation();
    const [supported, setSupported] = useState<boolean | null>(null);
    const [interaction, setInteraction] = useState<InteractionMode>("orbit");
    const [mode, setMode] = useState<DialModeId>("v20");
    const [hold, setHold] = useState(false);
    const [backlight, setBacklight] = useState(true);
    const [resetSignal, setResetSignal] = useState(0);

    useEffect(() => {
        setSupported(supportsWebGL());
    }, []);

    const selected = MODE_BY_ID[mode];
    const hint =
        interaction === "orbit"
            ? t("simulator.multimeterTool.hintOrbit")
            : interaction === "move"
              ? t("simulator.multimeterTool.hintMove")
              : t("simulator.multimeterTool.hintRotate");

    return (
        <section
            data-testid="multimeter-tool"
            data-mode={mode}
            data-interaction={interaction}
            className="overflow-hidden rounded-[24px] border border-[#3A3A3A]/10 bg-[#0a0c0f] shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:border-white/10"
        >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f47822] text-[10px] font-black tracking-tight text-[#1b1a12]">
                        RMS
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#f47822]">
                            {t("simulator.multimeterTool.eyebrow")}
                        </p>
                        <h2 className="truncate text-sm font-black text-white sm:text-base">
                            {t("simulator.multimeterTool.title")}
                            <span className="ml-2 hidden font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 sm:inline">
                                {t("simulator.multimeterTool.subtitle")}
                            </span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex rounded-xl bg-white/[0.06] p-1">
                        {MODE_BUTTONS.map(({ id, icon: Icon, labelKey }) => (
                            <button
                                key={id}
                                type="button"
                                data-testid={`mm-mode-${id}`}
                                aria-pressed={interaction === id}
                                onClick={() => setInteraction(id)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                                    interaction === id
                                        ? "bg-[#f47822] text-[#1b120a] shadow-sm"
                                        : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{t(`simulator.multimeterTool.${labelKey}`)}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        data-testid="mm-reset"
                        onClick={() => setResetSignal((signal) => signal + 1)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-2.5 py-2 text-[11px] font-bold text-white/60 transition hover:border-white/20 hover:text-white"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">{t("simulator.multimeterTool.reset")}</span>
                    </button>
                </div>
            </header>

            <div className="relative h-[540px] sm:h-[620px] lg:h-[680px]">
                {supported === null ? (
                    <div className="grid h-full place-items-center">
                        <div className="flex items-center gap-3 text-xs font-bold text-white/45">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#f47822]/30 border-t-[#f47822]" />
                            {t("simulator.multimeterTool.loading")}
                        </div>
                    </div>
                ) : supported ? (
                    <Canvas
                        shadows
                        dpr={[1, 2]}
                        camera={{ position: [1.0, 0.82, 2.55], fov: 30, near: 0.1, far: 24 }}
                        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
                        onCreated={({ gl }) => {
                            gl.toneMapping = THREE.ACESFilmicToneMapping;
                            gl.toneMappingExposure = 1.08;
                        }}
                    >
                        <Scene
                            interaction={interaction}
                            mode={mode}
                            hold={hold}
                            backlight={backlight}
                            resetSignal={resetSignal}
                            onMode={setMode}
                            onHold={() => setHold((value) => !value)}
                            onBacklight={() => setBacklight((value) => !value)}
                        />
                    </Canvas>
                ) : (
                    <FallbackMeter />
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 bg-gradient-to-t from-[#dde3e7]/95 via-[#e2e7ea]/55 to-transparent px-4 pb-4 pt-14 sm:px-5">
                    <p className="max-w-[46ch] text-[11px] font-semibold leading-5 text-[#26333b]/65">{hint}</p>
                    <div className="flex items-center gap-2">
                        {hold ? (
                            <span className="rounded-full border border-[#f47822]/40 bg-[#f47822]/15 px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#a84f0c]">
                                {t("simulator.multimeterTool.hold")}
                            </span>
                        ) : null}
                        <span className="rounded-full border border-[#3A3A3A]/10 bg-white/70 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#26333b]/75 backdrop-blur">
                            {t("simulator.multimeterTool.mode")} · {selected.label || "OFF"}
                            {selected.value ? ` · ${selected.value} ${selected.unit}` : ""}
                        </span>
                    </div>
                </div>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-[10px] font-semibold sm:px-5">
                <span className="font-mono uppercase tracking-[0.18em] text-white/35">HBT-88V · TRUE RMS</span>
                <span className="flex items-center gap-4 text-white/45">
                    <span>{t("simulator.multimeterTool.dial")}</span>
                    <span>{t("simulator.multimeterTool.probes")}</span>
                    <span className="hidden sm:inline">{t("simulator.multimeterTool.simulated")}</span>
                </span>
            </footer>
        </section>
    );
}
