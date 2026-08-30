<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentResult;
use App\Models\Course;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Models\Enrollment;


uses(RefreshDatabase::class);

function assessmentAttemptsUrl(Assessment $assessment): string
{
    return "/api/v1/assessments/{$assessment->id}/attempts";
}
function assessmentAttemptSubmitUrl(
    Assessment $assessment,
    AssessmentAttempt $attempt,
): string {
    return "/api/v1/assessments/{$assessment->id}/attempts/{$attempt->id}/submit";
}

function assessmentAttemptUrl(
    Assessment $assessment,
    AssessmentAttempt $attempt,
): string {
    return "/api/v1/assessments/{$assessment->id}/attempts/{$attempt->id}";
}

function assessmentSubmitUrl(
    Assessment $assessment,
    AssessmentAttempt $attempt,
): string {
    return assessmentAttemptUrl($assessment, $attempt) . '/submit';
}

function assessmentResultUrl(
    Assessment $assessment,
    AssessmentAttempt $attempt,
): string {
    return assessmentAttemptUrl($assessment, $attempt) . '/result';
}

it('lists the authenticated user assessment attempts', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
    ]);

    AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 2,
    ]);

    AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => User::factory()->create()->id,
        'attempt_number' => 1,
    ]);



    $response = $this
        ->actingAs($user)
        ->getJson(assessmentAttemptsUrl($assessment));

    $response
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('starts an assessment attempt', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'required_quiz_score' => 0,
        'required_scenarios' => 0,
    ]);

    // The assessment must have no lessons, so eligibility passes.
    $response = $this
        ->actingAs($user)
        ->postJson(assessmentAttemptsUrl($assessment));

    $response
    ->assertCreated()
    ->assertJsonStructure([
        'data' => [
            'id',
            'assessment_id',
            'user_id',
            'attempt_number',
            'status',
            'score',
            'passed',
            'started_at',
            'submitted_at',
            'completed_at',
            'created_at',
            'updated_at',
        ],
    ]);
});
it('does not allow an attempt from another assessment to be submitted', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $otherAssessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $otherAssessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    $response = $this
    ->actingAs($user)
    ->postJson(
        assessmentAttemptSubmitUrl($assessment, $attempt),
        [
            'answers' => [
                [
                    'question_id' => (string) Str::uuid(),
                    'option_ids' => [
                        (string) Str::uuid(),
                    ],
                ],
            ],
        ]
    );

$response->assertNotFound();
});
it('validates assessment submission answers', function () {
    $user = User::factory()->create();

    $assessment = Assessment::factory()->create();

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    $url = assessmentAttemptSubmitUrl($assessment, $attempt);

    $this->actingAs($user)
        ->postJson($url, [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'answers',
        ]);
});

it('shows an assessment attempt belonging to the authenticated user', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
    ]);

    $response = $this
        ->actingAs($user)
        ->getJson(
            assessmentAttemptUrl($assessment, $attempt)
        );

    $response
        ->assertOk()
        ->assertJsonPath('data.id', $attempt->id)
        ->assertJsonPath('data.assessment_id', $assessment->id)
        ->assertJsonPath('data.user_id', $user->id);
});

it('does not allow a user to view another users attempt', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $owner->id,
    ]);

    $response = $this
        ->actingAs($otherUser)
        ->getJson(
            assessmentAttemptUrl($assessment, $attempt)
        );

    $response->assertNotFound();
});

it('does not allow an attempt from another assessment to be accessed', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $otherAssessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $otherAssessment->id,
        'user_id' => $user->id,
    ]);

    $response = $this
        ->actingAs($user)
        ->getJson(
            assessmentAttemptUrl($assessment, $attempt)
        );

    $response->assertNotFound();
});

it('submits an assessment attempt and returns the result', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    $enrollment = Enrollment::factory()->create([
    'user_id' => $user->id,
    'course_id' => $assessment->course_id,
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
        'points' => 100,
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson(
            assessmentSubmitUrl($assessment, $attempt),
            [
                'answers' => [
                    [
                        'question_id' => $question->id,
                        'option_ids' => [
                            $correctOption->id,
                        ],
                    ],
                ],
            ]
        );

    $response
        ->assertCreated()
        ->assertJsonPath('data.assessment_id', $assessment->id)
        ->assertJsonPath(
            'data.assessment_attempt_id',
            $attempt->id
        )
        ->assertJsonPath('data.score', '100.00')
        ->assertJsonPath('data.passed', true);

    expect(
        AssessmentResult::query()
            ->where('assessment_attempt_id', $attempt->id)
            ->count()
    )->toBe(1);
});

it('returns the final assessment result', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::PASSED,
        'score' => 85,
        'passed' => true,
    ]);

    $result = AssessmentResult::factory()->create([
        'assessment_id' => $assessment->id,
        'assessment_attempt_id' => $attempt->id,
        'user_id' => $user->id,
        'score' => 85,
        'passed' => true,
        'attempt_number' => 1,
    ]);

    $response = $this
        ->actingAs($user)
        ->getJson(
            assessmentResultUrl($assessment, $attempt)
        );

    $response
        ->assertOk()
        ->assertJsonPath('data.id', $result->id)
        ->assertJsonPath('data.score', '85.00')
        ->assertJsonPath('data.passed', true);
});

it('does not return a result for an in progress attempt', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    $response = $this
        ->actingAs($user)
        ->getJson(
            assessmentResultUrl($assessment, $attempt)
        );

    $response
        ->assertStatus(409);
});

it('requires authentication to access assessment attempts', function () {
    $course = Course::factory()->create();

    $assessment = Assessment::factory()->create([
        'course_id' => $course->id,
    ]);

    $response = $this->getJson(
        assessmentAttemptsUrl($assessment)
    );

    $response->assertUnauthorized();
});