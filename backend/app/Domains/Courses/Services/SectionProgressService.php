<?php

namespace App\Domains\Courses\Services;

use App\Domains\Lessons\Repositories\LessonProgressRepositoryInterface;
use App\Domains\Courses\Repositories\SectionProgressRepositoryInterface;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Support\Carbon;

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

        $lessonProgress = $lessons
            ->mapWithKeys(function ($lesson) use ($user) {
                return [
                    $lesson->id => $this->lessonProgressRepository
                        ->findByUserAndLesson(
                            $user->id,
                            $lesson->id
                        ),
                ];
            });

        $lessonCount = $lessons->count();

        $progressPercentage = $lessonCount === 0
            ? 0
            : (int) floor(
                $lessonProgress->sum(
                    fn ($progress) => $progress?->progress_percentage ?? 0
                ) / $lessonCount
            );

        $timeSpent = $lessonProgress->sum(
            fn ($progress) => $progress?->time_spent ?? 0
        );

        $startedAt = $lessonProgress
            ->filter()
            ->pluck('started_at')
            ->filter()
            ->sort()
            ->first();

        $allLessonsCompleted = $lessonCount > 0
            && $lessonProgress->count() === $lessonCount
            && $lessonProgress->every(
                fn ($progress) =>
                    $progress !== null
                    && $progress->progress_percentage === 100
                    && $progress->completed_at !== null
            );

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
            'completed_at' => $allLessonsCompleted
                ? now()
                : null,
        ];

        if ($existing !== null) {
            return $this->sectionProgressRepository->update(
                $existing,
                $data
            );
        }

        return $this->sectionProgressRepository->create($data);

        $result = $this->repository->update(
    $progress,
    $data
);

event(new SectionProgressUpdated($result));

return $result;
    }
}