<?php

use App\Domains\DiagnosticScenarios\Actions\CompleteDiagnosticAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\StartDiagnosticScenarioAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\SubmitDiagnosticStepAction;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticProgress;
use App\Domains\DiagnosticScenarios\Models\CourseDiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Services\DiagnosticProgressService;
use App\Models\Course;
use App\Models\User;

it('records course progress when a diagnostic is passed', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create([
        'course_id' => $course->id,
        'passing_score' => 70,
    ]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => ['correct_action' => 'inspect'],
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($attempt->fresh(), $user, $step, ['action' => 'inspect']);
    app(CompleteDiagnosticAttemptAction::class)->execute($attempt->fresh(), $user);

    // Listener ran on DiagnosticPassed: legacy course progress via course_id.
    $progress = CourseDiagnosticProgress::where('course_id', $course->id)
        ->where('diagnostic_scenario_id', $scenario->id)
        ->where('user_id', $user->id)
        ->first();

    expect($progress)->not->toBeNull()
        ->and($progress->passed)->toBeTrue()
        ->and($progress->best_score)->toBe(100)
        ->and($progress->attempts_count)->toBe(1)
        ->and($progress->completed_at)->not->toBeNull();
});

it('tracks best score across failed then passed attempts', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create([
        'course_id' => $course->id,
        'passing_score' => 70,
    ]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => ['correct_action' => 'inspect'],
    ]);

    // Fail first.
    $first = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($first->fresh(), $user, $step, ['action' => 'wrong']);
    app(CompleteDiagnosticAttemptAction::class)->execute($first->fresh(), $user);

    $progress = CourseDiagnosticProgress::where('course_id', $course->id)
        ->where('diagnostic_scenario_id', $scenario->id)
        ->where('user_id', $user->id)
        ->first();

    expect($progress->passed)->toBeFalse()
        ->and($progress->best_score)->toBe(0)
        ->and($progress->completed_at)->toBeNull();

    // Pass on retry: best updates, completed_at set.
    $second = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($second->fresh(), $user, $step, ['action' => 'inspect']);
    app(CompleteDiagnosticAttemptAction::class)->execute($second->fresh(), $user);

    expect($progress->fresh()->passed)->toBeTrue()
        ->and($progress->fresh()->best_score)->toBe(100)
        ->and($progress->fresh()->attempts_count)->toBe(2)
        ->and($progress->fresh()->completed_at)->not->toBeNull();
});

it('holds assignment min_score above scenario passing_score', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    // Scenario passes at 0, but the course assignment demands 90.
    $scenario = DiagnosticScenario::factory()->published()->create([
        'course_id' => $course->id,
        'passing_score' => 0,
    ]);
    CourseDiagnosticScenario::factory()->create([
        'course_id' => $course->id,
        'diagnostic_scenario_id' => $scenario->id,
        'min_score' => 90,
    ]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => ['correct_action' => 'inspect'],
    ]);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($attempt->fresh(), $user, $step, ['action' => 'wrong']);
    $result = app(CompleteDiagnosticAttemptAction::class)->execute($attempt->fresh(), $user);

    // Result passes against the scenario (0/100 >= 0)...
    expect($result->passed)->toBeTrue();

    // ...but course progress does not, until best reaches the assignment bar.
    $progress = CourseDiagnosticProgress::where('course_id', $course->id)
        ->where('diagnostic_scenario_id', $scenario->id)
        ->where('user_id', $user->id)
        ->first();

    expect($progress->passed)->toBeFalse()
        ->and($progress->completed_at)->toBeNull();
});

it('reports required-diagnostics completion for a course', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create([
        'course_id' => $course->id,
        'passing_score' => 70,
        'is_required' => true,
    ]);
    CourseDiagnosticScenario::factory()->create([
        'course_id' => $course->id,
        'diagnostic_scenario_id' => $scenario->id,
        'is_required' => true,
    ]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => ['correct_action' => 'inspect'],
    ]);

    $service = app(DiagnosticProgressService::class);

    $before = $service->completionForCourse($course, $user);
    expect($before['required'])->toBe(1)->and($before['completed'])->toBe(0);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($attempt->fresh(), $user, $step, ['action' => 'inspect']);
    app(CompleteDiagnosticAttemptAction::class)->execute($attempt->fresh(), $user);

    $after = $service->completionForCourse($course->fresh(), $user);
    expect($after['completed'])->toBe(1)
        ->and($after['items'][0]['best_score'])->toBe(100);
});
