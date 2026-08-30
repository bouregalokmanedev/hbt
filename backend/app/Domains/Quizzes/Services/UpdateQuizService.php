<?php

namespace App\Domains\Quizzes\Services;

use App\Domains\Quizzes\Actions\UpdateQuizAction;
use App\Domains\Quizzes\Models\Quiz;
use Illuminate\Support\Facades\DB;
use App\Domains\Quizzes\DTOs\UpdateQuizData;

final class UpdateQuizService
{
    public function __construct(
        private UpdateQuizAction $updateQuizAction,
    ) {
    }

    public function execute(
        Quiz $quiz,
        array $data,
    ): Quiz {
        return DB::transaction(function () use ($quiz, $data) {

            /*
             * 1. Update quiz information
             */
            $quizData = collect($data)->except('questions')->toArray();

            if (! empty($quizData)) {
                $quiz = $this->updateQuizAction->execute(
    $quiz,
    UpdateQuizData::fromArray($quizData)
);
            }

            /*
             * 2. Synchronize questions
             */
            if (array_key_exists('questions', $data)) {
                $questions = $data['questions'];

                $existingQuestionIds = collect($questions)
                    ->pluck('id')
                    ->filter()
                    ->values();

                // Remove questions that are no longer in payload.
                $quiz->questions()
                    ->when(
                        $existingQuestionIds->isNotEmpty(),
                        fn ($query) => $query->whereNotIn('id', $existingQuestionIds)
                    )
                    ->when(
                        $existingQuestionIds->isEmpty(),
                        fn ($query) => $query
                    )
                    ->delete();

                foreach ($questions as $questionData) {
                    $questionId = $questionData['id'] ?? null;

                    if ($questionId) {
                        $question = $quiz->questions()->findOrFail($questionId);

                        $question->update([
                            'question' => $questionData['question'],
                            'type' => $questionData['type'],
                            'position' => $questionData['position'] ?? 1,
                            'points' => $questionData['points'] ?? 1,
                            'required' => $questionData['required'] ?? true,
                        ]);
                    } else {
                        $question = $quiz->questions()->create([
                            'question' => $questionData['question'],
                            'type' => $questionData['type'],
                            'position' => $questionData['position'] ?? 1,
                            'points' => $questionData['points'] ?? 1,
                            'required' => $questionData['required'] ?? true,
                        ]);
                    }

                    /*
                     * 3. Synchronize options
                     */
                    if (array_key_exists('options', $questionData)) {
                        $options = $questionData['options'];

                        $existingOptionIds = collect($options)
                            ->pluck('id')
                            ->filter()
                            ->values();

                        $question->options()
                            ->when(
                                $existingOptionIds->isNotEmpty(),
                                fn ($query) => $query->whereNotIn(
                                    'id',
                                    $existingOptionIds
                                )
                            )
                            ->when(
                                $existingOptionIds->isEmpty(),
                                fn ($query) => $query
                            )
                            ->delete();

                        foreach ($options as $optionData) {
                            $optionId = $optionData['id'] ?? null;

                            if ($optionId) {
                                $option = $question->options()
                                    ->findOrFail($optionId);

                                $option->update([
                                    'option' => $optionData['option'],
                                    'is_correct' => $optionData['is_correct'] ?? false,
                                    'position' => $optionData['position'] ?? 1,
                                ]);
                            } else {
                                $question->options()->create([
                                    'option' => $optionData['option'],
                                    'is_correct' => $optionData['is_correct'] ?? false,
                                    'position' => $optionData['position'] ?? 1,
                                ]);
                            }
                        }
                    }
                }
            }

            $quiz->load([
    'questions' => fn ($query) => $query->orderBy('position'),
    'questions.options' => fn ($query) => $query->orderBy('position'),
]);

return $quiz;
        });
    }
    
}