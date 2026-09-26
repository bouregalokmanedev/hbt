<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\StudentAssessments\Actions\StartAssessmentAction;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function enforcementAttempt(User $user, array $assessmentOverrides = []): array
{
    $course = Course::factory()->create(['status' => 'published']);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $assessment = Assessment::factory()->create(array_merge(
        ['course_id' => $course->id, 'status' => 'published', 'required_quiz_score' => 0, 'required_scenarios' => 0],
        $assessmentOverrides,
    ));

    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);

    return [$course, $assessment, $attempt];
}

function blur(Tests\TestCase $test, User $user, AssessmentAttempt $attempt, int $times = 1)
{
    $response = null;
    foreach (range(1, $times) as $i) {
        $response = $test->actingAs($user)->postJson(
            "/api/v1/student/assessment-attempts/{$attempt->id}/integrity",
            ['event_type' => 'tab_blur'],
        );
    }

    return $response;
}

it('blocks an attempt at the tab-switch limit', function () {
    $user = User::factory()->create();
    [$course, $assessment, $attempt] = enforcementAttempt($user);

    blur($this, $user, $attempt)->assertOk();
    blur($this, $user, $attempt)->assertOk();

    expect($attempt->fresh()->status)->toBe(AssessmentAttemptStatus::IN_PROGRESS);

    $third = blur($this, $user, $attempt);
    $third->assertOk()->assertJsonPath('enforcement.action', 'blocked');

    $fresh = $attempt->fresh();
    expect($fresh->status)->toBe(AssessmentAttemptStatus::EXPIRED);
    expect($fresh->blocked_at)->not->toBeNull();
    expect($fresh->tab_switch_count)->toBe(3);
});

it('warns without blocking on a single high-severity event', function () {
    $user = User::factory()->create();
    [$course, $assessment, $attempt] = enforcementAttempt($user);

    $response = $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/integrity",
        ['event_type' => 'copy_attempt'],
    );

    $response->assertOk()->assertJsonPath('enforcement.action', 'warned');
    expect($attempt->fresh()->status)->toBe(AssessmentAttemptStatus::IN_PROGRESS);
});

it('keeps the legacy tab-switch contract while enforcing centrally', function () {
    $user = User::factory()->create();
    [$course, $assessment, $attempt] = enforcementAttempt($user);

    $url = "/api/v1/assessments/{$assessment->id}/attempts/{$attempt->id}/tab-switch";

    $this->actingAs($user)->postJson($url)
        ->assertOk()
        ->assertJsonPath('data.tab_switch_count', 1)
        ->assertJsonPath('data.blocked', false);

    $this->actingAs($user)->postJson($url)->assertOk();
    $this->actingAs($user)->postJson($url)
        ->assertOk()
        ->assertJsonPath('data.tab_switch_count', 3)
        ->assertJsonPath('data.blocked', true);

    expect(
        \App\Domains\StudentAssessments\Models\StudentAssessmentIntegrityEvent::where('attempt_id', $attempt->id)
            ->where('event_type', 'tab_blur')
            ->count()
    )->toBe(3);
});

it('returns 409 on double submit', function () {
    $user = User::factory()->create();
    [$course, $assessment, $attempt] = enforcementAttempt($user, ['minimum_score' => 100]);

    $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/submit",
        [],
    )->assertCreated();

    $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/submit",
        [],
    )->assertStatus(409)->assertJsonPath('success', false);
});

it('returns 409 when submitting a blocked attempt', function () {
    $user = User::factory()->create();
    [$course, $assessment, $attempt] = enforcementAttempt($user);

    blur($this, $user, $attempt, 3);
    expect($attempt->fresh()->blocked_at)->not->toBeNull();

    $this->actingAs($user)->postJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/submit",
        [],
    )->assertStatus(409);
});

it('lists flagged attempts for the course instructor', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $otherInstructor = User::factory()->create();
    $otherInstructor->assignRole('Instructor');

    $course = Course::factory()->create(['status' => 'published', 'instructor_id' => $instructor->id]);
    $student = User::factory()->create();
    \App\Models\Enrollment::factory()->create([
        'user_id' => $student->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);
    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $student);

    blur($this, $student, $attempt, 3);

    $response = $this->actingAs($instructor)->getJson(
        "/api/v1/instructor/courses/{$course->id}/assessments/flagged-attempts"
    );

    $response->assertOk()->assertJsonCount(1, 'data');
    expect($response->json('data.0.attempt_id'))->toBe($attempt->id);

    $this->actingAs($otherInstructor)->getJson(
        "/api/v1/instructor/courses/{$course->id}/assessments/flagged-attempts"
    )->assertForbidden();
});
