<?php

namespace App\Domains\StudentAssessments\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class AssessmentHistoryRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }
    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
