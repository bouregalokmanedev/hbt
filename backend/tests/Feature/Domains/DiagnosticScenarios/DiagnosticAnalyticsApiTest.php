<?php

use App\Domains\DiagnosticScenarios\Enums\DiagnosticScenarioAttemptStatus;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStepResult;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function diagnosticAnalyticsAdmin(): User
{
    Role::findOrCreate('Admin', 'web');
    $user = User::factory()->create();
    $user->assignRole('Admin');

    return $user;
}

it('reports diagnostic performance and weakest steps', function () {
    $admin = diagnosticAnalyticsAdmin();
    $course = Course::factory()->create();
    $scenario = DiagnosticScenario::factory()->published()->create([
        'course_id' => $course->id,
    ]);
    DiagnosticScenario::factory()->published()->create(); // not counted below
    DiagnosticScenario::factory()->create(['course_id' => $course->id]);

    $step = DiagnosticScenarioStep::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'title' => 'Check supply voltage',
        'position' => 1,
    ]);

    $scores = [80, 60, 40];
    $correct = [true, false, false];

    foreach ($scores as $index => $score) {
        $attempt = DiagnosticScenarioAttempt::factory()->create([
            'diagnostic_scenario_id' => $scenario->id,
            'status' => DiagnosticScenarioAttemptStatus::SUBMITTED,
            'score' => $score,
            'passed' => $index === 0,
            'submitted_at' => now(),
            'completed_at' => now(),
        ]);

        DiagnosticScenarioStepResult::factory()->create([
            'diagnostic_scenario_id' => $scenario->id,
            'diagnostic_scenario_attempt_id' => $attempt->id,
            'diagnostic_scenario_step_id' => $step->id,
            'is_correct' => $correct[$index],
        ]);
    }

    $this->actingAs($admin)
        ->getJson('/api/v1/admin/diagnostics/analytics')
        ->assertOk()
        ->assertJsonPath('data.total_scenarios', 2)
        ->assertJsonPath('data.total_attempts', 3)
        ->assertJsonPath('data.avg_score', 60)
        ->assertJsonPath('data.pass_rate', 33.3)
        ->assertJsonPath('data.weak_steps.0.step', 'Check supply voltage')
        ->assertJsonPath('data.weak_steps.0.attempts', 3)
        ->assertJsonPath('data.weak_steps.0.accuracy', 33.3);
});

it('scopes diagnostic analytics to a course', function () {
    $admin = diagnosticAnalyticsAdmin();
    $course = Course::factory()->create();
    $otherCourse = Course::factory()->create();

    $scenario = DiagnosticScenario::factory()->published()->create([
        'course_id' => $course->id,
    ]);
    $otherScenario = DiagnosticScenario::factory()->published()->create([
        'course_id' => $otherCourse->id,
    ]);

    DiagnosticScenarioAttempt::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'status' => DiagnosticScenarioAttemptStatus::SUBMITTED,
        'score' => 90,
        'passed' => true,
    ]);
    DiagnosticScenarioAttempt::factory()->create([
        'diagnostic_scenario_id' => $otherScenario->id,
        'status' => DiagnosticScenarioAttemptStatus::SUBMITTED,
        'score' => 20,
        'passed' => false,
    ]);

    $this->actingAs($admin)
        ->getJson("/api/v1/admin/diagnostics/analytics?course_id={$course->id}")
        ->assertOk()
        ->assertJsonPath('data.total_scenarios', 1)
        ->assertJsonPath('data.total_attempts', 1)
        ->assertJsonPath('data.avg_score', 90)
        ->assertJsonPath('data.pass_rate', 100);
});

it('rejects diagnostic analytics for non-administrators', function () {
    $student = User::factory()->create();

    $this->actingAs($student)
        ->getJson('/api/v1/admin/diagnostics/analytics')
        ->assertForbidden();
});
