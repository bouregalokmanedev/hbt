<?php

namespace App\Domains\Courses\Services;

use App\Domains\Courses\Repositories\CourseProgressRepositoryInterface;
use App\Domains\Courses\Events\CourseCompleted;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\SectionProgress;
use App\Models\User;
use Illuminate\Support\Collection;


final class CourseProgressService
{
    public function __construct(
        private readonly CourseProgressRepositoryInterface $repository,
    ) {
    }

    public function sync(
    User $user,
    Course $course
): CourseProgress {
    $sectionProgress = SectionProgress::query()
        ->where('user_id', $user->id)
        ->whereHas('section', function ($query) use ($course) {
            $query->where('course_id', $course->id);
        })
        ->get();

    $sectionCount = $course->sections()->count();

    $progressPercentage = $sectionCount > 0
        ? (int) round(
            $sectionProgress->sum('progress_percentage') / $sectionCount
        )
        : 0;

    $timeSpent = (int) $sectionProgress->sum('time_spent');

    $startedAt = $sectionProgress
        ->whereNotNull('started_at')
        ->min('started_at');

    $completed = $sectionCount > 0
        && $sectionProgress->count() === $sectionCount
        && $sectionProgress->every(
            fn (SectionProgress $progress) =>
                $progress->progress_percentage === 100
        );

    $completedAt = $completed
        ? $sectionProgress
            ->whereNotNull('completed_at')
            ->max('completed_at')
        : null;

    $existing = $this->repository->findByUserAndCourse(
        $user->id,
        $course->id
    );

    $wasCompleted = $existing?->completed_at !== null;

   $data = [
    'user_id' => $user->id,
    'course_id' => $course->id,
    'started_at' => $startedAt,
    'progress_percentage' => $progressPercentage,
    'time_spent' => $timeSpent,
    'completed_at' => $wasCompleted
        ? $existing->completed_at
        : $completedAt,
];

    if ($existing === null) {
        $result = $this->repository->create($data);
    } else {
        $result = $this->repository->update(
            $existing,
            $data
        );
    }
   

    if (! $wasCompleted && $result->completed_at !== null) {
        event(new CourseCompleted($result));
    }

    return $result;
}

    public function find(
    User $user,
    Course $course
): ?CourseProgress {
    return $this->repository->findByUserAndCourse(
        $user->id,
        $course->id
    );
}
}
