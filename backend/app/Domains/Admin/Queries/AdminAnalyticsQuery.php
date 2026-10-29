<?php

namespace App\Domains\Admin\Queries;

use App\Domains\Assignments\Enums\AssignmentStatus;
use App\Domains\Assignments\Enums\AssignmentSubmissionStatus;
use App\Domains\Assignments\Models\Assignment;
use App\Domains\Assignments\Models\AssignmentSubmission;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\Simulator\Models\SimulatorSession;
use App\Enums\Courses\CourseStatus;
use App\Enums\EnrollmentStatus;
use App\Enums\UserRole;
use App\Models\Course;
use App\Models\CourseProgress;
use App\Models\Enrollment;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

final class AdminAnalyticsQuery
{
    public function __construct(
        private readonly CarbonImmutable $from,
        private readonly CarbonImmutable $to,
        private readonly CarbonImmutable $previousFrom,
        private readonly CarbonImmutable $previousTo,
    ) {}

    public static function between(CarbonImmutable $from, CarbonImmutable $to): self
    {
        $days = max(1, (int) $from->diffInDays($to) + 1);
        $previousTo = $from->subSecond();
        $previousFrom = $previousTo->subDays($days - 1)->startOfDay();

        return new self($from, $to, $previousFrom, $previousTo);
    }

    /**
     * Cross-domain command center: growth, learning, assignments, and the
     * operational queues that need attention right now.
     */
    public function overview(): array
    {
        $newUsers = User::query()
            ->whereBetween('created_at', [$this->from, $this->to])
            ->count();
        $newEnrollments = Enrollment::query()
            ->whereBetween('enrolled_at', [$this->from, $this->to])
            ->count();
        $completions = Enrollment::query()
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$this->from, $this->to])
            ->count();
        $submissions = AssignmentSubmission::query()
            ->whereBetween('submitted_at', [$this->from, $this->to])
            ->count();

        $previousUsers = User::query()
            ->whereBetween('created_at', [$this->previousFrom, $this->previousTo])
            ->count();
        $previousEnrollments = Enrollment::query()
            ->whereBetween('enrolled_at', [$this->previousFrom, $this->previousTo])
            ->count();
        $previousCompletions = Enrollment::query()
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$this->previousFrom, $this->previousTo])
            ->count();
        $previousSubmissions = AssignmentSubmission::query()
            ->whereBetween('submitted_at', [$this->previousFrom, $this->previousTo])
            ->count();

        $coursePerformance = $this->coursePerformance();

        return [
            'period' => $this->period(),
            'previous_period' => $this->previousPeriod(),
            'summary' => [
                'students' => $this->usersInRoles([UserRole::STUDENT->value])->count(),
                'published_courses' => Course::query()
                    ->where('status', CourseStatus::PUBLISHED)
                    ->count(),
                'enrollments' => Enrollment::query()->count(),
                'completions' => Enrollment::query()
                    ->where('status', EnrollmentStatus::COMPLETED)
                    ->count(),
                'active_learners' => CourseProgress::query()
                    ->whereBetween('updated_at', [$this->from, $this->to])
                    ->distinct()
                    ->count('user_id'),
                'assignments_published' => Assignment::query()
                    ->where('status', AssignmentStatus::PUBLISHED)
                    ->count(),
                'simulator_sessions' => SimulatorSession::query()->count(),
                'diagnostic_attempts' => DiagnosticScenarioAttempt::query()
                    ->whereIn('status', [
                        DiagnosticScenarioAttemptStatus::SUBMITTED->value,
                        DiagnosticScenarioAttemptStatus::PASSED->value,
                        DiagnosticScenarioAttemptStatus::FAILED->value,
                    ])
                    ->count(),
            ],
            'comparison' => [
                'new_users' => $this->delta($newUsers, $previousUsers),
                'new_enrollments' => $this->delta($newEnrollments, $previousEnrollments),
                'completions_in_period' => $this->delta($completions, $previousCompletions),
                'submissions_in_period' => $this->delta($submissions, $previousSubmissions),
            ],
            'growth_series' => $this->combinedDailySeries([
                'new_users' => [User::query(), 'created_at'],
                'new_enrollments' => [Enrollment::query(), 'enrolled_at'],
                'completions' => [
                    Enrollment::query()->whereNotNull('completed_at'),
                    'completed_at',
                ],
            ]),
            'top_courses' => array_slice($coursePerformance, 0, 5),
            'operations' => [
                'courses_in_review' => Course::query()
                    ->where('status', CourseStatus::REVIEW)
                    ->count(),
                'assignments_pending_grading' => AssignmentSubmission::query()
                    ->where('status', AssignmentSubmissionStatus::SUBMITTED)
                    ->count(),
                'assignments_overdue' => Assignment::query()
                    ->where('status', AssignmentStatus::PUBLISHED)
                    ->whereNotNull('due_at')
                    ->where('due_at', '<', now())
                    ->count(),
                'simulator_sessions_active' => SimulatorSession::query()
                    ->where('status', 'active')
                    ->count(),
            ],
            'generated_at' => now()->toISOString(),
        ];
    }

    public function users(): array
    {
        $newUsers = User::query()
            ->whereBetween('created_at', [$this->from, $this->to])
            ->count();
        $previousNewUsers = User::query()
            ->whereBetween('created_at', [$this->previousFrom, $this->previousTo])
            ->count();

        $roles = [];
        foreach ([
            'students' => [UserRole::STUDENT->value],
            'instructors' => [UserRole::INSTRUCTOR->value],
            'administrators' => [UserRole::ADMIN->value, UserRole::SUPER_ADMIN->value],
        ] as $key => $roleNames) {
            $roles[$key] = $this->usersInRoles($roleNames)->count();
        }

        return [
            'period' => $this->period(),
            'previous_period' => $this->previousPeriod(),
            'summary' => [
                'total' => User::query()->count(),
                ...$roles,
                'active' => User::query()->where('status', 'active')->count(),
                'suspended' => User::query()->where('status', 'suspended')->count(),
                'new_in_period' => $newUsers,
            ],
            'comparison' => [
                'new_in_period' => $this->delta($newUsers, $previousNewUsers),
            ],
            'series' => $this->dailyCounts(User::query(), 'created_at', 'new_users'),
        ];
    }

    public function courses(): array
    {
        $publishedInPeriod = Course::query()
            ->whereNotNull('published_at')
            ->whereBetween('published_at', [$this->from, $this->to]);
        $previousPublished = Course::query()
            ->whereNotNull('published_at')
            ->whereBetween('published_at', [$this->previousFrom, $this->previousTo])
            ->count();

        return [
            'period' => $this->period(),
            'previous_period' => $this->previousPeriod(),
            'summary' => [
                'total' => Course::query()->count(),
                'draft' => Course::query()->where('status', CourseStatus::DRAFT)->count(),
                'review' => Course::query()->where('status', CourseStatus::REVIEW)->count(),
                'published' => Course::query()->where('status', CourseStatus::PUBLISHED)->count(),
                'archived' => Course::query()->where('status', CourseStatus::ARCHIVED)->count(),
                'published_in_period' => (clone $publishedInPeriod)->count(),
            ],
            'comparison' => [
                'published_in_period' => $this->delta(
                    (clone $publishedInPeriod)->count(),
                    $previousPublished,
                ),
            ],
            'created_series' => $this->dailyCounts(Course::query(), 'created_at', 'courses'),
            'published_series' => $this->dailyCounts($publishedInPeriod, 'published_at', 'courses'),
        ];
    }

    public function enrollments(): array
    {
        $newInPeriod = Enrollment::query()
            ->whereBetween('enrolled_at', [$this->from, $this->to])
            ->count();
        $completedInPeriod = Enrollment::query()
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$this->from, $this->to])
            ->count();
        $previousNew = Enrollment::query()
            ->whereBetween('enrolled_at', [$this->previousFrom, $this->previousTo])
            ->count();
        $previousCompleted = Enrollment::query()
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$this->previousFrom, $this->previousTo])
            ->count();

        $total = Enrollment::query()->count();
        $completed = Enrollment::query()
            ->where('status', EnrollmentStatus::COMPLETED)
            ->count();

        return [
            'period' => $this->period(),
            'previous_period' => $this->previousPeriod(),
            'summary' => [
                'total' => $total,
                'active' => Enrollment::query()->where('status', EnrollmentStatus::ACTIVE)->count(),
                'completed' => $completed,
                'cancelled' => Enrollment::query()->where('status', EnrollmentStatus::CANCELLED)->count(),
                'completion_rate' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
                'new_in_period' => $newInPeriod,
                'completed_in_period' => $completedInPeriod,
            ],
            'comparison' => [
                'new_in_period' => $this->delta($newInPeriod, $previousNew),
                'completed_in_period' => $this->delta($completedInPeriod, $previousCompleted),
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

        $activeLearners = (clone $progress)
            ->whereBetween('updated_at', [$this->from, $this->to])
            ->distinct()
            ->count('user_id');
        $previousActiveLearners = (clone $progress)
            ->whereBetween('updated_at', [$this->previousFrom, $this->previousTo])
            ->distinct()
            ->count('user_id');
        $completionsInPeriod = (clone $progress)
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$this->from, $this->to])
            ->count();
        $previousCompletions = (clone $progress)
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$this->previousFrom, $this->previousTo])
            ->count();

        return [
            'period' => $this->period(),
            'previous_period' => $this->previousPeriod(),
            'summary' => [
                'average_progress' => (int) round((float) ((clone $progress)->avg('progress_percentage') ?? 0)),
                'completion_rate' => $totalProgressRecords > 0
                    ? (int) round(($completedProgressRecords / $totalProgressRecords) * 100)
                    : 0,
                'active_learners' => $activeLearners,
                'completed_learners' => (clone $progress)
                    ->whereNotNull('completed_at')
                    ->distinct()
                    ->count('user_id'),
                'time_spent_seconds' => (int) (clone $progress)->sum('time_spent'),
                'completions_in_period' => $completionsInPeriod,
            ],
            'comparison' => [
                'active_learners' => $this->delta($activeLearners, $previousActiveLearners),
                'completions_in_period' => $this->delta($completionsInPeriod, $previousCompletions),
            ],
            'engagement_series' => $this->dailyDistinctCounts(
                CourseProgress::query(),
                'updated_at',
                'user_id',
                'active_learners',
            ),
            'by_course' => $this->coursePerformance(),
        ];
    }

    public function assignments(): array
    {
        $published = Assignment::query()
            ->where('status', AssignmentStatus::PUBLISHED);
        $submissionsInPeriod = AssignmentSubmission::query()
            ->whereBetween('submitted_at', [$this->from, $this->to])
            ->count();
        $gradedInPeriod = AssignmentSubmission::query()
            ->whereNotNull('graded_at')
            ->whereBetween('graded_at', [$this->from, $this->to])
            ->count();
        $previousSubmissions = AssignmentSubmission::query()
            ->whereBetween('submitted_at', [$this->previousFrom, $this->previousTo])
            ->count();
        $previousGraded = AssignmentSubmission::query()
            ->whereNotNull('graded_at')
            ->whereBetween('graded_at', [$this->previousFrom, $this->previousTo])
            ->count();

        $averageGradeRow = AssignmentSubmission::query()
            ->join('assignments', 'assignments.id', '=', 'assignment_submissions.assignment_id')
            ->whereNotNull('assignment_submissions.grade')
            ->selectRaw('AVG(assignment_submissions.grade * 100.0 / assignments.max_points) as average')
            ->first();
        $averageGrade = $averageGradeRow?->average;

        return [
            'period' => $this->period(),
            'previous_period' => $this->previousPeriod(),
            'summary' => [
                'total' => Assignment::query()->count(),
                'published' => (clone $published)->count(),
                'draft' => Assignment::query()
                    ->where('status', AssignmentStatus::DRAFT)
                    ->count(),
                'submissions' => AssignmentSubmission::query()->count(),
                'pending_grading' => AssignmentSubmission::query()
                    ->where('status', AssignmentSubmissionStatus::SUBMITTED)
                    ->count(),
                'graded' => AssignmentSubmission::query()
                    ->where('status', AssignmentSubmissionStatus::GRADED)
                    ->count(),
                'overdue' => (clone $published)
                    ->whereNotNull('due_at')
                    ->where('due_at', '<', now())
                    ->count(),
                'average_grade' => $averageGrade !== null
                    ? round((float) $averageGrade, 1)
                    : 0,
                'submissions_in_period' => $submissionsInPeriod,
                'graded_in_period' => $gradedInPeriod,
            ],
            'comparison' => [
                'submissions_in_period' => $this->delta($submissionsInPeriod, $previousSubmissions),
                'graded_in_period' => $this->delta($gradedInPeriod, $previousGraded),
            ],
            'submission_series' => $this->dailyCounts(
                AssignmentSubmission::query(),
                'submitted_at',
                'submissions',
            ),
            'grading_series' => $this->dailyCounts(
                AssignmentSubmission::query()->whereNotNull('graded_at'),
                'graded_at',
                'graded',
            ),
            'assignment_by_course' => $this->assignmentPerformance(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function coursePerformance(): array
    {
        return Course::query()
            ->leftJoin('course_progress', 'courses.id', '=', 'course_progress.course_id')
            ->select('courses.id', 'courses.title')
            ->selectRaw('COUNT(DISTINCT course_progress.user_id) as learners_count')
            ->selectRaw('COALESCE(AVG(course_progress.progress_percentage), 0) as average_progress')
            ->selectRaw('COALESCE(SUM(CASE WHEN course_progress.completed_at IS NOT NULL THEN 1 ELSE 0 END), 0) as completions_count')
            ->selectRaw('COALESCE(SUM(course_progress.time_spent), 0) as time_spent_seconds')
            ->groupBy('courses.id', 'courses.title')
            ->havingRaw('COUNT(DISTINCT course_progress.user_id) > 0')
            ->orderByDesc('learners_count')
            ->orderByDesc('average_progress')
            ->limit(10)
            ->get()
            ->map(function ($course) {
                $learners = (int) $course->learners_count;
                $completions = (int) $course->completions_count;

                return [
                    'course_id' => $course->id,
                    'course_title' => $course->title,
                    'learners_count' => $learners,
                    'average_progress' => (int) round((float) $course->average_progress),
                    'completions_count' => $completions,
                    'completion_rate' => $learners > 0
                        ? (int) round(($completions / $learners) * 100)
                        : 0,
                    'time_spent_seconds' => (int) $course->time_spent_seconds,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function assignmentPerformance(): array
    {
        return Course::query()
            ->join('assignments', 'assignments.course_id', '=', 'courses.id')
            ->leftJoin(
                'assignment_submissions',
                'assignment_submissions.assignment_id',
                '=',
                'assignments.id',
            )
            ->select('courses.id', 'courses.title')
            ->selectRaw('COUNT(DISTINCT assignments.id) as assignments_count')
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN assignments.status = ? THEN assignments.id END) as published_count',
                [AssignmentStatus::PUBLISHED->value],
            )
            ->selectRaw('COUNT(assignment_submissions.id) as submissions_count')
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN assignment_submissions.status = ? THEN 1 ELSE 0 END), 0) as pending_grading',
                [AssignmentSubmissionStatus::SUBMITTED->value],
            )
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN assignment_submissions.status = ? THEN 1 ELSE 0 END), 0) as graded_count',
                [AssignmentSubmissionStatus::GRADED->value],
            )
            ->selectRaw(
                'COUNT(DISTINCT CASE WHEN assignments.status = ? AND assignments.due_at IS NOT NULL AND assignments.due_at < ? THEN assignments.id END) as overdue_count',
                [AssignmentStatus::PUBLISHED->value, now()],
            )
            ->selectRaw('AVG(assignment_submissions.grade * 100.0 / assignments.max_points) as average_grade')
            ->groupBy('courses.id', 'courses.title')
            ->orderByDesc('pending_grading')
            ->orderByDesc('submissions_count')
            ->limit(20)
            ->get()
            ->map(fn ($course) => [
                'course_id' => $course->id,
                'course_title' => $course->title,
                'assignments_count' => (int) $course->assignments_count,
                'published_count' => (int) $course->published_count,
                'submissions_count' => (int) $course->submissions_count,
                'pending_grading' => (int) $course->pending_grading,
                'graded_count' => (int) $course->graded_count,
                'overdue_count' => (int) $course->overdue_count,
                'average_grade' => $course->average_grade !== null
                    ? round((float) $course->average_grade, 1)
                    : 0,
            ])
            ->values()
            ->all();
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

    private function previousPeriod(): array
    {
        return [
            'from' => $this->previousFrom->toDateString(),
            'to' => $this->previousTo->toDateString(),
        ];
    }

    /**
     * @return array{current: int, previous: int, change: int, change_percent: float}
     */
    private function delta(int $current, int $previous): array
    {
        $change = $current - $previous;
        $changePercent = $previous > 0
            ? round(($change / $previous) * 100, 1)
            : ($current > 0 ? 100.0 : 0.0);

        return [
            'current' => $current,
            'previous' => $previous,
            'change' => $change,
            'change_percent' => $changePercent,
        ];
    }

    private function dailyCounts($query, string $column, string $key): array
    {
        $rows = $query
            ->whereBetween($column, [$this->from, $this->to])
            ->selectRaw("DATE({$column}) as date, COUNT(*) as total")
            ->groupByRaw("DATE({$column})")
            ->orderBy('date')
            ->get()
            ->keyBy(fn ($row) => (string) $row->date);

        return $this->emptySeries()
            ->map(fn (array $row) => [
                'date' => $row['date'],
                $key => (int) ($rows[$row['date']]->total ?? 0),
            ])
            ->all();
    }

    private function dailyDistinctCounts(
        $query,
        string $column,
        string $distinctColumn,
        string $key,
    ): array {
        $rows = $query
            ->whereBetween($column, [$this->from, $this->to])
            ->selectRaw("DATE({$column}) as date, COUNT(DISTINCT {$distinctColumn}) as total")
            ->groupByRaw("DATE({$column})")
            ->orderBy('date')
            ->get()
            ->keyBy(fn ($row) => (string) $row->date);

        return $this->emptySeries()
            ->map(fn (array $row) => [
                'date' => $row['date'],
                $key => (int) ($rows[$row['date']]->total ?? 0),
            ])
            ->all();
    }

    /**
     * Merge several daily count queries into one continuous series so a
     * multi-line chart never has gaps or inconsistent dates.
     *
     * @param  array<string, array{0: mixed, 1: string}>  $definitions
     */
    private function combinedDailySeries(array $definitions): array
    {
        $positions = [];
        $series = [];

        foreach (
            CarbonPeriod::create(
                $this->from->startOfDay(),
                '1 day',
                $this->to->startOfDay(),
            ) as $position => $day
        ) {
            $date = $day->toDateString();
            $positions[$date] = $position;
            $series[$position] = ['date' => $date];

            foreach (array_keys($definitions) as $key) {
                $series[$position][$key] = 0;
            }
        }

        foreach ($definitions as $key => [$query, $column]) {
            $rows = $query
                ->whereBetween($column, [$this->from, $this->to])
                ->selectRaw("DATE({$column}) as date, COUNT(*) as total")
                ->groupByRaw("DATE({$column})")
                ->get();

            foreach ($rows as $row) {
                $date = (string) $row->date;
                if (isset($positions[$date])) {
                    $series[$positions[$date]][$key] = (int) $row->total;
                }
            }
        }

        return $series;
    }

    private function emptySeries(): Collection
    {
        $rows = [];
        foreach (
            CarbonPeriod::create(
                $this->from->startOfDay(),
                '1 day',
                $this->to->startOfDay(),
            ) as $day
        ) {
            $rows[] = ['date' => $day->toDateString()];
        }

        return collect($rows);
    }
}
