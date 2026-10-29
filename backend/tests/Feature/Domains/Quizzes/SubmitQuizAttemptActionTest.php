<?php

namespace Tests\Feature\Domains\Quizzes;

use App\Domains\Quizzes\Actions\SubmitQuizAttemptAction;
use App\Domains\Quizzes\DTOs\SubmitQuizAttemptData;
use App\Domains\Quizzes\Enums\QuizAttemptStatus;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\Quiz;
use App\Domains\Quizzes\Models\QuizAttempt;
use App\Domains\Quizzes\Models\QuizAttemptAnswer;
use App\Domains\Quizzes\Models\QuizAttemptAnswerOption;
use App\Domains\Quizzes\Models\QuizQuestion;
use App\Domains\Quizzes\Models\QuizQuestionOption;
use App\Domains\Progression\Models\StudentXpTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class SubmitQuizAttemptActionTest extends TestCase
{
    use RefreshDatabase;

    private SubmitQuizAttemptAction $action;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->action = app(SubmitQuizAttemptAction::class);

        $this->user = User::factory()->create();
    }

    public function test_single_choice_answer_is_scored_correctly(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 2,
            'position' => 1,
        ]);

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

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$correct->id],
            ]),
        );

        $this->assertSame(2, $result->score);
        $this->assertSame(2, $result->total_points);
        $this->assertSame(100, $result->percentage);
        $this->assertTrue($result->passed);
        $this->assertSame(
            QuizAttemptStatus::SUBMITTED,
            $result->status
        );
    }

    public function test_single_choice_incorrect_answer_scores_zero(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 2,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $wrong = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => false,
            'position' => 2,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$wrong->id],
            ]),
        );

        $this->assertSame(0, $result->score);
        $this->assertSame(2, $result->total_points);
        $this->assertSame(0, $result->percentage);
        $this->assertFalse($result->passed);
        $this->assertSame(
            QuizAttemptStatus::SUBMITTED,
            $result->status
        );
    }

    public function test_multiple_choice_all_correct_answers_are_scored(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::MULTIPLE_CHOICE,
            'points' => 4,
            'position' => 1,
        ]);

        $correctA = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $correctB = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 2,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => false,
            'position' => 3,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [
                    $correctA->id,
                    $correctB->id,
                ],
            ]),
        );

        $this->assertSame(4, $result->score);
        $this->assertSame(4, $result->total_points);
        $this->assertSame(100, $result->percentage);
        $this->assertTrue($result->passed);
    }

    public function test_multiple_choice_missing_correct_answer_scores_zero(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::MULTIPLE_CHOICE,
            'points' => 4,
            'position' => 1,
        ]);

        $correctA = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 2,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$correctA->id],
            ]),
        );

        $this->assertSame(0, $result->score);
        $this->assertSame(4, $result->total_points);
        $this->assertSame(0, $result->percentage);
        $this->assertFalse($result->passed);
    }

    public function test_multiple_choice_with_extra_incorrect_answer_scores_zero(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::MULTIPLE_CHOICE,
            'points' => 4,
            'position' => 1,
        ]);

        $correctA = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $correctB = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 2,
        ]);

        $incorrect = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => false,
            'position' => 3,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [
                    $correctA->id,
                    $correctB->id,
                    $incorrect->id,
                ],
            ]),
        );

        $this->assertSame(0, $result->score);
        $this->assertSame(4, $result->total_points);
        $this->assertSame(0, $result->percentage);
        $this->assertFalse($result->passed);
    }

    public function test_required_question_without_answer_is_rejected(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 2,
            'required' => true,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            "Question {$question->id} is required."
        );

        $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([]),
        );
    }

    public function test_optional_question_without_answer_is_allowed(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 2,
            'required' => false,
            'position' => 1,
        ]);

        QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([]),
        );

        $this->assertSame(0, $result->score);
        $this->assertSame(2, $result->total_points);
        $this->assertSame(0, $result->percentage);
        $this->assertFalse($result->passed);

        $this->assertSame(
            QuizAttemptStatus::SUBMITTED,
            $result->status
        );
    }

    public function test_percentage_is_calculated_from_points(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question1 = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 2,
            'required' => true,
            'position' => 1,
        ]);

        $correct1 = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question1->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $question2 = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 3,
            'required' => true,
            'position' => 2,
        ]);

        $correct2 = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question2->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $question3 = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 5,
            'required' => true,
            'position' => 3,
        ]);

        $wrong3 = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question3->id,
            'is_correct' => false,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question1->id => [$correct1->id],
                $question2->id => [$correct2->id],
                $question3->id => [$wrong3->id],
            ]),
        );

        $this->assertSame(5, $result->score);
        $this->assertSame(10, $result->total_points);
        $this->assertSame(50, $result->percentage);
        $this->assertFalse($result->passed);
        $this->assertSame(
            QuizAttemptStatus::SUBMITTED,
            $result->status
        );
    }

    public function test_exact_pass_percentage_is_passed(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 7,
            'required' => true,
            'position' => 1,
        ]);

        $correct = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $secondQuestion = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 3,
            'required' => true,
            'position' => 2,
        ]);

        $wrong = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $secondQuestion->id,
            'is_correct' => false,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$correct->id],
                $secondQuestion->id => [$wrong->id],
            ]),
        );

        $this->assertSame(7, $result->score);
        $this->assertSame(10, $result->total_points);
        $this->assertSame(70, $result->percentage);
        $this->assertTrue($result->passed);
        $this->assertSame(
            QuizAttemptStatus::SUBMITTED,
            $result->status
        );
    }

    public function test_already_submitted_attempt_cannot_be_submitted_again(): void
    {
        $quiz = Quiz::factory()->create();

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $option = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->submitted()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
            'score' => 10,
            'total_points' => 10,
            'percentage' => 100,
            'passed' => true,
        ]);

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'This quiz attempt has already been submitted.'
        );

        $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$option->id],
            ]),
        );
    }

    public function test_expired_attempt_cannot_be_submitted(): void
    {
        $quiz = Quiz::factory()->create([
            'time_limit' => 30,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $correctOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
            'started_at' => now()->subMinutes(31),
        ]);

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'This quiz attempt has expired.'
        );

        $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$correctOption->id],
            ]),
        );
    }

    public function test_expired_attempt_is_marked_as_expired(): void
    {
        $quiz = Quiz::factory()->create([
            'time_limit' => 30,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
            'started_at' => now()->subMinutes(31),
        ]);

        try {
            $this->action->execute(
                $attempt,
                new SubmitQuizAttemptData([])
            );
        } catch (RuntimeException $exception) {
            // Expected.
        }

        $attempt->refresh();

        $this->assertSame(
            QuizAttemptStatus::EXPIRED,
            $attempt->status
        );
    }

    public function test_single_choice_answer_is_persisted(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 2,
            'required' => true,
            'position' => 1,
        ]);

        $correct = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$correct->id],
            ]),
        );

        $this->assertDatabaseHas('quiz_attempt_answers', [
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'is_correct' => true,
            'points_earned' => 2,
        ]);

        $answer = $result->answers()
            ->where('question_id', $question->id)
            ->first();

        $this->assertNotNull($answer);

        $this->assertDatabaseHas(
            'quiz_attempt_answer_options',
            [
                'answer_id' => $answer->id,
                'option_id' => $correct->id,
            ]
        );
    }

    public function test_multiple_choice_selected_options_are_persisted(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::MULTIPLE_CHOICE,
            'points' => 4,
            'required' => true,
            'position' => 1,
        ]);

        $correctA = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $correctB = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 2,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [
                    $correctA->id,
                    $correctB->id,
                ],
            ]),
        );

        $answer = $result->answers()
            ->where('question_id', $question->id)
            ->first();

        $this->assertNotNull($answer);

        $this->assertDatabaseHas(
            'quiz_attempt_answer_options',
            [
                'answer_id' => $answer->id,
                'option_id' => $correctA->id,
            ]
        );

        $this->assertDatabaseHas(
            'quiz_attempt_answer_options',
            [
                'answer_id' => $answer->id,
                'option_id' => $correctB->id,
            ]
        );
    }

    public function test_option_from_another_question_cannot_be_submitted(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $otherQuestion = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 2,
        ]);

        $foreignOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $otherQuestion->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $this->assertNotSame(
            $question->id,
            $foreignOption->quiz_question_id
        );

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'Invalid option submitted for question.'
        );

        $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$foreignOption->id],
            ]),
        );
    }

    public function test_option_from_another_quiz_cannot_be_submitted(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $otherQuiz = Quiz::factory()->create();

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $otherQuestion = QuizQuestion::factory()->create([
            'quiz_id' => $otherQuiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $foreignOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $otherQuestion->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $this->assertNotSame(
            $quiz->id,
            $otherQuiz->id
        );

        $this->assertNotSame(
            $question->id,
            $foreignOption->quiz_question_id
        );

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'Invalid option submitted for question.'
        );

        $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$foreignOption->id],
            ]),
        );
    }

    public function test_duplicate_selected_option_is_rejected(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $option = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $this->expectException(RuntimeException::class);

        $this->expectExceptionMessage(
            'Duplicate options are not allowed.'
        );

        $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [
                    $option->id,
                    $option->id,
                ],
            ]),
        );
    }

    public function test_zero_point_quiz_has_zero_percentage_and_fails(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([]),
        );

        $this->assertSame(0, $result->score);
        $this->assertSame(0, $result->total_points);
        $this->assertSame(0, $result->percentage);
        $this->assertFalse($result->passed);

        $this->assertSame(
            QuizAttemptStatus::SUBMITTED,
            $result->status
        );
    }

    public function test_submitting_twice_does_not_create_duplicate_answers(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $option = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
        ]);

        $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$option->id],
            ]),
        );

        $this->assertDatabaseCount(
            'quiz_attempt_answers',
            1
        );

        $this->assertDatabaseCount(
            'quiz_attempt_answer_options',
            1
        );

        $this->expectException(RuntimeException::class);

        $this->action->execute(
            $attempt->fresh(),
            new SubmitQuizAttemptData([
                $question->id => [$option->id],
            ]),
        );

        $this->assertDatabaseCount(
            'quiz_attempt_answers',
            1
        );

        $this->assertDatabaseCount(
            'quiz_attempt_answer_options',
            1
        );
    }

    public function test_autosaved_drafts_are_replaced_by_graded_rows(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $correctOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $wrongOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => false,
            'position' => 2,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
        ]);

        // A draft saved for the wrong option while the attempt was running.
        $draft = QuizAttemptAnswer::create([
            'attempt_id' => $attempt->id,
            'question_id' => $question->id,
            'is_correct' => null,
            'points_earned' => null,
        ]);

        QuizAttemptAnswerOption::create([
            'answer_id' => $draft->id,
            'option_id' => $wrongOption->id,
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$correctOption->id],
            ]),
        );

        $this->assertDatabaseCount('quiz_attempt_answers', 1);
        $this->assertDatabaseCount('quiz_attempt_answer_options', 1);

        $graded = QuizAttemptAnswer::query()
            ->where('attempt_id', $attempt->id)
            ->first();

        $this->assertTrue((bool) $graded->is_correct);
        $this->assertSame(10, $graded->points_earned);
        $this->assertSame(
            [$correctOption->id],
            $graded->selectedOptions()->pluck('option_id')->all()
        );

        $this->assertSame(10, $result->score);
        $this->assertTrue($result->passed);
    }

    public function test_submit_succeeds_inside_the_expiry_grace_window(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
            'time_limit' => 10,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $correctOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
            'started_at' => now()->subMinutes(10),
            'expires_at' => now()->subSeconds(5),
        ]);

        $result = $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$correctOption->id],
            ]),
        );

        $this->assertSame(
            QuizAttemptStatus::SUBMITTED,
            $result->status
        );
    }

    public function test_submit_fails_after_the_expiry_grace_window(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
            'time_limit' => 10,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $correctOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
            'started_at' => now()->subMinutes(10),
            'expires_at' => now()->subSeconds(60),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('This quiz attempt has expired.');

        $this->action->execute(
            $attempt,
            new SubmitQuizAttemptData([
                $question->id => [$correctOption->id],
            ]),
        );
    }

    public function test_duplicate_submission_grades_once_and_awards_xp_once(): void
    {
        $quiz = Quiz::factory()->create([
            'pass_percentage' => 70,
        ]);

        $question = QuizQuestion::factory()->create([
            'quiz_id' => $quiz->id,
            'type' => QuizQuestionType::SINGLE_CHOICE,
            'points' => 10,
            'required' => true,
            'position' => 1,
        ]);

        $correctOption = QuizQuestionOption::factory()->create([
            'quiz_question_id' => $question->id,
            'is_correct' => true,
            'position' => 1,
        ]);

        $attempt = QuizAttempt::factory()->create([
            'quiz_id' => $quiz->id,
            'user_id' => $this->user->id,
            'status' => QuizAttemptStatus::IN_PROGRESS,
        ]);

        $answers = new SubmitQuizAttemptData([
            $question->id => [$correctOption->id],
        ]);

        $first = $this->action->execute($attempt, $answers);

        $this->assertSame(QuizAttemptStatus::SUBMITTED, $first->status);

        /*
         * The second request still holds the pre-submission model, exactly
         * like a double-click whose first response has not reached the
         * browser yet. It must be rejected instead of regrading.
         */
        try {
            $this->action->execute($attempt, $answers);
            $this->fail('A duplicate submission must be rejected.');
        } catch (RuntimeException $exception) {
            $this->assertSame(
                'This quiz attempt has already been submitted.',
                $exception->getMessage(),
            );
        }

        $this->assertSame(
            1,
            QuizAttemptAnswer::query()
                ->where('attempt_id', $attempt->id)
                ->count(),
        );

        $this->assertSame(
            1,
            QuizAttemptAnswerOption::query()
                ->whereHas(
                    'answer',
                    fn ($query) => $query->where('attempt_id', $attempt->id),
                )
                ->count(),
        );

        // XP is awarded by a dedupe key, so even a replayed submission can
        // never farm additional points.
        $this->assertSame(
            1,
            StudentXpTransaction::query()
                ->where('user_id', $this->user->id)
                ->where('event', 'quiz_passed')
                ->count(),
        );
    }
}
