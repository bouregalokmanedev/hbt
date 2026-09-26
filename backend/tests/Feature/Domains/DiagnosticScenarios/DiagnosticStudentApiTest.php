<?php

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function diagnosticStudentSetup(): array
{
    $user = User::factory()->create();
    $course = Course::factory()->create();
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $scenario = DiagnosticScenario::factory()->published()->create([
        'course_id' => $course->id,
        'passing_score' => 70,
    ]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
        'configuration' => ['correct_action' => 'inspect', 'correct_component' => 'INJ'],
    ]);

    return [$user, $course, $scenario, $step];
}

it('runs the full student diagnostic flow over HTTP', function () {
    [$user, $course, $scenario, $step] = diagnosticStudentSetup();
    $hint = DiagnosticScenarioHint::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'diagnostic_scenario_step_id' => null,
        'level' => 1,
        'penalty_points' => 10,
    ]);

    // Hub.
    $this->actingAs($user)->getJson('/api/v1/student/scenarios')
        ->assertOk()
        ->assertJsonPath('data.0.id', $scenario->id)
        ->assertJsonPath('data.0.state', 'available');

    // Start.
    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts",
        ['course_id' => $course->id]
    )->assertCreated();
    $attemptId = $start->json('data.id');
    expect($attemptId)->toBeString();

    // Answer step (canonical payload + tool).
    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$step->id}",
        ['payload' => ['action' => 'inspect', 'component' => 'INJ'], 'tool' => 'scanner']
    )->assertOk()
        ->assertJsonPath('data.points_earned', 10)
        ->assertJsonPath('data.scenario_complete', true);

    // Use hint.
    $this->actingAs($user)->postJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/hints",
        ['hint_id' => $hint->id]
    )->assertOk()
        ->assertJsonPath('data.penalty_total', 10)
        ->assertJsonPath('data.hint.revealed', true);

    // Submit (100 base - 10 hint penalty).
    $this->actingAs($user)->postJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/submit"
    )->assertCreated()
        ->assertJsonPath('data.score', 90)
        ->assertJsonPath('data.passed', true);

    // Result.
    $this->actingAs($user)->getJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/result"
    )->assertOk()
        ->assertJsonPath('data.score', 90)
        ->assertJsonPath('data.accuracy', 100);

    // History (includes the scenario title for display).
    $this->actingAs($user)->getJson('/api/v1/student/scenario-attempts/history')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.scenario_id', $scenario->id)
        ->assertJsonPath('data.0.scenario.id', $scenario->id)
        ->assertJsonPath('data.0.scenario.title', $scenario->title);
});

it('lists hints without leaking unused content', function () {
    [$user, $course, $scenario, $step] = diagnosticStudentSetup();
    $hint = DiagnosticScenarioHint::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'diagnostic_scenario_step_id' => null,
        'level' => 1,
        'content' => 'Secret content',
    ]);

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    )->assertCreated();
    $attemptId = $start->json('data.id');

    // Before use: listed but content hidden.
    $this->actingAs($user)->getJson("/api/v1/student/scenario-attempts/{$attemptId}/hints")
        ->assertOk()
        ->assertJsonPath('data.0.revealed', false)
        ->assertJsonMissing(['content' => 'Secret content'])
        ->assertJsonPath('meta.hints_remaining', 3);

    $this->actingAs($user)->postJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/hints",
        ['hint_id' => $hint->id]
    )->assertOk();

    // After use: content revealed, remaining decremented.
    $this->actingAs($user)->getJson("/api/v1/student/scenario-attempts/{$attemptId}/hints")
        ->assertOk()
        ->assertJsonPath('data.0.revealed', true)
        ->assertJsonPath('data.0.content', 'Secret content')
        ->assertJsonPath('meta.hints_remaining', 2);
});

it('rejects cross-student attempt access', function () {
    [$user, $course, $scenario, $step] = diagnosticStudentSetup();
    $other = User::factory()->create();

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    )->assertCreated();
    $attemptId = $start->json('data.id');

    $this->actingAs($other)->getJson("/api/v1/student/scenario-attempts/{$attemptId}")
        ->assertNotFound();

    $this->actingAs($other)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$step->id}",
        ['payload' => ['action' => 'inspect']]
    )->assertNotFound();
});

it('validates step payload and hint id', function () {
    [$user, $course, $scenario, $step] = diagnosticStudentSetup();

    $start = $this->actingAs($user)->postJson(
        "/api/v1/student/scenarios/{$scenario->id}/attempts"
    )->assertCreated();
    $attemptId = $start->json('data.id');

    // Missing payload/choice.
    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$step->id}",
        ['tool' => 'scanner']
    )->assertOk(); // payload defaults to [] and grades 0, no validation error by design

    // Invalid tool rejected.
    $this->actingAs($user)->putJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/steps/{$step->id}",
        ['payload' => ['action' => 'inspect'], 'tool' => 'sonic-screwdriver']
    )->assertStatus(422);

    // Invalid hint rejected.
    $this->actingAs($user)->postJson(
        "/api/v1/student/scenario-attempts/{$attemptId}/hints",
        ['hint_id' => (string) Str::uuid()]
    )->assertStatus(422);
});
