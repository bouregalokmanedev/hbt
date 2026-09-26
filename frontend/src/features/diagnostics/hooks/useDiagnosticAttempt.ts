import { useCallback, useEffect, useState } from "react";

import {
    answerDiagnosticStep,
    getDiagnosticHints,
    getDiagnosticResult,
    resumeDiagnosticAttempt,
    revealDiagnosticHint,
    submitDiagnosticAttempt,
} from "../api/diagnostics.api";

import type {
    DiagnosticAttempt,
    DiagnosticResult,
    DiagnosticTool,
    HintsState,
} from "../types/diagnostic.types";

export function useDiagnosticAttempt(attemptId: string | undefined) {
    const [attempt, setAttempt] = useState<DiagnosticAttempt | null>(null);
    const [hints, setHints] = useState<HintsState | null>(null);
    const [result, setResult] = useState<DiagnosticResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const reload = useCallback(async () => {
        if (!attemptId) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const [loadedAttempt, loadedHints] = await Promise.all([
                resumeDiagnosticAttempt(attemptId),
                getDiagnosticHints(attemptId).catch(() => null),
            ]);

            setAttempt(loadedAttempt);
            setHints(loadedHints);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Unable to load attempt.");
        } finally {
            setIsLoading(false);
        }
    }, [attemptId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const answerStep = useCallback(
        async (stepId: string, payload: Record<string, unknown>, tool?: DiagnosticTool) => {
            if (!attemptId) {
                return null;
            }

            setIsSaving(true);

            try {
                const outcome = await answerDiagnosticStep(attemptId, stepId, payload, tool);
                await reload();

                return outcome;
            } finally {
                setIsSaving(false);
            }
        },
        [attemptId, reload],
    );

    const revealHint = useCallback(
        async (hintId: string) => {
            if (!attemptId) {
                return null;
            }

            setIsSaving(true);

            try {
                const outcome = await revealDiagnosticHint(attemptId, hintId);
                setHints(await getDiagnosticHints(attemptId).catch(() => null));

                return outcome;
            } finally {
                setIsSaving(false);
            }
        },
        [attemptId],
    );

    const submit = useCallback(async () => {
        if (!attemptId) {
            return null;
        }

        setIsSaving(true);

        try {
            await submitDiagnosticAttempt(attemptId);
            const loadedResult = await getDiagnosticResult(attemptId);
            setResult(loadedResult);

            return loadedResult;
        } finally {
            setIsSaving(false);
        }
    }, [attemptId]);

    return { attempt, hints, result, isLoading, isSaving, error, reload, answerStep, revealHint, submit };
}
