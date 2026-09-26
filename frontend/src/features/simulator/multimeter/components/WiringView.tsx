import { useState } from "react";
import { Minus, Plus, Maximize2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { MeterProcedureComponent, ProbeTarget } from "../data/multimeter.data";
import type { MeterProcedureEngine } from "../engine/meter.engine";
import { ComponentArt } from "./ComponentArt";

const ROW_H = 46;

export function WiringView({
    engine,
    onPinClick,
}: {
    engine: MeterProcedureEngine;
    onPinClick: (target: ProbeTarget) => void;
}) {
    const { t } = useTranslation();
    const state = engine.getState();
    const comp: MeterProcedureComponent = engine.component();
    const [zoom, setZoom] = useState(1);
    const [showArt, setShowArt] = useState(true);

    const compPins = comp.pins.map((pin) => String(pin));
    const ecuPins = comp.ecu.pins;
    const rows = Math.max(compPins.length, ecuPins.length, 1);
    const height = Math.max(320, rows * ROW_H + 90);

    const compY = (i: number) => 56 + i * ROW_H;
    const ecuY = (i: number) => 56 + i * ROW_H;
    const earthY = height - 30;

    const linkFor = (pin: string): string | null => {
        const raw = (comp.links as Record<string, string>)[pin];
        return raw === undefined ? null : String(raw);
    };
    const isSupply = (pin: string): boolean => comp.supply.map(String).includes(pin);

    const step = engine.step();
    const placement = engine.placement();

    const RED_PORT = { x: 242, y: 28 };
    const BLACK_PORT = { x: 298, y: 28 };

    const pinPos = (target: ProbeTarget): { x: number; y: number } | null => {
        if (target === "gnd") return { x: 270, y: earthY - 22 };
        if (target.startsWith("c")) {
            const i = compPins.indexOf(target.slice(1));
            return i === -1 ? null : { x: 150, y: compY(i) };
        }
        if (target.startsWith("e")) {
            const j = ecuPins.indexOf(target.slice(1));
            return j === -1 ? null : { x: 410, y: ecuY(j) };
        }
        return null;
    };

    const wirePath = (from: { x: number; y: number }, to: { x: number; y: number }): string =>
        `M ${from.x} ${from.y} C ${from.x} ${from.y + 70}, ${to.x} ${to.y - 80}, ${to.x} ${to.y}`;

    const needsLead = (target: ProbeTarget): boolean =>
        (target === step.red && !placement.redOk) || (target === step.black && !placement.blackOk);

    const nodeFill = (target: ProbeTarget): string => {
        if (state.red === target) return "#D92D20";
        if (state.black === target) return "#14181C";
        return "#1F6AE1";
    };

    const pinButton = (
        target: ProbeTarget,
        cx: number,
        cy: number,
        label: string,
        kind: "component" | "ecu" | "earth",
    ) => (
        <g
            key={target}
            role="button"
            tabIndex={0}
            data-probe-target={target}
            aria-label={
                kind === "earth"
                    ? t("simulator.dmmLab.bench.earthLabel")
                    : kind === "ecu"
                      ? t("simulator.dmmLab.bench.ecuPin", { pin: label })
                      : t("simulator.dmmLab.bench.componentPin", { pin: label })
            }
            onClick={() => onPinClick(target)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPinClick(target);
                }
            }}
            style={{ cursor: "pointer" }}
        >
            <circle cx={cx} cy={cy} r={14} fill="transparent" />
            {needsLead(target) && !state.finished && (
                <circle
                    cx={cx}
                    cy={cy}
                    r={13}
                    fill="none"
                    stroke="#F47822"
                    strokeWidth={2}
                    strokeDasharray="3 2"
                    className="animate-pulse"
                />
            )}
            <circle
                cx={cx}
                cy={cy}
                r={6.5}
                fill={kind === "earth" ? "#5F6570" : nodeFill(target)}
                stroke="#fff"
                strokeWidth={state.red === target || state.black === target ? 2.5 : 0.5}
            />
        </g>
    );

    const leadWire = (lead: "red" | "black") => {
        const target = lead === "red" ? state.red : state.black;
        if (!target) return null;
        const to = pinPos(target);
        if (!to) return null;
        const from = lead === "red" ? RED_PORT : BLACK_PORT;
        const color = lead === "red" ? "#D92D20" : "#23272B";
        return (
            <g key={`wire-${lead}`}>
                <path d={wirePath(from, to)} fill="none" stroke="#000" strokeOpacity={0.15} strokeWidth={6} strokeLinecap="round" />
                <path d={wirePath(from, to)} fill="none" stroke={color} strokeWidth={4.5} strokeLinecap="round" opacity={0.95} />
                <path d={wirePath(from, to)} fill="none" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" opacity={0.3} />
                <circle cx={to.x} cy={to.y} r={9} fill={color} stroke="#fff" strokeWidth={2} />
                <circle cx={to.x} cy={to.y} r={2.5} fill="#E8EBEE" />
            </g>
        );
    };

    return (
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-[#3A3A3A]/10 bg-white p-3 dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6AE1]">
                    {t("simulator.dmmLab.bench.wiringTitle")}
                </p>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setShowArt((v) => !v)}
                        aria-pressed={showArt}
                        className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition ${
                            showArt
                                ? "border-[#1F6AE1] text-[#1F6AE1]"
                                : "border-[#3A3A3A]/15 text-[#3A3A3A]/55 hover:text-[#3A3A3A] dark:border-white/15 dark:text-white/55"
                        }`}
                    >
                        {t("simulator.dmmLab.bench.showPart")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}
                        aria-label={t("simulator.dmmLab.bench.zoomOut")}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/60"
                    >
                        <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))}
                        aria-label={t("simulator.dmmLab.bench.zoomIn")}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/60"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setZoom(1);
                            engine.clearProbes();
                        }}
                        aria-label={t("simulator.dmmLab.bench.zoomReset")}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/60"
                    >
                        <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {showArt && (
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#3A3A3A]/8 bg-[#F8F9FB] px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
                    <ComponentArt sym={comp.sym} className="h-14 w-20 shrink-0 text-[#3A3A3A] dark:text-white" />
                    <div className="min-w-0">
                        <p className="truncate text-xs font-black text-[#3A3A3A] dark:text-white">{comp.name}</p>
                        <p className="font-mono text-[10px] text-[#3A3A3A]/50 dark:text-white/50" dir="ltr">
                            {comp.ref} · {comp.pins.length} {t("simulator.dmmLab.pins")} · {comp.ecu.code}
                        </p>
                    </div>
                </div>
            )}

            <div dir="ltr" className="mt-2 min-h-0 flex-1 overflow-auto rounded-xl bg-[#FCFCFC] dark:bg-white/[0.03]">
                <svg viewBox={`0 0 560 ${height}`} style={{ minWidth: 420, width: `${100 * zoom}%` }} role="img">
                    <rect x={20} y={8} width={150} height={height - 16} rx={10} fill="none" stroke="#D92D20" strokeWidth={1.5} strokeDasharray="4 3" />
                    <text x={95} y={30} textAnchor="middle" fontSize={10} fontWeight={800} fill="#D92D20">
                        {comp.ref}
                    </text>
                    <rect x={390} y={8} width={150} height={height - 16} rx={10} fill="none" stroke="#0E7C66" strokeWidth={1.5} />
                    <text x={465} y={30} textAnchor="middle" fontSize={10} fontWeight={800} fill="#0E7C66">
                        {comp.ecu.code}
                    </text>
                    {compPins.map((pin, i) => {
                        const target = linkFor(pin);
                        if (!target) return null;
                        const j = ecuPins.indexOf(target);
                        if (j === -1) return null;
                        return (
                            <line
                                key={pin}
                                x1={170}
                                y1={compY(i)}
                                x2={390}
                                y2={ecuY(j)}
                                stroke={isSupply(pin) ? "#B4560F" : "#8A9099"}
                                strokeWidth={isSupply(pin) ? 2.5 : 1.5}
                            />
                        );
                    })}
                    {compPins.map((pin, i) => (
                        <g key={`c${pin}`}>
                            <text x={54} y={compY(i) + 3.5} fontSize={10} fontWeight={700} fill="#3A3A3A">
                                {pin}
                            </text>
                            {isSupply(pin) && <circle cx={42} cy={compY(i)} r={3} fill="#B4560F" />}
                            <text x={72} y={compY(i) + 3.5} fontSize={8} fill="#3A3A3A" opacity={0.55}>
                                {(comp.pinFn as Record<string, string>)[pin]?.slice(0, 18) ?? ""}
                            </text>
                            {pinButton(`c${pin}`, 150, compY(i), String(pin), "component")}
                        </g>
                    ))}
                    {ecuPins.map((pin, j) => (
                        <g key={`e${pin}`}>
                            {pinButton(`e${pin}`, 410, ecuY(j), pin, "ecu")}
                            <text x={470} y={ecuY(j) + 3.5} fontSize={10} fontWeight={700} fill="#3A3A3A">
                                {pin}
                            </text>
                        </g>
                    ))}
                    <g>
                        <line x1={270} y1={earthY - 14} x2={270} y2={earthY - 4} stroke="#5F6570" strokeWidth={2} />
                        <line x1={262} y1={earthY - 4} x2={278} y2={earthY - 4} stroke="#5F6570" strokeWidth={2} />
                        <line x1={265} y1={earthY} x2={275} y2={earthY} stroke="#5F6570" strokeWidth={2} />
                        {pinButton("gnd", 270, earthY - 22, "GND", "earth")}
                        <text x={270} y={earthY + 12} textAnchor="middle" fontSize={9} fontWeight={700} fill="#5F6570">
                            GND
                        </text>
                    </g>
                    {leadWire("red")}
                    {leadWire("black")}
                    <g>
                        <circle cx={RED_PORT.x} cy={RED_PORT.y} r={9} fill="#14171A" stroke="#D92D20" strokeWidth={2.5} />
                        <circle cx={RED_PORT.x} cy={RED_PORT.y} r={3.5} fill="#000" />
                        <circle cx={BLACK_PORT.x} cy={BLACK_PORT.y} r={9} fill="#14171A" stroke="#23272B" strokeWidth={2.5} />
                        <circle cx={BLACK_PORT.x} cy={BLACK_PORT.y} r={3.5} fill="#000" />
                    </g>
                </svg>
            </div>
            <div className="mt-2 flex items-center gap-4 text-[10px] font-bold text-[#3A3A3A]/50 dark:text-white/50">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0 w-4 border-t-2 border-dashed border-[#D92D20]" />
                    {t("simulator.dmmLab.bench.componentPin", { pin: comp.ref })}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0 w-4 border-t-2 border-[#0E7C66]" />
                    {t("simulator.dmmLab.bench.ecuTitle")}
                </span>
            </div>
        </div>
    );
}
