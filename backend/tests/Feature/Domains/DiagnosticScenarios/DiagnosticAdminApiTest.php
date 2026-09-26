<?php

use App\Domains\DiagnosticScenarios\Actions\CompleteDiagnosticAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\StartDiagnosticScenarioAttemptAction;
use App\Domains\DiagnosticScenarios\Actions\SubmitDiagnosticStepAction;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioHint;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function diagnosticAdmin(): User
{
    Role::findOrCreate('Admin', 'web');
    $user = User::factory()->create();
    $user->assignRole('Admin');

    return $user;
}

it('runs the full admin authoring flow over HTTP', function () {
    $admin = diagnosticAdmin();
    $course = Course::factory()->create();

    // Create draft scenario.
    $created = $this->actingAs($admin)->postJson('/api/v1/admin/diagnostics', [
        'course_id' => $course->id,
        'title' => 'P2118 Throttle Actuator',
        'passing_score' => 75,
    ])->assertCreated();
    $scenarioId = $created->json('data.id');
    expect($scenarioId)->toBeString();

    // Publish blocked without steps.
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenarioId}/publish")
        ->assertStatus(422);

    // Add step + hint.
    $step = $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenarioId}/steps", [
        'title' => 'Check supply voltage',
        'action_type' => 'measure',
        'configuration' => ['correct_action' => 'measure'],
    ])->assertCreated();
    $stepId = $step->json('data.id');

    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenarioId}/hints", [
        'diagnostic_scenario_step_id' => $stepId,
        'level' => 1,
        'content' => 'Check fuse O7 first.',
        'penalty_points' => 5,
    ])->assertCreated();

    // Assign to course.
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenarioId}/assignments", [
        'course_id' => $course->id,
        'min_score' => 75,
        'max_attempts' => 3,
    ])->assertCreated();

    // Duplicate assignment rejected.
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenarioId}/assignments", [
        'course_id' => $course->id,
    ])->assertStatus(422);

    // Publish now succeeds.
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenarioId}/publish")
        ->assertOk()
        ->assertJsonPath('data.status', 'published');

    // Published scenario content is immutable.
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenarioId}/steps", [
        'title' => 'Late step',
        'action_type' => 'inspect',
    ])->assertStatus(409);

    // Detail shows composed authoring state.
    $this->actingAs($admin)->getJson("/api/v1/admin/diagnostics/{$scenarioId}")
        ->assertOk()
        ->assertJsonPath('data.status', 'published')
        ->assertJsonCount(1, 'data.steps')
        ->assertJsonCount(1, 'data.hints')
        ->assertJsonCount(1, 'data.assignments');
});

it('forks an immutable new version with copied content', function () {
    $admin = diagnosticAdmin();
    $course = Course::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create(['course_id' => $course->id]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
    ]);
    DiagnosticScenarioHint::factory()->forStep($step)->create();

    $forked = $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenario->id}/versions")
        ->assertCreated();
    $newId = $forked->json('data.id');

    expect($forked->json('data.version'))->toBe(2)
        ->and($forked->json('data.supersedes_id'))->toBe($scenario->id);

    $copy = DiagnosticScenario::find($newId);
    expect($copy->steps)->toHaveCount(1)
        ->and($copy->hints)->toHaveCount(1)
        ->and($copy->status->value)->toBe('draft')
        ->and($copy->steps->first()->id)->not->toBe($step->id);
});

it('rejects non-admin authoring access', function () {
    $student = User::factory()->create();
    $course = Course::factory()->create();

    $this->actingAs($student)->postJson('/api/v1/admin/diagnostics', [
        'course_id' => $course->id,
        'title' => 'Sneaky scenario',
    ])->assertForbidden();

    $this->actingAs($student)->getJson('/api/v1/admin/diagnostics')->assertForbidden();
});

it('authors scoring criteria that grade student steps', function () {
    $admin = diagnosticAdmin();
    $course = Course::factory()->create();
    $scenario = DiagnosticScenario::factory()->create(['course_id' => $course->id]);
    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'position' => 1,
        'is_required' => true,
    ]);

    // Boolean criterion: field must equal expected.
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenario->id}/criteria", [
        'step_id' => $step->id,
        'key' => 'correct-component',
        'title' => 'Correct component',
        'points' => 10,
        'evaluation_type' => 'boolean',
        'rules' => ['field' => 'component', 'expected' => 'INJ'],
    ])->assertCreated();

    // Duplicate keys rejected per scenario.
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenario->id}/criteria", [
        'step_id' => $step->id,
        'key' => 'correct-component',
        'title' => 'Duplicate',
        'points' => 5,
        'evaluation_type' => 'boolean',
        'rules' => ['field' => 'component', 'expected' => 'INJ'],
    ])->assertStatus(422);

    // Unknown evaluation types rejected.
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenario->id}/criteria", [
        'key' => 'weird',
        'title' => 'Weird',
        'points' => 5,
        'evaluation_type' => 'vibes',
    ])->assertStatus(422);

    // Criteria actually grade: publish, answer, submit.
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenario->id}/publish")->assertOk();

    $student = User::factory()->create();
    $attempt = app(StartDiagnosticScenarioAttemptAction::class)
        ->execute($scenario->fresh(), $student);
    app(SubmitDiagnosticStepAction::class)
        ->execute($attempt->fresh(), $student, $step, ['component' => 'INJ']);
    $result = app(CompleteDiagnosticAttemptAction::class)
        ->execute($attempt->fresh(), $student);

    expect($result->score)->toBe(100)->and($result->passed)->toBeTrue();

    // Published scenarios reject criteria edits (fork instead).
    $this->actingAs($admin)->postJson("/api/v1/admin/diagnostics/{$scenario->id}/criteria", [
        'key' => 'late',
        'title' => 'Late',
        'points' => 5,
        'evaluation_type' => 'boolean',
        'rules' => ['field' => 'component', 'expected' => 'INJ'],
    ])->assertStatus(409);
});
