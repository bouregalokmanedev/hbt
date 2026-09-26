/**
 * Scanner Training Simulator data (SC, doc 17/19). Class-B structure only —
 * scenario numbers, difficulty enum, duration, library status/score. Learner-facing
 * prose (titles, description, objectives, instructor note, step context) is Class-C,
 * resolved by the UI from `content.scanner.training.*` by id.
 *
 * NOTE: the source function card advertises "64 scenarios"; the captured evidence
 * exposes the library entries 11–14 (the visible window) plus the fully-detailed
 * scenario 12. Only authentically-evidenced scenarios are modelled here — the
 * library is data-driven so the remaining catalogue can be added when sourced.
 */
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type LibStatus = "passed" | "progress" | "locked";

export interface LibraryEntry {
  n: number; // scenario number (canonical)
  status: LibStatus;
  score?: number; // % when passed
}

/** Scenario library window (source evidence: 11–14). */
export const SCENARIO_LIBRARY: LibraryEntry[] = [
  { n: 11, status: "passed", score: 94 },
  { n: 12, status: "progress" },
  { n: 13, status: "locked" },
  { n: 14, status: "locked" },
];

/** The active, fully-interactive scenario (source: Scenario 12). */
export const ACTIVE_SCENARIO = {
  n: 12,
  difficulty: "intermediate" as Difficulty,
  durationMin: 25,
  level: "L2",
  levelPct: 68,
  objectiveCount: 4,
};

/** Total catalogue size advertised by the source (Training Simulator · 64 scenarios). */
export const SCENARIO_COUNT = 64;
