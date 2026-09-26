<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function standaloneScenario(User $user, array $overrides = []): array
{
    $course = Course::factory()->create();
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $scenario = DiagnosticScenario::factory()->create(array_merge(
        ['course_id' => $course->id, 'status' => 'published'],
        $overrides,
    ));

    $stepOne = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_terminal' => false,
        'configuration' => ['correct_action' => 'inspect', 'correct_component' => 'fuel_pressure'],
    ]);
    $stepTwo = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 2,
        'is_terminal' => true,
    ]);

    return [$course, $scenario, $stepOne, $stepTwo];
}

it('lists published scenarios with completion state', function () {
    $user = User::factory()->create();
    [$course, $scenario, $stepOne, $stepTwo] = standaloneScenario($user);
    DiagnosticScenario::factory()->create(['status' => 'draft']);

    $response = $this->actingAs($user)->getJson('/api/v1/student/scenarios');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $scenario->id)
        ->assertJsonPath('data.0.completed', false)
        ->assertJsonPath('data.0.in_progress_attempt_id', null);
});

it('starts an attempt idempotently and resumes with saved answers', function () {
    $user = User::factory()->create();
    [$course, $scenario, $stepOne, $stepTwo] = standaloneScenario($user);

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    );

    $start->assertCreated()->assertJsonPath('data.status', 'in_progress');
    $attemptId = $start->json('data.id');

    // Second start returns the same attempt
    $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    )->assertCreated()->assertJsonPath('data.id', $attemptId);

    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect', 'component' => 'fuel_pressure']],
    )->assertOk();

    $resume = $this->actingAs($user)->getJson(
        "/api/v1/student/scenario-attempts/{$attemptId}"
    );

    $resume->assertOk()
        ->assertJsonPath('data.steps.0.answered', true)
        ->assertJsonPath('data.steps.0.choice.action', 'inspect')
        ->assertJsonPath('data.steps.1.answered', false);
});

it('rejects starting a draft scenario', function () {
    $user = User::factory()->create();
    [$course, $scenario, $stepOne, $stepTwo] = standaloneScenario($user, ['status' => 'draft']);

    $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    )->assertStatus(500);
});

it('submits a completed scenario and records a passed attempt', function () {
    $user = User::factory()->create();
    [$course, $scenario, $stepOne, $stepTwo] = standaloneScenario($user);

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    );
    $attemptId = $start->json('data.id');

    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect', 'component' => 'fuel_pressure']],
    )->assertOk()->assertJsonPath('data.points_earned', 10);

    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$stepTwo->id}",
        ['choice' => ['action' => 'anything']],
    )->assertOk()->assertJsonPath('data.scenario_complete', true);

    $submit = $this->actingAs($user)->postJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/submit"
    );

    $submit->assertCreated()
        ->assertJsonPath('data.score', 100)
        ->assertJsonPath('data.passed', true);

    expect(
        DiagnosticScenarioAttempt::where('id', $attemptId)->first()
    )->status->toBe(DiagnosticScenarioAttemptStatus::SUBMITTED);
});

it('blocks submit with unanswered required steps', function () {
    $user = User::factory()->create();
    [$course, $scenario, $stepOne, $stepTwo] = standaloneScenario($user);

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    );
    $attemptId = $start->json('data.id');

    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect', 'component' => 'fuel_pressure']],
    )->assertOk();

    $this->actingAs($user)->postJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/submit"
    )->assertStatus(500);
});

it('grades against scoring criteria', function () {
    $user = User::factory()->create();
    [$course, $scenario, $stepOne, $stepTwo] = standaloneScenario($user);

    DiagnosticScenarioScoringCriterion::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'step_id' => $stepOne->id,
        'key' => 'component',
        'points' => 20,
        'evaluation_type' => 'boolean',
        'rules' => ['field' => 'component', 'expected' => 'fuel_pressure'],
    ]);

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    );
    $attemptId = $start->json('data.id');

    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect', 'component' => 'battery']],
    )->assertOk()->assertJsonPath('data.points_earned', 0);
});

it('unlocks assessment eligibility after passing the required scenario', function () {
    $user = User::factory()->create();
    [$course, $scenario, $stepOne, $stepTwo] = standaloneScenario($user);

    // Course has no lessons; quizzes/scenarios are the only gates.
    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 1,
    ]);
    $assessment->diagnosticScenarios()->attach($scenario->id, ['position' => 1, 'is_required' => true]);

    expect(
        app(\App\Domains\Assessments\Services\AssessmentEligibilityService::class)->isEligible($assessment, $user)
    )->toBeFalse();

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    );
    $attemptId = $start->json('data.id');

    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect', 'component' => 'fuel_pressure']],
    );
    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$stepTwo->id}",
        ['choice' => ['action' => 'anything']],
    );
    $this->actingAs($user)->postJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/submit"
    )->assertCreated();

    expect(
        app(\App\Domains\Assessments\Services\AssessmentEligibilityService::class)->isEligible($assessment->fresh(), $user)
    )->toBeTrue();
});

it('enforces ownership and expiry', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    [$course, $scenario, $stepOne, $stepTwo] = standaloneScenario($user);

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    );
    $attemptId = $start->json('data.id');

    $this->actingAs($other)->getJson(
        "/api/v1/student/scenario-attempts/{$attemptId}"
    )->assertNotFound();

    // Expire via time limit
    $scenario->update(['time_limit' => 30]);
    DiagnosticScenarioAttempt::where('id', $attemptId)->update([
        'started_at' => now()->subHours(2),
    ]);

    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect']],
    )->assertStatus(422);
});
