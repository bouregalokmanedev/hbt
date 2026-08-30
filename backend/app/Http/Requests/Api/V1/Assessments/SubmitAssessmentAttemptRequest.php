<?php

namespace App\Http\Requests\Api\V1\Assessments;

use Illuminate\Foundation\Http\FormRequest;

final class SubmitAssessmentAttemptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

   public function rules(): array
{
    return [
        'answers' => [
            'required',
            'array',
            'min:1',
        ],

        'answers.*.question_id' => [
            'required',
            'uuid',
        ],

        'answers.*.option_ids' => [
            'required',
            'array',
        ],

        'answers.*.option_ids.*' => [
            'required',
            'uuid',
        ],
    ];
}
}