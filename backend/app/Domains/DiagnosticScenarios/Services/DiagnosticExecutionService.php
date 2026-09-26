<?php

namespace App\Domains\DiagnosticScenarios\Services;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticTool;
use App\Domains\DiagnosticScenarios\Events\DiagnosticResponseSubmitted;
use App\Domains\DiagnosticScenarios\Events\DiagnosticStepCompleted;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResponse;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStepResult;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Backend-authoritative diagnostic execution.
 *
 * Flow: student action -> API -> execution service -> scenario rules ->
 * evaluation -> score update -> response persisted -> frontend state refreshed.
 */
final class DiagnosticExecutionService
{
    public function __construct(
        private readonly DiagnosticStepGradingService $grading,
        private readonly DiagnosticScoringService $scoring,
    ) {}

    /**
     * @return array{attempt: DiagnosticScenarioAttempt, response: DiagnosticScenarioResponse, step_result: DiagnosticScenarioStepResult, next_step: ?DiagnosticScenarioStep, scenario_complete: bool, progress: int}
     */
    public function submitStep(
        DiagnosticScenarioAttempt $attempt,
        DiagnosticScenarioStep $step,
        array $payload,
        ?DiagnosticTool $tool = null,
    ): array {
        return DB::transaction(function () use ($attempt, $step, $payload, $tool) {
            if ($attempt->status !== DiagnosticScenarioAttemptStatus::IN_PROGRESS) {
                throw new LogicException('This scenario attempt is no longer in progress.');
            }

            $attempt->loadMissing('scenario');
            $scenario = $attempt->scenario;

            if ($step->diagnostic_scenario_id !== $scenario->id) {
                throw new LogicException('Step does not belong to this scenario.');
            }

            // Expiry check (authoritative).
            if ($scenario->time_limit !== null && $attempt->started_at !== null) {
                $expired = $attempt->started_at->copy()->addMinutes($scenario->time_limit)->isPast();
                if ($expired) {
                    $attempt->update(['status' => DiagnosticScenarioAttemptStatus::EXPIRED]);
                    abort(422, 'Time expired.');
                }
            }

            $grade = $this->grading->gradeStep($step, $payload);

            $responseNumber = (int) DiagnosticScenarioResponse::where('diagnostic_scenario_attempt_id', $attempt->id)
                ->where('diagnostic_scenario_step_id', $step->id)
                ->count() + 1;

            $isCorrect = ($grade['points_possible'] ?? 0) > 0
                ? ($grade['points_earned'] ?? 0) >= ($grade['points_possible'] ?? 0)
                : true;

            $response = DiagnosticScenarioResponse::create([
                'diagnostic_scenario_id' => $scenario->id,
                'diagnostic_scenario_attempt_id' => $attempt->id,
                'diagnostic_scenario_step_id' => $step->id,
                'user_id' => $attempt->user_id,
                'response_number' => $responseNumber,
                'tool' => $tool,
                'payload' => $payload,
                'points_earned' => $grade['points_earned'],
                'points_possible' => $grade['points_possible'],
                'is_correct' => $isCorrect,
                'submitted_at' => now(),
            ]);

            $stepResult = DiagnosticScenarioStepResult::updateOrCreate(
                [
                    'diagnostic_scenario_attempt_id' => $attempt->id,
                    'diagnostic_scenario_step_id' => $step->id,
                ],
                [
                    'diagnostic_scenario_id' => $scenario->id,
                    'points_earned' => $grade['points_earned'],
                    'points_possible' => $grade['points_possible'],
                    'is_correct' => $isCorrect,
                    'criteria_breakdown' => $grade['criteria'],
                    'graded_at' => now(),
                ]
            );

            // Dual-write legacy evidence blob for backward compatibility
            // with existing controllers/tests until frontend migrates.
            $evidence = $attempt->evidence ?? ['steps' => []];
            $evidence['steps'][(string) $step->id] = [
                'choice' => $payload,
                'points_earned' => $grade['points_earned'],
                'points_possible' => $grade['points_possible'],
                'answered_at' => now()->toIso8601String(),
                'response_id' => $response->id,
                'tool' => $tool?->value,
            ];
            $attempt->update(['evidence' => $evidence]);

            $steps = $scenario->steps()->orderBy('position')->get();
            $next = $steps->first(fn ($s) => $s->position > $step->position);
            if ($step->is_terminal) {
                $next = null;
            }

            $answeredIds = collect($evidence['steps'])->keys()->map(fn ($id) => (string) $id);
            $remaining = $steps->reject(fn ($s) => $answeredIds->contains((string) $s->id));

            $progress = $this->scoring->progress($attempt->fresh());

            DiagnosticResponseSubmitted::dispatch($response);
            DiagnosticStepCompleted::dispatch($stepResult);

            return [
                'attempt' => $attempt->fresh(),
                'response' => $response,
                'step_result' => $stepResult,
                'next_step' => $next,
                'scenario_complete' => $remaining->isEmpty(),
                'progress' => $progress,
            ];
        });
    }
}
