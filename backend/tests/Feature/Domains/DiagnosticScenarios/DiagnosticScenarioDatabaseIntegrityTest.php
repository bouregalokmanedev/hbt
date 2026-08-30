<?php

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\Course;
use Illuminate\Database\QueryException;

it('scenario step position is unique within scenario', function () {
    $scenario = DiagnosticScenario::factory()->create();

    DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
    ]);

    expect(fn () =>
        DiagnosticScenarioStep::factory()->create([
            'diagnostic_scenario_id' => $scenario->id,
            'position' => 1,
        ])
    )->toThrow(QueryException::class);
});

it('scenario can have multiple ordered steps', function () {
    $scenario = DiagnosticScenario::factory()->create();

    DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 2,
    ]);

    DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
    ]);

    expect($scenario->steps->pluck('position')->all())
        ->toBe([1, 2]);
});

it('scenario can have scoring criteria', function () {
    $scenario = DiagnosticScenario::factory()->create();

    DiagnosticScenarioScoringCriterion::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'key' => 'diagnosis',
        'position' => 1,
    ]);

    expect($scenario->scoringCriteria)
        ->toHaveCount(1);
});

it('scoring criterion belongs to a step', function () {
    $scenario = DiagnosticScenario::factory()->create();

    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
    ]);

    $criterion = DiagnosticScenarioScoringCriterion::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'step_id' => $step->id,
    ]);

    expect($criterion->step->id)
        ->toBe($step->id);
});

it('deleting scenario deletes its steps', function () {
    $scenario = DiagnosticScenario::factory()->create();

    DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
    ]);

    $scenario->delete();

    expect(
        DiagnosticScenarioStep::where(
            'diagnostic_scenario_id',
            $scenario->id
        )->exists()
    )->toBeFalse();
});