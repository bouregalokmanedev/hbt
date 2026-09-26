<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenario;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioScoringCriterion;
use App\Domains\DiagnosticScenarios\Models\DiagnosticScenarioStep;
use App\Domains\StudentAssessments\Actions\StartAssessmentAction;
use App\Domains\StudentAssessments\Actions\SubmitAssessmentAction;
use App\Domains\StudentAssessments\Models\StudentAssessmentEvidence;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function scenarioAssessment(User $user): array
{
    $course = Course::factory()->create(['status' => 'published']);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
        'minimum_score' => 0,
    ]);

    $scenario = DiagnosticScenario::factory()->create(['course_id' => $course->id]);

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

    $assessment->diagnosticScenarios()->attach($scenario->id, ['position' => 1, 'is_required' => true]);

    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);

    return [$assessment, $scenario, $stepOne, $stepTwo, $attempt];
}

it('lists linked scenarios with progress for an attempt', function () {
    $user = User::factory()->create();
    [$assessment, $scenario, $stepOne, $stepTwo, $attempt] = scenarioAssessment($user);

    $response = $this->actingAs($user)->getJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios"
    );

    $response->assertOk()
        ->assertJsonPath('data.0.scenario_id', $scenario->id)
        ->assertJsonPath('data.0.total_steps', 2)
        ->assertJsonPath('data.0.answered_steps', 0)
        ->assertJsonPath('data.0.is_complete', false)
        ->assertJsonPath('data.0.current_step_id', $stepOne->id);
});

it('answers scenario steps and advances to the next step', function () {
    $user = User::factory()->create();
    [$assessment, $scenario, $stepOne, $stepTwo, $attempt] = scenarioAssessment($user);

    $first = $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios/{$scenario->id}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect', 'component' => 'fuel_pressure']],
    );

    $first->assertOk()
        ->assertJsonPath('data.points_earned', 10)
        ->assertJsonPath('data.scenario_complete', false)
        ->assertJsonPath('data.next_step.id', $stepTwo->id);

    $second = $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios/{$scenario->id}/steps/{$stepTwo->id}",
        ['choice' => ['action' => 'anything']],
    );

    // No criteria/config on step two → participation point, terminal → complete
    $second->assertOk()
        ->assertJsonPath('data.points_earned', 1)
        ->assertJsonPath('data.scenario_complete', true)
        ->assertJsonPath('data.next_step', null);

    $detail = $this->actingAs($user)->getJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios/{$scenario->id}"
    );

    $detail->assertOk()
        ->assertJsonPath('data.answered_steps', 2)
        ->assertJsonPath('data.is_complete', true);
});

it('grades steps against scoring criteria', function () {
    $user = User::factory()->create();
    [$assessment, $scenario, $stepOne, $stepTwo, $attempt] = scenarioAssessment($user);

    DiagnosticScenarioScoringCriterion::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'step_id' => $stepOne->id,
        'key' => 'correct-component',
        'points' => 20,
        'evaluation_type' => 'boolean',
        'rules' => ['field' => 'component', 'expected' => 'fuel_pressure'],
    ]);

    $response = $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios/{$scenario->id}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect', 'component' => 'battery']],
    );

    $response->assertOk()->assertJsonPath('data.points_earned', 0);
});

it('never exposes step configuration or criteria to the student', function () {
    $user = User::factory()->create();
    [$assessment, $scenario, $stepOne, $stepTwo, $attempt] = scenarioAssessment($user);

    DiagnosticScenarioScoringCriterion::factory()->create([
        'diagnostic_scenario_id' => $scenario->id,
        'step_id' => $stepOne->id,
        'key' => 'secret',
        'points' => 20,
        'evaluation_type' => 'boolean',
        'rules' => ['field' => 'component', 'expected' => 'fuel_pressure'],
    ]);

    $response = $this->actingAs($user)->getJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios/{$scenario->id}"
    );

    $body = $response->json('data');
    expect(json_encode($body))->not->toContain('correct_action')
        ->and(json_encode($body))->not->toContain('fuel_pressure');
});

it('converts scenario paths to evidence and decision score on submit without changing pass/fail', function () {
    $user = User::factory()->create();
    [$assessment, $scenario, $stepOne, $stepTwo, $attempt] = scenarioAssessment($user);

    $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios/{$scenario->id}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect', 'component' => 'fuel_pressure']],
    );
    $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios/{$scenario->id}/steps/{$stepTwo->id}",
        ['choice' => ['action' => 'anything']],
    );

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, []);

    // 10 + 1 earned of 10 + 1 possible → 100 decision score
    expect($result['decision_score'])->toBe(100.0)
        ->and($result['student_result']->decision_score)->not->toBeNull();

    $evidence = StudentAssessmentEvidence::where('attempt_id', $attempt->id)
        ->where('evidence_type', 'scenario_step')
        ->get();

    expect($evidence)->toHaveCount(2);
});

it('rejects unlinked scenarios and other users attempts', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    [$assessment, $scenario, $stepOne, $stepTwo, $attempt] = scenarioAssessment($user);

    $foreign = DiagnosticScenario::factory()->create();

    $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios/{$foreign->id}/steps/{$stepOne->id}",
        ['choice' => ['action' => 'inspect']],
    )->assertStatus(500);

    $this->actingAs($other)->getJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/scenarios"
    )->assertNotFound();
});
