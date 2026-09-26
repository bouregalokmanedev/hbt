/**
 * Guided-step state machine shared by Scanner diagnostic tree, Multimeter step
 * flow and Location quiz (10 §8.1). Each step can be measured (reveal), then
 * judged pass/fail against the correct branch.
 */
export interface StepState {
  index: number;
  measured: boolean;
  verdict: "pending" | "pass" | "fail";
  done: boolean;
}

export interface StepSpec {
  /** correct pass/fail call for this step */
  ok: boolean;
  /** if judged correctly and this is the failing branch, the machine terminates */
  terminal?: boolean;
}

export class StepMachine {
  step = 0;
  measured = false;
  states: StepState[];
  finished = false;
  attempts = 0;

  constructor(private specs: StepSpec[]) {
    this.states = specs.map((_, i) => ({ index: i, measured: false, verdict: "pending", done: false }));
  }

  measure(i: number): void {
    if (i === this.step) {
      this.measured = true;
      this.states[i].measured = true;
    }
  }

  /** Learner judges the current step. Returns whether the call was correct. */
  judge(i: number, pass: boolean): boolean {
    if (i !== this.step || !this.measured) return false;
    const spec = this.specs[i];
    const correct = pass === spec.ok;
    if (!correct) {
      this.attempts += 1;
      return false;
    }
    this.states[i].verdict = spec.ok ? "pass" : "fail";
    this.states[i].done = true;
    if (spec.terminal || !spec.ok || i === this.specs.length - 1) {
      this.finished = true;
    } else {
      this.step += 1;
      this.measured = false;
    }
    return true;
  }

  reset(): void {
    this.step = 0;
    this.measured = false;
    this.finished = false;
    this.attempts = 0;
    this.states = this.specs.map((_, i) => ({ index: i, measured: false, verdict: "pending", done: false }));
  }
}
