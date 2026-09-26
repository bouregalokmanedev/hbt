"use client";

import { useEffect, useRef } from "react";
import type { ScopeEngine, ScopeEngineState } from "@sim/oscilloscope";

const COLORS: Record<string, string> = { A: "#3FBF7F", B: "#5B9BFF", C: "#F4A24A" };

/**
 * Engine-driven waveform canvas. Samples ScopeEngine.sig() across the current span
 * for Ch A (+ Ch B) and paints grid, traces, trigger level/marker, cursors and the
 * reference overlay. No waveform values are fabricated here — every point comes
 * from the engine. Redraws only when the relevant engine state changes.
 */
export function WaveformCanvas({ engine, state, height = 380 }: { engine: ScopeEngine; state: ScopeEngineState; height?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const persistBuf = useRef<number[][]>([]); // prior Ch A y-traces (afterglow)

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const W = canvas.clientWidth || 900;
    const H = height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);
    // background
    ctx.fillStyle = "#0C1116";
    ctx.fillRect(0, 0, W, H);
    // grid: 10 horizontal divisions × 8 vertical
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) { const x = (i / 10) * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let j = 0; j <= 8; j++) { const y = (j / 8) * H; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const comp = engine.comp();
    const span = engine.span();
    const t0 = state.tOffset;
    const midY = H / 2;
    const divH = H / 8; // pixels per vertical division

    // channel A value → y (invert + offset in divisions)
    const toY = (v: number, vdiv: number, off: number, inv: boolean) => {
      const divs = v / vdiv + off;
      const d = inv ? -divs : divs;
      return midY - d * divH;
    };

    const drawTrace = (ch: "A" | "B", vdiv: number, off: number, inv: boolean, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      const N = 700;
      for (let i = 0; i <= N; i++) {
        const t = t0 + (i / N) * span;
        const y = toY(engine.sig(ch, t), vdiv, off, inv);
        const x = (i / N) * W;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    // reference overlay (healthy signal, dashed) when REF is on
    if (state.refOn) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = COLORS[comp.chA.colorKey] || COLORS.A;
      ctx.beginPath();
      const N = 500;
      for (let i = 0; i <= N; i++) {
        const t = t0 + (i / N) * span;
        const y = toY(engine.raw("A", ((t % comp.period) + comp.period) % comp.period), state.vdivA, state.offA, state.invA);
        const x = (i / N) * W;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // peak-detect envelope: per-column min/max of Ch A over a dense sweep
    if (state.peakDet) {
      const cols = Math.floor(W);
      const top: number[] = new Array(cols).fill(Infinity);
      const bot: number[] = new Array(cols).fill(-Infinity);
      const M = cols * 4;
      for (let i = 0; i <= M; i++) {
        const x = Math.min(cols - 1, Math.floor((i / M) * cols));
        const y = toY(engine.sig("A", t0 + (i / M) * span), state.vdivA, state.offA, state.invA);
        if (y < top[x]) top[x] = y;
        if (y > bot[x]) bot[x] = y;
      }
      ctx.fillStyle = "rgba(63,191,127,0.16)";
      ctx.beginPath();
      for (let x = 0; x < cols; x++) if (isFinite(top[x])) ctx.lineTo(x, top[x]);
      for (let x = cols - 1; x >= 0; x--) if (isFinite(bot[x])) ctx.lineTo(x, bot[x]);
      ctx.closePath();
      ctx.fill();
    }

    // build the current Ch A y-trace (also used for persistence)
    const N = 700;
    const curY: number[] = [];
    for (let i = 0; i <= N; i++) curY.push(toY(engine.sig("A", t0 + (i / N) * span), state.vdivA, state.offA, state.invA));

    // persistence: draw prior ghost traces faintly, then record the current one
    if (state.persist) {
      ctx.strokeStyle = COLORS[comp.chA.colorKey] || COLORS.A;
      for (const trace of persistBuf.current) {
        ctx.globalAlpha = 0.07;
        ctx.beginPath();
        trace.forEach((y, i) => { const x = (i / N) * W; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (state.running) { persistBuf.current.push(curY); if (persistBuf.current.length > 14) persistBuf.current.shift(); }
    } else {
      persistBuf.current = [];
    }

    drawTrace("A", state.vdivA, state.offA, state.invA, COLORS[comp.chA.colorKey] || COLORS.A);
    if (comp.chB) drawTrace("B", state.vdivB, state.offB, state.invB, COLORS[comp.chB.colorKey] || COLORS.C);

    // trigger level (horizontal, orange dashed) + marker
    const trigY = toY(state.trigLevel, state.vdivA, state.offA, state.invA);
    ctx.strokeStyle = "#F4A24A";
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(0, trigY); ctx.lineTo(W, trigY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#F4A24A";
    ctx.beginPath(); ctx.moveTo(0.2 * W - 5, 4); ctx.lineTo(0.2 * W + 5, 4); ctx.lineTo(0.2 * W, 12); ctx.closePath(); ctx.fill();

    // cursors
    if (state.cursors) {
      for (const [frac, label] of [[state.cA, "A"], [state.cB, "B"]] as const) {
        const x = frac * W;
        ctx.strokeStyle = "#7FB2FF";
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#1F6AE1";
        ctx.fillRect(x - 7, 2, 14, 12);
        ctx.fillStyle = "#fff"; ctx.font = "9px monospace"; ctx.textAlign = "center";
        ctx.fillText(label, x, 11);
      }
    }
  }, [engine, state, height]);

  return <canvas ref={ref} className="block w-full rounded-lg" style={{ height }} aria-label="Waveform display" role="img" />;
}
