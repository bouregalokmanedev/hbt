/**
 * Framework-free scanner simulation engine — ported from the
 * hb-tronics-simulator reference (packages/sim-core + sim-scanner).
 *
 * Rules: no React/DOM imports here. UI subscribes via useSyncExternalStore.
 * Randomness is seeded (mulberry32) so runs are reproducible in tests.
 */

export interface SessionResultStep {
    label: string;
    ok: boolean;
}

export type BenchToolId = "scanner" | "multimeter" | "oscilloscope" | "location" | "schematic";

export interface SessionResult {
    tool: BenchToolId;
    scenarioId: string;
    score: number;
    steps: SessionResultStep[];
    verdict: string;
    outcome: "pass" | "fault";
    /** epoch ms — stamped by the bridge, never inside the engine. */
    at: number;
    attempts?: number;
    hintsUsed?: number;
    durationSeconds?: number;
}

export type Listener = () => void;

export abstract class Engine<TState> {
    protected listeners = new Set<Listener>();
    private completeHandlers = new Set<(r: SessionResult) => void>();

    abstract getState(): TState;

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    protected emit(): void {
        for (const l of this.listeners) l();
    }

    onComplete(handler: (r: SessionResult) => void): () => void {
        this.completeHandlers.add(handler);
        return () => this.completeHandlers.delete(handler);
    }

    protected complete(result: SessionResult): void {
        for (const h of this.completeHandlers) h(result);
    }

    dispose(): void {
        this.listeners.clear();
        this.completeHandlers.clear();
    }
}

/** Deterministic PRNG (mulberry32) — replaces Math.random in the engine. */
export class Rng {
    private s: number;

    constructor(seed = 0x5a17) {
        this.s = seed >>> 0;
    }

    next(): number {
        this.s = (this.s + 0x6d2b79f5) >>> 0;
        let t = this.s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    noise(amp: number): number {
        return (this.next() - 0.5) * 2 * amp;
    }
}

/** Shared measure → judge step machine (fault tree). */
export class StepMachine {
    step = 0;
    measured = false;
    states: { done: boolean }[];
    finished = false;
    attempts = 0;

    constructor(private specs: { ok: boolean; terminal?: boolean }[]) {
        this.states = specs.map(() => ({ done: false }));
    }

    measure(i: number): void {
        if (this.states[i]) this.measured = true;
    }

    judge(i: number, pass: boolean): boolean {
        const spec = this.specs[i];
        if (!spec || !this.measured) return false;
        this.attempts += 1;
        const correct = pass === spec.ok;
        if (!correct) {
            this.measured = false;
            return false;
        }
        this.states[i] = { done: true };
        this.measured = false;
        if (spec.terminal || i >= this.specs.length - 1) {
            this.finished = true;
        } else {
            this.step = i + 1;
        }
        return true;
    }

    reset(): void {
        this.step = 0;
        this.measured = false;
        this.states = this.specs.map(() => ({ done: false }));
        this.finished = false;
        this.attempts = 0;
    }
}

export function clampScore(v: number): number {
    return Math.max(0, Math.min(100, Math.round(v)));
}

export interface EngineContext {
    vehicleId: string;
    seed?: number;
}

export interface LiveSample {
    id: string;
    value: number;
    history: number[];
    status: "ok" | "warn" | "fault";
}

export interface ScanLogLine {
    ecu: string;
    name: string;
    status: string;
    dtc: number;
}

export interface TrainingStepCfg {
    id: string;
    screen: string;
    label?: string;
    question?: string;
    options?: [string, string, string, string];
    correctIndex?: number;
}

export interface ScannerState {
    livePlay: boolean;
    live: Record<string, LiveSample>;
    volts: number;
    tick: number;
    treeStep: number;
    treeMeasured: boolean;
    treeStates: { done: boolean; verdict: "pending" | "pass" | "fail" }[];
    treeFeedback: { ok: boolean; kind: "recheck" | "correct" | "confirmed"; stepId?: string } | null;
    treeFinished: boolean;
    scanning: boolean;
    scanIdx: number;
    scanLog: ScanLogLine[];
    scanDone: boolean;
    adasRunning: boolean;
    adasProg: number;
    adasDone: boolean[];
    tStep: number;
    tDone: boolean[];
    tHints: number;
    tAnswer: number | null;
    tScore: { accuracy: number; process: number; time: number } | null;
    tFeedback: { correct: boolean } | null;
    /** Per-step Q&A history: step index → chosen answer. */
    tAnswers: Record<number, number>;
    /** Correct answers so far (drives session score). */
    tCorrectCount: number;
    /** Session finished after last graded step. */
    tFinished: boolean;
    aiTurn: number;
    aiLog: { role: "user" | "ai"; turn: number; optId?: string }[];
    lastResult: SessionResult | null;
}

const HIST = 48;
const TREE_START_SCORE = 100;
const TREE_PENALTY_PER_ATTEMPT = 8;
const TRAINING_WEIGHTS = { accuracy: 92, process: 88, time: 76 };

export class ScannerEngine extends Engine<ScannerState> {
    private state: ScannerState;
    private liveTimer: number | null = null;
    private scanTimer: number | null = null;
    private adasTimer: number | null = null;
    private rng: Rng;
    private machine: StepMachine;

    constructor(
        private ctx: EngineContext,
        private data: {
            params: { id: string; base: number; min: number; max: number; step: number; fault?: boolean }[];
            nodes: { id: string; name: string; status: string; dtc: number }[];
            tree: { id: string; label?: string; ok: boolean; terminal?: boolean }[];
            trainingSteps: number;
            trainingCorrect: number;
            trainingWeights?: { accuracy: number; process: number; time: number };
            trainingScenarioId?: string;
            trainingOptions?: [string, string, string, string];
            trainingStepsCfg?: TrainingStepCfg[];
            trainingPassScore?: number;
            trainingHintBudget?: number;
            assistantTurns: number;
            adasDone?: boolean[];
        },
    ) {
        super();
        this.rng = new Rng(ctx.seed ?? 0x5a17);
        this.machine = new StepMachine(data.tree.map((s) => ({ ok: s.ok, terminal: s.terminal })));
        const live: Record<string, LiveSample> = {};
        for (const p of data.params) {
            live[p.id] = { id: p.id, value: p.base, history: Array(HIST).fill(p.base), status: this.pidStatus(p, p.base) };
        }
        this.state = {
            livePlay: true,
            live,
            volts: 13.9,
            tick: 0,
            treeStep: 0,
            treeMeasured: false,
            treeStates: data.tree.map(() => ({ done: false, verdict: "pending" as const })),
            treeFeedback: null,
            treeFinished: false,
            scanning: false,
            scanIdx: 0,
            scanLog: [],
            scanDone: false,
            adasRunning: false,
            adasProg: 0,
            adasDone: data.adasDone ?? [true, true, false, false, false, false],
            tStep: 0,
            tDone: Array(data.trainingSteps).fill(false),
            tHints: 0,
            tAnswer: null,
            tScore: null,
            tFeedback: null,
            tAnswers: {},
            tCorrectCount: 0,
            tFinished: false,
            aiTurn: 0,
            aiLog: [],
            lastResult: null,
        };
    }

    private stepCfg(i: number): TrainingStepCfg | null {
        return this.data.trainingStepsCfg?.[i] ?? null;
    }

    /** Per-step options, falling back to session options then built-in defaults. */
    trainingOptionsFor(i: number): [string, string, string, string] {
        return this.stepCfg(i)?.options ?? this.data.trainingOptions ?? ["", "", "", ""];
    }

    trainingCorrectFor(i: number): number {
        return this.stepCfg(i)?.correctIndex ?? this.data.trainingCorrect;
    }

    trainingQuestionFor(i: number): string | null {
        return this.stepCfg(i)?.question ?? null;
    }

    /** True when the current step carries (or inherits) answerable options. */
    trainingStepHasQa(i: number): boolean {
        const opts = this.trainingOptionsFor(i);
        return opts.some((o) => o.trim() !== "");
    }

    private finishTraining(): void {
        const total = this.data.trainingSteps;
        const weights = this.data.trainingWeights ?? TRAINING_WEIGHTS;
        const passScore = this.data.trainingPassScore ?? 70;
        // Score only graded (Q&A) steps; observation steps count toward process when done.
        let gradedTotal = 0;
        let gradedCorrect = 0;
        let observationDone = 0;
        let observationTotal = 0;
        for (let i = 0; i < total; i++) {
            if (this.trainingStepHasQa(i)) {
                gradedTotal += 1;
                if (this.state.tAnswers[i] !== undefined && this.state.tAnswers[i] === this.trainingCorrectFor(i)) gradedCorrect += 1;
            } else {
                observationTotal += 1;
                if (this.state.tDone[i]) observationDone += 1;
            }
        }
        const accuracy = gradedTotal > 0 ? Math.round((gradedCorrect / gradedTotal) * weights.accuracy) : weights.accuracy;
        const process =
            observationTotal > 0
                ? Math.round((observationDone / observationTotal) * weights.process)
                : weights.process;
        const penalty = this.state.tHints * 5;
        const clamp = (v: number) => Math.max(0, v - penalty);
        const score = clamp(accuracy);
        const outcome: "pass" | "fault" = score >= passScore ? "pass" : "fault";
        this.state = {
            ...this.state,
            tFinished: true,
            tDone: Array.from({ length: total }, (_, i) => this.state.tDone[i] || this.state.tAnswers[i] !== undefined || !this.trainingStepHasQa(i)),
            tScore: { accuracy: clamp(accuracy), process: clamp(process), time: weights.time },
            tFeedback: { correct: gradedTotal === 0 || gradedCorrect === gradedTotal },
        };
        this.emit();
        this.complete({
            tool: "scanner",
            scenarioId: this.data.trainingScenarioId ?? "scanner-scenario-12",
            score,
            outcome,
            verdict: outcome === "pass" ? "content:scanner.training.verdict.correct" : "content:scanner.training.verdict.wrong",
            steps: Array.from({ length: total }, (_, idx) => ({
                label: this.stepCfg(idx)?.label ?? `content:scanner.training.step.${idx}.label`,
                // Observation steps (no Q&A) count as completed; graded steps use the answer map.
                ok: !this.trainingStepHasQa(idx)
                    ? this.state.tDone[idx]
                    : this.state.tAnswers[idx] !== undefined && this.state.tAnswers[idx] === this.trainingCorrectFor(idx),
            })),
            attempts: Object.keys(this.state.tAnswers).length,
            hintsUsed: this.state.tHints,
            at: 0,
        });
    }

    get vehicleId(): string {
        return this.ctx.vehicleId;
    }

    protected override complete(result: SessionResult): void {
        this.state = { ...this.state, lastResult: result };
        this.emit();
        super.complete(result);
    }

    getState(): ScannerState {
        return this.state;
    }

    private pidStatus(
        p: { min: number; max: number; fault?: boolean },
        v: number,
    ): "ok" | "warn" | "fault" {
        if (p.fault) return "fault";
        const span = p.max - p.min;
        if (v < p.min + span * 0.05 || v > p.max - span * 0.05) return "warn";
        return "ok";
    }

    private tickLive(): void {
        const live = { ...this.state.live };
        for (const p of this.data.params) {
            const cur = live[p.id];
            const drift = (p.base - cur.value) * 0.15;
            const next = Math.max(p.min, Math.min(p.max, cur.value + drift + this.rng.noise(p.step)));
            live[p.id] = { id: p.id, value: next, history: [...cur.history.slice(1), next], status: this.pidStatus(p, next) };
        }
        const volts = Math.max(11, Math.min(14.8, this.state.volts + this.rng.noise(0.08)));
        this.state = { ...this.state, live, volts, tick: this.state.tick + 1 };
        this.emit();
    }

    startLive(): void {
        if (this.liveTimer !== null) return;
        this.liveTimer = window.setInterval(() => {
            if (this.state.livePlay) this.tickLive();
        }, 420);
    }

    stopLive(): void {
        if (this.liveTimer !== null) {
            window.clearInterval(this.liveTimer);
            this.liveTimer = null;
        }
    }

    toggleLive(): void {
        this.state = { ...this.state, livePlay: !this.state.livePlay };
        this.emit();
    }

    treeMeasure(): void {
        this.machine.measure(this.state.treeStep);
        this.state = { ...this.state, treeMeasured: true };
        this.emit();
    }

    treeVerdict(pass: boolean): void {
        const i = this.state.treeStep;
        if (!this.machine.judge(i, pass)) {
            this.state = {
                ...this.state,
                treeFeedback: { ok: false, kind: "recheck", stepId: this.data.tree[i]?.id },
            };
            this.emit();
            return;
        }
        const treeStates = [...this.state.treeStates];
        treeStates[i] = { done: true, verdict: this.data.tree[i]?.ok ? "pass" : "fail" };
        const finished = this.machine.finished;
        this.state = {
            ...this.state,
            treeStates,
            treeStep: finished ? i : i + 1,
            treeMeasured: false,
            treeFinished: finished,
            treeFeedback: { ok: true, kind: this.data.tree[i]?.ok ? "correct" : "confirmed" },
        };
        this.emit();
        if (finished) {
            const score = clampScore(TREE_START_SCORE - this.machine.attempts * TREE_PENALTY_PER_ATTEMPT);
            const primary = this.data.tree.find((s) => !s.ok);
            this.complete({
                tool: "scanner",
                scenarioId: primary ? `scanner-${primary.id}` : "scanner-tree",
                score,
                outcome: "fault",
                verdict: "content:scanner.tree.verdict",
                steps: this.data.tree.map((s, idx) => ({
                    label: s.label ?? `content:scanner.tree.${s.id}.label`,
                    ok: this.state.treeStates[idx]?.done ?? false,
                })),
                attempts: Math.max(1, this.machine.attempts),
                hintsUsed: this.state.tHints,
                at: 0,
            });
        }
    }

    startScan(): void {
        if (this.state.scanning) return;
        this.state = { ...this.state, scanning: true, scanIdx: 0, scanLog: [], scanDone: false };
        this.emit();
        this.scanTimer = window.setInterval(() => {
            const idx = this.state.scanIdx;
            if (idx >= this.data.nodes.length) {
                if (this.scanTimer !== null) window.clearInterval(this.scanTimer);
                this.scanTimer = null;
                this.state = { ...this.state, scanning: false, scanDone: true };
                this.emit();
                const faultCount = this.state.scanLog.filter((l) => l.dtc > 0).length;
                const score = clampScore(100 - Math.min(40, faultCount * 8));
                this.complete({
                    tool: "scanner",
                    scenarioId: "scanner-full-scan",
                    score,
                    outcome: faultCount > 0 ? "fault" : "pass",
                    verdict: faultCount > 0 ? "content:scanner.scan.faults" : "content:scanner.scan.clear",
                    steps: this.state.scanLog.map((l) => ({
                        label: `${l.ecu} — ${l.name}`,
                        ok: l.dtc === 0,
                    })),
                    attempts: Math.max(1, this.state.scanLog.length || 1),
                    hintsUsed: this.state.tHints,
                    at: 0,
                });
                return;
            }
            const n = this.data.nodes[idx];
            const line: ScanLogLine = { ecu: n.id, name: n.name, status: n.status, dtc: n.dtc };
            this.state = { ...this.state, scanIdx: idx + 1, scanLog: [...this.state.scanLog, line] };
            this.emit();
        }, 200);
    }

    runAdas(): void {
        if (this.state.adasRunning) return;
        this.state = { ...this.state, adasRunning: true, adasProg: 0 };
        this.emit();
        this.adasTimer = window.setInterval(() => {
            const prog = Math.min(100, this.state.adasProg + 3);
            const done = this.state.adasDone.map((d, i) => d || prog >= (i + 1) * (100 / 6));
            const running = prog < 100;
            this.state = { ...this.state, adasProg: prog, adasDone: done, adasRunning: running };
            this.emit();
            if (!running && this.adasTimer !== null) {
                window.clearInterval(this.adasTimer);
                this.adasTimer = null;
            }
        }, 90);
    }

    trainingCompleteStep(): void {
        if (this.state.tFinished) return;
        // Q&A steps are graded by submitTraining; legacy steps without options still use mark-complete.
        if (this.trainingStepHasQa(this.state.tStep)) return;
        const done = [...this.state.tDone];
        done[this.state.tStep] = true;
        const last = this.state.tStep >= this.data.trainingSteps - 1;
        if (last) {
            this.state = { ...this.state, tDone: done };
            this.finishTraining();
            return;
        }
        this.state = { ...this.state, tDone: done, tStep: this.state.tStep + 1, tAnswer: null, tFeedback: null };
        this.emit();
    }

    trainingGoStep(i: number): void {
        if (i >= 0 && i < this.data.trainingSteps && !this.state.tFinished) {
            const answers = this.state.tAnswers;
            this.state = {
                ...this.state,
                tStep: i,
                // Restore this step's prior answer (or clear if unanswered).
                tAnswer: answers[i] !== undefined ? answers[i] : null,
                tFeedback:
                    answers[i] !== undefined
                        ? { correct: answers[i] === this.trainingCorrectFor(i) }
                        : null,
            };
            this.emit();
        }
    }

    trainingNext(): void {
        this.trainingGoStep(this.state.tStep + 1);
    }

    trainingPrev(): void {
        this.trainingGoStep(this.state.tStep - 1);
    }

    useTrainingHint(): void {
        if (this.data.trainingHintBudget !== undefined && this.state.tHints >= this.data.trainingHintBudget) return;
        this.state = { ...this.state, tHints: this.state.tHints + 1 };
        this.emit();
    }

    submitTraining(answer: number): void {
        if (this.state.tFinished) return;
        if (this.state.tAnswer != null) return;
        const step = this.state.tStep;
        const correct = answer === this.trainingCorrectFor(step);
        const answers = { ...this.state.tAnswers, [step]: answer };
        const done = [...this.state.tDone];
        done[step] = true;
        const correctCount = this.state.tCorrectCount + (correct ? 1 : 0);
        const last = step >= this.data.trainingSteps - 1;
        const weights = this.data.trainingWeights ?? TRAINING_WEIGHTS;
        const penalty = this.state.tHints * 5;
        const clamp = (v: number) => Math.max(0, v - penalty);
        const previewAccuracy = Math.round((correctCount / this.data.trainingSteps) * weights.accuracy);
        this.state = {
            ...this.state,
            tAnswers: answers,
            tCorrectCount: correctCount,
            tAnswer: answer,
            tDone: done,
            tScore: { accuracy: clamp(previewAccuracy), process: clamp(correct ? weights.process : Math.round(weights.process * 0.5)), time: weights.time },
            tFeedback: { correct },
        };
        if (last) {
            this.finishTraining();
            return;
        }
        this.emit();
    }

    aiAsk(optId?: string): void {
        const turn = this.state.aiTurn;
        if (turn >= this.data.assistantTurns) return;
        this.state = {
            ...this.state,
            aiTurn: turn + 1,
            aiLog: [...this.state.aiLog, { role: "user", turn, optId }, { role: "ai", turn }],
        };
        this.emit();
    }

    override dispose(): void {
        this.stopLive();
        if (this.scanTimer !== null) window.clearInterval(this.scanTimer);
        if (this.adasTimer !== null) window.clearInterval(this.adasTimer);
        super.dispose();
    }
}
