import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { rememberLocalResult, simulatorApi } from "@/features/simulator/api/simulator.api";
import { MeterProcedureEngine, type MeterProcedureState } from "../engine/meter.engine";
import type { SessionResult } from "@/features/simulator/scanner/engine/scanner.engine";
import { fetchCatalog, getMultimeterProceduresForVehicle, isCatalogWarm } from "@/features/simulator/scanner/data/catalog";

const registry = new Map<string, MeterProcedureEngine>();

export function getMeterEngine(vehicleId: string, focus?: string | null, procedures?: import("../data/multimeter.data").MeterProcedureComponent[]): MeterProcedureEngine {
    const key = `multimeter:${vehicleId}:${focus ?? "default"}:${procedures ? "pack" : "static"}`;
    let engine = registry.get(key);
    if (!engine) {
        engine = new MeterProcedureEngine({ vehicleId, focus: focus ?? undefined, procedures });
        registry.set(key, engine);
    }
    return engine;
}

export function disposeMeterEngine(vehicleId: string, focus?: string | null, procedures?: import("../data/multimeter.data").MeterProcedureComponent[]): void {
    const key = `multimeter:${vehicleId}:${focus ?? "default"}:${procedures ? "pack" : "static"}`;
    registry.get(key)?.dispose();
    registry.delete(key);
}

/**
 * React bridge — the only place UI meets the engine. Procedure state flows
 * out via useSyncExternalStore; SessionResults complete the backend session.
 */
export function useMeterProcedure(
    vehicleId: string,
    sessionId: string | null,
    focus?: string | null,
): {
    engine: MeterProcedureEngine | null;
    state: MeterProcedureState | null;
    lastResult: SessionResult | null;
} {
    const [engine, setEngine] = useState<MeterProcedureEngine | null>(null);
    const [lastResult, setLastResult] = useState<SessionResult | null>(null);
    const proceduresRef = useRef<import("../data/multimeter.data").MeterProcedureComponent[] | undefined>(undefined);

    useEffect(() => {
        let cancelled = false;
        let created: MeterProcedureEngine | null = null;
        let off: (() => void) | null = null;

        const init = async () => {
            let procedures: import("../data/multimeter.data").MeterProcedureComponent[] | undefined;
            if (vehicleId.startsWith("backend:")) {
                if (!isCatalogWarm()) await fetchCatalog().catch(() => undefined);
                const pack = getMultimeterProceduresForVehicle(vehicleId);
                if (pack) procedures = pack;
            }
            if (cancelled) return;
            proceduresRef.current = procedures;
            created = getMeterEngine(vehicleId, focus, procedures);
            setEngine(created);
            created.startTimer();
            off = created.onComplete((result) => {
                const stamped = { ...result, at: result.at || Date.now() };
                setLastResult(stamped);
                if (!sessionId) return;
                const payload = {
                    score: result.score,
                    outcome: result.outcome,
                    verdict: result.verdict,
                    attempts: result.attempts,
                    hints_used: result.hintsUsed,
                    duration_seconds: result.durationSeconds,
                    scenario_key: result.scenarioId,
                    steps: result.steps,
                    metadata: {
                        scenarioId: result.scenarioId,
                        at: stamped.at,
                        vehicleId,
                        hintsUsed: result.hintsUsed,
                        attempts: result.attempts,
                    },
                };
                void simulatorApi
                    .complete(sessionId, payload)
                    .catch(() => {
                        rememberLocalResult({
                            id: `local-${sessionId}-${stamped.at}`,
                            session_id: sessionId,
                            tool: "multimeter",
                            score: payload.score,
                            outcome: payload.outcome,
                            verdict: payload.verdict,
                            attempts: payload.attempts ?? null,
                            hints_used: payload.hints_used ?? null,
                            duration_seconds: payload.duration_seconds ?? null,
                            scenario_key: payload.scenario_key ?? null,
                            steps: payload.steps as { label: string; ok: boolean }[] | null,
                            metadata: payload.metadata as never,
                            created_at: new Date().toISOString(),
                        });
                    });
            });
        };
        void init();
        return () => {
            cancelled = true;
            if (off) off();
        };
    }, [vehicleId, focus, sessionId]);

    useEffect(
        () => () => {
            disposeMeterEngine(vehicleId, focus, proceduresRef.current);
        },
        [vehicleId, focus],
    );

    const state = useSyncExternalStore(
        (listener) => engine?.subscribe(listener) ?? (() => {}),
        () => engine?.getState() ?? null,
        () => engine?.getState() ?? null,
    );

    return { engine, state, lastResult };
}
