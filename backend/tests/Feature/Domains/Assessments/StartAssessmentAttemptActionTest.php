<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Exceptions\AssessmentMaxAttemptsExceededException;
use App\Domains\Assessments\Exceptions\AssessmentNotEligibleException;
use App\Domains\Assessments\Actions\StartAssessmentAttemptAction;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Models\User;

function startAssessmentAttemptAction(): StartAssessmentAttemptAction
{
    return app(StartAssessmentAttemptAction::class);
}

it('starts an eligible assessment attempt', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    $attempt = startAssessmentAttemptAction()->execute(
        $assessment,
        $user,
    );

    expect($attempt)
        ->toBeInstanceOf(AssessmentAttempt::class)
        ->assessment_id->toBe($assessment->id)
        ->user_id->toBe($user->id)
        ->attempt_number->toBe(1)
        ->status->toBe(AssessmentAttemptStatus::IN_PROGRESS)
        ->passed->toBeFalse()
        ->started_at->not->toBeNull()
        ->submitted_at->toBeNull()
        ->completed_at->toBeNull();
});

it('increments the attempt number for the user', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
    ]);

    $attempt = startAssessmentAttemptAction()->execute(
        $assessment,
        $user,
    );

    expect($attempt->attempt_number)->toBe(2);
});

it('does not allow an ineligible user to start', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'status' => 'draft',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    expect(fn () => startAssessmentAttemptAction()->execute(
        $assessment,
        $user,
    ))->toThrow(AssessmentNotEligibleException::class);

    expect(
        AssessmentAttempt::query()
            ->where('assessment_id', $assessment->id)
            ->where('user_id', $user->id)
            ->count()
    )->toBe(0);
});

it('does not duplicate an attempt when eligibility fails', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'status' => 'draft',
    ]);

    expect(fn () => startAssessmentAttemptAction()->execute(
        $assessment,
        $user,
    ))->toThrow(AssessmentNotEligibleException::class);

    expect(
        $assessment->attempts()
            ->where('user_id', $user->id)
            ->count()
    )->toBe(0);
});
it('allows attempts until max attempts is reached', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
        'max_attempts' => 2,
    ]);

    $first = startAssessmentAttemptAction()->execute(
        $assessment,
        $user,
    );

    $second = startAssessmentAttemptAction()->execute(
        $assessment,
        $user,
    );

    expect($first->attempt_number)->toBe(1);
    expect($second->attempt_number)->toBe(2);
});

it('rejects an attempt when max attempts is reached', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
        'max_attempts' => 2,
    ]);

    AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 2,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    expect(
        $assessment->attempts()
            ->where('user_id', $user->id)
            ->count()
    )->toBe(2);

    expect(
        $assessment->max_attempts
    )->toBe(2);

    expect(fn () => startAssessmentAttemptAction()->execute(
        $assessment,
        $user,
    ))->toThrow(AssessmentMaxAttemptsExceededException::class);

    expect(
        $assessment->attempts()
            ->where('user_id', $user->id)
            ->count()
    )->toBe(2);
});

it('allows unlimited attempts when max attempts is null', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
        'max_attempts' => null,
    ]);

    foreach (range(1, 5) as $attemptNumber) {
    AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => $attemptNumber,
    ]);
}

   $attempt = startAssessmentAttemptAction()->execute(
    $assessment,
    $user,
);

expect($attempt->attempt_number)->toBe(6);
});