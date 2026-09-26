<?php

namespace App\Domains\DiagnosticScenarios\Services;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResult;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStepResult;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Generates the persistent Diagnostic Result for an attempt.
 * Result becomes part of the student's learning record.
 */
final class DiagnosticResultService
{
    public function __construct(
        private readonly DiagnosticStepGradingService $grading,
        private readonly DiagnosticScoringService $scoring,
    ) {}

    public function generateForAttempt(
        DiagnosticScenarioAttempt $attempt,
        int $hintPenalty = 0,
        int $wrongAttemptPenalty = 0,
        int $timePenalty = 0,
    ): DiagnosticScenarioResult {
        return DB::transaction(function () use ($attempt, $hintPenalty, $wrongAttemptPenalty, $timePenalty) {
            $attempt->loadMissing('scenario');

            $scenario = $attempt->scenario;
            $steps = $scenario->steps()->orderBy('position')->get();

            // Prefer normalized step results; fall back to re-grading evidence blob.
            $grades = collect();
            $breakdown = [];

            foreach ($steps as $step) {
                $stored = DiagnosticScenarioStepResult::where('diagnostic_scenario_attempt_id', $attempt->id)
                    ->where('diagnostic_scenario_step_id', $step->id)
                    ->first();

                if ($stored) {
                    $grades->push([
                        'points_earned' => (int) $stored->points_earned,
                        'points_possible' => (int) $stored->points_possible,
                        'is_correct' => (bool) $stored->is_correct,
                    ]);
                    $breakdown[$step->id] = [
                        'step_id' => $step->id,
                        'title' => $step->title,
                        'points_earned' => (int) $stored->points_earned,
                        'points_possible' => (int) $stored->points_possible,
                        'is_correct' => (bool) $stored->is_correct,
                        'criteria' => $stored->criteria_breakdown ?? [],
                        'expected' => $this->grading->expectedBehavior($step),
                    ];

                    continue;
                }

                $answers = collect($attempt->evidence['steps'] ?? []);
                $storedAnswer = $answers->get($step->id, $answers->get((string) $step->id));

                if ($storedAnswer === null) {
                    continue;
                }

                $grade = $this->grading->gradeStep($step, $storedAnswer['choice'] ?? []);
                $isCorrect = ($grade['points_possible'] ?? 0) > 0
                    ? ($grade['points_earned'] ?? 0) >= ($grade['points_possible'] ?? 0)
                    : true;

                $grades->push([
                    'points_earned' => $grade['points_earned'],
                    'points_possible' => $grade['points_possible'],
                    'is_correct' => $isCorrect,
                ]);
                $breakdown[$step->id] = [
                    'step_id' => $step->id,
                    'title' => $step->title,
                    'points_earned' => $grade['points_earned'],
                    'points_possible' => $grade['points_possible'],
                    'is_correct' => $isCorrect,
                    'criteria' => $grade['criteria'],
                    'expected' => $this->grading->expectedBehavior($step),
                ];
            }

            $computed = $this->scoring->compute($grades, $hintPenalty, $wrongAttemptPenalty, $timePenalty);

            $passed = $computed['score'] >= (int) $scenario->passing_score;

            $strengths = [];
            $weaknesses = [];
            foreach ($breakdown as $item) {
                if (($item['points_possible'] ?? 0) > 0 && ($item['points_earned'] ?? 0) >= ($item['points_possible'] ?? 0)) {
                    $strengths[] = $item['title'];
                } else {
                    $weaknesses[] = $item['title'];
                }
            }

            $result = DiagnosticScenarioResult::updateOrCreate(
                ['diagnostic_scenario_attempt_id' => $attempt->id],
                [
                    'diagnostic_scenario_id' => $scenario->id,
                    'user_id' => $attempt->user_id,
                    'score' => $computed['score'],
                    'accuracy' => $computed['accuracy'],
                    'process_score' => $computed['process_score'],
                    'points_earned' => $computed['points_earned'],
                    'points_possible' => $computed['points_possible'],
                    'passed' => $passed,
                    'strengths' => array_values(array_slice($strengths, 0, 10)),
                    'weaknesses' => array_values(array_slice($weaknesses, 0, 10)),
                    'breakdown' => $breakdown,
                    'generated_at' => now(),
                ]
            );

            return $result->fresh();
        });
    }

    public function finalizeAttempt(DiagnosticScenarioAttempt $attempt, DiagnosticScenarioResult $result): DiagnosticScenarioAttempt
    {
        if ($attempt->status !== DiagnosticScenarioAttemptStatus::IN_PROGRESS
            && $attempt->status !== DiagnosticScenarioAttemptStatus::SUBMITTED) {
            throw new LogicException('This scenario attempt has already been finalized.');
        }

        $completedAt = now();

        $attempt->update([
            'status' => DiagnosticScenarioAttemptStatus::SUBMITTED,
            'score' => $result->score,
            'passed' => $result->passed,
            'evidence' => array_merge($attempt->evidence ?? [], [
                'points_earned' => $result->points_earned,
                'points_possible' => $result->points_possible,
                'accuracy' => $result->accuracy,
                'process_score' => $result->process_score,
                'result_id' => $result->id,
            ]),
            'submitted_at' => $attempt->submitted_at ?? $completedAt,
            'completed_at' => $completedAt,
        ]);

        return $attempt->fresh();
    }
}
