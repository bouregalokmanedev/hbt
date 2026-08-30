<?php

namespace App\Domains\Instructor\Queries;

use App\Enums\EnrollmentStatus;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

final class InstructorCourseStudentsQuery
{
    public function __construct(
        private readonly int $instructorId,
        private readonly string $courseId,
    ) {
    }

    public static function for(
        int $instructorId,
        string $courseId,
    ): self {
        return new self(
            $instructorId,
            $courseId,
        );
    }

    public function paginate(
        int $perPage = 20,
    ): LengthAwarePaginator {
        /*
         * ---------------------------------------------------------
         * COURSE OWNERSHIP
         * ---------------------------------------------------------
         */

        $course = Course::query()
            ->whereKey($this->courseId)
            ->where(
                'instructor_id',
                $this->instructorId
            )
            ->firstOrFail();

        /*
         * ---------------------------------------------------------
         * TOTAL LESSONS
         * ---------------------------------------------------------
         */

        $totalLessons = Lesson::query()
            ->whereHas(
                'section',
                fn ($query) => $query->where(
                    'course_id',
                    $course->id
                )
            )
            ->count();

        /*
         * ---------------------------------------------------------
         * ENROLLMENTS
         * ---------------------------------------------------------
         */

        $paginator = Enrollment::query()
            ->where('course_id', $course->id)
            ->where(
                'status',
                '!=',
                EnrollmentStatus::CANCELLED
            )
            ->with('user')
            ->orderByDesc('enrolled_at')
            ->paginate($perPage);

        /*
         * ---------------------------------------------------------
         * CURRENT PAGE USER IDS
         * ---------------------------------------------------------
         */

        $userIds = $paginator
            ->getCollection()
            ->pluck('user_id')
            ->values();

        if ($userIds->isEmpty()) {
            return $paginator->through(
                fn (Enrollment $enrollment) => [
                    'enrollment' => $enrollment,
                    'progress' => null,
                    'completed_lessons' => 0,
                    'total_lessons' => $totalLessons,
                    'last_activity_at' => null,
                ]
            );
        }

        /*
         * ---------------------------------------------------------
         * COURSE PROGRESS
         * ---------------------------------------------------------
         */

        $progress = CourseProgress::query()
            ->where('course_id', $course->id)
            ->whereIn('user_id', $userIds)
            ->get()
            ->keyBy('user_id');

        /*
         * ---------------------------------------------------------
         * LESSON PROGRESS
         * ---------------------------------------------------------
         *
         * Fetch all relevant lesson progress for this page
         * in one query.
         */

        $lessonProgress = LessonProgress::query()
            ->whereIn('user_id', $userIds)
            ->whereHas(
                'lesson.section',
                fn ($query) => $query->where(
                    'course_id',
                    $course->id
                )
            )
            ->get([
                'id',
                'user_id',
                'progress_percentage',
                'completed_at',
                'updated_at',
            ]);

        /*
         * ---------------------------------------------------------
         * AGGREGATE LESSON DATA
         * ---------------------------------------------------------
         */

        $lessonStats = $lessonProgress
            ->groupBy('user_id')
            ->map(
                function (Collection $items): array {
                    return [
                        'completed' => $items
                            ->whereNotNull('completed_at')
                            ->count(),

                        'last_activity_at' => $items
                            ->max('updated_at'),
                    ];
                }
            );

        /*
         * ---------------------------------------------------------
         * RESPONSE
         * ---------------------------------------------------------
         */

        return $paginator->through(
            function (Enrollment $enrollment) use (
                $progress,
                $lessonStats,
                $totalLessons
            ): array {
                $userProgress = $progress->get(
                    $enrollment->user_id
                );

                $stats = $lessonStats->get(
                    $enrollment->user_id,
                    [
                        'completed' => 0,
                        'last_activity_at' => null,
                    ]
                );

                return [
                    'enrollment' => $enrollment,

                    'progress' => $userProgress,

                    'completed_lessons' => $stats['completed'],

                    'total_lessons' => $totalLessons,

                    'last_activity_at' =>
                        $stats['last_activity_at'],
                ];
            }
        );
    }
}