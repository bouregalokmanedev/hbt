import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useCursor } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

const FLOOR = 0.019;
const TONE_COLORS = {
    red: { handle: "#b3261f", grip: "#7e1712", collar: "#d94b40" },
    black: { handle: "#17191b", grip: "#080a0b", collar: "#5d656d" },
    blue: { handle: "#1f4fd1", grip: "#0b2a8a", collar: "#4b77ee" },
} as const;

export function Probe({
    tone,
    initial,
    rotation,
    groupRef,
    resetKey,
    onInteractStart,
    onInteractEnd,
}: {
    tone: "red" | "black" | "blue";
    initial: [number, number, number];
    rotation: number;
    groupRef: RefObject<THREE.Group | null>;
    resetKey: number;
    onInteractStart: () => void;
    onInteractEnd: () => void;
}) {
    const { camera, gl } = useThree();
    const [hovered, setHovered] = useState(false);
    const [dragging, setDragging] = useState(false);
    const draggingRef = useRef(false);
    const offset = useMemo(() => new THREE.Vector3(), []);
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -FLOOR), []);
    const hit = useMemo(() => new THREE.Vector3(), []);
    const ndc = useMemo(() => new THREE.Vector2(), []);
    const cleanup = useRef<(() => void) | null>(null);

    useCursor(hovered || dragging, dragging ? "grabbing" : "grab", "auto");

    useEffect(() => {
        const group = groupRef.current;
        if (!group) return;
        group.position.set(initial[0], FLOOR, initial[2]);
        group.rotation.set(0, rotation, 0);
    }, [groupRef, initial, rotation, resetKey]);

    useEffect(() => {
        return () => {
            cleanup.current?.();
        };
    }, []);

    const pointOnFloor = (clientX: number, clientY: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        raycaster.ray.intersectPlane(plane, hit);
        return hit;
    };

    const startDrag = (event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        const group = groupRef.current;
        if (!group) return;
        onInteractStart();
        draggingRef.current = true;
        setDragging(true);
        const point = pointOnFloor(event.clientX, event.clientY);
        offset.set(group.position.x - point.x, 0, group.position.z - point.z);

        const move = (native: PointerEvent) => {
            if (!draggingRef.current || !groupRef.current) return;
            const next = pointOnFloor(native.clientX, native.clientY);
            const x = THREE.MathUtils.clamp(next.x + offset.x, -1.15, 1.15);
            const z = THREE.MathUtils.clamp(next.z + offset.z, 0.08, 1.45);
            groupRef.current.position.set(x, FLOOR, z);
        };
        const stop = () => {
            draggingRef.current = false;
            setDragging(false);
            onInteractEnd();
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
            cleanup.current = null;
        };
        cleanup.current?.();
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
        cleanup.current = stop;
    };

    const { handle, grip, collar } = TONE_COLORS[tone];

    return (
        <group
            ref={groupRef}
            position={[initial[0], FLOOR, initial[2]]}
            rotation={[0, rotation, 0]}
            onPointerDown={startDrag}
            onPointerOver={(event) => {
                event.stopPropagation();
                setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
        >
            <mesh position={[0.079, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.0155, 0.017, 0.136, 24]} />
                <meshPhysicalMaterial color={handle} roughness={0.42} clearcoat={0.4} clearcoatRoughness={0.35} />
            </mesh>
            {[0.045, 0.062, 0.079, 0.096, 0.113].map((x) => (
                <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.0182, 0.0182, 0.0045, 24]} />
                    <meshStandardMaterial color={grip} roughness={0.7} />
                </mesh>
            ))}
            <mesh position={[0.139, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.0175, 0.0165, 0.022, 24]} />
                <meshPhysicalMaterial color={collar} roughness={0.38} clearcoat={0.3} />
            </mesh>
            <mesh position={[0.164, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.0042, 0.0042, 0.06, 16]} />
                <meshStandardMaterial color="#c8d0d6" roughness={0.24} metalness={0.92} />
            </mesh>
            <mesh position={[0.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
                <coneGeometry args={[0.0042, 0.022, 16]} />
                <meshStandardMaterial color="#d5dce1" roughness={0.2} metalness={0.94} />
            </mesh>
            <mesh position={[0.011, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.0115, 0.0138, 0.026, 20]} />
                <meshStandardMaterial color={grip} roughness={0.78} />
            </mesh>
            <mesh position={[0.003, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.0085, 0.0105, 0.014, 16]} />
                <meshStandardMaterial color={grip} roughness={0.85} />
            </mesh>
            <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.032, 0.032, 0.24, 12]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
        </group>
    );
}
