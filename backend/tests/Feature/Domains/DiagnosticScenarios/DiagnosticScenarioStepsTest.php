<?php

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function diagnosticStepInstructor(): User
{
    Role::findOrCreate('Instructor', 'web');
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

function diagnosticDraftScenario(User $instructor): DiagnosticScenario
{
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    return DiagnosticScenario::factory()->create(['course_id' => $course->id]);
}

it('creates steps with auto positions on a draft scenario', function () {
    $instructor = diagnosticStepInstructor();
    $scenario = diagnosticDraftScenario($instructor);

    $first = $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/diagnostics/{$scenario->id}/steps", [
            'title' => 'Check supply voltage',
            'description' => 'Measure at the throttle connector.',
            'action_type' => 'measure',
            'is_required' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.position', 1)
        ->assertJsonPath('data.action_type', 'measure')
        ->json('data');

    $second = $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/diagnostics/{$scenario->id}/steps", [
            'title' => 'Inspect connector',
            'action_type' => 'inspect',
        ])
        ->assertCreated()
        ->assertJsonPath('data.position', 2)
        ->json('data');

    expect($first['id'])->not->toBe($second['id']);
});

it('rejects invalid step payloads', function () {
    $instructor = diagnosticStepInstructor();
    $scenario = diagnosticDraftScenario($instructor);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/diagnostics/{$scenario->id}/steps", [
            'title' => 'Bad step',
            'action_type' => 'teleport',
        ])
        ->assertStatus(422);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/diagnostics/{$scenario->id}/steps", [
            'action_type' => 'measure',
        ])
        ->assertStatus(422);
});

it('updates and deletes steps, renumbering positions', function () {
    $instructor = diagnosticStepInstructor();
    $scenario = diagnosticDraftScenario($instructor);
    $a = DiagnosticScenarioStep::factory()->create(['diagnostic_scenario_id' => $scenario->id, 'position' => 1]);
    $b = DiagnosticScenarioStep::factory()->create(['diagnostic_scenario_id' => $scenario->id, 'position' => 2]);
    $c = DiagnosticScenarioStep::factory()->create(['diagnostic_scenario_id' => $scenario->id, 'position' => 3]);

    $this->actingAs($instructor)
        ->patchJson("/api/v1/instructor/diagnostics/steps/{$b->id}", [
            'title' => 'Renamed step',
            'is_terminal' => true,
        ])
        ->assertOk()
        ->assertJsonPath('data.title', 'Renamed step')
        ->assertJsonPath('data.is_terminal', true);

    $this->actingAs($instructor)
        ->deleteJson("/api/v1/instructor/diagnostics/steps/{$b->id}")
        ->assertOk();

    expect(DiagnosticScenarioStep::query()->find($a->id)->position)->toBe(1);
    expect(DiagnosticScenarioStep::query()->find($c->id)->position)->toBe(2);
});

it('reorders steps exactly', function () {
    $instructor = diagnosticStepInstructor();
    $scenario = diagnosticDraftScenario($instructor);
    $a = DiagnosticScenarioStep::factory()->create(['diagnostic_scenario_id' => $scenario->id, 'position' => 1]);
    $b = DiagnosticScenarioStep::factory()->create(['diagnostic_scenario_id' => $scenario->id, 'position' => 2]);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/diagnostics/{$scenario->id}/steps/reorder", [
            'ids' => [$b->id, $a->id],
        ])
        ->assertOk();

    expect(DiagnosticScenarioStep::query()->find($b->id)->position)->toBe(1);
    expect(DiagnosticScenarioStep::query()->find($a->id)->position)->toBe(2);

    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/diagnostics/{$scenario->id}/steps/reorder", [
            'ids' => [$a->id],
        ])
        ->assertStatus(422);
});

it('keeps published scenarios immutable and foreign steps unreachable', function () {
    $instructor = diagnosticStepInstructor();
    $other = diagnosticStepInstructor();
    $scenario = diagnosticDraftScenario($instructor);
    $step = DiagnosticScenarioStep::factory()->create(['diagnostic_scenario_id' => $scenario->id]);

    $foreign = diagnosticDraftScenario($other);
    $foreignStep = DiagnosticScenarioStep::factory()->create(['diagnostic_scenario_id' => $foreign->id]);

    // Foreign instructor cannot touch the step.
    $this->actingAs($other)
        ->patchJson("/api/v1/instructor/diagnostics/steps/{$step->id}", ['title' => 'Hijacked'])
        ->assertForbidden();
    $this->actingAs($other)
        ->deleteJson("/api/v1/instructor/diagnostics/steps/{$step->id}")
        ->assertForbidden();

    // Published scenarios reject step edits.
    $published = DiagnosticScenario::factory()->published()->create([
        'course_id' => Course::factory()->create(['instructor_id' => $instructor->id])->id,
    ]);
    $publishedStep = DiagnosticScenarioStep::factory()->create(['diagnostic_scenario_id' => $published->id]);

    $this->actingAs($instructor)
        ->patchJson("/api/v1/instructor/diagnostics/steps/{$publishedStep->id}", ['title' => 'Late edit'])
        ->assertStatus(409);
    $this->actingAs($instructor)
        ->postJson("/api/v1/instructor/diagnostics/{$published->id}/steps", [
            'title' => 'Late step',
            'action_type' => 'measure',
        ])
        ->assertStatus(409);
    $this->actingAs($instructor)
        ->deleteJson("/api/v1/instructor/diagnostics/steps/{$publishedStep->id}")
        ->assertStatus(409);

    expect(DiagnosticScenarioStep::query()->find($foreignStep->id))->not->toBeNull();
});
