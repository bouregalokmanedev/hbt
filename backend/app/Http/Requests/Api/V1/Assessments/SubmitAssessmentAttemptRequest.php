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
            'sometimes',
            'array',
        ],

        'answers.*.option_ids.*' => [
            'uuid',
        ],

        'answers.*.selected_option_ids' => [
            'sometimes',
            'array',
        ],

        'answers.*.selected_option_ids.*' => [
            'uuid',
        ],

        // Text, numeric, ordering and matching payloads.
        'answers.*.answer' => ['sometimes', 'nullable'],
        'answers.*.value' => ['sometimes', 'nullable'],
        'answers.*.text' => ['sometimes', 'nullable', 'string'],
        'answers.*.ordered_ids' => ['sometimes', 'array'],
        'answers.*.ordered_ids.*' => ['uuid'],
        'answers.*.matches' => ['sometimes', 'array'],
        'answers.*.confidence_level' => ['sometimes', 'nullable', 'string', 'max:32'],
    ];
}
}