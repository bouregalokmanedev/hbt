<?php

use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\StudentAssessments\Actions\StartAssessmentAction;
use App\Domains\StudentAssessments\Actions\SubmitAssessmentAction;
use App\Domains\StudentAssessments\DTOs\SaveResponseData;
use App\Domains\StudentAssessments\Services\ResponseService;
use App\Models\Course;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    Role::findOrCreate('Instructor', 'web');
});

function adaptiveBank(User $user, array $difficulties = [-1.5, 0.0, 1.5], array $config = []): array
{
    $course = Course::factory()->create(['status' => 'published']);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $assessment = Assessment::factory()->create(array_merge(
        [
            'course_id' => $course->id,
            'status' => 'published',
            'required_quiz_score' => 0,
            'required_scenarios' => 0,
            'minimum_score' => 70,
            'interaction_types' => ['knowledge', 'adaptive'],
            'adaptive_config' => ['min_questions' => 1, 'max_questions' => 5, 'target_se' => 0.3],
        ],
        $config,
    ));

    $questions = [];
    foreach ($difficulties as $i => $b) {
        $question = QuizQuestion::factory()->create([
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'position' => $i + 1,
            'irt_a' => 1.0,
            'irt_b' => $b,
            'irt_c' => 0.2,
            'is_calibrated' => true,
        ]);

        QuizQuestionOption::factory()->create([
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
            'position' => $i + 1,
            'points' => 10,
        ]);

        $questions[] = $question;
    }

    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);

    return [$assessment->fresh(), $attempt, $questions];
}

function answerOption(User $user, AssessmentAttempt $attempt, QuizQuestion $question, bool $correct): void
{
    $optionId = $question->options()->where('is_correct', $correct)->first()->id;

    app(ResponseService::class)->save(new SaveResponseData(
        attemptId: $attempt->id,
        questionId: $question->id,
        answer: ['selected_option_ids' => [$optionId]],
    ), $user);
}

it('serves maximum-information questions and adapts to ability', function () {
    $user = User::factory()->create();
    [$assessment, $attempt, $questions] = adaptiveBank($user);
    [$easy, $medium, $hard] = $questions;

    // θ=0 → most informative is the medium (b=0) question.
    $first = $this->actingAs($user)->getJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/adaptive/next"
    );

    $first->assertOk()
        ->assertJsonPath('data.complete', false)
        ->assertJsonPath('data.question.id', $medium->id)
        ->assertJsonPath('data.answered_count', 0);

    // Correct medium answer raises θ → next should be the hard question.
    answerOption($user, $attempt, $medium, true);

    $second = $this->actingAs($user)->getJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/adaptive/next"
    );

    $second->assertOk()
        ->assertJsonPath('data.complete', false)
        ->assertJsonPath('data.question.id', $hard->id)
        ->assertJsonPath('data.answered_count', 1);
});

it('never leaks answer keys, IRT parameters or correctness flags', function () {
    $user = User::factory()->create();
    [$assessment, $attempt, $questions] = adaptiveBank($user);

    $response = $this->actingAs($user)->getJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/adaptive/next"
    );

    $body = json_encode($response->json('data.question'));

    expect($body)->not->toContain('answer_key')
        ->and($body)->not->toContain('irt_a')
        ->and($body)->not->toContain('irt_b')
        ->and($body)->not->toContain('is_correct');
});

it('stops at max questions', function () {
    $user = User::factory()->create();
    [$assessment, $attempt, $questions] = adaptiveBank(
        $user,
        [-1.5, 0.0, 1.5],
        ['adaptive_config' => ['min_questions' => 1, 'max_questions' => 2, 'target_se' => 0.01]],
    );

    answerOption($user, $attempt, $questions[1], true);
    answerOption($user, $attempt, $questions[2], false);

    $response = $this->actingAs($user)->getJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/adaptive/next"
    );

    $response->assertOk()
        ->assertJsonPath('data.complete', true)
        ->assertJsonPath('data.question', null)
        ->assertJsonPath('data.stop_reason', 'max_questions');
});

it('rejects adaptive next on non-adaptive assessments', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published']);
    \App\Models\Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);
    $attempt = app(StartAssessmentAction::class)->execute($assessment, $user);

    $this->actingAs($user)->getJson(
        "/api/v1/student/assessment-attempts/{$attempt->id}/adaptive/next"
    )->assertStatus(500);
});

it('scores adaptive submit by ability estimate over answered questions only', function () {
    $user = User::factory()->create();
    // Bank of 5, answer 2 correctly: standard whole-bank math would be 40%.
    [$assessment, $attempt, $questions] = adaptiveBank($user, [-2.0, -1.0, 0.0, 1.0, 2.0]);

    answerOption($user, $attempt, $questions[0], true);
    answerOption($user, $attempt, $questions[1], true);

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user);

    expect($result['scoring']['adaptive'] ?? false)->toBeTrue()
        ->and($result['scoring']['total_points'])->toBe(20)
        ->and($result['scoring']['score'])->toBeGreaterThan(40)
        ->and($result['student_result']->id)->not->toBeNull();
});

it('falls back to standard scoring without calibrated answers', function () {
    $user = User::factory()->create();
    [$assessment, $attempt, $questions] = adaptiveBank($user);

    foreach ($questions as $question) {
        $question->update(['is_calibrated' => false]);
    }

    answerOption($user, $attempt, $questions[0], true);

    $result = app(SubmitAssessmentAction::class)->execute($attempt->fresh(), $user);

    expect($result['scoring']['adaptive'] ?? false)->toBeFalse()
        ->and($result['scoring']['score'])->toBe(33.33);
});

it('requires calibrated questions to publish adaptive assessments', function () {
    $instructor = User::factory()->create();
    $instructor->assignRole('Instructor');
    $course = Course::factory()->create(['instructor_id' => $instructor->id]);

    $assessment = app(\App\Domains\Instructor\Actions\Assessments\CreateAssessmentAction::class)->execute(
        $course,
        $instructor,
        [
            'title' => 'Adaptive '.fake()->unique()->word(),
            'interaction_types' => ['knowledge', 'adaptive'],
            'adaptive_config' => ['min_questions' => 1, 'max_questions' => 3, 'target_se' => 0.3],
        ],
    );

    $question = QuizQuestion::factory()->create(['type' => QuizQuestionType::SINGLE_CHOICE]);
    $assessment->questions()->attach($question->id, ['position' => 1, 'points' => 10]);

    expect(fn () => app(\App\Domains\Instructor\Actions\Assessments\PublishAssessmentAction::class)->execute($assessment, $instructor))
        ->toThrow(LogicException::class, 'at least two calibrated questions');

    $question->update(['irt_a' => 1.0, 'irt_b' => 0.0, 'irt_c' => 0.2, 'is_calibrated' => true]);
    $second = QuizQuestion::factory()->create(['type' => QuizQuestionType::SINGLE_CHOICE]);
    $second->update(['irt_a' => 1.0, 'irt_b' => 1.0, 'irt_c' => 0.2, 'is_calibrated' => true]);
    $assessment->questions()->attach($second->id, ['position' => 2, 'points' => 10]);

    $published = app(\App\Domains\Instructor\Actions\Assessments\PublishAssessmentAction::class)->execute($assessment->fresh(), $instructor);

    expect($published->status->value)->toBe('published');
});
