<?php

namespace App\Domains\DiagnosticScenarios\Actions;

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Events\DiagnosticAttemptSubmitted;
use App\Domains\DiagnosticScenarios\Events\DiagnosticFailed;
use App\Domains\DiagnosticScenarios\Events\DiagnosticPassed;
use App\Domains\DiagnosticScenarios\Events\DiagnosticResultGenerated;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResult;
use App\Domains\DiagnosticScenarios\Services\DiagnosticResultService;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Complete an attempt: validate required steps, generate the persistent
 * DiagnosticResult, and finalize score/passed. Emits integration point for
 * course progress (DiagnosticPassed / DiagnosticFailed handled by listeners).
 */
final class CompleteDiagnosticAttemptAction
{
    public function __construct(
        private readonly DiagnosticResultService $results,
        private readonly StartDiagnosticScenarioAttemptAction $starter,
    ) {}

    public function execute(
        DiagnosticScenarioAttempt $attempt,
        User $user,
        int $hintPenalty = 0,
        int $wrongAttemptPenalty = 0,
        int $timePenalty = 0,
    ): DiagnosticScenarioResult {
        $result = DB::transaction(function () use ($attempt, $user, $hintPenalty, $wrongAttemptPenalty, $timePenalty) {
            if ($attempt->user_id !== $user->id) {
                abort(404);
            }

            if ($attempt->status !== DiagnosticScenarioAttemptStatus::IN_PROGRESS) {
                throw new LogicException('This scenario attempt has already been submitted.');
            }

            $attempt->loadMissing('scenario');
            $scenario = $attempt->scenario;

            if ($this->starter->isExpired($scenario, $attempt)) {
                $attempt->update(['status' => DiagnosticScenarioAttemptStatus::EXPIRED]);
                abort(422, 'Time expired.');
            }

            $steps = $scenario->steps()->orderBy('position')->get();
            $answers = collect($attempt->evidence['steps'] ?? []);

            $missing = $steps
                ->filter(fn ($s) => $s->is_required && ! $answers->has($s->id) && ! $answers->has((string) $s->id))
                ->values();

            if ($missing->isNotEmpty()) {
                throw new LogicException(
                    'Required steps are unanswered: '.$missing->pluck('title')->implode(', ')
                );
            }

            // Auto-sum recorded hint penalties unless an explicit override is given.
            $effectiveHintPenalty = $hintPenalty > 0
                ? $hintPenalty
                : $attempt->hintPenaltyTotal();

            $result = $this->results->generateForAttempt($attempt, $effectiveHintPenalty, $wrongAttemptPenalty, $timePenalty);
            $this->results->finalizeAttempt($attempt->fresh(), $result);

            return $result->fresh();
        });

        DiagnosticAttemptSubmitted::dispatch($attempt->fresh());
        DiagnosticResultGenerated::dispatch($result);

        if ($result->passed) {
            DiagnosticPassed::dispatch($result);
            // Diagnostic work counts as a learning day: awards XP and advances
            // the streak via the shared progression service (dedupe per attempt).
            app(\App\Domains\Progression\Services\StudentProgressionService::class)->award(
                $user,
                'diagnostic_completed',
                15,
                30,
                "diagnostic-attempt:{$attempt->id}",
                [
                    'label' => 'Diagnostic scenario completed',
                    'scenario' => $attempt->scenario?->title ?? 'Scenario',
                    'score' => $result->score,
                ],
            );
            app(\App\Domains\Challenges\Services\DailyChallengeService::class)->trackAction($user, 'diagnostic_complete', [
                'title' => $attempt->scenario?->title ?? 'Scenario',
                'score' => $result->score,
            ]);
        } else {
            DiagnosticFailed::dispatch($result);
        }

        return $result;
    }
}
