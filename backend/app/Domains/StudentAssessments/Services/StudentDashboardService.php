<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Models\StudentAssessmentRecommendation;
use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use App\Domains\StudentAssessments\Queries\CompetencyResultQuery;
use App\Models\User;

final class StudentDashboardService
{
    public function __construct(
        private readonly StudentAssessmentService $assessmentService,
        private readonly CompetencyResultQuery $competencyQuery,
        private readonly AssessmentRecommendationService $recommendationService,
    ) {}

    /**
     * Aggregate the student assessment dashboard (§31):
     * available / in-progress / completed / recommended assessments,
     * competency strengths, pending recommendations and totals.
     */
    public function dashboard(User $user, int $limit = 5): array
    {
        $available = $this->assessmentService->listAvailable($user);

        $inProgress = AssessmentAttempt::where('user_id', $user->id)
            ->where('status', AssessmentAttemptStatus::IN_PROGRESS)
            ->with('assessment:id,title,course_id')
            ->latest('last_activity_at')
            ->limit($limit)
            ->get();

        $recentResults = StudentAssessmentResult::where('student_id', $user->id)
            ->with('assessment:id,title')
            ->latest('generated_at')
            ->limit($limit)
            ->get();

        $completedAssessmentIds = StudentAssessmentResult::where('student_id', $user->id)
            ->distinct()
            ->pluck('assessment_id');

        $competencies = $this->competencyQuery->competencySummary($user);

        $recommendations = StudentAssessmentRecommendation::where('student_id', $user->id)
            ->where('status', 'pending')
            ->with(['course:id,title', 'lesson:id,title'])
            ->latest()
            ->limit($limit)
            ->get();

        $attemptCount = AssessmentAttempt::where('user_id', $user->id)->count();
        $passedCount = StudentAssessmentResult::where('student_id', $user->id)->where('passed', true)->count();

        return [
            'assessments' => [
                'available' => $available
                    ->filter(fn ($item) => $item['eligibility']['eligible'] ?? false)
                    ->map(fn ($item) => $this->presentAvailable($item))
                    ->values()->all(),
                'locked' => $available
                    ->reject(fn ($item) => $item['eligibility']['eligible'] ?? false)
                    ->map(fn ($item) => $this->presentAvailable($item))
                    ->values()->all(),
                'in_progress' => $inProgress->map(fn ($a) => [
                    'attempt_id' => $a->id,
                    'assessment_id' => $a->assessment_id,
                    'assessment_title' => $a->assessment?->title,
                    'attempt_number' => $a->attempt_number,
                    'progress_percentage' => $a->progress_percentage ?? 0,
                    'expires_at' => $a->expires_at,
                    'last_activity_at' => $a->last_activity_at,
                ])->values()->all(),
                'completed' => $recentResults->map(fn ($r) => [
                    'assessment_id' => $r->assessment_id,
                    'assessment_title' => $r->assessment?->title,
                    'score' => $r->score,
                    'passed' => $r->passed,
                    'proficiency_level' => $r->proficiency_level?->value ?? $r->proficiency_level,
                    'completed_at' => $r->completed_at,
                ])->values()->all(),
                'completed_assessment_ids' => $completedAssessmentIds->values()->all(),
            ],
            'competencies' => [
                'strong' => $competencies['strong']->take($limit)->values(),
                'developing' => $competencies['developing']->take($limit)->values(),
                'weak' => $competencies['weak']->take($limit)->values(),
                'counts' => [
                    'strong' => $competencies['strong']->count(),
                    'developing' => $competencies['developing']->count(),
                    'weak' => $competencies['weak']->count(),
                ],
            ],
            'recommendations' => $recommendations->values(),
            'stats' => [
                'total_attempts' => $attemptCount,
                'passed_results' => $passedCount,
                'completed_assessments' => $completedAssessmentIds->count(),
                'pending_recommendations' => StudentAssessmentRecommendation::where('student_id', $user->id)
                    ->where('status', 'pending')
                    ->count(),
            ],
        ];
    }

    private function presentAvailable(array $item): array
    {
        /** @var \App\Domains\Assessments\Models\Assessment $assessment */
        $assessment = $item['assessment'];

        return [
            'id' => $assessment->id,
            'title' => $assessment->title,
            'course' => $assessment->course ? ['id' => $assessment->course->id, 'title' => $assessment->course->title] : null,
            'minimum_score' => $assessment->minimum_score,
            'max_attempts' => $assessment->max_attempts,
            'questions_count' => $assessment->questions_count ?? null,
            'eligibility' => $item['eligibility'],
        ];
    }
}
