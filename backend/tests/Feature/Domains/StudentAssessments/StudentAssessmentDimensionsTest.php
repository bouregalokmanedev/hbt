<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\StudentAssessments\Actions\SubmitAssessmentAction;
use App\Domains\StudentAssessments\Services\DimensionScoringService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function dimensionAssessment(User $user, float $minimumScore = 0): array
{
    $assessment = Assessment::factory()->create(['minimum_score' => $minimumScore]);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $assessment->course_id,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
    ]);

    return [$assessment, $attempt];
}

function attachDimensionQuestion(Assessment $assessment, QuizQuestion $question, int $position, int $points = 10): void
{
    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
        'position' => $position,
        'points' => $points,
    ]);
}

it('maps question types to dimensions', function () {
    $service = app(DimensionScoringService::class);

    expect($service->dimensionFor('single_choice'))->toBe('knowledge')
        ->and($service->dimensionFor('short_answer'))->toBe('knowledge')
        ->and($service->dimensionFor('numeric'))->toBe('application')
        ->and($service->dimensionFor('ordering'))->toBe('problem_solving')
        ->and($service->dimensionFor('matching'))->toBe('problem_solving')
        ->and($service->dimensionFor('unknown'))->toBeNull()
        ->and($service->dimensionFor(null))->toBeNull();
});

it('computes per-dimension scores weighted by points', function () {
    $user = User::factory()->create();
    [$assessment, $attempt] = dimensionAssessment($user);

    $knowledge = QuizQuestion::factory()->create([
        'type' => QuizQuestionType::SHORT_ANSWER,
        'answer_key' => ['accepted' => ['yes']],
    ]);
    $application = QuizQuestion::factory()->create([
        'type' => QuizQuestionType::NUMERIC,
        'answer_key' => ['value' => 5, 'tolerance' => 0],
    ]);
    $problemSolving = QuizQuestion::factory()->create(['type' => QuizQuestionType::ORDERING]);
    $opts = collect(range(1, 4))->map(fn ($p) => QuizQuestionOption::factory()->create([
        'quiz_question_id' => $problemSolving->id,
        'is_correct' => false,
        'position' => $p,
    ]));
    $problemSolving->update(['answer_key' => ['ordered_option_ids' => $opts->pluck('id')->all()]]);

    attachDimensionQuestion($assessment, $knowledge, 1);
    attachDimensionQuestion($assessment, $application, 2);
    attachDimensionQuestion($assessment, $problemSolving, 3);

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, [
        ['question_id' => $knowledge->id, 'value' => 'yes'],
        ['question_id' => $application->id, 'value' => 999],
        ['question_id' => $problemSolving->id, 'ordered_ids' => [$opts[0]->id, $opts[1]->id, $opts[3]->id, $opts[2]->id]],
    ]);

    $studentResult = $result['student_result'];

    expect($studentResult->knowledge_score)->toBe('100.00')
        ->and($studentResult->application_score)->toBe('0.00')
        ->and($studentResult->problem_solving_score)->toBe('50.00');
});

it('leaves dimensions without questions as null', function () {
    $user = User::factory()->create();
    [$assessment, $attempt] = dimensionAssessment($user);

    $question = QuizQuestion::factory()->create();
    $correct = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
        'is_correct' => true,
        'position' => 1,
    ]);
    QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
        'is_correct' => false,
        'position' => 2,
    ]);
    attachDimensionQuestion($assessment, $question, 1);

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, [
        ['question_id' => $question->id, 'option_ids' => [$correct->id]],
    ]);

    $studentResult = $result['student_result'];

    expect($studentResult->knowledge_score)->toBe('100.00')
        ->and($studentResult->application_score)->toBeNull()
        ->and($studentResult->problem_solving_score)->toBeNull();
});

it('computes time efficiency from the attempt window', function () {
    $user = User::factory()->create();
    $assessment = Assessment::factory()->create(['minimum_score' => 100]);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $assessment->course_id,
    ]);

    $started = now()->subMinutes(10);
    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'started_at' => $started,
        'expires_at' => $started->copy()->addMinutes(30),
    ]);

    $question = QuizQuestion::factory()->create();
    $correct = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
        'is_correct' => true,
        'position' => 1,
    ]);
    attachDimensionQuestion($assessment, $question, 1);

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, [
        ['question_id' => $question->id, 'option_ids' => [$correct->id]],
    ]);

    // ~10 of 30 minutes used → ~66.67% of the window left
    $efficiency = (float) $result['student_result']->time_efficiency_score;

    expect($efficiency)->toBeGreaterThan(60)->toBeLessThan(72);
});

it('leaves time efficiency null without an attempt window', function () {
    $user = User::factory()->create();
    [$assessment, $attempt] = dimensionAssessment($user);
    $attempt->update(['expires_at' => null]);

    $question = QuizQuestion::factory()->create();
    $correct = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $question->id,
        'is_correct' => true,
        'position' => 1,
    ]);
    attachDimensionQuestion($assessment, $question, 1);

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, [
        ['question_id' => $question->id, 'option_ids' => [$correct->id]],
    ]);

    expect($result['student_result']->time_efficiency_score)->toBeNull();
});
