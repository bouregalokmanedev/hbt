import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { ScopeCable } from "./ScopeCable";
import { Probe } from "@/features/simulator/multimeter/tool/model/Probe";

import type { ScopeEngine, ScopeEngineState } from "../engine/scope.engine";
import { OscilloscopeModel } from "./model/OscilloscopeModel";

export type InteractionMode = "orbit" | "move" | "rotate";

const DEVICE_Y = 0.002;
const RED_START: [number, number, number] = [-0.34, 0.019, 0.41];
const BLACK_START: [number, number, number] = [0.14, 0.019, 0.38];
const BLUE_START: [number, number, number] = [0.29, 0.019, 0.19];
const HOME_TARGET = new THREE.Vector3(0, 0.49, 0.02);
const HOME_CAMERA = new THREE.Vector3(0.68, 0.69, 2.28);
const NARROW_CAMERA = new THREE.Vector3(0.48, 0.75, 2.56);

function useStageTexture() {
    return useMemo(() => {
        const size = 1024;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, "#f8f9fa");
        gradient.addColorStop(0.22, "#f2f4f6");
        gradient.addColorStop(0.42, "#ecf0f2");
        gradient.addColorStop(0.58, "#e6eaed");
        gradient.addColorStop(0.68, "#e2e7ea");
        gradient.addColorStop(1, "#e2e7ea");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }, []);
}

function StudioEnvironment() {
    const gl = useThree((state) => state.gl);
    const scene = useThree((state) => state.scene);
    useEffect(() => {
        const pmrem = new THREE.PMREMGenerator(gl);
        const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = environment;
        scene.environmentIntensity = 0.52;
        return () => {
            scene.environment = null;
            environment.dispose();
            pmrem.dispose();
        };
    }, [gl, scene]);
    return null;
}

function useSoftShadowTexture() {
    return useMemo(() => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gradient.addColorStop(0, "rgba(0,0,0,0.65)");
        gradient.addColorStop(0.4, "rgba(0,0,0,0.34)");
        gradient.addColorStop(0.72, "rgba(0,0,0,0.1)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }, []);
}

function StudioFloor() {
    const texture = useStageTexture();
    useEffect(() => () => texture?.dispose(), [texture]);
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
                <planeGeometry args={[20, 20]} />
                <meshBasicMaterial map={texture ?? undefined} color={texture ? "#ffffff" : "#e7ebee"} toneMapped={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
                <planeGeometry args={[4.6, 4.6]} />
                <shadowMaterial transparent opacity={0.22} color="#000000" />
            </mesh>
        </>
    );
}

function DeviceShadow({ target }: { target: RefObject<THREE.Group | null> }) {
    const texture = useSoftShadowTexture();
    const shadow = useRef<THREE.Mesh>(null);
    useEffect(() => () => texture?.dispose(), [texture]);
    useFrame(() => {
        if (!shadow.current || !target.current) return;
        shadow.current.position.x = target.current.position.x;
        shadow.current.position.z = target.current.position.z;
    });
    return (
        <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0005, 0]}>
            <planeGeometry args={[1.26, 1.42]} />
            <meshBasicMaterial map={texture ?? undefined} transparent opacity={0.4} depthWrite={false} toneMapped={false} />
        </mesh>
    );
}

interface SceneProps {
    engine: ScopeEngine;
    state: ScopeEngineState;
    interaction: InteractionMode;
    powered: boolean;
    activeChannel: "A" | "B";
    resetSignal: number;
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
}

export function Scene({
    engine,
    state,
    interaction,
    powered,
    activeChannel,
    resetSignal,
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
}: SceneProps) {
    const { gl, camera, size } = useThree();
    const orbit = useRef<OrbitControlsImpl>(null);
    const device = useRef<THREE.Group>(null);
    const body = useRef<THREE.Group>(null);
    const redAnchor = useRef<THREE.Object3D>(null);
    const blackAnchor = useRef<THREE.Object3D>(null);
    const blueAnchor = useRef<THREE.Object3D>(null);
    const redProbe = useRef<THREE.Group>(null);
    const blackProbe = useRef<THREE.Group>(null);
    const blueProbe = useRef<THREE.Group>(null);
    const [interacting, setInteracting] = useState(false);
    const drag = useRef<{ x: number; y: number; px: number; pz: number; yaw: number; offsetX: number; offsetZ: number } | null>(null);
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const ndc = useMemo(() => new THREE.Vector2(), []);
    const hit = useMemo(() => new THREE.Vector3(), []);
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -DEVICE_Y), []);
    useEffect(() => {
        device.current?.position.set(0, DEVICE_Y, 0);
        if (device.current) device.current.rotation.y = 0;
        if (orbit.current) {
            const narrow = size.width / Math.max(1, size.height) < 0.9;
            orbit.current.target.copy(HOME_TARGET);
            camera.position.copy(narrow ? NARROW_CAMERA : HOME_CAMERA);
            orbit.current.update();
            orbit.current.saveState();
        }
    }, [resetSignal, camera, size.height, size.width]);

    useEffect(() => {
        const perspective = camera as THREE.PerspectiveCamera;
        if (!perspective.isPerspectiveCamera) return;
        const nextFov = size.width / Math.max(1, size.height) < 0.9 ? 48 : 30;
        if (perspective.fov === nextFov) return;
        perspective.fov = nextFov;
        perspective.updateProjectionMatrix();
    }, [camera, size.height, size.width]);

    const pauseOrbit = () => {
        setInteracting(true);
        if (orbit.current) orbit.current.enabled = false;
    };
    const resumeOrbit = () => setInteracting(false);

    const pointOnStage = (clientX: number, clientY: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        raycaster.ray.intersectPlane(plane, hit);
        return hit;
    };

    const startDeviceDrag = (event: ThreeEvent<PointerEvent>) => {
        if (interaction === "orbit") return;
        event.stopPropagation();
        const group = device.current;
        if (!group) return;
        const point = pointOnStage(event.clientX, event.clientY);
        drag.current = {
            x: event.clientX,
            y: event.clientY,
            px: group.position.x,
            pz: group.position.z,
            yaw: group.rotation.y,
            offsetX: group.position.x - point.x,
            offsetZ: group.position.z - point.z,
        };

        const move = (native: PointerEvent) => {
            const groupNow = device.current;
            const current = drag.current;
            if (!groupNow || !current) return;
            if (interaction === "move") {
                const next = pointOnStage(native.clientX, native.clientY);
                groupNow.position.x = THREE.MathUtils.clamp(next.x + current.offsetX, -1.05, 1.05);
                groupNow.position.z = THREE.MathUtils.clamp(next.z + current.offsetZ, -0.42, 1.05);
            } else {
                groupNow.rotation.y = current.yaw + (native.clientX - current.x) * 0.012;
            }
        };
        const stop = () => {
            drag.current = null;
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
    };

    return (
        <>
            <color attach="background" args={["#e2e7ea"]} />
            <StudioEnvironment />
            <ambientLight intensity={0.44} />
            <directionalLight
                position={[2.4, 3.6, 2.5]}
                intensity={3.2}
                color="#fff4e4"
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={0.2}
                shadow-camera-far={8}
                shadow-camera-left={-2}
                shadow-camera-right={2}
                shadow-camera-top={2.4}
                shadow-camera-bottom={-1.6}
                shadow-bias={-0.0004}
            />
            <directionalLight position={[-2.5, 1.9, 1.4]} intensity={0.8} color="#9db7d6" />
            <directionalLight position={[0.5, 2.4, -2.9]} intensity={1.5} color="#d4e6ff" />
            <StudioFloor />

            <group
                ref={device}
                position={[0, DEVICE_Y, 0]}
                onPointerDown={startDeviceDrag}
                onPointerOver={() => {
                    if (interaction !== "orbit") gl.domElement.style.cursor = interaction === "move" ? "move" : "ew-resize";
                }}
                onPointerOut={() => {
                    gl.domElement.style.cursor = "auto";
                }}
            >
                <group rotation={[-0.065, 0, 0]}>
                    <OscilloscopeModel
                        engine={engine}
                        state={state}
                        powered={powered}
                        activeChannel={activeChannel}
                        bodyRef={body}
                        anchors={{ red: redAnchor, black: blackAnchor, blue: blueAnchor }}
                        onChannel={onChannel}
                        onTriggerEdge={onTriggerEdge}
                        onRun={onRun}
                        onAuto={onAuto}
                        onPersist={onPersist}
                        onPower={onPower}
                        onTimeStep={onTimeStep}
                        onVdivStep={onVdivStep}
                        onOffsetStep={onOffsetStep}
                        onTriggerStep={onTriggerStep}
                        onInteractStart={pauseOrbit}
                        onInteractEnd={resumeOrbit}
                    />
                </group>
            </group>

            <DeviceShadow target={device} />

            <Probe
                tone="red"
                initial={RED_START}
                rotation={-2.34}
                groupRef={redProbe}
                resetKey={resetSignal}
                onInteractStart={pauseOrbit}
                onInteractEnd={resumeOrbit}
            />
            <Probe
                tone="black"
                initial={BLACK_START}
                rotation={-2.86}
                groupRef={blackProbe}
                resetKey={resetSignal}
                onInteractStart={pauseOrbit}
                onInteractEnd={resumeOrbit}
            />
            <Probe
                tone="blue"
                initial={BLUE_START}
                rotation={-0.8}
                groupRef={blueProbe}
                resetKey={resetSignal}
                onInteractStart={pauseOrbit}
                onInteractEnd={resumeOrbit}
            />

            <ScopeCable color="#b3261f" startAnchor={redAnchor} endAnchor={redProbe} radius={0.0041} side={-1} />
            <ScopeCable color="#141618" startAnchor={blackAnchor} endAnchor={blackProbe} radius={0.0044} side={1} />
            <ScopeCable color="#1f4fd1" startAnchor={blueAnchor} endAnchor={blueProbe} radius={0.004} side={1} />

            <OrbitControls
                ref={orbit}
                makeDefault
                enabled={interaction === "orbit" && !interacting}
                target={[0, 0.5, 0.02]}
                enablePan={false}
                enableDamping
                dampingFactor={0.08}
                minDistance={1.4}
                maxDistance={4.5}
                minPolarAngle={0.16}
                maxPolarAngle={Math.PI / 2 - 0.025}
            />
        </>
    );
}
