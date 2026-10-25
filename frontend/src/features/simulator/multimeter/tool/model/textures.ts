import * as THREE from "three";

import { DIAL_MODES, type DialMode } from "../modes";

export const PANEL_W = 0.34;
export const PANEL_H = 0.818;
export const DIAL_CENTER_Y = 0.47;
export const LCD_CENTER_Y = 0.812;
export const JACK_ROW_Y = 0.238;
export const JACK_X = [-0.105, 0, 0.105] as const;
export const BUTTON_ROW_Y = 0.716;
export const BUTTON_X = [-0.13, -0.078, -0.026, 0.026, 0.078, 0.13] as const;
export const PANEL_CANVAS_W = 1024;
export const PANEL_CANVAS_H = 2464;
export const DIAL_CANVAS = { x: 512, y: 1443, r: 330 };
export const BRAND_ORANGE = "#f47822";

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

function spacedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
    ctx.textAlign = "left";
    const chars = Array.from(text);
    const widths = chars.map((char) => ctx.measureText(char).width);
    const total = widths.reduce((sum, width) => sum + width, 0) + spacing * Math.max(0, chars.length - 1);
    let cursor = x - total / 2;
    for (let i = 0; i < chars.length; i += 1) {
        ctx.fillText(chars[i], cursor + widths[i] / 2, y);
        cursor += widths[i] + spacing;
    }
}

let frontPanelTexture: THREE.CanvasTexture | null = null;

export function getFrontPanelTexture(): THREE.CanvasTexture {
    if (frontPanelTexture) return frontPanelTexture;
    const { canvas, ctx } = canvas2d(PANEL_CANVAS_W, PANEL_CANVAS_H);

    ctx.fillStyle = "#1e2226";
    ctx.fillRect(0, 0, PANEL_CANVAS_W, PANEL_CANVAS_H);

    const grain = ctx.createLinearGradient(0, 0, PANEL_CANVAS_W, PANEL_CANVAS_H);
    grain.addColorStop(0, "rgba(255,255,255,0.035)");
    grain.addColorStop(0.45, "rgba(255,255,255,0.005)");
    grain.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, PANEL_CANVAS_W, PANEL_CANVAS_H);

    ctx.save();
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < 4200; i += 1) {
        ctx.fillStyle = i % 2 ? "#ffffff" : "#000000";
        ctx.fillRect(Math.random() * PANEL_CANVAS_W, Math.random() * PANEL_CANVAS_H, 1, 1);
    }
    ctx.restore();

    ctx.fillStyle = BRAND_ORANGE;
    ctx.fillRect(84, 172, 856, 3);

    rounded(ctx, 52, 206, 920, 410, 18);
    ctx.fillStyle = "#0a0c0e";
    ctx.fill();
    ctx.strokeStyle = "#343b41";
    ctx.lineWidth = 4;
    ctx.stroke();
    rounded(ctx, 62, 216, 900, 390, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const buttonRowY = (PANEL_CANVAS_H * (0.949 - BUTTON_ROW_Y)) / PANEL_H;
    for (const x of BUTTON_X) {
        const px = PANEL_CANVAS_W / 2 + (x / PANEL_W) * PANEL_CANVAS_W;
        rounded(ctx, px - 60, buttonRowY - 34, 120, 68, 14);
        ctx.fillStyle = "#15181b";
        ctx.fill();
        ctx.strokeStyle = "#30363c";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    const cx = DIAL_CANVAS.x;
    const cy = DIAL_CANVAS.y;
    const ring = ctx.createRadialGradient(cx, cy, 180, cx, cy, DIAL_CANVAS.r + 18);
    ring.addColorStop(0, "#171a1d");
    ring.addColorStop(1, "#24292d");
    ctx.beginPath();
    ctx.arc(cx, cy, DIAL_CANVAS.r, 0, Math.PI * 2);
    ctx.fillStyle = ring;
    ctx.fill();
    ctx.strokeStyle = "#0d0f11";
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    for (let deg = -175; deg < 180; deg += 5) {
        const angle = (deg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(Math.sin(angle) * 350, -Math.cos(angle) * 350);
        ctx.lineTo(Math.sin(angle) * 368, -Math.cos(angle) * 368);
        ctx.strokeStyle = "#6e777e";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    for (const mode of DIAL_MODES) {
        const angle = (mode.angle * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(Math.sin(angle) * 338, -Math.cos(angle) * 338);
        ctx.lineTo(Math.sin(angle) * 376, -Math.cos(angle) * 376);
        ctx.strokeStyle = "#d7dee4";
        ctx.lineWidth = 5;
        ctx.stroke();
    }
    ctx.restore();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = BRAND_ORANGE;
    ctx.font = "900 72px Arial, Helvetica, sans-serif";
    ctx.fillText("V", 190, 1025);
    ctx.fillText("\u03a9", 834, 1025);
    ctx.fillText("A", 190, 1725);

    for (const mode of DIAL_MODES) {
        const angle = (mode.angle * Math.PI) / 180;
        const radius = 430;
        const x = cx + Math.sin(angle) * radius;
        const y = cy - Math.cos(angle) * radius;
        ctx.save();
        ctx.translate(x, y);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = mode.id === "off" ? "#f4f7f8" : "#d8dfe4";
        ctx.font = `700 ${mode.label.length > 3 ? 44 : mode.label.length === 3 ? 50 : 56}px Arial, Helvetica, sans-serif`;
        ctx.fillText(mode.label, 0, 0);
        ctx.restore();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, 238, 0, Math.PI * 2);
    ctx.fillStyle = "#121517";
    ctx.fill();
    ctx.strokeStyle = "#3b4248";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    const jackLabels = ["A", "COM", "V\u03a9"];
    const jackWarnings = ["10A MAX FUSED", "CAT III 1000V", "CAT IV 600V"];
    for (let i = 0; i < JACK_X.length; i += 1) {
        const x = cx + (JACK_X[i] / PANEL_W) * PANEL_CANVAS_W;
        ctx.textAlign = "center";
        ctx.fillStyle = "#d3dae0";
        ctx.font = "700 26px Arial, Helvetica, sans-serif";
        ctx.fillText(jackLabels[i], x, 2048);
        ctx.strokeStyle = "#3a4147";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, 2150, 58, 0, Math.PI * 2);
        ctx.stroke();
        if (jackWarnings[i]) {
            ctx.fillStyle = "#7d868e";
            ctx.font = "500 18px Arial, Helvetica, sans-serif";
            ctx.fillText(jackWarnings[i], x, 2270);
        }
    }

    ctx.fillStyle = "#7d868e";
    ctx.textAlign = "left";
    ctx.font = "500 18px Arial, Helvetica, sans-serif";
    ctx.fillText("TRUE RMS", 84, 2270);
    ctx.textAlign = "right";
    ctx.fillText("CAT III 1000V", 940, 2320);
    ctx.fillStyle = "#596168";
    ctx.font = "500 16px Arial, Helvetica, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("HBT-88V", 84, 2320);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    frontPanelTexture = texture;
    return texture;
}

const labelCache = new Map<string, THREE.CanvasTexture>();

export function getButtonLabelTexture(label: string, dark = false): THREE.CanvasTexture {
    const key = `${label}:${dark ? "d" : "l"}`;
    const cached = labelCache.get(key);
    if (cached) return cached;
    const { canvas, ctx } = canvas2d(256, 96);
    ctx.clearRect(0, 0, 256, 96);
    ctx.fillStyle = dark ? "#171a1c" : "#dfe5e9";
    ctx.font = "700 46px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    spacedText(ctx, label, 128, 50, 1);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    labelCache.set(key, texture);
    return texture;
}

let backPlateTexture: THREE.CanvasTexture | null = null;

export function getBackPlateTexture(): THREE.CanvasTexture {
    if (backPlateTexture) return backPlateTexture;
    const { canvas, ctx } = canvas2d(512, 64);
    ctx.clearRect(0, 0, 512, 64);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(226,232,236,0.72)";
    ctx.font = "700 24px Arial, Helvetica, sans-serif";
    ctx.fillText("HBT-88V \u00b7 TRUE RMS", 256, 34);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    backPlateTexture = texture;
    return texture;
}

const SEGMENTS: Record<string, string> = {
    "0": "abcdef",
    "1": "bc",
    "2": "abged",
    "3": "abgcd",
    "4": "fgbc",
    "5": "afgcd",
    "6": "afgedc",
    "7": "abc",
    "8": "abcdefg",
    "9": "abcdfg",
};

function drawSegment(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, on: boolean) {
    rounded(ctx, x, y, w, h, Math.min(t, w / 2, h / 2));
    ctx.fillStyle = on ? "#102018" : "rgba(16,32,24,0.055)";
    ctx.fill();
}

function drawDigit(ctx: CanvasRenderingContext2D, digit: string, x: number, y: number, w: number, h: number) {
    const t = Math.max(7, w * 0.13);
    const gap = 2;
    const half = h / 2;
    const on = SEGMENTS[digit] ?? "";
    const seg = (name: string, sx: number, sy: number, sw: number, sh: number) => {
        drawSegment(ctx, sx, sy, sw, sh, t, on.includes(name));
    };
    seg("a", x + t + gap, y, w - 2 * t - 2 * gap, t);
    seg("b", x + w - t, y + t + gap, t, half - t - 1.5 * gap);
    seg("c", x + w - t, y + half + gap / 2, t, half - t - 1.5 * gap);
    seg("d", x + t + gap, y + h - t, w - 2 * t - 2 * gap, t);
    seg("e", x, y + half + gap / 2, t, half - t - 1.5 * gap);
    seg("f", x, y + t + gap, t, half - t - 1.5 * gap);
    seg("g", x + t + gap, y + half - t / 2, w - 2 * t - 2 * gap, t);
}

export function drawLcd(ctx: CanvasRenderingContext2D, mode: DialMode, hold: boolean, backlight: boolean) {
    const width = 512;
    const height = 256;
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    if (mode.id === "off") {
        bg.addColorStop(0, "#404b45");
        bg.addColorStop(1, "#58635c");
    } else if (backlight) {
        bg.addColorStop(0, "#e8eee9");
        bg.addColorStop(0.55, "#dbe4df");
        bg.addColorStop(1, "#cbd6d0");
    } else {
        bg.addColorStop(0, "#c4cdc8");
        bg.addColorStop(1, "#b2bdb7");
    }
    ctx.fillStyle = bg;
    rounded(ctx, 0, 0, width, height, 16);
    ctx.fill();

    if (mode.id !== "off") {
        const glow = ctx.createLinearGradient(0, 0, 0, 92);
        glow.addColorStop(0, "rgba(255,255,255,0.26)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        rounded(ctx, 0, 0, width, 92, 16);
        ctx.fill();
    }

    if (mode.id === "off") return;

    ctx.fillStyle = "#102018";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "700 18px Arial, Helvetica, sans-serif";
    ctx.fillText(mode.auto ? "AUTO" : "MANUAL", 24, 28);
    if (hold) {
        rounded(ctx, 128, 14, 62, 26, 5);
        ctx.fillStyle = "#102018";
        ctx.fill();
        ctx.fillStyle = "#e8eee9";
        ctx.font = "700 14px Arial, Helvetica, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("HOLD", 159, 28);
    }

    ctx.strokeStyle = "#102018";
    ctx.lineWidth = 2;
    ctx.strokeRect(444, 16, 38, 24);
    ctx.fillStyle = "#102018";
    ctx.fillRect(447, 20, 9, 16);
    ctx.fillRect(458, 20, 9, 16);
    ctx.fillRect(469, 20, 9, 16);

    const value = mode.value;
    const digits = value.replace(".", "");
    const dotIndex = value.indexOf(".");
    const digitY = 62;
    const digitW = 58;
    const digitH = 124;
    const digitStep = 76;
    const digitStart = 34;

    if (digits === "OL") {
        ctx.fillStyle = "#102018";
        ctx.font = "700 116px Arial, Helvetica, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("OL", digitStart, 124);
    } else {
        for (let i = 0; i < digits.length; i += 1) {
            drawDigit(ctx, digits[i], digitStart + i * digitStep, digitY, digitW, digitH);
        }
        if (dotIndex >= 0) {
            ctx.beginPath();
            ctx.arc(digitStart + dotIndex * digitStep - 8, digitY + digitH - 10, 7, 0, Math.PI * 2);
            ctx.fillStyle = "#102018";
            ctx.fill();
        }
    }

    const [unitMain, unitSub] = mode.unit.split(" ");
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#102018";
    ctx.font = "700 38px Arial, Helvetica, sans-serif";
    ctx.fillText(unitMain ?? "", 350, 112);
    if (unitSub) {
        ctx.font = "700 22px Arial, Helvetica, sans-serif";
        ctx.fillText(unitSub, 352, 142);
    }

    ctx.font = "600 14px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "rgba(16,32,24,0.62)";
    ctx.fillText("HBT-88V", 24, 232);
    ctx.textAlign = "right";
    ctx.fillText("TRUE RMS", 488, 232);
}

let lcdTexture: THREE.CanvasTexture | null = null;
let lcdCanvas: HTMLCanvasElement | null = null;
let lcdCtx: CanvasRenderingContext2D | null = null;

export function updateLcdTexture(mode: DialMode, hold: boolean, backlight: boolean): THREE.CanvasTexture {
    if (!lcdCanvas || !lcdCtx) {
        const created = canvas2d(512, 256);
        lcdCanvas = created.canvas;
        lcdCtx = created.ctx;
        lcdTexture = new THREE.CanvasTexture(lcdCanvas);
        lcdTexture.colorSpace = THREE.SRGBColorSpace;
        lcdTexture.anisotropy = 8;
    }
    lcdCtx.clearRect(0, 0, 512, 256);
    drawLcd(lcdCtx, mode, hold, backlight);
    if (lcdTexture) lcdTexture.needsUpdate = true;
    return lcdTexture as THREE.CanvasTexture;
}
