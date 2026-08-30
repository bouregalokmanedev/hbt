<?php

namespace App\Domains\Quizzes\Services;

use App\Domains\Quizzes\Actions\PublishQuizAction;
use App\Domains\Quizzes\Models\Quiz;

final class PublishQuizService
{
    public function __construct(
        private PublishQuizAction $publishQuizAction,
    ) {
    }

    public function execute(Quiz $quiz): Quiz
    {
        $quiz->load('questions.options');

        $this->validateQuiz($quiz);

        $this->publishQuizAction->execute($quiz);

        return $quiz->fresh('questions.options');
    }

   private function validateQuiz(Quiz $quiz): void
{
    if ($quiz->status->value === 'published') {
        throw new \RuntimeException(
            'Quiz is already published.'
        );
    }

    if ($quiz->questions->isEmpty()) {
        throw new \RuntimeException(
            'A quiz must contain at least one question.'
        );
    }

    foreach ($quiz->questions as $question) {
        if ($question->options->isEmpty()) {
            throw new \RuntimeException(
                'Every quiz question must contain at least one option.'
            );
        }

        if (
            $question->options
                ->where('is_correct', true)
                ->isEmpty()
        ) {
            throw new \RuntimeException(
                'Every choice question must contain at least one correct option.'
            );
        }
    }
    }
}