<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Assessments\Services\AssessmentScoringService;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\StudentAssessments\DTOs\SaveResponseData;
use App\Domains\StudentAssessments\Services\ResponseService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function extendedScoringSetup(float $minimumScore = 70): array
{
    $user = User::factory()->create();
    $assessment = Assessment::factory()->create(['minimum_score' => $minimumScore]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    return [$user, $assessment, $attempt];
}

function attachQuestion(Assessment $assessment, QuizQuestion $question, int $position, int $points = 10): void
{
    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
        'position' => $position,
        'points' => $points,
    ]);
}

it('scores short answers case-insensitively', function () {
    [$user, $assessment, $attempt] = extendedScoringSetup();

    $question = QuizQuestion::factory()->create([
        'type' => QuizQuestionType::SHORT_ANSWER,
        'answer_key' => ['accepted' => ['Object-level authorization'], 'case_sensitive' => false],
    ]);
    attachQuestion($assessment, $question, 1);

    $scoring = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [
            ['question_id' => $question->id, 'value' => '  object-level AUTHORIZATION '],
        ],
    );

    expect($scoring['score'])->toBe(100.0)
        ->and($scoring['passed'])->toBeTrue()
        ->and($scoring['results'][0]['is_correct'])->toBeTrue()
        ->and($scoring['results'][0]['type'])->toBe('short_answer');
});

it('rejects wrong short answers', function () {
    [$user, $assessment, $attempt] = extendedScoringSetup();

    $question = QuizQuestion::factory()->create([
        'type' => QuizQuestionType::SHORT_ANSWER,
        'answer_key' => ['accepted' => ['OAuth2']],
    ]);
    attachQuestion($assessment, $question, 1);

    $scoring = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [['question_id' => $question->id, 'value' => 'SAML']],
    );

    expect($scoring['score'])->toBe(0.0)
        ->and($scoring['results'][0]['is_correct'])->toBeFalse();
});

it('scores numeric answers within tolerance', function () {
    [$user, $assessment, $attempt] = extendedScoringSetup();

    $question = QuizQuestion::factory()->create([
        'type' => QuizQuestionType::NUMERIC,
        'answer_key' => ['value' => 72, 'tolerance' => 0.5],
    ]);
    attachQuestion($assessment, $question, 1);

    $ok = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [['question_id' => $question->id, 'value' => 72.4]],
    );
    expect($ok['score'])->toBe(100.0);

    $attempt2 = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 2,
    ]);

    $bad = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt2,
        user: $user,
        submittedAnswers: [['question_id' => $question->id, 'value' => 73]],
    );
    expect($bad['score'])->toBe(0.0);
});

it('awards partial credit for ordering by position fraction', function () {
    [$user, $assessment, $attempt] = extendedScoringSetup();

    $question = QuizQuestion::factory()->create(['type' => QuizQuestionType::ORDERING]);
    $opts = collect(range(1, 4))->map(fn ($p) => QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
        'is_correct' => false,
        'position' => $p,
    ]));
    $question->update(['answer_key' => ['ordered_option_ids' => $opts->pluck('id')->all()]]);
    attachQuestion($assessment, $question, 1, 100);

    // Swap last two: 2/4 positions correct → 50 points
    $swapped = [$opts[0]->id, $opts[1]->id, $opts[3]->id, $opts[2]->id];

    $scoring = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [['question_id' => $question->id, 'ordered_ids' => $swapped]],
    );

    expect($scoring['points_earned'])->toBe(50)
        ->and($scoring['results'][0]['fraction'])->toBe(0.5)
        ->and($scoring['results'][0]['is_correct'])->toBeFalse();
});

it('awards partial credit for matching by pair fraction', function () {
    [$user, $assessment, $attempt] = extendedScoringSetup();

    $question = QuizQuestion::factory()->create([
        'type' => QuizQuestionType::MATCHING,
        'answer_key' => ['pairs' => ['401' => 'Unauthorized', '403' => 'Forbidden']],
    ]);
    attachQuestion($assessment, $question, 1, 100);

    $scoring = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [['question_id' => $question->id, 'matches' => ['401' => 'Unauthorized', '403' => 'Wrong']]],
    );

    expect($scoring['points_earned'])->toBe(50)
        ->and($scoring['results'][0]['fraction'])->toBe(0.5);
});

it('classifies confidence per spec section 8', function () {
    [$user, $assessment, $attempt] = extendedScoringSetup(0);

    $q1 = QuizQuestion::factory()->create(['type' => QuizQuestionType::SHORT_ANSWER, 'answer_key' => ['accepted' => ['yes']]]);
    $q2 = QuizQuestion::factory()->create(['type' => QuizQuestionType::SHORT_ANSWER, 'answer_key' => ['accepted' => ['yes']]]);
    attachQuestion($assessment, $q1, 1);
    attachQuestion($assessment, $q2, 2);

    $scoring = app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [
            ['question_id' => $q1->id, 'value' => 'yes', 'confidence_level' => 'very_confident'],
            ['question_id' => $q2->id, 'value' => 'no', 'confidence_level' => 'very_confident'],
        ],
    );

    expect($scoring['results'][0]['confidence_tag'])->toBe('strong_knowledge')
        ->and($scoring['results'][1]['confidence_tag'])->toBe('misconception')
        ->and($scoring['confidence_score'])->toBeNumeric();
});

it('uses autosaved confidence when submitting without payload', function () {
    [$user, $assessment, $attempt] = extendedScoringSetup(0);
    \App\Models\Enrollment::factory()->create(['user_id' => $user->id, 'course_id' => $assessment->course_id]);

    $question = QuizQuestion::factory()->create(['type' => QuizQuestionType::SHORT_ANSWER, 'answer_key' => ['accepted' => ['yes']]]);
    attachQuestion($assessment, $question, 1);

    app(ResponseService::class)->save(new SaveResponseData(
        attemptId: $attempt->id,
        questionId: $question->id,
        answer: ['value' => 'yes'],
        confidenceLevel: 'guessing',
    ), $user);

    $result = app(\App\Domains\StudentAssessments\Actions\SubmitAssessmentAction::class)
        ->execute($attempt->fresh(), $user);

    expect($result['scoring']['results'][0]['confidence_tag'])->toBe('fragile_knowledge')
        ->and($result['student_result']->confidence_score)->not->toBeNull();
});

it('backfills autosaved responses with evaluation outcomes on submit', function () {
    [$user, $assessment, $attempt] = extendedScoringSetup(0);
    \App\Models\Enrollment::factory()->create(['user_id' => $user->id, 'course_id' => $assessment->course_id]);

    $question = QuizQuestion::factory()->create(['type' => QuizQuestionType::SHORT_ANSWER, 'answer_key' => ['accepted' => ['yes']]]);
    attachQuestion($assessment, $question, 1);

    app(ResponseService::class)->save(new SaveResponseData(
        attemptId: $attempt->id,
        questionId: $question->id,
        answer: ['value' => 'yes'],
        confidenceLevel: 'confident',
    ), $user);

    app(\App\Domains\StudentAssessments\Actions\SubmitAssessmentAction::class)
        ->execute($attempt->fresh(), $user);

    $response = \App\Domains\StudentAssessments\Models\StudentAssessmentResponse::where('attempt_id', $attempt->id)
        ->where('question_id', $question->id)
        ->first();

    expect($response->is_correct)->toBeTrue()
        ->and($response->evaluation_status)->toBe('evaluated')
        ->and($response->feedback)->not->toBeNull();
});

it('rejects questions without an answer key for key-based types', function () {
    [$user, $assessment, $attempt] = extendedScoringSetup();

    $question = QuizQuestion::factory()->create(['type' => QuizQuestionType::NUMERIC]);
    attachQuestion($assessment, $question, 1);

    expect(fn () => app(AssessmentScoringService::class)->calculate(
        attempt: $attempt,
        user: $user,
        submittedAnswers: [['question_id' => $question->id, 'value' => 5]],
    ))->toThrow(LogicException::class, 'Question is missing an answer key.');
});
