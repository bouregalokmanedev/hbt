<?php

namespace App\Domains\AI\Services;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Models\User;

/**
 * Diagnostic reasoning context for the AI Mentor.
 *
 * Safety invariants (the mentor is a reasoning assistant, never an actor):
 * - Read-only: context can never change scores, complete attempts, pass
 *   students, or unlock content. Enforcement is architectural — this service
 *   returns data only; no diagnostic action is reachable from the AI domain.
 * - Sanitized: step configuration, scoring criteria rules, and expected
 *   answers are NEVER included. Only the student's own progress signals
 *   (titles, correctness, points, revealed hints, scores) are exposed.
 * - Scoped: only the requesting student's attempts, optionally filtered
 *   by course.
 */
final class MentorDiagnosticContextService
{
    public function build(
        User $user,
        ?string $courseId = null,
    ): array {
        $base = DiagnosticScenarioAttempt::query()
            ->with([
                'scenario:id,title,course_id,passing_score',
                'stepResults.step:id,title,action_type',
                'hintUsages.hint:id,title,level,content,penalty_points',
                'result:id,diagnostic_scenario_attempt_id,score,accuracy,process_score,passed,strengths,weaknesses',
            ])
            ->where('user_id', $user->id)
            ->when(
                $courseId !== null,
                fn ($query) => $query->whereHas(
                    'scenario',
                    fn ($query) => $query->where('course_id', $courseId)
                )
            );

        $inProgress = (clone $base)
            ->where('status', DiagnosticScenarioAttemptStatus::IN_PROGRESS)
            ->latest()
            ->first();

        $submitted = (clone $base)
            ->where('status', DiagnosticScenarioAttemptStatus::SUBMITTED)
            ->latest('submitted_at')
            ->get();

        if ($inProgress === null && $submitted->isEmpty()) {
            return [];
        }

        return [
            'attempt_count' => $submitted->count() + ($inProgress !== null ? 1 : 0),

            'in_progress' => $inProgress !== null ? $this->presentAttempt($inProgress) : null,

            'latest' => $submitted->isNotEmpty() ? $this->presentAttempt($submitted->first()) : null,

            'recent_attempts' => $submitted
                ->take(5)
                ->map(fn (DiagnosticScenarioAttempt $attempt) => [
                    'scenario_id' => $attempt->diagnostic_scenario_id,
                    'scenario_title' => $attempt->scenario->title,
                    'score' => $attempt->score,
                    'passed' => $attempt->passed,
                    'submitted_at' => $attempt->submitted_at?->toISOString(),
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * Sanitized attempt snapshot. Deliberately excludes: step configuration,
     * scoring criteria, raw response payloads, and expected answers.
     */
    private function presentAttempt(DiagnosticScenarioAttempt $attempt): array
    {
        $stepResults = $attempt->stepResults;

        $totalSteps = $attempt->scenario->steps()->count();

        $revealedHints = $attempt->hintUsages->map(fn ($usage) => [
            'title' => $usage->hint->title,
            'level' => $usage->hint->level,
            'content' => $usage->hint->content,
            'penalty_applied' => $usage->penalty_applied,
        ])->values()->all();

        return [
            'attempt_id' => $attempt->id,
            'scenario_id' => $attempt->diagnostic_scenario_id,
            'scenario_title' => $attempt->scenario->title,
            'scenario_version' => $attempt->scenario_version ?? 1,
            'attempt_number' => $attempt->attempt_number,
            'status' => $attempt->status->value,

            'score' => $attempt->score,
            'passed' => $attempt->passed,

            'accuracy' => $attempt->result?->accuracy,
            'strengths' => $attempt->result?->strengths ?? [],
            'weaknesses' => $attempt->result?->weaknesses ?? [],

            'steps_answered' => $stepResults->count(),
            'steps_total' => $totalSteps,

            'step_performance' => $stepResults->map(fn ($result) => [
                'step_title' => $result->step->title,
                'action_type' => $result->step->action_type->value,
                'is_correct' => $result->is_correct,
                'points_earned' => $result->points_earned,
                'points_possible' => $result->points_possible,
            ])->values()->all(),

            'hints_used' => count($revealedHints),
            'hint_penalty' => (int) $attempt->hintUsages->sum('penalty_applied'),
            'revealed_hints' => $revealedHints,
        ];
    }
}
