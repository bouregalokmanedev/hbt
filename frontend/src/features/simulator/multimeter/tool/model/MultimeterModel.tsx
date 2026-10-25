import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

import { angleForMode, MODE_BY_ID, nearestMode, type DialModeId } from "../modes";
import { BrandLogo } from "./BrandLogo";
import {
    BRAND_ORANGE,
    BUTTON_ROW_Y,
    BUTTON_X,
    DIAL_CENTER_Y,
    getBackPlateTexture,
    getButtonLabelTexture,
    getFrontPanelTexture,
    JACK_ROW_Y,
    JACK_X,
    LCD_CENTER_Y,
    updateLcdTexture,
} from "./textures";

const PANEL_Y = 0.54;
const PANEL_Z = 0.088;
const DIAL_PANEL_Y = DIAL_CENTER_Y - PANEL_Y;
const LCD_PANEL_Y = LCD_CENTER_Y - PANEL_Y;
const JACK_PANEL_Y = JACK_ROW_Y - PANEL_Y;
const DIAL_MIN = -180;
const DIAL_MAX = 154;

const PUSH_BUTTONS = ["HOLD", "MIN MAX", "RANGE", "LIGHT", "REL", "Hz"] as const;

interface MultimeterModelProps {
    mode: DialModeId;
    hold: boolean;
    backlight: boolean;
    onMode: (mode: DialModeId) => void;
    onHold: () => void;
    onBacklight: () => void;
    onInteractStart: () => void;
    onInteractEnd: () => void;
    anchors: {
        red: RefObject<THREE.Object3D | null>;
        black: RefObject<THREE.Object3D | null>;
    };
    bodyRef: RefObject<THREE.Group | null>;
}

function LcdScreen({ mode, hold, backlight }: { mode: DialModeId; hold: boolean; backlight: boolean }) {
    const texture = useMemo(() => updateLcdTexture(MODE_BY_ID[mode], hold, backlight), [mode, hold, backlight]);
    return (
        <group position={[0, LCD_PANEL_Y, 0.016]}>
            <RoundedBox args={[0.306, 0.15, 0.008]} radius={0.008} smoothness={4}>
                <meshStandardMaterial color="#080a0b" roughness={0.7} />
            </RoundedBox>
            <mesh position={[0, 0, 0.006]}>
                <planeGeometry args={[0.28, 0.142]} />
                <meshBasicMaterial map={texture} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.0085]}>
                <planeGeometry args={[0.28, 0.142]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.055}
                    roughness={0.06}
                    metalness={0}
                    clearcoat={1}
                    clearcoatRoughness={0.05}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

function PanelButton({
    label,
    position,
    yellow = false,
    onPress,
    onInteractStart,
    onInteractEnd,
}: {
    label: string;
    position: [number, number, number];
    yellow?: boolean;
    onPress: () => void;
    onInteractStart: () => void;
    onInteractEnd: () => void;
}) {
    const [pressed, setPressed] = useState(false);
    const labelTexture = useMemo(() => getButtonLabelTexture(label, yellow), [label, yellow]);
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
            <RoundedBox args={[0.046, 0.024, 0.018]} radius={0.005} smoothness={4} castShadow>
                <meshPhysicalMaterial
                    color={yellow ? BRAND_ORANGE : "#2a2f34"}
                    roughness={yellow ? 0.5 : 0.42}
                    clearcoat={0.25}
                    clearcoatRoughness={0.6}
                />
            </RoundedBox>
            <mesh position={[0, 0, 0.0095]} renderOrder={3}>
                <planeGeometry args={[0.042, 0.019]} />
                <meshBasicMaterial map={labelTexture} transparent depthWrite={false} toneMapped={false} />
            </mesh>
        </group>
    );
}

function Jack({
    x,
    color,
    plug,
    anchorRef,
}: {
    x: number;
    color: string;
    plug: boolean;
    anchorRef?: RefObject<THREE.Object3D | null>;
}) {
    return (
        <group position={[x, JACK_PANEL_Y, 0.014]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.027, 0.027, 0.026, 32]} />
                <meshPhysicalMaterial color={color} roughness={0.38} clearcoat={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.017, 0.017, 0.006, 32]} />
                <meshStandardMaterial color="#060708" roughness={0.26} metalness={0.25} />
            </mesh>
            <mesh position={[0, 0, 0.018]}>
                <torusGeometry args={[0.019, 0.0022, 8, 28]} />
                <meshStandardMaterial color="#98a1a9" roughness={0.32} metalness={0.85} />
            </mesh>
            {plug ? (
                <group>
                    <mesh position={[0, 0, 0.036]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.0135, 0.0135, 0.05, 24]} />
                        <meshPhysicalMaterial color={color} roughness={0.4} clearcoat={0.4} />
                    </mesh>
                    <mesh position={[0, 0, 0.058]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.0095, 0.011, 0.016, 18]} />
                        <meshStandardMaterial color="#101214" roughness={0.8} />
                    </mesh>
                    <mesh position={[0, 0, 0.026]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.0185, 0.0185, 0.012, 24]} />
                        <meshStandardMaterial color={color} roughness={0.55} />
                    </mesh>
                    {anchorRef ? <object3D ref={anchorRef} position={[0, 0, 0.068]} /> : null}
                </group>
            ) : null}
        </group>
    );
}

function Dial({
    mode,
    onMode,
    onInteractStart,
    onInteractEnd,
}: {
    mode: DialModeId;
    onMode: (mode: DialModeId) => void;
    onInteractStart: () => void;
    onInteractEnd: () => void;
}) {
    const knobRef = useRef<THREE.Group>(null);
    const panelRef = useRef<THREE.Group>(null);
    const dragging = useRef(false);
    const moved = useRef(false);
    const startPointer = useRef(0);
    const startAngle = useRef(0);
    const angle = useRef(angleForMode(mode));

    useEffect(() => {
        if (!dragging.current) {
            angle.current = angleForMode(mode);
            if (knobRef.current) knobRef.current.rotation.z = -THREE.MathUtils.degToRad(angle.current);
        }
    }, [mode]);

    const pointerAngle = (event: { point: THREE.Vector3 }) => {
        if (!panelRef.current) return startAngle.current;
        const local = panelRef.current.worldToLocal(event.point.clone());
        return THREE.MathUtils.radToDeg(Math.atan2(local.x, local.y));
    };

    const applyAngle = (value: number) => {
        const clamped = THREE.MathUtils.clamp(value, DIAL_MIN, DIAL_MAX);
        angle.current = clamped;
        if (knobRef.current) knobRef.current.rotation.z = -THREE.MathUtils.degToRad(clamped);
    };

    const finish = () => {
        if (!dragging.current) return;
        dragging.current = false;
        const next = nearestMode(angle.current);
        applyAngle(next.angle);
        onMode(next.id);
        onInteractEnd();
    };

    return (
        <group ref={panelRef} position={[0, DIAL_PANEL_Y, 0.018]}>
            <group
                ref={knobRef}
                rotation={[0, 0, -THREE.MathUtils.degToRad(angleForMode(mode))]}
                onPointerDown={(event) => {
                    event.stopPropagation();
                    dragging.current = true;
                    moved.current = false;
                    startPointer.current = pointerAngle(event);
                    startAngle.current = angle.current;
                    onInteractStart();
                    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
                }}
                onPointerMove={(event) => {
                    if (!dragging.current) return;
                    event.stopPropagation();
                    let delta = pointerAngle(event) - startPointer.current;
                    if (delta > 180) delta -= 360;
                    if (delta < -180) delta += 360;
                    if (Math.abs(delta) > 0.5) moved.current = true;
                    applyAngle(startAngle.current + delta);
                }}
                onPointerUp={(event) => {
                    event.stopPropagation();
                    (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
                    if (!moved.current) {
                        const tapped = nearestMode(pointerAngle(event));
                        applyAngle(tapped.angle);
                        onMode(tapped.id);
                        dragging.current = false;
                        onInteractEnd();
                        return;
                    }
                    finish();
                }}
                onPointerCancel={() => finish()}
            >
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 0.03, 64]} />
                    <meshPhysicalMaterial color="#1b1e21" roughness={0.55} metalness={0.1} clearcoat={0.15} />
                </mesh>
                <mesh position={[0, 0, 0.019]}>
                    <torusGeometry args={[0.089, 0.0036, 8, 56]} />
                    <meshStandardMaterial color="#3a3f44" roughness={0.5} metalness={0.35} />
                </mesh>
                <mesh position={[0, 0.063, 0.024]}>
                    <boxGeometry args={[0.018, 0.065, 0.002]} />
                    <meshStandardMaterial color="#0a0c0d" roughness={0.35} />
                </mesh>
                <mesh position={[0, 0.061, 0.025]}>
                    <boxGeometry args={[0.006, 0.055, 0.0015]} />
                    <meshBasicMaterial color="#eef3f5" />
                </mesh>
                <mesh position={[0, 0.094, 0.025]}>
                    <boxGeometry args={[0.014, 0.014, 0.002]} />
                    <meshBasicMaterial color="#eef3f5" />
                </mesh>
                <mesh position={[0, 0, 0.019]}>
                    <circleGeometry args={[0.03, 48]} />
                    <meshStandardMaterial color="#24282c" roughness={0.32} metalness={0.55} />
                </mesh>
            </group>
        </group>
    );
}

export function MultimeterModel({
    mode,
    hold,
    backlight,
    onMode,
    onHold,
    onBacklight,
    onInteractStart,
    onInteractEnd,
    anchors,
    bodyRef,
}: MultimeterModelProps) {
    const panelTexture = useMemo(() => getFrontPanelTexture(), []);
    const backPlate = useMemo(() => getBackPlateTexture(), []);

    return (
        <group ref={bodyRef}>
            <RoundedBox args={[0.46, 1.02, 0.18]} radius={0.062} smoothness={7} position={[0, 0.51, 0]} castShadow receiveShadow>
                <meshPhysicalMaterial color={BRAND_ORANGE} roughness={0.46} metalness={0} clearcoat={0.24} clearcoatRoughness={0.6} />
            </RoundedBox>

            <RoundedBox args={[0.022, 0.5, 0.092]} radius={0.012} smoothness={5} position={[-0.225, 0.5, 0]} castShadow>
                <meshPhysicalMaterial color="#303439" roughness={0.86} metalness={0} clearcoat={0.06} />
            </RoundedBox>
            <RoundedBox args={[0.022, 0.5, 0.092]} radius={0.012} smoothness={5} position={[0.225, 0.5, 0]} castShadow>
                <meshPhysicalMaterial color="#303439" roughness={0.86} metalness={0} clearcoat={0.06} />
            </RoundedBox>
            <RoundedBox args={[0.414, 0.05, 0.166]} radius={0.02} smoothness={5} position={[0, 0.022, 0]} castShadow>
                <meshPhysicalMaterial color="#202326" roughness={0.9} metalness={0} clearcoat={0.04} />
            </RoundedBox>

            <RoundedBox args={[0.08, 0.014, 0.11]} radius={0.006} smoothness={3} position={[0, 0.006, 0.02]} castShadow>
                <meshStandardMaterial color="#15181a" roughness={0.9} />
            </RoundedBox>

            <RoundedBox args={[0.382, 0.884, 0.022]} radius={0.035} smoothness={6} position={[0, PANEL_Y, PANEL_Z - 0.002]}>
                <meshPhysicalMaterial color="#101214" roughness={0.8} clearcoat={0.05} />
            </RoundedBox>

            <group position={[0, PANEL_Y, PANEL_Z]}>
                <RoundedBox args={[0.362, 0.864, 0.016]} radius={0.03} smoothness={6}>
                    <meshStandardMaterial color="#202428" roughness={0.62} metalness={0.08} />
                </RoundedBox>
                <mesh position={[0, 0, 0.0095]}>
                    <planeGeometry args={[0.34, 0.818]} />
                    <meshStandardMaterial map={panelTexture} roughness={0.58} metalness={0.04} />
                </mesh>
                <BrandLogo position={[0, 0.382, 0.0105]} width={0.21} />

                <LcdScreen mode={mode} hold={hold} backlight={backlight} />

                {PUSH_BUTTONS.map((label, index) => {
                    const yellow = label === "HOLD";
                    const action = label === "HOLD" ? onHold : label === "LIGHT" ? onBacklight : () => undefined;
                    return (
                        <PanelButton
                            key={label}
                            label={label}
                            yellow={yellow}
                            position={[BUTTON_X[index], BUTTON_ROW_Y - PANEL_Y, 0.016]}
                            onPress={action}
                            onInteractStart={onInteractStart}
                            onInteractEnd={onInteractEnd}
                        />
                    );
                })}

                <Dial mode={mode} onMode={onMode} onInteractStart={onInteractStart} onInteractEnd={onInteractEnd} />

                <Jack x={JACK_X[0]} color="#a3241c" plug={false} />
                <Jack x={JACK_X[1]} color="#23272b" plug anchorRef={anchors.black} />
                <Jack x={JACK_X[2]} color="#a3241c" plug anchorRef={anchors.red} />
            </group>

            <RoundedBox args={[0.24, 0.34, 0.012]} radius={0.02} smoothness={4} position={[0, 0.39, -0.092]} castShadow>
                <meshPhysicalMaterial color="#d96717" roughness={0.6} clearcoat={0.12} />
            </RoundedBox>
            <mesh position={[0, 0.545, -0.098]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.011, 0.011, 0.005, 20]} />
                <meshStandardMaterial color="#5d6a72" roughness={0.35} metalness={0.7} />
            </mesh>

            <RoundedBox args={[0.23, 0.09, 0.006]} radius={0.01} smoothness={4} position={[0, 0.872, -0.0935]} castShadow>
                <meshPhysicalMaterial color="#171b1e" roughness={0.6} clearcoat={0.1} />
            </RoundedBox>
            <BrandLogo position={[0, 0.886, -0.0975]} rotation={[0, Math.PI, 0]} width={0.2} />
            <mesh position={[0, 0.842, -0.0975]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[0.17, 0.02125]} />
                <meshBasicMaterial map={backPlate} transparent depthWrite={false} toneMapped={false} />
            </mesh>

            <group position={[0, 0.6, -0.086]} rotation={[0.34, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.012, 0.012, 0.11, 18]} />
                    <meshStandardMaterial color="#1b1f22" roughness={0.7} />
                </mesh>
                <RoundedBox args={[0.09, 0.62, 0.018]} radius={0.01} smoothness={4} position={[0, -0.31, 0]} castShadow>
                    <meshPhysicalMaterial color="#e06b15" roughness={0.55} clearcoat={0.1} />
                </RoundedBox>
                <RoundedBox args={[0.1, 0.02, 0.03]} radius={0.006} smoothness={3} position={[0, -0.615, 0.004]} castShadow>
                    <meshStandardMaterial color="#15181a" roughness={0.85} />
                </RoundedBox>
            </group>

            <mesh position={[-0.226, 0.83, 0.008]} castShadow>
                <boxGeometry args={[0.008, 0.05, 0.075]} />
                <meshStandardMaterial color="#2a2110" roughness={0.8} />
            </mesh>
        </group>
    );
}
