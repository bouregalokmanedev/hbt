<?php

use App\Domains\Assessments\Models\AssessmentAttemptAnswer;
use App\Domains\Assessments\Models\AssessmentAttemptAnswerOption;
use App\Domains\Quizzes\Models\QuizQuestionOption;

it('belongs to an assessment attempt answer', function () {
    $answerOption = AssessmentAttemptAnswerOption::factory()->create();

    expect($answerOption->answer)
        ->toBeInstanceOf(AssessmentAttemptAnswer::class);
});

it('belongs to a quiz question option', function () {
    $answerOption = AssessmentAttemptAnswerOption::factory()->create();

    expect($answerOption->option)
        ->toBeInstanceOf(QuizQuestionOption::class);
});