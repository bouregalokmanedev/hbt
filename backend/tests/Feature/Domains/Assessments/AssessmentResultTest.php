<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\User;

it('result belongs to assessment', function () {
    $assessment = Assessment::factory()->create();

    $result = AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
    ]);

    expect($result->assessment->is($assessment))->toBeTrue();
});

it('result belongs to attempt', function () {
    $attempt = AssessmentAttempt::factory()->create();

    $result = AssessmentResult::factory()->create([
        'assessment_attempt_id' => $attempt->id,
    ]);

    expect($result->attempt->is($attempt))->toBeTrue();
});

it('result belongs to user', function () {
    $user = User::factory()->create();

    $result = AssessmentResult::factory()->create([
        'user_id' => $user->id,
    ]);

    expect($result->user->is($user))->toBeTrue();
});

it('result stores evidence as an array', function () {
    $result = AssessmentResult::factory()->create([
        'evidence' => [
            'lessons' => [
                'required' => 12,
                'completed' => 12,
            ],
            'quizzes' => [
                'minimum_score' => 70,
                'score' => 78,
            ],
            'scenarios' => [
                'required' => 2,
                'completed' => 2,
            ],
        ],
    ]);

    expect($result->evidence)
        ->toBeArray()
        ->toHaveKey('lessons')
        ->toHaveKey('quizzes')
        ->toHaveKey('scenarios');
});

it('result stores final outcome', function () {
    $result = AssessmentResult::factory()->create([
        'score' => 84,
        'passed' => true,
    ]);

    expect((float) $result->score)->toBe(84.0)
        ->and($result->passed)->toBeTrue();
});