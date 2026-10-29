<?php

namespace App\Domains\Courses\Services;

use App\Domains\Courses\Events\CourseCompleted;
use App\Domains\Courses\Repositories\CourseProgressRepositoryInterface;
use App\Enums\SectionStatus;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Section;
use App\Models\SectionProgress;
use App\Models\User;

final class CourseProgressService
{
    public function __construct(
        private readonly CourseProgressRepositoryInterface $repository,
        private readonly CoursePassService $coursePass,
    ) {
    }

    public function sync(
        User $user,
        Course $course
    ): CourseProgress {
        $sectionIds = Section::query()
            ->where('course_id', $course->id)
            ->where('status', SectionStatus::PUBLISHED->value)
            ->pluck('id');

        $sectionProgress = SectionProgress::query()
            ->where('user_id', $user->id)
            ->whereIn('section_id', $sectionIds)
            ->get();

        $sectionCount = $sectionIds->count();

        $progressPercentage = $sectionCount > 0
            ? (int) round(
                $sectionProgress->sum('progress_percentage') / $sectionCount
            )
            : 0;

        $timeSpent = (int) $sectionProgress->sum('time_spent');

        $startedAt = $sectionProgress
            ->whereNotNull('started_at')
            ->min('started_at');

        /*
         * Completion is no longer "every section reached 100%". It means the
         * learner actually passed the course: lessons done, required quizzes
         * and assessments passed, and practicals cleared. This keeps the
         * enrollment, gradebook, certificate and journey in agreement.
         */
        $pass = $this->coursePass->evaluate($course, $user);

        $existing = $this->repository->findByUserAndCourse(
            $user->id,
            $course->id
        );

        $wasCompleted = $existing?->completed_at !== null;

        $completedAt = $wasCompleted
            ? $existing->completed_at
            : ($pass['passed'] ? now() : null);

        $data = [
            'user_id' => $user->id,
            'course_id' => $course->id,
            'started_at' => $startedAt,
            'progress_percentage' => $progressPercentage,
            'time_spent' => $timeSpent,
            'completed_at' => $completedAt,
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

            $instructor = $course->instructor;
            if ($instructor !== null) {
                app(\App\Domains\Progression\Services\InstructorProgressionService::class)->award(
                    $instructor,
                    'student_completed_course',
                    40,
                    70,
                    "course-complete:{$course->id}:{$user->id}",
                    ['label' => 'Student completed a course', 'course' => $course->title],
                );
            }
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
