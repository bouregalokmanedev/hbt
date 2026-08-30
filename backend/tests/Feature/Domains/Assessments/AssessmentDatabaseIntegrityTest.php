<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\User;

it('deleting an assessment deletes its attempts', function () {
    $assessment = Assessment::factory()->create();

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
    ]);

    $attemptId = $attempt->id;

    $assessment->delete();

    expect(
        AssessmentAttempt::query()->find($attemptId)
    )->toBeNull();
});

it('deleting an assessment deletes its results', function () {
    $assessment = Assessment::factory()->create();

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
    ]);

    $result = AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $attempt->user_id,
    ]);

    $resultId = $result->id;

    $assessment->delete();

    expect(
        AssessmentResult::query()->find($resultId)
    )->toBeNull();
});
it('allows only one result for an attempt', function () {
    $assessment = Assessment::factory()->create();

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
    ]);

    AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $attempt->user_id,
    ]);

    expect(fn () =>
        AssessmentResult::factory()->create([
            'assessment_id' => $assessment->id,
            'assessment_attempt_id' => $attempt->id,
            'user_id' => $attempt->user_id,
        ])
    )->toThrow(\Illuminate\Database\QueryException::class);
});