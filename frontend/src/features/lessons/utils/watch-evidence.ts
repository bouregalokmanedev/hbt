import type { LessonProgress } from "../types/lesson.types";

/**
 * Evidence belongs to exactly one lesson. A progress payload from another
 * lesson must never seed the current lesson's watch counter.
 */
export function watchedSecondsForLesson(
    progress: LessonProgress | null | undefined,
    lessonId: string,
): number {
    if (!progress || progress.lesson_id !== lessonId) {
        return 0;
    }

    const value = Number(progress.time_spent ?? 0);

    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Add real playback time only. Pausing, seeking and large jumps (including
 * bfcache restores) do not count as watching.
 */
export function accumulateWatchedSeconds(
    watchedSeconds: number,
    previousPosition: number,
    position: number,
    playing: boolean,
    seeking: boolean,
): number {
    if (!playing || seeking) {
        return watchedSeconds;
    }

    const delta = position - previousPosition;

    if (delta <= 0 || delta > 5) {
        return watchedSeconds;
    }

    return watchedSeconds + delta;
}
