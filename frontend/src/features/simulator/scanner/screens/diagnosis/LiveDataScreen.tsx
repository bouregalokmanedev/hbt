import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CrumbBar, TopBar } from "./chrome";
import type { EcuNode } from "./systemsData";
import { displayPid, getScannerUnits } from "../../lib/scannerSettings";

/* Live Data screen (reference layout): Name | Value | Unit rows with the
   values moving in real time around the instructor's base value. Numeric
   parameters jitter within ±10% of the base; text parameters stay put.
   Pause freezes the stream; checkboxes select rows. Graph mode plots the
   recent history of every numeric parameter as a sparkline. */

const TICK_MS = 500;
const HISTORY_LEN = 40;

type Props = {
    ecu: EcuNode;
    crumbText: string;
    vciConnected: boolean;
    onBack: () => void;
};

function decimalsOf(base: string): number {
    const dot = base.indexOf(".");
    return dot === -1 ? 0 : base.length - dot - 1;
}

function formatValue(value: number, decimals: number): string {
    return value.toFixed(decimals);
}

/** One real-time sample for a parameter: numeric bases jitter ±10%. */
function sample(base: string): string {
    const parsed = Number.parseFloat(base);
    if (Number.isNaN(parsed)) return base;
    const spread = Math.abs(parsed) * 0.1 || 1;
    return formatValue(parsed - spread + Math.random() * spread * 2, decimalsOf(base));
}

/** Sparkline path for a numeric history buffer. */
function sparklinePath(values: number[], width: number, height: number): string {
    if (values.length < 2) return "";
    let min = Infinity;
    let max = -Infinity;
    for (const v of values) {
        if (v < min) min = v;
        if (v > max) max = v;
    }
    if (min === max) {
        min -= 1;
        max += 1;
    }
    const step = width / (values.length - 1);
    const scaleY = (v: number) => height - ((v - min) / (max - min)) * height;
    return values
        .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${scaleY(v).toFixed(1)}`)
        .join(" ");
}

export function LiveDataScreen({ ecu, crumbText, vciConnected, onBack }: Props) {
    const { t } = useTranslation();
    const cs = "simulator.scannerLab.diagnosisScreen";
    const units = getScannerUnits();
    const bases = useMemo(() => ecu.liveData.map((pid) => pid.base), [ecu]);
    const [values, setValues] = useState<string[]>(bases);
    const [paused, setPaused] = useState(false);
    const [graphMode, setGraphMode] = useState(false);
    const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
    const historyRef = useRef<Record<string, number[]>>({});

    useEffect(() => {
        if (paused) return;
        const id = setInterval(() => {
            const next = ecu.liveData.map((pid) => sample(pid.base));
            setValues(next);
            // Keep a rolling history for the graph sparklines.
            for (let i = 0; i < ecu.liveData.length; i++) {
                const parsed = Number.parseFloat(next[i] ?? "");
                if (Number.isNaN(parsed)) continue;
                const pidId = ecu.liveData[i]?.id;
                if (!pidId) continue;
                const buf = historyRef.current[pidId] ?? [];
                buf.push(parsed);
                if (buf.length > HISTORY_LEN) buf.splice(0, buf.length - HISTORY_LEN);
                historyRef.current[pidId] = buf;
            }
        }, TICK_MS);
        return () => clearInterval(id);
    }, [paused, ecu]);

    const toggle = (pidId: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(pidId)) next.delete(pidId);
            else next.add(pidId);
            return next;
        });
    };

    // Graph view: numeric rows the student selected (or all numeric if none).
    const graphRows = useMemo(() => {
        const numeric = ecu.liveData
            .map((pid, index) => ({ pid, index }))
            .filter(({ pid }) => !Number.isNaN(Number.parseFloat(pid.base)));
        const picked = selected.size
            ? numeric.filter(({ pid }) => selected.has(pid.id))
            : numeric;
        return picked;
    }, [ecu, selected]);

    return (
        <div className="absolute inset-0 flex flex-col">
            <TopBar
                onBack={onBack}
                title={t(`${cs}.readLiveData`)}
                vciConnected={vciConnected}
            />
            <CrumbBar text={crumbText} />

            {graphMode ? (
                <div
                    className="min-h-0 flex-1 overflow-y-auto p-[1.6cqw] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    style={{ background: "#e9ebef" }}
                    data-testid="live-graph"
                >
                    {graphRows.length === 0 ? (
                        <p
                            className="grid h-full place-items-center text-[#7d8590]"
                            style={{ fontSize: "1.5cqw" }}
                        >
                            {t(`${cs}.liveGraphEmpty`)}
                        </p>
                    ) : (
                        graphRows.map(({ pid, index }) => {
                            const history = historyRef.current[pid.id] ?? [];
                            const current = values[index] ?? pid.base;
                            const shown = displayPid(current, pid.unit, units);
                            return (
                                <div
                                    key={pid.id}
                                    className="mb-[1.2cqw] rounded-[0.8cqw] border border-[#d5d9df] bg-white px-[1.4cqw] py-[1.2cqw]"
                                >
                                    <div className="flex items-baseline justify-between">
                                        <span
                                            className="font-semibold text-[#33383f]"
                                            style={{ fontSize: "1.4cqw" }}
                                        >
                                            {pid.label}
                                        </span>
                                        <span
                                            className="font-bold text-[#2a7be4]"
                                            style={{ fontSize: "1.4cqw" }}
                                        >
                                             {shown.value}
                                             {shown.unit ? ` ${shown.unit}` : ""}
                                        </span>
                                    </div>
                                    <svg
                                        aria-hidden="true"
                                        className="mt-[0.8cqw] w-full"
                                        viewBox="0 0 300 48"
                                        preserveAspectRatio="none"
                                        style={{ height: "6cqw" }}
                                    >
                                        <path
                                            d={sparklinePath(history, 300, 48)}
                                            fill="none"
                                            stroke="#2a7be4"
                                            strokeWidth="1.6"
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                <>
                    {/* column headers */}
                    <div
                        className="grid shrink-0 items-center border-b border-[#c3c8cf]"
                        style={{ gridTemplateColumns: "4.4cqw 1fr 14cqw 8cqw" }}
                    >
                        <span />
                        <span
                            className="px-[1.2cqw] py-[1cqw] font-semibold text-[#4a4f57]"
                            style={{ fontSize: "1.4cqw" }}
                        >
                            Name
                        </span>
                        <span
                            className="px-[1.2cqw] py-[1cqw] font-semibold text-[#4a4f57]"
                            style={{ fontSize: "1.4cqw" }}
                        >
                            Value
                        </span>
                        <span
                            className="px-[1.2cqw] py-[1cqw] font-semibold text-[#4a4f57]"
                            style={{ fontSize: "1.4cqw" }}
                        >
                            Unit
                        </span>
                    </div>

                    <div
                        className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        style={{ background: "#e9ebef" }}
                    >
                        {ecu.liveData.map((pid, index) => {
                            const shown = displayPid(values[index] ?? pid.base, pid.unit, units);
                            return (
                            <div
                                key={pid.id}
                                className="grid items-center border-b border-[#d5d9df]"
                                style={{
                                    gridTemplateColumns: "4.4cqw 1fr 14cqw 8cqw",
                                    background: index % 2 === 0 ? "#ffffff" : "#eef1f5",
                                }}
                            >
                                <span className="grid place-items-center py-[1.2cqw]">
                                    <input
                                        type="checkbox"
                                        aria-label={pid.label}
                                        checked={selected.has(pid.id)}
                                        onChange={() => toggle(pid.id)}
                                        className="h-[1.5cqw] w-[1.5cqw] accent-[#2f7de1]"
                                    />
                                </span>
                                <span
                                    className="px-[1.2cqw] py-[1.2cqw] font-semibold text-[#33383f]"
                                    style={{ fontSize: "1.45cqw" }}
                                >
                                    {pid.label}
                                </span>
                                <span
                                    className="px-[1.2cqw] py-[1.2cqw] font-semibold text-[#2a7be4]"
                                    style={{ fontSize: "1.45cqw" }}
                                >
                                    {shown.value}
                                </span>
                                <span
                                    className="px-[1.2cqw] py-[1.2cqw] text-[#4a4f57]"
                                    style={{ fontSize: "1.45cqw" }}
                                >
                                    {shown.unit}
                                </span>
                            </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* bottom bar */}
            <div
                className="flex shrink-0 items-center justify-between border-t border-[#c3c8cf] px-[1.6cqw] py-[1.2cqw]"
                style={{ background: "linear-gradient(180deg, #f7f8fa 0%, #e8ebef 100%)" }}
            >
                <span
                    className="rounded-[0.5cqw] border border-[#c3c8cf] bg-white px-[1.2cqw] py-[0.7cqw] font-semibold text-[#2f7de1]"
                    style={{ fontSize: "1.4cqw" }}
                >
                    {selected.size} / {ecu.liveData.length}
                </span>
                <span className="flex gap-[1.4cqw]">
                    <BarBtn
                        label={graphMode ? t(`${cs}.liveList`) : t(`${cs}.liveGraph`)}
                        variant={graphMode ? "blue" : "grey"}
                        onClick={() => setGraphMode((g) => !g)}
                    />
                    <BarBtn
                        label={t(`${cs}.liveCancelSelected`)}
                        variant={selected.size > 0 ? "blue" : "grey"}
                        disabled={selected.size === 0}
                        onClick={() => setSelected(new Set())}
                    />
                    <BarBtn label={t(`${cs}.liveCustom`)} variant="grey" disabled onClick={() => undefined} />
                    <BarBtn label={t(`${cs}.liveRecording`)} onClick={() => undefined} />
                    <BarBtn
                        label={paused ? t(`${cs}.liveResume`) : t(`${cs}.livePause`)}
                        onClick={() => setPaused((p) => !p)}
                    />
                </span>
            </div>
        </div>
    );
}

function BarBtn({
    label,
    variant = "blue",
    disabled = false,
    onClick,
}: {
    label: string;
    variant?: "blue" | "grey";
    disabled?: boolean;
    onClick: () => void;
}) {
    const grey = variant === "grey";
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`rounded-[0.5cqw] px-[1.8cqw] py-[1cqw] font-bold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white ${
                disabled ? "cursor-not-allowed opacity-55" : "hover:brightness-[1.06]"
            }`}
            style={{
                background: grey
                    ? "linear-gradient(180deg, #f6f7f9 0%, #d9dde3 100%)"
                    : "linear-gradient(180deg, #4a97ec 0%, #2a6fd4 100%)",
                border: `1px solid ${grey ? "#b6bcc4" : "#2461bd"}`,
                fontSize: "1.4cqw",
            }}
        >
            {label}
        </button>
    );
}
