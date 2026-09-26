/** Scoring primitives shared by scored sessions (Multimeter, Scanner, etc.). */
export function scoreFromAttempts(start: number, attempts: number, penalty = 8): number {
  return Math.max(0, start - attempts * penalty);
}

export function clampScore(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}
