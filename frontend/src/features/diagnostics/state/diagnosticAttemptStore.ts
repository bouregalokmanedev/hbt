import { create } from "zustand";

import type { DiagnosticAttempt, DiagnosticResult, HintsState } from "../types/diagnostic.types";

type State = {
    attempt: DiagnosticAttempt | null;
    hints: HintsState | null;
    result: DiagnosticResult | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
};

type Actions = {
    setAttempt(a: DiagnosticAttempt | null): void;
    setHints(h: HintsState | null): void;
    setResult(r: DiagnosticResult | null): void;
    setLoading(v: boolean): void;
    setSaving(v: boolean): void;
    setError(e: string | null): void;
    reset(): void;
};

export const useDiagnosticAttemptStore = create<State & Actions>((set) => ({
    attempt: null,
    hints: null,
    result: null,
    isLoading: true,
    isSaving: false,
    error: null,
    setAttempt: (attempt) => set({ attempt }),
    setHints: (hints) => set({ hints }),
    setResult: (result) => set({ result }),
    setLoading: (isLoading) => set({ isLoading }),
    setSaving: (isSaving) => set({ isSaving }),
    setError: (error) => set({ error }),
    reset: () => set({ attempt: null, hints: null, result: null, isLoading: true, isSaving: false, error: null }),
}));
