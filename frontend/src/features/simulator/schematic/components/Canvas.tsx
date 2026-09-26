import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SchematicWorkspaceEngine, WorkspaceState } from "../engine/workspace.engine";
import { SCH_IMG_W, SCH_IMG_H, SCH_DIAGRAM } from "../data/schematic.data";
import { tracePolyline, polylineD, pointAt } from "../lib";
import { CircuitGraph } from "./CircuitGraph";
import { Minus, Plus, Maximize2, Play, Pause, MapPinned, Crosshair } from "lucide-react";

const TYPE_TINT: Record<string, { bd: string; bg: string }> = {
    ground: { bd: "rgba(16,185,129,.45)", bg: "rgba(16,185,129,.08)" },
    fuse: { bd: "rgba(245,158,11,.4)", bg: "rgba(245,158,11,.07)" },
    relay: { bd: "rgba(245,158,11,.4)", bg: "rgba(245,158,11,.07)" },
    network: { bd: "rgba(59,130,246,.35)", bg: "rgba(59,130,246,.06)" },
};

/**
 * Schematic canvas — raster diagram (4016×1479) on a pan/zoom stage with hotspot layer,
 * guided-trace overlay, minimap, HUD and zoom dock. All selection/trace/layer state
 * is engine-driven; pan/zoom is view-local. Circuit view delegates to CircuitGraph.
 */
export function Canvas({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
    const elRef = useRef<HTMLDivElement | null>(null);
    const [z, setZ] = useState(0.3);
    const [tx, setTx] = useState(40);
    const [ty, setTy] = useState(40);
    const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
    const [vw, setVw] = useState(1000);
    const [vh, setVh] = useState(600);
    const [traceT, setTraceT] = useState(0);

    const isCircuit = state.view === "circuit";
    const trace = engine.trace();
    const isTrace = state.mode === "trace";
    const isExam = state.mode === "exam";
    const L = state.layers;

    const fit = useCallback(() => {
        const el = elRef.current;
        if (!el) return;
        const w = el.clientWidth, h = el.clientHeight;
        const cw = isCircuit ? 1760 : SCH_IMG_W, ch = isCircuit ? 1560 : SCH_IMG_H;
        const nz = Math.min((w - 40) / cw, (h - 60) / ch);
        setZ(nz);
        setTx((w - cw * nz) / 2);
        setTy((h - 60 - ch * nz) / 2 + 10);
    }, [isCircuit]);

    useEffect(() => {
        const el = elRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            setVw(el.clientWidth);
            setVh(el.clientHeight);
        });
        ro.observe(el);
        setVw(el.clientWidth);
        setVh(el.clientHeight);
        return () => ro.disconnect();
    }, []);
    useEffect(() => {
        const id = setTimeout(fit, 30);
        return () => clearTimeout(id);
    }, [fit, isCircuit]);

    useEffect(() => {
        setTraceT(0);
    }, [state.trace, state.mode]);
    useEffect(() => {
        if (!isTrace || !state.tracePlaying) return;
        const id = setInterval(() => setTraceT((v) => (v + 0.012) % 1), 33);
        return () => clearInterval(id);
    }, [isTrace, state.tracePlaying]);

    const onWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const el = elRef.current!;
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        const nz = Math.max(0.08, Math.min(3, z * f));
        setTx(mx - (mx - tx) * (nz / z));
        setTy(my - (my - ty) * (nz / z));
        setZ(nz);
    };
    const onDown = (e: React.PointerEvent) => {
        drag.current = { x: e.clientX, y: e.clientY, tx, ty };
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: React.PointerEvent) => {
        if (!drag.current) return;
        setTx(drag.current.tx + (e.clientX - drag.current.x));
        setTy(drag.current.ty + (e.clientY - drag.current.y));
    };
    const onUp = () => (drag.current = null);
    const zoomTo = (nz: number) => setZ(Math.max(0.08, Math.min(3, nz)));

    const components = engine.components();
    const selWires = state.sel ? engine.selectedWires() : [];
    const connected = useMemo(() => {
        const set = new Set<string>();
        selWires.forEach(({ wire }) => set.add(wire.target));
        if (state.sel) set.add(state.sel);
        if (state.sel && state.sel !== "E1") set.add("E1");
        return set;
    }, [selWires, state.sel]);

    const tracePts = isTrace ? tracePolyline(trace) : [];
    const traceKeys = new Set(isTrace ? trace.steps.map((s) => s.cmp) : []);
    const stepI = isTrace ? Math.min(trace.steps.length - 1, Math.floor(traceT * trace.steps.length)) : 0;
    const walkPt = isTrace && tracePts.length ? pointAt(tracePts, traceT) : null;

    const hud = isTrace
        ? tc("schematic.hud.trace", { n: stepI + 1, total: trace.steps.length, desc: tc(trace.steps[stepI]?.descId ?? trace.labelId) })
        : isExam
          ? state.examSubmitted
              ? tc("schematic.hud.examDone")
              : tc("schematic.hud.examProgress", { n: state.examIdx + 1, total: 6 })
          : state.hover
            ? tc("schematic.hud.hover", { code: engine.component(state.hover)!.code, name: engine.component(state.hover)!.name })
            : null;

    return (
        <div className="relative min-w-0 flex-1 overflow-hidden bg-[#F8F7F6] dark:bg-[#0f0f12]">
            <div
                ref={elRef}
                dir="ltr"
                className="ltr-island absolute inset-0 touch-none overflow-hidden"
                style={{ cursor: drag.current ? "grabbing" : "grab" }}
                onWheel={onWheel}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerLeave={onUp}
            >
                {isCircuit ? (
                    <CircuitGraph engine={engine} state={state} tx={tx} ty={ty} z={z} />
                ) : (
                    <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${tx}px,${ty}px) scale(${z})` }}>
                        <div className="relative bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)]" style={{ width: SCH_IMG_W, height: SCH_IMG_H }}>
                            <img src={SCH_DIAGRAM} alt={`${trace.labelId}`} width={SCH_IMG_W} height={SCH_IMG_H} draggable={false} className="pointer-events-none block select-none" />

                            {isTrace && tracePts.length ? (
                                <svg viewBox={`0 0 ${SCH_IMG_W} ${SCH_IMG_H}`} className="pointer-events-none absolute inset-0 overflow-visible" style={{ width: SCH_IMG_W, height: SCH_IMG_H }}>
                                    <path d={polylineD(tracePts)} fill="none" stroke="rgba(237,125,28,.18)" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
                                    <path d={polylineD(tracePts)} fill="none" stroke="#ED7D1C" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="22 16" style={{ animation: "sch-dash 1.1s linear infinite" }} />
                                    {trace.steps.map((st, i) => {
                                        const c = engine.component(st.cmp)!;
                                        const cx = c.x, cy = st.cmp === "E1" ? 1135 : c.y;
                                        return (
                                            <g key={i}>
                                                <circle cx={cx} cy={cy} r={22} fill="#ED7D1C" opacity={0.14} style={{ animation: `sch-pulse 1.8s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }} />
                                                <circle cx={cx} cy={cy} r={i === stepI ? 15 : 10} fill={i === stepI ? "#ED7D1C" : "#B85708"} opacity={i === stepI ? 1 : 0.85} />
                                                <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9" fontWeight="900" fill="white">{i + 1}</text>
                                            </g>
                                        );
                                    })}
                                    {walkPt ? (
                                        <>
                                            <circle cx={walkPt.x} cy={walkPt.y} r={22} fill="#ED7D1C" opacity={0.22} />
                                            <circle cx={walkPt.x} cy={walkPt.y} r={11} fill="#B85708" stroke="white" strokeWidth={2} />
                                        </>
                                    ) : null}
                                </svg>
                            ) : null}

                            {components.map((c) => {
                                const isSel = state.sel === c.key;
                                const isHov = state.hover === c.key;
                                const isCon = connected.has(c.key);
                                const inTrace = traceKeys.has(c.key);
                                const dim = (state.sel && !isCon && !isSel) || (isTrace && !inTrace);
                                const tint = TYPE_TINT[c.type];
                                let bd = "2px solid transparent", bg = "transparent";
                                if (!state.sel && !isTrace && tint && ((c.type === "ground" && L.grounds) || ((c.type === "fuse" || c.type === "relay") && L.power) || (c.type === "network" && (L.canh || L.canl)))) {
                                    bd = `2px solid ${tint.bd}`; bg = tint.bg;
                                }
                                if (isCon && !isSel) { bd = "2px solid rgba(237,125,28,.4)"; bg = "rgba(237,125,28,.07)"; }
                                if (inTrace) { bd = "2px solid #ED7D1C"; bg = "rgba(237,125,28,.12)"; }
                                if (isHov) { bd = "2px solid #ED7D1C"; bg = "rgba(237,125,28,.12)"; }
                                if (isSel) { bd = "3px solid #B85708"; bg = "rgba(237,125,28,.14)"; }
                                const showLabel = L.labels && !isExam && (isSel || isHov || isCon || inTrace);
                                return (
                                    <button
                                        key={c.key}
                                        type="button"
                                        onClick={() => engine.select(c.key)}
                                        onMouseEnter={() => engine.setHover(c.key)}
                                        onMouseLeave={() => engine.setHover(null)}
                                        aria-label={`${c.code} ${c.name}`}
                                        aria-current={isSel ? "true" : undefined}
                                        className="absolute rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B85708]/40"
                                        style={{ left: c.x - c.w / 2, top: c.y - c.h / 2, width: c.w, height: c.h, border: bd, background: bg, opacity: dim ? 0.22 : 1, transition: "opacity .15s,background .15s,transform .12s", transform: isHov || isSel ? "scale(1.02)" : "scale(1)" }}
                                    >
                                        {showLabel ? (
                                            <span className="absolute left-1/2 top-[-28px] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1a1a1a] px-2.5 py-1 font-mono text-xs font-black text-white shadow-lg">{c.code}</span>
                                        ) : null}
                                        {isExam ? (
                                            <span className="absolute left-1/2 top-[-28px] flex h-6 min-w-6 -translate-x-1/2 items-center justify-center rounded-full bg-[#1a1a1a] px-2 font-mono text-xs font-black text-white shadow-lg">?</span>
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* HUD — glassmorphic pill */}
                {hud ? (
                    <div className="pointer-events-none absolute left-1/2 top-4 z-10 flex max-w-[92%] -translate-x-1/2 items-center gap-3 rounded-full border border-white/20 bg-white/90 px-4 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#1b1b20]/90">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#B85708] text-white shadow-sm">
                            {isTrace ? <Crosshair className="h-3.5 w-3.5" /> : isExam ? <FileTextIcon /> : <Crosshair className="h-3.5 w-3.5" />}
                        </span>
                        <span className="max-w-[420px] truncate text-sm font-semibold leading-none text-[#3A3A3A] dark:text-white">{hud}</span>
                        {isTrace ? (
                            <button type="button" onClick={() => (state.tracePlaying ? engine.tracePause() : engine.tracePlay())} className="pointer-events-auto ms-1 inline-flex h-7 items-center gap-1 rounded-full bg-[#B85708] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#9A4A06]">
                                {state.tracePlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                {state.tracePlaying ? t("trace.pause") : t("trace.play")}
                            </button>
                        ) : null}
                    </div>
                ) : null}

                {/* Minimap — card */}
                {!isCircuit ? (
                    <div className="absolute bottom-4 left-4 z-[6] w-[260px] overflow-hidden rounded-2xl border border-[#3A3A3A]/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#1b1b20]">
                        <div className="relative h-[96px] bg-[#F8F7F6] dark:bg-[#101013]">
                            <img src={SCH_DIAGRAM} alt="" className="block h-full w-full object-cover opacity-60" />
                            <div
                                className="absolute rounded-lg border-2 bg-[#B85708]/10 shadow-[0_0_0_1px_rgba(184,87,8,0.2)]"
                                style={{
                                    borderColor: "#B85708",
                                    left: Math.max(2, (-tx / z) * (260 / SCH_IMG_W)),
                                    top: Math.max(2, (-ty / z) * (96 / SCH_IMG_H)),
                                    width: Math.max(12, Math.min(256, (vw / z) * (260 / SCH_IMG_W))),
                                    height: Math.max(12, Math.min(92, (vh / z) * (96 / SCH_IMG_H))),
                                }}
                            />
                        </div>
                        <div className="flex items-center justify-between border-t border-[#3A3A3A]/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#1b1b20]">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]/60 dark:text-white/60">
                                <MapPinned className="h-3.5 w-3.5" />
                                {t("controls.minimap")}
                            </span>
                            <span dir="ltr" className="rounded-full bg-[#3A3A3A] px-2 py-0.5 font-mono text-xs font-black text-white dark:bg-white dark:text-[#3A3A3A]">{Math.round(z * 100)}%</span>
                        </div>
                    </div>
                ) : null}

                {/* Zoom dock — pill */}
                <div className="absolute bottom-4 right-4 z-[6] flex items-center gap-1 rounded-full border border-[#3A3A3A]/10 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] dark:border-white/10 dark:bg-[#1b1b20]">
                    <button type="button" onClick={() => zoomTo(z / 1.25)} aria-label={t("controls.zoomOut")} className="grid h-8 w-8 place-items-center rounded-full text-[#3A3A3A]/60 transition hover:bg-[#3A3A3A]/10 hover:text-[#3A3A3A] dark:text-white/60 dark:hover:bg-white/10">
                        <Minus className="h-4 w-4" />
                    </button>
                    <span dir="ltr" className="min-w-14 text-center font-mono text-xs font-black text-[#3A3A3A] dark:text-white">{Math.round(z * 100)}%</span>
                    <button type="button" onClick={() => zoomTo(z * 1.25)} aria-label={t("controls.zoomIn")} className="grid h-8 w-8 place-items-center rounded-full bg-[#B85708] text-white shadow-sm transition hover:bg-[#9A4A06]">
                        <Plus className="h-4 w-4" />
                    </button>
                    <span className="mx-1 h-5 w-px bg-[#3A3A3A]/10 dark:bg-white/10" />
                    <button type="button" onClick={fit} className="rounded-full bg-[#3A3A3A] px-3 py-1.5 text-xs font-black text-white transition hover:bg-black dark:bg-white dark:text-[#3A3A3A]">
                        <span className="hidden sm:inline">{t("controls.fit")}</span>
                        <Maximize2 className="h-3.5 w-3.5 sm:hidden" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function FileTextIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M4 2h4l3 3v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M8 2v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
    );
}
