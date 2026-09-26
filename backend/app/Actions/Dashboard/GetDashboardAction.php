<?php

namespace App\Actions\Dashboard;

use App\DTOs\Dashboard\DashboardData;
use App\Enums\EnrollmentStatus;
use App\Models\CourseProgress;
use App\Models\Certificate;
use App\Models\Enrollment;
use App\Models\LessonProgress;
use App\Models\AuditLog;
use App\Models\User;
use App\Domains\Assessments\Models\Assessment;
use Illuminate\Support\Facades\Schema;
use App\Domains\Achievements\Services\AchievementService;
use App\Domains\Assessments\Services\AssessmentEligibilityService;
use App\Domains\Notifications\Services\StudentNotificationService;
use App\Domains\Progression\Services\StudentProgressionService;

final class GetDashboardAction
{
    public function execute(User $user): DashboardData
    {
        $achievements = app(AchievementService::class)->sync($user);
        $weekStart = now()->startOfWeek();
        $certificateCount = Schema::hasTable('certificates')
            ? Certificate::query()
                ->where('user_id', $user->id)
                ->count()
            : 0;
        $enrollments = Enrollment::query()
            ->with('course:id,title')
            ->where('user_id', $user->getKey())
            ->whereIn('status', [
                EnrollmentStatus::ACTIVE,
                EnrollmentStatus::COMPLETED,
            ])
            ->orderByDesc('updated_at')
            ->get();

        $progressByCourse = CourseProgress::query()
            ->where('user_id', $user->getKey())
            ->get()
            ->keyBy('course_id');

        $activeEnrollments = $enrollments
            ->where('status', EnrollmentStatus::ACTIVE);

        $activeProgress = $activeEnrollments
            ->map(fn (Enrollment $enrollment) =>
                $progressByCourse->get(
                    $enrollment->course_id
                )?->progress_percentage ?? 0
            );

        $recentActivity = AuditLog::query()
            ->where('user_id', $user->getKey())
            ->latest()
            ->limit(3)
            ->get()
            ->map(fn (AuditLog $activity): array => [
                'id' => $activity->id,
                'event' => $activity->event,
                'description' => match ($activity->event) {
                    'enrollment.created' => 'Enrolled in a course',
                    'enrollment.completed' => 'Completed a course',
                    'enrollment.cancelled' => 'Cancelled a course enrollment',
                    'lesson.completed' => 'Completed a lesson',
                    default => str($activity->event)
                        ->replace('.', ' ')
                        ->headline()
                        ->toString(),
                },
                'created_at' => $activity->created_at?->toISOString(),
            ])
            ->all();

        $minutesByDay = LessonProgress::query()
            ->where('user_id', $user->getKey())
            ->where('updated_at', '>=', $weekStart)
            ->get()
            ->groupBy(
                fn (LessonProgress $progress) =>
                    $progress->updated_at->toDateString()
            )
            ->map(
                fn ($progress) => (int) round(
                    $progress->sum('time_spent') / 60
                )
            );

        $weeklyActivity = collect(range(0, 6))
            ->map(function (int $offset) use ($weekStart, $minutesByDay): array {
                $date = $weekStart->copy()->addDays($offset);

                return [
                    'date' => $date->toDateString(),
                    'day' => $date->format('D'),
                    'minutes' => $minutesByDay->get(
                        $date->toDateString(),
                        0,
                    ),
                ];
            })
            ->all();

        $upcomingAssessments = Assessment::query()
            ->with('course:id,title')
            ->where('status', 'published')
            ->whereHas('course.enrollments', fn ($query) => $query->where('user_id', $user->id))
            ->orderBy('published_at')
            ->take(3)
            ->get();

        foreach ($upcomingAssessments as $assessment) {
            if (app(AssessmentEligibilityService::class)->isEligible($assessment, $user)) {
                app(StudentNotificationService::class)->send($user, 'assessment_ready', 'Final assessment is ready', "You have completed the requirements for {$assessment->title}.", "/assessments/{$assessment->id}/exam", "assessment-ready:{$assessment->id}");
            }
        }

        $skillGaps = $this->skillGaps($user, $enrollments);
        $reviewDue = $this->reviewDue($user);
        $cohortOverview = $this->cohortOverview($user);

        return new DashboardData(
            user: $user,

            stats: [
                'active_courses' => $activeEnrollments->count(),
                'completed_courses' => $enrollments
                    ->where('status', EnrollmentStatus::COMPLETED)
                    ->count(),
                // Progress is stored in seconds; the dashboard displays
                // whole hours so the value remains stable and readable.
                'learning_hours' => (int) floor(
                    $progressByCourse->sum('time_spent') / 3600
                ),
                'certificates' => $certificateCount,
                'current_progress' => $activeProgress->isEmpty()
                    ? 0
                    : (int) round($activeProgress->avg()),
            ],

            currentLearning: $activeEnrollments
                ->filter(
                    fn (Enrollment $enrollment) =>
                        $enrollment->course !== null
                )
                ->take(3)
                ->map(function (Enrollment $enrollment) use ($progressByCourse): array {
                    return [
                        'id' => $enrollment->course_id,
                        'title' => $enrollment->course->title,
                        'progress' => $progressByCourse->get(
                            $enrollment->course_id
                        )?->progress_percentage ?? 0,
                    ];
                })
                ->values()
                ->all(),

            upcomingAssessments: $upcomingAssessments
                ->map(fn (Assessment $assessment) => [
                    'id' => $assessment->id,
                    'title' => $assessment->title,
                    'date' => ($assessment->published_at ?? now())->toDateString(),
                ])
                ->all(),

            recentActivity: $recentActivity,

            weeklyActivity: $weeklyActivity,

            achievements: $achievements,

            progression: app(StudentProgressionService::class)->summaryFor($user),

            aiMentor: [
                'available' => true,

                'message' =>
                    'Your AI mentor is ready to help you improve your diagnostic skills.',

                'recommendation' => null,

                'queries_remaining' => 0,
            ],

            skillGaps: $skillGaps,
            cohortOverview: $cohortOverview,
            reviewDue: $reviewDue,
        );
    }

    /**
     * Review queue: the student's most recent failed quiz attempts and how
     * many questions they still miss, so the dashboard can offer a short
     * "review due" loop instead of a passive score display.
     *
     * @return list<array{id:string,title:string,course_title:string,wrong_count:int,action_url:string}>
     */
    private function reviewDue(User $user): array
    {
        try {
            $latestFailed = \App\Domains\Quizzes\Models\QuizAttempt::query()
                ->where('user_id', $user->getKey())
                ->where('status', 'submitted')
                ->orderByDesc('submitted_at')
                ->get()
                ->groupBy('quiz_id')
                ->map(fn ($group) => $group->first())
                ->filter(fn ($attempt) => ! $attempt->passed)
                ->take(3);

            if ($latestFailed->isEmpty()) {
                return [];
            }

            $wrongCounts = \App\Domains\Quizzes\Models\QuizAttemptAnswer::query()
                ->whereIn('attempt_id', $latestFailed->pluck('id'))
                ->where('is_correct', false)
                ->groupBy('attempt_id')
                ->selectRaw('attempt_id, count(*) as wrong_count')
                ->pluck('wrong_count', 'attempt_id');

            $quizzes = \App\Domains\Quizzes\Models\Quiz::query()
                ->with('section.course:id,title')
                ->whereIn('id', $latestFailed->pluck('quiz_id'))
                ->get()
                ->keyBy('id');

            return $latestFailed
                ->map(function ($attempt) use ($wrongCounts, $quizzes) {
                    $quiz = $quizzes->get($attempt->quiz_id);

                    if (! $quiz) {
                        return null;
                    }

                    $courseId = $quiz->section?->course?->id ?? null;

                    return [
                        'id' => $quiz->id,
                        'title' => $quiz->title,
                        'course_title' => $quiz->section?->course?->title ?? 'Course',
                        'wrong_count' => (int) $wrongCounts->get($attempt->id, 0),
                        'action_url' => $courseId
                            ? "/courses/{$courseId}/quizzes/{$quiz->id}"
                            : '/assessments',
                    ];
                })
                ->filter()
                ->values()
                ->all();
        } catch (\Throwable) {
            // Tables may be empty during early setup — the queue stays empty
            return [];
        }
    }

    /**
     * Student-facing skill gaps: weak quizzes, stalled lessons,
     * and failed diagnostic scenarios requiring retakes.
     *
     * @return list<array{type:string,title:string,course_title:string,score:int|null,required:int|null,action_url:string}>
     */
    private function skillGaps(User $user, $enrollments): array
    {
        $gaps = collect();

        // Weak quizzes: latest submitted attempt below pass threshold
        try {
            $quizAttempts = \App\Domains\Quizzes\Models\QuizAttempt::query()
                ->with(['quiz.section.course:id,title'])
                ->where('user_id', $user->getKey())
                ->where('status', 'submitted')
                ->orderByDesc('submitted_at')
                ->get()
                ->groupBy('quiz_id')
                ->map(fn ($group) => $group->first());

            foreach ($quizAttempts as $attempt) {
                $quiz = $attempt->quiz;
                if (! $quiz || $attempt->passed) {
                    continue;
                }
                $courseTitle = $quiz->section?->course?->title ?? 'Course';
                $courseId = $quiz->section?->course?->id ?? null;
                $gaps->push([
                    'type' => 'quiz',
                    'title' => $quiz->title,
                    'course_title' => $courseTitle,
                    'score' => $attempt->percentage,
                    'required' => $quiz->pass_percentage,
                    'action_url' => $courseId ? "/courses/{$courseId}/quizzes/{$quiz->id}" : '/assessments',
                ]);
                if ($gaps->count() >= 5) {
                    break;
                }
            }
        } catch (\Throwable) {
            // Tables may be empty during early setup — gaps remain empty
        }

        // Stalled lessons: in-progress but not completed for > 3 days
        if ($gaps->count() < 5) {
            try {
                $stalled = \App\Models\LessonProgress::query()
                    ->with(['lesson.section.course:id,title'])
                    ->where('user_id', $user->getKey())
                    ->whereNotNull('progress_percentage')
                    ->whereNull('completed_at')
                    ->where('updated_at', '<', now()->subDays(3))
                    ->orderBy('updated_at')
                    ->limit(5 - $gaps->count())
                    ->get();

                foreach ($stalled as $progress) {
                    $lesson = $progress->lesson ?? null;
                    if (! $lesson) {
                        continue;
                    }
                    $courseTitle = $lesson->section?->course?->title ?? 'Course';
                    $courseId = $lesson->section?->course?->id ?? null;
                    $gaps->push([
                        'type' => 'lesson',
                        'title' => $lesson->title,
                        'course_title' => $courseTitle,
                        'score' => (int) ($progress->progress_percentage ?? 0),
                        'required' => 100,
                        'action_url' => $courseId ? "/courses/{$courseId}/lessons/{$lesson->id}" : '/my-courses',
                    ]);
                }
            } catch (\Throwable) {
            }
        }

        return $gaps->values()->all();
    }

    private function cohortOverview(User $user): ?array
    {
        if (! $user->hasAnyRole(['Instructor', 'Admin', 'Super Admin'])) {
            return null;
        }

        try {
            $courseIds = \App\Models\Course::query()
                ->when($user->hasRole('Instructor'), fn ($query) => $query->where('instructor_id', $user->id))
                ->pluck('id');

            if ($courseIds->isEmpty()) {
                return null;
            }

            $enrollmentStats = \App\Models\Enrollment::query()
                ->whereIn('course_id', $courseIds)
                ->selectRaw("status, count(*) as count")
                ->groupBy('status')
                ->pluck('count', 'status');

            $avgProgress = \App\Models\CourseProgress::query()
                ->whereIn('course_id', $courseIds)
                ->avg('progress_percentage');

            return [
                'total_enrollments' => (int) array_sum($enrollmentStats->toArray()),
                'by_status' => $enrollmentStats->toArray(),
                'avg_progress' => $avgProgress !== null ? (int) round($avgProgress) : 0,
                'courses' => $courseIds->count(),
            ];
        } catch (\Throwable) {
            return null;
        }
    }
}
