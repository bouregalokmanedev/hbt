import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

/* Physical OBD-II link station rendered beside the diagnostic tablet.
   The port, connector and cable are hand-built SVG artwork (metal bracket,
   beveled shell, gold pins, ribbed strain relief) so they read as real
   hardware. The connector is anchored on the port mouth: the seated pose
   overlaps it slightly, so there is zero gap and it stays stuck. */

export type ObdPhase = "idle" | "approach" | "align" | "seated" | "retract";

const DUR: Record<ObdPhase, number> = {
    idle: 0,
    approach: 420,
    align: 380,
    seated: 280,
    retract: 380,
};

const EASE_TRAVEL = "cubic-bezier(.3,.75,.25,1)";
const EASE_SNAP = "cubic-bezier(.35,1.5,.4,1)";

const POSE: Record<ObdPhase, { transform: string; duration: number; easing: string }> = {
    idle: {
        transform: "translateY(9.6cqw) translateZ(15cqw) rotateX(-15deg) rotateZ(3.5deg)",
        duration: DUR.retract,
        easing: EASE_TRAVEL,
    },
    approach: {
        transform: "translateY(4cqw) translateZ(7cqw) rotateX(-7deg) rotateZ(2deg)",
        duration: DUR.approach,
        easing: EASE_TRAVEL,
    },
    align: {
        transform: "translateY(0.7cqw) translateZ(1.4cqw) rotateX(-1.2deg) rotateZ(0deg)",
        duration: DUR.align,
        easing: EASE_TRAVEL,
    },
    /* presses INTO the port — face overlaps the mouth edge, flush, stuck */
    seated: {
        transform: "translateY(-0.45cqw) translateZ(0cqw) rotateX(0deg) rotateZ(0deg)",
        duration: DUR.seated,
        easing: EASE_SNAP,
    },
    retract: {
        transform: "translateY(4.6cqw) translateZ(8.5cqw) rotateX(-8.5deg) rotateZ(-2deg)",
        duration: DUR.retract,
        easing: EASE_TRAVEL,
    },
};

/* Cable lives INSIDE the connector SVG coordinate space (220-wide viewBox),
   starting under the strain-relief boot so wire and connector are one
   continuous object — no seam. Idle hangs in a long S-loop, seated pulls
   taut toward the tablet; the run exits off the bottom-left of the stage. */
const CABLE_D: Record<ObdPhase, string> = {
    idle: "M 110 118 C 108 210, 190 250, 150 350 C 115 440, 20 420, -60 540 C -100 600, -130 660, -170 740",
    approach: "M 110 118 C 110 220, 90 300, 50 400 C 20 470, -20 520, -60 600 C -90 660, -120 700, -155 760",
    align: "M 110 118 C 110 225, 80 310, 45 410 C 18 480, -18 530, -55 610 C -85 665, -115 705, -150 762",
    seated: "M 110 118 C 108 230, 60 330, 25 430 C 0 500, -30 550, -60 620 C -88 672, -115 710, -148 764",
    retract: "M 110 118 C 110 220, 90 300, 50 400 C 20 470, -20 520, -60 600 C -90 660, -120 700, -155 760",
};

/* ==================== plug / unplug sounds (Web Audio) ==================== */

let audioCtx: AudioContext | null = null;

function audio(): AudioContext | null {
    try {
        if (!audioCtx) {
            const Ctx =
                window.AudioContext ??
                (window as unknown as { webkitAudioContext?: typeof AudioContext })
                    .webkitAudioContext;
            if (!Ctx) return null;
            audioCtx = new Ctx();
        }
        if (audioCtx.state === "suspended") void audioCtx.resume();
        return audioCtx;
    } catch {
        return null;
    }
}

function noiseBurst(ctx: AudioContext, at: number, dur: number, gain: number, freq: number) {
    const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.frequency.value = freq;
    filt.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    src.connect(filt).connect(g).connect(ctx.destination);
    src.start(at);
    src.stop(at + dur);
}

function tone(
    ctx: AudioContext,
    at: number,
    f0: number,
    f1: number,
    dur: number,
    gain: number,
    type: OscillatorType = "sine",
) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + dur);
}

function playEnterSound() {
    const ctx = audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    noiseBurst(ctx, t, 0.02, 0.22, 3400);
    tone(ctx, t + 0.018, 950, 480, 0.03, 0.18, "square");
    noiseBurst(ctx, t + 0.05, 0.055, 0.4, 1150);
    tone(ctx, t + 0.05, 165, 68, 0.13, 0.5);
}

function playExitSound() {
    const ctx = audio();
    if (!ctx) return;
    const t = ctx.currentTime;
    noiseBurst(ctx, t, 0.03, 0.3, 2500);
    tone(ctx, t, 430, 175, 0.1, 0.28, "triangle");
    noiseBurst(ctx, t + 0.045, 0.06, 0.22, 850);
    tone(ctx, t + 0.05, 125, 58, 0.1, 0.22);
}

/* ==================== SVG hardware artwork ==================== */

/* Shared gradient / filter defs (unique ids scoped to this tool). */
function ObdDefs({ ledConnected }: { ledConnected: boolean }) {
    return (
        <defs>
            <linearGradient id="obd-metal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#d3dae3" />
                <stop offset=".42" stopColor="#97a1af" />
                <stop offset="1" stopColor="#59616d" />
            </linearGradient>
            <linearGradient id="obd-metal-edge" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#6a7380" />
                <stop offset=".5" stopColor="#b6bfcb" />
                <stop offset="1" stopColor="#6a7380" />
            </linearGradient>
            <radialGradient id="obd-screw" cx=".35" cy=".3" r=".85">
                <stop offset="0" stopColor="#e8edf3" />
                <stop offset=".55" stopColor="#98a2b0" />
                <stop offset="1" stopColor="#4a525d" />
            </radialGradient>
            <linearGradient id="obd-house" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#454b54" />
                <stop offset=".38" stopColor="#272c33" />
                <stop offset="1" stopColor="#14171c" />
            </linearGradient>
            <linearGradient id="obd-cavity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#020304" />
                <stop offset=".55" stopColor="#0a0c10" />
                <stop offset="1" stopColor="#171b21" />
            </linearGradient>
            <linearGradient id="obd-socket" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#000000" />
                <stop offset=".7" stopColor="#15191f" />
                <stop offset="1" stopColor="#2a3038" />
            </linearGradient>
            <linearGradient id="obd-shell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#525862" />
                <stop offset=".22" stopColor="#3a4049" />
                <stop offset=".62" stopColor="#22262d" />
                <stop offset="1" stopColor="#12151a" />
            </linearGradient>
            <linearGradient id="obd-face" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#31363e" />
                <stop offset=".5" stopColor="#22262c" />
                <stop offset="1" stopColor="#171a20" />
            </linearGradient>
            <linearGradient id="obd-gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff3c4" />
                <stop offset=".45" stopColor="#e6bc55" />
                <stop offset="1" stopColor="#8f6a18" />
            </linearGradient>
            <linearGradient id="obd-boot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2b3038" />
                <stop offset=".5" stopColor="#1a1e24" />
                <stop offset="1" stopColor="#0d0f13" />
            </linearGradient>
            <radialGradient id="obd-led-g" cx=".35" cy=".3" r=".85">
                <stop offset="0" stopColor="#c8ffdf" />
                <stop offset=".45" stopColor="#2fd878" />
                <stop offset="1" stopColor="#0b6b36" />
            </radialGradient>
            <radialGradient id="obd-led-r" cx=".35" cy=".3" r=".85">
                <stop offset="0" stopColor="#ffd2cc" />
                <stop offset=".45" stopColor="#e85448" />
                <stop offset="1" stopColor="#7e1a13" />
            </radialGradient>
            <radialGradient id="obd-led-glow" cx=".5" cy=".5" r=".5">
                <stop
                    offset="0"
                    stopColor={ledConnected ? "rgba(53,220,124,.75)" : "rgba(232,84,72,.5)"}
                />
                <stop offset="1" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
        </defs>
    );
}

/* Female OBD-II port mounted under the dash: steel bracket, screws,
   plastic housing, deep trapezoid cavity with 16 sockets. */
function ObdPortSvg({ seated }: { seated: boolean }) {
    const socketRows = [54, 70];
    return (
        <svg viewBox="0 0 220 118" className="block w-full" aria-hidden="true">
            <ObdDefs ledConnected={seated} />

            {/* mount ears */}
            {[0, 1].map((side) => (
                <g key={side} transform={side ? "translate(220,0) scale(-1,1)" : undefined}>
                    <path
                        d="M6 36 h34 a6 6 0 0 1 6 6 v30 a6 6 0 0 1 -6 6 h-34 a4 4 0 0 1 -4 -4 v-34 a4 4 0 0 1 4 -4 z"
                        fill="url(#obd-metal)"
                        stroke="#3d444e"
                        strokeWidth="1.2"
                    />
                    <path d="M8 40 h28" stroke="rgba(255,255,255,.45)" strokeWidth="1.2" />
                    {/* screw */}
                    <circle cx="24" cy="57" r="10" fill="url(#obd-screw)" stroke="#3d444e" strokeWidth="1" />
                    <circle cx="24" cy="57" r="5.5" fill="#6d7683" />
                    <path d="M19.5 57 h9" stroke="#2c323b" strokeWidth="1.8" strokeLinecap="round" />
                </g>
            ))}

            {/* housing */}
            <rect x="42" y="24" width="136" height="80" rx="10" fill="url(#obd-house)" stroke="#0b0d10" strokeWidth="1.4" />
            <path d="M52 28 h116" stroke="rgba(255,255,255,.16)" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M52 100 h116" stroke="rgba(0,0,0,.45)" strokeWidth="1.6" strokeLinecap="round" />

            {/* recessed cavity — wide-top trapezoid, softened corners */}
            <path
                d="M64 42 h92 q4 0 3.2 3.6 l-10 40 q-1 4 -5 4 h-68 q-4 0 -5 -4 l-10 -40 q-0.8 -3.6 3.2 -3.6 z"
                fill="url(#obd-cavity)"
                stroke="#05070a"
                strokeWidth="2.4"
                strokeLinejoin="round"
            />
            {/* inner top rim light (plastic bevel) */}
            <path
                d="M70 46 h80"
                stroke="rgba(255,255,255,.09)"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
            {/* guide bevels */}
            <path d="M64 56 l6 3 h-6 z" fill="#3a414b" />
            <path d="M156 56 l-6 3 h6 z" fill="#3a414b" />

            {/* 16 sockets, 2 × 8 */}
            {socketRows.map((y, row) =>
                Array.from({ length: 8 }).map((_, i) => {
                    const x = 72.5 + i * 10.6 - row * 1.6;
                    return (
                        <g key={`${row}-${i}`}>
                            <rect x={x} y={y} width="6.4" height="8.6" rx="1.6" fill="url(#obd-socket)" />
                            <path
                                d={`M${x + 1.2} ${y + 1.4} h4`}
                                stroke="rgba(255,255,255,.07)"
                                strokeWidth="1"
                                strokeLinecap="round"
                            />
                        </g>
                    );
                }),
            )}

            {/* seated underglow */}
            {seated && (
                <ellipse cx="110" cy="104" rx="52" ry="10" fill="rgba(53,220,124,.28)" />
            )}
        </svg>
    );
}

/* Male OBD-II connector + its cable as ONE object: the wire is drawn in
   the connector's own coordinate space, starting underneath the boot, so
   there is no seam between them. The boot's bottom step (x 97..123) caps
   the cable (stroke centered on x=110) and paints over its start point. */
function ObdConnectorSvg({ connected, phase }: { connected: boolean; phase: ObdPhase }) {
    const d = CABLE_D[phase];
    return (
        <svg
            viewBox="0 0 220 780"
            className="block w-full"
            style={{ overflow: "visible" }}
            aria-hidden="true"
        >
            <ObdDefs ledConnected={connected} />

            {/* ---- cable: floor shadow, sheath, edge shade, specular ---- */}
            <g style={{ transition: `opacity 300ms ${EASE_TRAVEL}` }}>
                <path
                    d={d}
                    fill="none"
                    stroke="rgba(20,30,45,.2)"
                    strokeWidth="36"
                    strokeLinecap="round"
                    transform="translate(5 10)"
                    style={{ transition: `d 300ms ${EASE_TRAVEL}` }}
                />
                <path
                    d={d}
                    fill="none"
                    stroke="#14171c"
                    strokeWidth="26"
                    strokeLinecap="round"
                    style={{ transition: `d 300ms ${EASE_TRAVEL}` }}
                />
                <path
                    d={d}
                    fill="none"
                    stroke="rgba(0,0,0,.5)"
                    strokeWidth="26"
                    strokeLinecap="round"
                    strokeDasharray="0.3 24"
                    transform="translate(0 9)"
                    opacity="0.35"
                    style={{ transition: `d 300ms ${EASE_TRAVEL}` }}
                />
                <path
                    d={d}
                    fill="none"
                    stroke="rgba(255,255,255,.16)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    transform="translate(-1.5 -8)"
                    style={{ transition: `d 300ms ${EASE_TRAVEL}` }}
                />
            </g>

            {/* latch clip on top */}
            <rect x="90" y="4" width="40" height="16" rx="5" fill="url(#obd-shell)" stroke="#0d0f13" strokeWidth="1.3" />
            <path d="M97 8 v8 M104 8 v8 M116 8 v8 M123 8 v8" stroke="rgba(0,0,0,.5)" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M93 6.5 h34" stroke="rgba(255,255,255,.22)" strokeWidth="1.4" strokeLinecap="round" />

            {/* side grips */}
            {[0, 1].map((side) => (
                <g key={side} transform={side ? "translate(220,0) scale(-1,1)" : undefined}>
                    <path
                        d="M40 30 q-10 4 -10 16 v28 q0 12 10 16 l8 -4 v-52 z"
                        fill="url(#obd-shell)"
                        stroke="#0d0f13"
                        strokeWidth="1.3"
                    />
                    {[38, 48, 58].map((y) => (
                        <path key={y} d={`M33 ${y} h12`} stroke="rgba(0,0,0,.55)" strokeWidth="2" strokeLinecap="round" />
                    ))}
                    <path d="M34 34 q-4 4 -4 12" stroke="rgba(255,255,255,.16)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                </g>
            ))}

            {/* main shell — wide-top trapezoid, rounded corners */}
            <path
                d="M40 22 h140 q5 0 4.4 5 l-13 58 q-1 5 -6 5 h-110.8 q-5 0 -6 -5 l-13 -58 q-0.6 -5 4.4 -5 z"
                fill="url(#obd-shell)"
                stroke="#0b0d10"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
            {/* top highlight + bottom shade for volume */}
            <path d="M48 26 h124" stroke="rgba(255,255,255,.28)" strokeWidth="2" strokeLinecap="round" />
            <path d="M56 86 h108" stroke="rgba(0,0,0,.5)" strokeWidth="2.2" strokeLinecap="round" />

            {/* inset face plate */}
            <path
                d="M56 34 h108 q3 0 2.6 3.2 l-9.5 38 q-0.7 3 -3.6 3 h-87 q-2.9 0 -3.6 -3 l-9.5 -38 q-0.4 -3.2 2.6 -3.2 z"
                fill="url(#obd-face)"
                stroke="#0a0c0f"
                strokeWidth="1.4"
                strokeLinejoin="round"
            />

            {/* 16 gold pins, 2 × 8 */}
            {[48, 63].map((y, row) =>
                Array.from({ length: 8 }).map((_, i) => {
                    const x = 68 + i * 11 - row * 1.8;
                    return (
                        <g key={`${row}-${i}`}>
                            <rect x={x} y={y} width="6.8" height="9.4" rx="1.8" fill="#0c0e12" />
                            <rect x={x + 1.3} y={y + 1.5} width="4.2" height="6.4" rx="1.2" fill="url(#obd-gold)" />
                            <path
                                d={`M${x + 2} ${y + 2.4} h2.8`}
                                stroke="rgba(255,255,255,.55)"
                                strokeWidth="0.9"
                                strokeLinecap="round"
                            />
                        </g>
                    );
                }),
            )}

            {/* status LED + glow */}
            <circle cx="191" cy="52" r="12" fill="url(#obd-led-glow)" />
            <circle cx="191" cy="52" r="5.2" fill={connected ? "url(#obd-led-g)" : "url(#obd-led-r)"} stroke="#0b0d10" strokeWidth="1" />
            <circle cx="189.4" cy="50.4" r="1.6" fill="rgba(255,255,255,.75)" />

            {/* stepped strain-relief boot */}
            <rect x="74" y="92" width="72" height="9" rx="3.5" fill="url(#obd-boot)" stroke="#0a0c0f" strokeWidth="1.1" />
            <rect x="82" y="100" width="56" height="9" rx="3.5" fill="url(#obd-boot)" stroke="#0a0c0f" strokeWidth="1.1" />
            <rect x="90" y="108" width="40" height="9" rx="3.5" fill="url(#obd-boot)" stroke="#0a0c0f" strokeWidth="1.1" />
            <rect x="97" y="116" width="26" height="8" rx="3.5" fill="url(#obd-boot)" stroke="#0a0c0f" strokeWidth="1.1" />
            {[95.5, 103.5, 111.5].map((y) => (
                <path
                    key={y}
                    d={`M${y < 100 ? 78 : y < 108 ? 86 : 94} ${y} h${y < 100 ? 64 : y < 108 ? 48 : 32}`}
                    stroke="rgba(255,255,255,.1)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />
            ))}
            {/* boot top ring highlight where it meets the shell */}
            <path d="M78 93 h64" stroke="rgba(255,255,255,.14)" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
    );
}

type Props = {
    onStatusChange?: (connected: boolean) => void;
};

export function ObdLinkTool({ onStatusChange }: Props) {
    const { t } = useTranslation();
    const th = "simulator.scannerLab.toolHome";

    const [phase, setPhase] = useState<ObdPhase>("idle");
    const timers = useRef<number[]>([]);
    const report = useRef(onStatusChange);
    report.current = onStatusChange;

    useEffect(() => () => timers.current.forEach((id) => clearTimeout(id)), []);

    const busy = phase !== "idle" && phase !== "seated";
    const connected = phase === "seated";

    const toggle = useCallback(() => {
        if (busy) return;
        /* resume audio inside the user gesture so later sounds may play */
        audio();
        if (phase === "idle") {
            setPhase("approach");
            timers.current.push(
                window.setTimeout(() => setPhase("align"), DUR.approach),
            );
            timers.current.push(
                window.setTimeout(() => {
                    setPhase("seated");
                    playEnterSound();
                    report.current?.(true);
                }, DUR.approach + DUR.align),
            );
        } else {
            setPhase("retract");
            playExitSound();
            timers.current.push(
                window.setTimeout(() => {
                    setPhase("idle");
                    report.current?.(false);
                }, DUR.retract),
            );
        }
    }, [busy, phase]);

    const pose = POSE[phase];
    const ariaLabel = busy
        ? t(`${th}.obdBusyAria`)
        : connected
          ? t(`${th}.obdUnplugAria`)
          : t(`${th}.obdPlugAria`);
    const hint = busy
        ? t(`${th}.obdWorking`)
        : connected
          ? t(`${th}.obdHintUnplug`)
          : t(`${th}.obdHintPlug`);

    return (
        <div
            aria-label={t(`${th}.obdTitle`)}
            className="relative flex w-[19cqw] flex-1 select-none flex-col overflow-hidden rounded-[2.15cqw] p-[0.6cqw]"
            style={{
                background: "linear-gradient(180deg, #eef3f9 0%, #d7e1ec 55%, #c5d2e0 100%)",
                boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,.95), 0 0.5cqw 1.4cqw rgba(30,60,110,.18)",
            }}
        >
            <style>{`
                @keyframes obd-sway {
                    0%, 100% { transform: rotateZ(-1.4deg); }
                    50% { transform: rotateZ(1.8deg); }
                }
                @keyframes obd-click {
                    0% { opacity: 0; }
                    30% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes obd-hint-pulse {
                    0%, 100% { opacity: .45; transform: scale(1); }
                    50% { opacity: .9; transform: scale(1.06); }
                }
            `}</style>

            {/* ---- title ---- */}
            <div
                className="shrink-0 rounded-[1.3cqw] bg-[#101318] px-[1.2cqw] py-[0.7cqw] text-center font-bold uppercase text-white/85"
                style={{
                    fontSize: "1.3cqw",
                    letterSpacing: "0.14em",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
                }}
            >
                {t(`${th}.obdTitle`)}
            </div>

            {/* ---- interactive 3D stage ---- */}
            <button
                type="button"
                aria-label={ariaLabel}
                aria-disabled={busy || undefined}
                onClick={toggle}
                className="group relative mt-[0.8cqw] min-h-0 flex-1 cursor-pointer rounded-[1.3cqw] transition-[filter] duration-200 hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1663cc] focus-visible:outline-offset-[-2px]"
                style={{ background: "linear-gradient(180deg, #e3eaf3 0%, #c6d2e0 100%)" }}
            >
                <div
                    className="absolute inset-0 overflow-hidden rounded-[1.3cqw]"
                    style={{ perspective: "70cqw", perspectiveOrigin: "50% 28%" }}
                >
                    {/* wall + floor */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(180deg, #d5deea 0%, #c9d4e2 52%, #b3c0d0 53%, #a3b1c2 100%)",
                        }}
                    />
                    {/* wall vignette */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,.35) 0%, rgba(90,110,135,.18) 100%)",
                        }}
                    />
                    {/* floor sheen */}
                    <div
                        className="absolute inset-x-0 bottom-0 h-[44%]"
                        style={{
                            background:
                                "linear-gradient(180deg, rgba(255,255,255,.14) 0%, rgba(70,88,110,.12) 100%)",
                        }}
                    />

                    {/* ---- dashboard underside ---- */}
                    <div
                        className="absolute inset-x-0 top-0"
                        style={{
                            height: "30%",
                            background:
                                "linear-gradient(180deg, #262a31 0%, #1b1f25 58%, #12151a 100%)",
                            boxShadow: "0 2px 8px rgba(15,25,40,.35)",
                        }}
                    >
                        {/* plastic grain */}
                        <div
                            className="absolute inset-0 opacity-30"
                            style={{
                                background:
                                    "repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px)",
                            }}
                        />
                        {/* vent slats */}
                        <div className="absolute left-[8%] top-[22%] flex gap-[0.5cqw]">
                            {[0, 1, 2, 3].map((i) => (
                                <span
                                    key={i}
                                    className="block h-[0.55cqw] w-[2.6cqw] rounded-full"
                                    style={{
                                        background: "linear-gradient(180deg, #0c0e12, #2c313a)",
                                        boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
                                    }}
                                />
                            ))}
                        </div>
                        {/* lower trim lip */}
                        <div
                            className="absolute inset-x-0 bottom-0 h-[20%]"
                            style={{
                                background: "linear-gradient(180deg, #434952 0%, #23272e 100%)",
                                boxShadow: "0 1px 0 rgba(0,0,0,.55)",
                            }}
                        />
                        {/* fuse box + column hints */}
                        <div
                            className="absolute rounded-[0.4cqw] bg-[#101318]"
                            style={{
                                left: "7%",
                                bottom: "-10%",
                                width: "22%",
                                height: "36%",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,.07)",
                            }}
                        />
                        <div
                            className="absolute rounded-full bg-[#0d0f13]"
                            style={{
                                right: "7%",
                                top: "30%",
                                width: "15%",
                                height: "96%",
                                transform: "rotate(13deg)",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
                            }}
                        />
                    </div>

                    {/* ---- link assembly: port + connector share one anchor ---- */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{ top: "26%", width: "11.5cqw" }}
                    >
                        {/* female port on its bracket */}
                        <ObdPortSvg seated={connected} />

                        {/* seat click flash */}
                        {phase === "seated" && (
                            <span
                                className="pointer-events-none absolute inset-x-[10%] top-[30%] h-[40%] rounded-full"
                                style={{
                                    background:
                                        "radial-gradient(ellipse at 50% 50%, rgba(120,220,160,.5) 0%, rgba(120,220,160,0) 70%)",
                                    animation: "obd-click 280ms ease-out",
                                }}
                            />
                        )}

                        {/* connector layer — anchored on the port mouth bottom,
                            seated face overlaps the mouth edge: zero gap */}
                        <div
                            className="absolute"
                            style={{
                                top: "calc(72% - 0.35cqw)",
                                left: "9%",
                                right: "9%",
                                height: "22cqw",
                            }}
                        >
                            <div
                                className="relative h-full w-full"
                                style={{
                                    transformStyle: "preserve-3d",
                                    transformOrigin: "50% 0%",
                                    transform: pose.transform,
                                    transition: `transform ${pose.duration}ms ${pose.easing}`,
                                    filter: "drop-shadow(0 0.8cqw 1.2cqw rgba(15,30,55,.4))",
                                }}
                            >
                                {/* idle affordance halo + sway */}
                                <div
                                    className="absolute inset-x-0 top-0"
                                    style={{ transformOrigin: "50% 0%" }}
                                >
                                    {phase === "idle" && (
                                        <span
                                            className="pointer-events-none absolute left-1/2 top-[1%] h-[7cqw] w-[10cqw] -translate-x-1/2 rounded-full group-hover:opacity-0"
                                            style={{
                                                background:
                                                    "radial-gradient(ellipse at 50% 40%, rgba(22,99,204,.35) 0%, rgba(22,99,204,0) 70%)",
                                                animation: "obd-hint-pulse 2.2s ease-in-out infinite",
                                            }}
                                        />
                                    )}
                                    <div
                                        className="relative"
                                        style={{
                                            transformOrigin: "50% 0%",
                                            animation:
                                                phase === "idle"
                                                    ? "obd-sway 3.4s ease-in-out infinite"
                                                    : "none",
                                        }}
                                    >
                                        <ObdConnectorSvg connected={connected} phase={phase} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </button>

            {/* ---- status footer ---- */}
            <div
                aria-live="polite"
                className="mt-[0.8cqw] flex shrink-0 items-center justify-center gap-[0.7cqw] rounded-[1.3cqw] px-[1cqw] py-[0.75cqw]"
                style={{
                    background: connected
                        ? "linear-gradient(180deg, #e7f9ee 0%, #c9efd7 100%)"
                        : "linear-gradient(180deg, #f4f7fa 0%, #dde5ee 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.9)",
                }}
            >
                <span
                    className="block h-[1cqw] w-[1cqw] rounded-full"
                    style={{
                        background: busy
                            ? "radial-gradient(circle at 35% 30%, #ffe9a0 0%, #f0a51e 60%, #a06a08 100%)"
                            : connected
                              ? "radial-gradient(circle at 35% 30%, #9dffc4 0%, #23c96a 55%, #0e7a3d 100%)"
                              : "radial-gradient(circle at 35% 30%, #d5dae1 0%, #98a2ae 60%, #5c6672 100%)",
                        boxShadow: connected ? "0 0 0.6cqw rgba(35,201,106,.55)" : "none",
                    }}
                />
                <span
                    /* Connected state is conveyed by the green LED only —
                       the text message shows while unplugged (or working). */
                    className={connected ? "sr-only" : "font-bold"}
                    style={{
                        fontSize: "1.2cqw",
                        color: connected ? "#0e7a3d" : busy ? "#8a5a06" : "#4a5563",
                    }}
                >
                    {busy
                        ? t(`${th}.obdWorking`)
                        : connected
                          ? t(`${th}.obdConnected`)
                          : t(`${th}.obdDisconnected`)}
                </span>
            </div>
            <div
                className="mt-[0.45cqw] shrink-0 pb-[0.2cqw] text-center font-medium text-[#4a5563]/70"
                style={{ fontSize: "1.05cqw" }}
            >
                {hint}
            </div>
        </div>
    );
}
