<?php

namespace App\Domains\DiagnosticScenarios\Services;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticHintUsage;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Progressive hints with score penalties.
 * Mirrors simulator behavior: hints cost score, max 3 per attempt,
 * each hint usable once per attempt, levels disclosed progressively.
 */
final class DiagnosticHintService
{
    public const MAX_HINTS_PER_ATTEMPT = 3;

    /**
     * @return array{usage: DiagnosticHintUsage, hints_used: int, penalty_total: int}
     */
    public function useHint(
        DiagnosticScenarioAttempt $attempt,
        DiagnosticScenarioHint $hint,
    ): array {
        return DB::transaction(function () use ($attempt, $hint) {
            if ($attempt->status !== DiagnosticScenarioAttemptStatus::IN_PROGRESS) {
                throw new LogicException('This scenario attempt is no longer in progress.');
            }

            if ($hint->diagnostic_scenario_id !== $attempt->diagnostic_scenario_id) {
                throw new LogicException('Hint does not belong to this scenario.');
            }

            $usedCount = DiagnosticHintUsage::where(
                'diagnostic_scenario_attempt_id',
                $attempt->id
            )->count();

            $attempt->loadMissing('scenario');
            $budget = $attempt->scenario->hintBudget();

            if ($usedCount >= $budget) {
                throw new LogicException('Maximum hints for this attempt have been used.');
            }

            $alreadyUsed = DiagnosticHintUsage::where(
                'diagnostic_scenario_attempt_id',
                $attempt->id
            )->where('diagnostic_scenario_hint_id', $hint->id)->exists();

            if ($alreadyUsed) {
                throw new LogicException('This hint has already been used in this attempt.');
            }

            // Progressive disclosure: level N requires level N-1 of the same step/scenario used first.
            if ($hint->level > 1) {
                $priorLevelUsed = DiagnosticHintUsage::where(
                    'diagnostic_scenario_attempt_id',
                    $attempt->id
                )->whereHas('hint', fn ($q) => $q
                    ->where('diagnostic_scenario_id', $hint->diagnostic_scenario_id)
                    ->where('diagnostic_scenario_step_id', $hint->diagnostic_scenario_step_id)
                    ->where('level', $hint->level - 1))
                    ->exists();

                if (! $priorLevelUsed) {
                    throw new LogicException('Use the previous hint level first.');
                }
            }

            $usage = DiagnosticHintUsage::create([
                'diagnostic_scenario_id' => $attempt->diagnostic_scenario_id,
                'diagnostic_scenario_attempt_id' => $attempt->id,
                'diagnostic_scenario_hint_id' => $hint->id,
                'user_id' => $attempt->user_id,
                'penalty_applied' => (int) $hint->penalty_points,
                'used_at' => now(),
            ]);

            $penaltyTotal = (int) DiagnosticHintUsage::where(
                'diagnostic_scenario_attempt_id',
                $attempt->id
            )->sum('penalty_applied');

            return [
                'usage' => $usage->fresh(),
                'hints_used' => $usedCount + 1,
                'penalty_total' => $penaltyTotal,
            ];
        });
    }

    public function penaltyTotal(DiagnosticScenarioAttempt $attempt): int
    {
        return $attempt->hintPenaltyTotal();
    }

    /**
     * Next available hint for a step (lowest unused level).
     */
    public function nextHintForStep(
        DiagnosticScenarioAttempt $attempt,
        ?string $stepId,
    ): ?DiagnosticScenarioHint {
        $usedHintIds = DiagnosticHintUsage::where(
            'diagnostic_scenario_attempt_id',
            $attempt->id
        )->pluck('diagnostic_scenario_hint_id');

        return DiagnosticScenarioHint::where(
            'diagnostic_scenario_id',
            $attempt->diagnostic_scenario_id
        )
            ->where('diagnostic_scenario_step_id', $stepId)
            ->whereNotIn('id', $usedHintIds)
            ->orderBy('level')
            ->orderBy('position')
            ->first();
    }
}
