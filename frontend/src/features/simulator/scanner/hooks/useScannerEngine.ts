import { useEffect, useState, useSyncExternalStore } from "react";

import { rememberLocalResult, simulatorApi } from "@/features/simulator/api/simulator.api";
import {
    ASSISTANT_TURNS,
    TRAINING_STEPS,
    type TreeStep,
    type VehicleProfile,
} from "../data/scanner.data";
import {
    DEFAULT_TRAINING_CORRECT,
    DEFAULT_TRAINING_OPTIONS,
    DEFAULT_TRAINING_WEIGHTS,
    fetchCatalog,
    getPackTree,
    getTrainingSession,
    resolveTreeSteps,
    resolveVehicleProfile,
    type TrainingSession,
} from "../data/catalog";
import { ScannerEngine, type ScannerState, type SessionResult, type TrainingStepCfg } from "../engine/scanner.engine";

const registry = new Map<string, ScannerEngine>();

function engineKey(vehicleId: string, session: TrainingSession | null, tree: TreeStep[]): string {
    return `scanner:${vehicleId}:${session?.id ?? "default"}:${tree.map((s) => s.id).join("|")}`;
}

export function getScannerEngine(
    vehicleId: string,
    profile: VehicleProfile,
    session: TrainingSession | null,
    tree: TreeStep[],
): ScannerEngine {
    const key = engineKey(vehicleId, session, tree);
    let engine = registry.get(key);
    if (!engine) {
        engine = new ScannerEngine(
            { vehicleId },
            {
                params: profile.pids,
                nodes: profile.nodes,
                tree,
                trainingSteps: session && session.steps.length > 0 ? session.steps.length : TRAINING_STEPS.length,
                trainingCorrect: session?.correctIndex ?? DEFAULT_TRAINING_CORRECT,
                trainingWeights: session?.weights ?? DEFAULT_TRAINING_WEIGHTS,
                trainingScenarioId: session?.id,
                trainingOptions: session ? session.options : DEFAULT_TRAINING_OPTIONS,
                trainingStepsCfg: session
                    ? session.steps.map<TrainingStepCfg>((s) => ({
                          id: s.id,
                          screen: s.screen,
                          label: s.label,
                          question: s.question,
                          // undefined ⇒ inherit session options; both empty ⇒ observation step (mark complete only)
                          options: s.options ?? session.options,
                          correctIndex: s.correctIndex ?? session.correctIndex ?? DEFAULT_TRAINING_CORRECT,
                      }))
                    : undefined,
                trainingPassScore: session?.passScore ?? 70,
                trainingHintBudget: session?.hintBudget,
                assistantTurns: ASSISTANT_TURNS.length,
                adasDone: profile.adasDone,
            },
        );
        registry.set(key, engine);
    }
    return engine;
}

export function disposeScannerEngine(
    vehicleId: string,
    session: TrainingSession | null = null,
    tree: TreeStep[] = [],
): void {
    const key = engineKey(vehicleId, session, tree);
    registry.get(key)?.dispose();
    registry.delete(key);
}

export interface VehicleLabData {
    profile: VehicleProfile;
    session: TrainingSession | null;
    tree: TreeStep[];
}

/**
 * React bridge — the only place UI meets the engine. Engine state flows out
 * via useSyncExternalStore; SessionResults flow to the backend session.
 */
export function useScannerEngine(
    vehicleId: string,
    sessionId: string | null,
): {
    engine: ScannerEngine | null;
    state: ScannerState | null;
    labData: VehicleLabData | null;
    unavailable: boolean;
    lastResult: SessionResult | null;
} {
    // Resolve the fault profile + training session first. Backend vehicles
    // require a warm catalogue — until then there is deliberately no engine,
    // so the lab can never run on a silently wrong fallback profile.
    const [labData, setLabData] = useState<VehicleLabData | null>(() => {
        if (vehicleId.startsWith("backend:")) return null;
        const profile = resolveVehicleProfile(vehicleId);
        return profile ? { profile, session: null, tree: resolveTreeSteps(profile) } : null;
    });
    const [engine, setEngine] = useState<ScannerEngine | null>(null);
    const [unavailable, setUnavailable] = useState(false);
    const [lastResult, setLastResult] = useState<SessionResult | null>(null);

    useEffect(() => {
        let cancelled = false;
        if (!vehicleId.startsWith("backend:")) {
            const profile = resolveVehicleProfile(vehicleId);
            if (!cancelled) setLabData(profile ? { profile, session: null, tree: resolveTreeSteps(profile) } : null);
            return;
        }
        void fetchCatalog().then(() => {
            if (cancelled) return;
            const profile = resolveVehicleProfile(vehicleId);
            if (!profile) {
                setLabData(null);
                setUnavailable(true);
                return;
            }
            setUnavailable(false);
            const session = getTrainingSession(vehicleId);
            setLabData({ profile, session, tree: resolveTreeSteps(profile, getPackTree(vehicleId)) });
        });
        return () => {
            cancelled = true;
        };
    }, [vehicleId]);

    useEffect(() => {
        if (!labData) {
            setEngine(null);
            return;
        }
        const created = getScannerEngine(vehicleId, labData.profile, labData.session, labData.tree);
        setEngine(created);
        created.startLive();
        const off = created.onComplete((result) => {
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
                        tool: "scanner",
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
        return () => {
            off();
        };
    }, [vehicleId, labData, sessionId]);

    useEffect(
        () => () => {
            if (labData) disposeScannerEngine(vehicleId, labData.session, labData.tree);
        },
        [vehicleId, labData],
    );

    const state = useSyncExternalStore(
        (listener) => engine?.subscribe(listener) ?? (() => {}),
        () => engine?.getState() ?? null,
        () => engine?.getState() ?? null,
    );

    return { engine, state, labData, unavailable, lastResult };
}
