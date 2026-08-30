<?php

namespace App\Domains\Admin\Queries;

use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\UserRole;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\User;
use Carbon\CarbonImmutable;

final class AdminAnalyticsQuery
{
    public function __construct(
        private readonly CarbonImmutable $from,
        private readonly CarbonImmutable $to,
    ) {
    }

    public static function between(CarbonImmutable $from, CarbonImmutable $to): self
    {
        return new self($from, $to);
    }

    public function users(): array
    {
        return [
            'period' => $this->period(),
            'summary' => [
                'total' => User::query()->count(),
                'students' => $this->usersInRoles([UserRole::STUDENT->value])->count(),
                'instructors' => $this->usersInRoles([UserRole::INSTRUCTOR->value])->count(),
                'active' => User::query()->where('status', 'active')->count(),
                'new_in_period' => User::query()->whereBetween('created_at', [$this->from, $this->to])->count(),
            ],
            'series' => $this->dailyCounts(User::query(), 'created_at', 'new_users'),
        ];
    }

    public function courses(): array
    {
        $courses = Course::query();

        $published = Course::query()
            ->whereNotNull('published_at')
            ->whereBetween('published_at', [$this->from, $this->to]);

        return [
            'period' => $this->period(),
            'summary' => [
                'total' => (clone $courses)->count(),
                'draft' => (clone $courses)->where('status', CourseStatus::DRAFT)->count(),
                'review' => (clone $courses)->where('status', CourseStatus::REVIEW)->count(),
                'published' => (clone $courses)->where('status', CourseStatus::PUBLISHED)->count(),
                'archived' => (clone $courses)->where('status', CourseStatus::ARCHIVED)->count(),
                'published_in_period' => (clone $published)->count(),
            ],
            'created_series' => $this->dailyCounts(Course::query(), 'created_at', 'courses'),
            'published_series' => $this->dailyCounts($published, 'published_at', 'courses'),
        ];
    }

    public function enrollments(): array
    {
        return [
            'period' => $this->period(),
            'summary' => [
                'total' => Enrollment::query()->count(),
                'active' => Enrollment::query()->where('status', EnrollmentStatus::ACTIVE)->count(),
                'completed' => Enrollment::query()->where('status', EnrollmentStatus::COMPLETED)->count(),
                'cancelled' => Enrollment::query()->where('status', EnrollmentStatus::CANCELLED)->count(),
                'new_in_period' => Enrollment::query()->whereBetween('enrolled_at', [$this->from, $this->to])->count(),
            ],
            'enrollment_series' => $this->dailyCounts(Enrollment::query(), 'enrolled_at', 'enrollments'),
            'completion_series' => $this->dailyCounts(
                Enrollment::query()->whereNotNull('completed_at'),
                'completed_at',
                'completions',
            ),
        ];
    }

    public function learning(): array
    {
        $progress = CourseProgress::query();
        $totalProgressRecords = (clone $progress)->count();
        $completedProgressRecords = (clone $progress)->whereNotNull('completed_at')->count();

        $coursePerformance = Course::query()
            ->leftJoin('course_progress', 'courses.id', '=', 'course_progress.course_id')
            ->selectRaw('courses.id, courses.title, COUNT(course_progress.id) as learners_count')
            ->selectRaw('COALESCE(AVG(course_progress.progress_percentage), 0) as average_progress')
            ->selectRaw('SUM(CASE WHEN course_progress.completed_at IS NOT NULL THEN 1 ELSE 0 END) as completions_count')
            ->groupBy('courses.id', 'courses.title')
            ->orderByDesc('average_progress')
            ->limit(10)
            ->get()
            ->map(fn ($course) => [
                'course_id' => $course->id,
                'course_title' => $course->title,
                'learners_count' => (int) $course->learners_count,
                'average_progress' => (int) round((float) $course->average_progress),
                'completions_count' => (int) $course->completions_count,
            ])
            ->values()
            ->all();

        return [
            'period' => $this->period(),
            'summary' => [
                'average_progress' => (int) round((float) ((clone $progress)->avg('progress_percentage') ?? 0)),
                'completion_rate' => $totalProgressRecords > 0
                    ? (int) round(($completedProgressRecords / $totalProgressRecords) * 100)
                    : 0,
                'active_learners' => (clone $progress)
                    ->whereBetween('updated_at', [$this->from, $this->to])
                    ->distinct()
                    ->count('user_id'),
                'time_spent_seconds' => (int) (clone $progress)->sum('time_spent'),
            ],
            'by_course' => $coursePerformance,
        ];
    }

    private function usersInRoles(array $roles)
    {
        return User::query()->whereHas('roles', fn ($query) => $query->whereIn('name', $roles));
    }

    private function period(): array
    {
        return [
            'from' => $this->from->toDateString(),
            'to' => $this->to->toDateString(),
        ];
    }

    private function dailyCounts($query, string $column, string $key): array
    {
        return $query
            ->whereBetween($column, [$this->from, $this->to])
            ->selectRaw("DATE({$column}) as date, COUNT(*) as total")
            ->groupByRaw("DATE({$column})")
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                $key => (int) $row->total,
            ])
            ->values()
            ->all();
    }
}
