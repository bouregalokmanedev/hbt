<?php

namespace App\Domains\StudentAssessments\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SubmitAssessmentRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }
    public function rules(): array
    {
        return [
            'answers' => ['nullable', 'array'],
            'answers.*.question_id' => ['required_with:answers', 'uuid'],
            'answers.*.option_ids' => ['nullable', 'array'],
            'answers.*.option_ids.*' => ['uuid'],
            'answers.*.selected_option_ids' => ['nullable', 'array'],
            'answers.*.selected_option_ids.*' => ['uuid'],
            'answers.*.selected_option_id' => ['nullable', 'uuid'],
            'answers.*.value' => ['nullable'],
            'answers.*.ordered_ids' => ['nullable', 'array'],
            'answers.*.matches' => ['nullable', 'array'],
            'answers.*.confidence_level' => ['nullable', 'in:guessing,somewhat_confident,confident,very_confident'],
        ];
    }
}
