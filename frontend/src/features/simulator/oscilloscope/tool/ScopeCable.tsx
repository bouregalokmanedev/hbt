import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { createTubeGeometry, updateTubeGeometry } from "@/features/simulator/multimeter/tool/model/cablePhysics";

const TUBULAR = 150;
const RADIAL = 10;
const FLOOR_Y = 0.008;

export function ScopeCable({
    color,
    startAnchor,
    endAnchor,
    radius,
    side: sideProp,
}: {
    color: string;
    startAnchor: RefObject<THREE.Object3D | null>;
    endAnchor: RefObject<THREE.Group | null>;
    radius: number;
    side?: -1 | 1;
}) {
    const geometry = useMemo(() => createTubeGeometry(TUBULAR, RADIAL), []);
    const points = useMemo(() => Array.from({ length: 7 }, () => new THREE.Vector3()), []);

    useEffect(() => () => geometry.dispose(), [geometry]);

    useFrame(() => {
        if (!startAnchor.current || !endAnchor.current) return;
        startAnchor.current.getWorldPosition(points[0]);
        endAnchor.current.getWorldPosition(points[6]);

        const side = sideProp ?? (points[0].x < -0.01 ? -1 : 1);
        const spread = Math.abs(points[0].x) < 0.01 ? 0.28 : 0.18;
        points[0].y = Math.max(points[0].y, FLOOR_Y + radius);
        points[1].set(
            points[0].x + side * 0.02,
            points[0].y + 0.01,
            points[0].z - 0.02,
        );
        points[2].set(
            points[0].x + side * 0.065,
            points[0].y - 0.11,
            points[0].z - 0.14,
        );
        points[3].set(
            points[0].x + side * spread,
            0.55,
            points[0].z - 0.1,
        );
        points[4].set(
            points[0].x + side * (spread + 0.025),
            0.08,
            points[0].z - 0.03,
        );
        points[5].set(
            points[6].x - side * 0.06,
            FLOOR_Y + radius * 0.9,
            Math.max(0.14, points[6].z - 0.22),
        );
        for (let i = 1; i < 6; i += 1) points[i].y = Math.max(FLOOR_Y + radius, points[i].y);

        updateTubeGeometry(geometry, points, TUBULAR, RADIAL, radius);
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
