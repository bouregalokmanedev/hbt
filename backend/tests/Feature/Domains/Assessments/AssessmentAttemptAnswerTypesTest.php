<?php

use App\Domains\Assessments\Enums\AssessmentAttemptStatus;
use App\Domains\Assessments\Models\Assessment;
use App\Domains\Assessments\Models\AssessmentAttempt;
use App\Domains\Assessments\Models\AssessmentQuestion;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function typedAssessmentQuestion(
    Assessment $assessment,
    QuizQuestionType $type,
    array $attributes = [],
    int $position = 1,
    int $points = 10,
): QuizQuestion {
    $question = QuizQuestion::factory()->create(array_merge([
        'type' => $type,
        'points' => $points,
        'required' => true,
    ], $attributes));

    AssessmentQuestion::factory()->create([
        'assessment_id' => $assessment->id,
        'quiz_question_id' => $question->id,
        'position' => $position,
        'points' => $points,
    ]);

    return $question;
}

/**
 * @return array{0: User, 1: Assessment, 2: AssessmentAttempt}
 */
function typedAttemptContext(): array
{
    $user = User::factory()->create();
    $assessment = Assessment::factory()->create([
        'status' => 'published',
        'published_at' => now(),
        'minimum_score' => 70,
    ]);

    $attempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $assessment->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    return [$user, $assessment, $attempt];
}

function typedAnswerUrl(
    Assessment $assessment,
    AssessmentAttempt $attempt,
    string $questionId,
): string {
    return "/api/v1/assessments/{$assessment->id}/attempts/{$attempt->id}/answers/{$questionId}";
}

function typedSubmitUrl(Assessment $assessment, AssessmentAttempt $attempt): string
{
    return "/api/v1/assessments/{$assessment->id}/attempts/{$attempt->id}/submit";
}

it('autosaves and hydrates every supported answer type', function () {
    [$user, $assessment, $attempt] = typedAttemptContext();

    $single = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::SINGLE_CHOICE,
        position: 1,
    );
    $singleCorrect = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $single->id,
        'is_correct' => true,
        'position' => 1,
    ]);
    QuizQuestionOption::factory()->create([
        'quiz_question_id' => $single->id,
        'is_correct' => false,
        'position' => 2,
    ]);

    $short = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::SHORT_ANSWER,
        ['answer_key' => ['accepted' => ['OBD-II'], 'case_sensitive' => false]],
        position: 2,
    );

    $numeric = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::NUMERIC,
        ['answer_key' => ['value' => 12.5, 'tolerance' => 0.1]],
        position: 3,
    );

    $ordering = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::ORDERING,
        position: 4,
    );
    $orderedOptions = collect(range(1, 3))
        ->map(fn (int $position) => QuizQuestionOption::factory()->create([
            'quiz_question_id' => $ordering->id,
            'is_correct' => false,
            'position' => $position,
        ]))
        ->values();
    $orderedIds = [$orderedOptions[1]->id, $orderedOptions[0]->id, $orderedOptions[2]->id];
    $ordering->update(['answer_key' => ['ordered_option_ids' => $orderedIds]]);

    $matching = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::MATCHING,
        [
            'answer_key' => [
                'pairs' => [
                    'Battery' => '12 V supply',
                    'Fuse' => 'Overcurrent protection',
                ],
            ],
        ],
        position: 5,
    );

    $matches = [
        'Battery' => '12 V supply',
        'Fuse' => 'Overcurrent protection',
    ];

    $this->actingAs($user)
        ->putJson(typedAnswerUrl($assessment, $attempt, $single->id), [
            'option_ids' => [$singleCorrect->id],
            'confidence_level' => 'confident',
        ])
        ->assertOk()
        ->assertJsonPath('data.saved', true);

    $this->actingAs($user)
        ->putJson(typedAnswerUrl($assessment, $attempt, $short->id), [
            'value' => ' obd-ii ',
            'confidence_level' => 'somewhat_confident',
        ])
        ->assertOk();

    $this->actingAs($user)
        ->putJson(typedAnswerUrl($assessment, $attempt, $numeric->id), [
            'value' => 12.55,
        ])
        ->assertOk();

    $this->actingAs($user)
        ->putJson(typedAnswerUrl($assessment, $attempt, $ordering->id), [
            'ordered_ids' => $orderedIds,
        ])
        ->assertOk();

    $this->actingAs($user)
        ->putJson(typedAnswerUrl($assessment, $attempt, $matching->id), [
            'matches' => $matches,
        ])
        ->assertOk();

    $payload = $this->actingAs($user)
        ->getJson("/api/v1/assessments/{$assessment->id}/attempts/{$attempt->id}")
        ->assertOk()
        ->assertJsonCount(5, 'data.answers')
        ->json('data');

    $answers = collect($payload['answers'])->keyBy('question_id');

    expect($answers[$single->id]['selected_option_ids'])->toBe([$singleCorrect->id])
        ->and($answers[$single->id]['confidence_level'])->toBe('confident')
        ->and($answers[$short->id]['answer']['value'])->toBe('obd-ii')
        ->and($answers[$short->id]['confidence_level'])->toBe('somewhat_confident')
        ->and((float) $answers[$numeric->id]['answer']['value'])->toBe(12.55)
        ->and($answers[$ordering->id]['answer']['ordered_ids'])->toBe($orderedIds)
        ->and($answers[$matching->id]['answer']['matches'])->toBe($matches);

    $questions = collect($payload['assessment']['questions'])->keyBy('id');

    $orderingOptions = collect($questions[$ordering->id]['options'])->pluck('id')->all();
    sort($orderingOptions);
    $expectedOrderingOptions = $orderedOptions->pluck('id')->all();
    sort($expectedOrderingOptions);

    expect($questions[$ordering->id]['type'])->toBe('ordering')
        ->and($questions[$ordering->id]['points'])->toBe(10)
        ->and($questions[$ordering->id]['required'])->toBeTrue()
        ->and($orderingOptions)->toBe($expectedOrderingOptions)
        ->and($questions[$matching->id]['type'])->toBe('matching')
        ->and($questions[$matching->id]['matching']['left'])->toContain('Battery', 'Fuse')
        ->and($questions[$matching->id]['matching']['right'])->toContain('12 V supply', 'Overcurrent protection')
        ->and($questions[$matching->id])->not->toHaveKey('answer_key');

    // The same typed payload scores correctly when submitted.
    $this->actingAs($user)
        ->postJson(typedSubmitUrl($assessment, $attempt), [
            'answers' => [
                ['question_id' => $single->id, 'option_ids' => [$singleCorrect->id]],
                ['question_id' => $short->id, 'value' => 'OBD-II'],
                ['question_id' => $numeric->id, 'value' => 12.55],
                ['question_id' => $ordering->id, 'ordered_ids' => $orderedIds],
                ['question_id' => $matching->id, 'matches' => $matches],
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('data.score', '100.00')
        ->assertJsonPath('data.passed', true);
});

it('rejects malformed structured answers during autosave', function () {
    [$user, $assessment, $attempt] = typedAttemptContext();

    $ordering = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::ORDERING,
        position: 1,
    );
    $options = collect(range(1, 3))
        ->map(fn (int $position) => QuizQuestionOption::factory()->create([
            'quiz_question_id' => $ordering->id,
            'is_correct' => false,
            'position' => $position,
        ]))
        ->values();

    $matching = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::MATCHING,
        ['answer_key' => ['pairs' => ['Battery' => '12 V supply']]],
        position: 2,
    );

    $numeric = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::NUMERIC,
        ['answer_key' => ['value' => 5]],
        position: 3,
    );

    $this->actingAs($user)
        ->putJson(typedAnswerUrl($assessment, $attempt, $ordering->id), [
            'ordered_ids' => [$options[0]->id, $options[1]->id],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('answer');

    $this->actingAs($user)
        ->putJson(typedAnswerUrl($assessment, $attempt, $matching->id), [
            'matches' => ['Unknown prompt' => '12 V supply'],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('answer');

    $this->actingAs($user)
        ->putJson(typedAnswerUrl($assessment, $attempt, $numeric->id), [
            'value' => 'not-a-number',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('answer');
});

it('requires non-blank answers to every required question before submission', function () {
    [$user, $assessment, $attempt] = typedAttemptContext();

    $choice = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::SINGLE_CHOICE,
        position: 1,
        points: 50,
    );
    $correct = QuizQuestionOption::factory()->create([
        'quiz_question_id' => $choice->id,
        'is_correct' => true,
        'position' => 1,
    ]);

    $text = typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::SHORT_ANSWER,
        ['answer_key' => ['accepted' => ['OBD-II'], 'case_sensitive' => false]],
        position: 2,
        points: 50,
    );

    typedAssessmentQuestion(
        $assessment,
        QuizQuestionType::SHORT_ANSWER,
        [
            'answer_key' => ['accepted' => ['optional']],
            'required' => false,
        ],
        position: 3,
        points: 1,
    );

    $this->actingAs($user)
        ->postJson(typedSubmitUrl($assessment, $attempt), [
            'answers' => [
                ['question_id' => $choice->id, 'option_ids' => [$correct->id]],
                ['question_id' => $text->id, 'value' => '   '],
            ],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('answers');

    $this->actingAs($user)
        ->postJson(typedSubmitUrl($assessment, $attempt), [
            'answers' => [
                ['question_id' => $choice->id, 'option_ids' => [$correct->id]],
            ],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('answers');

    $this->actingAs($user)
        ->postJson(typedSubmitUrl($assessment, $attempt), [
            'answers' => [
                ['question_id' => $choice->id, 'option_ids' => [$correct->id]],
                ['question_id' => $text->id, 'value' => 'OBD-II'],
            ],
        ])
        ->assertCreated()
        ->assertJsonPath('data.passed', true);
});

it('returns truthful attempt history for the assessment catalogue', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published']);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'status' => 'active',
    ]);

    $onCooldown = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'published_at' => now()->subDay(),
        'max_attempts' => 3,
        'minimum_score' => 70,
        'time_limit_minutes' => 45,
    ]);

    AssessmentAttempt::factory()->create([
        'assessment_id' => $onCooldown->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::PASSED,
        'score' => 85,
        'passed' => true,
        'completed_at' => now()->subDays(2),
    ]);

    $expiredAttempt = AssessmentAttempt::factory()->create([
        'assessment_id' => $onCooldown->id,
        'user_id' => $user->id,
        'attempt_number' => 2,
        'status' => AssessmentAttemptStatus::EXPIRED,
        'score' => 0,
        'passed' => false,
        'timed_out_at' => now()->subHour(),
    ]);

    $resumable = Assessment::factory()->create([
        'course_id' => $course->id,
        'status' => 'published',
        'published_at' => now(),
        'max_attempts' => 3,
    ]);

    $inProgress = AssessmentAttempt::factory()->create([
        'assessment_id' => $resumable->id,
        'user_id' => $user->id,
        'attempt_number' => 1,
        'status' => AssessmentAttemptStatus::IN_PROGRESS,
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/v1/assessments')
        ->assertOk();

    $items = collect($response->json('data'));
    $cooldownItem = $items->firstWhere('id', $onCooldown->id);
    $resumableItem = $items->firstWhere('id', $resumable->id);

    expect($cooldownItem)->not->toBeNull()
        ->and($cooldownItem['time_limit_minutes'])->toBe(45)
        ->and($cooldownItem['attempt_history']['attempts_count'])->toBe(2)
        ->and((float) $cooldownItem['attempt_history']['best_score'])->toBe(85.0)
        ->and($cooldownItem['attempt_history']['passed'])->toBeTrue()
        ->and($cooldownItem['attempt_history']['remaining_attempts'])->toBe(1)
        ->and($cooldownItem['attempt_history']['in_progress_attempt_id'])->toBeNull()
        ->and($cooldownItem['attempt_history']['cooldown_until'])->not->toBeNull()
        ->and($cooldownItem['attempt_history']['can_start'])->toBeFalse()
        ->and($cooldownItem['attempt_history']['latest']['id'])->toBe($expiredAttempt->id);

    expect($resumableItem)->not->toBeNull()
        ->and($resumableItem['attempt_history']['attempts_count'])->toBe(1)
        ->and($resumableItem['attempt_history']['in_progress_attempt_id'])->toBe($inProgress->id)
        ->and($resumableItem['attempt_history']['can_start'])->toBeTrue()
        ->and($resumableItem['attempt_history']['latest']['status'])->toBe('in_progress');
});
