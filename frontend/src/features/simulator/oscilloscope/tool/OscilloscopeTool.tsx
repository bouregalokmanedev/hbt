import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Move3d, Orbit, Rotate3d, RotateCcw } from "lucide-react";
import * as THREE from "three";
import { useTranslation } from "react-i18next";

import type { ScopeEngine, ScopeEngineState } from "../engine/scope.engine";
import { Scene, type InteractionMode } from "./Scene";

const TIMEDIV_STEPS = [0.2, 0.5, 1, 2, 5, 6, 10, 20, 50, 100, 110, 120, 200, 400, 500];
const VDIV_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];

function supportsWebGL() {
    try {
        const canvas = document.createElement("canvas");
        return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
        return false;
    }
}

function nearestIndex(steps: number[], value: number) {
    let best = 0;
    let distance = Infinity;
    for (let i = 0; i < steps.length; i += 1) {
        const next = Math.abs(steps[i] - value);
        if (next < distance) {
            best = i;
            distance = next;
        }
    }
    return best;
}

function stepInList(steps: number[], value: number, direction: -1 | 1) {
    const index = nearestIndex(steps, value);
    return steps[THREE.MathUtils.clamp(index + direction, 0, steps.length - 1)] ?? value;
}

const MODE_BUTTONS: { id: InteractionMode; icon: typeof Orbit; labelKey: "orbit" | "move" | "rotate" }[] = [
    { id: "orbit", icon: Orbit, labelKey: "orbit" },
    { id: "move", icon: Move3d, labelKey: "move" },
    { id: "rotate", icon: Rotate3d, labelKey: "rotate" },
];

function FallbackScope() {
    const { t } = useTranslation();
    return (
        <div className="flex h-full items-center justify-center px-6 py-10">
            <div className="flex max-w-md flex-col items-center text-center">
                <div className="relative h-[360px] w-[230px] rotate-[-5deg] rounded-[26px] bg-gradient-to-br from-[#f47822] to-[#c95b12] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
                    <div className="flex h-full flex-col rounded-[18px] bg-[#111315] p-3 shadow-inner">
                        <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-[0.2em] text-white/60">
                            <span>HBTronics</span>
                            <span>HBT-410</span>
                        </div>
                        <div className="mt-2 rounded-lg border border-white/10 bg-[#0a0d10] p-1.5">
                            <div className="relative h-28 overflow-hidden rounded bg-[#b7c8ad]">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(27,49,29,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(27,49,29,0.2)_1px,transparent_1px)] bg-[size:14px_14px]" />
                                <svg viewBox="0 0 160 64" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                                    <path d="M0 42 L14 42 L20 22 L26 50 L34 38 L48 38 L54 14 L60 53 L68 37 L84 37 L90 24 L96 48 L104 38 L120 38 L126 15 L132 51 L140 37 L160 37" fill="none" stroke="#bd3a2c" strokeWidth="2" />
                                </svg>
                                <div className="absolute left-1.5 top-1 font-mono text-[7px] font-black text-[#162416]">10 mV</div>
                                <div className="absolute bottom-1 right-1.5 font-mono text-[7px] font-black text-[#162416]">200 ms</div>
                            </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-1.5">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <span key={i} className="h-4 rounded-[3px] bg-[#252a2e]" />
                            ))}
                        </div>
                        <div className="mt-auto flex items-center justify-between">
                            <span className="h-8 w-8 rounded-full border border-white/15 bg-[#0b0d0f]" />
                            <span className="h-8 w-8 rounded-full border border-[#f47822]/50 bg-[#f47822]/20" />
                        </div>
                    </div>
                </div>
                <p className="mt-8 text-sm font-bold text-white">{t("simulator.oscilloscopeTool.fallbackTitle")}</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-white/45">{t("simulator.oscilloscopeTool.fallbackDesc")}</p>
            </div>
        </div>
    );
}

export function OscilloscopeTool({ engine, state }: { engine: ScopeEngine; state: ScopeEngineState }) {
    const { t } = useTranslation();
    const [supported, setSupported] = useState<boolean | null>(null);
    const [interaction, setInteraction] = useState<InteractionMode>("orbit");
    const [powered, setPowered] = useState(true);
    const [activeChannel, setActiveChannel] = useState<"A" | "B">("A");
    const [resetSignal, setResetSignal] = useState(0);
    const autoConnected = useRef<string | null>(null);
    const comp = engine.comp();

    useEffect(() => {
        setSupported(supportsWebGL());
    }, []);

    useEffect(() => {
        if (!comp.chB) setActiveChannel("A");
    }, [comp.chB, state.compId]);

    useEffect(() => {
        if (autoConnected.current === state.compId) return;
        autoConnected.current = state.compId;
        const current = engine.comp();
        if (!state.probes.A) engine.placeProbe("A", current.correct.A);
        if (!state.probes.GND) engine.placeProbe("GND", current.correct.GND);
        if (current.correct.B && !state.probes.B) engine.placeProbe("B", current.correct.B);
        if (current.correct.CLAMP && !state.probes.CLAMP) engine.placeProbe("CLAMP", current.correct.CLAMP);
    }, [engine, state.compId, state.probes.A, state.probes.B, state.probes.CLAMP, state.probes.GND]);

    const hint =
        interaction === "orbit"
            ? t("simulator.oscilloscopeTool.hintOrbit")
            : interaction === "move"
              ? t("simulator.oscilloscopeTool.hintMove")
              : t("simulator.oscilloscopeTool.hintRotate");

    const formatTimebase = state.timeDiv < 1 ? `${state.timeDiv * 1000} µs/div` : `${state.timeDiv} ms/div`;
    const activeDiv = activeChannel === "A" ? state.vdivA : state.vdivB;
    const activeUnit = activeChannel === "A" ? comp.chA.unit : (comp.chB?.unit ?? comp.chA.unit);
    const status = powered ? (state.running ? t("simulator.oscilloscopeTool.live") : t("simulator.oscilloscopeTool.hold")) : t("simulator.oscilloscopeTool.off");

    return (
        <section
            data-testid="oscilloscope-tool"
            data-interaction={interaction}
            data-channel={activeChannel}
            data-powered={powered}
            data-running={state.running}
            className="overflow-hidden rounded-[24px] border border-[#3A3A3A]/10 bg-[#0a0c0f] shadow-[0_24px_70px_rgba(15,23,42,0.18)] dark:border-white/10"
        >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f47822] text-[10px] font-black tracking-tight text-[#1b1a12]">
                        SCOPE
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#f47822]">
                            {t("simulator.oscilloscopeTool.eyebrow")}
                        </p>
                        <h2 className="truncate text-sm font-black text-white sm:text-base">
                            {t("simulator.oscilloscopeTool.title")}
                            <span className="ml-2 hidden font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35 sm:inline">
                                {t("simulator.oscilloscopeTool.subtitle")}
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
                                data-testid={`scope-mode-${id}`}
                                aria-pressed={interaction === id}
                                onClick={() => setInteraction(id)}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                                    interaction === id
                                        ? "bg-[#f47822] text-[#1b120a] shadow-sm"
                                        : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{t(`simulator.oscilloscopeTool.${labelKey}`)}</span>
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        data-testid="scope-reset"
                        onClick={() => setResetSignal((signal) => signal + 1)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-2.5 py-2 text-[11px] font-bold text-white/60 transition hover:border-white/20 hover:text-white"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">{t("simulator.oscilloscopeTool.reset")}</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-white/10 bg-white/[0.03] px-4 py-2 sm:px-5">
                <p className="max-w-[46ch] text-[11px] font-semibold leading-4 text-white/55">{hint}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white/65">
                        {comp.code} · {activeChannel === "A" ? "CH1" : "CH2"}
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white/65">
                        {formatTimebase} · {activeDiv} {activeUnit}/div
                    </span>
                    <span
                        className={`rounded-full border px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.16em] ${
                            powered
                                ? state.running
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                                    : "border-amber-400/35 bg-amber-400/10 text-amber-200"
                                : "border-white/10 bg-white/5 text-white/40"
                        }`}
                    >
                        {status}
                    </span>
                </div>
            </div>

            <div className="relative h-[560px] sm:h-[640px] lg:h-[700px]">
                {supported === null ? (
                    <div className="grid h-full place-items-center">
                        <div className="flex items-center gap-3 text-xs font-bold text-white/45">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#f47822]/30 border-t-[#f47822]" />
                            {t("simulator.oscilloscopeTool.loading")}
                        </div>
                    </div>
                ) : supported ? (
                    <Canvas
                        shadows
                        dpr={[1, 2]}
                        camera={{ position: [0.68, 0.69, 2.28], fov: 30, near: 0.1, far: 24 }}
                        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
                        onCreated={({ gl }) => {
                            gl.toneMapping = THREE.ACESFilmicToneMapping;
                            gl.toneMappingExposure = 1.06;
                        }}
                    >
                        <Scene
                            engine={engine}
                            state={state}
                            interaction={interaction}
                            powered={powered}
                            activeChannel={activeChannel}
                            resetSignal={resetSignal}
                            onChannel={setActiveChannel}
                            onTriggerEdge={() => engine.setTrigEdge(state.trigEdge === "rising" ? "falling" : "rising")}
                            onRun={() => engine.toggleRun()}
                            onAuto={() => engine.autoSet()}
                            onPersist={() => engine.togglePersist()}
                            onPower={() => setPowered((value) => !value)}
                            onTimeStep={(direction) => engine.setTimeDiv(stepInList(TIMEDIV_STEPS, state.timeDiv, direction))}
                            onVdivStep={(channel, direction) =>
                                engine.setVdiv(
                                    channel,
                                    stepInList(VDIV_STEPS, channel === "A" ? state.vdivA : state.vdivB, direction),
                                )
                            }
                            onOffsetStep={(channel, direction) => {
                                const current = channel === "A" ? state.offA : state.offB;
                                engine.setOffset(channel, THREE.MathUtils.clamp(current + direction * 0.2, -5, 5));
                            }}
                            onTriggerStep={(direction) =>
                                engine.setTrigLevel(
                                    THREE.MathUtils.clamp(
                                        state.trigLevel + direction * comp.trig.step,
                                        comp.trig.min,
                                        comp.trig.max,
                                    ),
                                )
                            }
                        />
                    </Canvas>
                ) : (
                    <FallbackScope />
                )}

            </div>

            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-[10px] font-semibold sm:px-5">
                <span className="font-mono uppercase tracking-[0.18em] text-white/35">HBT-410 · 100 MHz · 2 CH</span>
                <span className="flex items-center gap-4 text-white/45">
                    <span>{t("simulator.oscilloscopeTool.controls")}</span>
                    <span>{t("simulator.oscilloscopeTool.probes")}</span>
                    <span className="hidden sm:inline">{t("simulator.oscilloscopeTool.simulated")}</span>
                </span>
            </footer>
        </section>
    );
}
