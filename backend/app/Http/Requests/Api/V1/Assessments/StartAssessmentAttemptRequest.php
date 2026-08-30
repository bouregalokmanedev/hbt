<?php

namespace App\Http\Requests\Api\V1\Assessments;

use Illuminate\Foundation\Http\FormRequest;

final class StartAssessmentAttemptRequest extends FormRequest
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