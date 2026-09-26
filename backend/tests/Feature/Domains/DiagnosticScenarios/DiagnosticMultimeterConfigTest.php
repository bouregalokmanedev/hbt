<?php

use App\Domains\DiagnosticScenarios\Actions\StartDiagnosticScenarioAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\SubmitDiagnosticStepAction;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticTool;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\User;

it('grades multimeter configuration from mode, probes and reading range', function () {
    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create();
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'tool' => DiagnosticTool::MULTIMETER,
        'configuration' => [
            'component_ref' => 'A1',
            'required_mode' => 'VDC',
            'red_target' => 'c1',
            'black_target' => 'gnd',
            'expected_min' => 12.0,
            'expected_max' => 14.4,
            'unit' => 'V',
        ],
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    $action = app(SubmitDiagnosticStepAction::class);

    $ok = $action->execute($attempt->fresh(), $user, $step, [
        'mode' => 'VDC',
        'redProbe' => 'c1',
        'blackProbe' => 'gnd',
        'reading' => '13.20 V',
    ], DiagnosticTool::MULTIMETER);

    expect($ok['points_earned'])->toBe(10);

    $wrongMode = $action->execute($attempt->fresh(), $user, $step, [
        'mode' => 'OHM',
        'redProbe' => 'c1',
        'blackProbe' => 'gnd',
        'reading' => '13.20 V',
    ], DiagnosticTool::MULTIMETER);

    expect($wrongMode['points_earned'])->toBe(0);

    $outOfRange = $action->execute($attempt->fresh(), $user, $step, [
        'mode' => 'VDC',
        'redProbe' => 'c1',
        'blackProbe' => 'gnd',
        'reading' => '0.10 V',
    ], DiagnosticTool::MULTIMETER);

    expect($outOfRange['points_earned'])->toBe(0);

    $wrongProbes = $action->execute($attempt->fresh(), $user, $step, [
        'mode' => 'VDC',
        'redProbe' => 'c2',
        'blackProbe' => 'gnd',
        'reading' => '13.20 V',
    ], DiagnosticTool::MULTIMETER);

    expect($wrongProbes['points_earned'])->toBe(0);
});

it('accepts OHM probe polarity swap', function () {
    $grading = app(\App\Domains\DiagnosticScenarios\Services\DiagnosticStepGradingService::class);
    $scenario = DiagnosticScenario::factory()->published()->create();
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'configuration' => [
            'required_mode' => 'OHM',
            'red_target' => 'c1',
            'black_target' => 'c2',
        ],
    ]);

    $swapped = $grading->gradeStep($step, [
        'mode' => 'OHM',
        'redProbe' => 'c2',
        'blackProbe' => 'c1',
    ]);

    expect($swapped['points_earned'])->toBe(10)
        ->and($swapped['criteria'][0]['key'])->toBe('multimeter_config');
});

it('exposes only component_ref as bench focus to the student', function () {
    $user = User::factory()->create();
    $course = \App\Models\Course::factory()->create();
    \App\Models\Enrollment::factory()->create(['user_id' => $user->id, 'course_id' => $course->id]);

    $scenario = DiagnosticScenario::factory()->published()->create(['course_id' => $course->id]);
    DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'tool' => DiagnosticTool::MULTIMETER,
        'configuration' => [
            'component_ref' => 'A1',
            'required_mode' => 'VDC',
            'red_target' => 'c1',
            'black_target' => 'gnd',
            'expected_min' => 12.0,
            'expected_max' => 14.4,
            'unit' => 'V',
        ],
    ]);

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts",
        ['course_id' => $course->id]
    )->assertCreated();

    $body = $this->actingAs($user)->getJson(
        '/api/v1/student/scenario-attempts/' . $start->json('data.id')
    )->json('data');

    expect(json_encode($body))->toContain('component_ref')
        ->and(json_encode($body))->not->toContain('required_mode')
        ->and(json_encode($body))->not->toContain('expected_min')
        ->and(json_encode($body))->not->toContain('red_target');

    $bench = $body['steps'][0]['bench'] ?? null;
    expect($bench)->toBe(['component_ref' => 'A1']);
});
