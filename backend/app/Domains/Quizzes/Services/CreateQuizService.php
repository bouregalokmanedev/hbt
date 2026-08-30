<?php

namespace App\Domains\Quizzes\Services;

use App\Domains\Quizzes\Actions\CreateQuizAction;
use App\Domains\Quizzes\Actions\CreateQuizQuestionAction;
use App\Domains\Quizzes\Actions\CreateQuizQuestionOptionAction;
use App\Domains\Quizzes\DTOs\CreateQuizData;
use App\Domains\Quizzes\DTOs\CreateQuizQuestionData;
use App\Domains\Quizzes\DTOs\CreateQuizQuestionOptionData;
use App\Domains\Quizzes\Enums\QuizQuestionType;
use App\Domains\Quizzes\Models\Quiz;
use Illuminate\Support\Facades\DB;

final class CreateQuizService
{
    public function __construct(
        private CreateQuizAction $createQuizAction,
        private CreateQuizQuestionAction $createQuizQuestionAction,
        private CreateQuizQuestionOptionAction $createQuizQuestionOptionAction,
    ) {
    }

    /**
     * @param CreateQuizQuestionData[]|array[] $questions
     */
    public function execute(
        CreateQuizData $data,
        array $questions = [],
    ): Quiz {
        return DB::transaction(function () use ($data, $questions) {

            $quiz = $this->createQuizAction->execute($data);

            foreach ($questions as $questionData) {

                /*
                 * Support both DTOs and arrays.
                 *
                 * DTOs are the preferred format.
                 */
                if (is_array($questionData)) {
                    $questionData = new CreateQuizQuestionData(
                        quizId: $quiz->id,
                        question: $questionData['question'],
                        type: $questionData['type'] instanceof QuizQuestionType
                            ? $questionData['type']
                            : QuizQuestionType::from($questionData['type']),
                        position: (int) ($questionData['position'] ?? 1),
                        points: (int) ($questionData['points'] ?? 1),
                        required: (bool) ($questionData['required'] ?? true),
                        options: $questionData['options'] ?? [],
                    );
                }

                /*
                 * The quiz is the owner of the question.
                 * We don't need to trust the quizId supplied by
                 * external input.
                 */
                $questionData = new CreateQuizQuestionData(
                    quizId: $quiz->id,
                    question: $questionData->question,
                    type: $questionData->type,
                    position: $questionData->position,
                    points: $questionData->points,
                    required: $questionData->required,
                    options: $questionData->options,
                );

                $question = $this->createQuizQuestionAction->execute(
                    $quiz,
                    $questionData,
                );

                foreach ($questionData->options as $optionData) {

                    if (is_array($optionData)) {
                        $optionData = new CreateQuizQuestionOptionData(
                            questionId: $question->id,
                            option: $optionData['option'],
                            isCorrect: (bool) ($optionData['is_correct'] ?? false),
                            position: (int) ($optionData['position'] ?? 1),
                        );
                    }

                    $optionData = new CreateQuizQuestionOptionData(
                        questionId: $question->id,
                        option: $optionData->option,
                        isCorrect: $optionData->isCorrect,
                        position: $optionData->position,
                    );

                    $this->createQuizQuestionOptionAction->execute(
    $optionData,
    $question,
);
                }
            }

            return $quiz->load([
                'questions.options',
            ]);
        });
    }
}