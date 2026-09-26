<?php

namespace App\Domains\DiagnosticScenarios\Services;

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use Illuminate\Support\Collection;

/**
 * Server-authoritative scoring.
 *
 * Score measures diagnostic performance (0-100).
 * Progress (completion %) is derived separately from answered required steps.
 * The frontend must never be trusted for score calculation.
 */
final class DiagnosticScoringService
{
    /**
     * @param  Collection<int, array{points_earned: int, points_possible: int, is_correct?: bool}>  $stepGrades
     * @return array{score: int, accuracy: int, process_score: int, points_earned: int, points_possible: int}
     */
    public function compute(
        Collection $stepGrades,
        int $hintPenalty = 0,
        int $wrongAttemptPenalty = 0,
        int $timePenalty = 0,
    ): array {
        $earned = (int) $stepGrades->sum('points_earned');
        $possible = (int) $stepGrades->sum('points_possible');

        $base = $possible > 0 ? (int) round(($earned / $possible) * 100) : 0;

        $score = max(0, min(100, $base - $hintPenalty - $wrongAttemptPenalty - $timePenalty));

        $totalSteps = $stepGrades->count();
        $correctSteps = $stepGrades->filter(fn ($g) => ($g['points_possible'] ?? 0) > 0 && ($g['points_earned'] ?? 0) >= ($g['points_possible'] ?? 0))->count();

        $accuracy = $totalSteps > 0 ? (int) round(($correctSteps / $totalSteps) * 100) : 0;

        // Process score: share of possible points earned before penalties.
        $processScore = $base;

        return [
            'score' => $score,
            'accuracy' => $accuracy,
            'process_score' => $processScore,
            'points_earned' => $earned,
            'points_possible' => $possible,
        ];
    }

    /**
     * Progress measures completion (0-100), independent of score.
     * A student can have 100% progress with 68% score, or 50% progress with 94% score.
     */
    public function progress(DiagnosticScenarioAttempt $attempt): int
    {
        $attempt->loadMissing('scenario.steps');

        $steps = $attempt->scenario->steps;
        $required = $steps->where('is_required', true);

        if ($required->isEmpty()) {
            return 100;
        }

        $answeredIds = collect($attempt->evidence['steps'] ?? [])->keys()->map(fn ($id) => (string) $id);

        // Prefer normalized step results when present.
        if ($attempt->relationLoaded('stepResults') || method_exists($attempt, 'stepResults')) {
            try {
                $normalized = $attempt->stepResults()->pluck('diagnostic_scenario_step_id')->map(fn ($id) => (string) $id);
                if ($normalized->isNotEmpty()) {
                    $answeredIds = $normalized;
                }
            } catch (\Throwable) {
                // Fall back to evidence blob.
            }
        }

        $answeredRequired = $required->filter(fn ($s) => $answeredIds->contains((string) $s->id))->count();

        return (int) round(($answeredRequired / $required->count()) * 100);
    }
}
