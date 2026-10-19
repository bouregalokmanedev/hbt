import {
    Activity,
    AppWindow,
    Armchair,
    Battery,
    Circle,
    CircleGauge,
    CircleParking,
    Cog,
    Cpu,
    Disc3,
    Droplet,
    Droplets,
    Filter,
    Flame,
    Fuel,
    Gauge,
    LayoutDashboard,
    Lightbulb,
    MoveVertical,
    PanelTop,
    Radar,
    RotateCcw,
    ShieldAlert,
    Snowflake,
    Truck,
    Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SpecialFunctionDef {
    id: string;
    label: string;
    icon: LucideIcon;
}

/**
 * The special-function catalogue mirrors the scanner tool menu (XTOOL-style
 * "Special Function" screen): the same 26 functions, in the same order.
 */
export const SPECIAL_FUNCTIONS: readonly SpecialFunctionDef[] = [
    { id: "power-balance", label: "Power Balance", icon: Activity },
    { id: "abs-bleeding", label: "ABS Bleeding", icon: Droplets },
    { id: "tpms-reset", label: "TPMS Reset", icon: CircleGauge },
    { id: "injector-coding", label: "Injector Coding", icon: Fuel },
    { id: "windows-initialization", label: "Windows Initialization", icon: AppWindow },
    { id: "epb-reset", label: "EPB Reset", icon: CircleParking },
    { id: "seat-calibration", label: "Seat Calibration", icon: Armchair },
    { id: "oil-reset", label: "Oil Reset", icon: Droplet },
    { id: "control-unit-reset", label: "Control Unit Reset", icon: Cpu },
    { id: "transport-mode", label: "Transport Mode", icon: Truck },
    { id: "eps-adaptation", label: "EPS Adaptation", icon: Disc3 },
    { id: "gearbox-adaptation", label: "Gearbox Adaptation", icon: Cog },
    { id: "cam-sensor-adaptation", label: "Cam Sensor Adaptation", icon: Radar },
    { id: "dpf-regen", label: "DPF Regen", icon: Flame },
    { id: "airbag-reset", label: "Airbag Reset", icon: ShieldAlert },
    { id: "instrument-cluster", label: "Instrument Cluster", icon: LayoutDashboard },
    { id: "water-pump-actuation", label: "Water Pump Actuation", icon: Waves },
    { id: "ac-relearn", label: "A/C Relearn", icon: Snowflake },
    { id: "throttle-adaptation", label: "Throttle Adaptation", icon: Gauge },
    { id: "headlight", label: "Headlight", icon: Lightbulb },
    { id: "suspension-adaptation", label: "Suspension Adaptation", icon: MoveVertical },
    { id: "sunroof-initialization", label: "Sunroof Initialization", icon: PanelTop },
    { id: "tire-size-reset", label: "Tire Size Reset", icon: Circle },
    { id: "bms-reset", label: "BMS Reset", icon: Battery },
    { id: "cps-reset", label: "CPS Reset", icon: RotateCcw },
    { id: "gpf-regen", label: "GPF Regen", icon: Filter },
];

export function specialFunctionLabel(id: string): string | null {
    return SPECIAL_FUNCTIONS.find((fn) => fn.id === id)?.label ?? null;
}
