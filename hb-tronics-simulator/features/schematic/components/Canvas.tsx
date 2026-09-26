"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SchematicWorkspaceEngine, WorkspaceState } from "@sim/schematic";
import { SCH_IMG_W, SCH_IMG_H, SCH_DIAGRAM, SCH_TYPE_LABEL } from "@/data/schematic/workspace";
import { tracePolyline, polylineD, pointAt } from "../lib";
import { CircuitGraph } from "./CircuitGraph";
import { cn } from "@/lib/cn";

const TYPE_TINT: Record<string, { bd: string; bg: string }> = {
  ground: { bd: "rgba(23,167,104,.5)", bg: "rgba(23,167,104,.10)" },
  fuse: { bd: "rgba(245,158,11,.5)", bg: "rgba(245,158,11,.10)" },
  relay: { bd: "rgba(245,158,11,.5)", bg: "rgba(245,158,11,.10)" },
  network: { bd: "rgba(59,111,224,.5)", bg: "rgba(59,111,224,.10)" },
};

/**
 * Schematic canvas — the authentic raster diagram (diagram-r16.png, 4016×1479) on a
 * pan/zoom stage with an image-relative hotspot layer, the guided-trace SVG overlay,
 * minimap, HUD and zoom dock. Pan/zoom is a view-transform (UI concern); every
 * selection / trace / layer decision comes from the engine. In Circuit view it hands
 * off to <CircuitGraph>. The raster is one memoised <img> — never redrawn per frame.
 */
export function Canvas({ engine, state, t, tc }: { engine: SchematicWorkspaceEngine; state: WorkspaceState; t: any; tc: any }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [z, setZ] = useState(0.3);
  const [tx, setTx] = useState(40);
  const [ty, setTy] = useState(40);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const [vw, setVw] = useState(1000);
  const [vh, setVh] = useState(600);
  const [traceT, setTraceT] = useState(0); // continuous 0..1 walk fraction (source parity)

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
  // refit when the view changes
  useEffect(() => {
    const id = setTimeout(fit, 30);
    return () => clearTimeout(id);
  }, [fit, isCircuit]);

  // Continuous guided-trace dot walk (source parity): traceT advances 0→1 along the
  // authored polyline; the current step is derived from it (no graph traversal).
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

  // HUD text
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
    <div className="relative min-w-0 flex-1 overflow-hidden bg-paper2">
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
            <div className="relative bg-white shadow-lg" style={{ width: SCH_IMG_W, height: SCH_IMG_H }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SCH_DIAGRAM} alt={`${trace.labelId}`} width={SCH_IMG_W} height={SCH_IMG_H} draggable={false} className="pointer-events-none block select-none" />

              {/* guided-trace overlay */}
              {isTrace && tracePts.length ? (
                <svg viewBox={`0 0 ${SCH_IMG_W} ${SCH_IMG_H}`} className="pointer-events-none absolute inset-0 overflow-visible" style={{ width: SCH_IMG_W, height: SCH_IMG_H }}>
                  <path d={polylineD(tracePts)} fill="none" stroke="rgba(237,125,28,.22)" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
                  <path d={polylineD(tracePts)} fill="none" stroke="#ED7D1C" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24 20" style={{ animation: "sch-dash 1.1s linear infinite" }} />
                  {trace.steps.map((st, i) => {
                    const c = engine.component(st.cmp)!;
                    const cx = c.x, cy = st.cmp === "E1" ? 1135 : c.y;
                    return (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r={20} fill="#ED7D1C" opacity={0.2} style={{ animation: `sch-pulse 1.8s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }} />
                        <circle cx={cx} cy={cy} r={i === stepI ? 16 : 11} fill={i === stepI ? "#ED7D1C" : "#B85708"} opacity={i === stepI ? 1 : 0.85} />
                      </g>
                    );
                  })}
                  {/* the continuous moving dot */}
                  {walkPt ? (
                    <>
                      <circle cx={walkPt.x} cy={walkPt.y} r={26} fill="#ED7D1C" opacity={0.28} />
                      <circle cx={walkPt.x} cy={walkPt.y} r={13} fill="#B85708" />
                    </>
                  ) : null}
                </svg>
              ) : null}

              {/* hotspot layer */}
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
                if (isCon && !isSel) { bd = "2px solid rgba(237,125,28,.45)"; bg = "rgba(237,125,28,.08)"; }
                if (inTrace) { bd = "2px solid #ED7D1C"; bg = "rgba(237,125,28,.14)"; }
                if (isHov) { bd = "2px solid #ED7D1C"; bg = "rgba(237,125,28,.14)"; }
                if (isSel) { bd = "3px solid #B85708"; bg = "rgba(237,125,28,.16)"; }
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
                    className="absolute rounded-lg focus-ring"
                    style={{ left: c.x - c.w / 2, top: c.y - c.h / 2, width: c.w, height: c.h, border: bd, background: bg, opacity: dim ? 0.25 : 1, transition: "opacity .15s,background .15s" }}
                  >
                    {showLabel ? (
                      <span className="absolute left-0 top-[-26px] whitespace-nowrap rounded px-1.5 py-0.5 t-code text-[15px]" style={{ color: "#B85708", background: "rgba(255,255,255,.92)" }}>{c.code}</span>
                    ) : null}
                    {isExam ? (
                      <span className="absolute left-1/2 top-[-30px] flex h-6 w-13 -translate-x-1/2 items-center justify-center rounded bg-ink px-1.5 t-code text-[13px] text-white">?</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* HUD */}
        {hud ? (
          <div className="pointer-events-none absolute left-1/2 top-3.5 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-line bg-paper px-3.5 py-2 shadow-card">
            <span className="h-2 w-2 rounded-pill" style={{ background: isExam ? "#E23D3D" : "#ED7D1C" }} />
            <span className="t-body-sm text-ink">{hud}</span>
            {isTrace ? (
              <button type="button" onClick={() => (state.tracePlaying ? engine.tracePause() : engine.tracePlay())} className="pointer-events-auto rounded-full bg-mod-schematic px-2.5 py-0.5 t-cta text-white">
                {state.tracePlaying ? t("trace.pause") : t("trace.play")}
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Minimap (schematic only) */}
        {!isCircuit ? (
          <div className="absolute bottom-4 left-4 z-[6] w-[236px] overflow-hidden rounded-lg border border-line bg-paper shadow-card">
            <div className="relative h-[87px] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={SCH_DIAGRAM} alt="" className="block h-full w-full object-fill opacity-75" />
              <div
                className="absolute border-2"
                style={{
                  borderColor: "#B85708", background: "rgba(237,125,28,.12)",
                  left: Math.max(0, (-tx / z) * (236 / SCH_IMG_W)),
                  top: Math.max(0, (-ty / z) * (87 / SCH_IMG_H)),
                  width: Math.max(6, Math.min(236, (vw / z) * (236 / SCH_IMG_W))),
                  height: Math.max(6, Math.min(87, (vh / z) * (87 / SCH_IMG_H))),
                }}
              />
            </div>
            <div className="flex items-center justify-between border-t border-line px-2 py-1 t-code text-[10px] text-neutralx-fg4">
              <span>{t("controls.minimap")}</span>
              <span dir="ltr">{Math.round(z * 100)}%</span>
            </div>
          </div>
        ) : null}

        {/* Zoom dock */}
        <div className="absolute bottom-4 right-4 z-[6] flex items-center gap-1.5 rounded-lg border border-line bg-paper p-1.5 shadow-card">
          <button type="button" onClick={() => zoomTo(z / 1.25)} aria-label={t("controls.zoomOut")} className="focus-ring h-7 w-7 rounded-md text-neutralx-fg3 hover:bg-fill">−</button>
          <span dir="ltr" className="min-w-11 text-center t-code text-neutralx-fg3">{Math.round(z * 100)}%</span>
          <button type="button" onClick={() => zoomTo(z * 1.25)} aria-label={t("controls.zoomIn")} className="focus-ring h-7 w-7 rounded-md text-neutralx-fg3 hover:bg-fill">+</button>
          <span className="mx-0.5 h-4 w-px bg-line" />
          <button type="button" onClick={fit} className="focus-ring rounded-md px-2 py-1 t-cta text-neutralx-fg3 hover:bg-fill">{t("controls.fit")}</button>
        </div>
      </div>
    </div>
  );
}
