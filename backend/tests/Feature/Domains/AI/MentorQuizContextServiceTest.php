<?php

use App\Domains\AI\Services\MentorQuizContextService;
use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Quizzes\Models\QuizAttemptAnswer;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function mentorQuizContextService(): MentorQuizContextService
{
    return app(MentorQuizContextService::class);
}

it('returns empty context when the student has no submitted attempts', function () {
    $user = User::factory()->create();

    $result = mentorQuizContextService()->build(
        $user
    );

    expect($result)->toBe([]);
});

it('builds context from the latest submitted attempt', function () {
    $user = User::factory()->create();

    $section = Section::factory()->create();

    $quiz = Quiz::factory()->create([
        'section_id' => $section->id,
        'title' => 'Engine Diagnostic Quiz',
    ]);

    $attempt = QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'status' => QuizAttemptStatus::SUBMITTED,
        'score' => 30,
        'total_points' => 50,
        'percentage' => 60,
        'passed' => false,
        'submitted_at' => now(),
    ]);

    $result = mentorQuizContextService()->build(
        $user
    );

    expect($result['attempt_count'])
        ->toBe(1);

    expect($result['latest']['quiz_id'])
        ->toBe($quiz->id);

    expect($result['latest']['quiz_title'])
        ->toBe('Engine Diagnostic Quiz');

    expect($result['latest']['percentage'])
        ->toBe(60);

    expect($result['latest']['passed'])
        ->toBeFalse();
});

it('calculates question performance', function () {
    $user = User::factory()->create();

    $section = Section::factory()->create();

    $quiz = Quiz::factory()->create([
        'section_id' => $section->id,
    ]);

    $attempt = QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'status' => QuizAttemptStatus::SUBMITTED,
    ]);

    $correctQuestion = QuizQuestion::factory()->create([
        'quiz_id' => $quiz->id,
        'position' => 1,
    ]);

    $wrongQuestion = QuizQuestion::factory()->create([
        'quiz_id' => $quiz->id,
        'position' => 2,
    ]);

    QuizAttemptAnswer::factory()->create([
        'attempt_id' => $attempt->id,
        'question_id' => $correctQuestion->id,
        'is_correct' => true,
        'points_earned' => 5,
    ]);

    QuizAttemptAnswer::factory()->create([
        'attempt_id' => $attempt->id,
        'question_id' => $wrongQuestion->id,
        'is_correct' => false,
        'points_earned' => 0,
    ]);

    $result = mentorQuizContextService()->build(
        $user
    );

    expect($result['question_performance'])
        ->toMatchArray([
            'total' => 2,
            'correct' => 1,
            'incorrect' => 1,
            'accuracy' => 50,
        ]);
});

it('includes weak questions from the latest attempt', function () {
    $user = User::factory()->create();

    $section = Section::factory()->create();

    $quiz = Quiz::factory()->create([
        'section_id' => $section->id,
    ]);

    $attempt = QuizAttempt::factory()->create([
        'quiz_id' => $quiz->id,
        'user_id' => $user->id,
        'status' => QuizAttemptStatus::SUBMITTED,
    ]);

    $question = QuizQuestion::factory()->create([
        'quiz_id' => $quiz->id,
        'question' => 'What causes positive fuel trim?',
        'points' => 5,
    ]);

    QuizAttemptAnswer::factory()->create([
        'attempt_id' => $attempt->id,
        'question_id' => $question->id,
        'is_correct' => false,
        'points_earned' => 0,
    ]);

    $result = mentorQuizContextService()->build(
        $user
    );

    expect($result['weak_questions'])
        ->toHaveCount(1);

    expect($result['weak_questions'][0])
        ->toMatchArray([
            'question_id' => $question->id,
            'question' => 'What causes positive fuel trim?',
            'points' => 5,
        ]);
});