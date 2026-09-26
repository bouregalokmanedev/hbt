import { useEffect, useState } from "react";
import { Minus, Plus, Maximize } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BUSES, type Bus, type EcuNode } from "../data/scanner.data";

type BusFilter = "all" | Bus;

function statusFill(status: EcuNode["status"]): string {
    if (status === "fault") return "#D92D20";
    if (status === "warn") return "#F59E0B";
    if (status === "offline" || status === "none") return "#3A3A3A";
    return "#12A150";
}

export function NetworkMap({
    nodes,
    focusEcu,
    onOpenSystems,
}: {
    nodes: EcuNode[];
    focusEcu: string | null;
    onOpenSystems: (ecuId: string) => void;
}) {
    const { t } = useTranslation();
    const [bus, setBus] = useState<BusFilter>("all");
    const [sel, setSel] = useState<string>(focusEcu ?? "ECM");
    const [zoom, setZoom] = useState(1);
    useEffect(() => {
        if (focusEcu) setSel(focusEcu);
    }, [focusEcu]);
    const selected = nodes.find((n) => n.id === sel) ?? nodes.find((n) => n.id === "ECM") ?? nodes[0];
    const visible = nodes.filter((n) => bus === "all" || n.bus === bus);
    if (!selected) return null;

    return (
        <div className="rounded-2xl border border-[#3A3A3A]/10 bg-white p-5 dark:border-white/10 dark:bg-[#1b1b20]">
            <div className="flex flex-wrap items-center gap-2">
                {(["all", "CAN-B", "CAN-C", "CAN-FD"] as const).map((b) => (
                    <button
                        key={b}
                        type="button"
                        onClick={() => setBus(b)}
                        className={`rounded-full px-3 py-1.5 font-mono text-[11px] font-bold transition ${
                            bus === b
                                ? "bg-[#0f1115] text-white dark:bg-white dark:text-[#0f1115]"
                                : "border border-[#3A3A3A]/10 text-[#3A3A3A]/55 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/55 dark:hover:text-white"
                        }`}
                    >
                        {b === "all" ? t("simulator.scannerLab.network.all") : b}
                    </button>
                ))}
                <span className="ms-auto flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(2)))}
                        aria-label={t("simulator.scannerLab.network.zoomOut")}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/60 dark:hover:text-white"
                    >
                        <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span dir="ltr" className="w-11 text-center font-mono text-[11px] font-bold text-[#3A3A3A]/60 dark:text-white/60">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.2).toFixed(2)))}
                        aria-label={t("simulator.scannerLab.network.zoomIn")}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/60 dark:hover:text-white"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setZoom(1)}
                        aria-label={t("simulator.scannerLab.network.fit")}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-[#3A3A3A]/10 text-[#3A3A3A]/60 hover:text-[#3A3A3A] dark:border-white/10 dark:text-white/60 dark:hover:text-white"
                    >
                        <Maximize className="h-3.5 w-3.5" />
                    </button>
                </span>
            </div>
            <div dir="ltr" className="mt-3 overflow-auto rounded-xl border border-[#3A3A3A]/10 bg-[#FCFCFC] p-2 dark:border-white/10 dark:bg-white/[0.03]">
                <svg viewBox="0 0 1000 400" className="min-w-[640px]" style={{ width: `${100 * zoom}%` }} role="img">
                    {BUSES.map((b) => (
                        <g key={b.id}>
                            <line x1={20} y1={b.y} x2={980} y2={b.y} stroke="#D5DCE3" strokeWidth={2} />
                            <text x={20} y={b.y - 8} fontSize={11} fill="#8A9099" fontWeight={700}>
                                {b.id} · {b.rate}
                            </text>
                        </g>
                    ))}
                    {nodes.map((n) => {
                        const def = BUSES.find((b) => b.id === n.bus)!;
                        const dimmed = bus !== "all" && n.bus !== bus;
                        const isSel = n.id === selected.id;
                        return (
                            <g
                                key={n.id}
                                opacity={dimmed ? 0.2 : 1}
                                onClick={() => setSel(n.id)}
                                className="cursor-pointer"
                            >
                                <line x1={n.x + 58} y1={n.y + 19} x2={n.x + 58} y2={def.y} stroke="#D5DCE3" strokeWidth={1.5} />
                                <rect
                                    x={n.x}
                                    y={n.y}
                                    width={116}
                                    height={38}
                                    rx={6}
                                    fill={isSel ? "#EFF5FE" : "#FFFFFF"}
                                    stroke={isSel ? "#1F6AE1" : "#E3E7ED"}
                                    strokeWidth={isSel ? 3 : 1.5}
                                />
                                <text x={n.x + 10} y={n.y + 16} fontSize={11} fontWeight={700} fill="#131A26">
                                    {n.id}
                                </text>
                                <text x={n.x + 10} y={n.y + 29} fontSize={9} fill="#6B7280">
                                    {n.name.slice(0, 20)}
                                </text>
                                <circle cx={n.x + 58} cy={n.y + 19} r={5} fill={statusFill(n.status)} />
                                {n.dtc > 0 && (
                                    <g>
                                        <circle cx={n.x + 108} cy={n.y + 8} r={7} fill="#D92D20" />
                                        <text x={n.x + 108} y={n.y + 11} fontSize={9} fontWeight={800} fill="#fff" textAnchor="middle">
                                            {n.dtc}
                                        </text>
                                    </g>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-[#3A3A3A]/[.04] px-4 py-3 dark:bg-white/[0.04]">
                <p className="font-mono text-xs font-black text-[#3A3A3A] dark:text-white" dir="ltr">
                    {selected.id} · {selected.name}
                </p>
                <p className="font-mono text-[11px] text-[#3A3A3A]/50 dark:text-white/50" dir="ltr">
                    {selected.bus} · {selected.protocol}
                </p>
                <span className="ms-auto flex items-center gap-2">
                    <span
                        className="rounded-full px-2.5 py-1 font-mono text-[11px] font-black text-white"
                        style={{ background: statusFill(selected.status) }}
                    >
                        {selected.status.toUpperCase()} · {selected.dtc} DTC
                    </span>
                    <button
                        type="button"
                        onClick={() => onOpenSystems(selected.id)}
                        className="rounded-xl bg-[#3A3A3A] px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-black"
                    >
                        {t("simulator.scannerLab.network.openSystem")}
                    </button>
                </span>
            </div>
            <p className="sr-only">
                {visible.map((n) => `${n.id} ${n.name} ${n.status} ${n.dtc}`).join(". ")}
            </p>
        </div>
    );
}
