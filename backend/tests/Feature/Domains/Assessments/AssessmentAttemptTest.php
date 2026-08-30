<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Models\User;

it('attempt belongs to assessment', function () {
    $assessment = Assessment::factory()->create();

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
    ]);

    expect($attempt->assessment->is($assessment))->toBeTrue();
});

it('attempt belongs to user', function () {
    $user = User::factory()->create();

    $attempt = AssessmentAttempt::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($attempt->user->is($user))->toBeTrue();
});

it('attempt has a result relationship', function () {
    $attempt = AssessmentAttempt::factory()->create();

    expect($attempt->result)->toBeNull();
});

it('attempt status is cast to enum', function () {
    $attempt = AssessmentAttempt::factory()->create();

    expect($attempt->status)
        ->toBeInstanceOf(AssessmentAttemptStatus::class);
});

it('attempt can store score and passed state', function () {
    $attempt = AssessmentAttempt::factory()->create([
        'score' => 84,
        'passed' => true,
    ]);

    expect((float) $attempt->score)->toBe(84.0)
        ->and($attempt->passed)->toBeTrue();
});