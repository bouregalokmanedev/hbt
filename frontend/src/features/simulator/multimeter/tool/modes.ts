export type DialModeId =
    | "off"
    | "v200m"
    | "v2"
    | "v20"
    | "v200"
    | "v600"
    | "a10"
    | "cont"
    | "r200"
    | "r2k"
    | "r20k"
    | "r200k"
    | "r2m"
    | "r20m";

export interface DialMode {
    id: DialModeId;
    label: string;
    symbol: string;
    angle: number;
    value: string;
    unit: string;
    auto: boolean;
}

export const DIAL_MODES: DialMode[] = [
    { id: "cont", label: ")))", symbol: ")))", angle: -180, value: "0.003", unit: "\u03a9", auto: false },
    { id: "a10", label: "10", symbol: "A", angle: -154, value: "0.42", unit: "A DC", auto: false },
    { id: "v600", label: "600", symbol: "V", angle: -129, value: "125", unit: "V DC", auto: false },
    { id: "v200", label: "200", symbol: "V", angle: -103, value: "125.0", unit: "V DC", auto: false },
    { id: "v20", label: "20", symbol: "V", angle: -77, value: "12.50", unit: "V DC", auto: false },
    { id: "v2", label: "2", symbol: "V", angle: -51, value: "1.250", unit: "V DC", auto: false },
    { id: "v200m", label: "200m", symbol: "V", angle: -26, value: "124.5", unit: "mV DC", auto: false },
    { id: "off", label: "OFF", symbol: "", angle: 0, value: "", unit: "", auto: false },
    { id: "r20m", label: "20M", symbol: "\u03a9", angle: 26, value: "12.48", unit: "M\u03a9", auto: false },
    { id: "r2m", label: "2M", symbol: "\u03a9", angle: 51, value: "1.248", unit: "M\u03a9", auto: false },
    { id: "r200k", label: "200K", symbol: "\u03a9", angle: 77, value: "124.8", unit: "k\u03a9", auto: false },
    { id: "r20k", label: "20K", symbol: "\u03a9", angle: 103, value: "12.48", unit: "k\u03a9", auto: false },
    { id: "r2k", label: "2K", symbol: "\u03a9", angle: 129, value: "1.248", unit: "k\u03a9", auto: false },
    { id: "r200", label: "200", symbol: "\u03a9", angle: 154, value: "124.5", unit: "\u03a9", auto: false },
];

export const MODE_BY_ID = Object.fromEntries(DIAL_MODES.map((mode) => [mode.id, mode])) as Record<DialModeId, DialMode>;

function angularDistance(a: number, b: number) {
    const delta = Math.abs(a - b) % 360;
    return delta > 180 ? 360 - delta : delta;
}

export function nearestMode(angle: number): DialMode {
    return DIAL_MODES.reduce((best, mode) =>
        angularDistance(mode.angle, angle) < angularDistance(best.angle, angle) ? mode : best,
    );
}

export function angleForMode(id: DialModeId): number {
    return MODE_BY_ID[id].angle;
}
