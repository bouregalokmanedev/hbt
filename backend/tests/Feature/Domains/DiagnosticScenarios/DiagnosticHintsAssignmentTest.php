<?php

use App\Domains\DiagnosticScenarios\Actions\CompleteDiagnosticAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\StartDiagnosticScenarioAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\SubmitDiagnosticStepAction;
use App\Domains\DiagnosticScenarios\Actions\UseDiagnosticHintAction;
use App\Domains\DiagnosticScenarios\Events\DiagnosticAttemptStarted;
use App\Domains\DiagnosticScenarios\Events\DiagnosticPassed;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Services\DiagnosticAccessService;
use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Facades\Event;

it('uses progressive hints with penalties', function () {
    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create();
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
    ]);
    $hint1 = DiagnosticScenarioHint::factory()->forStep($step)->level(1)->create([
        'penalty_points' => 5,
    ]);
    $hint2 = DiagnosticScenarioHint::factory()->forStep($step)->level(2)->create([
        'penalty_points' => 10,
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);

    // Level 2 before level 1 is rejected (progressive disclosure).
    expect(fn () => app(UseDiagnosticHintAction::class)->execute($attempt, $user, $hint2))
        ->toThrow(LogicException::class);

    $first = app(UseDiagnosticHintAction::class)->execute($attempt->fresh(), $user, $hint1);
    expect($first['penalty_total'])->toBe(5)->and($first['hints_used'])->toBe(1);

    $second = app(UseDiagnosticHintAction::class)->execute($attempt->fresh(), $user, $hint2);
    expect($second['penalty_total'])->toBe(15)->and($second['hints_used'])->toBe(2);

    // Reusing the same hint is rejected.
    expect(fn () => app(UseDiagnosticHintAction::class)->execute($attempt->fresh(), $user, $hint1))
        ->toThrow(LogicException::class);
});

it('caps hints at three per attempt', function () {
    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create();
    $hints = DiagnosticScenarioHint::factory()->count(4)->create([
        'diagnostic_scenario_id' => $scenario->id,
        'diagnostic_scenario_step_id' => null,
        'level' => 1,
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    $action = app(UseDiagnosticHintAction::class);

    $action->execute($attempt->fresh(), $user, $hints[0]);
    $action->execute($attempt->fresh(), $user, $hints[1]);
    $action->execute($attempt->fresh(), $user, $hints[2]);

    expect(fn () => $action->execute($attempt->fresh(), $user, $hints[3]))
        ->toThrow(LogicException::class);
});

it('applies hint penalties to the result score', function () {
    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create(['passing_score' => 0]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => ['correct_action' => 'inspect'],
    ]);
    $hint = DiagnosticScenarioHint::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'diagnostic_scenario_step_id' => null,
        'level' => 1,
        'penalty_points' => 12,
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($attempt->fresh(), $user, $step, ['action' => 'inspect']);
    app(UseDiagnosticHintAction::class)->execute($attempt->fresh(), $user, $hint);

    $result = app(CompleteDiagnosticAttemptAction::class)->execute($attempt->fresh(), $user);

    // Base 100 - 12 hint penalty.
    expect($result->score)->toBe(88);
});

it('pins the scenario version on the attempt', function () {
    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create(['version' => 2]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);

    expect($attempt->scenario_version)->toBe(2);
});

it('enforces course assignment rules', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create();

    CourseDiagnosticScenario::factory()->create([
        'course_id' => $course->id,
        'diagnostic_scenario_id' => $scenario->id,
        'max_attempts' => 1,
    ]);

    $service = app(DiagnosticAccessService::class);

    // Assigned course passes.
    $service->assertCanStart($scenario, $user, $course->id);

    // Unassigned course is rejected.
    $otherCourse = Course::factory()->create();
    expect(fn () => $service->assertCanStart($scenario, $user, $otherCourse->id))
        ->toThrow(LogicException::class);

    // Max attempts enforced.
    app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    expect(fn () => $service->assertCanStart($scenario, $user, $course->id))
        ->toThrow(LogicException::class);
});

it('dispatches attempt lifecycle events', function () {
    Event::fake([DiagnosticAttemptStarted::class, DiagnosticPassed::class]);

    $user = User::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create(['passing_score' => 0]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => ['correct_action' => 'inspect'],
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    Event::assertDispatched(DiagnosticAttemptStarted::class);

    app(SubmitDiagnosticStepAction::class)->execute($attempt->fresh(), $user, $step, ['action' => 'inspect']);
    app(CompleteDiagnosticAttemptAction::class)->execute($attempt->fresh(), $user);
    Event::assertDispatched(DiagnosticPassed::class);
});
