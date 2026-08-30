<?php

namespace App\Domains\Courses\Services;

use App\Domains\Courses\Events\SectionProgressUpdated;
use App\Domains\Courses\Repositories\SectionProgressRepositoryInterface;
use App\Domains\Lessons\Repositories\LessonProgressRepositoryInterface;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;

final class SectionProgressService
{
    public function __construct(
        private readonly SectionProgressRepositoryInterface $sectionProgressRepository,
        private readonly LessonProgressRepositoryInterface $lessonProgressRepository,
    ) {
    }

    public function sync(
        User $user,
        Section $section
    ): SectionProgress {
        $lessons = $section->lessons()
            ->orderBy('position')
            ->get();

        $lessonProgress = $lessons->mapWithKeys(
            function ($lesson) use ($user) {
                return [
                    $lesson->id => $this->lessonProgressRepository
                        ->findByUserAndLesson(
                            $user->id,
                            $lesson->id
                        ),
                ];
            }
        );

        $lessonCount = $lessons->count();

        /*
         * Calculate section progress.
         */
        $progressPercentage = $lessonCount === 0
            ? 0
            : (int) floor(
                $lessonProgress->sum(
                    fn ($progress) =>
                        $progress?->progress_percentage ?? 0
                ) / $lessonCount
            );

        /*
         * Calculate total time spent.
         */
        $timeSpent = $lessonProgress->sum(
            fn ($progress) =>
                $progress?->time_spent ?? 0
        );

        /*
         * Find first lesson start time.
         */
        $startedAt = $lessonProgress
            ->filter()
            ->pluck('started_at')
            ->filter()
            ->sort()
            ->first();

        /*
         * Check whether every lesson is completed.
         */
        $allLessonsCompleted =
            $lessonCount > 0
            && $lessonProgress->count() === $lessonCount
            && $lessonProgress->every(
                fn ($progress) =>
                    $progress !== null
                    && $progress->progress_percentage === 100
                    && $progress->completed_at !== null
            );

        /*
         * Keep completed_at only when the whole section
         * is actually completed.
         */
        $completedAt = $allLessonsCompleted
            ? now()
            : null;

        /*
         * Find existing section progress.
         */
        $existing = $this->sectionProgressRepository
            ->findByUserAndSection(
                $user->id,
                $section->id
            );

        $data = [
            'user_id' => $user->id,
            'section_id' => $section->id,
            'progress_percentage' => $progressPercentage,
            'time_spent' => $timeSpent,
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
        ];

        /*
         * Create or update section progress.
         */
        if ($existing !== null) {
            $result = $this->sectionProgressRepository->update(
                $existing,
                $data
            );
        } else {
            $result = $this->sectionProgressRepository->create(
                $data
            );
        }

        /*
         * IMPORTANT:
         *
         * This event was missing before.
         *
         * It tells SyncCourseProgress to recalculate
         * CourseProgress for this course.
         */
        event(
            new SectionProgressUpdated($result)
        );

        return $result;
    }
}