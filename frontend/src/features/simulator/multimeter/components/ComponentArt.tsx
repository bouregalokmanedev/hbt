import type { SVGProps } from "react";

/**
 * Procedural SVG illustrations for common bench components so students
 * see the part, not just a code. Matched to `sym` on MeterProcedureComponent.
 */

export type ComponentSym =
    | "maf"
    | "map"
    | "inj"
    | "motorpot"
    | "coil"
    | "knock"
    | "ind"
    | "hall"
    | "pot2"
    | "lambda"
    | "ntc"
    | "generic";

const STROKE = "#3A3A3A";
const BODY = "#E8EBEE";
const ACCENT = "#F47822";
const SIGNAL = "#1F6AE1";

function Shell({ children, ...rest }: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 96 72" fill="none" aria-hidden focusable="false" {...rest}>
            {children}
        </svg>
    );
}

function PinRow({ pins, y = 58 }: { pins: number; y?: number }) {
    const gap = 72 / Math.max(pins, 1);
    return (
        <g>
            {Array.from({ length: pins }, (_, i) => {
                const x = 12 + gap * i + gap / 2;
                return (
                    <g key={i}>
                        <rect x={x - 3} y={y} width={6} height={10} rx={1.5} fill="#C5CBD2" stroke={STROKE} strokeWidth={0.8} />
                        <circle cx={x} cy={y + 12} r={2.2} fill="#8A9099" />
                    </g>
                );
            })}
        </g>
    );
}

export function ComponentArt({ sym, className }: { sym: string; className?: string }) {
    const s: SVGProps<SVGSVGElement> = { className, role: "img" };
    switch (sym) {
        case "maf":
            return (
                <Shell {...s} aria-label="Mass airflow sensor">
                    <path d="M8 28h48v24H8z" fill={BODY} stroke={STROKE} strokeWidth="1.5" />
                    <path d="M56 34h28v12H56z" fill="#D0D5DB" stroke={STROKE} strokeWidth="1.5" />
                    <path d="M14 34h36v12H14z" fill="#0E7C66" opacity="0.25" stroke="#0E7C66" strokeWidth="1" />
                    <path d="M20 40c8-6 16-6 24 0" stroke={SIGNAL} strokeWidth="1.5" fill="none" />
                    <circle cx="70" cy="40" r="3" fill={ACCENT} />
                    <PinRow pins={5} />
                </Shell>
            );
        case "map":
            return (
                <Shell {...s} aria-label="MAP sensor">
                    <rect x="24" y="14" width="48" height="36" rx="6" fill={BODY} stroke={STROKE} strokeWidth="1.5" />
                    <rect x="34" y="22" width="28" height="14" rx="3" fill="#0E7C66" opacity="0.3" stroke="#0E7C66" strokeWidth="1" />
                    <path d="M40 28h16M40 32h10" stroke={SIGNAL} strokeWidth="1.2" />
                    <circle cx="48" cy="44" r="3" fill={ACCENT} />
                    <PinRow pins={3} />
                </Shell>
            );
        case "inj":
            return (
                <Shell {...s} aria-label="Fuel injector">
                    <rect x="34" y="8" width="28" height="22" rx="4" fill="#2B3036" stroke={STROKE} strokeWidth="1.2" />
                    <rect x="38" y="12" width="20" height="8" rx="2" fill={ACCENT} opacity="0.85" />
                    <path d="M40 30h16v10l-4 8v6H44v-6l-4-8V30z" fill={BODY} stroke={STROKE} strokeWidth="1.4" />
                    <path d="M46 54h4v4h-4z" fill="#8A9099" />
                    <path d="M34 34h-8M62 34h8" stroke="#B4560F" strokeWidth="2" strokeLinecap="round" />
                    <PinRow pins={2} />
                </Shell>
            );
        case "motorpot":
            return (
                <Shell {...s} aria-label="Throttle body">
                    <circle cx="40" cy="32" r="22" fill={BODY} stroke={STROKE} strokeWidth="1.5" />
                    <circle cx="40" cy="32" r="12" fill="#9AA1A9" stroke={STROKE} strokeWidth="1" />
                    <path d="M32 32h16" stroke={STROKE} strokeWidth="2" />
                    <rect x="62" y="22" width="22" height="20" rx="3" fill="#2B3036" stroke={STROKE} strokeWidth="1" />
                    <path d="M66 28h14M66 32h10M66 36h12" stroke={SIGNAL} strokeWidth="1.2" />
                    <PinRow pins={6} />
                </Shell>
            );
        case "coil":
            return (
                <Shell {...s} aria-label="Ignition coil">
                    <rect x="30" y="6" width="36" height="40" rx="6" fill="#2B3036" stroke={STROKE} strokeWidth="1.4" />
                    <rect x="36" y="12" width="24" height="18" rx="3" fill={ACCENT} opacity="0.75" />
                    <path d="M42 46v10M54 46v10" stroke="#8A9099" strokeWidth="2" />
                    <path d="M48 6l0 6" stroke={SIGNAL} strokeWidth="1.5" />
                    <circle cx="48" cy="50" r="3" fill="#C5CBD2" stroke={STROKE} />
                    <g transform="translate(12,50)">
                        <path d="M0 0h16v8H0z" fill={BODY} stroke={STROKE} strokeWidth="0.8" />
                        <text x="8" y="6" textAnchor="middle" fontSize="5" fontWeight="700" fill={STROKE}>A</text>
                    </g>
                    <g transform="translate(68,50)">
                        <path d="M0 0h16v8H0z" fill={BODY} stroke={STROKE} strokeWidth="0.8" />
                        <text x="8" y="6" textAnchor="middle" fontSize="5" fontWeight="700" fill={STROKE}>B</text>
                    </g>
                </Shell>
            );
        case "knock":
            return (
                <Shell {...s} aria-label="Knock sensor">
                    <circle cx="48" cy="30" r="18" fill={BODY} stroke={STROKE} strokeWidth="1.5" />
                    <circle cx="48" cy="30" r="7" fill="#9AA1A9" stroke={STROKE} />
                    <circle cx="48" cy="30" r="2.5" fill={ACCENT} />
                    <path d="M48 48v8" stroke={STROKE} strokeWidth="2" />
                    <path d="M20 30h10M66 30h10" stroke={SIGNAL} strokeWidth="1.5" strokeDasharray="2 2" />
                    <PinRow pins={2} />
                </Shell>
            );
        case "ind":
            return (
                <Shell {...s} aria-label="Crankshaft position sensor">
                    <rect x="28" y="16" width="20" height="36" rx="4" fill={BODY} stroke={STROKE} strokeWidth="1.4" />
                    <path d="M32 24h12M32 30h12M32 36h12" stroke={SIGNAL} strokeWidth="1.3" />
                    <circle cx="64" cy="34" r="14" fill="#C5CBD2" stroke={STROKE} strokeWidth="1.2" />
                    <circle cx="64" cy="34" r="4" fill="#8A9099" />
                    <path d="M64 20v4M64 44v4M50 34h4M74 34h4" stroke={STROKE} strokeWidth="1" />
                    <path d="M48 34h2" stroke={ACCENT} strokeWidth="2" />
                    <PinRow pins={2} />
                </Shell>
            );
        case "hall":
            return (
                <Shell {...s} aria-label="Camshaft position sensor">
                    <rect x="18" y="18" width="28" height="30" rx="4" fill={BODY} stroke={STROKE} strokeWidth="1.4" />
                    <rect x="24" y="24" width="16" height="10" rx="2" fill={SIGNAL} opacity="0.35" stroke={SIGNAL} />
                    <circle cx="66" cy="34" r="16" fill="#C5CBD2" stroke={STROKE} strokeWidth="1.2" />
                    <circle cx="66" cy="22" r="3" fill={STROKE} />
                    <circle cx="66" cy="46" r="3" fill={STROKE} />
                    <circle cx="54" cy="34" r="3" fill={STROKE} />
                    <circle cx="78" cy="34" r="3" fill={STROKE} />
                    <path d="M46 34h4" stroke={ACCENT} strokeWidth="2" />
                    <PinRow pins={3} />
                </Shell>
            );
        case "pot2":
            return (
                <Shell {...s} aria-label="Accelerator pedal position sensor">
                    <path d="M36 8h18l8 40H30l6-40z" fill={BODY} stroke={STROKE} strokeWidth="1.5" />
                    <rect x="34" y="40" width="24" height="14" rx="3" fill="#2B3036" stroke={STROKE} />
                    <path d="M38 44h16M38 48h12" stroke={SIGNAL} strokeWidth="1.2" />
                    <circle cx="45" cy="20" r="3" fill={ACCENT} />
                    <PinRow pins={6} />
                </Shell>
            );
        case "lambda":
            return (
                <Shell {...s} aria-label="Oxygen sensor">
                    <rect x="40" y="6" width="16" height="18" rx="3" fill="#2B3036" stroke={STROKE} strokeWidth="1.2" />
                    <path d="M44 24h8v8l4 6v6H40v-6l4-6v-8z" fill={BODY} stroke={STROKE} strokeWidth="1.3" />
                    <path d="M42 44h12v6H42z" fill="#9AA1A9" stroke={STROKE} />
                    <path d="M48 50v6" stroke={STROKE} strokeWidth="2" />
                    <path d="M40 12H28M56 12h12" stroke={SIGNAL} strokeWidth="1.4" />
                    <path d="M44 16h8" stroke={ACCENT} strokeWidth="1.5" />
                    <PinRow pins={4} />
                </Shell>
            );
        case "ntc":
            return (
                <Shell {...s} aria-label="Coolant temperature sensor">
                    <rect x="36" y="8" width="24" height="16" rx="3" fill="#2B3036" stroke={STROKE} strokeWidth="1.2" />
                    <path d="M40 24h16l4 10v8H36v-8l4-10z" fill={BODY} stroke={STROKE} strokeWidth="1.3" />
                    <path d="M42 42h12v6H42z" fill="#9AA1A9" stroke={STROKE} />
                    <path d="M40 12h-14M56 12h14" stroke={SIGNAL} strokeWidth="1.4" />
                    <path d="M22 34c6 4 10-4 16 0s10-4 16 0" stroke={ACCENT} strokeWidth="1.3" fill="none" />
                    <PinRow pins={2} />
                </Shell>
            );
        default:
            return (
                <Shell {...s} aria-label="Component">
                    <rect x="20" y="14" width="56" height="36" rx="6" fill={BODY} stroke={STROKE} strokeWidth="1.5" />
                    <circle cx="48" cy="32" r="8" fill={ACCENT} opacity="0.5" stroke={ACCENT} />
                    <PinRow pins={3} />
                </Shell>
            );
    }
}

/** Optional reference photo path for a component ref, if shipped in public assets. */
export function componentPhotoPath(ref: string): string | null {
    const map: Record<string, string> = {
        L3: "/assets/simulator/detail-L3.png",
        L1: "/assets/simulator/detail-L1.png",
        A1: "/assets/simulator/inj-photo.png",
        H3: "/assets/simulator/detail-H3.png",
        I1: "/assets/simulator/detail-I2.png",
        I2: "/assets/simulator/detail-I2.png",
        X1: "/assets/simulator/detail-X1.png",
        X7: "/assets/simulator/detail-X7.png",
        G1: "/assets/simulator/ref/app/1.png",
        U1: "/assets/simulator/detail-U1.png",
        T1: "/assets/simulator/detail-T1.png",
    };
    return map[ref] ?? null;
}

export function refPhotoFallback(ref: string): string | null {
    const map: Record<string, string> = {
        L3: "/assets/simulator/ref/maf/7.png",
        H3: "/assets/simulator/ref/throttle/1.png",
        I2: "/assets/simulator/ref/knock/img.jpeg",
        X1: "/assets/simulator/ref/crank/3.png",
        X7: "/assets/simulator/ref/cam/1.png",
        G1: "/assets/simulator/ref/app/1.png",
        U1: "/assets/simulator/ref/o2/6.png",
        T1: "/assets/simulator/ref/coolant/4.png",
        A1: "/assets/simulator/inj-photo.png",
    };
    return map[ref] ?? null;
}
