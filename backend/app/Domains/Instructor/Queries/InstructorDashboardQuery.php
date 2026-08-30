<?php

namespace App\Domains\Instructor\Queries;

use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;

final class InstructorDashboardQuery
{
    public function __construct(
        private readonly int $instructorId,
    ) {
    }

    public static function for(
        int $instructorId,
    ): self {
        return new self($instructorId);
    }

    public function overview(): array
    {
        /*
         * ---------------------------------------------------------
         * INSTRUCTOR COURSES
         * ---------------------------------------------------------
         */

        $courseQuery = Course::query()
            ->where(
                'instructor_id',
                $this->instructorId
            );

        $totalCourses = (clone $courseQuery)->count();

        $draftCourses = (clone $courseQuery)
            ->where(
                'status',
                CourseStatus::DRAFT
            )
            ->count();

        $reviewCourses = (clone $courseQuery)
            ->where(
                'status',
                CourseStatus::REVIEW
            )
            ->count();

        $publishedCourses = (clone $courseQuery)
            ->where(
                'status',
                CourseStatus::PUBLISHED
            )
            ->count();

        $archivedCourses = (clone $courseQuery)
            ->where(
                'status',
                CourseStatus::ARCHIVED
            )
            ->count();

        /*
         * ---------------------------------------------------------
         * COURSE IDS
         * ---------------------------------------------------------
         */

        $courseIds = (clone $courseQuery)
            ->pluck('id');

        /*
         * ---------------------------------------------------------
         * ENROLLMENTS
         * ---------------------------------------------------------
         *
         * Cancelled enrollments are excluded from all student
         * statistics.
         */

        $enrollmentQuery = Enrollment::query()
            ->whereIn(
                'course_id',
                $courseIds
            )
            ->where(
                'status',
                '!=',
                EnrollmentStatus::CANCELLED
            );

        /*
         * ---------------------------------------------------------
         * STUDENTS
         * ---------------------------------------------------------
         */

        $totalStudents = (clone $enrollmentQuery)
            ->distinct()
            ->count('user_id');

        /*
         * ---------------------------------------------------------
         * NEW STUDENTS THIS MONTH
         * ---------------------------------------------------------
         */

        $newStudentsThisMonth = (clone $enrollmentQuery)
            ->where(
                'enrolled_at',
                '>=',
                now()->startOfMonth()
            )
            ->distinct()
            ->count('user_id');

        /*
         * ---------------------------------------------------------
         * COURSE PROGRESS
         * ---------------------------------------------------------
         */

        $progressQuery = CourseProgress::query()
            ->whereIn(
                'course_id',
                $courseIds
            );

        /*
         * ---------------------------------------------------------
         * AVERAGE PROGRESS
         * ---------------------------------------------------------
         */

        $averageProgress = (int) round(
            (float) (
                (clone $progressQuery)
                    ->avg('progress_percentage')
                ?? 0
            )
        );

        /*
         * ---------------------------------------------------------
         * COMPLETED STUDENTS
         * ---------------------------------------------------------
         *
         * A student is considered completed when at least one
         * CourseProgress record has completed_at.
         */

        $completedStudents = (clone $progressQuery)
            ->whereNotNull('completed_at')
            ->distinct()
            ->count('user_id');

        /*
         * ---------------------------------------------------------
         * STUDENTS IN PROGRESS
         * ---------------------------------------------------------
         *
         * A student is considered in progress when they have
         * started a course and have not completed it.
         */

        $inProgressStudents = (clone $progressQuery)
            ->whereNull('completed_at')
            ->where(
                'progress_percentage',
                '>',
                0
            )
            ->distinct()
            ->count('user_id');

        // A student is active when they have interacted with one of the
        // instructor's courses during the last 30 days. This is intentionally
        // based on progress activity, rather than every enrollment ever made.
        $activeStudents = (clone $progressQuery)
            ->where('updated_at', '>=', now()->subDays(30))
            ->distinct()
            ->count('user_id');

        $totalLearningSeconds = (int) (clone $progressQuery)
            ->sum('time_spent');

        $averageQuizScore = (int) round(
            (float) (
                QuizAttempt::query()
                    ->whereHas('quiz.section', function ($query) use ($courseIds) {
                        $query->whereIn('course_id', $courseIds);
                    })
                    ->whereNotNull('submitted_at')
                    ->avg('percentage')
                ?? 0
            )
        );

        /*
         * ---------------------------------------------------------
         * COMPLETION RATE
         * ---------------------------------------------------------
         */

        $completionRate = $totalStudents > 0
            ? (int) round(
                ($completedStudents / $totalStudents) * 100
            )
            : 0;

        /*
         * ---------------------------------------------------------
         * RECENT COURSES
         * ---------------------------------------------------------
         */

        $recentCourses = (clone $courseQuery)
            ->latest('created_at')
            ->limit(5)
            ->get();

        /*
         * ---------------------------------------------------------
         * TOP COURSES
         * ---------------------------------------------------------
         */

        $topCourses = (clone $courseQuery)
            ->withCount([
                'enrollments as students_count' => function ($query) {
                    $query->where(
                        'status',
                        '!=',
                        EnrollmentStatus::CANCELLED
                    );
                },
            ])
            ->orderByDesc('students_count')
            ->limit(5)
            ->get();

        /*
         * ---------------------------------------------------------
         * RECENT LEARNING ACTIVITY
         * ---------------------------------------------------------
         *
         * The dashboard reads activity from the source domains instead of
         * maintaining a second, instructor-only activity log. Only records
         * from courses owned by this instructor are included.
         */

        $recentEnrollments = (clone $enrollmentQuery)
            ->with([
                'user:id,first_name,last_name',
                'course:id,title',
            ])
            ->whereNotNull('enrolled_at')
            ->latest('enrolled_at')
            ->limit(5)
            ->get()
            ->map(function (Enrollment $enrollment): array {
                return [
                    'type' => 'enrollment',
                    'student_name' => $enrollment->user?->full_name ?? 'A student',
                    'course_title' => $enrollment->course?->title ?? 'a course',
                    'description' => 'enrolled in',
                    'occurred_at' => $enrollment->enrolled_at?->toISOString(),
                ];
            });

        $recentCompletions = (clone $progressQuery)
            ->with([
                'user:id,first_name,last_name',
                'course:id,title',
            ])
            ->whereNotNull('completed_at')
            ->latest('completed_at')
            ->limit(5)
            ->get()
            ->map(function (CourseProgress $progress): array {
                return [
                    'type' => 'course_completed',
                    'student_name' => $progress->user?->full_name ?? 'A student',
                    'course_title' => $progress->course?->title ?? 'a course',
                    'description' => 'completed',
                    'occurred_at' => $progress->completed_at?->toISOString(),
                ];
            });

        $recentQuizAttempts = QuizAttempt::query()
            ->with([
                'user:id,first_name,last_name',
                'quiz.section.course:id,title',
            ])
            ->whereHas('quiz.section', function ($query) use ($courseIds) {
                $query->whereIn('course_id', $courseIds);
            })
            ->whereNotNull('submitted_at')
            ->latest('submitted_at')
            ->limit(5)
            ->get()
            ->map(function (QuizAttempt $attempt): array {
                return [
                    'type' => $attempt->passed ? 'quiz_passed' : 'quiz_submitted',
                    'student_name' => $attempt->user?->full_name ?? 'A student',
                    'course_title' => $attempt->quiz?->section?->course?->title ?? 'a course',
                    'description' => $attempt->passed
                        ? 'passed a quiz in'
                        : 'submitted a quiz in',
                    'score' => $attempt->percentage,
                    'occurred_at' => $attempt->submitted_at?->toISOString(),
                ];
            });

        $recentActivity = $recentEnrollments
            ->concat($recentCompletions)
            ->concat($recentQuizAttempts)
            ->sortByDesc('occurred_at')
            ->take(8)
            ->values()
            ->all();

        /*
         * ---------------------------------------------------------
         * RESPONSE
         * ---------------------------------------------------------
         */

        return [
            'overview' => [
                'total_courses' => $totalCourses,
                'total_students' => $totalStudents,
                'new_students_this_month' => $newStudentsThisMonth,
                'average_progress' => $averageProgress,
                'completion_rate' => $completionRate,
                'average_quiz_score' => $averageQuizScore,
            ],

            'courses' => [
                'total' => $totalCourses,
                'draft' => $draftCourses,
                'review' => $reviewCourses,
                'published' => $publishedCourses,
                'archived' => $archivedCourses,
            ],

            'students' => [
                'total' => $totalStudents,
                'new_this_month' => $newStudentsThisMonth,
                'completed' => $completedStudents,
                'in_progress' => $inProgressStudents,
                'active' => $activeStudents,
            ],

            'progress' => [
                'average_percentage' => $averageProgress,
                'completed' => $completedStudents,
                'in_progress' => $inProgressStudents,
            ],

            'learning' => [
                'total_time_seconds' => $totalLearningSeconds,
                'total_time_hours' => round($totalLearningSeconds / 3600, 1),
                'average_quiz_score' => $averageQuizScore,
            ],

            'recent_courses' => $recentCourses,

            'top_courses' => $topCourses,

            'recent_activity' => $recentActivity,
        ];
    }
}
