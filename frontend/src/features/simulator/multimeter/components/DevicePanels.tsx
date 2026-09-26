import { useTranslation } from "react-i18next";

import { ROTARY_MODES, type MeterMode } from "../data/multimeter.data";
import type { JackId, Lead, MeterReading } from "../engine/meter.engine";
import { requiredRedJack } from "../engine/meter.engine";
import { sfx } from "../lib/sfx";

const MODE_ANGLE: Record<MeterMode, number> = {
    OFF: 180,
    VDC: -129,
    VAC: -77,
    OHM: -26,
    MA: 26,
    A: 77,
    HZ: 129,
};

const MODE_LABEL: Record<MeterMode, string> = {
    OFF: "OFF",
    VDC: "V⎓",
    VAC: "V~",
    OHM: "Ω",
    MA: "mA",
    A: "A",
    HZ: "Hz",
};

const JACKS: JackId[] = ["A", "mA", "COM", "V/Ω"];
const JACK_X: Record<JackId, number> = { A: 66, mA: 122, COM: 178, "V/Ω": 234 };
const JACK_Y = 386;

const DIAL_CX = 150;
const DIAL_CY = 252;
const DIAL_R = 80;

function dialPos(angle: number, radius: number): { x: number; y: number } {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: DIAL_CX + Math.cos(rad) * radius, y: DIAL_CY + Math.sin(rad) * radius };
}

export function DmmPanel({
    mode,
    reading,
    onMode,
    redJack,
    blackJack,
    onJack,
    jackError,
}: {
    mode: MeterMode;
    reading: MeterReading;
    onMode: (mode: MeterMode) => void;
    redJack: JackId | null;
    blackJack: JackId | null;
    onJack: (lead: Lead, jack: JackId) => void;
    jackError?: boolean;
}) {
    const { t } = useTranslation();
    const rangeText =
        reading.status === "off"
            ? "OFF"
            : reading.status === "unseated"
              ? t("simulator.dmmLab.placeProbes")
              : reading.status === "wrongJack"
                ? t("simulator.dmmLab.wrongJack")
                : reading.status === "wrongMode"
                  ? t("simulator.dmmLab.wrongMode")
                  : reading.status === "wrongPoints"
                    ? t("simulator.dmmLab.bench.wrongPointsRange")
                    : `${t("simulator.dmmLab.spec")}: ${reading.spec}`;
    const suggested = requiredRedJack(mode);
    const knob = dialPos(MODE_ANGLE[mode], 30);

    const seatClick = (jack: JackId) => {
        if (jack === "COM") onJack("black", "COM");
        else onJack("red", jack);
        sfx.play("jack");
    };

    return (
        <div dir="ltr" className="overflow-hidden rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
            <svg viewBox="0 0 300 440" className="block h-auto w-full" role="img" aria-label="HB TRONICS DMM-772">
                <defs>
                    <linearGradient id="dmmHolster" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0" stopColor="#D9A400" />
                        <stop offset="0.12" stopColor="#F5BE0B" />
                        <stop offset="0.5" stopColor="#FFD23E" />
                        <stop offset="0.88" stopColor="#F5BE0B" />
                        <stop offset="1" stopColor="#C78D00" />
                    </linearGradient>
                    <radialGradient id="dmmKnob" cx="0.38" cy="0.32" r="0.9">
                        <stop offset="0" stopColor="#FAFCFE" />
                        <stop offset="0.7" stopColor="#C9D1D9" />
                        <stop offset="1" stopColor="#8A939C" />
                    </radialGradient>
                    <radialGradient id="dmmScreen" cx="0.5" cy="0.35" r="0.9">
                        <stop offset="0" stopColor="#123B28" />
                        <stop offset="1" stopColor="#070F0B" />
                    </radialGradient>
                </defs>
                <rect x={8} y={8} width={284} height={424} rx={38} fill="url(#dmmHolster)" />
                <rect x={8} y={8} width={284} height={424} rx={38} fill="none" stroke="#9A6F00" strokeWidth={2} />
                {[0, 1, 2, 3].map((i) => (
                    <g key={i}>
                        <rect x={13} y={150 + i * 34} width={12} height={22} rx={6} fill="#B98A00" />
                        <rect x={275} y={150 + i * 34} width={12} height={22} rx={6} fill="#B98A00" />
                    </g>
                ))}
                <rect x={30} y={24} width={240} height={392} rx={26} fill="#22262B" />
                <rect x={30} y={24} width={240} height={392} rx={26} fill="none" stroke="#101315" strokeWidth={2} />
                <text x={150} y={46} textAnchor="middle" fontSize={13} fontWeight={900} letterSpacing={2} fill="#F2F4F6">
                    HB TRONICS
                </text>
                <text x={150} y={58} textAnchor="middle" fontSize={7.5} fontWeight={700} letterSpacing={1.5} fill="#9AA1A9">
                    DMM-772 · TRUE RMS
                </text>
                <rect x={46} y={66} width={208} height={100} rx={10} fill="#0C0E10" />
                <rect x={52} y={72} width={196} height={88} rx={6} fill="url(#dmmScreen)" />
                <text x={62} y={88} fontSize={9} fontWeight={800} letterSpacing={1} fill="#7FE6AE">
                    {mode === "OFF" ? "OFF" : mode}
                </text>
                <text x={238} y={88} textAnchor="end" fontSize={9} fontWeight={800} fill="#7FE6AE">
                    {reading.flag === "JACK" ? "JACK" : reading.flag === "RANGE" ? "RANGE" : mode === "OFF" ? "" : "AUTO"}
                </text>
                <text
                    x={62}
                    y={126}
                    fontSize={34}
                    fontWeight={900}
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fill="#C8FFDF"
                    style={{ textShadow: "0 0 14px rgba(120,255,180,0.35)" }}
                >
                    {reading.value === "" ? " " : reading.value}
                </text>
                <text x={238} y={126} textAnchor="end" fontSize={12} fontWeight={800} fill="#8CEBB6">
                    {reading.unit}
                </text>
                <text x={62} y={150} fontSize={9.5} fontWeight={700} fill="#C8FFDF" opacity={0.75}>
                    {rangeText.length > 32 ? `${rangeText.slice(0, 31)}…` : rangeText}
                </text>
                <circle cx={DIAL_CX} cy={DIAL_CY} r={DIAL_R} fill="#14171A" stroke="#3A3F45" strokeWidth={2} />
                {ROTARY_MODES.map((m) => {
                    const pos = dialPos(MODE_ANGLE[m], 62);
                    const active = m === mode;
                    return (
                        <g
                            key={m}
                            role="button"
                            tabIndex={0}
                            aria-label={m}
                            onClick={() => {
                                onMode(m);
                                sfx.play("dial");
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onMode(m);
                                    sfx.play("dial");
                                }
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <circle cx={pos.x} cy={pos.y} r={15} fill="transparent" />
                            <text
                                x={pos.x}
                                y={pos.y + 3.5}
                                textAnchor="middle"
                                fontSize={m === "OFF" ? 8 : 10}
                                fontWeight={900}
                                fill={active ? "#FFD23E" : "#C6CDD4"}
                            >
                                {MODE_LABEL[m]}
                            </text>
                        </g>
                    );
                })}
                <circle cx={DIAL_CX} cy={DIAL_CY} r={36} fill="url(#dmmKnob)" stroke="#5B636C" strokeWidth={2} />
                <line x1={DIAL_CX} y1={DIAL_CY} x2={knob.x} y2={knob.y} stroke="#F47822" strokeWidth={6} strokeLinecap="round" />
                <circle cx={DIAL_CX} cy={DIAL_CY} r={7} fill="#3A3F45" />
                <text x={150} y={350} textAnchor="middle" fontSize={9} fontWeight={800} letterSpacing={1.2} fill="#9AA1A9">
                    LEADS — click a jack to seat
                </text>
                {JACKS.map((jack) => {
                    const x = JACK_X[jack];
                    const isCom = jack === "COM";
                    const redSeated = redJack === jack;
                    const blackSeated = blackJack === jack;
                    const needs = suggested === jack && !redSeated;
                    const err = jackError && !isCom && !needs;
                    return (
                        <g
                            key={jack}
                            role="button"
                            tabIndex={0}
                            aria-label={`${jack} jack`}
                            onClick={() => seatClick(jack)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    seatClick(jack);
                                }
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <circle
                                cx={x}
                                cy={JACK_Y}
                                r={14}
                                fill="#0B0E10"
                                stroke={needs ? "#F47822" : err ? "#EF4444" : isCom ? "#E8EBEE" : redSeated || blackSeated ? "#7FE6AE" : "#3B4650"}
                                strokeWidth={needs || err ? 3 : 1.5}
                            />
                            <circle cx={x} cy={JACK_Y} r={5} fill="#000" />
                            {redSeated && <rect x={x - 4} y={JACK_Y - 26} width={8} height={16} rx={3} fill="#D92D20" stroke="#7A130C" strokeWidth={1} />}
                            {blackSeated && <rect x={x - 4} y={JACK_Y - 26} width={8} height={16} rx={3} fill="#23272B" stroke="#000" strokeWidth={1} />}
                            <text x={x} y={JACK_Y + 26} textAnchor="middle" fontSize={9} fontWeight={800} fill={needs ? "#FFD23E" : "#E8EBEE"}>
                                {jack}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
