<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Assessments\Services\AssessmentScoringService;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Models\User;

it('calculates an assessment score from assessment questions', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    $question = QuizQuestion::factory()->create();

    $correctOption = QuizQuestionOption::factory()->create([
    'quiz_question_id' => $question->id,
    'is_correct' => true,
    'position' => 1,
]);

QuizQuestionOption::factory()->create([
    'quiz_question_id' => $question->id,
    'is_correct' => false,
    'position' => 2,
]);

    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
        'position' => 1,
        'points' => 10,
    ]);

    $scoring = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [
            [
                'question_id' => $question->id,
                'option_ids' => [
                    $correctOption->id,
                ],
            ],
        ],
    );

    expect($scoring['score'])->toBe(100.0)
        ->and($scoring['passed'])->toBeTrue()
        ->and($scoring['points_earned'])->toBe(10)
        ->and($scoring['total_points'])->toBe(10);
});
it('awards zero points for an incorrect answer', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    $question = QuizQuestion::factory()->create();

    QuizQuestionOption::factory()->create([
    'quiz_question_id' => $question->id,
    'is_correct' => true,
    'position' => 1,
]);

$wrongOption = QuizQuestionOption::factory()->create([
    'quiz_question_id' => $question->id,
    'is_correct' => false,
    'position' => 2,
]);

    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
        'position' => 1,
        'points' => 10,
    ]);

    $scoring = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [
            [
                'question_id' => $question->id,
                'option_ids' => [
                    $wrongOption->id,
                ],
            ],
        ],
    );

    expect($scoring['score'])->toBe(0.0)
        ->and($scoring['passed'])->toBeFalse()
        ->and($scoring['points_earned'])->toBe(0)
        ->and($scoring['total_points'])->toBe(10);
});
it('calculates percentage using assessment question points', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    $questionOne = QuizQuestion::factory()->create();
    $questionTwo = QuizQuestion::factory()->create();

    // Question 1 — worth 20 points
    $correctOne = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $questionOne->id,
        'is_correct' => true,
        'position' => 1,
    ]);

    QuizQuestionOption::factory()->create([
        'quiz_question_id' => $questionOne->id,
        'is_correct' => false,
        'position' => 2,
    ]);

    // Question 2 — worth 80 points
    QuizQuestionOption::factory()->create([
        'quiz_question_id' => $questionTwo->id,
        'is_correct' => true,
        'position' => 1,
    ]);

    $wrongTwo = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $questionTwo->id,
        'is_correct' => false,
        'position' => 2,
    ]);

    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $questionOne->id,
        'position' => 1,
        'points' => 20,
    ]);

    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $questionTwo->id,
        'position' => 2,
        'points' => 80,
    ]);

    $scoring = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [
            [
                'question_id' => $questionOne->id,
                'option_ids' => [$correctOne->id],
            ],
            [
                'question_id' => $questionTwo->id,
                'option_ids' => [$wrongTwo->id],
            ],
        ],
    );

    expect($scoring['points_earned'])->toBe(20)
        ->and($scoring['total_points'])->toBe(100)
        ->and($scoring['score'])->toBe(20.0)
        ->and($scoring['passed'])->toBeFalse();
});

it('stores assessment attempt answers and selected options', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create([
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    $question = QuizQuestion::factory()->create();

    $correctOption = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
        'is_correct' => true,
    ]);

    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
        'position' => 1,
        'points' => 10,
    ]);

    app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [
            [
                'question_id' => $question->id,
                'option_ids' => [$correctOption->id],
            ],
        ],
    );

    $answer = $attempt->answers()
        ->where('question_id', $question->id)
        ->first();

    expect($answer)->not->toBeNull()
        ->and($answer->is_correct)->toBeTrue()
        ->and($answer->points_earned)->toBe(10);

    expect(
        $answer->selectedOptions()
            ->where('option_id', $correctOption->id)
            ->exists()
    )->toBeTrue();
});
it('rejects a question that is not assigned to the assessment', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create();

    $otherAssessment = Assessment::factory()->create();

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    $question = QuizQuestion::factory()->create();

    AssessmentQuestion::factory()->create([
        'assessment_id' => $otherAssessment->id,
        'quiz_question_id' => $question->id,
        'position' => 1,
        'points' => 10,
    ]);

    expect(fn () => app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [
            [
                'question_id' => $question->id,
                'option_ids' => [],
            ],
        ],
    ))->toThrow(
        LogicException::class,
        'Submitted question does not belong to this assessment.'
    );
});