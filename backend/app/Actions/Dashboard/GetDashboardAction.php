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
        );
    }
}
