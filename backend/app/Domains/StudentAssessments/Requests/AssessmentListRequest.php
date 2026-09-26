<?php

namespace App\Domains\StudentAssessments\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class AssessmentListRequest extends FormRequest
{
    public function authorize(): bool { return $this->user() !== null; }
    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string'],
            'course_id' => ['nullable', 'uuid'],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
