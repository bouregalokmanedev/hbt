<?php

use App\Domains\Assessments\Actions\SubmitAssessmentAttemptAction;
use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\Course;
use App\Models\User;
use App\Models\Enrollment;


function submitAssessmentAttemptAction(): SubmitAssessmentAttemptAction
{
    return app(SubmitAssessmentAttemptAction::class);
}

it('submits and passes an assessment attempt', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    $enrollment = Enrollment::factory()->create([
    'user_id' => $user->id,
    'course_id' => $assessment->course_id,
]);
    $result = submitAssessmentAttemptAction()->execute(
        $attempt,
        $user,
        85,
        ['lessons_completed' => 10],
        ['score' => 85],
    );

    expect($result)
        ->toBeInstanceOf(AssessmentResult::class)
        ->and($result->score)->toBe('85.00')
        ->and($result->passed)->toBeTrue()
        ->and($result->attempt_number)->toBe(1);

    $attempt->refresh();

    expect($attempt->status)
        ->toBe(AssessmentAttemptStatus::PASSED)
        ->and($attempt->score)->toBe('85.00')
        ->and($attempt->passed)->toBeTrue()
        ->and($attempt->submitted_at)->not->toBeNull()
        ->and($attempt->completed_at)->not->toBeNull();

    expect(
        AssessmentResult::query()
            ->where('assessment_attempt_id', $attempt->id)
            ->count()
    )->toBe(1);
});

it('submits and fails an assessment attempt below the minimum score', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    $result = submitAssessmentAttemptAction()->execute(
        $attempt,
        $user,
        69,
    );

    expect($result->passed)->toBeFalse()
        ->and($result->score)->toBe('69.00');

    expect($attempt->refresh()->status)
        ->toBe(AssessmentAttemptStatus::FAILED);
});

it('uses the minimum score as the passing threshold', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'minimum_score' => 70,
    ]);

    $enrollment = Enrollment::factory()->create([
    'user_id' => $user->id,
    'course_id' => $assessment->course_id,
]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    $result = submitAssessmentAttemptAction()->execute(
        $attempt,
        $user,
        70,
    );

    expect($result->passed)->toBeTrue();
});

it('stores evidence and results', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    $enrollment = Enrollment::factory()->create([
    'user_id' => $user->id,
    'course_id' => $assessment->course_id,
]);

    $evidence = [
        'lessons' => [
            'required' => 10,
            'completed' => 10,
        ],
        'quizzes' => [
            'required' => 2,
            'completed' => 2,
        ],
    ];

    $results = [
        'score_breakdown' => [
            'lessons' => 20,
            'quizzes' => 30,
            'scenarios' => 50,
        ],
    ];

    $result = submitAssessmentAttemptAction()->execute(
        $attempt,
        $user,
        100,
        $evidence,
        $results,
    );

    expect($result->evidence)
        ->toBe($evidence)
        ->and($result->results)
        ->toBe($results);
});

it('does not allow another user to submit the attempt', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $owner->id,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    expect(fn () => submitAssessmentAttemptAction()->execute(
        $attempt,
        $otherUser,
        90,
    ))->toThrow(LogicException::class);

    expect(
        AssessmentResult::query()
            ->where('assessment_attempt_id', $attempt->id)
            ->count()
    )->toBe(0);
});

it('does not allow an already finalized attempt to be submitted again', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::PASSED,
        'score' => 80,
        'passed' => true,
    ]);

    expect(fn () => submitAssessmentAttemptAction()->execute(
        $attempt,
        $user,
        95,
    ))->toThrow(LogicException::class);
});