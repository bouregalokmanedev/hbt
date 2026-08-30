<?php

use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentAttemptAnswer;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;

it('belongs to an assessment attempt', function () {
    $answer = AssessmentAttemptAnswer::factory()->create();

    expect($answer->attempt)
        ->toBeInstanceOf(AssessmentAttempt::class);
});

it('belongs to a quiz question', function () {
    $answer = AssessmentAttemptAnswer::factory()->create();

    expect($answer->question)
        ->toBeInstanceOf(QuizQuestion::class);
});

it('has selected options', function () {
    $answer = AssessmentAttemptAnswer::factory()->create();

    $option = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $answer->question_id,
    ]);

    $answer->selectedOptions()->create([
        'option_id' => $option->id,
    ]);

    expect($answer->refresh()->selectedOptions)
        ->toHaveCount(1);
});

it('casts correctness and points correctly', function () {
    $answer = AssessmentAttemptAnswer::factory()->create([
        'is_correct' => true,
        'points_earned' => 5,
    ]);

    expect($answer->is_correct)
        ->toBeTrue()
        ->and($answer->points_earned)
        ->toBe(5);
});