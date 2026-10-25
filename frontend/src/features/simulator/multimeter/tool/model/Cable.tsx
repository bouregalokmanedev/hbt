import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { CableSolver, createTubeGeometry, updateTubeGeometry, type BoxCollider } from "./cablePhysics";

const SOLVER_POINTS = 60;
const TUBULAR = 140;
const RADIAL = 10;
const RADIUS = 0.0062;

export function Cable({
    color,
    startAnchor,
    endAnchor,
    colliders,
    resetKey,
    variant,
    controlPoints,
    radius = RADIUS,
}: {
    color: string;
    startAnchor: RefObject<THREE.Object3D | null>;
    endAnchor: RefObject<THREE.Group | null>;
    colliders: BoxCollider[];
    resetKey: number;
    variant: "red" | "black" | "blue";
    controlPoints?: THREE.Vector3[];
    radius?: number;
}) {
    const solver = useRef<CableSolver | null>(null);
    const geometry = useMemo(() => createTubeGeometry(TUBULAR, RADIAL), []);
    const start = useMemo(() => new THREE.Vector3(), []);
    const end = useMemo(() => new THREE.Vector3(), []);

    useEffect(() => {
        solver.current = null;
    }, [resetKey, variant]);

    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);

    useFrame((_, delta) => {
        if (!startAnchor.current || !endAnchor.current) return;
        startAnchor.current.getWorldPosition(start);
        endAnchor.current.getWorldPosition(end);

        if (!solver.current) {
            const fallback =
                variant === "red"
                    ? [
                          new THREE.Vector3(0.16, 0.14, 0.24),
                          new THREE.Vector3(0.13, 0.04, 0.33),
                          new THREE.Vector3(0.02, 0.018, 0.4),
                          new THREE.Vector3(-0.16, 0.018, 0.46),
                          new THREE.Vector3(-0.3, 0.018, 0.49),
                      ]
                    : variant === "blue"
                      ? [
                            new THREE.Vector3(-0.16, 0.14, 0.24),
                            new THREE.Vector3(-0.13, 0.04, 0.33),
                            new THREE.Vector3(-0.02, 0.018, 0.4),
                            new THREE.Vector3(0.16, 0.018, 0.46),
                            new THREE.Vector3(0.3, 0.018, 0.49),
                        ]
                      : [
                            new THREE.Vector3(0.06, 0.14, 0.25),
                            new THREE.Vector3(0.12, 0.04, 0.34),
                            new THREE.Vector3(0.2, 0.018, 0.43),
                            new THREE.Vector3(0.26, 0.018, 0.5),
                            new THREE.Vector3(0.3, 0.018, 0.54),
                        ];
            const controls = controlPoints?.map((point) => point.clone()) ?? fallback;
            solver.current = new CableSolver(start.clone(), end.clone(), SOLVER_POINTS, controls);
        }

        solver.current.step(Math.min(delta, 1 / 30), start, end, colliders);
        updateTubeGeometry(geometry, solver.current.points, TUBULAR, RADIAL, radius);
    });

    return (
        <mesh geometry={geometry} castShadow receiveShadow frustumCulled={false}>
            <meshPhysicalMaterial
                color={color}
                roughness={0.42}
                metalness={0.02}
                clearcoat={0.4}
                clearcoatRoughness={0.45}
            />
        </mesh>
    );
}
