import { create } from "zustand";

import type { DiagnosticTool } from "../types/diagnostic.types";

type State = {
    selectedStepId: string | null;
    tool: DiagnosticTool;
    finding: string;
    measurement: string;
    // per-tool drafts kept here so switching tools doesn't lose input
    scannerDtc: string;
    scannerLive: string;
    scannerInterp: string;
    mmMode: string;
    mmRed: string;
    mmBlack: string;
    mmReading: string;
    scopeChannel: string;
    scopeTime: string;
    scopeVolt: string;
    scopeObs: string;
    locComponent: string;
    locView: string;
    locNote: string;
    schFrom: string;
    schTo: string;
    schWire: string;
    schVerdict: string;
    feedback: string | null;
};

type Actions = {
    setSelectedStepId(id: string | null): void;
    setTool(t: DiagnosticTool): void;
    setFinding(v: string): void;
    setMeasurement(v: string): void;
    setScannerDtc(v: string): void;
    setScannerLive(v: string): void;
    setScannerInterp(v: string): void;
    setMmMode(v: string): void;
    setMmRed(v: string): void;
    setMmBlack(v: string): void;
    setMmReading(v: string): void;
    setScopeChannel(v: string): void;
    setScopeTime(v: string): void;
    setScopeVolt(v: string): void;
    setScopeObs(v: string): void;
    setLocComponent(v: string): void;
    setLocView(v: string): void;
    setLocNote(v: string): void;
    setSchFrom(v: string): void;
    setSchTo(v: string): void;
    setSchWire(v: string): void;
    setSchVerdict(v: string): void;
    setFeedback(v: string | null): void;
    clearStepInputs(): void;
};

export const useDiagnosticWorkspaceStore = create<State & Actions>((set) => ({
    selectedStepId: null,
    tool: "scanner",
    finding: "",
    measurement: "",
    scannerDtc: "",
    scannerLive: "",
    scannerInterp: "",
    mmMode: "VDC",
    mmRed: "",
    mmBlack: "",
    mmReading: "",
    scopeChannel: "A · INJ",
    scopeTime: "2 ms",
    scopeVolt: "5 V",
    scopeObs: "",
    locComponent: "X1 · Crank",
    locView: "Engine bay",
    locNote: "",
    schFrom: "E1 · B20",
    schTo: "INJ1 · pin 2",
    schWire: "Black",
    schVerdict: "",
    feedback: null,
    setSelectedStepId: (selectedStepId) => set({ selectedStepId }),
    setTool: (tool) => set({ tool }),
    setFinding: (finding) => set({ finding }),
    setMeasurement: (measurement) => set({ measurement }),
    setScannerDtc: (scannerDtc) => set({ scannerDtc }),
    setScannerLive: (scannerLive) => set({ scannerLive }),
    setScannerInterp: (scannerInterp) => set({ scannerInterp }),
    setMmMode: (mmMode) => set({ mmMode }),
    setMmRed: (mmRed) => set({ mmRed }),
    setMmBlack: (mmBlack) => set({ mmBlack }),
    setMmReading: (mmReading) => set({ mmReading }),
    setScopeChannel: (scopeChannel) => set({ scopeChannel }),
    setScopeTime: (scopeTime) => set({ scopeTime }),
    setScopeVolt: (scopeVolt) => set({ scopeVolt }),
    setScopeObs: (scopeObs) => set({ scopeObs }),
    setLocComponent: (locComponent) => set({ locComponent }),
    setLocView: (locView) => set({ locView }),
    setLocNote: (locNote) => set({ locNote }),
    setSchFrom: (schFrom) => set({ schFrom }),
    setSchTo: (schTo) => set({ schTo }),
    setSchWire: (schWire) => set({ schWire }),
    setSchVerdict: (schVerdict) => set({ schVerdict }),
    setFeedback: (feedback) => set({ feedback }),
    clearStepInputs: () => set({ finding: "", measurement: "" }),
}));
