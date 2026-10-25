import { useMemo, useState, type RefObject } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import { BrandLogo } from "@/features/simulator/multimeter/tool/model/BrandLogo";

import type { ScopeEngine, ScopeEngineState } from "../../engine/scope.engine";
import { ScopeScreen } from "./ScopeScreen";
import {
    BRAND_ORANGE,
    getBackLabelTexture,
    getLabelTexture,
    getSymbolTexture,
    getWideLabelTexture,
} from "./textures";

const PANEL_Y = 0.54;
const PANEL_Z = 0.096;
const SCREEN_Y = 0.704;
const BODY_H = 1.06;
const BODY_W = 0.52;

const VDIV_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];

function nearestIndex(steps: number[], value: number) {
    let best = 0;
    let distance = Infinity;
    for (let i = 0; i < steps.length; i += 1) {
        const next = Math.abs(steps[i] - value);
        if (next < distance) {
            best = i;
            distance = next;
        }
    }
    return best;
}

function PanelButton({
    label,
    position,
    width = 0.105,
    height = 0.042,
    active = false,
    accent = BRAND_ORANGE,
    onPress,
    onInteractStart,
    onInteractEnd,
}: {
    label: string;
    position: [number, number, number];
    width?: number;
    height?: number;
    active?: boolean;
    accent?: string;
    onPress: () => void;
    onInteractStart: () => void;
    onInteractEnd: () => void;
}) {
    const [pressed, setPressed] = useState(false);
    const texture = useMemo(
        () => getLabelTexture(label, { color: "#f4f7f8", background: "transparent", size: 62 }),
        [label],
    );
    const release = () => {
        setPressed(false);
        onInteractEnd();
    };

    return (
        <group
            position={[position[0], position[1], position[2] + (pressed ? -0.0025 : 0)]}
            onPointerDown={(event) => {
                event.stopPropagation();
                setPressed(true);
                onInteractStart();
            }}
            onPointerUp={(event) => {
                event.stopPropagation();
                release();
            }}
            onPointerOut={release}
            onClick={(event) => {
                event.stopPropagation();
                onPress();
            }}
        >
            <RoundedBox args={[width + 0.016, height + 0.016, 0.007]} radius={0.005} smoothness={4} position={[0, 0, -0.007]} receiveShadow>
                <meshStandardMaterial color="#101417" roughness={0.86} metalness={0.05} />
            </RoundedBox>
            <RoundedBox args={[width, height, 0.018]} radius={0.006} smoothness={4} castShadow>
                <meshPhysicalMaterial
                    color={active ? accent : "#2a2f34"}
                    roughness={0.38}
                    clearcoat={0.32}
                    clearcoatRoughness={0.48}
                />
            </RoundedBox>
            <mesh position={[0, 0, 0.0097]} renderOrder={4}>
                <planeGeometry args={[width * 0.9, height * 0.72]} />
                <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
            </mesh>
        </group>
    );
}

function StepCap({
    label,
    position,
    color,
    pad = true,
    disc = true,
    radius = 0.031,
    depth = 0.012,
    onPress,
    onInteractStart,
    onInteractEnd,
}: {
    label: string;
    position: [number, number, number];
    color: string;
    pad?: boolean;
    disc?: boolean;
    radius?: number;
    depth?: number;
    onPress: () => void;
    onInteractStart: () => void;
    onInteractEnd: () => void;
}) {
    const [pressed, setPressed] = useState(false);
    const texture = useMemo(() => getSymbolTexture(label), [label]);
    const release = () => {
        setPressed(false);
        onInteractEnd();
    };

    return (
        <group
            position={[position[0], position[1], position[2] + (pressed ? -0.002 : 0)]}
            onPointerDown={(event) => {
                event.stopPropagation();
                setPressed(true);
                onInteractStart();
            }}
            onPointerUp={(event) => {
                event.stopPropagation();
                release();
            }}
            onPointerOut={release}
            onClick={(event) => {
                event.stopPropagation();
                onPress();
            }}
        >
            {pad ? (
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.0015]} receiveShadow>
                    <cylinderGeometry args={[0.037, 0.037, 0.005, 28]} />
                    <meshStandardMaterial color="#0d1012" roughness={0.9} />
                </mesh>
            ) : null}
            {disc ? (
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow={depth > 0.004}>
                    <cylinderGeometry args={[radius, radius, depth, 28]} />
                    <meshPhysicalMaterial color={color} roughness={0.34} metalness={0.16} clearcoat={0.35} clearcoatRoughness={0.42} />
                </mesh>
            ) : (
                <mesh position={[0, 0, 0.0005]}>
                    <boxGeometry args={[0.05, 0.044, 0.002]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
            )}
            <mesh position={[0, 0, (disc ? depth / 2 : 0) + 0.0025]}>
                <planeGeometry args={[0.036, 0.036]} />
                <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
            </mesh>
        </group>
    );
}

function VerticalRocker({
    channel,
    value,
    steps,
    color,
    onStep,
    onInteractStart,
    onInteractEnd,
}: {
    channel: "A" | "B";
    value: number;
    steps: number[];
    color: string;
    onStep: (direction: -1 | 1) => void;
    onInteractStart: () => void;
    onInteractEnd: () => void;
}) {
    const index = nearestIndex(steps, value);
    const fraction = steps.length > 1 ? index / (steps.length - 1) : 0.5;
    const thumbY = (fraction - 0.5) * 0.18;
    const x = channel === "A" ? -0.186 : 0.186;
    const tickX = channel === "A" ? 0.023 : -0.023;

    return (
        <group position={[x, 0.285 - PANEL_Y, 0.006]}>
            <RoundedBox args={[0.054, 0.292, 0.01]} radius={0.003} smoothness={3} position={[0, 0, 0.0092]}>
                <meshPhysicalMaterial color={color} roughness={0.42} clearcoat={0.3} clearcoatRoughness={0.48} />
            </RoundedBox>
            {steps.map((step, i) => {
                const y = ((i / Math.max(1, steps.length - 1)) - 0.5) * 0.18;
                return (
                    <mesh key={step} position={[tickX, y, 0.0148]}>
                        <boxGeometry args={[0.006, 0.0025, 0.002]} />
                        <meshBasicMaterial color="#eef3f5" transparent opacity={0.72} toneMapped={false} />
                    </mesh>
                );
            })}
            <RoundedBox args={[0.052, 0.019, 0.01]} radius={0.004} smoothness={4} position={[0, thumbY, 0.016]} castShadow>
                <meshPhysicalMaterial color="#f4f6f6" roughness={0.32} metalness={0.08} clearcoat={0.5} />
            </RoundedBox>
            <mesh position={[0, thumbY, 0.0215]}>
                <planeGeometry args={[0.026, 0.008]} />
                <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            <StepCap
                label="+"
                position={[0, 0.124, 0.015]}
                color={color}
                pad={false}
                disc={false}
                onPress={() => onStep(1)}
                onInteractStart={onInteractStart}
                onInteractEnd={onInteractEnd}
            />
            <StepCap
                label="−"
                position={[0, -0.124, 0.015]}
                color={color}
                pad={false}
                disc={false}
                onPress={() => onStep(-1)}
                onInteractStart={onInteractStart}
                onInteractEnd={onInteractEnd}
            />
        </group>
    );
}

function TriggerRocker({
    value,
    min,
    max,
    unit,
    onStep,
    onInteractStart,
    onInteractEnd,
}: {
    value: number;
    min: number;
    max: number;
    unit: string;
    onStep: (direction: -1 | 1) => void;
    onInteractStart: () => void;
    onInteractEnd: () => void;
}) {
    const fraction = THREE.MathUtils.clamp((value - min) / Math.max(1, max - min), 0, 1);
    const thumbX = (fraction - 0.5) * 0.17;
    const valueTexture = useMemo(
        () => getWideLabelTexture(`TRIG ${value.toFixed(2)} ${unit}`, { color: "#f3f6f7", size: 62, tracking: 4 }),
        [value, unit],
    );

    return (
        <group position={[0, 0.185 - PANEL_Y, 0.009]}>
            <RoundedBox args={[0.212, 0.035, 0.008]} radius={0.016} smoothness={5} position={[0, 0, 0.002]} receiveShadow>
                <meshStandardMaterial color="#161a1d" roughness={0.78} metalness={0.06} />
            </RoundedBox>
            <RoundedBox args={[0.19, 0.023, 0.008]} radius={0.01} smoothness={5} position={[0, 0, 0.005]} castShadow>
                <meshPhysicalMaterial color="#737b80" roughness={0.44} metalness={0.18} clearcoat={0.2} />
            </RoundedBox>
            {Array.from({ length: 9 }).map((_, i) => (
                <mesh key={i} position={[-0.09 + (i / 8) * 0.18, -0.014, 0.0095]}>
                    <boxGeometry args={[0.0025, 0.006, 0.002]} />
                    <meshBasicMaterial color="#eef3f5" transparent opacity={0.62} toneMapped={false} />
                </mesh>
            ))}
            <RoundedBox args={[0.022, 0.042, 0.01]} radius={0.008} smoothness={4} position={[thumbX, 0, 0.008]} castShadow>
                <meshPhysicalMaterial color="#f4f6f6" roughness={0.32} metalness={0.08} clearcoat={0.5} />
            </RoundedBox>
            <StepCap
                label="−"
                position={[-0.119, 0, 0.004]}
                color="#2f3438"
                pad={false}
                onPress={() => onStep(-1)}
                onInteractStart={onInteractStart}
                onInteractEnd={onInteractEnd}
            />
            <StepCap
                label="+"
                position={[0.119, 0, 0.004]}
                color="#2f3438"
                pad={false}
                onPress={() => onStep(1)}
                onInteractStart={onInteractStart}
                onInteractEnd={onInteractEnd}
            />
            <RoundedBox args={[0.164, 0.028, 0.006]} radius={0.004} smoothness={3} position={[0, 0.059, 0.004]} receiveShadow>
                <meshStandardMaterial color="#101315" roughness={0.82} />
            </RoundedBox>
            <mesh position={[0, 0.059, 0.0075]}>
                <planeGeometry args={[0.152, 0.019]} />
                <meshBasicMaterial map={valueTexture} transparent depthWrite={false} toneMapped={false} />
            </mesh>
        </group>
    );
}

function Jack({
    x,
    color,
    label,
    anchorRef,
}: {
    x: number;
    color: string;
    label: string;
    anchorRef: RefObject<THREE.Object3D | null>;
}) {
    const labelTexture = useMemo(
        () => getLabelTexture(label, { color: "#edf1f4", size: label.length > 1 ? 42 : 60 }),
        [label],
    );

    return (
        <group position={[x, BODY_H - 0.005, 0]}>
            <mesh position={[0, 0.018, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.035, 0.03, 0.052, 28]} />
                <meshPhysicalMaterial color={color} roughness={0.34} clearcoat={0.4} clearcoatRoughness={0.38} />
            </mesh>
            <mesh position={[0, 0.055, 0]} castShadow>
                <cylinderGeometry args={[0.018, 0.02, 0.036, 20]} />
                <meshStandardMaterial color="#0a0b0c" roughness={0.78} />
            </mesh>
            <mesh position={[0, 0.044, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.024, 0.004, 8, 28]} />
                <meshStandardMaterial color="#aeb7bd" roughness={0.28} metalness={0.88} />
            </mesh>
            <mesh position={[0, 0.046, 0]}>
                <cylinderGeometry args={[0.014, 0.014, 0.004, 24]} />
                <meshStandardMaterial color="#060708" roughness={0.3} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.04, 0.035]}>
                <planeGeometry args={[0.064, 0.024]} />
                <meshBasicMaterial map={labelTexture} transparent depthWrite={false} toneMapped={false} />
            </mesh>
            <object3D ref={anchorRef} position={[0, 0.06, 0]} />
        </group>
    );
}

function RearStand() {
    const angle = 0.18;
    const length = 0.73;

    return (
        <group position={[0, 0.72, -0.088]} rotation={[angle, 0, 0]}>
            <RoundedBox args={[0.222, 0.048, 0.038]} radius={0.011} smoothness={4} position={[0, 0.012, 0.004]} castShadow>
                <meshPhysicalMaterial color="#171b1e" roughness={0.58} clearcoat={0.12} />
            </RoundedBox>
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.012, 0.016]} castShadow>
                <cylinderGeometry args={[0.012, 0.012, 0.184, 20]} />
                <meshStandardMaterial color="#2c3135" roughness={0.4} metalness={0.55} />
            </mesh>
            {[-0.082, 0.082].map((x) => (
                <RoundedBox key={x} args={[0.018, length, 0.022]} radius={0.007} smoothness={4} position={[x, -length / 2, 0.014]} castShadow>
                    <meshPhysicalMaterial color="#d96717" roughness={0.56} clearcoat={0.12} />
                </RoundedBox>
            ))}
            <RoundedBox args={[0.196, 0.02, 0.032]} radius={0.009} smoothness={4} position={[0, -length + 0.01, 0.014]} castShadow>
                <meshPhysicalMaterial color="#171b1e" roughness={0.7} clearcoat={0.06} />
            </RoundedBox>
            {[-0.082, 0.082].map((x) => (
                <RoundedBox key={`foot-${x}`} args={[0.032, 0.014, 0.038]} radius={0.006} smoothness={3} position={[x, -length + 0.007, 0.014]}>
                    <meshStandardMaterial color="#0a0c0d" roughness={0.92} />
                </RoundedBox>
            ))}
        </group>
    );
}

interface OscilloscopeModelProps {
    engine: ScopeEngine;
    state: ScopeEngineState;
    powered: boolean;
    activeChannel: "A" | "B";
    bodyRef: RefObject<THREE.Group | null>;
    anchors: {
        red: RefObject<THREE.Object3D | null>;
        black: RefObject<THREE.Object3D | null>;
        blue: RefObject<THREE.Object3D | null>;
    };
    onChannel: (channel: "A" | "B") => void;
    onTriggerEdge: () => void;
    onRun: () => void;
    onAuto: () => void;
    onPersist: () => void;
    onPower: () => void;
    onTimeStep: (direction: -1 | 1) => void;
    onVdivStep: (channel: "A" | "B", direction: -1 | 1) => void;
    onOffsetStep: (channel: "A" | "B", direction: -1 | 1) => void;
    onTriggerStep: (direction: -1 | 1) => void;
    onInteractStart: () => void;
    onInteractEnd: () => void;
}

export function OscilloscopeModel({
    engine,
    state,
    powered,
    activeChannel,
    bodyRef,
    anchors,
    onChannel,
    onTriggerEdge,
    onRun,
    onAuto,
    onPersist,
    onPower,
    onTimeStep,
    onVdivStep,
    onOffsetStep,
    onTriggerStep,
    onInteractStart,
    onInteractEnd,
}: OscilloscopeModelProps) {
    const comp = engine.comp();
    const backLabel = useMemo(() => getBackLabelTexture(), []);
    const scopeLabel = useMemo(
        () => getWideLabelTexture("OSCILLOSCOPE", { color: "#f1f4f5", size: 74, tracking: 10 }),
        [],
    );
    const triggerLabel = useMemo(
        () => getLabelTexture(state.trigEdge === "rising" ? "TRIGGER ↑" : "TRIGGER ↓", { color: "#f1f4f5", size: 46 }),
        [state.trigEdge],
    );
    return (
        <group ref={bodyRef}>
            <RoundedBox args={[BODY_W, BODY_H, 0.17]} radius={0.058} smoothness={7} position={[0, 0.53, 0]} castShadow receiveShadow>
                <meshPhysicalMaterial color={BRAND_ORANGE} roughness={0.42} metalness={0.02} clearcoat={0.32} clearcoatRoughness={0.48} />
            </RoundedBox>

            <RoundedBox args={[0.55, 0.05, 0.152]} radius={0.018} smoothness={5} position={[0, 0.045, 0]} castShadow receiveShadow>
                <meshPhysicalMaterial color="#1d2023" roughness={0.86} clearcoat={0.08} />
            </RoundedBox>

            {[-0.245, 0.245].map((x) => (
                <group key={x}>
                    <RoundedBox args={[0.022, 0.58, 0.09]} radius={0.012} smoothness={5} position={[x, 0.48, 0]} castShadow receiveShadow>
                        <meshPhysicalMaterial color="#303439" roughness={0.84} clearcoat={0.08} />
                    </RoundedBox>
                    {[-0.18, -0.09, 0, 0.09, 0.18].map((y) => (
                        <RoundedBox
                            key={y}
                            args={[0.012, 0.055, 0.012]}
                            radius={0.004}
                            smoothness={3}
                            position={[x + Math.sign(x) * 0.013, 0.48 + y, 0.046]}
                        >
                            <meshStandardMaterial color="#1b1e21" roughness={0.9} />
                        </RoundedBox>
                    ))}
                </group>
            ))}

            <RoundedBox args={[0.454, 0.965, 0.023]} radius={0.034} smoothness={6} position={[0, PANEL_Y, PANEL_Z - 0.004]} receiveShadow>
                <meshPhysicalMaterial color="#0c0e10" roughness={0.8} clearcoat={0.1} />
            </RoundedBox>

            <group position={[0, PANEL_Y, PANEL_Z]}>
                <RoundedBox args={[0.438, 0.948, 0.016]} radius={0.03} smoothness={6} receiveShadow>
                    <meshStandardMaterial color="#202428" roughness={0.6} metalness={0.08} />
                </RoundedBox>
                <RoundedBox args={[0.404, 0.398, 0.006]} radius={0.0028} smoothness={3} position={[0, -0.25, 0.007]} receiveShadow>
                    <meshStandardMaterial color="#171b1f" roughness={0.72} metalness={0.06} />
                </RoundedBox>
                <mesh position={[0, 0.446, 0.0095]}>
                    <planeGeometry args={[0.408, 0.056]} />
                    <meshStandardMaterial color="#121517" roughness={0.5} metalness={0.12} />
                </mesh>
                <BrandLogo position={[0, 0.446, 0.0115]} width={0.152} />
                <mesh position={[0, 0.395, 0.0235]}>
                    <planeGeometry args={[0.29, 0.03625]} />
                    <meshBasicMaterial map={scopeLabel} transparent depthWrite={false} toneMapped={false} />
                </mesh>

                <group position={[0, SCREEN_Y - PANEL_Y, 0.012]}>
                    <RoundedBox args={[0.406, 0.42, 0.02]} radius={0.018} smoothness={5} receiveShadow>
                        <meshPhysicalMaterial color="#080a0b" roughness={0.72} clearcoat={0.12} />
                    </RoundedBox>
                    <mesh position={[0, 0, 0.011]}>
                        <planeGeometry args={[0.394, 0.408]} />
                        <meshStandardMaterial color="#050607" roughness={0.55} />
                    </mesh>
                    <group position={[0, 0, 0.0125]}>
                        <ScopeScreen engine={engine} state={state} powered={powered} />
                    </group>
                    <mesh position={[0, 0, 0.018]}>
                        <planeGeometry args={[0.374, 0.374]} />
                        <meshPhysicalMaterial
                            color="#ffffff"
                            transparent
                            opacity={0.045}
                            roughness={0.04}
                            clearcoat={1}
                            clearcoatRoughness={0.03}
                            depthWrite={false}
                        />
                    </mesh>
                </group>

                <PanelButton
                    label="CHANNEL1"
                    position={[-0.141, 0.466 - PANEL_Y, 0.016]}
                    width={0.116}
                    active={activeChannel === "A"}
                    accent="#d94b40"
                    onPress={() => onChannel("A")}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />
                <group position={[0, 0.466 - PANEL_Y, 0.016]}>
                    <RoundedBox args={[0.116, 0.042, 0.018]} radius={0.006} smoothness={4} castShadow>
                        <meshPhysicalMaterial color="#2a2f34" roughness={0.38} clearcoat={0.32} clearcoatRoughness={0.48} />
                    </RoundedBox>
                    <mesh position={[0, 0, 0.0097]}>
                        <planeGeometry args={[0.104, 0.03]} />
                        <meshBasicMaterial map={triggerLabel} transparent depthWrite={false} toneMapped={false} />
                    </mesh>
                    <mesh
                        position={[0, 0, 0.012]}
                        onClick={(event) => {
                            event.stopPropagation();
                            onTriggerEdge();
                        }}
                        onPointerDown={(event) => {
                            event.stopPropagation();
                            onInteractStart();
                        }}
                        onPointerUp={(event) => {
                            event.stopPropagation();
                            onInteractEnd();
                        }}
                    >
                        <planeGeometry args={[0.116, 0.042]} />
                        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                    </mesh>
                </group>
                <PanelButton
                    label="CHANNEL2"
                    position={[0.141, 0.466 - PANEL_Y, 0.016]}
                    width={0.116}
                    active={activeChannel === "B"}
                    accent="#2f63d9"
                    onPress={() => onChannel("B")}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />

                <PanelButton
                    label="▲"
                    position={[0, 0.394 - PANEL_Y, 0.016]}
                    width={0.062}
                    height={0.036}
                    onPress={() => onOffsetStep(activeChannel, 1)}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />
                <PanelButton
                    label="◀"
                    position={[-0.061, 0.34 - PANEL_Y, 0.016]}
                    width={0.056}
                    height={0.042}
                    onPress={() => onTimeStep(-1)}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />
                <PanelButton
                    label="AUTO"
                    position={[0, 0.34 - PANEL_Y, 0.016]}
                    width={0.066}
                    height={0.042}
                    onPress={onAuto}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />
                <PanelButton
                    label="▶"
                    position={[0.061, 0.34 - PANEL_Y, 0.016]}
                    width={0.056}
                    height={0.042}
                    onPress={() => onTimeStep(1)}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />
                <PanelButton
                    label="▼"
                    position={[0, 0.286 - PANEL_Y, 0.016]}
                    width={0.062}
                    height={0.036}
                    onPress={() => onOffsetStep(activeChannel, -1)}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />

                <VerticalRocker
                    channel="A"
                    value={state.vdivA}
                    steps={VDIV_STEPS}
                    color="#c9382b"
                    onStep={(direction) => onVdivStep("A", direction)}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />
                <VerticalRocker
                    channel="B"
                    value={state.vdivB}
                    steps={VDIV_STEPS}
                    color="#2f63d9"
                    onStep={(direction) => onVdivStep("B", direction)}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />

                <TriggerRocker
                    value={state.trigLevel}
                    min={comp.trig.min}
                    max={comp.trig.max}
                    unit={comp.chA.unit}
                    onStep={onTriggerStep}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />

                <PanelButton
                    label="MEMORY"
                    position={[-0.142, 0.115 - PANEL_Y, 0.016]}
                    width={0.118}
                    height={0.038}
                    active={state.persist}
                    onPress={onPersist}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />
                <PanelButton
                    label="ON / OFF"
                    position={[0, 0.115 - PANEL_Y, 0.016]}
                    width={0.118}
                    height={0.038}
                    active={powered}
                    onPress={onPower}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />
                <PanelButton
                    label={state.running ? "RUN" : "HOLD"}
                    position={[0.142, 0.115 - PANEL_Y, 0.016]}
                    width={0.118}
                    height={0.038}
                    active={state.running}
                    accent="#2b8a64"
                    onPress={onRun}
                    onInteractStart={onInteractStart}
                    onInteractEnd={onInteractEnd}
                />

            </group>

            <Jack x={-0.136} color="#b3261f" label="1" anchorRef={anchors.red} />
            <Jack x={0} color="#17191b" label="COM" anchorRef={anchors.black} />
            <Jack x={0.136} color="#1f4fd1" label="2" anchorRef={anchors.blue} />

            <RoundedBox args={[0.3, 0.36, 0.014]} radius={0.026} smoothness={5} position={[0, 0.42, -0.091]} castShadow>
                <meshPhysicalMaterial color="#c66016" roughness={0.6} clearcoat={0.16} />
            </RoundedBox>
            <mesh position={[0, 0.255, -0.099]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.255, 0.0796]} />
                <meshBasicMaterial map={backLabel} transparent depthWrite={false} toneMapped={false} />
            </mesh>

            <RoundedBox args={[0.25, 0.095, 0.007]} radius={0.012} smoothness={4} position={[0, 0.85, -0.0915]} castShadow>
                <meshPhysicalMaterial color="#171b1e" roughness={0.6} clearcoat={0.1} />
            </RoundedBox>
            <BrandLogo position={[0, 0.858, -0.096]} rotation={[0, Math.PI, 0]} width={0.19} />

            <RearStand />

            <mesh position={[0.245, 0.89, 0.02]} castShadow>
                <boxGeometry args={[0.008, 0.045, 0.065]} />
                <meshStandardMaterial color="#2c2311" roughness={0.8} />
            </mesh>
        </group>
    );
}
