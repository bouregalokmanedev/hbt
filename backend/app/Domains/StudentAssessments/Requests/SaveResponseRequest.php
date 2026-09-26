<?php

namespace App\Domains\StudentAssessments\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SaveResponseRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }

    public function rules(): array
    {
        return [
            'question_id' => ['required', 'uuid'],
            'answer' => ['nullable'],
            'selected_option_ids' => ['nullable', 'array'],
            'selected_option_ids.*' => ['uuid'],
            'selected_option_id' => ['nullable', 'uuid'],
            'value' => ['nullable'],
            'text' => ['nullable', 'string'],
            'ordered_ids' => ['nullable', 'array'],
            'ordered_ids.*' => ['uuid'],
            'matches' => ['nullable', 'array'],
            'answer_metadata' => ['nullable', 'array'],
            'confidence_level' => ['nullable', 'in:guessing,somewhat_confident,confident,very_confident'],
            'is_flagged' => ['nullable', 'boolean'],
            'time_spent_seconds' => ['nullable', 'integer', 'min:0'],
            'response_type' => ['nullable', 'string'],
        ];
    }
}
