<?php

namespace App\Http\Requests\Api\V1\Quizzes;

use Illuminate\Foundation\Http\FormRequest;

final class StartQuizAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [];
    }
}