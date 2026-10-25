import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

import type { ScopeEngine, ScopeEngineState } from "../../engine/scope.engine";
import { createScopeScreenPainter } from "./textures";

export function ScopeScreen({
    engine,
    state,
    powered,
}: {
    engine: ScopeEngine;
    state: ScopeEngineState;
    powered: boolean;
}) {
    const [painter] = useState(createScopeScreenPainter);
    const sweep = useRef(0);
    const elapsed = useRef(0);

    useEffect(() => {
        painter.draw(engine, state, sweep.current, powered);
    }, [engine, state, powered, painter]);

    useEffect(() => {
        return () => painter.dispose();
    }, [painter]);

    useFrame((_, delta) => {
        if (state.running) sweep.current += delta * engine.span() * 0.7;
        elapsed.current += delta;
        if (elapsed.current < 1 / 24) return;
        elapsed.current = 0;
        painter.draw(engine, state, sweep.current, powered);
    });

    return (
        <mesh position={[0, 0, 0.0145]}>
            <planeGeometry args={[0.374, 0.374]} />
            <meshBasicMaterial map={painter.texture} toneMapped={false} />
        </mesh>
    );
}
