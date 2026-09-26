<?php

use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function diagnosticInstructor(): User
{
    Role::findOrCreate('Instructor', 'web');
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

it('lets instructors view attempts in their courses', function () {
    $instructor = diagnosticInstructor();

    $course = Course::factory()->create(['instructor_id' => $instructor->id]);
    $scenario = DiagnosticScenario::factory()->published()->create(['course_id' => $course->id]);
    DiagnosticScenarioStep::factory()->create(['diagnostic_scenario_id' => $scenario->id]);

    $student = User::factory()->create();
    $attempt = DiagnosticScenarioAttempt::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'user_id' => $student->id,
    ]);

    $this->actingAs($instructor)->getJson('/api/v1/instructor/diagnostics/attempts')
        ->assertOk()
        ->assertJsonFragment(['id' => $attempt->id]);

    $this->actingAs($instructor)->getJson("/api/v1/instructor/diagnostics/attempts/{$attempt->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $attempt->id);
});

it('hides other instructors courses', function () {
    $instructorA = diagnosticInstructor();
    $instructorB = diagnosticInstructor();

    $course = Course::factory()->create(['instructor_id' => $instructorA->id]);
    $scenario = DiagnosticScenario::factory()->published()->create(['course_id' => $course->id]);
    $student = User::factory()->create();
    DiagnosticScenarioAttempt::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'user_id' => $student->id,
    ]);

    $response = $this->actingAs($instructorB)->getJson('/api/v1/instructor/diagnostics/attempts')->assertOk();

    expect($response->json('meta.total'))->toBe(0);
});
