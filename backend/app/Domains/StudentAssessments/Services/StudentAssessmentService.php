<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Services\AssessmentEligibilityService;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Models\User;
use Illuminate\Support\Collection;

final class StudentAssessmentService
{
    public function __construct(private readonly AssessmentEligibilityService $eligibility) {}

    /**
     * List available assessments for student with eligibility evidence.
     */
    public function listAvailable(User $user): Collection
    {
        return Assessment::query()
            ->with([
                'course:id,title',
                'course.sections.lessons',
                'section:id,title,course_id',
                'section.lessons',
                'lesson:id,title,section_id',
                'quizzes' => fn ($query) => $query->with([
                    'attempts' => fn ($attempts) => $attempts
                        ->where('user_id', $user->id)
                        ->where('status', QuizAttemptStatus::SUBMITTED->value)
                        ->orderByDesc('percentage')
                        ->orderByDesc('attempt_number'),
                ]),
                'diagnosticScenarios' => fn ($query) => $query->with([
                    'attempts' => fn ($attempts) => $attempts
                        ->where('user_id', $user->id)
                        ->where('status', DiagnosticScenarioAttemptStatus::SUBMITTED->value)
                        ->where('passed', true)
                        ->orderByDesc('attempt_number'),
                ]),
                'attempts' => fn ($query) => $query
                    ->where('user_id', $user->id)
                    ->orderByDesc('attempt_number'),
            ])
            ->where('status', 'published')
            ->whereHas('course', fn ($query) => $query->where('status', 'published'))
            ->whereHas('course.enrollments', fn ($q) => $q
                ->where('user_id', $user->id)
                ->whereIn('status', ['active', 'completed']))
            ->withCount('questions')
            ->orderBy('published_at')
            ->get()
            ->map(fn (Assessment $a) => [
                'assessment' => $a,
                'eligibility' => $this->eligibility->evaluate($a, $user),
                'attempt_history' => $this->attemptHistory($a),
            ]);
    }

    public function getDetails(Assessment $assessment, User $user): array
    {
        $assessment->load(['course:id,title', 'section:id,title,course_id', 'lesson:id,title,section_id', 'questions']);
        return [
            'assessment' => $assessment,
            'eligibility' => $this->eligibility->evaluate($assessment, $user),
            'questions_count' => $assessment->questions->count(),
        ];
    }

    /**
     * Summarise a learner's own attempts so the catalogue can show their
     * best score, remaining attempts and any timeout cooldown without a
     * second round trip.
     *
     * @return array<string, mixed>
     */
    private function attemptHistory(Assessment $assessment): array
    {
        $attempts = $assessment->attempts;
        $count = $attempts->count();

        $remaining = $assessment->max_attempts === null
            ? null
            : max(0, (int) $assessment->max_attempts - $count);

        $latest = $attempts->first();
        $inProgress = $attempts->first(
            fn ($attempt) => $attempt->status === AssessmentAttemptStatus::IN_PROGRESS,
        );

        $lastExpired = $attempts
            ->filter(fn ($attempt) => $attempt->status === AssessmentAttemptStatus::EXPIRED)
            ->sortByDesc(fn ($attempt) => $attempt->timed_out_at?->getTimestamp() ?? 0)
            ->first();

        $cooldownUntil = $lastExpired?->timed_out_at?->copy()->addHours(12);
        $onCooldown = $cooldownUntil !== null && now()->lt($cooldownUntil);

        $bestScore = $attempts->max('score');

        return [
            'attempts_count' => $count,
            'best_score' => $bestScore === null ? null : (float) $bestScore,
            'passed' => $attempts->contains(fn ($attempt) => $attempt->passed === true),
            'remaining_attempts' => $remaining,
            'in_progress_attempt_id' => $inProgress?->id,
            'cooldown_until' => $onCooldown ? $cooldownUntil?->toIso8601String() : null,
            'can_start' => $inProgress !== null
                || (! $onCooldown && ($remaining === null || $remaining > 0)),
            'latest' => $latest === null ? null : [
                'id' => $latest->id,
                'attempt_number' => $latest->attempt_number,
                'status' => $latest->status?->value ?? $latest->status,
                'score' => $latest->score === null ? null : (float) $latest->score,
                'passed' => (bool) $latest->passed,
                'started_at' => $latest->started_at,
                'completed_at' => $latest->completed_at,
            ],
        ];
    }
}
