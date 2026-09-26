<?php

namespace App\Domains\Admin\Queries;

use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\UserRole;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\User;

/**
 * Builds the stable, read-only foundation for the administration dashboard.
 *
 * Platform-wide statistics intentionally arrive in Sprint 2. Keeping the
 * authenticated administrator and the enabled dashboard modules here gives
 * the frontend a safe contract to build against now.
 */
final class AdminDashboardQuery
{
    public function __construct(
        private readonly User $administrator,
    ) {
    }

    public static function for(User $administrator): self
    {
        return new self($administrator);
    }

    public function overview(): array
    {
        return [
            'administrator' => [
                'uuid' => $this->administrator->uuid,
                'name' => $this->administrator->full_name,
                'email' => $this->administrator->email,
                'roles' => $this->administrator
                    ->getRoleNames()
                    ->values()
                    ->all(),
            ],
            'modules' => [
                'dashboard',
                'users',
                'courses',
                'enrollments',
                'categories',
                'analytics',
                'activity',
                'system',
            ],
            'meta' => [
                'phase' => 'statistics',
                'api_version' => 'v1',
                'generated_at' => now()->toISOString(),
            ],
            'statistics' => $this->statistics(),
            'governance' => $this->governance(),
        ];
    }

    /**
     * Super Admin-only platform governance: staff distribution, escalated
     * support load, and integration health. Returns null for plain admins
     * so the permission model stays invisible to them.
     */
    private function governance(): ?array
    {
        if (! $this->administrator->hasRole(UserRole::SUPER_ADMIN->value)) {
            return null;
        }

        $staff = fn (string $role) => $this->usersWithAnyRole([$role])->count();

        return [
            'staff' => [
                'super_admins' => $staff(UserRole::SUPER_ADMIN->value),
                'admins' => $staff(UserRole::ADMIN->value),
                'support' => $staff(UserRole::SUPPORT->value),
                'instructors' => $staff(UserRole::INSTRUCTOR->value),
            ],
            'escalations' => \App\Domains\Support\Models\SupportTicket::query()
                ->whereIn('level', [
                    \App\Domains\Support\Enums\TicketLevel::ADMIN->value,
                    \App\Domains\Support\Enums\TicketLevel::SUPER_ADMIN->value,
                ])
                ->whereIn('status', [
                    \App\Domains\Support\Enums\TicketStatus::OPEN->value,
                    \App\Domains\Support\Enums\TicketStatus::PENDING->value,
                ])
                ->count(),
            'failed_webhooks' => \App\Domains\Payments\Models\WebhookEvent::query()
                ->where('status', 'failed')
                ->count(),
            'recent_privileged_actions' => \App\Models\AuditLog::query()
                ->latest()
                ->take(6)
                ->get(['id', 'event', 'auditable_type', 'created_at'])
                ->map(fn ($log) => [
                    'event' => $log->event,
                    'subject' => class_basename((string) $log->auditable_type),
                    'at' => $log->created_at?->toISOString(),
                ])
                ->all(),
        ];
    }

    private function statistics(): array
    {
        $users = User::query();
        $courses = Course::query();
        $enrollments = Enrollment::query();
        $progress = CourseProgress::query();

        $students = $this->usersWithAnyRole([
            UserRole::STUDENT->value,
        ]);

        $totalUsers = (clone $users)->count();
        $totalStudents = (clone $students)->count();
        $totalInstructors = $this->usersWithAnyRole([
            UserRole::INSTRUCTOR->value,
        ])->count();
        $totalAdministrators = $this->usersWithAnyRole([
                UserRole::ADMIN->value,
                UserRole::SUPER_ADMIN->value,
            ])->count();

        $activeUsers = (clone $users)
            ->where('status', 'active')
            ->count();

        $newUsersThisMonth = (clone $users)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        $totalEnrollments = (clone $enrollments)->count();
        $activeEnrollments = (clone $enrollments)
            ->where('status', EnrollmentStatus::ACTIVE)
            ->count();
        $completedEnrollments = (clone $enrollments)
            ->where('status', EnrollmentStatus::COMPLETED)
            ->count();
        $cancelledEnrollments = (clone $enrollments)
            ->where('status', EnrollmentStatus::CANCELLED)
            ->count();

        $averageProgress = (int) round((float) (
            (clone $progress)->avg('progress_percentage') ?? 0
        ));
        $activeLearners = (clone $progress)
            ->where('updated_at', '>=', now()->subDays(30))
            ->distinct()
            ->count('user_id');
        $completedLearners = (clone $progress)
            ->whereNotNull('completed_at')
            ->distinct()
            ->count('user_id');

        return [
            'users' => [
                'total' => $totalUsers,
                'students' => $totalStudents,
                'instructors' => $totalInstructors,
                'administrators' => $totalAdministrators,
                'active' => $activeUsers,
                'new_this_month' => $newUsersThisMonth,
            ],
            'courses' => [
                'total' => (clone $courses)->count(),
                'draft' => (clone $courses)->where('status', CourseStatus::DRAFT)->count(),
                'review' => (clone $courses)->where('status', CourseStatus::REVIEW)->count(),
                'published' => (clone $courses)->where('status', CourseStatus::PUBLISHED)->count(),
                'archived' => (clone $courses)->where('status', CourseStatus::ARCHIVED)->count(),
            ],
            'enrollments' => [
                'total' => $totalEnrollments,
                'active' => $activeEnrollments,
                'completed' => $completedEnrollments,
                'cancelled' => $cancelledEnrollments,
            ],
            'learning' => [
                'average_progress' => $averageProgress,
                'active_learners' => $activeLearners,
                'completed_learners' => $completedLearners,
            ],
        ];
    }

    /**
     * Query role names through the relation rather than the Spatie role scope.
     * This keeps the read-only dashboard available during an incomplete role
     * seeding run, where a named role may not yet exist.
     */
    private function usersWithAnyRole(array $roles): \Illuminate\Database\Eloquent\Builder
    {
        return User::query()->whereHas('roles', function ($query) use ($roles) {
            $query->whereIn('name', $roles);
        });
    }
}
