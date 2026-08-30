<?php

namespace App\Domains\Instructor\Queries;

use App\Enums\EnrollmentStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\Section;
use Illuminate\Support\Collection;

final class InstructorCourseAnalyticsQuery
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

    public function overview(): array
    {
        /*
         * ---------------------------------------------------------
         * COURSE OWNERSHIP
         * ---------------------------------------------------------
         */

        $course = Course::query()
            ->whereKey($this->courseId)
            ->where('instructor_id', $this->instructorId)
            ->withCount('sections')
            ->firstOrFail();

        /*
         * ---------------------------------------------------------
         * ENROLLMENTS
         * ---------------------------------------------------------
         */

        $enrollmentQuery = Enrollment::query()
            ->where('course_id', $course->id)
            ->where(
                'status',
                '!=',
                EnrollmentStatus::CANCELLED
            );

        $enrolledStudents = (clone $enrollmentQuery)
            ->distinct()
            ->count('user_id');

        /*
         * ---------------------------------------------------------
         * COURSE PROGRESS
         * ---------------------------------------------------------
         */

        $progressQuery = CourseProgress::query()
            ->where('course_id', $course->id);

        $startedStudents = (clone $progressQuery)
            ->where('progress_percentage', '>', 0)
            ->distinct()
            ->count('user_id');

        $completedStudents = (clone $progressQuery)
            ->whereNotNull('completed_at')
            ->distinct()
            ->count('user_id');

        $inProgressStudents = (clone $progressQuery)
            ->where('progress_percentage', '>', 0)
            ->whereNull('completed_at')
            ->distinct()
            ->count('user_id');

        $averageProgress = (int) round(
            (float) (
                (clone $progressQuery)
                    ->avg('progress_percentage') ?? 0
            )
        );

        $completionRate = $enrolledStudents > 0
            ? round(
                ($completedStudents / $enrolledStudents) * 100,
                1
            )
            : 0;

        /*
         * ---------------------------------------------------------
         * LEARNING TIME
         * ---------------------------------------------------------
         */

        $totalTimeSeconds = (int) (
            (clone $progressQuery)
                ->sum('time_spent')
        );

        /*
         * ---------------------------------------------------------
         * LESSONS
         * ---------------------------------------------------------
         */

        $lessonQuery = Lesson::query()
            ->whereHas(
                'section',
                fn ($query) => $query->where(
                    'course_id',
                    $course->id
                )
            );

        $totalLessons = (clone $lessonQuery)->count();

        /*
         * ---------------------------------------------------------
         * LESSON PROGRESS
         * ---------------------------------------------------------
         */

        $lessonProgressQuery = LessonProgress::query()
            ->whereHas(
                'lesson.section',
                fn ($query) => $query->where(
                    'course_id',
                    $course->id
                )
            );

        $startedLessons = (clone $lessonProgressQuery)
            ->where('progress_percentage', '>', 0)
            ->count();

        $completedLessons = (clone $lessonProgressQuery)
            ->whereNotNull('completed_at')
            ->count();

        /*
         * ---------------------------------------------------------
         * ENROLLMENT TREND
         * ---------------------------------------------------------
         */

        $enrollmentTrend = (clone $enrollmentQuery)
            ->where('enrolled_at', '>=', now()->subDays(6)->startOfDay())
            ->get(['enrolled_at'])
            ->groupBy(fn (Enrollment $item) => $item->enrolled_at?->toDateString())
            ->map(fn (Collection $items) => $items->count());

        $enrollmentsByDay = collect(range(0, 6))
            ->map(function (int $daysAgo) use ($enrollmentTrend): array {
                $date = now()->subDays(6 - $daysAgo)->toDateString();

                return [
                    'date' => $date,
                    'enrollments' => $enrollmentTrend->get($date, 0),
                ];
            })
            ->all();

        /*
         * ---------------------------------------------------------
         * SECTION AND LESSON PERFORMANCE
         * ---------------------------------------------------------
         */

        $sections = Section::query()
            ->where('course_id', $course->id)
            ->orderBy('position')
            ->get(['id', 'title', 'position']);

        $lessons = Lesson::query()
            ->whereIn('section_id', $sections->pluck('id'))
            ->orderBy('position')
            ->get(['id', 'section_id', 'title', 'position']);

        $lessonProgress = LessonProgress::query()
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->get(['lesson_id', 'user_id', 'progress_percentage', 'completed_at']);

        $progressByLesson = $lessonProgress->groupBy('lesson_id');

        $lessonPerformance = $lessons->map(function (Lesson $lesson) use ($progressByLesson): array {
            $items = $progressByLesson->get($lesson->id, collect());

            return [
                'id' => $lesson->id,
                'section_id' => $lesson->section_id,
                'title' => $lesson->title,
                'position' => $lesson->position,
                'started_students' => $items
                    ->where('progress_percentage', '>', 0)
                    ->pluck('user_id')
                    ->unique()
                    ->count(),
                'completed_students' => $items
                    ->whereNotNull('completed_at')
                    ->pluck('user_id')
                    ->unique()
                    ->count(),
                'average_progress' => (int) round((float) ($items->avg('progress_percentage') ?? 0)),
            ];
        });

        $sectionPerformance = $sections->map(function (Section $section) use ($lessonPerformance): array {
            $sectionLessons = $lessonPerformance
                ->where('section_id', $section->id)
                ->values();

            return [
                'id' => $section->id,
                'title' => $section->title,
                'position' => $section->position,
                'lessons_count' => $sectionLessons->count(),
                'average_progress' => (int) round((float) ($sectionLessons->avg('average_progress') ?? 0)),
                'completed_lessons' => $sectionLessons->sum('completed_students'),
            ];
        })->values()->all();

        /*
         * ---------------------------------------------------------
         * QUIZ PERFORMANCE
         * ---------------------------------------------------------
         */

        $quizzes = Quiz::query()
            ->whereIn('section_id', $sections->pluck('id'))
            ->orderBy('position')
            ->get(['id', 'title', 'section_id', 'position']);

        $quizAttempts = QuizAttempt::query()
            ->whereIn('quiz_id', $quizzes->pluck('id'))
            ->whereNotNull('submitted_at')
            ->get(['quiz_id', 'user_id', 'percentage', 'passed']);

        $attemptsByQuiz = $quizAttempts->groupBy('quiz_id');
        $quizPerformance = $quizzes->map(function (Quiz $quiz) use ($attemptsByQuiz): array {
            $attempts = $attemptsByQuiz->get($quiz->id, collect());
            $totalAttempts = $attempts->count();

            return [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'section_id' => $quiz->section_id,
                'attempts' => $totalAttempts,
                'unique_students' => $attempts->pluck('user_id')->unique()->count(),
                'average_score' => (int) round((float) ($attempts->avg('percentage') ?? 0)),
                'pass_rate' => $totalAttempts > 0
                    ? (int) round(($attempts->where('passed', true)->count() / $totalAttempts) * 100)
                    : 0,
            ];
        })->values()->all();

        /*
         * ---------------------------------------------------------
         * ENGAGEMENT AND AT-RISK STUDENTS
         * ---------------------------------------------------------
         */

        $activeLast7Days = (clone $progressQuery)
            ->where('updated_at', '>=', now()->subDays(7))
            ->distinct()
            ->count('user_id');

        $activeLast14Days = (clone $progressQuery)
            ->where('updated_at', '>=', now()->subDays(14))
            ->distinct()
            ->count('user_id');

        $activeLast30Days = (clone $progressQuery)
            ->where('updated_at', '>=', now()->subDays(30))
            ->distinct()
            ->count('user_id');

        $progressByStudent = (clone $progressQuery)
            ->get()
            ->keyBy('user_id');

        $atRiskStudents = (clone $enrollmentQuery)
            ->with('user:id,first_name,last_name,email')
            ->where('enrolled_at', '<=', now()->subDays(30))
            ->get()
            ->filter(function (Enrollment $enrollment) use ($progressByStudent): bool {
                $progress = $progressByStudent->get($enrollment->user_id);

                return ($progress?->progress_percentage ?? 0) < 30
                    && ($progress?->updated_at === null || $progress->updated_at->lt(now()->subDays(14)));
            })
            ->take(10)
            ->map(function (Enrollment $enrollment) use ($progressByStudent): array {
                $progress = $progressByStudent->get($enrollment->user_id);

                return [
                    'student_id' => $enrollment->user_id,
                    'name' => $enrollment->user->full_name,
                    'email' => $enrollment->user->email,
                    'progress' => $progress?->progress_percentage ?? 0,
                    'enrolled_at' => $enrollment->enrolled_at?->toISOString(),
                    'last_activity_at' => $progress?->updated_at?->toISOString(),
                ];
            })
            ->values()
            ->all();

        /*
         * ---------------------------------------------------------
         * RESPONSE
         * ---------------------------------------------------------
         */

        return [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'slug' => $course->slug,
                'status' => $course->status->value,
                'sections_count' => $course->sections_count,
                'lessons_count' => $totalLessons,
            ],

            'students' => [
                'enrolled' => $enrolledStudents,
                'started' => $startedStudents,
                'in_progress' => $inProgressStudents,
                'completed' => $completedStudents,
                'average_progress' => $averageProgress,
                'completion_rate' => $completionRate,
            ],

            'learning' => [
                'total_time_seconds' => $totalTimeSeconds,
                'total_time_hours' => round(
                    $totalTimeSeconds / 3600,
                    1
                ),
            ],

            'lessons' => [
                'started' => $startedLessons,
                'completed' => $completedLessons,
            ],

            'enrollment' => [
                'new_this_month' => (clone $enrollmentQuery)
                    ->where('enrolled_at', '>=', now()->startOfMonth())
                    ->distinct()
                    ->count('user_id'),
                'last_7_days' => $enrollmentsByDay,
            ],

            'sections' => $sectionPerformance,
            'lesson_performance' => $lessonPerformance->values()->all(),
            'quizzes' => $quizPerformance,

            'engagement' => [
                'active_last_7_days' => $activeLast7Days,
                'active_last_30_days' => $activeLast30Days,
                'inactive_over_14_days' => max($enrolledStudents - $activeLast14Days, 0),
                'at_risk_students' => $atRiskStudents,
            ],
        ];
    }
}
