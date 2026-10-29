import { describe, expect, it } from "vitest";

import type { LessonProgress } from "../types/lesson.types";
import {
    accumulateWatchedSeconds,
    watchedSecondsForLesson,
} from "./watch-evidence";

function progress(overrides: Partial<LessonProgress> = {}): LessonProgress {
    return {
        id: "progress-1",
        lesson_id: "lesson-1",
        progress_percentage: 50,
        time_spent: 120,
        started_at: "2026-10-01T10:00:00Z",
        completed_at: null,
        is_completed: false,
        video_position: 30,
        ...overrides,
    };
}

describe("watch evidence", () => {
    it("seeds the counter only from the current lesson", () => {
        expect(watchedSecondsForLesson(progress(), "lesson-1")).toBe(120);
        expect(watchedSecondsForLesson(progress(), "lesson-2")).toBe(0);
        expect(watchedSecondsForLesson(null, "lesson-1")).toBe(0);
    });

    it("ignores invalid or negative stored time", () => {
        expect(
            watchedSecondsForLesson(
                progress({ time_spent: Number.NaN }),
                "lesson-1",
            ),
        ).toBe(0);
        expect(
            watchedSecondsForLesson(progress({ time_spent: -20 }), "lesson-1"),
        ).toBe(0);
    });

    it("accumulates playback time", () => {
        expect(
            accumulateWatchedSeconds(120, 30, 30.5, true, false),
        ).toBe(120.5);
    });

    it("does not count pauses, seeks or jumps", () => {
        expect(accumulateWatchedSeconds(120, 30, 30.5, false, false)).toBe(120);
        expect(accumulateWatchedSeconds(120, 30, 30.5, true, true)).toBe(120);
        expect(accumulateWatchedSeconds(120, 30, 90, true, false)).toBe(120);
        expect(accumulateWatchedSeconds(120, 30, 29, true, false)).toBe(120);
    });
});
