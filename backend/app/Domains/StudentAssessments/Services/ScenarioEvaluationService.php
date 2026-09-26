<?php

namespace App\Domains\StudentAssessments\Services;

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Services\DiagnosticStepGradingService;
use App\Domains\StudentAssessments\Models\StudentAssessmentScenarioPath;
use App\Domains\StudentAssessments\Models\StudentAssessmentEvidence;
use App\Domains\StudentAssessments\Models\StudentAssessmentResult;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use LogicException;

final class ScenarioEvaluationService
{
    public function __construct(
        private readonly DiagnosticStepGradingService $grading,
    ) {}
    /**
     * Scenarios linked to the attempt's assessment (pivot order).
     */
    public function linkedScenarios(AssessmentAttempt $attempt): Collection
    {
        $attempt->loadMissing('assessment');

        return $attempt->assessment
            ->diagnosticScenarios()
            ->with(['steps' => fn ($q) => $q->orderBy('position')])
            ->orderByPivot('position')
            ->get();
    }

    /**
     * Progress overview for one linked scenario within an attempt.
     */
    public function progress(AssessmentAttempt $attempt, User $user, DiagnosticScenario $scenario): array
    {
        $this->guard($attempt, $user, $scenario);

        $steps = $scenario->steps()->orderBy('position')->get();
        $paths = StudentAssessmentScenarioPath::where('attempt_id', $attempt->id)
            ->where('scenario_id', $scenario->id)
            ->get()
            ->keyBy('step_id');

        $current = $steps->first(fn ($s) => ! $paths->has($s->id));

        return [
            'scenario_id' => $scenario->id,
            'title' => $scenario->title,
            'total_steps' => $steps->count(),
            'answered_steps' => $paths->count(),
            'is_complete' => $current === null,
            'current_step_id' => $current?->id,
            'points_earned' => (int) $paths->sum('points_earned'),
            'steps' => $steps->map(fn ($s) => [
                'id' => $s->id,
                'position' => $s->position,
                'title' => $s->title,
                'description' => $s->description,
                'action_type' => $s->action_type->value,
                'is_required' => $s->is_required,
                'is_terminal' => $s->is_terminal,
                'is_current' => $current?->id === $s->id,
                'answered' => $paths->has($s->id),
                'points_earned' => $paths->get($s->id)?->points_earned ?? 0,
            ])->values()->all(),
        ];
    }

    /**
     * Answer a scenario step inside an IN_PROGRESS attempt.
     *
     * Payload shape: ['action' => ?, 'component' => ?, ...] — free-form,
     * evaluated against the step's scoring criteria (or legacy
     * configuration fallback). Steps advance linearly by position;
     * a terminal step (or the last step) completes the scenario.
     *
     * @return array{path: StudentAssessmentScenarioPath, next_step: ?DiagnosticScenarioStep, scenario_complete: bool}
     */
    public function answerStep(
        AssessmentAttempt $attempt,
        User $user,
        DiagnosticScenario $scenario,
        DiagnosticScenarioStep $step,
        array $chosen,
    ): array {
        return DB::transaction(function () use ($attempt, $user, $scenario, $step, $chosen) {
            $this->guard($attempt, $user, $scenario);

            if ($step->diagnostic_scenario_id !== $scenario->id) {
                throw new LogicException('Step does not belong to this scenario.');
            }

            $steps = $scenario->steps()->orderBy('position')->get();
            $next = $steps->first(fn ($s) => $s->position > $step->position);
            if ($step->is_terminal) {
                $next = null;
            }

            $grade = $this->grading->gradeStep($step, $chosen);

            $path = StudentAssessmentScenarioPath::updateOrCreate(
                [
                    'attempt_id' => $attempt->id,
                    'scenario_id' => $scenario->id,
                    'step_id' => $step->id,
                ],
                [
                    'chosen_option' => $chosen,
                    'next_step_id' => $next?->id,
                    'order' => $step->position,
                    'points_earned' => $grade['points_earned'],
                    'metadata' => [
                        'step_title' => $step->title,
                        'step_action' => $step->action_type->value,
                        'criteria' => $grade['criteria'],
                    ],
                ],
            );

            DB::table('assessment_attempts')->where('id', $attempt->id)->update([
                'last_activity_at' => now(),
                'updated_at' => now(),
            ]);

            $remaining = $steps->reject(fn ($s) => $s->id === $step->id || StudentAssessmentScenarioPath::where('attempt_id', $attempt->id)
                ->where('scenario_id', $scenario->id)
                ->where('step_id', $s->id)
                ->exists());

            return [
                'path' => $path->fresh(),
                'next_step' => $next,
                'scenario_complete' => $remaining->isEmpty(),
            ];
        });
    }

    /**
     * Materialize recorded paths as evidence rows at submit time.
     *
     * @return StudentAssessmentEvidence[]
     */
    public function buildEvidence(AssessmentAttempt $attempt, StudentAssessmentResult $studentResult): array
    {
        $paths = StudentAssessmentScenarioPath::where('attempt_id', $attempt->id)
            ->with(['step', 'scenario'])
            ->orderBy('scenario_id')
            ->orderBy('order')
            ->get();

        $evidence = [];
        foreach ($paths as $path) {
            $evidence[] = StudentAssessmentEvidence::create([
                'attempt_id' => $attempt->id,
                'result_id' => $studentResult->id,
                'question_id' => null,
                'competency_id' => null,
                'evidence_type' => 'scenario_step',
                'response' => $path->chosen_option ?? [],
                'expected_behavior' => $this->getExpectedBehavior($path->step),
                'observed_behavior' => json_encode($path->chosen_option ?? []),
                'points' => $path->points_earned,
                'quality_score' => $this->pathQuality($path),
                'metadata' => [
                    'scenario_id' => $path->scenario_id,
                    'scenario_title' => $path->scenario?->title,
                    'step_id' => $path->step_id,
                    'step_title' => $path->step?->title,
                    'next_step_id' => $path->next_step_id,
                ],
            ]);
        }

        return $evidence;
    }

    /**
     * Decision score (0-100) from recorded scenario paths.
     * Null when the attempt has no scenario activity. Never affects
     * pass/fail — the final score stays question-based.
     */
    public function decisionScore(AssessmentAttempt $attempt): ?float
    {
        $paths = StudentAssessmentScenarioPath::where('attempt_id', $attempt->id)
            ->with('step')
            ->get();

        if ($paths->isEmpty()) {
            return null;
        }

        $earned = (int) $paths->sum('points_earned');
        $possible = $paths->sum(fn ($p) => $this->stepPointsPossible($p->step));

        if ($possible <= 0) {
            return null;
        }

        return round(($earned / $possible) * 100, 2);
    }

    private function stepPointsPossible(?DiagnosticScenarioStep $step): int
    {
        if (! $step) {
            return 0;
        }

        return $this->grading->stepPointsPossible($step);
    }

    private function pathQuality(StudentAssessmentScenarioPath $path): float
    {
        $possible = $this->stepPointsPossible($path->step);

        if ($possible <= 0) {
            return 0.0;
        }

        return round(($path->points_earned / $possible) * 100, 2);
    }

    private function getExpectedBehavior(?DiagnosticScenarioStep $step): string
    {
        if (! $step) {
            return 'No specific criteria';
        }

        return $this->grading->expectedBehavior($step);
    }

    private function guard(AssessmentAttempt $attempt, User $user, DiagnosticScenario $scenario): void
    {
        if ($attempt->user_id !== $user->id) {
            abort(404);
        }

        if ($attempt->status !== AssessmentAttemptStatus::IN_PROGRESS) {
            throw new LogicException('Scenario steps can only be answered on an in-progress attempt.');
        }

        if ($attempt->expires_at?->isPast()) {
            $attempt->update(['status' => AssessmentAttemptStatus::EXPIRED, 'timed_out_at' => now()]);
            abort(422, 'Time expired.');
        }

        $attempt->loadMissing('assessment');

        $linked = $attempt->assessment->diagnosticScenarios()->where('diagnostic_scenarios.id', $scenario->id)->exists();

        if (! $linked) {
            throw new LogicException('Scenario is not linked to this assessment.');
        }
    }

    /**
     * Get the full path for an attempt/scenario.
     */
    public function getPath(AssessmentAttempt $attempt, DiagnosticScenario $scenario)
    {
        return StudentAssessmentScenarioPath::where('attempt_id', $attempt->id)
            ->where('scenario_id', $scenario->id)
            ->orderBy('order')
            ->with(['step', 'nextStep'])
            ->get();
    }

    /**
     * Calculate total scenario score.
     */
    public function getScenarioScore(AssessmentAttempt $attempt, DiagnosticScenario $scenario): int
    {
        return (int) StudentAssessmentScenarioPath::where('attempt_id', $attempt->id)
            ->where('scenario_id', $scenario->id)
            ->sum('points_earned');
    }
}
