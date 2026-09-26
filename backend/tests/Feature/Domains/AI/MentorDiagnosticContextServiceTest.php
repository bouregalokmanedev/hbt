<?php

use App\Domains\AI\Services\MentorContextService;
use App\Domains\AI\Services\MentorDiagnosticContextService;
use App\Domains\DiagnosticScenarios\Actions\CompleteDiagnosticAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\StartDiagnosticScenarioAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\SubmitDiagnosticStepAction;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function mentorDiagnosticContextService(): MentorDiagnosticContextService
{
    return app(MentorDiagnosticContextService::class);
}

function diagnosticScenarioWithStep(Course $course, array $config = ['correct_action' => 'inspect']): array
{
    $scenario = DiagnosticScenario::factory()->published()->create(['course_id' => $course->id]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => $config,
    ]);

    return [$scenario, $step];
}

it('returns empty context when the student has no attempts', function () {
    $user = User::factory()->create();

    expect(mentorDiagnosticContextService()->build($user))->toBe([]);
});

it('builds in-progress context with sanitized steps', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    [$scenario, $step] = diagnosticScenarioWithStep($course);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($attempt->fresh(), $user, $step, ['action' => 'inspect']);

    $context = mentorDiagnosticContextService()->build($user);

    expect($context['in_progress']['scenario_title'])->toBe($scenario->title)
        ->and($context['in_progress']['steps_answered'])->toBe(1)
        ->and($context['in_progress']['step_performance'][0]['is_correct'])->toBeTrue()
        ->and($context['latest'])->toBeNull();
});

it('builds submitted context with scores and weaknesses', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    [$scenario, $step] = diagnosticScenarioWithStep($course);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($attempt->fresh(), $user, $step, ['action' => 'inspect']);
    app(CompleteDiagnosticAttemptAction::class)->execute($attempt->fresh(), $user);

    $context = mentorDiagnosticContextService()->build($user);

    expect($context['in_progress'])->toBeNull()
        ->and($context['latest']['score'])->toBe(100)
        ->and($context['latest']['accuracy'])->toBe(100)
        ->and($context['recent_attempts'])->toHaveCount(1);
});

it('never leaks step configuration or scoring rules', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    [$scenario, $step] = diagnosticScenarioWithStep($course, [
        'correct_action' => 'supersecret-action',
        'correct_component' => 'supersecret-component',
    ]);
    DiagnosticScenarioScoringCriterion::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'step_id' => $step->id,
        'key' => 'secret-criterion',
        'points' => 10,
        'evaluation_type' => 'boolean',
        'rules' => ['field' => 'action', 'expected' => 'supersecret-expected-value'],
    ]);
    DiagnosticScenarioHint::factory()->forStep($step)->create(['content' => 'Unrevealed hint body']);

    $attempt = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);
    app(SubmitDiagnosticStepAction::class)->execute($attempt->fresh(), $user, $step, ['action' => 'inspect']);
    app(CompleteDiagnosticAttemptAction::class)->execute($attempt->fresh(), $user);

    $encoded = json_encode(mentorDiagnosticContextService()->build($user));

    expect($encoded)->not->toContain('supersecret-action')
        ->and($encoded)->not->toContain('supersecret-component')
        ->and($encoded)->not->toContain('supersecret-expected-value')
        ->and($encoded)->not->toContain('secret-criterion')
        ->and($encoded)->not->toContain('Unrevealed hint body');
});

it('scopes context to the requesting student and course', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $courseA = Course::factory()->create();
    $courseB = Course::factory()->create();
    [$scenarioA] = diagnosticScenarioWithStep($courseA);
    [$scenarioB, $stepB] = diagnosticScenarioWithStep($courseB);

    $attemptA = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenarioA, $user);
    $attemptB = app(StartDiagnosticScenarioAttemptAction::class)->execute($scenarioB, $other);
    app(SubmitDiagnosticStepAction::class)->execute($attemptB->fresh(), $other, $stepB, ['action' => 'inspect']);

    // Other student's work never appears.
    $context = mentorDiagnosticContextService()->build($user);
    expect($context['in_progress']['scenario_id'])->toBe($scenarioA->id)
        ->and($context['attempt_count'])->toBe(1);

    // Course filter narrows to the requested course.
    expect(mentorDiagnosticContextService()->build($user, $courseB->id))->toBe([]);
    expect(mentorDiagnosticContextService()->build($user, $courseA->id)['in_progress']['scenario_id'])
        ->toBe($scenarioA->id);
});

it('fills the diagnosticScenarios slot of the mentor context', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    [$scenario] = diagnosticScenarioWithStep($course);

    app(StartDiagnosticScenarioAttemptAction::class)->execute($scenario, $user);

    $context = app(MentorContextService::class)->build($user, $course->id);

    expect($context->diagnosticScenarios['in_progress']['scenario_id'])->toBe($scenario->id);
});
