import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CSSProperties, ComponentType } from "react";
import {
    CarFront,
    CloudDownload,
    Cog,
    FilePlus2,
    Settings,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import hbtLogo from "@/assets/brand/hbt-logo-full.png";

import { ObdLinkTool } from "./ObdLinkTool";
import { DeviceStage3D } from "./DeviceStage3D";
import { MissionPanel } from "./MissionPanel";
import { StartChecklist } from "./onboarding/StartChecklist";
import { TourOverlay } from "./onboarding/TourOverlay";
import { DiagnosisFlow, type DiagnosisMenuAction } from "./diagnosis/DiagnosisFlow";
import { ObdGateModal } from "./diagnosis/chrome";
import { ReportsScreen } from "./ReportsScreen";
import { SettingsCard } from "./SettingsCard";
import { UpdatesCard } from "./UpdatesCard";
import { SpecialFunctionsFlow } from "./specialfunctions/SpecialFunctionsFlow";
import {
    isTourDone,
    markScannerStep,
} from "../lib/scannerProgress";
import { linkCablePath } from "../lib/linkCable";

const BRIGHTNESS_KEY = "hbt:scanner-brightness";

function readBrightness(): number {
    const raw = Number.parseFloat(localStorage.getItem(BRIGHTNESS_KEY) ?? "");
    if (Number.isFinite(raw) && raw >= 0.7 && raw <= 1.3) return raw;
    return 1;
}

/* Front-end rebuild of the HBTronics diagnostic tablet home screen.
   Device casing + screen rendered as real markup, container-query scaled
   to stay on a single viewport. Every tile is a live button ready to be
   linked to the new scanner lab builder. */

const BLUE_TILE =
    "linear-gradient(155deg, #2a7be0 0%, #1663cc 48%, #0e4fb4 100%)";
const RED_PANEL =
    "linear-gradient(160deg, #e03a54 0%, #c21f45 42%, #9e1236 100%)";
const SCREEN_BG =
    "linear-gradient(180deg, #e8f1fb 0%, #f4f8fd 38%, #e3ecf7 100%)";
const DEVICE_BG =
    "linear-gradient(180deg, #2c3038 0%, #1a1d23 45%, #101318 100%)";

/* Silver bezel frame that surrounds every button (XTOOL-style stroke). */
const FRAME_BG =
    "linear-gradient(180deg, #eef3f9 0%, #d7e1ec 55%, #c5d2e0 100%)";
const FRAME_SHADOW =
    "inset 0 1px 0 rgba(255,255,255,.95), 0 0.5cqw 1.4cqw rgba(30,60,110,.18)";

const TILE_SHADOW =
    "inset 0 1px 0 rgba(255,255,255,.22), 0 0.3cqw 0.9cqw rgba(12,50,120,.18)";
const RED_SHADOW =
    "inset 0 1px 0 rgba(255,255,255,.18), 0 0.3cqw 0.9cqw rgba(120,10,40,.22)";

export type ScannerToolAction =
    | "special"
    | "report"
    | "diagnosis"
    | "updates"
    | "setting";

type GlyphProps = { strokeWidth?: number; style?: CSSProperties };
type Glyph = ComponentType<GlyphProps>;

/* Custom glyphs scale their inner 1em shapes from the width they are given. */
function glyphBox(style?: CSSProperties): CSSProperties {
    const size = style?.width;
    return {
        ...style,
        width: size,
        height: style?.height ?? size,
        fontSize: typeof size === "string" ? size : undefined,
        lineHeight: 0,
    };
}

type ToolTileProps = {
    label: string;
    icon: Glyph;
    onSelect?: (action: ScannerToolAction) => void;
    action: ScannerToolAction;
    /** Extra handler (e.g. switch the tablet screen); onSelect still fires. */
    onClick?: () => void;
};

const TILE_BTN = `
    relative flex h-full w-full flex-col items-center justify-center
    rounded-[1.55cqw] text-white
    transition duration-200 ease-out
    hover:-translate-y-[0.4cqw] hover:brightness-[1.07]
    hover:shadow-[0_1cqw_2.2cqw_rgba(12,50,180,.3)]
    active:translate-y-0 active:brightness-100
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-white
    focus-visible:outline-offset-[-2px]
`;

const FRAME =
    "min-h-0 rounded-[2.15cqw] p-[0.6cqw]";
const FRAME_STYLE = {
    background: FRAME_BG,
    boxShadow: FRAME_SHADOW,
} as const;

function ToolTile({ label, icon: Icon, onSelect, action, onClick }: ToolTileProps) {
    return (
        <div className={FRAME} style={FRAME_STYLE}>
            <button
                type="button"
                title={label}
                aria-label={label}
                onClick={() => {
                    onSelect?.(action);
                    onClick?.();
                }}
                className={TILE_BTN}
                style={{ background: BLUE_TILE, boxShadow: TILE_SHADOW }}
            >
                <Icon
                    strokeWidth={1.8}
                    style={{ width: "7.2cqw", height: "7.2cqw" }}
                />
                <span
                    className="mt-[1.4cqw] font-bold text-center px-[1cqw]"
                    style={{ fontSize: "2.5cqw", lineHeight: 1.25 }}
                >
                    {label}
                </span>
            </button>
        </div>
    );
}

type Props = {
    onSelect?: (action: ScannerToolAction) => void;
    onDiagnosisMenuAction?: (action: DiagnosisMenuAction) => void;
    /** Force the first-use tour open (e.g. from the lab intro card). */
    forceTour?: boolean;
};

export function ScannerToolHome({ onSelect, onDiagnosisMenuAction, forceTour = false }: Props) {
    const { t, i18n } = useTranslation();
    const th = "simulator.scannerLab.toolHome";
    const [obdConnected, setObdConnected] = useState(false);
    const [backAtRest, setBackAtRest] = useState(false);
    const [view, setView] = useState<
        "home" | "diagnosis" | "special" | "reports" | "settings" | "updates"
    >("home");
    const [obdNotice, setObdNotice] = useState<null | "connect" | "block">(null);
    const [tourOpen, setTourOpen] = useState(false);
    const [booting, setBooting] = useState(true);
    const [brightness, setBrightness] = useState(readBrightness);
    const wasConnectedRef = useRef(false);
    const tourStartedRef = useRef(false);
    const reduceMotion = useReducedMotion();

    /* Boot splash: a short branded overlay the first time the tablet is
       shown this session. It sits ABOVE the home screen (which stays
       mounted underneath) so nothing else has to wait for it. */
    useEffect(() => {
        if (!booting) return;
        const duration = reduceMotion ? 250 : 1400;
        const id = window.setTimeout(() => setBooting(false), duration);
        return () => window.clearTimeout(id);
    }, [booting, reduceMotion]);

    /* Open the tour once on first visit, or again when forced (intro card). */
    useEffect(() => {
        if (forceTour) {
            setTourOpen(true);
            return;
        }
        if (tourStartedRef.current) return;
        if (!isTourDone()) {
            tourStartedRef.current = true;
            setTourOpen(true);
        }
    }, [forceTour]);

    /* Watchdog: if the OBD link is unplugged mid-scan (inside Diagnosis or
       Special Function), block the screen immediately — a diagnosis in
       progress must not keep showing data until the link is restored. */
    useEffect(() => {
        if (obdConnected) {
            wasConnectedRef.current = true;
            markScannerStep("plugged");
        }
        if (view === "home") {
            setObdNotice((notice) => (notice === "block" ? null : notice));
            return;
        }
        if (!obdConnected && wasConnectedRef.current) {
            if (view === "diagnosis" || view === "special") setObdNotice("block");
            else if (view === "reports") setObdNotice("connect");
            // Settings/Updates work without the link — no gate.
        }
    }, [obdConnected, view]);

    /* Diagnosis and Special Function are locked until the OBD link is
       plugged in — tapping them unplugged opens the connect notice. */
    const enterLockedView = (next: "diagnosis" | "special") => {
        if (!obdConnected) {
            setObdNotice("connect");
            return;
        }
        if (next === "diagnosis") markScannerStep("diagnosis");
        setView(next);
    };

    const changeBrightness = (value: number) => {
        setBrightness(value);
        localStorage.setItem(BRIGHTNESS_KEY, String(value));
    };

    return (
        <div
            style={{ containerType: "inline-size" }}
            className="mx-auto w-[min(100%,calc((100dvh-10rem)*1.85))] select-none"
        >
            <div className="relative flex items-stretch gap-[1.6cqw]">
            {/* ==================== DEVICE (3D stage) ==================== */}
            <DeviceStage3D
                label={t(`${th}.screenAlt`)}
                cableConnected={obdConnected}
                onBackAtRest={setBackAtRest}
            >
            <div
                data-tour="tablet"
                role="group"
                aria-label={t(`${th}.screenAlt`)}
                className="relative h-full w-full rounded-[3.2cqw] p-[1.8cqw] pt-[2.4cqw] pb-[2.8cqw]"
                style={{
                    background: DEVICE_BG,
                    boxShadow:
                        "0 2.4cqw 6cqw rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08)",
                }}
            >
                {/* side grip ridges */}
                {[0, 1].map((side) => (
                    <div
                        key={side}
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-y-[18%] flex flex-col justify-center gap-[1.4cqw] ${
                            side === 0 ? "left-[0.45cqw]" : "right-[0.45cqw]"
                        }`}
                    >
                        {[0, 1, 2, 3].map((bar) => (
                            <span
                                key={bar}
                                className="block h-[3cqw] w-[1.5cqw] rounded-[0.4cqw]"
                                style={{
                                    background:
                                        "linear-gradient(180deg, #3a3f48 0%, #23262d 60%, #14161a 100%)",
                                    boxShadow:
                                        "inset 0 1px 0 rgba(255,255,255,.06)",
                                }}
                            />
                        ))}
                    </div>
                ))}

                {/* ==================== SCREEN ==================== */}
                <div
                    data-device-screen
                    className="relative z-10 h-full w-full overflow-hidden rounded-[1.4cqw]"
                    style={{
                        background: SCREEN_BG,
                        boxShadow: "inset 0 0 2.4cqw rgba(30,70,140,.10)",
                        ...(brightness !== 1
                            ? { filter: `brightness(${brightness})` }
                            : null),
                    }}
                >
                    {/* Boot splash — fades in, then unmounts when ready. */}
                    {booting ? (
                        <motion.div
                            key="boot"
                            data-testid="scanner-boot"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: reduceMotion ? 0.1 : 0.35 }}
                            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-[1.6cqw]"
                            style={{
                                background:
                                    "linear-gradient(180deg, #101318 0%, #1a1d23 55%, #0c0e12 100%)",
                            }}
                        >
                                <img
                                    src={hbtLogo}
                                    alt=""
                                    aria-hidden="true"
                                    className="h-[7cqw] w-auto object-contain opacity-95"
                                />
                                <p
                                    className="font-bold tracking-[0.3em] text-white/60 uppercase"
                                    style={{ fontSize: "1.3cqw" }}
                                >
                                    {t(`${th}.bootLine`)}
                                </p>
                                <div
                                    className="h-[0.5cqw] w-[24cqw] overflow-hidden rounded-full bg-white/10"
                                    role="progressbar"
                                    aria-label={t(`${th}.bootLine`)}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                >
                                    <motion.div
                                        data-testid="scanner-boot-bar"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{
                                            duration: reduceMotion ? 0.2 : 1.2,
                                            ease: "easeInOut",
                                        }}
                                        className="h-full rounded-full"
                                        style={{
                                            background:
                                                "linear-gradient(90deg, #F47822, #ffb37a)",
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ) : null}

                    {view === "diagnosis" ? (
                        <DiagnosisFlow
                            onExit={() => setView("home")}
                            vciConnected={obdConnected}
                            onMenuAction={onDiagnosisMenuAction}
                        />
                    ) : view === "special" ? (
                        <SpecialFunctionsFlow
                            onExit={() => setView("home")}
                            vciConnected={obdConnected}
                        />
                    ) : view === "reports" ? (
                        <ReportsScreen onExit={() => setView("home")} />
                    ) : view === "settings" ? (
                        <SettingsCard
                            vciConnected={obdConnected}
                            brightness={brightness}
                            onBrightnessChange={changeBrightness}
                            onExit={() => setView("home")}
                            onReplayTour={() => {
                                setView("home");
                                setTourOpen(true);
                            }}
                        />
                    ) : view === "updates" ? (
                        <UpdatesCard
                            vciConnected={obdConnected}
                            onExit={() => setView("home")}
                        />
                    ) : (
                    <>
                    {/* OBD link notice — only displayed while the link is
                        unplugged; plugging in shows no "connected" message
                        (the physical tool's green LED covers that state). */}
                    {!obdConnected ? (
                        <div
                            aria-live="polite"
                            className="absolute end-[1.6cqw] top-[1.4cqw] flex items-center gap-[0.6cqw] rounded-full px-[1.2cqw] py-[0.5cqw]"
                            style={{
                                fontSize: "1.25cqw",
                                fontWeight: 700,
                                background:
                                    "linear-gradient(180deg, #f4f7fa, #dde5ee)",
                                color: "#4a5563",
                                boxShadow: "0 0.3cqw 0.9cqw rgba(30,60,110,.14)",
                            }}
                        >
                            <span
                                className="block h-[0.9cqw] w-[0.9cqw] rounded-full"
                                style={{
                                    background:
                                        "radial-gradient(circle at 35% 30%, #d5dae1 0%, #98a2ae 60%, #5c6672 100%)",
                                }}
                            />
                            {t(`${th}.obdDisconnected`)}
                        </div>
                    ) : null}

                    <div className="flex h-full flex-col px-[3cqw] pt-[2.4cqw] pb-[2.8cqw]">
                        {/* ---- brand logo (same asset as the navbar) ---- */}
                        <div className="flex justify-center">
                            <img
                                src={hbtLogo}
                                alt="HBTronics"
                                className="h-[6.4cqw] w-auto object-contain"
                            />
                        </div>

                        {/* ---- tile grid ---- */}
                        <div
                            className="mt-[2.4cqw] grid min-h-0 flex-1 gap-[1.8cqw]"
                            style={{ gridTemplateColumns: "1fr 1.55fr 1fr" }}
                        >
                            {/* left column */}
                            <div
                                className="grid min-h-0 gap-[1.8cqw]"
                                style={{ gridTemplateRows: "1fr 1fr" }}
                            >
                                <ToolTile
                                    action="special"
                                    label={t(`${th}.specialFunction`)}
                                    icon={Cog}
                                    onSelect={onSelect}
                                    onClick={() => enterLockedView("special")}
                                />
                                <ToolTile
                                    action="report"
                                    label={t(`${th}.report`)}
                                    icon={FilePlus2}
                                    onSelect={onSelect}
                                    onClick={() => setView("reports")}
                                />
                            </div>

                            {/* center — DIAGNOSIS */}
                            <div className={FRAME} style={FRAME_STYLE}>
                                <button
                                    type="button"
                                    data-tour="tile-diagnosis"
                                    aria-label={t(`${th}.diagnosis`)}
                                    onClick={() => {
                                        onSelect?.("diagnosis");
                                        enterLockedView("diagnosis");
                                    }}
                                    className="flex h-full w-full flex-col items-center justify-center gap-[1.6cqw] rounded-[1.55cqw] px-[2cqw] text-white transition duration-200 hover:-translate-y-[0.35cqw] hover:brightness-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-[-2px]"
                                    style={{
                                        background: RED_PANEL,
                                        boxShadow: RED_SHADOW,
                                    }}
                                >
                                    <CarPulseGlyph
                                        strokeWidth={1.6}
                                        style={{
                                            width: "14cqw",
                                            height: "14cqw",
                                        }}
                                    />
                                    <span
                                        className="font-bold"
                                        style={{ fontSize: "3.4cqw" }}
                                    >
                                        {t(`${th}.diagnosis`)}
                                    </span>
                                    <span
                                        className="font-medium text-white/80"
                                        style={{ fontSize: "1.8cqw" }}
                                    >
                                        {t(`${th}.diagnosisSub`)}
                                    </span>
                                </button>
                            </div>

                            {/* right column */}
                            <div
                                className="grid min-h-0 gap-[1.8cqw]"
                                style={{ gridTemplateRows: "1fr 1fr" }}
                            >
                                <ToolTile
                                    action="updates"
                                    label={t(`${th}.updates`)}
                                    icon={CloudDownload}
                                    onSelect={onSelect}
                                    onClick={() => setView("updates")}
                                />
                                <ToolTile
                                    action="setting"
                                    label={t(`${th}.setting`)}
                                    icon={Settings}
                                    onSelect={onSelect}
                                    onClick={() => setView("settings")}
                                />
                            </div>
                        </div>
                    </div>
                    </>
                    )}

                    {obdNotice ? (
                        <ObdGateModal
                            mode={obdNotice === "block" ? "block" : "connect"}
                            vciConnected={obdConnected}
                            onCancel={
                                obdNotice === "block"
                                    ? undefined
                                    : () => setObdNotice(null)
                            }
                            onConfirm={() => setObdNotice(null)}
                        />
                    ) : null}

                    {view === "home" ? (
                        <>
                            <StartChecklist
                                onReplayTour={() => setTourOpen(true)}
                            />
                            <MissionPanel />
                        </>
                    ) : null}
                </div>
            </div>
            </DeviceStage3D>

            {/* ==================== OBD LINK TOOL (beside the screen) ==================== */}
            <div data-tour="obd-tool" className="flex min-w-0 flex-col">
                <ObdLinkTool onStatusChange={setObdConnected} />
            </div>

            {/* Rear dock cable → station plug: one continuous cable while the
                link is seated and the tablet rests on its back. Painted after
                both children so the seam lands on the station's own cable. */}
            {backAtRest && obdConnected ? (
                <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 1000 1000"
                    preserveAspectRatio="none"
                    style={{ overflow: "visible" }}
                >
                    <path
                        d={linkCablePath(i18n.dir() === "rtl")}
                        fill="none"
                        stroke="#0d0f13"
                        strokeWidth={17}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                    />
                    <path
                        d={linkCablePath(i18n.dir() === "rtl")}
                        fill="none"
                        stroke="#2e333c"
                        strokeWidth={6}
                        strokeLinecap="round"
                        strokeDasharray="196 36"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            ) : null}
            </div>

            <TourOverlay
                open={tourOpen}
                obdConnected={obdConnected}
                view={view}
                onFinish={() => setTourOpen(false)}
                onSkip={() => setTourOpen(false)}
            />
        </div>
    );
}

/* Diagnosis — car over an ECG trace (vehicle system health analysis). */
function CarPulseGlyph({ strokeWidth, style }: GlyphProps) {
    const sw = strokeWidth ?? 1.6;
    return (
        <span className="relative block" style={glyphBox(style)}>
            <CarFront
                strokeWidth={sw}
                style={{
                    width: "0.7em",
                    height: "0.7em",
                    display: "block",
                    margin: "0 auto",
                }}
            />
            <svg
                viewBox="0 0 48 16"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{
                    position: "absolute",
                    left: "0.05em",
                    bottom: 0,
                    width: "0.9em",
                    height: "0.3em",
                    display: "block",
                }}
            >
                <path d="M2 10h8l3.2-6 4.4 10.5 3.4-7.2 2.8 2.7H46" />
            </svg>
        </span>
    );
}
