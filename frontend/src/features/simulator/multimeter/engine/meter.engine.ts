/**
 * Framework-free multimeter procedure engine — ported from the
 * hb-tronics-simulator reference (packages/sim-multimeter). No React/DOM
 * imports. Probe placement (drag or click resolve to the same intents),
 * interactive front jacks, OHM polarity-agnostic pairing, deterministic
 * fault injection, structured LCD readings, soft-fail judging (−4 wrong /
 * −3 hint), clear/found completion.
 */
import { Engine, Rng, type SessionResult } from "@/features/simulator/scanner/engine/scanner.engine";

import {
    MM_PROCEDURES,
    mmProcedureByRef,
    type MeterMode,
    type MeterProcedureComponent,
    type ProbeTarget,
} from "../data/multimeter.data";

export type Lead = "red" | "black";
export type JackId = "COM" | "V/Ω" | "mA" | "A";
export type ReadingStatus = "off" | "unseated" | "wrongJack" | "wrongMode" | "wrongPoints" | "ok";

export interface MeterReading {
    value: string;
    unit: string;
    status: ReadingStatus;
    spec: string;
    flag: string;
    faulted: boolean;
}

export interface Placement {
    seated: boolean;
    modeOk: boolean;
    pairOk: boolean;
    jackOk: boolean;
    redOk: boolean;
    blackOk: boolean;
}

export type CompletionStatus = "clear" | "found";

export interface MeterFeedback {
    tone: "warn" | "bad" | "good";
    kind: string;
    /** Soft-fail detail: measured vs expected when available. */
    detail?: { value?: string; spec?: string; unit?: string };
}

export interface MeterProcedureState {
    compRef: string;
    mode: MeterMode;
    red: ProbeTarget | null;
    black: ProbeTarget | null;
    redJack: JackId | null;
    blackJack: JackId | null;
    lead: Lead;
    stepIdx: number;
    score: number;
    attempts: number;
    hintUsed: boolean;
    faultAt: number;
    done: Record<string, { steps: number; total: number; score: number; status: CompletionStatus }>;
    feedback: MeterFeedback | null;
    elapsed: number;
    finished: boolean;
}

export interface MeterEngineContext {
    vehicleId: string;
    focus?: string | null;
    seed?: number;
    randomFault?: boolean;
    procedures?: MeterProcedureComponent[];
}

interface ClockLike {
    start: (cb: () => void) => void;
    stop: () => void;
}

class SecondTicker implements ClockLike {
    private id: number | null = null;
    private listener: (() => void) | null = null;

    subscribe(listener: () => void): void {
        this.listener = listener;
    }

    start(cb: () => void): void {
        this.listener = cb;
        if (this.id !== null) return;
        this.id = window.setInterval(() => this.listener?.(), 1000);
    }

    stop(): void {
        if (this.id !== null) {
            window.clearInterval(this.id);
            this.id = null;
        }
    }
}

const WRONG_PENALTY = 4;
const HINT_PENALTY = 3;
const START_SCORE = 100;

/** Front jack the red lead must occupy for a given dial position. */
export function requiredRedJack(mode: MeterMode): JackId | null {
    switch (mode) {
        case "OFF":
            return null;
        case "MA":
            return "mA";
        case "A":
            return "A";
        default:
            return "V/Ω";
    }
}

export class MeterProcedureEngine extends Engine<MeterProcedureState> {
    private state: MeterProcedureState;
    private faults: Record<string, number> = {};
    private done: MeterProcedureState["done"] = {};
    private rng: Rng;
    private randomFault: boolean;
    private source: SecondTicker = new SecondTicker();
    private procedures: MeterProcedureComponent[];

    constructor(private ctx: MeterEngineContext) {
        super();
        this.rng = new Rng(ctx.seed ?? 0x1234);
        this.randomFault = ctx.randomFault ?? false;
        this.procedures = ctx.procedures ?? MM_PROCEDURES;
        const comp = (ctx.focus && this.procByRef(ctx.focus)) || this.procedures[0];
        this.state = this.fresh(comp);
    }

    get vehicleId(): string {
        return this.ctx.vehicleId;
    }

    private procByRef(ref: string): MeterProcedureComponent | undefined {
        return this.procedures.find((p) => p.ref === ref) ?? mmProcedureByRef(ref);
    }

    proceduresList(): MeterProcedureComponent[] {
        return this.procedures;
    }

    private ensureFault(comp: MeterProcedureComponent): number {
        if (this.faults[comp.ref] !== undefined) return this.faults[comp.ref];
        let f: number;
        if (!this.randomFault) {
            f = 0;
        } else {
            const r = this.rng.next();
            f = r < 0.12 ? -1 : Math.floor(this.rng.next() * comp.steps.length);
        }
        this.faults[comp.ref] = f;
        return f;
    }

    private fresh(comp: MeterProcedureComponent): MeterProcedureState {
        return {
            compRef: comp.ref,
            mode: "OFF",
            red: null,
            black: null,
            redJack: "V/Ω",
            blackJack: "COM",
            lead: "red",
            stepIdx: 0,
            score: START_SCORE,
            attempts: 0,
            hintUsed: false,
            faultAt: this.ensureFault(comp),
            done: this.done,
            feedback: null,
            elapsed: 0,
            finished: false,
        };
    }

    getState(): MeterProcedureState {
        return this.state;
    }

    component(): MeterProcedureComponent {
        return this.procByRef(this.state.compRef) ?? mmProcedureByRef(this.state.compRef)!;
    }

    step() {
        const c = this.component();
        return c.steps[Math.min(this.state.stepIdx, c.steps.length - 1)];
    }

    faultStepOf(ref: string): number | undefined {
        return this.faults[ref];
    }

    private set(patch: Partial<MeterProcedureState>): void {
        this.state = { ...this.state, ...patch };
        this.emit();
    }

    selectComponent(ref: string): void {
        const comp = this.procByRef(ref);
        if (comp) this.set(this.fresh(comp));
    }

    setMode(mode: MeterMode): void {
        const patch: Partial<MeterProcedureState> = { mode, feedback: null };
        // Auto-suggest red jack is NOT forced — student must seat correctly.
        // Keep existing red jack if already seated; leave as-is for validation.
        this.set(patch);
    }

    setJack(lead: Lead, jack: JackId | null): void {
        if (lead === "red") this.set({ redJack: jack, feedback: null });
        else this.set({ blackJack: jack, feedback: null });
    }

    placeProbe(target: ProbeTarget, lead?: Lead): void {
        const use = lead ?? this.state.lead;
        let red = this.state.red;
        let black = this.state.black;
        if (red === target) red = null;
        if (black === target) black = null;
        if (use === "red") red = target;
        else black = target;
        this.set({ red, black, lead: use === "red" ? "black" : "red", feedback: null });
    }

    detachProbe(lead: Lead): void {
        this.set(lead === "red" ? { red: null } : { black: null });
    }

    clearProbes(): void {
        this.set({ red: null, black: null, lead: "red" });
    }

    jacksOk(): boolean {
        const need = requiredRedJack(this.state.mode);
        if (this.state.mode === "OFF") return true;
        return this.state.blackJack === "COM" && need !== null && this.state.redJack === need;
    }

    placement(): Placement {
        const st = this.step();
        const { red, black, mode } = this.state;
        const isOhm = st.mode === "OHM";
        const pairOk = isOhm
            ? (red === st.red && black === st.black) || (red === st.black && black === st.red)
            : red === st.red && black === st.black;
        return {
            seated: !!red && !!black,
            modeOk: mode === st.mode,
            pairOk,
            jackOk: this.jacksOk(),
            redOk: red === st.red || (isOhm && red === st.black),
            blackOk: black === st.black || (isOhm && black === st.red),
        };
    }

    private unitFor(m: MeterMode): string {
        return m === "OHM" ? "Ω" : m === "MA" ? "A" : m === "VAC" ? "V~" : "V";
    }

    reading(): MeterReading {
        const st = this.step();
        const s = this.state;
        const pl = this.placement();
        if (s.mode === "OFF") return { value: "", unit: "", status: "off", spec: "", flag: "", faulted: false };
        const unit = this.unitFor(s.mode);
        if (!pl.seated) return { value: "- - - -", unit, status: "unseated", spec: "", flag: "", faulted: false };
        if (!pl.jackOk) return { value: "----", unit, status: "wrongJack", spec: "", flag: "JACK", faulted: false };
        if (!pl.modeOk) return { value: "OL", unit, status: "wrongMode", spec: "", flag: "RANGE", faulted: false };
        if (!pl.pairOk) return { value: st.mode === "OHM" ? "OL" : "0.00", unit, status: "wrongPoints", spec: "", flag: "", faulted: false };
        const faulted = s.faultAt === s.stepIdx;
        const raw = faulted ? st.bad : st.good;
        return { value: raw, unit: raw === "OL" ? "" : st.unit, status: "ok", spec: st.spec, flag: "AUTO", faulted };
    }

    measurementReady(): boolean {
        const pl = this.placement();
        return this.state.mode !== "OFF" && pl.seated && pl.jackOk && pl.modeOk && pl.pairOk;
    }

    useHint(): void {
        if (this.state.hintUsed) return;
        this.set({
            hintUsed: true,
            score: Math.max(0, this.state.score - HINT_PENALTY),
            feedback: { tone: "warn", kind: "hint" },
        });
    }

    answer(yes: boolean): void {
        if (!this.measurementReady()) {
            this.set({ feedback: { tone: "warn", kind: "takeMeasurement" } });
            return;
        }
        const c = this.component();
        const faulted = this.state.faultAt === this.state.stepIdx;
        const truth = !faulted;
        const reading = this.reading();
        if (yes !== truth) {
            this.set({
                attempts: this.state.attempts + 1,
                score: Math.max(0, this.state.score - WRONG_PENALTY),
                feedback: {
                    tone: "bad",
                    kind: yes ? "wrongYes" : "wrongNo",
                    detail: { value: reading.value, spec: this.step().spec, unit: reading.unit || this.step().unit },
                },
            });
            return;
        }
        if (yes) {
            const last = this.state.stepIdx >= c.steps.length - 1;
            if (last) {
                this.recordDone(c, c.steps.length, "clear");
                this.finish(c, "clear");
            } else {
                this.set({
                    stepIdx: this.state.stepIdx + 1,
                    red: null,
                    black: null,
                    lead: "red",
                    hintUsed: false,
                    feedback: { tone: "good", kind: "stepOk" },
                });
            }
        } else {
            this.recordDone(c, this.state.stepIdx + 1, "found");
            this.finish(c, "found");
        }
    }

    private recordDone(c: MeterProcedureComponent, steps: number, status: CompletionStatus): void {
        this.done = { ...this.done, [c.ref]: { steps, total: c.steps.length, score: this.state.score, status } };
    }

    private finish(c: MeterProcedureComponent, status: CompletionStatus): void {
        this.source.stop();
        const outcome: "pass" | "fault" = status === "clear" ? "pass" : "fault";
        this.set({ finished: true, done: this.done, feedback: { tone: "good", kind: status } });
        this.complete({
            tool: "multimeter",
            scenarioId: `multimeter-${c.ref}`,
            score: this.state.score,
            outcome,
            verdict: `content:multimeter.verdict.${status}`,
            steps: c.steps.map((_s, i) => ({
                label: `content:multimeter.${c.ref}.step.${i}.instruction`,
                ok: i < this.state.stepIdx || (status === "clear" && i < c.steps.length),
            })),
            attempts: Math.max(1, this.state.attempts),
            hintsUsed: this.state.hintUsed ? 1 : 0,
            durationSeconds: this.state.elapsed,
            at: 0,
        });
    }

    startTimer(): void {
        this.source.subscribe(() => {
            this.state = { ...this.state, elapsed: this.state.elapsed + 1 };
            this.emit();
        });
        this.source.start(() => {});
    }

    override dispose(): void {
        this.source.stop();
        super.dispose();
    }
}
