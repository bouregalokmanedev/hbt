<?php

use App\Domains\DiagnosticScenarios\Actions\CompleteDiagnosticAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\StartDiagnosticScenarioAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\SubmitDiagnosticStepAction;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticTool;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResponse;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioResult;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\User;

it('executes a step with normalized persistence', function () {
    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create();
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'configuration' => ['correct_action' => 'inspect', 'correct_component' => 'INJ'],
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);

    $outcome = app(SubmitDiagnosticStepAction::class)->execute(
        $attempt,
        $user,
        $step,
        ['action' => 'inspect', 'component' => 'INJ'],
        DiagnosticTool::SCANNER,
    );

    expect($outcome['points_earned'])->toBe(10)
        ->and($outcome['response'])->toBeInstanceOf(DiagnosticScenarioResponse::class)
        ->and($outcome['response']->tool)->toBe(DiagnosticTool::SCANNER)
        ->and($outcome['response']->response_number)->toBe(1);

    expect(DiagnosticScenarioResponse::where('diagnostic_scenario_attempt_id', $attempt->id)->count())->toBe(1);

    // Evidence blob dual-written for BC.
    expect($outcome['attempt']->evidence['steps'][(string) $step->id]['choice'])
        ->toBe(['action' => 'inspect', 'component' => 'INJ']);
});

it('tracks response history per step', function () {
    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create();
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'configuration' => ['correct_action' => 'inspect'],
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    $action = app(SubmitDiagnosticStepAction::class);

    $action->execute($attempt, $user, $step, ['action' => 'wrong'], DiagnosticTool::MULTIMETER);
    $second = $action->execute($attempt->fresh(), $user, $step, ['action' => 'inspect'], DiagnosticTool::MULTIMETER);

    expect($second['response']->response_number)->toBe(2)
        ->and(DiagnosticScenarioResponse::where('diagnostic_scenario_attempt_id', $attempt->id)->count())->toBe(2);
});

it('completes an attempt with a persistent result', function () {
    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create(['passing_score' => 70]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => ['correct_action' => 'inspect', 'correct_component' => 'INJ'],
    ]);
    DiagnosticScenarioScoringCriterion::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'step_id' => $step->id,
        'key' => 'correct-diagnosis',
        'points' => 10,
        'evaluation_type' => 'boolean',
        'rules' => ['field' => 'action', 'expected' => 'inspect'],
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($attempt->fresh(), $user, $step, ['action' => 'inspect']);

    $result = app(CompleteDiagnosticAttemptAction::class)->execute($attempt->fresh(), $user);

    expect($result)->toBeInstanceOf(DiagnosticScenarioResult::class)
        ->and($result->score)->toBe(100)
        ->and($result->passed)->toBeTrue()
        ->and($result->accuracy)->toBe(100);

    $attempt = $attempt->fresh();
    expect($attempt->score)->toBe(100)->and($attempt->passed)->toBeTrue();
});

it('separates score from progress', function () {
    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create(['passing_score' => 70]);
    $step1 = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => ['correct_action' => 'inspect'],
    ]);
    DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 2,
        'is_required' => true,
        'configuration' => ['correct_action' => 'measure'],
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    $outcome = app(SubmitDiagnosticStepAction::class)->execute(
        $attempt,
        $user,
        $step1,
        ['action' => 'inspect'],
    );

    // 1 of 2 required steps answered correctly: progress 50, step score 100.
    expect($outcome['progress'])->toBe(50)
        ->and($outcome['points_earned'])->toBe(10);
});
