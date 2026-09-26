<?php

use App\Domains\Assessments\Actions\SubmitAssessmentAttemptAction;
use App\Domains\Assessments\Events\AssessmentPassed;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Certificates\Listeners\IssueCertificateForPassedAssessment;
use App\Domains\Instructor\Actions\Assessments\CreateAssessmentAction;
use App\Models\Certificate;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function modeInstructor(): User
{
    $user = User::factory()->create();
    $user->assignRole('Instructor');

    return $user;
}

function modeCourse(User $instructor): Course
{
    return Course::factory()->create(['instructor_id' => $instructor->id]);
}

it('defaults the attempt budget to the assessment mode on create', function () {
    $instructor = modeInstructor();
    $course = modeCourse($instructor);
    $action = app(CreateAssessmentAction::class);

    $cases = [
        'diagnostic' => 1,
        'formative' => null,
        'practice' => null,
        'summative' => 3,
        'final' => 2,
    ];

    foreach ($cases as $mode => $expected) {
        $assessment = $action->execute($course, $instructor, [
            'title' => "Assessment {$mode} ".fake()->unique()->word(),
            'assessment_mode' => $mode,
        ]);

        expect($assessment->max_attempts)->toBe($expected);
    }
});

it('respects an explicitly set attempt budget', function () {
    $instructor = modeInstructor();
    $course = modeCourse($instructor);
    $action = app(CreateAssessmentAction::class);

    $custom = $action->execute($course, $instructor, [
        'title' => 'Custom budget '.fake()->unique()->word(),
        'assessment_mode' => 'diagnostic',
        'max_attempts' => 5,
    ]);
    expect($custom->max_attempts)->toBe(5);

    $unlimited = $action->execute($course, $instructor, [
        'title' => 'Unlimited '.fake()->unique()->word(),
        'assessment_mode' => 'final',
        'max_attempts' => null,
    ]);
    expect($unlimited->max_attempts)->toBeNull();
});

it('does not issue certificates for low-stakes passes', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->create([
        'assessment_mode' => 'practice',
        'minimum_score' => 0,
    ]);
    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    $result = app(SubmitAssessmentAttemptAction::class)->execute(
        $attempt,
        $user,
        ['score' => 100, 'passed' => true, 'evidence' => [], 'results' => []],
    );

    expect($result->passed)->toBeTrue();
    expect(Certificate::query()->count())->toBe(0);
});

it('still issues certificates for high-stakes passes', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->create([
        'assessment_mode' => 'summative',
        'minimum_score' => 0,
    ]);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $assessment->course_id,
    ]);
    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    $result = app(SubmitAssessmentAttemptAction::class)->execute(
        $attempt,
        $user,
        ['score' => 100, 'passed' => true, 'evidence' => [], 'results' => []],
    );

    expect($result->passed)->toBeTrue();
    expect(
        Certificate::query()->where('assessment_result_id', $result->id)->exists()
    )->toBeTrue();
});

it('listener skips certificates for low-stakes passes', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->create([
        'assessment_mode' => 'formative',
        'minimum_score' => 0,
    ]);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $assessment->course_id,
    ]);
    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    // Bypass the action to isolate the listener (action path covered above).
    $result = \App\Domains\Assessments\Models\AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $user->id,
        'score' => 90,
        'passed' => true,
        'attempt_number' => 1,
    ]);

    app(IssueCertificateForPassedAssessment::class)->handle(new AssessmentPassed($result));

    expect(Certificate::query()->count())->toBe(0);
});
