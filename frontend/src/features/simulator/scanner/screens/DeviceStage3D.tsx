import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
    motion,
    useMotionValue,
    useReducedMotion,
    useSpring,
    useTransform,
} from "framer-motion";
import { useTranslation } from "react-i18next";
import { Rotate3d } from "lucide-react";
import { getScannerMotion } from "../lib/scannerSettings";

/* 3D device stage: wraps the tablet casing in a perspective scene so it can
   be tilted with the pointer, spun freely around its vertical axis (a full
   360° turn that can stop at ANY angle) and inspected from the back. Purely
   presentational — all real UI stays inside `children` (the front face).
   Springs provide the inertia; reduced-motion users get a static device
   with a working turn button. */

const DRAG_LIMIT_X = 18;
const PARALLAX_Y = 4.5;
const PARALLAX_X = 3;
const KEY_STEP_Y = 8;
const KEY_STEP_X = 5;
const LIFT_Z = 26;

/* Slab thickness: front/back faces sit ±SLAB_HALF from centre and four
   side strips span the gap, so a free turn shows a solid edge instead of
   a paper-thin sheet. */
const SLAB_HALF = "1.4cqw";
const SLAB = "2.8cqw";

const SIDE_BG =
    "linear-gradient(180deg, #3a3f48 0%, #23262d 55%, #14161a 100%)";

const CORNER_N = 6;
const CORNER_SHEEN = 0.09;

function buildCornerFacets() {
    const r = 3.2;
    const slab = Number(SLAB.replace("cqw", ""));
    const step = 90 / CORNER_N;
    const half = (step / 2) * (Math.PI / 180);
    const d = r * Math.cos(half);
    const w = 2 * r * Math.sin(half);
    const corners = [
        { key: "tl", phi0: 180, xEdge: "left", yEdge: "top" },
        { key: "tr", phi0: -90, xEdge: "right", yEdge: "top" },
        { key: "bl", phi0: 90, xEdge: "left", yEdge: "bottom" },
        { key: "br", phi0: 0, xEdge: "right", yEdge: "bottom" },
    ] as const;
    const facets: {
        key: string;
        pos: Record<string, string>;
        rot: number;
        w: number;
        bg: string;
    }[] = [];
    for (const c of corners) {
        for (let j = 0; j < CORNER_N; j++) {
            const beta = c.phi0 + j * step + step / 2;
            const rad = (beta * Math.PI) / 180;
            const bx = Math.cos(rad);
            const by = Math.sin(rad);
            const mx = r + d * bx;
            const my = r + d * by;
            const a0 = CORNER_SHEEN * Math.sin((Math.PI * j) / CORNER_N);
            const a1 = CORNER_SHEEN * Math.sin((Math.PI * (j + 1)) / CORNER_N);
            const pos: Record<string, string> = {};
            pos[c.xEdge] = `${+((c.xEdge === "left" ? mx : r - d * bx) - w / 2).toFixed(4)}cqw`;
            pos[c.yEdge] = `${+((c.yEdge === "top" ? my : r - d * by) - slab / 2).toFixed(4)}cqw`;
            facets.push({
                key: `${c.key}-${j}`,
                pos,
                rot: +(beta + 90).toFixed(4),
                w: +w.toFixed(4),
                bg: `linear-gradient(90deg, rgba(255,255,255,${a0.toFixed(4)}) 0%, rgba(255,255,255,${a1.toFixed(4)}) 100%), ${SIDE_BG}`,
            });
        }
    }
    return facets;
}

const SPRING = { stiffness: 130, damping: 15, mass: 0.7 } as const;

const clamp = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

const isFrontFacing = (deg: number) =>
    Math.cos((deg * Math.PI) / 180) >= 0;

/* Straighten to the nearest face (front = 0/360, back = 180) — used by
   Escape so the device squares up without changing which face is shown. */
const snapToFace = (deg: number) => {
    const norm = ((deg % 360) + 360) % 360;
    if (norm <= 90 || norm >= 270) return Math.round(deg / 360) * 360;
    return Math.round((deg - 180) / 360) * 360 + 180;
};

type Props = {
    /** Accessible name for the whole tablet. */
    label: string;
    /** OBD dock cable on the back — seated while the link is plugged in. */
    cableConnected?: boolean;
    /** Reports "the tablet is at rest showing the back" — drives the
        link-cable overlay in the parent row (it must hide while the
        device is turning, since its path only lines up at rest). */
    onBackAtRest?: (back: boolean) => void;
    children: ReactNode;
};

export function DeviceStage3D({ label, cableConnected = false, onBackAtRest, children }: Props) {
    const { t, i18n } = useTranslation();
    const th = "simulator.scannerLab.toolHome";
    const reduced = useReducedMotion() === true || getScannerMotion() === "reduced";
    const isRTL = i18n.dir() === "rtl";
    const dir = isRTL ? -1 : 1;

    const stageRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{
        pointerId: number;
        startX: number;
        startY: number;
        baseY: number;
        baseX: number;
    } | null>(null);
    const [dragging, setDragging] = useState(false);
    /* Which face the viewer sees — derived from the live angle so a free
       360° turn keeps the button label and hit-testing truthful. */
    const [facingFront, setFacingFront] = useState(true);
    /* Resting angle: parallax returns here, the turn button adds 180°. */
    const restYRef = useRef(0);

    const rotateY = useMotionValue(0);
    const rotateX = useMotionValue(0);
    const lift = useMotionValue(0);
    const springY = useSpring(rotateY, SPRING);
    const springX = useSpring(rotateX, SPRING);
    const springLift = useSpring(lift, SPRING);

    /* The parent's link cable only lines up while the device rests on the
       back — follow the spring every frame so it hides the moment the
       tablet starts turning and reappears when it settles. */
    const restingBack = useRef<boolean | null>(null);
    useEffect(() => {
        const report = () => {
            /* Springs ease to a stop slightly short of the exact target, so
               "at rest" allows a couple of degrees plus a velocity check. */
            const diff = Math.abs(springY.get() - restYRef.current);
            const speed = Math.abs(springY.getVelocity?.() ?? 0);
            const settled = diff <= 2 && speed <= 15;
            const back = settled && !isFrontFacing(restYRef.current);
            if (restingBack.current === back) return;
            restingBack.current = back;
            onBackAtRest?.(back);
        };
        report();
        if (typeof requestAnimationFrame !== "function") return;
        let raf = requestAnimationFrame(function tick() {
            report();
            raf = requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(raf);
    }, [springY, onBackAtRest]);

    /* Specular sheen slides across the glass as the device turns
       (normalized so it keeps working after full revolutions). */
    const sheen = useTransform(springY, (y) => {
        const norm = ((((y + 180) % 360) + 360) % 360) - 180;
        const pos = 50 + norm * 1.35;
        const strength = 0.05 + Math.min(Math.abs(norm), 40) * 0.0018;
        return `linear-gradient(100deg, transparent ${pos - 26}%, rgba(255,255,255,${strength.toFixed(3)}) ${pos}%, transparent ${pos + 24}%)`;
    });
    const shadowOpacity = useTransform(springLift, [0, LIFT_Z], [0.42, 0.2]);
    const shadowScale = useTransform(springLift, [0, LIFT_Z], [1, 1.1]);

    const applyParallax = useCallback(
        (clientX: number, clientY: number) => {
            if (reduced || dragging || !stageRef.current) return;
            const rect = stageRef.current.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
            const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
            rotateY.set(
                restYRef.current + clamp(nx, -1, 1) * PARALLAX_Y * dir,
            );
            rotateX.set(clamp(-ny, -1, 1) * PARALLAX_X);
        },
        [reduced, dragging, dir, rotateY, rotateX],
    );

    const resetParallax = useCallback(() => {
        if (dragging) return;
        rotateY.set(restYRef.current);
        rotateX.set(0);
    }, [dragging, rotateY, rotateX]);

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (reduced || e.button !== 0) return;
            /* Portaled UI (the AI-mentor popup) bubbles through this React
               subtree while living on document.body — never capture those. */
            if (!stageRef.current?.contains(e.target as Node)) return;
            const target = e.target as HTMLElement;
            // Drag starts on the bezel/casing only — never inside the screen UI.
            if (target.closest("[data-device-screen]")) return;
            if (target.closest("[data-flip-control]")) return;
            if (!stageRef.current) return;
            dragRef.current = {
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                baseY: rotateY.get(),
                baseX: rotateX.get(),
            };
            setDragging(true);
            lift.set(LIFT_Z);
            stageRef.current.setPointerCapture?.(e.pointerId);
        },
        [reduced, rotateY, rotateX, lift],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!stageRef.current?.contains(e.target as Node)) return;
            const drag = dragRef.current;
            if (drag && drag.pointerId === e.pointerId) {
                const dy = (e.clientX - drag.startX) * 0.28 * dir;
                const dx = (e.clientY - drag.startY) * -0.2;
                /* Y spins freely — a full 360°+ turn with no clamp — while
                   the X tilt stays limited so the device never lies flat. */
                rotateY.set(drag.baseY + dy);
                rotateX.set(clamp(drag.baseX + dx, -DRAG_LIMIT_X, DRAG_LIMIT_X));
                return;
            }
            if (e.pointerType === "mouse") applyParallax(e.clientX, e.clientY);
        },
        [dir, rotateY, rotateX, applyParallax],
    );

    const endDrag = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== e.pointerId) return;
            dragRef.current = null;
            setDragging(false);
            lift.set(0);
            /* Stop exactly where the spin ended (no snap-back to a face). */
            restYRef.current = rotateY.get();
            rotateX.set(0);
            setFacingFront(isFrontFacing(restYRef.current));
            stageRef.current?.releasePointerCapture?.(e.pointerId);
        },
        [lift, rotateY, rotateX],
    );

    const toggleFlip = useCallback(() => {
        const next = restYRef.current + 180;
        rotateY.set(next);
        rotateX.set(0);
        restYRef.current = next;
        setFacingFront(isFrontFacing(next));
    }, [rotateY, rotateX]);

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                const step = e.key === "ArrowLeft" ? -KEY_STEP_Y : KEY_STEP_Y;
                const next = rotateY.get() + step;
                rotateY.set(next);
                restYRef.current = next;
                setFacingFront(isFrontFacing(next));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                rotateX.set(clamp(rotateX.get() - KEY_STEP_X, -DRAG_LIMIT_X, DRAG_LIMIT_X));
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                rotateX.set(clamp(rotateX.get() + KEY_STEP_X, -DRAG_LIMIT_X, DRAG_LIMIT_X));
            } else if (e.key === "Enter" || e.key === " ") {
                if (e.target === e.currentTarget) {
                    e.preventDefault();
                    toggleFlip();
                }
            } else if (e.key === "Escape") {
                /* Square up to the nearest face; the shown face never flips. */
                const snapped = snapToFace(restYRef.current);
                rotateY.set(snapped);
                restYRef.current = snapped;
                rotateX.set(0);
                setFacingFront(isFrontFacing(snapped));
            }
        },
        [rotateY, rotateX, toggleFlip],
    );

    const faceY = reduced ? rotateY : springY;
    const faceX = reduced ? rotateX : springX;
    const faceZ = reduced ? lift : springLift;

    return (
        <div
            ref={stageRef}
            className="scanner-stage-quiet-focus relative aspect-[1536/1046] min-w-0 flex-1 outline-none"
            style={{ perspective: "1600px", touchAction: "none" }}
            onPointerMove={onPointerMove}
            onPointerLeave={resetParallax}
            onPointerDown={onPointerDown}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={onKeyDown}
            tabIndex={0}
            role="group"
            aria-label={t(`${th}.stageAlt`, { device: label })}
            aria-describedby="device-stage-hints"
        >
            <span id="device-stage-hints" className="sr-only">
                {t(`${th}.stageHints`)}
            </span>

            {/* contact shadow on the desk */}
            <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-[7%] -bottom-[2.5%] h-[7%] rounded-[50%]"
                style={{
                    background: "radial-gradient(ellipse at center, rgba(15,23,42,.5) 0%, transparent 70%)",
                    filter: "blur(1.1cqw)",
                    opacity: shadowOpacity,
                    scaleX: shadowScale,
                }}
            />

            <motion.div
                className="absolute inset-0"
                style={{
                    transformStyle: "preserve-3d",
                    rotateY: faceY,
                    rotateX: faceX,
                    z: faceZ,
                    cursor: dragging ? "grabbing" : undefined,
                }}
            >
                {/* FRONT — the live tablet */}
                <div
                    className="absolute inset-0"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: `translateZ(${SLAB_HALF})`,
                        pointerEvents: facingFront ? "auto" : "none",
                    }}
                >
                    <div className="relative h-full w-full">{children}</div>
                    {/* glass sheen over the front */}
                    <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-[3.2cqw]"
                        style={{ background: sheen }}
                    />
                </div>

                {/* BACK — inspection panel */}
                <div
                    className="absolute inset-0"
                    style={{
                        backfaceVisibility: "hidden",
                        transform: `rotateY(180deg) translateZ(${SLAB_HALF})`,
                        pointerEvents: "none",
                    }}
                >
                    <DeviceBackPanel />
                    {/* OBD dock cable — drapes off the back so a turn shows
                        the real connector; the free end hangs while the link
                        is unplugged. */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute"
                        style={{ left: "9%", top: "7%", width: "30%" }}
                    >
                        <svg
                            viewBox="0 0 240 520"
                            fill="none"
                            style={{ width: "100%", height: "auto", overflow: "visible" }}
                        >
                            {/* dock slot on the back plate */}
                            <rect
                                x="34"
                                y="26"
                                width="86"
                                height="52"
                                rx="10"
                                fill="#0b0d11"
                                stroke="#41474f"
                                strokeWidth="3"
                            />
                            {cableConnected ? (
                                <circle cx="104" cy="46" r="7" fill="#37d67a" />
                            ) : null}
                            {/* strain relief seated in the dock */}
                            <rect
                                x="44"
                                y="34"
                                width="62"
                                height="40"
                                rx="9"
                                fill="url(#plugG)"
                                stroke="#0d0f13"
                                strokeWidth="2.5"
                            />
                            <path
                                d={
                                    cableConnected
                                        ? "M75 74 C 80 150, 56 214, 80 292 S 150 402, 136 516"
                                        : "M75 74 C 82 156, 58 224, 86 300 S 150 372, 148 430"
                                }
                                stroke="#0d0f13"
                                strokeWidth="17"
                                strokeLinecap="round"
                            />
                            <path
                                d={
                                    cableConnected
                                        ? "M75 74 C 80 150, 56 214, 80 292 S 150 402, 136 516"
                                        : "M75 74 C 82 156, 58 224, 86 300 S 150 372, 148 430"
                                }
                                stroke="#2e333c"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray="140 26"
                            />
                            {!cableConnected ? (
                                /* free OBD connector hanging at the cable end */
                                <g transform="rotate(14 148 430)">
                                    <rect
                                        x="126"
                                        y="424"
                                        width="46"
                                        height="66"
                                        rx="10"
                                        fill="url(#plugG)"
                                        stroke="#0d0f13"
                                        strokeWidth="3"
                                    />
                                    <rect
                                        x="134"
                                        y="470"
                                        width="30"
                                        height="14"
                                        rx="4"
                                        fill="#0b0d11"
                                    />
                                    {[0, 1, 2].map((r) =>
                                        [0, 1, 2].map((c) => (
                                            <circle
                                                key={`${r}-${c}`}
                                                cx={140 + c * 9}
                                                cy={474 + r * 4}
                                                r="1.6"
                                                fill="#c9a227"
                                            />
                                        )),
                                    )}
                                </g>
                            ) : null}
                            <defs>
                                <linearGradient id="plugG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0" stopColor="#4a515d" />
                                    <stop offset="1" stopColor="#23262d" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* slab sides — visible while the tablet turns so it reads as
                    a solid object instead of a flat card */}
                {[
                    {
                        key: "top",
                        cls: "left-[3.2cqw] right-[3.2cqw] top-0 origin-top",
                        size: { height: SLAB },
                        transform: `translateZ(-${SLAB_HALF}) rotateX(90deg)`,
                    },
                    {
                        key: "bottom",
                        cls: "bottom-0 left-[3.2cqw] right-[3.2cqw] origin-bottom",
                        size: { height: SLAB },
                        transform: `translateZ(-${SLAB_HALF}) rotateX(-90deg)`,
                    },
                    {
                        key: "left",
                        cls: "left-0 top-[3.2cqw] bottom-[3.2cqw] origin-left",
                        size: { width: SLAB },
                        transform: `translateZ(-${SLAB_HALF}) rotateY(-90deg)`,
                    },
                    {
                        key: "right",
                        cls: "right-0 top-[3.2cqw] bottom-[3.2cqw] origin-right",
                        size: { width: SLAB },
                        transform: `translateZ(-${SLAB_HALF}) rotateY(90deg)`,
                    },
                ].map((edge) => (
                    <div
                        key={edge.key}
                        aria-hidden="true"
                        className={`pointer-events-none absolute ${edge.cls}`}
                        style={{
                            ...edge.size,
                            transform: edge.transform,
                            background: SIDE_BG,
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,.14)",
                        }}
                    />
                ))}

                {/* corner walls — inscribed arc facets so the four corners turn
                    as a smooth rounded edge instead of a flat chamfer */}
                {buildCornerFacets().map((facet) => (
                    <div
                        key={facet.key}
                        aria-hidden="true"
                        className="pointer-events-none absolute"
                        style={{
                            ...facet.pos,
                            width: `${facet.w}cqw`,
                            height: SLAB,
                            transform: `rotateZ(${facet.rot}deg) rotateX(90deg)`,
                            background: facet.bg,
                        }}
                    />
                ))}
            </motion.div>

            {/* turn control sits outside the 3D group so it never turns away */}
            <button
                type="button"
                data-flip-control
                onClick={toggleFlip}
                aria-label={facingFront ? t(`${th}.flipBack`) : t(`${th}.flipFront`)}
                title={t(`${th}.flipHint`)}
                className="absolute bottom-[1cqw] left-[1cqw] z-20 flex items-center gap-[0.7cqw] rounded-full px-[1.4cqw] py-[0.8cqw] font-semibold text-[#dfe7f2] transition hover:brightness-[1.15] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2f7de1]"
                style={{
                    fontSize: "1.25cqw",
                    background: "linear-gradient(180deg, rgba(50,58,70,.92), rgba(24,28,36,.92))",
                    border: "1px solid rgba(255,255,255,.14)",
                    boxShadow: "0 0.4cqw 1.2cqw rgba(0,0,0,.35)",
                }}
            >
                <Rotate3d style={{ width: "1.7cqw", height: "1.7cqw" }} aria-hidden="true" />
                {facingFront ? t(`${th}.flipBack`) : t(`${th}.flipFront`)}
            </button>
        </div>
    );
}

/* Hand-built back plate: rubber bumper, vent slats, HBT badge, serial
   sticker and a folded kickstand — drawn entirely in cqw so it scales. */
function DeviceBackPanel() {
    const screw = (pos: string) => (
        <span
            key={pos}
            className={`absolute h-[1.1cqw] w-[1.1cqw] rounded-full ${pos}`}
            style={{
                background: "radial-gradient(circle at 35% 30%, #5a6270, #20242c 70%)",
                boxShadow: "inset 0 -1px 1px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.06)",
            }}
        />
    );
    return (
        <div
            className="relative h-full w-full overflow-hidden rounded-[3.2cqw]"
            style={{
                background: "linear-gradient(180deg, #2c3038 0%, #1a1d23 45%, #101318 100%)",
                boxShadow: "0 2.4cqw 6cqw rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08)",
            }}
        >
            {/* rubber bumper ring */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-[0.9cqw] rounded-[2.7cqw]"
                style={{
                    border: "0.55cqw solid #0b0d11",
                    boxShadow:
                        "inset 0 0 0 0.35cqw #363c47, inset 0 0.4cqw 1.2cqw rgba(0,0,0,.5)",
                }}
            />

            {/* brushed back plate */}
            <div
                className="absolute inset-[2.3cqw] rounded-[2cqw]"
                style={{
                    background:
                        "linear-gradient(165deg, #31363f 0%, #22262e 42%, #171a20 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,.07)",
                }}
            >
                {/* vent slats */}
                <div className="absolute left-1/2 top-[5.5%] w-[44%] -translate-x-1/2 space-y-[0.55cqw]">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <span
                            key={i}
                            className="block h-[0.5cqw] rounded-full"
                            style={{
                                background: "linear-gradient(90deg, #0c0e12, #1d212a)",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
                            }}
                        />
                    ))}
                </div>

                {/* brand badge */}
                <div
                    className="absolute left-1/2 top-[33%] flex -translate-x-1/2 items-center gap-[1cqw] rounded-[1cqw] px-[2.4cqw] py-[1.1cqw]"
                    style={{
                        background: "linear-gradient(180deg, #3c4351, #232833)",
                        border: "1px solid #4c5361",
                        boxShadow: "0 0.5cqw 1.4cqw rgba(0,0,0,.45)",
                    }}
                >
                    <span
                        className="font-black tracking-wide text-[#e8edf4]"
                        style={{ fontSize: "2cqw" }}
                    >
                        HBTronics
                    </span>
                    <span
                        className="rounded-full px-[1cqw] py-[0.25cqw] font-bold text-white"
                        style={{ fontSize: "1cqw", background: "#F47822" }}
                    >
                        DT1500
                    </span>
                </div>

                {/* serial sticker */}
                <div
                    className="absolute bottom-[17%] left-1/2 w-[50%] -translate-x-1/2 rounded-[0.6cqw] px-[1.2cqw] py-[0.8cqw] text-[#333944]"
                    style={{ background: "#dfe3ea" }}
                >
                    <p className="font-semibold" style={{ fontSize: "1cqw" }}>
                        S/N: A30M-WF3BXPQ
                    </p>
                    <p style={{ fontSize: "0.9cqw" }}>
                        12V DC · CE · FCC · Made for HBT Learning Platform
                    </p>
                </div>

                {/* kickstand */}
                <div
                    className="absolute bottom-[4.5%] left-1/2 h-[3.6cqw] w-[38%] -translate-x-1/2 rounded-[0.8cqw]"
                    style={{
                        background: "linear-gradient(180deg, #3c4351, #1e222a)",
                        border: "1px solid #4c5361",
                    }}
                >
                    {["left-[5%]", "right-[5%]"].map((pos) => (
                        <span
                            key={pos}
                            className={`absolute -top-[0.55cqw] ${pos} h-[1.5cqw] w-[1.5cqw] rounded-full`}
                            style={{
                                background: "#14171d",
                                border: "2px solid #4c5361",
                            }}
                        />
                    ))}
                </div>

                {screw("left-[1.6cqw] top-[1.6cqw]")}
                {screw("right-[1.6cqw] top-[1.6cqw]")}
                {screw("left-[1.6cqw] bottom-[1.6cqw]")}
                {screw("right-[1.6cqw] bottom-[1.6cqw]")}
            </div>

            {/* faint sheen so the back isn't flat */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[3.2cqw]"
                style={{
                    background:
                        "linear-gradient(105deg, transparent 34%, rgba(255,255,255,.045) 50%, transparent 64%)",
                }}
            />
        </div>
    );
}
