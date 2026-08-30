<?php

namespace App\Http\Requests\Api\V1\Quizzes;

use App\Domains\Quizzes\Models\QuizAttempt;
use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class SubmitQuizAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        $attempt = $this->route('attempt');

        if ($attempt instanceof QuizAttempt) {
            if ($attempt->user_id !== $this->user()->id) {
                throw new NotFoundHttpException(
                    'Quiz attempt not found.'
                );
            }

            return true;
        }

        if ($attempt !== null) {
            $ownsAttempt = QuizAttempt::query()
                ->whereKey($attempt)
                ->where('user_id', $this->user()->id)
                ->exists();

            if (! $ownsAttempt) {
                throw new NotFoundHttpException(
                    'Quiz attempt not found.'
                );
            }

            return true;
        }

        return false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'answers' => [
                'required',
                'array',
            ],

            'answers.*' => [
                'array',
            ],

            'answers.*.*' => [
                'uuid',
            ],
        ];
    }
}