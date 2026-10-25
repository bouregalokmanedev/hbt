import * as THREE from "three";

import type { ScopeEngine, ScopeEngineState } from "../../engine/scope.engine";

export const BRAND_ORANGE = "#f47822";
export const SCREEN_W = 1024;
export const SCREEN_H = 1024;

const labelCache = new Map<string, THREE.CanvasTexture>();
const wideLabelCache = new Map<string, THREE.CanvasTexture>();

function canvas2d(width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas is not available");
    return { canvas, ctx };
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
}

const symbolCache = new Map<string, THREE.CanvasTexture>();

export function getSymbolTexture(symbol: string, color = "#f7fafb"): THREE.CanvasTexture {
    const key = `${symbol}:${color}`;
    const cached = symbolCache.get(key);
    if (cached) return cached;

    const { canvas, ctx } = canvas2d(128, 128);
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 94px Arial, Helvetica, sans-serif";
    ctx.fillText(symbol, 64, 68);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    symbolCache.set(key, texture);
    return texture;
}

export function getLabelTexture(
    label: string,
    options: { color?: string; background?: string; border?: string; size?: number } = {},
): THREE.CanvasTexture {
    const color = options.color ?? "#eef2f5";
    const background = options.background ?? "transparent";
    const border = options.border ?? "transparent";
    const size = options.size ?? 58;
    const key = `${label}:${color}:${background}:${border}:${size}`;
    const cached = labelCache.get(key);
    if (cached) return cached;

    const { canvas, ctx } = canvas2d(512, 160);
    if (background !== "transparent") {
        rounded(ctx, 6, 6, 500, 148, 26);
        ctx.fillStyle = background;
        ctx.fill();
    }
    if (border !== "transparent") {
        ctx.strokeStyle = border;
        ctx.lineWidth = 5;
        ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${size}px Arial, Helvetica, sans-serif`;
    ctx.fillText(label, 256, 84);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    labelCache.set(key, texture);
    return texture;
}

export function getWideLabelTexture(
    label: string,
    options: { color?: string; size?: number; tracking?: number } = {},
): THREE.CanvasTexture {
    const color = options.color ?? "#eef2f5";
    const size = options.size ?? 72;
    const tracking = options.tracking ?? 10;
    const key = `${label}:${color}:${size}:${tracking}`;
    const cached = wideLabelCache.get(key);
    if (cached) return cached;

    const { canvas, ctx } = canvas2d(1024, 128);
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
    const chars = Array.from(label);
    const widths = chars.map((char) => ctx.measureText(char).width);
    const total = widths.reduce((sum, width) => sum + width, 0) + tracking * Math.max(0, chars.length - 1);
    let x = 512 - total / 2;
    for (let i = 0; i < chars.length; i += 1) {
        ctx.fillText(chars[i], x, 66);
        x += widths[i] + tracking;
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    wideLabelCache.set(key, texture);
    return texture;
}

let backLabelTexture: THREE.CanvasTexture | null = null;

export function getBackLabelTexture(): THREE.CanvasTexture {
    if (backLabelTexture) return backLabelTexture;
    const { canvas, ctx } = canvas2d(1024, 320);
    ctx.clearRect(0, 0, 1024, 320);
    ctx.fillStyle = "#d7dde2";
    ctx.textAlign = "left";
    ctx.font = "800 54px Arial, Helvetica, sans-serif";
    ctx.fillText("HBT-S2", 52, 82);
    ctx.fillStyle = "#9aa5ad";
    ctx.font = "600 28px Arial, Helvetica, sans-serif";
    ctx.fillText("100 MHz · 2 CHANNEL DIGITAL STORAGE OSCILLOSCOPE", 52, 132);
    ctx.fillStyle = "#6f7a82";
    ctx.font = "500 22px Arial, Helvetica, sans-serif";
    ctx.fillText("INPUT 400 Vpk  ·  CAT II 300 V  ·  SERIAL HBT-OSC-240118", 52, 190);
    ctx.fillStyle = "#161a1d";
    for (let x = 0; x < 430; x += 9) {
        const width = x % 27 === 0 ? 4 : x % 14 === 0 ? 2 : 6;
        ctx.fillRect(52 + x, 232, width, 42);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    backLabelTexture = texture;
    return texture;
}

export function formatDiv(value: number, kind: "voltage" | "time" | "current"): string {
    if (kind === "time") return value < 1 ? `${Math.round(value * 1000)} µs` : `${value} ms`;
    if (value < 1) return `${Math.round(value * 1000)} m${kind === "current" ? "A" : "V"}`;
    return `${value} ${kind === "current" ? "A" : "V"}`;
}

export function formatReadout(value: number, coupling: string): { value: string; unit: string } {
    const prefix = Math.abs(value) < 1 ? "m" : "";
    const scaled = Math.abs(value) < 1 ? value * 1000 : value;
    return {
        value: Math.abs(scaled) >= 100 ? scaled.toFixed(1) : scaled.toFixed(2),
        unit: `${prefix}V${coupling.toLowerCase()}`,
    };
}

export interface ScopeScreenPainter {
    texture: THREE.CanvasTexture;
    draw: (engine: ScopeEngine, state: ScopeEngineState, sweep: number, powered: boolean) => void;
    dispose: () => void;
}

export function createScopeScreenPainter(): ScopeScreenPainter {
    const { canvas, ctx } = canvas2d(SCREEN_W, SCREEN_H);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.needsUpdate = true;

    const draw = (engine: ScopeEngine, state: ScopeEngineState, sweep: number, powered: boolean) => {
        const comp = engine.comp();
        const plot = { x: 42, y: 208, w: 940, h: 728 };
        const midY = plot.y + plot.h / 2;
        const divH = plot.h / 8;

        ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);

        if (!powered) {
            const dead = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
            dead.addColorStop(0, "#24282a");
            dead.addColorStop(1, "#101314");
            ctx.fillStyle = dead;
            ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
            ctx.fillStyle = "rgba(255,255,255,0.07)";
            ctx.textAlign = "center";
            ctx.font = "700 28px Arial, Helvetica, sans-serif";
            ctx.fillText("POWER OFF", SCREEN_W / 2, SCREEN_H / 2);
            texture.needsUpdate = true;
            return;
        }

        const bg = ctx.createLinearGradient(0, 0, 0, SCREEN_H);
        bg.addColorStop(0, "#f1f1ed");
        bg.addColorStop(0.62, "#e7e8e3");
        bg.addColorStop(1, "#dcded8");
        ctx.fillStyle = bg;
        rounded(ctx, 0, 0, SCREEN_W, SCREEN_H, 18);
        ctx.fill();

        const glow = ctx.createLinearGradient(0, 0, 0, 128);
        glow.addColorStop(0, "rgba(255,255,255,0.7)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        rounded(ctx, 0, 0, SCREEN_W, 128, 18);
        ctx.fill();

        const m = engine.measure();
        const readoutValue = state.couplingA === "AC" ? m.pp : m.mean;
        const readout = formatReadout(readoutValue, state.couplingA);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#b52f24";
        ctx.font = "900 128px Arial, Helvetica, sans-serif";
        ctx.fillText(readout.value, 48, 152);
        const valueWidth = ctx.measureText(readout.value).width;
        ctx.font = "700 40px Arial, Helvetica, sans-serif";
        ctx.fillText(readout.unit, 56 + valueWidth, 148);

        if (!state.running) {
            rounded(ctx, 372, 170, 120, 44, 5);
            ctx.fillStyle = "#2e3335";
            ctx.fill();
            ctx.fillStyle = "#eef0eb";
            ctx.textAlign = "center";
            ctx.font = "800 22px Arial, Helvetica, sans-serif";
            ctx.fillText("HOLD", 432, 201);
        }

        ctx.save();
        rounded(ctx, plot.x, plot.y, plot.w, plot.h, 4);
        ctx.clip();

        ctx.strokeStyle = "rgba(43,47,49,0.36)";
        ctx.lineWidth = 1.15;
        ctx.setLineDash([4, 5]);
        for (let i = 0; i <= 10; i += 1) {
            const x = plot.x + (i / 10) * plot.w;
            ctx.beginPath();
            ctx.moveTo(x, plot.y);
            ctx.lineTo(x, plot.y + plot.h);
            ctx.stroke();
        }
        for (let j = 0; j <= 8; j += 1) {
            const y = plot.y + (j / 8) * plot.h;
            ctx.beginPath();
            ctx.moveTo(plot.x, y);
            ctx.lineTo(plot.x + plot.w, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(43,47,49,0.56)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(plot.x + plot.w / 2, plot.y);
        ctx.lineTo(plot.x + plot.w / 2, plot.y + plot.h);
        ctx.moveTo(plot.x, plot.y + plot.h / 2);
        ctx.lineTo(plot.x + plot.w, plot.y + plot.h / 2);
        ctx.stroke();

        const toY = (v: number, vdiv: number, off: number, inv: boolean) => {
            const divs = inv ? -(v / vdiv + off) : v / vdiv + off;
            return midY - divs * divH;
        };
        const trace = (channel: "A" | "B", vdiv: number, off: number, inv: boolean, color: string, width: number) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineJoin = "round";
            ctx.beginPath();
            const samples = 720;
            for (let i = 0; i <= samples; i += 1) {
                const t = state.tOffset + sweep + (i / samples) * engine.span();
                const x = plot.x + (i / samples) * plot.w;
                const y = toY(engine.sig(channel, t), vdiv, off, inv);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        };

        if (state.refOn) {
            ctx.save();
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.42;
            trace("A", state.vdivA, state.offA, state.invA, "#8b8f8c", 1.35);
            ctx.restore();
        }
        if (state.persist) {
            ctx.save();
            ctx.globalAlpha = 0.11;
            trace("A", state.vdivA, state.offA, state.invA, "#c9382b", 1.2);
            trace("A", state.vdivA, state.offA, state.invA, "#c9382b", 1.2);
            ctx.restore();
        }

        const trigY = toY(state.trigLevel, state.vdivA, state.offA, state.invA);
        ctx.strokeStyle = "rgba(224,108,24,0.8)";
        ctx.lineWidth = 1.2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(plot.x, trigY);
        ctx.lineTo(plot.x + plot.w, trigY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#d96a1a";
        const trigX = plot.x + plot.w * 0.2;
        ctx.beginPath();
        ctx.moveTo(trigX - 7, plot.y + 1);
        ctx.lineTo(trigX + 7, plot.y + 1);
        ctx.lineTo(trigX, plot.y + 11);
        ctx.closePath();
        ctx.fill();

        trace("A", state.vdivA, state.offA, state.invA, "#c9382b", 2.6);
        if (comp.chB) trace("B", state.vdivB, state.offB, state.invB, "#2f63d9", 2.4);

        if (state.cursors) {
            for (const [fraction, label] of [
                [state.cA, "A"],
                [state.cB, "B"],
            ] as const) {
                const x = plot.x + fraction * plot.w;
                ctx.strokeStyle = "rgba(38,80,160,0.65)";
                ctx.lineWidth = 1.2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(x, plot.y);
                ctx.lineTo(x, plot.y + plot.h);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = "#2f63d9";
                rounded(ctx, x - 13, plot.y + 4, 26, 20, 4);
                ctx.fill();
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.font = "800 13px Arial, Helvetica, sans-serif";
                ctx.fillText(label, x, plot.y + 19);
            }
        }

        const baselineA = toY(0, state.vdivA, state.offA, state.invA);
        ctx.fillStyle = "#c9382b";
        ctx.textAlign = "left";
        ctx.font = "800 26px Arial, Helvetica, sans-serif";
        ctx.fillText("1", plot.x + 20, THREE.MathUtils.clamp(baselineA + 9, plot.y + 24, plot.y + plot.h - 8));
        if (comp.chB) {
            const baselineB = toY(0, state.vdivB, state.offB, state.invB);
            ctx.fillStyle = "#2f63d9";
            ctx.fillText("2", plot.x + 20, THREE.MathUtils.clamp(baselineB + 9, plot.y + 24, plot.y + plot.h - 8));
        }

        ctx.restore();

        ctx.fillStyle = "#1f2325";
        ctx.textAlign = "left";
        ctx.font = "800 26px Arial, Helvetica, sans-serif";
        ctx.fillText(`${formatDiv(state.vdivA, comp.chA.unit === "A" ? "current" : "voltage")}/div`, 48, 990);
        ctx.textAlign = "center";
        ctx.fillText(`${formatDiv(state.timeDiv, "time")}/div`, SCREEN_W / 2, 990);
        ctx.textAlign = "right";
        ctx.font = "700 22px Arial, Helvetica, sans-serif";
        ctx.fillStyle = "rgba(31,35,37,0.62)";
        ctx.fillText(`${state.trigEdge === "rising" ? "↑" : "↓"} ${state.trigLevel.toFixed(2)} ${comp.chA.unit}`, SCREEN_W - 48, 990);

        texture.needsUpdate = true;
    };

    return {
        texture,
        draw,
        dispose: () => texture.dispose(),
    };
}
