<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Quizzes\Models\Quiz;

it('assessment can have multiple quizzes', function () {
    $assessment = Assessment::factory()->create();

    $quizOne = Quiz::factory()->create();
    $quizTwo = Quiz::factory()->create();

    $assessment->quizzes()->attach($quizOne->id, [
        'position' => 1,
        'is_required' => true,
    ]);

    $assessment->quizzes()->attach($quizTwo->id, [
        'position' => 2,
        'is_required' => true,
    ]);

    expect($assessment->fresh()->quizzes)
        ->toHaveCount(2);
});

it('assessment quizzes are ordered by position', function () {
    $assessment = Assessment::factory()->create();

    $quizOne = Quiz::factory()->create();
    $quizTwo = Quiz::factory()->create();

    $assessment->quizzes()->attach($quizTwo->id, [
        'position' => 2,
    ]);

    $assessment->quizzes()->attach($quizOne->id, [
        'position' => 1,
    ]);

    $quizzes = $assessment->fresh()->quizzes;

    expect($quizzes[0]->is($quizOne))->toBeTrue()
        ->and($quizzes[1]->is($quizTwo))->toBeTrue();
});

it('assessment quiz position is unique', function () {
    $assessment = Assessment::factory()->create();

    $quizOne = Quiz::factory()->create();
    $quizTwo = Quiz::factory()->create();

    $assessment->quizzes()->attach($quizOne->id, [
        'position' => 1,
    ]);

    expect(fn () =>
        $assessment->quizzes()->attach($quizTwo->id, [
            'position' => 1,
        ])
    )->toThrow(\Illuminate\Database\QueryException::class);
});

it('deleting assessment deletes its quiz assignments', function () {
    $assessment = Assessment::factory()->create();

    $quiz = Quiz::factory()->create();

    $assessment->quizzes()->attach($quiz->id, [
        'position' => 1,
    ]);

    $assessment->delete();

    expect(
        \Illuminate\Support\Facades\DB::table('assessment_quizzes')
            ->where('assessment_id', $assessment->id)
            ->exists()
    )->toBeFalse();
});

it('deleting quiz deletes its assessment assignments', function () {
    $assessment = Assessment::factory()->create();

    $quiz = Quiz::factory()->create();

    $assessment->quizzes()->attach($quiz->id, [
        'position' => 1,
    ]);

    $quiz->delete();

    expect(
        \Illuminate\Support\Facades\DB::table('assessment_quizzes')
            ->where('quiz_id', $quiz->id)
            ->exists()
    )->toBeFalse();
});