<?php

use App\Domains\Assessments\Contracts\AnswerEvaluationProvider;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\StudentAssessments\Actions\StartAssessmentAction;
use App\Domains\StudentAssessments\Actions\SubmitAssessmentAction;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

class FakeAnswerEvaluationProvider implements AnswerEvaluationProvider
{
    public static array $result = [
        'available' => true,
        'fraction' => 1.0,
        'criteria' => [],
        'feedback' => 'Well reasoned.',
    ];

    public function evaluate(string $question, string $answer, array $rubric, ?string $sampleAnswer = null): array
    {
        return self::$result;
    }
}

function longAnswerAssessment(User $user, array $overrides = []): array
{
    $course = Course::factory()->create(['status' => 'published']);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $assessment = Assessment::factory()->create(array_merge(
        ['course_id' => $course->id, 'status' => 'published', 'required_quiz_score' => 0, 'required_scenarios' => 0, 'minimum_score' => 70],
        $overrides,
    ));

    $question = QuizQuestion::factory()->create([
        'type' => QuizQuestionType::LONG_ANSWER,
        'answer_key' => [
            'rubric' => [
                ['key' => 'identification', 'description' => 'Identifies the vulnerability class.', 'points' => 5],
                ['key' => 'remediation', 'description' => 'Proposes a correct fix.', 'points' => 5],
            ],
        ],
    ]);

    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
        'position' => 1,
        'points' => 10,
    ]);

    return [$course, $assessment, $question];
}

it('grades long answers through the AI provider at submit', function () {
    app()->instance(AnswerEvaluationProvider::class, new FakeAnswerEvaluationProvider());
    FakeAnswerEvaluationProvider::$result = [
        'available' => true,
        'fraction' => 0.5,
        'criteria' => [['key' => 'identification', 'passed' => true, 'points' => 5, 'points_possible' => 5]],
        'feedback' => 'Half credit.',
    ];

    $user = User::factory()->create();
    [$course, $assessment, $question] = longAnswerAssessment($user);
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, [
        ['question_id' => $question->id, 'value' => 'It is an object-level authorization flaw...'],
    ]);

    expect($result['scoring']['score'])->toBe(50.0)
        ->and($result['scoring']['results'][0]['evaluation_status'])->toBe('ai_graded');

    $answer = \App\Domains\Assessments\Models\AssessmentAttemptAnswer::where('assessment_attempt_id', $attempt->id)->first();
    expect($answer->evaluation_status)->toBe('ai_graded')
        ->and($answer->points_earned)->toBe(5);
});

it('degrades to human review when no provider is available', function () {
    // Default binding without an API key resolves to the Null provider.
    config(['services.openai.key' => null]);

    $user = User::factory()->create();
    [$course, $assessment, $question] = longAnswerAssessment($user);
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, [
        ['question_id' => $question->id, 'value' => 'A thorough essay answer...'],
    ]);

    // Attempt still completes; the question scores 0 pending a human.
    expect($result['scoring']['score'])->toBe(0.0)
        ->and($result['scoring']['passed'])->toBeFalse();

    $answer = \App\Domains\Assessments\Models\AssessmentAttemptAnswer::where('assessment_attempt_id', $attempt->id)->first();
    expect($answer->evaluation_status)->toBe('pending_review');

    $response = \App\Domains\StudentAssessments\Models\StudentAssessmentResponse::where('attempt_id', $attempt->id)->first();
    expect($response)->toBeNull(); // submitted directly, no autosave row to backfill

    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course->update(['instructor_id' => $instructor->id]);

    $list = $this->actingAs($instructor)->getJson(
        "/api/v1/instructor/courses/{$course->id}/assessments/reviews/pending"
    );

    $list->assertOk()->assertJsonCount(1, 'data');
});

it('rejects long answers without a rubric', function () {
    app()->instance(AnswerEvaluationProvider::class, new FakeAnswerEvaluationProvider());

    $user = User::factory()->create();
    [$course, $assessment, $question] = longAnswerAssessment($user);
    $question->update(['answer_key' => null]);
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);

    expect(fn () => app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, [
        ['question_id' => $question->id, 'value' => 'Some answer'],
    ]))->toThrow(LogicException::class, 'Question is missing an answer key.');
});

it('human regrade flips the result without duplicating derived rows', function () {
    config(['services.openai.key' => null]);

    $user = User::factory()->create();
    [$course, $assessment, $question] = longAnswerAssessment($user);
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, [
        ['question_id' => $question->id, 'value' => 'An essay...'],
    ]);
    expect($result['scoring']['passed'])->toBeFalse();

    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course->update(['instructor_id' => $instructor->id]);

    $regrade = $this->actingAs($instructor)->postJson(
        "/api/v1/instructor/courses/{$course->id}/assessments/attempts/{$attempt->id}/regrade",
        ['grades' => [$question->id => ['points_earned' => 10, 'feedback' => 'Excellent analysis.']]],
    );

    $regrade->assertOk()
        ->assertJsonPath('data.score', 100)
        ->assertJsonPath('data.passed', true);

    $studentResult = \App\Domains\StudentAssessments\Models\StudentAssessmentResult::where('attempt_id', $attempt->id)->first();
    expect($studentResult->passed)->toBeTrue();

    // Derived rows rebuilt exactly once.
    expect(
        \App\Domains\StudentAssessments\Models\StudentAssessmentEvidence::where('attempt_id', $attempt->id)->count()
    )->toBe(1);
    expect(
        \App\Domains\StudentAssessments\Models\StudentCompetencyResult::where('attempt_id', $attempt->id)->count()
    )->toBe(1);

    $answer = \App\Domains\Assessments\Models\AssessmentAttemptAnswer::where('assessment_attempt_id', $attempt->id)->first();
    expect($answer->evaluation_status)->toBe('human_graded')
        ->and($answer->feedback)->toBe('Excellent analysis.');

    // Review queue drains.
    $this->actingAs($instructor)->getJson(
        "/api/v1/instructor/courses/{$course->id}/assessments/reviews/pending"
    )->assertOk()->assertJsonCount(0, 'data');
});

it('denies regrade to other instructors', function () {
    config(['services.openai.key' => null]);

    $user = User::factory()->create();
    [$course, $assessment, $question] = longAnswerAssessment($user);
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);
    app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user, [
        ['question_id' => $question->id, 'value' => 'An essay...'],
    ]);

    $other = User::factory()->create();
    $other->assignRole('Instructor');

    $this->actingAs($other)->postJson(
        "/api/v1/instructor/courses/{$course->id}/assessments/attempts/{$attempt->id}/regrade",
        ['grades' => [$question->id => ['points_earned' => 10]]],
    )->assertForbidden();
});
